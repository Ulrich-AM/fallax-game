// Bossfights movement tuning. Keep game-feel values here so they can be
// adjusted without touching collision/rendering code.
export const MOVEMENT = {
  // Normal movement vs sprinting.
  runSpeed: 390,
  sprintSpeed: 570,

  // Horizontal response. Ground braking is intentionally a little loose so
  // releasing a direction carries some momentum instead of stopping dead.
  groundAcceleration: 3600,
  groundSprintAcceleration: 3300,
  groundDeceleration: 1750,
  groundOverspeedDeceleration: 520,
  groundTurnAcceleration: 6100,

  airAcceleration: 2250,
  airDeceleration: 180,
  airOverspeedDeceleration: 90,
  airTurnAcceleration: 3300,

  // Jump shape.
  jumpSpeed: 760,
  riseGravity: 2250,
  apexGravity: 1150,
  apexVelocityWindow: 105,
  fallGravity: 3000,
  maxFallSpeed: 1250,
  jumpReleaseVelocityMultiplier: 0.50,

  // Invisible input forgiveness.
  coyoteTime: 0.10,
  jumpBufferTime: 0.11,

  // Shared stamina resource. Sprint drains over time; dash spends a chunk.
  staminaMax: 100,
  sprintDrainPerSecond: 23,
  dashStaminaCost: 26,
  staminaRegenPerSecond: 31,
  staminaRegenDelay: 0.58,
  sprintRecoverThreshold: 18,

  // Dash is an impulse, not a replacement velocity. Existing horizontal and
  // vertical momentum remain intact.
  dashImpulse: 610,
  dashMaxHorizontalSpeed: 1280,
  dashCooldown: 0.42,
  dashInvulnerability: 0.11,
  dashVisualTime: 0.115,
  dashAfterimageInterval: 0.020,

  // Presentation only.
  landingSquashTime: 0.085,
  dashStretchTime: 0.11,
};
