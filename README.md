# Bossfights movement foundation

Browser-playable foundation for Bossfights. This build intentionally contains no boss or weapon code yet.

## Run in PowerShell

From this folder:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`.

If `py` is unavailable, use:

```powershell
python -m http.server 8000
```

## Controls

- A / D: move
- Space: jump
- Shift: sprint
- Ctrl: momentum dash
- R: reset player
- Click the rotation-test object in the middle of the arena: rotate it by 15 degrees

## Stamina

Stamina is a shared movement resource rather than a cooldown.

- maximum: 100
- sprint drains stamina continuously
- dash spends a chunk immediately
- regeneration starts after a short delay
- fully exhausting sprint briefly locks sprinting until a small amount of stamina recovers

All values are exposed in `src/movementConfig.js` for tuning.

## Movement

The floor is intentionally less grippy than the previous prototype. Releasing movement carries some horizontal velocity, while reversal acceleration remains strong enough to keep the player responsive.

Dash is implemented as a horizontal impulse added to existing velocity. It does not erase vertical velocity and does not replace current horizontal momentum. This means sprinting into a dash carries more speed, airborne dashes keep the current jump/fall arc, and dashing against current movement can be used as a hard directional correction.

Current movement features:

- walk and stamina-limited sprint
- momentum-preserving dash
- coyote time
- jump buffering
- variable jump height
- softer gravity near jump apex
- stronger fall gravity
- slightly slippery ground braking
- dash afterimages
- landing squash and dash stretch
- fixed 120 Hz simulation

## Shape system

`src/pixelShapes.js` contains reusable procedural pixel-shape primitives:

- `rectangle()`
- `polygon()`
- `group()`
- `rasterize()`

Shapes use local art-pixel coordinates while world/physics positions remain continuous floating-point values.

A group can merge child outlines into one outer silhouette or retain separate outlines. Outlines can also be disabled entirely.

The clickable rotation object in the arena combines several primitives with merged outlines. Every click changes its angle and re-rasterizes the procedural geometry before reapplying the one-pixel outline, making it a live test of the rotation pipeline.
