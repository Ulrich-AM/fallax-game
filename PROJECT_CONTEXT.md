# Fallax Project Context Capsule

> Copy this file into a new ChatGPT/Codex conversation when continuing development.  
> Repository: `Ulrich-AM/fallax-game`  
> Current reference build: **v73**

## 1. What Fallax is

Fallax is a browser-based pixel-art boss-rush game made with vanilla JavaScript ES modules and HTML Canvas 2D. It has no package/build dependency and runs directly in the browser.

The game is built around:
- fast movement and dash timing
- guard/parry and stability management
- boss stagger/break windows
- readable attack telegraphs
- equipment/build tradeoffs
- status buildup and resistances
- bosses with strongly different combat archetypes

The simulation runs at a fixed **120 Hz**. Rendering uses Canvas 2D with image smoothing disabled.

The first chapter is **Genesis**, with three bosses:
1. Prologue
2. Matrix
3. Monolith

Monolith is the introductory **grappler archetype** and is the most recently developed boss.

## 2. Important current controls

Defaults:
- A / D: move
- Space: jump
- Left Shift: sprint
- F: dash
- Left Mouse: fire
- Right Mouse: guard / parry
- Q: weapon special
- E: secondary weapon special
- 1 / 2: weapon slots
- 3 / 4: extra slots
- R: restart encounter
- Esc: menu / back
- Backquote (~): developer console

Controls are rebindable in-game.

## 3. Core combat architecture

### `src/main.js`
Large orchestration file. It owns:
- DOM/screens
- encounter setup
- fixed-step runtime
- player/boss combat wiring
- camera and HUD
- equipment/shop navigation
- developer commands
- sprite-editor integration
- audio routing

Avoid giant refactors unless necessary. Prefer adding focused modules and small integration hooks.

### `src/PlayerController.js`
Owns:
- movement
- stamina
- jump/coyote/buffer logic
- dash and dash serial
- player damage and invulnerability
- grab escape trail
- active player status modifiers

### `src/GuardSystem.js`
Right-mouse guard/parry system.
Important: bosses often receive a guarded proxy as `context.player`, while `realPlayer` can also be supplied separately.

The guard proxy now exposes player status and dash-invulnerability data so boss grabs/status attacks can behave correctly.

### `src/BossStaggerSystem.js`
Boss stagger:
- max 100
- break window
- stagger decay
- active status modifiers can alter stagger received/decay

Do not merge Fracture and Stagger into one resource. They are related but separate systems.

### `src/bosses/BossAI.js`
Reusable boss state machine:
- named states
- timers/cooldowns
- phase thresholds
- weighted attack selection

Fatigue can modify future `attackDelay` timers through this generic layer.

## 4. Status/effect architecture

Files:
- `src/StatusEffects.js`
- `src/StatusController.js`
- `src/CombatResolver.js`
- `src/CombatModifiers.js`

Do not implement effects as bespoke fields inside individual weapons/bosses.

The intended path is:

```text
weapon / attack
    -> combat hit packet
    -> CombatResolver
    -> health / stagger / status buildup
    -> target StatusController
    -> effect definition + susceptibility/modifiers
```

Current effects:
- Fracture
- Bleed
- Burn
- Poison
- Fatigue

Current identities:
- Strike -> Fracture
- Anchor barbed special -> Bleed
- Mach waves -> Fracture
- Backfire pellets -> Burn
- Monolith Piledriver / Ground Sweep -> Fracture buildup on player
- Monolith Crawl throw / Drop Catch / Wall Toss -> Fatigue buildup on player
- Poison is implemented but intentionally does not yet have an arbitrary weapon source

Effect-related equipment stats are colored yellow in item tooltips.

### Current boss susceptibility profiles

Prologue:
- Fracture x0.90
- Bleed x1.20
- Poison x1.10
- Burn x0.90
- Fatigue x1.00

Matrix:
- Fracture x0.85
- Bleed immune
- Poison immune
- Burn x1.25
- Fatigue x0.80

Monolith:
- Fracture x1.35
- Bleed immune
- Poison immune
- Burn x0.75
- Fatigue x0.65

Carapace armor demonstrates generic equipment modifiers:
- -25% Fracture susceptibility
- +10% Poison susceptibility

## 5. Weapons / equipment

Weapons:
- Vector
- Euclid
- Horizon
- Mach
- Relay
- Parallax
- Anchor
- Kepler

