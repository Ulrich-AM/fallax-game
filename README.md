# Fallax

**Fallax** is a browser-based pixel-art boss-rush game built with vanilla JavaScript ES modules and the HTML Canvas 2D API.

Current reference build: **v75a**

The game focuses on fast movement, guard/parry timing, boss stagger windows, readable attack telegraphs, equipment tradeoffs, and a shared status-effect system. The first chapter, **Genesis**, currently contains three bosses: **Prologue**, **Matrix**, and **Monolith**.

For a deeper development handoff and current architecture notes, see **PROJECT_CONTEXT.md**.

## Running the game

Fallax has no build step and no package dependencies.

From the repository folder:

~~~powershell
py -m http.server 8000
~~~

or:

~~~powershell
python -m http.server 8000
~~~

Then open:

~~~text
http://localhost:8000
~~~

The **main** branch is also deployed automatically through GitHub Pages.

## Controls

Controls can be rebound in the in-game settings menu.

| Action | Default |
| --- | --- |
| Move | A / D |
| Jump | Space |
| Sprint | Left Shift |
| Dash | F |
| Fire | Left Mouse |
| Guard / parry | Right Mouse |
| Weapon special | Q |
| Secondary weapon special | E |
| Weapon slots | 1 / 2 |
| Extra slots | 3 / 4 |
| Restart encounter | R |
| Menu / back | Esc |
| Developer console | ~ |

The dash aims toward the mouse and grants a short invulnerability window.

## Simulation and rendering

Gameplay runs on a fixed:

~~~text
120 Hz simulation
~~~

Rendering is tied to the browser animation frame rate.

The game uses Canvas 2D with image smoothing disabled. Pixel-art sprites are built from procedural geometry and rasterized/cached for performance.

Movement tuning is centralized in **src/movementConfig.js**.

## Combat systems

### Movement

The player currently has:
- acceleration-based ground and air movement
- sprinting and stamina
- jump buffering and coyote time
- variable jump height
- softer apex gravity / stronger fall gravity
- mouse-directed dash
- dash invulnerability
- momentum retention
- landing squash and dash afterimages

### Guard / parry

**src/GuardSystem.js** handles right-mouse guarding, parry timing, stability, guard breaks, and incoming rush interception.

Bosses may receive a guarded proxy instead of the raw player object, so boss code should respect the combat context instead of assuming every target is a plain PlayerController.

### Boss stagger

**src/BossStaggerSystem.js** tracks stagger buildup, decay, break windows, and status modifiers.

Stagger and Fracture are separate systems:
- **Stagger** is an immediate combat resource.
- **Fracture** is a status buildup that can make later stagger more effective.

## Status effects

The shared status architecture is implemented through:

~~~text
src/StatusEffects.js
src/StatusController.js
src/CombatResolver.js
src/CombatModifiers.js
~~~

Current effects:
- **Fracture**
- **Bleed**
- **Burn**
- **Poison**
- **Fatigue**

Effects use buildup, thresholds, active durations, susceptibility/resistance, and reusable modifiers instead of weapon-specific timers.

Current normal-game examples:
- Strike -> Fracture
- Anchor impact / Ripcord -> Bleed
- Fukiya darts / Needleburst -> Poison
- Vienna pulses -> Bleed; Barrage -> Bleed + Burn
- Kismet homing squares -> Fatigue + Burn; Convergence -> Burn
- Mach -> Fracture
- Backfire -> Burn
- Monolith heavy slams -> Fracture on the player
- Monolith throws/grabs -> Fatigue on the player

Status-related item stats are colored yellow in tooltips.

## Equipment

Current weapons:
- Vector
- Magnitude
- Euclid
- Horizon
- Vienna
- Kismet
- Mach
- Relay
- Parallax
- Anchor
- Fukiya
- Kepler

Anchor now applies a small amount of Bleed buildup on every successful hook impact. Its Q special, **Ripcord**, is contextual: ripping a boss anchor free deals tension-scaled damage, Bleed buildup, and stagger, while using it on a surface anchor converts the tether into a strong movement impulse.

Fukiya is a Poison-focused blowgun:
- 12 damage every 0.58s
- +22 Poison buildup per normal dart
- **Q, Needleburst:** seven low-damage darts in a short spread burst, each adding +18 Poison buildup
- 10s special cooldown
- shop price: 460 denarii

Magnitude is a faster Vector-style beginner weapon:
- same 4-damage square bullets and trail/fade behavior as Vector
- 0.30s burst cooldown and 1360 projectile speed
- **Q, Machine Gun:** automatic fire for 3 seconds with heavy cumulative recoil
- shop price: 220 denarii

Vienna is a heavy three-pulse rifle:
- three 30-damage laser pulses, each adding +28 Bleed buildup
- 2.6s reload after a normal burst
- **Q, Barrage:** three wider 55-damage pulses spaced 0.5s apart, each adding Bleed and Burn
- shop price: 680 denarii

