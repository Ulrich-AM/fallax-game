# Fallax

A shape-driven boss rush built around one rule:

> Simple shapes, complex effects and mechanics.

This first vertical slice contains the gray-square player, platforming, a directional dash, switchable primary and secondary weapons, three future special slots, reactive camera movement, and the full two-phase **Prologue** boss.

## Stack

- TypeScript
- Phaser 3.90.0
- Vite

Phaser 3.90 is pinned deliberately so the prototype stays on the established Phaser 3 API while the project architecture is still taking shape.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Controls

| Action | Control |
| --- | --- |
| Move | `A` / `D` or arrow keys |
| Jump | `Space`, `W`, or Up |
| Dash | `Shift` |
| Aim | Mouse |
| Primary weapon | Left mouse button |
| Secondary weapon | Right mouse button |
| Cycle primary | `Q` |
| Cycle secondary | `E` |
| Restart after victory/defeat | `R` |

## Current loadout

**Primary**

- Quadder: rapid, low-damage square projectiles with mild spread
- Needle: slower, precise, higher-damage shots

**Secondary**

- Ramshot: large heavy projectile with recoil
- Scatter: six-projectile spread with recoil

The three special slots are present in the HUD but intentionally empty until their mechanics are designed.

## Prologue

### Phase I

- **Swing:** the inner white square recoils, telegraphs a line, and thrusts toward the player's predicted position.
- **Crash:** Prologue rises, anticipates, and smashes onto the floor or the platform supporting the player.
- **Slide:** when the player is grounded, Prologue crashes and sweeps toward the nearest wall.

### Phase II

- **Swing II:** a faster version of Swing.
- **Rotation:** the white square extends outward and accelerates around Prologue.
- **Crash II:** each impact sends shockwaves along the surface that was struck.
- **Slide II:** Prologue charges into a wall and ricochets around the room like a Pong ball.

All attacks use anticipation, action, and recovery states. Impacts add squash and stretch, debris, flashes, afterimages, and camera shake.

## Boss soundtrack

The game expects the supplied track at:

```text
public/audio/623104_Bossfight---Milky-Ways.mp3
```

The audio file is intentionally not committed. The track's Newgrounds licensing terms say to contact the artist before using it in a project. Keep your local copy at the path above for private development, and obtain permission before redistributing it with the public game.
