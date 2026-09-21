# Fallax

A shape-driven boss rush built around one rule:

> Simple shapes, complex effects and mechanics.

The current vertical slice contains the gray-square player, platforming, a long directional dash, the rapid-fire **Vector**, a menu-driven loadout and bossfight flow, reactive camera movement, smooth generated lighting, and the full two-phase **Prologue** encounter.

## Stack

- TypeScript
- Phaser 3.90.0
- Vite

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Menu

- **Bossfights:** select Prologue and begin the encounter
- **Inventory:** inspect the equipped Vector and reserved future slots
- **Settings:** independently toggle music and effects

## Controls

| Action | Control |
| --- | --- |
| Move | `A` / `D` or arrow keys |
| Jump | `Space`, `W`, or Up |
| Long dash | `Shift` |
| Aim | Mouse |
| Fire Vector | Left mouse button or `J` |
| Return to menu | `Escape` |
| Retry after defeat | `R` |
| Return to menu after victory or defeat | `Enter` |

## Current loadout

**Vector** is the only equipped weapon. It fires accurate projectiles very quickly, but each projectile deals little damage. The secondary slot remains locked and the three special slots remain empty until those systems are designed.

## Prologue

### Phase I

- **Swing:** the inner white square recoils and thrusts toward the player's predicted position.
- **Crash:** Prologue rises, anticipates, and smashes onto the floor or the platform supporting the player.
- **Slide:** when the player is grounded, Prologue crashes and sweeps toward the nearest wall.

### Phase II

- **Swing II:** a faster version of Swing.
- **Rotation:** the white square extends outward and accelerates around Prologue.
- **Crash II:** each impact sends shockwaves along the surface that was struck.
- **Slide II:** Prologue ricochets around the room like a Pong ball.

All attacks use anticipation, action, and recovery. Impacts add squash and stretch, flashes, additive glow, afterimages, and camera shake.

## Visual system

Fallax generates smooth gradient textures at runtime for the player, boss, platforms, menus, health bars, projectiles, and arena. The same procedural texture helpers generate radial glow sprites that can be reused for attacks, bullets, interfaces, and future effects.

## Audio organization

```text
public/audio/
├─ themes/
│  └─ bossfight-prologue.mp3
└─ effects/
   └─ vector-shot.mp3
```

The Prologue theme loops during the fight. Vector uses its dedicated shooting effect with slight pitch variation so rapid fire sounds less repetitive.
