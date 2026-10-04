# Fallax Project Context Capsule

> Copy this file into a new ChatGPT/Codex conversation when continuing development.  
> Repository: `Ulrich-AM/fallax-game`  
> Current reference build: **v75b**

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
- Anchor impact / Ripcord -> Bleed
- Mach waves -> Fracture
- Backfire pellets -> Burn
- Vienna pulses -> Bleed
- Vienna Barrage -> Bleed + Burn
- Kismet homing squares -> Fatigue + Burn
- Kismet Convergence -> Burn
- Monolith Piledriver / Ground Sweep -> Fracture buildup on player
- Monolith Crawl throw / Drop Catch / Wall Toss -> Fatigue buildup on player
- Fukiya darts / Needleburst -> Poison

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

Anchor used to contain a bespoke bleed timer/DPS system. That old implementation was removed. As of v74, every successful Anchor hook impact applies +12 real Bleed buildup through CombatResolver. The old armed Barbed-shot special was removed.

Anchor Q is now **Ripcord**:
- requires an attached anchor
- boss anchor: 24-54 damage, +55 to +120 Bleed buildup, and +10 to +32 stagger depending on tether tension
- surface anchor: converts the tether into a 1050-1600 movement impulse toward the anchor
- 9s cooldown
- special resolves through the shared combat hit path when damaging a boss

Fukiya was added in v74 as the first dedicated Poison weapon:
- user-authored sprite asset, scale 0.4
- 12 damage per normal dart, 0.58s fire cooldown
- +22 Poison buildup per normal dart
- Q Needleburst fires seven darts with 5 damage and +18 Poison buildup each
- Needleburst cooldown: 10s
- shop price: 460 denarii
- darts respect boss hit tests, so Monolith remains head-only
- Poison still follows boss susceptibility profiles; Matrix and Monolith remain immune

As of v75, three more weapons exist:

Magnitude:
- user-authored sprite with asset pivot [0,0], muzzle (9,-1), artPixelSize 4
- same 4-damage square projectile look/trail/fade behavior as Vector
- projectile speed 1360, burst cooldown 0.30s
- Q Machine Gun auto-fires for 3s with strong cumulative recoil
- shop price 220 denarii

Vienna:
- user-authored sprite with asset pivot [0,0], muzzle (33,-2), artPixelSize 4
- normal attack is a locked three-pulse laser burst
- 30 damage and +28 Bleed buildup per normal pulse
- 2.6s reload after a normal burst
- Q Barrage fires three wider pulses at 0.5s spacing
- Barrage pulse: 55 damage, +42 Bleed, +28 Burn, high recoil
- shop price 680 denarii

Kismet:
- user-authored sprite with asset pivot [0,0], group-1 pivot [4,2], muzzle (21,0), scale 1.4, artPixelSize 3
- normal fire is continuous: 5 damage every 0.11s
- each normal bullet adds +3 Fatigue and +1 Burn
- bullets start with high inaccuracy, home for only their first 1.0s, then keep their current trajectory
- normal bullet size matches Vector's current rendered bullet size and uses a Vector-style ghost-square trail
- normal fire has cumulative recoil
- Q Fated Orbit visibly launches 3 larger squares from the weapon muzzle, capped at 15 stored orbiters
- orbiters rearrange smoothly toward equal angular spacing as the formation changes
- normal orbit radius is 185; E Convergence expands them to about 340 before collapsing
- E Convergence collapses into a valid target hit region
- Convergence direct damage = 50 + 4.5 per stored orbiter
- Convergence Burn buildup = 10 + 1.5 per stored orbiter
- Q cooldown 6.5s, E cooldown 10.5s
- Convergence uses boss hitTest to preserve Monolith head-only damage
- Kismet impact rings are spawned through the shared EffectsLibrary
- shop price 1250 denarii

Uploaded sprite pivot/group-pivot/muzzle/scale/artPixelSize values are preserved in the weapon modules rather than being recentered.

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