Kismet is an end-game homing weapon:
- normal fire launches four homing glowing squares with Fatigue + Burn buildup and high recoil
- **Q, Fated Orbit:** adds 3 harmless orbiters around the boss, up to 15
- **E, Convergence:** pushes stored orbiters outward and collapses them onto a valid boss hit region for a large collective hit
- Convergence damage scales gently with stored orbiter count instead of multiplying sharply
- shop price: 1250 denarii

Horizon is the first weapon with two dedicated specials:
- **Q, Recoil Drive:** arms the next shot with much stronger recoil and +18 stagger. Cooldown: 6.5s.
- **E, Overcharge:** arms the next shot with a 2x charge time, 105 damage, +34 stagger, and increased recoil. Cooldown: 12s.
- Q and E can be armed together, producing 3375 recoil and +52 stagger on the same shot.

The secondary-special input is generic and rebindable, so later weapons can also use E without weapon-specific key handling.

Abilities:
- Backfire
- Strike

Extras:
- Turret
- Decoy

Armor:
- Carapace

The equipment architecture supports outgoing status buildup modifiers and incoming status susceptibility modifiers.

Example:

~~~text
Carapace
-25% Fracture susceptibility
+10% Poison susceptibility
~~~

## Bosses

Boss behavior is built on the reusable state machine in **src/bosses/BossAI.js**.

### Prologue

A multi-phase movement/pursuit boss with:
- smashing attacks
- satellites
- projectile barrages
- pursuit/rush attacks
- wall interactions

Status profile:
- slightly resistant to Fracture
- vulnerable to Bleed and Poison
- mildly resistant to Burn
- neutral to Fatigue

### Matrix

A projectile-focused boss with:
- shell movement
- orbiting projectiles
- bullet swirls
- bursts
- bouncing projectiles
- compression attacks

Status profile:
- resistant to Fracture
- immune to Bleed
- immune to Poison
- vulnerable to Burn
- resistant to Fatigue

### Monolith

The introductory **grappler archetype**.

Important rules:
- 1500 max HP
- only the **head** is damageable
- three phases
- phase separators are visible on the boss HP bar

Phase 1:
- Lariat
- Command Grab -> Wall Toss
- Ground Sweep

Phase 2 adds:
- Piledriver
- Drop Catch

Phase 3:
- faster attack-decision cadence
- all earlier attacks
- Crawl

#### Crawl

Crawl uses endpoint-IK-like planted hand targets:
- hands target real floor points
- one hand plants while the other reaches forward
- Monolith's body trails low behind the hands
- the body is dragged toward the planted point
- Crawl can threaten grounded and airborne players
- dash invulnerability can evade the reach
- a dash/failed catch enters a whiff recovery
- a full miss ends in a wall crash and shockwave
- the wall crash deals small self-damage and self-stagger

As of v72d, Crawl has a more uneven, desperate hauling cadence: the hands lunge farther ahead, each plant yanks the trailing torso forward, and the head visibly strains through the pull. Wall impact now preserves the real contact pose instead of teleporting the torso when a leading hand reaches the wall first.

## Telegraphs

**src/AttackTelegraphSystem.js** draws translucent red polygon warning marks and target indicators.

Telegraphs are used for sudden/committed attacks such as:
- Prologue satellite punch
- Monolith Command Grab
- Piledriver
- Lariat

The warning system is designed so future upgrades can increase warning lead time without rewriting attacks.

## HUD

The HUD currently includes:
- player health
- stamina
- guard stability
- weapon special information
- compact player status bars
- boss HP
- boss stagger
- boss phase label
- boss phase separator lines
- compact boss status bars

Player and boss compact status bars use the same size and are placed to the right of their main bar groups to reduce clutter.

## Audio

**src/AudioManager.js** handles:
- menu music
- boss themes
- weapon sounds
- impact sounds
- UI audio

Music looping uses decoded Web Audio buffers and sample-accurate loops to avoid the audible gaps caused by ordinary HTML-audio looping.

Rapid one-shot effects use reusable playback pools / throttling instead of continuously creating new audio elements.

## Developer console

Press **~** to open the console.

Useful commands include:

~~~text
help
debug.attacks on
debug.attacks off

setphase monolith p1
setphase monolith p2
setphase monolith p3
setphase monolith off

status.add player bleed 100
status.add boss fracture 100
status.clear player
status.clear boss

items
give.denarii
set.denarii
give.telos
set.telos
~~~

**setphase** can be used with bosses that expose the requested phase. Phase overrides persist across encounter restarts until disabled.

## Internal development tools

### Sprite editor

The in-game sprite editor supports:
- polygon-based construction
- materials
- layers/groups
- snapping and symmetry
- undo / redo
- weapon markers
- JSON import/export
- animation clips and keyframes
- glow and rotation previews

Sprite-editor JSON is treated as a first-class authoring format.

### Weapon test room

Weapon sprite assets can be opened in a blank movement/aiming room for iteration without running a full boss encounter.

## Project architecture

~~~text
index.html
style.css
audio/
assets/

