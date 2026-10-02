function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export class StrikeAbility {
  constructor() {
    this.name = 'Strike';
    this.damage = 55;
    this.stagger = 24;
    this.fractureBuildup = 28;

    this.lastDashSerial = 0;
    this.hitSerial = 0;
    this.lastHit = null;
  }

  reset(player) {
    this.lastDashSerial =
      player?.dashSerial ?? 0;

    this.hitSerial = 0;
    this.lastHit = null;
  }

  closestPointOnDash(
    dash,
    target,
  ) {
    const dx =
      dash.endX -
      dash.startX;

    const dy =
      dash.endY -
      dash.startY;

    const lengthSquared =
      dx * dx +
      dy * dy;

    if (
      lengthSquared <=
      0.000001
    ) {
      return {
        x: dash.startX,
        y: dash.startY,
      };
    }

    const t =
      clamp(
        (
          (
            target.x -
            dash.startX
          ) *
            dx +
          (
            target.y -
            dash.startY
          ) *
            dy
        ) /
          lengthSquared,
        0,
        1,
      );

    return {
      x:
        dash.startX +
        dx * t,
      y:
        dash.startY +
        dy * t,
    };
  }

  update(
    player,
    target,
    equipped,
    {
      resolveHit = null,
    } = {},
  ) {
    if (!player) return false;

    if (
      player.dashSerial ===
      this.lastDashSerial
    ) {
      return false;
    }

    this.lastDashSerial =
      player.dashSerial;

    if (
      !equipped ||
      !player.lastDash ||
      !target ||
      target.dead
    ) {
      return false;
    }

    const point =
      this.closestPointOnDash(
        player.lastDash,
        target,
      );

    const strikeRadius =
      Math.max(
        player.w,
        player.h,
      ) * 0.46;

    if (
      !target.hitTest?.(
        point.x,
        point.y,
        strikeRadius,
      )
    ) {
      return false;
    }

    const result =
      typeof resolveHit ===
        'function'
        ? resolveHit(
            target,
            {
              damage:
                this.damage,
              stagger:
                this.stagger,
              buildup: {
                fracture:
                  this.fractureBuildup,
              },
              source:
                'strike',
            },
          )
        : {
            hit:
              target.takeDamage?.(
                this.damage,
              ) !== false,
          };

    if (
      result?.hit === false
    ) {
      return false;
    }

    this.hitSerial++;

    this.lastHit = {
      x: point.x,
      y: point.y,
      serial:
        this.hitSerial,
      combatResult:
        result ?? null,
    };

    return true;
  }
}
