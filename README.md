# fallax

**Fallax** is a browser-based pixel-art boss rush game built with vanilla JavaScript and the HTML Canvas API.

The project is actively in development. The current build includes movement-focused combat, multiple weapons and abilities, equipment and shop scaffolding, music and sound effects, two playable bosses, and internal tools for building and testing sprite assets.

## Play locally

Fallax has no build step and no package dependencies.

From the repository folder, start a local HTTP server:

```powershell
py -m http.server 8000
```

If `py` is unavailable:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The `main` branch is also deployed automatically with GitHub Pages.

## Controls

Default controls can be rebound from the in-game settings menu.

| Action | Default |
| --- | --- |
| Move | A / D |
| Jump | Space |
| Sprint | Left Shift |
| Dash | F |
| Fire | Left Mouse Button |
| Weapon special | Q |
| Weapon slot 1 | 1 |
| Weapon slot 2 | 2 |
| Restart encounter | R |
| Menu / back | Esc |
| Developer console | ~ |

The dash aims toward the mouse rather than only moving horizontally.

## Movement

Player movement uses a fixed 120 Hz simulation and currently includes:

- acceleration-based ground and air movement
- stamina-limited sprinting
- mouse-directed blink dash
- coyote time
- jump buffering
- variable jump height
- softer gravity near the jump apex
- stronger fall gravity
- momentum retention
- dash invulnerability
- landing squash and dash afterimages

Movement tuning values are centralized in `src/movementConfig.js`.

## Weapons

Four weapons are currently implemented:

### Vector
A compact burst-fire projectile weapon with a rapid volley special.

### Euclid
A sustained precision beam. Its special greatly increases damage and beam width while limiting turn speed.

### Horizon
A heavy precision weapon with strong recoil. Its special launches a large homing projectile.

### Mach
A pressure-wave weapon whose attacks push the player through recoil. Its special emits powerful radial waves.

Weapons can also damage or destroy certain boss projectiles.

## Abilities

Two movement-linked abilities currently exist:

### Backfire
Dashing fires a spread of bullets behind the player in exchange for a longer dash cooldown.

### Strike
A nearly vertical upward dash that intersects a boss becomes a high-damage melee strike.

## Bosses

The first chapter, **Genesis**, currently contains two playable encounters.

### Prologue
A multi-phase boss built around movement, smashing attacks, satellites, projectile barrages, pursuit attacks, and wall impacts.

### Matrix
A projectile-focused boss with shell movement, bullet swirls, orbiting shots, burst patterns, bouncing projectiles, and compression attacks.

Boss behavior is built on the reusable state-machine helpers in `src/bosses/BossAI.js`.

## Equipment, shop, and economy

The current equipment system has slots for:

- weapons
- abilities
- extra items
- armor

Winning an encounter awards **denarius**. Currency is saved locally in the browser.

The shop is still prototype functionality and all items are currently free. Owned items and equipped loadouts are not yet persisted between page reloads.

## Audio

Fallax currently includes:

- main-menu music
- boss themes
- weapon sounds
- impact sounds
- button hover sounds

Rapid one-shot effects use fixed audio pools and minimum playback intervals to avoid creating a new audio element for every projectile.

## Visual effects and accessibility settings

The settings menu can independently disable:

- screen shake
- particles
- boss hit flashes
- impact camera feedback

Control bindings and visual-effect preferences are saved with `localStorage`.

## Internal development tools

Fallax contains several tools used during development.

### Developer console
Press `~` to open the console. It provides registered debugging and development commands.

### Sprite editor
The in-game sprite editor supports:

- polygon-based sprite construction
- materials
- layers and grouping
- snapping and symmetry
- undo / redo
- weapon pivot and muzzle markers
- JSON import / export
- animation clips and keyframes
- glow and rotation previews

Sprite drafts are stored locally in the browser.

### Weapon test room
Weapon sprite assets can be opened in a blank test room with normal movement and mouse aiming for quick iteration.

## Project structure

```text
index.html
style.css
audio/
assets/
└── fonts/

src/
├── main.js
├── PlayerController.js
├── movementConfig.js
├── equipment.js
├── Economy.js
├── AudioManager.js
├── pixelShapes.js
├── VectorWeapon.js
├── EuclidWeapon.js
├── HorizonWeapon.js
├── MachWeapon.js
├── BackfireAbility.js
├── StrikeAbility.js
├── DeveloperConsole.js
├── SpriteAssets.js
├── SpriteAnimation.js
├── SpriteEditor.js
├── WeaponTestRoom.js
└── bosses/
    ├── BossAI.js
    ├── PrologueBoss.js
    └── MatrixBoss.js
```

## Rendering and simulation

Fallax uses the Canvas 2D API with image smoothing disabled for pixel-art rendering.

Gameplay updates run on a fixed timestep:

```text
120 simulation updates per second
```

Rendering remains tied to the browser's animation frame rate.

Procedural pixel geometry is handled by `src/pixelShapes.js`, which provides reusable rectangle, polygon, grouping, outline, rotation, and rasterization helpers.

## Persistence

Currently persisted in the browser:

- denarius
- control bindings
- visual-effect settings
- sprite-editor drafts

Not yet persisted:

- owned equipment
- equipped loadouts
- encounter progression

## Development status

Fallax is an active prototype. Systems, balance, content, UI, and internal architecture are still being expanded and revised.