Abilities:
- Backfire
- Strike

Extras:
- Turret
- Decoy

Armor:
- Carapace

`src/WeaponRuntime.js` coordinates weapon updates.
Each weapon remains in its own module.

Anchor used to contain a bespoke bleed timer/DPS system. That old implementation was removed. Barbed Anchor now applies real Bleed buildup through the shared status architecture.

As of v73, Horizon is the first weapon with two dedicated specials:
- Q: Recoil Drive arms the next shot for 2250 recoil and +18 stagger, 6.5s cooldown
- E: Overcharge arms the next shot for 2x charge time, 105 damage, +34 stagger, and increased recoil, 12s cooldown
- Q + E can be stacked for 3375 recoil and +52 stagger
- both use generic rebindable special inputs and multi-special HUD rows
- Horizon special-hit stagger is routed through CombatResolver
- the old homing white-square / "star" placeholder special was removed

Anchor's current Barbed special is intentionally unchanged in v73 and is a candidate for a later rework.

## 6. Monolith: critical current behavior

File: `src/bosses/MonolithBoss.js`

General:
- max HP: 1500
- only the HEAD is damageable
- three phases
- phase markers are drawn on the boss HP bar at 2/3 and 1/3 health

Phase 1 attacks:
- Lariat
- Command Grab -> Wall Toss
- Ground Sweep

Phase 2 adds:
- Piledriver
- Drop Catch

Phase 3:
- inherits Phase 1 + Phase 2
- faster attack-decision cadence
- adds Crawl

There is currently NO Double Slam implementation. It was only discussed.

### Command Grab / Drop Catch
The rendered hand and collision hand share the same world-space path.
The player should never teleport into an invisible hand.
Successful grabs preserve the actual contact position.

### Crawl
Crawl is the signature Phase 3 move.

Current design:
1. Monolith lifts upward.
2. He slams down onto his hands.
3. Hands use endpoint-IK-like world-space floor targets.
4. One hand plants while the other reaches forward.
5. His body trails low behind the hands and gets dragged toward the planted point.
6. Crawl can reach grounded or airborne targets.
7. Dash invulnerability can evade the Crawl reach.
8. A dashed/failed reach enters a whiff recovery instead of vacuum-grabbing.
9. If Crawl reaches the wall without catching the player:
   - wall impact
   - self-damage
   - self-stagger
   - ground shockwave
   - recovery
10. The wall-recovery path is allowed to finish even if the self-stagger causes a break.

v72ca changes:
- Crawl cadence is faster again
- body follow is stronger
- wall-impact animation gained smoother pose blending
- arms/head/body smoothly settle before normal recovery
- no hard snap into fixed wall-impact arm angles

v72d changes:
- Crawl uses longer uneven hand reaches and a stronger planted-hand pull
- the torso trails lower and surges forward during each pull instead of gliding evenly
- head/body pose now alternates between forward reach and visible strain
- a leading hand hitting the wall no longer teleports the trailing torso to the wall
- wall impact begins from the exact live Crawl pose, then recoils and settles before ordinary recovery
- R restarts clear active attack telegraphs so warning icons cannot stack across attempts

### Monolith performance
Monolith is the heaviest boss to render because of procedural sprite-group animation.

Recent performance work:
- cached group pivots
- reduced arm raster cache churn
- arm raster cache no longer multiplies unnecessarily across idle animation frames
- stable combat resolver functions avoid creating closures every 120 Hz tick
- status modifier lookups are cached
- status HUD entries are reused

Preserve these optimizations when editing Monolith.

## 7. Telegraph system

File: `src/AttackTelegraphSystem.js`

Warnings use a translucent red polygon exclamation mark and target marker.
The old dark exclamation shadow was removed.

Warnings currently cover attacks including:
- Prologue satellite punch/lunge
- Monolith Command Grab
- Piledriver
- Lariat

Warning lead time is designed to be upgradeable later.

## 8. HUD

Player main bars remain on the left.

Status effects are compact bars shown to the right of the player HUD.

Boss status effects are compact bars shown to the right of the boss HP bar.

As of v72ca:
- player and boss compact status bars use the same 75 px width
- effect colors are distinct
- boss HP has phase separator lines

## 9. Audio

File: `src/AudioManager.js`

