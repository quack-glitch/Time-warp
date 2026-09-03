# TIME WARP

> **"Give your goal a deadline. Make the remaining time visible."**
> A personal deadline clock and continuous particle hourglass reservoir.

---

## 1. The Core Concept

Time Warp turns a long-term pursuit into a living, continuously moving visual representation of the finite amount of time available to achieve it.

A user defines:
- **What am I trying to achieve?**
- **By when?**

Time Warp then continuously displays the remaining time until that deadline.

The product is **not** primarily a task manager, calendar, or reminder application. Its purpose is to create a persistent awareness of time passing toward something meaningful.

---

## 2. Key Features

- **Continuous Particle Hourglass**:
  - High-performance 60 FPS HTML5 canvas physics simulation.
  - Thousands of physical sand particles draining from the upper chamber to the lower dune in real time.
  - Upper reservoir height accurately reflects remaining time percentage (`100% → 0%`).
  - Lower chamber dune reflects elapsed progress (`0% → 100%`).
  - Continuous stream with gravity acceleration and particle splash at the dune peak.

- **Glanceable Countdown Hero**:
  - High-contrast, tabular-num typography (`Years`, `Months`, `Days`, `Hours`, `Minutes`, `Seconds`).
  - Designed for glanceability across a desk, side monitor, or tablet.
  - Reflective and peaceful **"Time Expired"** state when the deadline arrives.

- **Curated Focus Switcher**:
  - Switcher supporting up to 5 curated life milestones.
  - Keeps radical focus on one active goal at a time.

- **Dual Calendar System**:
  - Full bidirectional integration between Gregorian (A.D.) and Nepali Bikram Sambat (B.S.).
  - Simultaneous dual-date display and native B.S. date pickers (Year, Month, Day).

- **Ambient Zen Mode**:
  - 4-second idle detection automatically fades out navigation, switchers, and controls.
  - Uninterrupted, glowing ambient display that wakes on mouse movement or keypress.

- **Procedural Ambient Audio**:
  - Synthesizes organic sand trickle whisper (filtered pink noise) and soft vintage wood ticks.
  - 100% native Web Audio API — zero external audio files.
  - Toggle on/off with <kbd>M</kbd>.

- **12 Curated Ambient Themes**:
  - **Clean Parchment**: Warm off-white ceramic background, charcoal frame, and deep slate sand (dedicated light theme).
  - **Obsidian Void**: Pitch OLED black background with metallic warm gold sand.
  - **Cyber Neon**: Deep synthetic violet base with electric cyan and magenta sand.
  - **Solar Flare**: Rich midnight charcoal base with radiant crimson, burnt terracotta, and molten copper sand.
  - **Cherry Grove**: Muted twilight lavender base with soft sakura pink and pale teal mist sand.
  - **Emerald Canopy**: Ink-black pine base with phosphorescent mint and pale jade sand.
  - **Glacial Frost**: Deep arctic navy base with stark icy-white and faint glacial blue sand.
  - **Golden Hour**: Warm sunset dusk with rich amber sand dunes.
  - **Aurora Borealis**: Dark arctic indigo base with shifting teal, violet, and soft frost-white sand.
  - **Ember Ash**: Volcanic charcoal base with warm orange-gold and pale yellow sand.
  - **Jade Lotus**: Dark forest-moss black base with cool jade-green and soft mint-green sand.
  - **Opal Rift**: Matte dark navy base with pearlescent pink, blue, and light purple sand.

- **100% Local-First & PWA**:
  - Zero accounts, zero cloud servers, complete privacy.
  - One-click JSON backup export and import restore.
  - Installable as an offline Progressive Web App (PWA).

---

## 3. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>F</kbd> | Toggle Fullscreen ambient display |
| <kbd>Z</kbd> | Manually toggle Zen Mode (hide/show chrome) |
| <kbd>Space</kbd> / <kbd>M</kbd> | Toggle ambient audio (Sand trickle & tick) |
| <kbd>T</kbd> | Cycle through all 12 ambient themes |
| <kbd>1</kbd>–<kbd>5</kbd> | Switch between curated goals |
| <kbd>Esc</kbd> | Exit fullscreen or close modal |

---

## 4. Tech Stack

- **Framework**: React 19, TypeScript
- **Bundler & Tooling**: Vite, Vitest
- **Styling**: Tailwind CSS v4, CSS Custom Properties
- **Visuals**: HTML5 Canvas 2D Physics Render Loop
- **Audio**: Web Audio API Procedural Synthesizer
- **Calendars**: `date-fns`, `nepali-date-converter`
- **Icons**: Lucide React

---

## 5. Development & Running

### Install Dependencies:
```bash
npm install --legacy-peer-deps
```

### Start Development Server:
```bash
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173).

### Run Test Suite:
```bash
npm test
```

### Build Production Bundle:
```bash
npm run build
```

---

## 6. License

MIT. Built with radical focus and simplicity.
