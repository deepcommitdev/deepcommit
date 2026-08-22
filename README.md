# DEEPCOMMIT

<p align="center">
  <img src="https://pbs.twimg.com/profile_images/2090890526413451264/kjEut0dN_400x400.jpg" alt="DEEPCOMMIT Logo" width="180">
</p>

<p align="center">
  <strong>A programming-themed ASCII roguelike</strong><br>
  Descend into the depths of broken code.
</p>

<p align="center">
  <a href="https://deepcommitdev.github.io/deepcommit/"><img src="https://img.shields.io/badge/Play-Live%20Demo-00ff41?style=for-the-badge&logo=github" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Status-Playable-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Made%20with-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript" alt="Vanilla JS">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Mobile-Friendly-success?style=flat-square" alt="Mobile">
  <img src="https://img.shields.io/badge/No%20Dependencies-yes-lightgrey?style=flat-square" alt="No Deps">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

---

## Play Now

**[→ deepcommitdev.github.io/deepcommit](https://deepcommitdev.github.io/deepcommit/)**

Works on desktop and mobile. No install needed.

---

## About

DEEPCOMMIT is a turn-based ASCII roguelike themed around the daily struggles of software development. Fight bugs, merge conflicts, memory leaks, and worse as you descend deeper into the codebase.

Features:

- Procedural dungeon generation
- Full map visibility (Bomberman-style)
- Class system (Frontend, Backend, DevOps, Fullstack)
- Permadeath + local highscores
- Save & continue progress
- Sound effects (Web Audio)
- Mobile-friendly with on-screen D-Pad
- Pure Vanilla JS — zero dependencies

---

## Classes

| Class       | Bonus                  | Special                     |
|-------------|------------------------|-----------------------------|
| **Frontend**   | +8 Max HP             | Starts with Coffee          |
| **Backend**    | +2 ATK                 | Higher base damage          |
| **DevOps**     | +4 HP, +1 ATK          | Phase through 1 wall / depth|
| **Fullstack**  | +5 HP, +1 ATK          | Balanced                    |

---

## Controls

**Desktop**
- `WASD` or Arrow Keys — Move
- Walk into enemies to attack

**Mobile**
- On-screen D-Pad buttons

**Goal**  
Find the stairs `>` and descend as deep as possible. Collect Stars ★. Survive.

---

## Legend

| Symbol | Meaning              |
|--------|----------------------|
| 🧌     | You (the Developer)  |
| `#`    | Wall                 |
| `.`    | Floor                |
| `>`    | Stairs (next depth)  |
| `g`    | Bug                  |
| `M`    | Merge Conflict       |
| `L`    | Memory Leak          |
| `N`    | NullPointer          |
| `∞`    | Infinite Loop        |
| `$`    | Commit (heal)        |
| `★`    | Star (score)         |
| `☕`    | Coffee (heal)        |
| `⌨`    | Mechanical Keyboard  |

---

## Tech Stack

- HTML5 + CSS3 + Vanilla JavaScript
- Web Audio API (sound effects)
- localStorage (save + highscores)
- Hosted on GitHub Pages

No frameworks. No build step. Just open `index.html`.

---

## Local Development

1. Clone the repo
```bash
git clone https://github.com/deepcommitdev/deepcommit.git
cd deepcommit
```

2. Open `index.html` in your browser  
   or use any static server:

```bash
npx serve .
```

---

## Project Structure

```
deepcommit/
├── index.html
├── style.css
├── game.js
└── README.md
```

---

## Roadmap / Ideas

- [x] Class system
- [x] Save progress
- [x] Sound effects
- [ ] Boss fights at deeper levels
- [ ] Random events
- [ ] More items & monsters
- [ ] Daily challenge seed

---

## License

MIT License — feel free to fork, modify, and build upon it.

---

<p align="center">
  Made with caffeine and technical debt by <a href="https://github.com/deepcommitdev">deepcommitdev</a>
</p>
```
