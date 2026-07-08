# Game Brief

> Codex reads this file automatically at the start of every session, so it always remembers what
> you're building and stays in **game-jam mode**. Keep it short. **Codex keeps it in sync for
> you:** when the game changes in a way that affects what's written here, it updates this file as
> part of that change. You can also nudge it any time - *"update the game brief: the theme is
> underwater."* A good brief keeps your game consistent and saves you re-explaining.

## What the game is
A first-person 3D psychological puzzle game set inside an abandoned circus at night. The opening
phase is a quiet, eerie introduction: the player wakes outside the circus, moves through the world
in full first person with visible hands, collects a glowing ticket, wakes the circus, and is
sealed inside alone.

## The one core mechanic
Embodied first-person discovery through movement, hands-on interaction, close inspection, and
environmental reactions to what the player touches.

## Controls
Click `Play` to begin and capture the mouse. Move with `W`, `A`, `S`, `D`, sprint with `Shift`,
crouch with `Ctrl`, jump with `Space`, look with the mouse, press `E` or left-click to interact,
press `E` to confirm inspected objects, press `Esc` to exit open windows, right-click to rotate
inspected objects, press `B` to open the inventory, and press `M` to mute or unmute.

## Look & feel
Moonlit abandoned circus, cold blue fog, warm carnival bulbs waking one by one, stylized realism,
small drifting particles, and gentle unease instead of horror.

## Theme (jam)
No jam theme set. The current phase focuses on mystery, impossible-feeling space, and misleading
guidance as the emotional foundation.

## How you win / lose
There is no win or lose state yet in Phase 1. This slice is an introduction that ends once the
player is inside the circus and the gate shuts behind them.

---

## How to work with me, Codex - game-jam mode (don't delete this section)
**You're my expert game-dev pair and I'm a beginner - keep it simple, keep me moving, and use
your full toolkit.** I talk, you build. You don't open a browser to test; I play my own build by
opening `index.html`.

> **ALWAYS keep the running state in `PROGRESS.md` (do this every session, no exceptions).** At
> the **start of every session**, read `PROGRESS.md` first to recover exactly where we are (it's
> your handoff from the last session). As you work - after each meaningful step, bug fixed,
> decision made, or before we stop - **update `PROGRESS.md`** so it always reflects the current
> truth. This file is the memory that survives between sessions; treat keeping it current as part
> of the task, not an extra. (`AGENTS.md` = what the game *is*; `PROGRESS.md` = where the build
> *is right now*.)

- **Build in small steps.** After each change, have me open and play it before moving on. For a
  new feature, build the smallest version that's fun and don't break what already works. **Ugly
  first, plays well second, pretty last.**
- **`index.html` built on a real engine loaded from a CDN** - **Phaser** for 2D, **three.js** for
  3D (vanilla `<canvas>` only if I ask), **no build tools or bundler**. Default to a clean
  **`index.html` + `game.js` + `style.css`** split for a real game (collapse to one inline
  `index.html` for a tiny one); `game.js` can be a plain `<script>` or an ES module - the game runs
  on the `play` launcher's local server, so there are no `file://` limits. Use **jsdelivr** CDN
  URLs and pin versions - for three.js addons add a matching `"three/addons/"` importmap entry at
  the same version. Keep it **itch.io-iframe-safe and crisp**:
  fixed
  virtual resolution scaled to fit (keep aspect ratio, never stretch), handle
  `devicePixelRatio`, resize without resetting, auto-focus the window on load and click,
  `preventDefault()` the game keys, wrap `localStorage` in try/catch, resume audio on the first
  gesture, and use one `requestAnimationFrame` loop that resets **all** state on restart.
- **Don't invent engine APIs.** For any three.js/Phaser method you're unsure of, check the kit's
  `engine-apis.md` reference (the real API for the pinned versions) or **hand-write the math** -
  don't guess a method name (that's how `MathUtils.lerpAngle`-style errors happen).
- **When you ask me something, give me 2-4 options** (recommended first) so I can just pick - the
  interactive **question tool when we're in plan mode**, or a plain-text numbered list while
  you're building - and **quietly accept more than one** when answers combine (no need to point
  it out). I'm a beginner - picking beats composing an answer from scratch.
- **Art, sound, polish, and bug-fixing need no command - just do them as we build.** Generate art
  (code-drawn, cohesive limited palette) and sound (Web Audio, an **M** mute key) in code; once
  the core loop is fun, offer a short menu of juice effects for me to pick from. To use my own
  asset, I drop it in the **`assets/` folder** and reference it as `@assets/name` - you wire it in
  with the engine's normal loader; **any format works** (images, audio, atlases, tilemaps, 3D
  models), since the game runs on the launcher's local server.
- **When I paste a console error or describe what's wrong,** find the root cause, make the
  smallest fix, and tell me in one sentence what was wrong. No error handy? Tell me to press
  **F12 -> Console -> copy the red text**, or I'll drag in a screenshot.
- **To play, I double-click the `play` launcher** - `play.command` (Mac) or `play.bat` (Windows).
  It starts a tiny local server and opens the game in my browser; I keep that window open while
  playing and close it to stop. A plain **refresh** shows my latest change (the launcher serves
  no-cache).
- **Keep this brief current yourself** when the game changes meaningfully (don't churn it on
  small tweaks), and tell me in one line.
