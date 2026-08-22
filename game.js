/* ============================================
   DEEPCOMMIT — Super Advanced ASCII Roguelike
   v0.2.0  |  Pure Vanilla JS  |  No dependencies
   ============================================ */

(() => {
  "use strict";

  // ====================== CONSTANTS ======================
  const TILE = {
    WALL: "#",
    FLOOR: ".",
    STAIRS: ">",
    PLAYER: "@",
    BUG: "g",
    MERGE: "M",
    LEAK: "L",
    NULL: "N",
    LOOP: "∞",
    COMMIT: "$",
    STAR: "★",
    COFFEE: "☕",
    KEYBOARD: "⌨",
  };

  const COLORS = {
    [TILE.WALL]: "#00aa2a",
    [TILE.FLOOR]: "#1a3a1a",
    [TILE.STAIRS]: "#00e5ff",
    [TILE.PLAYER]: "#ffffff",
    [TILE.BUG]: "#ff3333",
    [TILE.MERGE]: "#ff8800",
    [TILE.LEAK]: "#cc00ff",
    [TILE.NULL]: "#ff0055",
    [TILE.LOOP]: "#00ffcc",
    [TILE.COMMIT]: "#ffcc00",
    [TILE.STAR]: "#ffff00",
    [TILE.COFFEE]: "#c4a35a",
    [TILE.KEYBOARD]: "#88aaff",
  };

  const DEATH_MESSAGES = [
    "You were consumed by technical debt.",
    "NullPointerException: Player not found.",
    "Segmentation fault (core dumped).",
    "Your last commit was force-pushed to oblivion.",
    "Out of memory. Game over.",
    "Merge conflict could not be resolved.",
    "You became legacy code.",
    "The Infinite Loop finally caught you.",
    "Stack overflow in soul.exe",
    "404 — Will to live not found.",
  ];

  // ====================== STATE ======================
  let game = null;

  function createGame() {
    return {
      depth: 1,
      width: 45,
      height: 27,
      map: [],
      visible: [],
      explored: [],
      player: {
        x: 0,
        y: 0,
        hp: 22,
        maxHp: 22,
        level: 1,
        xp: 0,
        xpToNext: 14,
        atk: 3,
        stars: 0,
        inventory: [],
        kills: 0,
      },
      entities: [],
      messages: [],
      turn: 0,
      over: false,
      animating: false,
    };
  }

  // ====================== MAP GENERATION ======================
  function generateMap(g) {
    const w = g.width;
    const h = g.height;
    const map = Array.from({ length: h }, () => Array(w).fill(TILE.WALL));
    const rooms = [];

    const maxRooms = 7 + Math.floor(g.depth * 0.6);
    const attempts = maxRooms * 3;

    for (let i = 0; i < attempts && rooms.length < maxRooms; i++) {
      const rw = 5 + Math.floor(Math.random() * 7);
      const rh = 4 + Math.floor(Math.random() * 5);
      const rx = 1 + Math.floor(Math.random() * (w - rw - 2));
      const ry = 1 + Math.floor(Math.random() * (h - rh - 2));

      let overlaps = false;
      for (const r of rooms) {
        if (
          rx < r.x + r.w + 2 &&
          rx + rw + 2 > r.x &&
          ry < r.y + r.h + 2 &&
          ry + rh + 2 > r.y
        ) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      // Carve room
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          map[y][x] = TILE.FLOOR;
        }
      }
      rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) });
    }

    // Connect rooms (MST-like simple chain + some extra)
    for (let i = 1; i < rooms.length; i++) {
      carveCorridor(map, rooms[i - 1], rooms[i]);
    }
    // Extra connections for more interesting layout
    if (rooms.length > 3) {
      carveCorridor(map, rooms[0], rooms[Math.floor(rooms.length / 2)]);
    }

    // Place stairs in last room
    const last = rooms[rooms.length - 1];
    map[last.cy][last.cx] = TILE.STAIRS;

    // Place player in first room
    const first = rooms[0];
    g.player.x = first.cx;
    g.player.y = first.cy;

    g.map = map;
    g.visible = Array.from({ length: h }, () => Array(w).fill(false));
    g.explored = Array.from({ length: h }, () => Array(w).fill(false));
    g.entities = [];

    spawnEntities(g, rooms);
  }

  function carveCorridor(map, a, b) {
    let x = a.cx;
    let y = a.cy;
    const tx = b.cx;
    const ty = b.cy;

    while (x !== tx || y !== ty) {
      map[y][x] = TILE.FLOOR;
      if (Math.random() < 0.5) {
        if (x !== tx) x += Math.sign(tx - x);
        else if (y !== ty) y += Math.sign(ty - y);
      } else {
        if (y !== ty) y += Math.sign(ty - y);
        else if (x !== tx) x += Math.sign(tx - x);
      }
    }
    map[ty][tx] = TILE.FLOOR;
  }

  function spawnEntities(g, rooms) {
    const depth = g.depth;
    const floors = [];

    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (
          g.map[y][x] === TILE.FLOOR &&
          !(x === g.player.x && y === g.player.y) &&
          g.map[y][x] !== TILE.STAIRS
        ) {
          floors.push({ x, y });
        }
      }
    }

    // Shuffle
    for (let i = floors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [floors[i], floors[j]] = [floors[j], floors[i]];
    }

    let idx = 0;
    const monsterCount = 4 + depth + Math.floor(Math.random() * 3);
    const itemCount = 2 + Math.floor(Math.random() * 3);

    // Monsters
    for (let i = 0; i < monsterCount && idx < floors.length; i++, idx++) {
      const pos = floors[idx];
      const roll = Math.random();
      let ent;

      if (depth >= 5 && roll < 0.08) {
        // Rare: Infinite Loop
        ent = {
          x: pos.x, y: pos.y, char: TILE.LOOP,
          name: "Infinite Loop", hp: 18 + depth * 2, maxHp: 18 + depth * 2,
          atk: 4 + depth, xp: 18, isMonster: true, special: "loop"
        };
      } else if (depth >= 3 && roll < 0.18) {
        // NullPointer
        ent = {
          x: pos.x, y: pos.y, char: TILE.NULL,
          name: "NullPointer", hp: 12 + depth * 2, maxHp: 12 + depth * 2,
          atk: 3 + Math.floor(depth / 2), xp: 12, isMonster: true, special: "null"
        };
      } else if (roll < 0.50) {
        ent = {
          x: pos.x, y: pos.y, char: TILE.BUG,
          name: "Bug", hp: 5 + depth, maxHp: 5 + depth,
          atk: 1 + Math.floor(depth / 2), xp: 4, isMonster: true
        };
      } else if (roll < 0.80) {
        ent = {
          x: pos.x, y: pos.y, char: TILE.MERGE,
          name: "Merge Conflict", hp: 9 + depth * 2, maxHp: 9 + depth * 2,
          atk: 2 + Math.floor(depth / 2), xp: 7, isMonster: true
        };
      } else {
        ent = {
          x: pos.x, y: pos.y, char: TILE.LEAK,
          name: "Memory Leak", hp: 7 + depth, maxHp: 7 + depth,
          atk: 3 + depth, xp: 9, isMonster: true
        };
      }
      g.entities.push(ent);
    }

    // Items
    for (let i = 0; i < itemCount && idx < floors.length; i++, idx++) {
      const pos = floors[idx];
      const roll = Math.random();

      if (roll < 0.45) {
        g.entities.push({
          x: pos.x, y: pos.y, char: TILE.COMMIT,
          name: "Commit", heal: 7 + depth * 2, stars: 1 + Math.floor(depth / 2),
          isItem: true
        });
      } else if (roll < 0.75) {
        g.entities.push({
          x: pos.x, y: pos.y, char: TILE.STAR,
          name: "Star", stars: 4 + depth, isItem: true
        });
      } else if (roll < 0.90) {
        g.entities.push({
          x: pos.x, y: pos.y, char: TILE.COFFEE,
          name: "Coffee", heal: 12 + depth, isItem: true
        });
      } else {
        g.entities.push({
          x: pos.x, y: pos.y, char: TILE.KEYBOARD,
          name: "Mechanical Keyboard", atkBonus: 1, isItem: true
        });
      }
    }
  }

  // ====================== FOV ======================
  function updateFOV(g) {
    const { width, height, player } = g;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) g.visible[y][x] = false;
    }

    const radius = 7;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const x = player.x + dx;
        const y = player.y + dy;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (hasLOS(g, player.x, player.y, x, y)) {
          g.visible[y][x] = true;
          g.explored[y][x] = true;
        }
      }
    }
  }

  function hasLOS(g, x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0, y = y0;

    while (true) {
      if (x === x1 && y === y1) return true;
      if (g.map[y][x] === TILE.WALL && !(x === x0 && y === y0)) return false;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  // ====================== RENDER ======================
  function render(g) {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    let html = "";
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        let char = " ";
        let color = "#050505";

        if (!g.explored[y][x]) {
          char = " ";
          color = "#000";
        } else if (!g.visible[y][x]) {
          char = g.map[y][x] === TILE.WALL ? TILE.WALL : TILE.FLOOR;
          color = "#0a1f0a";
        } else {
          char = g.map[y][x];
          color = COLORS[char] || "#00ff41";

          const ent = g.entities.find(e => e.x === x && e.y === y);
          if (ent) {
            char = ent.char;
            color = COLORS[ent.char] || "#fff";
          }

          if (x === g.player.x && y === g.player.y) {
            char = TILE.PLAYER;
            color = COLORS[TILE.PLAYER];
          }
        }
        html += `<span style="color:\( {color}"> \){char}</span>`;
      }
      html += "\n";
    }
    mapEl.innerHTML = html;

    // Status
    safeSet("stat-depth", g.depth);
    safeSet("stat-hp", `\( {g.player.hp}/ \){g.player.maxHp}`);
    safeSet("stat-level", g.player.level);
    safeSet("stat-stars", g.player.stars);
    safeSet("stat-atk", g.player.atk);

    // Inventory
    const inv = document.getElementById("inv-list");
    if (inv) {
      inv.innerHTML = g.player.inventory.length === 0
        ? `<span style="color:#003b0f">empty</span>`
        : g.player.inventory.map(i => i.name).join("<br>");
    }

    // Messages
    const log = document.getElementById("message-log");
    if (log) {
      log.innerHTML = g.messages.slice(-6).map(m =>
        `<div class="msg \( {m.type || ""}"> \){escapeHtml(m.text)}</div>`
      ).join("");
      log.scrollTop = log.scrollHeight;
    }
  }

  function safeSet(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function addMessage(g, text, type = "") {
    g.messages.push({ text, type, t: Date.now() });
    if (g.messages.length > 40) g.messages.shift();
  }

  // ====================== GAME LOGIC ======================
  function tryMove(g, dx, dy) {
    if (!g || g.over || g.animating) return;

    const nx = g.player.x + dx;
    const ny = g.player.y + dy;

    if (nx < 0 || nx >= g.width || ny < 0 || ny >= g.height) return;
    if (g.map[ny][nx] === TILE.WALL) return;

    // Attack monster
    const monster = g.entities.find(e => e.isMonster && e.x === nx && e.y === ny);
    if (monster) {
      const dmg = g.player.atk + Math.floor(Math.random() * 3);
      monster.hp -= dmg;
      addMessage(g, `You hit the ${monster.name} for ${dmg}!`, "damage");

      if (monster.hp <= 0) {
        addMessage(g, `You destroyed the \( {monster.name}! + \){monster.xp} XP`, "important");
        g.player.xp += monster.xp;
        g.player.stars += 1;
        g.player.kills += 1;
        g.entities = g.entities.filter(e => e !== monster);
        checkLevelUp(g);
      } else {
        // Counter attack
        let mdmg = monster.atk;
        if (monster.special === "null" && Math.random() < 0.25) {
          mdmg = Math.floor(mdmg * 1.6);
          addMessage(g, `NullPointer critical!`, "damage");
        }
        g.player.hp -= mdmg;
        addMessage(g, `The ${monster.name} hits you for ${mdmg}!`, "damage");
        if (g.player.hp <= 0) {
          playerDied(g);
          return;
        }
      }

      g.turn++;
      updateFOV(g);
      render(g);
      return;
    }

    // Move
    g.player.x = nx;
    g.player.y = ny;

    // Pickup
    const item = g.entities.find(e => e.isItem && e.x === nx && e.y === ny);
    if (item) {
      if (item.heal) {
        const before = g.player.hp;
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + item.heal);
        addMessage(g, `You used \( {item.name}. + \){g.player.hp - before} HP`, "heal");
      }
      if (item.stars) {
        g.player.stars += item.stars;
        addMessage(g, `Collected ${item.stars} ★`, "important");
      }
      if (item.atkBonus) {
        g.player.atk += item.atkBonus;
        g.player.inventory.push({ name: item.name });
        addMessage(g, `Equipped \( {item.name}! ATK + \){item.atkBonus}`, "important");
      }
      g.entities = g.entities.filter(e => e !== item);
    }

    // Stairs
    if (g.map[ny][nx] === TILE.STAIRS) {
      descend(g);
      return;
    }

    monstersAct(g);
    g.turn++;
    updateFOV(g);
    render(g);
  }

  function monstersAct(g) {
    for (const m of g.entities.filter(e => e.isMonster)) {
      const dist = Math.abs(m.x - g.player.x) + Math.abs(m.y - g.player.y);
      if (dist > 9) continue;

      // Special: Infinite Loop sometimes skips turn (confusing)
      if (m.special === "loop" && Math.random() < 0.2) continue;

      let dx = Math.sign(g.player.x - m.x);
      let dy = Math.sign(g.player.y - m.y);

      // Prefer one axis randomly
      if (Math.random() < 0.5) {
        if (dx !== 0) dy = 0;
      } else {
        if (dy !== 0) dx = 0;
      }

      const nx = m.x + dx;
      const ny = m.y + dy;

      if (nx < 0 || nx >= g.width || ny < 0 || ny >= g.height) continue;
      if (g.map[ny][nx] === TILE.WALL) continue;

      // Attack player
      if (nx === g.player.x && ny === g.player.y) {
        let mdmg = m.atk;
        if (m.special === "null" && Math.random() < 0.2) {
          mdmg = Math.floor(mdmg * 1.5);
        }
        g.player.hp -= mdmg;
        addMessage(g, `The ${m.name} hits you for ${mdmg}!`, "damage");
        if (g.player.hp <= 0) {
          playerDied(g);
          return;
        }
        continue;
      }

      // Occupied?
      if (g.entities.some(e => e.x === nx && e.y === ny)) continue;

      m.x = nx;
      m.y = ny;
    }
  }

  function checkLevelUp(g) {
    while (g.player.xp >= g.player.xpToNext) {
      g.player.xp -= g.player.xpToNext;
      g.player.level++;
      g.player.maxHp += 5;
      g.player.hp = g.player.maxHp;
      g.player.atk += 1;
      g.player.xpToNext = Math.floor(g.player.xpToNext * 1.45);
      addMessage(g, `★ LEVEL UP! You are now level ${g.player.level}`, "important");
    }
  }

  function descend(g) {
    g.depth++;
    addMessage(g, `Descending to depth ${g.depth}...`, "system");
    g.player.hp = Math.min(g.player.maxHp, g.player.hp + 4 + Math.floor(g.depth / 2));
    generateMap(g);
    updateFOV(g);
    render(g);
  }

  function playerDied(g) {
    g.over = true;
    g.player.hp = 0;
    addMessage(g, "You have been consumed by technical debt...", "damage");
    saveHighscore(g);

    const deathEl = document.getElementById("death-message");
    if (deathEl) deathEl.textContent = DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];

    safeSet("final-depth", g.depth);
    safeSet("final-stars", g.player.stars);
    safeSet("final-level", g.player.level);

    showScreen("gameover-screen");
  }

  // ====================== HIGHSCORE ======================
  function saveHighscore(g) {
    try {
      const scores = JSON.parse(localStorage.getItem("deepcommit_hs") || "[]");
      scores.push({
        depth: g.depth,
        stars: g.player.stars,
        level: g.player.level,
        kills: g.player.kills,
        date: new Date().toLocaleDateString(),
      });
      scores.sort((a, b) => b.stars - a.stars || b.depth - a.depth);
      localStorage.setItem("deepcommit_hs", JSON.stringify(scores.slice(0, 12)));
    } catch (e) {}
  }

  function renderHighscores() {
    const el = document.getElementById("highscore-list");
    if (!el) return;
    try {
      const scores = JSON.parse(localStorage.getItem("deepcommit_hs") || "[]");
      if (scores.length === 0) {
        el.innerHTML = `<div class="empty">No runs yet. Go make history.</div>`;
        return;
      }
      el.innerHTML = scores.map((s, i) =>
        `<div class="hs-row"><span>#${i + 1} Depth \( {s.depth}</span><span> \){s.stars} ★ · Lv${s.level}</span></div>`
      ).join("");
    } catch (e) {
      el.innerHTML = `<div class="empty">Error loading scores.</div>`;
    }
  }

  // ====================== SCREENS ======================
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => {
      s.classList.remove("active");
      s.hidden = true;
    });
    const target = document.getElementById(id);
    if (target) {
      target.classList.add("active");
      target.hidden = false;
    }
  }

  function startNewGame() {
    game = createGame();
    generateMap(game);
    updateFOV(game);
    game.messages = [];
    addMessage(game, "Welcome to DEEPCOMMIT. Survive the codebase.", "system");
    addMessage(game, "Find the stairs > to descend deeper.", "system");
    render(game);
    showScreen("game-screen");
  }

  // ====================== INPUT ======================
  document.addEventListener("keydown", (e) => {
    if (!game || game.over) return;
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen || !gameScreen.classList.contains("active")) return;

    let dx = 0, dy = 0;
    switch (e.key) {
      case "ArrowUp": case "w": case "W": case "k": dy = -1; break;
      case "ArrowDown": case "s": case "S": case "j": dy = 1; break;
      case "ArrowLeft": case "a": case "A": case "h": dx = -1; break;
      case "ArrowRight": case "d": case "D": case "l": dx = 1; break;
      default: return;
    }
    e.preventDefault();
    tryMove(game, dx, dy);
  });

  // Touch / swipe
  let touchStartX = 0, touchStartY = 0;
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (!game || game.over) return;
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen || !gameScreen.classList.contains("active")) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 28) return;

    if (absX > absY) {
      tryMove(game, dx > 0 ? 1 : -1, 0);
    } else {
      tryMove(game, 0, dy > 0 ? 1 : -1);
    }
  }, { passive: true });

  // ====================== BUTTONS ======================
  function bind(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  }

  bind("btn-new-game", startNewGame);
  bind("btn-retry", startNewGame);
  bind("btn-title", () => showScreen("title-screen"));
  bind("btn-how-to", () => showScreen("howto-screen"));
  bind("btn-back-howto", () => showScreen("title-screen"));
  bind("btn-highscores", () => {
    renderHighscores();
    showScreen("highscore-screen");
  });
  bind("btn-back-hs", () => showScreen("title-screen"));

  // Expose for debugging
  window.DEEPCOMMIT = { startNewGame, getGame: () => game };

})();