Recent music-loop work moved looping boss/menu music to Web Audio using decoded buffers and sample-accurate looping rather than relying only on ordinary HTML audio `ended` behavior.

Do not casually replace this with a simple `audio.loop = true` implementation because that can reintroduce audible loop gaps.

## 10. Debugging commands

Useful console commands:
- `debug.attacks on`
- `debug.attacks off`
- `setphase monolith p1`
- `setphase monolith p2`
- `setphase monolith p3`
- `setphase monolith off`
- `status.add player <effect> <amount>`
- `status.add boss <effect> <amount>`
- `status.clear player`
- `status.clear boss`
- `items`
- currency commands
- sprite-editor commands

The phase override survives encounter restarts until disabled.

## 11. Sprite/rendering workflow

Important files:
- `SpriteAssets.js`
- `SpriteAnimation.js`
- `SpriteEditor.js`
- `WeaponSpriteRenderer.js`
- `pixelShapes.js`

Sprite-editor JSON is a first-class authoring format.

Monolith uses separated raster groups:
- group-3: left arm
- group-4: right arm
- group-5: head

Be careful with procedural raster cache growth. Prefer draw-time transforms/offsets over recompiling shapes every frame.

## 12. Recent version history

### v69 -> v69ac
Monolith Phase 3 development:
- Crawl introduced
- faster Phase 3 attack frequency
- warning signs expanded
- grab visuals/collision aligned
- Crawl moved from procedural shaking to planted-hand endpoint targeting
- phase debug command added
- Crawl speed tuned upward

### v70
Generic status architecture + Fracture vertical slice.

### v71 / v71a
- Bleed, Burn, Poison, Fatigue
- equipment modifiers
- Anchor migrated off bespoke Bleed
- player/boss status HUD
- status-system performance cleanup
- yellow effect stats

### v72 / v72a
- Phase 3 status integration into weapons and Monolith attacks
- Genesis boss resistance profiles
- colored status HUD
- Monolith rendering/performance optimization

### v72b
- compact status bars beside player/boss HUD
- visible boss phase separators
- sample-accurate Web Audio music loops

### v72c
- Crawl is dash-evadable
- Crawl whiff recovery
- wall-lock/endless recovery bug fixed
- Crawl wall recovery survives self-stagger break

### v72ca
- faster Crawl
- smoother Crawl -> wall-impact -> recover transition
- boss compact effect bars now exactly match player compact effect bars in size

### v72d
- more desperate hand-over-hand Crawl animation
- exact-pose wall contact without torso teleport
- improved wall-impact recoil and delayed arm settling
- restart-time telegraph cleanup prevents stacked warning marks

### v72da
- weapon sprite editor has a configurable art-pixel size
- value is saved as `render.artPixelSize`
- old assets default to 4 game pixels per art pixel
- sprite preview and weapon test room both respect the saved value

### v73
- removed Horizon's placeholder homing-star special
- Q Recoil Drive arms the next Horizon shot for extreme recoil and bonus stagger
- E Overcharge arms the next shot for extended charge, 105 damage, bonus stagger, and stronger recoil
- both specials can be stacked on one shot
- added a generic rebindable secondary weapon-special control on E
- HUD now supports multiple specials for a weapon
- Horizon special stagger uses the shared combat resolver

## 13. Development rules / invariants

When modifying Fallax:
- keep fixed simulation at 120 Hz
- preserve Monolith head-only damage
- preserve dash escape behavior on grabs
- use shared status architecture; do not add bespoke effect timers to weapons
- use hit packets / CombatResolver for new status-aware attacks when practical
- preserve raster caching/performance work
- prefer targeted changes over rewriting `main.js`
- keep telegraphs readable even when Phase 3 gets faster
- test both successful and missed grab paths
- test dash escape whenever changing a grab
- test wall recovery whenever changing Crawl
- keep effect stats visually distinct in item tooltips

## 14. Likely next directions

The game is now past the bare boss-prototype stage. Good next areas include:
- balancing status thresholds/build identities
- more armor/status tradeoff items
- boss-specific status reactions
- body-region trauma / precision systems
- attack-memory/adaptive boss weighting
- preemptive-strike mechanics during telegraph windows
- additional bosses after Monolith polish
- rework Anchor's currently barebones Barbed special without reintroducing bespoke Bleed logic

Do not assume every brainstormed mechanic is already implemented. Check the repo before coding.
