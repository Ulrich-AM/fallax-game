import Phaser from 'phaser';

export type GradientStop = {
  offset: number;
  color: string;
};

export function createLinearTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  stops: GradientStop[],
  direction: 'vertical' | 'horizontal' | 'diagonal' = 'vertical',
  radius = 0,
): void {
  if (scene.textures.exists(key)) return;

  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return;

  const context = texture.context;
  const gradient = direction === 'horizontal'
    ? context.createLinearGradient(0, 0, width, 0)
    : direction === 'diagonal'
      ? context.createLinearGradient(0, 0, width, height)
      : context.createLinearGradient(0, 0, 0, height);

  stops.forEach((stop) => gradient.addColorStop(stop.offset, stop.color));
  context.clearRect(0, 0, width, height);
  context.fillStyle = gradient;

  if (radius > 0) {
    roundedRect(context, 0, 0, width, height, radius);
    context.fill();
  } else {
    context.fillRect(0, 0, width, height);
  }

  texture.refresh();
}

export function createGlowTexture(
  scene: Phaser.Scene,
  key: string,
  size: number,
  color: string,
  strength = 0.78,
): void {
  if (scene.textures.exists(key)) return;

  const texture = scene.textures.createCanvas(key, size, size);
  if (!texture) return;

  const context = texture.context;
  const center = size / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, withAlpha(color, strength));
  gradient.addColorStop(0.32, withAlpha(color, strength * 0.45));
  gradient.addColorStop(1, withAlpha(color, 0));

  context.clearRect(0, 0, size, size);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  texture.refresh();
}

export function createButtonTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  topColor: string,
  bottomColor: string,
): void {
  createLinearTexture(
    scene,
    key,
    width,
    height,
    [
      { offset: 0, color: topColor },
      { offset: 0.5, color: mixColor(topColor, bottomColor, 0.42) },
      { offset: 1, color: bottomColor },
    ],
    'vertical',
    16,
  );
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${Phaser.Math.Clamp(alpha, 0, 1)})`;
}

function mixColor(first: string, second: string, amount: number): string {
  const firstValue = Number.parseInt(first.replace('#', ''), 16);
  const secondValue = Number.parseInt(second.replace('#', ''), 16);
  const t = Phaser.Math.Clamp(amount, 0, 1);
  const red = Phaser.Math.Linear((firstValue >> 16) & 255, (secondValue >> 16) & 255, t);
  const green = Phaser.Math.Linear((firstValue >> 8) & 255, (secondValue >> 8) & 255, t);
  const blue = Phaser.Math.Linear(firstValue & 255, secondValue & 255, t);
  return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
}
