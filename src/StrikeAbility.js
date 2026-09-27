function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function degToRad(value) {
  return value * Math.PI / 180;
}

export class StrikeAbility {
  constructor() {
    this.name = 'Strike';
    this.damage = 55;
    this.upwardTolerance =
      degToRad(15);

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

  isUpwardDash(dash) {
    if (!dash) return false;

    const upwardDot =
      clamp(
        -dash.ny,
        -1,
        1,
      );

    const angle =
      Math.acos(upwardDot);

    return (
      dash.ny < 0 &&
      angle <=
        this.upwardTolerance
    );
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
      target.dead ||
      !this.isUpwardDash(
        player.lastDash,
      )
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

    const hit =
      target.takeDamage?.(
        this.damage,
      );

    if (hit === false) {
      return false;
    }

    this.hitSerial++;

    this.lastHit = {
      x: point.x,
      y: point.y,
      serial:
        this.hitSerial,
    };

    return true;
  }
}
