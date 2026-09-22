import Phaser from 'phaser';

export type GradientStop = {
  offset: number;
  color: string;
};

function solidColor(stops: GradientStop[]): string {
  if (stops.length === 0) return '#ffffff';
  return stops[Math.floor((stops.length - 1) / 2)].color;
}

export function createLinearTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  stops: GradientStop[],
  _direction: 'vertical' | 'horizontal' | 'diagonal' = 'vertical',
  _radius = 0,
): void {
  if (scene.textures.exists(key)) return;

  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return;

  const context = texture.context;
  context.clearRect(0, 0, width, height);
  context.fillStyle = solidColor(stops);
  context.fillRect(0, 0, width, height);
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
  context.clearRect(0, 0, size, size);
  context.fillStyle = withAlpha(color, strength);
  context.fillRect(0, 0, size, size);
  texture.refresh();
}

export function createButtonTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  topColor: string,
  _bottomColor: string,
): void {
  createLinearTexture(
    scene,
    key,
    width,
    height,
    [{ offset: 0, color: topColor }],
    'vertical',
    0,
  );
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${Phaser.Math.Clamp(alpha, 0, 1)})`;
}
