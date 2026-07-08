# Progress - running state

> **Codex maintains this file; it is the memory that carries the game between sessions.** Read it
> at the **start of every session** to recover where the build is, and **keep it updated** as you
> work (after each meaningful step, bug fixed, or decision, and before stopping). Keep it honest
> and current - a fresh session should be able to resume from this alone.
>
> `AGENTS.md` = what the game *is* (stable). This file = where the build *is right now* (volatile).
> Keep them from overlapping: durable design facts live in `AGENTS.md`, working state lives here.

## Now (current status)
Playable Phase 1 first-person introduction. The game opens on a black-screen quote, fades to a
minimal title screen, and starts outside the circus at night with visible hands, smooth movement,
sprinting, crouching, jumping, a reusable interaction system, a reusable inspection flow, an
expandable inventory UI, `E` or left-click interaction for world objects, a glowing ticket pickup
that lifts the ticket into a rotatable held-object view before keeping it in inventory and waking
the circus lights, after which the world ticket disappears into the inventory. A gate closes behind
the player once they enter. No mascot or dialogue appears in this phase. On top of that, the phase
now has a settings/pause menu, procedural footsteps, a subtle screen vignette, and auto-pause when
the tab loses focus (see "Unrequested improvements" below).

## Unrequested improvements (added on request, not in the original phase script)
- **Pause / Settings menu** (`Esc`): a gear icon (bottom-left, appears once play starts) or the
  `Esc` key opens a pause panel with live sliders for mouse sensitivity, volume, and field of
  view, plus an invert-Y toggle. Movement, look, interaction, and the phase timeline all freeze
  while paused; the pointer lock releases automatically. New file: `src/core/SettingsManager.js`.
- **Persisted settings**: sensitivity/volume/FOV/invert-Y are saved to `localStorage` (wrapped in
  try/catch, matching the AGENTS.md convention) and restored on next load.
- **Procedural footsteps**: `AudioManager.playFootstep()` synthesizes a short filtered noise burst
  per stride, varying with walk/sprint/crouch, layered under the existing wind/music/creak audio.
- **Auto-pause on tab blur**: switching tabs or minimizing now opens the pause menu automatically
  instead of letting input/audio drift while unfocused.
- **Screen vignette**: a lightweight CSS radial-gradient overlay (`#vignette`) adds depth/mood
  without any extra render cost.
These are additive and don't touch anything on the "do not implement" list (no mascot, puzzles,
mirrors, illusions, memories, or story cutscenes).

## Recently done
- Made both `E` and left mouse button interact with any world object under the crosshair, and
  changed open-window close affordances to boxed `Esc` + `Exit` buttons.
- Restored the ticket's held inspection flow: interacting picks it up into the rotatable view, and
  pressing `E` keeps it in inventory and starts the circus wake-up.
- Changed ticket storage so confirming the held ticket into inventory makes the world ticket
  disappear instead of returning to the ground.
- Fixed the gate containment so crossing into the circus seals the exit immediately, and added a
  final playable-bounds clamp so sprint/jump edge cases cannot push the player outside the map.
- Rebuilt Phase 1 around a full first-person controller with visible hands, walking, sprinting,
  crouching, jumping, camera bob, and smoother movement.
- Replaced the old intro flow with a black-screen quote, fade-in, minimal title screen, reusable
  interaction prompts, reusable inspection flow, and a lightweight inventory toggled with `B`.
- Reworked the circus environment to support the stylized ticket inspection, ticket dissolve,
  sequential light awakening, service wagon door interaction, thicker atmosphere, and gate seal.
- Fixed the opening overlay bug where the quote screen stayed visible and blocked the start of the
  game.
- Tuned the ticket inspection framing to sit farther from the camera, added the ticket to the
  inventory when committed with `E`, and moved the inspection guide text to the top-left.
- Centered the ticket more cleanly for reading, made inventory items inspectable again from the
  inventory panel, and moved the actual guide/objective text from the bottom-left into its own
  top-left guide panel.
- Changed ticket pickup so the first `E` immediately stores it in inventory, shows it front-facing
  for reading, only rotates while left mouse is held, and keeps the inventory UI to image + name.
- Restored the ticket flow so the first `E` picks it up for inspection, the second `E` saves it to
  inventory and exits, and clicking the inventory item lets the player handle it again.
- Switched held-object rotation to right mouse and changed inspection rotation to spin freely
  instead of easing back toward a fixed angle while rotating.
