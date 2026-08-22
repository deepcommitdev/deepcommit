/* ============================================
   DEEPCOMMIT — Full Visible Map + Troll Player
   v0.2.6  |  Pure Vanilla JS
   ============================================ */

(() => {
  "use strict";

  // ====================== CONSTANTS ======================
  const TILE = {
    WALL: "#",
    FLOOR: ".",
    STAIRS: ">",
    PLAYER: "🧌",
    BUG: "g",
    MERGE: "M",
    LEAK: "L",
    NULL: "N",
    LOOP: "∞",
    COMMIT: "$",
    STAR: "★",
    COFFEE: "☕",
    KEYBOARD: "⌨"
  };

  const COLORS = {
    "#": "#00aa2a",
    ".": "#1a3a1a",
    ">": "#00e5ff",
    "🧌": "#ffffff",
    "g": "#ff3333",
    "M": "#ff8800",
    "L": "#cc00ff",
    "N": "#ff0055",
    "∞": "#00ffcc",
    "$": "#ffcc00",
    "★": "#ffff00",
    "☕": "#c4a35a",
    "⌨": "#88aaff"
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
    "404 — Will to live not found."
  ];

  // ====================== STATE ======================
  let game = null;

  function createGame() {
    return {
      depth: 1,
      width: 33,
      height: 17,
      map: [],
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
        kills: 0
      },
      entities: [],
      messages: [],
      turn: 0,
      over: false
    };
  }

  // ====================== MAP GENERATION ======================
  function generateMap(g) {
    const w = g.width;
    const h = g.height;
    const map = [];
    for (let y = 0; y < h; y++) {
      map[y] = [];
      for (let x = 0; x < w; x++) {
        map[y][x] = TILE.WALL;
      }
    }

    const rooms = [];
    const maxRooms = 5 + Math.floor(g.depth * 0.4);
    const attempts = maxRooms * 4;

    for (let i = 0; i < attempts && rooms.length < maxRooms; i++) {
      const rw = 4 + Math.floor(Math.random() * 5);
      const rh = 3 + Math.floor(Math.random() * 3);
      const rx = 1 + Math.floor(Math.random() * (w - rw - 2));
      const ry = 1 + Math.floor(Math.random() * (h - rh - 2));

      let overlaps = false;
      for (let r = 0; r < rooms.length; r++) {
        const room = rooms[r];
        if (
          rx < room.x + room.w + 1 &&
          rx + rw + 1 > room.x &&
          ry < room.y + room.h + 1 &&
          ry + rh + 1 > room.y
        ) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          map[y][x] = TILE.FLOOR;
        }
      }

      rooms.push({
        x: rx,
        y: ry,
        w: rw,
        h: rh,
        cx: Math.floor(rx + rw / 2),
        cy: Math.floor(ry + rh / 2)
      });
    }

    // Connect rooms
    for (let i = 1; i < rooms.length; i++) {
      carveCorridor(map, rooms[i - 1], rooms[i]);
    }
    if (rooms.length > 3) {
      carveCorridor(map, rooms[0], rooms[Math.floor(rooms.length / 2)]);
    }

    // Stairs
    const last = rooms[rooms.length - 1];
    map[last.cy][last.cx] = TILE.STAIRS;

    // Player start
    const first = rooms[0];
    g.player.x = first.cx;
    g.player.y = first.cy;

    g.map = map;
    g.entities = [];
    spawnEntities(g);
  }

  function carveCorridor(map, a, b) {
    let x = a.cx;
    let y = a.cy;
    const tx = b.cx;
    const ty = b.cy;

    while (x !== tx || y !== ty) {
      map[y][x] = TILE.FLOOR;
      if (Math.random() < 0.5) {
        if (x !== tx) x += x < tx ? 1 : -1;
        else if (y !== ty) y += y < ty ? 1 : -1;
      } else {
        if (y !== ty) y += y < ty ? 1 : -1;
        else if (x !== tx) x += x < tx ? 1 : -1;
      }
    }
    map[ty][tx] = TILE.FLOOR;
  }

  function spawnEntities(g) {
    const depth = g.depth;
    const floors = [];

    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (
          g.map[y][x] === TILE.FLOOR &&
          !(x === g.player.x && y === g.player.y)
        ) {
          floors.push({ x: x, y: y });
        }
      }
    }

    // Shuffle
    for (let i = floors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = floors[i];
      floors[i] = floors[j];
      floors[j] = temp;
    }

    let idx = 0;
    const monsterCount = 3 + depth + Math.floor(Math.random() * 2);
    const itemCount = 2 + Math.floor(Math.random() * 2);

    // Monsters
    for (let i = 0; i < monsterCount && idx < floors.length; i++, idx++) {
      const pos = floors[idx];
      const roll = Math.random();
      let ent;

      if (depth >= 5 && roll < 0.08) {
        ent = {
          x: pos.x, y: pos.y, char: TILE.LOOP,
          name: "Infinite Loop",
          hp: 16 + depth * 2, maxHp: 16 + depth * 2,
          atk: 4 + depth, xp: 16, isMonster: true, special: "loop"
        };
      } else if (depth >= 3 && roll < 0.18) {
        ent = {
          x: pos.x, y: pos.y, char: TILE.NULL,
          name: "NullPointer",
          hp: 11 + depth * 2, maxHp: 11 + depth * 2,
          atk: 3 + Math.floor(depth / 2), xp: 11, isMonster: true, special: "null"
        };
      } else if (roll < 0.5) {
        ent = {
          x: pos.x, y: pos.y, char: TILE.BUG,
          name: "Bug",
          hp: 5 + depth, maxHp: 5 + depth,
          atk: 1 + Math.floor(depth / 2), xp: 4, isMonster: true
        };
      } else if (roll < 0.8) {
        ent = {
          x: pos.x, y: pos.y, char: TILE.MERGE,
          name: "Merge Conflict",
          hp: 8 + depth * 2, maxHp: 8 + depth * 2,
          atk: 2 + Math.floor(depth / 2), xp: 7, isMonster: true
        };
      } else {
        ent = {
          x: pos.x, y: pos.y, char: TILE.LEAK,
          name: "Memory Leak",
          hp: 7 + depth, maxHp: 7 + depth,
          atk: 3 + Math.floor(depth / 2), xp: 8, isMonster: true
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
          name: "Commit", heal: 7 + depth * 2,
          stars: 1 + Math.floor(depth / 2), isItem: true
        });
      } else if (roll < 0.75) {
        g.entities.push({
          x: pos.x, y: pos.y, char: TILE.STAR,
          name: "Star", stars: 3 + depth, isItem: true
        });
      } else if (roll < 0.9) {
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

  // ====================== RENDER (FULL VISIBLE) ======================
  function render(g) {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    let html = "";
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        let char = g.map[y][x];
        let color = COLORS[char] || "#00ff41";

        // Entity
        for (let i = 0; i < g.entities.length; i++) {
          const e = g.entities[i];
          if (e.x === x && e.y === y) {
            char = e.char;
            color = COLORS[e.char] || "#fff";
            break;
          }
        }

        // Player
        if (x === g.player.x && y === g.player.y) {
          char = TILE.PLAYER;
          color = COLORS["🧌"];
        }

        html += '<span style="color:' + color + '">' + char + "</span>";
      }
      html += "\n";
    }
    mapEl.innerHTML = html;

    // Status
    safeSet("stat-depth", g.depth);
    safeSet("stat-hp", g.player.hp + "/" + g.player.maxHp);
    safeSet("stat-level", g.player.level);
    safeSet("stat-stars", g.player.stars);
    safeSet("stat-atk", g.player.atk);

    // Inventory
    const inv = document.getElementById("inv-list");
    if (inv) {
      if (g.player.inventory.length === 0) {
        inv.innerHTML = '<span style="color:#003b0f">empty</span>';
      } else {
        let invHtml = "";
        for (let i = 0; i < g.player.inventory.length; i++) {
          invHtml += g.player.inventory[i].name + "<br>";
        }
        inv.innerHTML = invHtml;
      }
    }

    // Messages
    const log = document.getElementById("message-log");
    if (log) {
      let msgHtml = "";
      const start = Math.max(0, g.messages.length - 5);
      for (let i = start; i < g.messages.length; i++) {
        const m = g.messages[i];
        msgHtml += '<div class="msg ' + (m.type || "") + '">' + escapeHtml(m.text) + "</div>";
      }
      log.innerHTML = msgHtml;
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

  function addMessage(g, text, type) {
    g.messages.push({ text: text, type: type || "" });
    if (g.messages.length > 30) g.messages.shift();
  }

  // ====================== GAME LOGIC ======================
  function tryMove(g, dx, dy) {
    if (!g || g.over) return;

    const nx = g.player.x + dx;
    const ny = g.player.y + dy;

    if (nx < 0 || nx >= g.width || ny < 0 || ny >= g.height) return;
    if (g.map[ny][nx] === TILE.WALL) return;

    // Attack
    let monster = null;
    for (let i = 0; i < g.entities.length; i++) {
      const e = g.entities[i];
      if (e.isMonster && e.x === nx && e.y === ny) {
        monster = e;
        break;
      }
    }

    if (monster) {
      const dmg = g.player.atk + Math.floor(Math.random() * 3);
      monster.hp -= dmg;
      addMessage(g, "You hit the " + monster.name + " for " + dmg + "!", "damage");

      if (monster.hp <= 0) {
        addMessage(g, "You destroyed the " + monster.name + "! +" + monster.xp + " XP", "important");
        g.player.xp += monster.xp;
        g.player.stars += 1;
        g.player.kills += 1;

        const newEntities = [];
        for (let i = 0; i < g.entities.length; i++) {
          if (g.entities[i] !== monster) newEntities.push(g.entities[i]);
        }
        g.entities = newEntities;
        checkLevelUp(g);
      } else {
        let mdmg = monster.atk;
        if (monster.special === "null" && Math.random() < 0.25) {
          mdmg = Math.floor(mdmg * 1.5);
          addMessage(g, "NullPointer critical!", "damage");
        }
        g.player.hp -= mdmg;
        addMessage(g, "The " + monster.name + " hits you for " + mdmg + "!", "damage");
        if (g.player.hp <= 0) {
          playerDied(g);
          return;
        }
      }

      g.turn++;
      render(g);
      return;
    }

    // Move
    g.player.x = nx;
    g.player.y = ny;

    // Pickup
    let item = null;
    for (let i = 0; i < g.entities.length; i++) {
      const e = g.entities[i];
      if (e.isItem && e.x === nx && e.y === ny) {
        item = e;
        break;
      }
    }

    if (item) {
      if (item.heal) {
        const before = g.player.hp;
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + item.heal);
        addMessage(g, "You used " + item.name + ". +" + (g.player.hp - before) + " HP", "heal");
      }
      if (item.stars) {
        g.player.stars += item.stars;
        addMessage(g, "Collected " + item.stars + " ★", "important");
      }
      if (item.atkBonus) {
        g.player.atk += item.atkBonus;
        g.player.inventory.push({ name: item.name });
        addMessage(g, "Equipped " + item.name + "! ATK +" + item.atkBonus, "important");
      }

      const newEntities = [];
      for (let i = 0; i < g.entities.length; i++) {
        if (g.entities[i] !== item) newEntities.push(g.entities[i]);
      }
      g.entities = newEntities;
    }

    // Stairs
    if (g.map[ny][nx] === TILE.STAIRS) {
      descend(g);
      return;
    }

    monstersAct(g);
    g.turn++;
    render(g);
  }

  function monstersAct(g) {
    for (let i = 0; i < g.entities.length; i++) {
      const m = g.entities[i];
      if (!m.isMonster) continue;

      const dist = Math.abs(m.x - g.player.x) + Math.abs(m.y - g.player.y);
      if (dist > 8) continue;

      if (m.special === "loop" && Math.random() < 0.2) continue;

      let dx = 0;
      let dy = 0;
      if (g.player.x > m.x) dx = 1;
      else if (g.player.x < m.x) dx = -1;
      if (g.player.y > m.y) dy = 1;
      else if (g.player.y < m.y) dy = -1;

      if (Math.random() < 0.5) {
        if (dx !== 0) dy = 0;
      } else {
        if (dy !== 0) dx = 0;
      }

      const nx = m.x + dx;
      const ny = m.y + dy;

      if (nx < 0 || nx >= g.width || ny < 0 || ny >= g.height) continue;
      if (g.map[ny][nx] === TILE.WALL) continue;

      if (nx === g.player.x && ny === g.player.y) {
        let mdmg = m.atk;
        if (m.special === "null" && Math.random() < 0.2) {
          mdmg = Math.floor(mdmg * 1.4);
        }
        g.player.hp -= mdmg;
        addMessage(g, "The " + m.name + " hits you for " + mdmg + "!", "damage");
        if (g.player.hp <= 0) {
          playerDied(g);
          return;
        }
        continue;
      }

      let occupied = false;
      for (let j = 0; j < g.entities.length; j++) {
        if (g.entities[j].x === nx && g.entities[j].y === ny) {
          occupied = true;
          break;
        }
      }
      if (occupied) continue;

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
      g.player.xpToNext = Math.floor(g.player.xpToNext * 1.4);
      addMessage(g, "★ LEVEL UP! You are now level " + g.player.level, "important");
    }
  }

  function descend(g) {
    g.depth++;
    addMessage(g, "Descending to depth " + g.depth + "...", "system");
    g.player.hp = Math.min(g.player.maxHp, g.player.hp + 4 + Math.floor(g.depth / 2));
    generateMap(g);
    render(g);
  }

  function playerDied(g) {
    g.over = true;
    g.player.hp = 0;
    addMessage(g, "You have been consumed by technical debt...", "damage");
    saveHighscore(g);

    const deathEl = document.getElementById("death-message");
    if (deathEl) {
      deathEl.textContent = DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
    }

    safeSet("final-depth", g.depth);
    safeSet("final-stars", g.player.stars);
    safeSet("final-level", g.player.level);

    showScreen("gameover-screen");
  }

  // ====================== HIGHSCORE ======================
  function saveHighscore(g) {
    try {
      let scores = JSON.parse(localStorage.getItem("deepcommit_hs") || "[]");
      scores.push({
        depth: g.depth,
        stars: g.player.stars,
        level: g.player.level,
        kills: g.player.kills,
        date: new Date().toLocaleDateString()
      });
      scores.sort(function (a, b) {
        return b.stars - a.stars || b.depth - a.depth;
      });
      localStorage.setItem("deepcommit_hs", JSON.stringify(scores.slice(0, 10)));
    } catch (e) {}
  }

  function renderHighscores() {
    const el = document.getElementById("highscore-list");
    if (!el) return;
    try {
      const scores = JSON.parse(localStorage.getItem("deepcommit_hs") || "[]");
      if (scores.length === 0) {
        el.innerHTML = '<div class="empty">No runs yet. Go make history.</div>';
        return;
      }
      let html = "";
      for (let i = 0; i < scores.length; i++) {
        const s = scores[i];
        html += '<div class="hs-row"><span>#' + (i + 1) + " Depth " + s.depth +
                "</span><span>" + s.stars + " ★ · Lv" + s.level + "</span></div>";
      }
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = '<div class="empty">Error loading scores.</div>';
    }
  }

  // ====================== SCREENS ======================
  function showScreen(id) {
    const screens = document.querySelectorAll(".screen");
    for (let i = 0; i < screens.length; i++) {
      screens[i].classList.remove("active");
      screens[i].hidden = true;
    }
    const target = document.getElementById(id);
    if (target) {
      target.classList.add("active");
      target.hidden = false;
    }
  }

  function startNewGame() {
    game = createGame();
    generateMap(game);
    game.messages = [];
    addMessage(game, "Welcome to DEEPCOMMIT. Survive the codebase.", "system");
    addMessage(game, "Find the stairs > to descend deeper.", "system");
    render(game);
    showScreen("game-screen");
  }

  // ====================== INPUT ======================
  document.addEventListener("keydown", function (e) {
    if (!game || game.over) return;
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen || !gameScreen.classList.contains("active")) return;

    let dx = 0;
    let dy = 0;
    const key = e.key;

    if (key === "ArrowUp" || key === "w" || key === "W" || key === "k") dy = -1;
    else if (key === "ArrowDown" || key === "s" || key === "S" || key === "j") dy = 1;
    else if (key === "ArrowLeft" || key === "a" || key === "A" || key === "h") dx = -1;
    else if (key === "ArrowRight" || key === "d" || key === "D" || key === "l") dx = 1;
    else return;

    e.preventDefault();
    tryMove(game, dx, dy);
  });

  // ====================== BUTTONS ======================
  function bind(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  }

  bind("btn-new-game", startNewGame);
  bind("btn-retry", startNewGame);
  bind("btn-title", function () { showScreen("title-screen"); });
  bind("btn-how-to", function () { showScreen("howto-screen"); });
  bind("btn-back-howto", function () { showScreen("title-screen"); });
  bind("btn-highscores", function () {
    renderHighscores();
    showScreen("highscore-screen");
  });
  bind("btn-back-hs", function () { showScreen("title-screen"); });

  // D-Pad buttons
  const dpadButtons = document.querySelectorAll(".dpad-btn");
  for (let i = 0; i < dpadButtons.length; i++) {
    dpadButtons[i].addEventListener("click", function () {
      if (!game || game.over) return;
      const dx = parseInt(this.getAttribute("data-dx"), 10);
      const dy = parseInt(this.getAttribute("data-dy"), 10);
      tryMove(game, dx, dy);
    });
  }

  window.DEEPCOMMIT = {
    startNewGame: startNewGame,
    getGame: function () { return game; }
  };
})();