### v74
- Anchor normal hook impacts now add +12 Bleed buildup
- replaced Anchor's old Barbed next-shot modifier with contextual Ripcord
- boss Ripcord scales damage, Bleed, and stagger with tether tension
- surface Ripcord provides a strong reel/slingshot movement impulse
- added Fukiya from the user-authored sprite asset
- Fukiya applies Poison buildup with normal darts
- Q Needleburst fires a seven-dart toxic spread
- Fukiya price set to 460 denarii
- Fukiya damage/status hits use CombatResolver and respect boss hitTest rules

### v74a
- equipment tooltip special-move labels use red
- quantitative effect values on special rows use yellow
- ordinary stats remain neutral
- Horizon tooltip is condensed to shot damage, charge/cooldown, Recoil Drive, and Overcharge
- redundant Q/E prefixes and duplicate special cooldown/effect rows were removed from weapon stat summaries
- no gameplay balance values changed

### v74b
- rewrote all equipment descriptions for players rather than developers
- descriptions emphasize playstyle, decision-making, and item identity
- exact numeric mechanics remain in stat rows instead of prose
- no gameplay balance values changed

### v74ba
- simplified all equipment descriptions again
- wording is intentionally plain and direct rather than polished or marketing-like
- descriptions mostly state what the item does in one sentence
- stat rows still hold the exact numbers
- no gameplay balance values changed

### v75
- added Magnitude, Vienna, and Kismet
- Magnitude is a faster Vector-style beginner weapon with a 3s Machine Gun special
- Vienna uses a three-pulse Bleed burst and a wider Bleed+Burn Barrage
- Kismet Q stores 3 orbiters per use up to 15
- Kismet E performs a gently scaling outward-then-inward Convergence hit
- Kismet Convergence resolves a valid boss hit region before damage, preserving Monolith head-only behavior
- prices: Magnitude 220, Vienna 680, Kismet 1250 denarii

### v75a
- corrected Magnitude, Vienna, and Kismet runtime anchoring so player position is the world anchor and JSON sprite pivots determine the authored offset
- removed obsolete runtime orbit offsets from Magnitude and Vienna; Kismet no longer uses one either
- Kismet normal fire became continuous and highly inaccurate before homing
- Kismet Q orbiters launch visibly from the authored muzzle instead of appearing around the boss
- orbiters rearrange toward equal angular spacing whenever the stored count changes
- Convergence still validates the boss hit region before damage

### v75b
- Kismet normal bullet size now matches Vector's current rendered square size
- Kismet normal bullets use Vector-style trailing ghost squares
- homing ends after 1.0s; surviving bullets continue along their last heading
- Q orbiter arrival uses an additional smooth blend into the rotating formation
- normal Kismet orbit radius increased to 185; Convergence outer radius increased to 340
- added src/EffectsLibrary.js as the shared pooled visual-effect registry
- Kismet's bespoke impactRings array/update/draw code was removed
- Kismet hit effects now call effects.spawn('impact-ring', ...)
- built-in EffectsLibrary effects currently include impact-ring and flare-glow
- EffectsLibrary has world and screen layers; true full-frame filters/distortions still require a future offscreen compositing pass
- generic reusable visual effects should go in EffectsLibrary rather than individual weapon classes

## 13. Development rules / invariants

When modifying Fallax:
- keep fixed simulation at 120 Hz
- preserve Monolith head-only damage
- preserve dash escape behavior on grabs
- use shared status architecture; do not add bespoke effect timers to weapons
- use hit packets / CombatResolver for new status-aware attacks when practical
- preserve raster caching/performance work
- put reusable visual effects in EffectsLibrary instead of duplicating per-weapon effect systems
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
- tune Fukiya Poison buildup / Needleburst after browser playtesting
- tune Anchor Ripcord tension scaling after browser playtesting
- tune Magnitude Machine Gun recoil after browser playtesting
- tune Vienna reload/Barrage damage after browser playtesting
- tune Kismet orbiter cap, Convergence scaling, and recoil after browser playtesting
- expand EffectsLibrary before the custom Genesis level/map-editor pass
- likely future effects: lensing-style distortion, stronger reusable flare glows, shockwaves, and screen impact-frame effects
- custom Genesis level system / map editor is planned but not implemented

Do not assume every brainstormed mechanic is already implemented. Check the repo before coding.