- Removed the right-click cancel conflict, added universal `C` keyboard closing plus `X` buttons
  for inventory and held objects, and updated open prompts to say `Press C to close`.
- Set up a local git repository with an initial checkpoint commit so we can return to earlier
  steps safely as the next phases are built.
- Seeded `AGENTS.md`, `PROGRESS.md`, launcher files, and an `assets/` folder for later phases.

## Next up (TODO)
- Wait for player feedback on the new first-person foundation before changing scope.
- If approved, Phase 2 should use the new interaction/inventory systems for the first real puzzle.
- Tune feel from playtesting: hand placement, movement speed, jump height, crouch height,
  inspection readability, and lighting intensity.
- Playtest the new pause menu (slider feel, gear button placement) and footstep volume/stride
  timing; tune to taste once heard in the browser.

## Known issues / bugs
- Not browser-playtested inside Codex; this phase was verified by code review only.
- The new first-person systems may need practical tuning once the player tests mouse feel and hand
  framing in the browser.

## Fixed
- **Interaction controls were inconsistent.** `LMB` was only wired for the ticket; now `E` and
  `LMB` both trigger the current world interaction, and the HUD shows a single `E / LMB`
  interaction row. Inventory, inspection, and pause/settings windows now show boxed `Esc` + `Exit`
  close buttons.
- **Ticket stayed visible after inventory storage.** The ticket can still be picked up and rotated
  first, but after pressing `E` to keep it in inventory, the world ticket disappears.
- **Ticket could no longer be handled before keeping it.** Interacting with the world ticket now
  picks it up into the rotatable inspection view again; `E` from that view keeps it and starts the
  wake-up sequence.
- **Ticket pickup / circus wake-up / escape issues.** The world ticket can be picked up with `E`
  or `LMB`, then confirmed into inventory from the held-object view to start visible bulb wake-up.
  The gate seal now triggers as soon as the player crosses the gate line, and movement has a final
  playable-bounds clamp so the player cannot be pushed outside the map.
- **Re-inspecting the stored ticket crashed the game.** The inventory preview is a scene-detached
  clone (`ticketTemplate.clone()`), so it has no real parent. Confirming or closing that inspection
  called `InspectionSystem.restore()`, which does `originalParent.attach(object)` — with
  `originalParent === null` that throws inside the animation loop and silently freezes the whole
  game, which is why the item looked like it could never be handled a second time. Fixed by using
  `discard()` (which doesn't need a parent) for the stored-ticket flow instead of `restore()`, in
  `src/systems/PhaseOneController.js`.

## Esc is now the universal close key
Per feedback: `Esc` now closes whatever's currently open — the pause/settings menu, an active
inspection, or the inventory — with one consistent press, instead of different panels using
different keys. Every panel that can be closed now shows a boxed `Esc` key beside `Exit`, so the close action is
never hidden. `C` still works as a legacy alias for closing inspection/inventory. The persistent
bottom-left control-hints chip also now reads "Esc — Pause / Close" to reflect this.

## Visual theme pass (per reference images)
Reskinned the HUD/chrome to match the warm marquee-and-curtain reference screenshots: swapped the
cool blue-black panel palette for a warm brass/red-curtain one (`style.css` CSS variables + all
panel/chip backgrounds and borders), renamed the guide label to "Objective" to match the reference
HUD, and added an always-on bottom-left control-hints chip panel (white key chips + labels) showing
the game's real bindings (WASD, Shift, Ctrl, E/LMB, B, Esc) in the same style as the reference. Left
the 3D lighting/materials as-is for now since they already lean warm (amber bulbs, gold accents);
happy to push the environment itself (curtains, marquee signage, wood crates) further toward the
reference art next if that's the direction to take Phase 2's rooms.

## Decisions & deferred ideas
- Chose a no-build-tool three.js setup pinned to `0.185.1` for easy expansion and quick iteration.
- Deferred the mascot, illusion puzzles, memories, mirrors, escape-room structure, and story
  cutscenes to later phases by request.
- Built the ticket, door, inspection, and inventory as reusable systems so later puzzle content
  can plug into this phase instead of replacing it.

## How to run
Double-click the `play` launcher - `play.command` (Mac) or `play.bat` (Windows). It starts a tiny
local server and opens the game in the browser; leave that window open while playing, close it to
stop. A plain refresh shows the latest change (the launcher serves no-cache).