src/
├── main.js
├── PlayerController.js
├── movementConfig.js
├── GuardSystem.js
├── BossStaggerSystem.js
│
├── StatusEffects.js
├── StatusController.js
├── CombatResolver.js
├── CombatModifiers.js
│
├── equipment.js
├── Economy.js
├── ExtraSystem.js
│
├── WeaponRuntime.js
├── VectorWeapon.js
├── MagnitudeWeapon.js
├── EuclidWeapon.js
├── HorizonWeapon.js
├── ViennaWeapon.js
├── KismetWeapon.js
├── MachWeapon.js
├── RelayWeapon.js
├── ParallaxWeapon.js
├── AnchorWeapon.js
├── FukiyaWeapon.js
├── KeplerWeapon.js
├── BackfireAbility.js
├── StrikeAbility.js
│
├── AttackTelegraphSystem.js
├── AudioManager.js
├── DeveloperConsole.js
│
├── pixelShapes.js
├── SpriteAssets.js
├── SpriteAnimation.js
├── SpriteEditor.js
├── WeaponSpriteRenderer.js
├── WeaponTestRoom.js
│
└── bosses/
    ├── BossAI.js
    ├── PrologueBoss.js
    ├── MatrixBoss.js
    └── MonolithBoss.js
~~~

### Architectural guidance

- Keep the fixed 120 Hz simulation.
- Prefer focused modules over making **main.js** larger.
- Use CombatResolver / StatusController for status-aware attacks.
- Do not reintroduce bespoke per-weapon Bleed/Burn/etc. timers.
- Preserve Monolith's head-only damage rule.
- Preserve dash escape behavior for grabs.
- Preserve Monolith raster caches and recent render-performance work.
- Test successful grab, whiff, dash escape, and wall-miss paths separately.
- Keep telegraphs readable when tuning attack speed.

## Recent development milestones

### v70
Introduced the generic status architecture and Fracture vertical slice.

### v71 / v71a
Added Bleed, Burn, Poison, Fatigue, equipment modifiers, Anchor's real shared Bleed, status HUD, and status-system performance cleanup.

### v72 / v72a
Integrated effects into more weapons/boss attacks, added Genesis resistance profiles, and optimized Monolith rendering/combat hot paths.

### v72b
Added compact status HUD layouts, boss HP phase separators, and sample-accurate Web Audio music loops.

### v72c
Fixed Crawl wall-lock recovery and made Crawl grabs dash-evadable with whiff recovery.

### v72ca
Increased Crawl speed again, smoothed the Crawl wall-impact recovery transition, and standardized boss/player compact status bar sizing.

### v72d
Made Crawl read more like a desperate hand-over-hand pursuit, removed the torso snap when a leading hand hits the wall first, improved the wall-impact recoil/settle blend, and cleared lingering attack telegraphs on R restarts so warning marks cannot stack across attempts.

### v72da
Added a per-weapon sprite-editor pixel-size setting. Weapon JSON now stores `render.artPixelSize` with a backwards-compatible default of 4, and both the game preview and weapon test room respect the chosen value.

### v73
Replaced Horizon's placeholder homing-star special with a dual-special kit. Q now arms Recoil Drive, E arms Overcharge, both can stack on the same shot, Horizon special hits use the shared combat resolver for stagger, and the control/HUD architecture now supports a generic rebindable secondary weapon special.

### v74
Reworked Anchor so normal hook impacts always add light Bleed buildup and replaced the old armed Barbed shot with Ripcord, a tether-state special that scales off boss-anchor tension or slingshots the player from surface anchors. Added Fukiya using the authored sprite asset as a Poison weapon with a seven-dart Needleburst special and a 460-denarii shop price.

### v74a
Cleaned up equipment tooltips. Normal stats keep the neutral palette, special-move labels are red, and quantitative effect values on special rows are yellow. Redundant Q/E prefixes and duplicate special/cooldown rows were removed from weapon stat summaries without changing gameplay values.

### v74b
Rewrote equipment descriptions around player-facing identity and use cases instead of implementation details. Exact mechanics remain in stat rows.

### v74ba
Simplified equipment descriptions again. They now use plain, straightforward wording with less marketing-style language, while leaving the stat rows and gameplay values unchanged.

### v75
Added Magnitude, Vienna, and Kismet from user-authored sprite JSON. Magnitude is a faster Vector-style beginner weapon with a three-second Machine Gun special. Vienna fires three heavy Bleed pulses and has a wider Bleed+Burn Barrage. Kismet fires homing Fatigue+Burn squares, stores up to 15 Q orbiters, and uses E Convergence for a gently scaling collective hit.

### v75a
Fixed the new weapons to use their authored sprite pivots directly instead of adding extra runtime orbit offsets. Kismet now fires a continuous inaccurate homing stream, launches Q orbiters from the muzzle, spaces stored orbiters evenly around a wider ring, expands farther during Convergence, and shows fast white expanding-ring impacts.

## Development status

Fallax is still actively evolving, but it is no longer only a bare boss prototype. The current focus is on making combat systems interact meaningfully: boss archetypes, statuses, equipment tradeoffs, movement, parries, stagger, and telegraph timing.

Before implementing a brainstormed feature, verify whether it already exists in the repository. Many older plans have changed during iteration.
