import Phaser from 'phaser';
import { createButtonTexture, createGlowTexture, createLinearTexture } from './VisualFactory';

type MenuPage = 'home' | 'bossfights' | 'inventory' | 'settings';

export class MenuScene extends Phaser.Scene {
  private pageObjects: Phaser.GameObjects.GameObject[] = [];
  private currentPage: MenuPage = 'home';
  private musicEnabled = true;
  private effectsEnabled = true;

  constructor() {
    super('menu');
  }

  create(): void {
    this.musicEnabled = this.registry.get('musicEnabled') !== false;
    this.effectsEnabled = this.registry.get('effectsEnabled') !== false;
    this.createTextures();
    this.cameras.main.setBackgroundColor('#090b10');

    this.add.image(640, 360, 'menu-background').setDisplaySize(1280, 720).setScrollFactor(0);
    const glow = this.add.image(640, 220, 'white-glow')
      .setDisplaySize(560, 112)
      .setPosition(648, 226)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.NORMAL);

    this.add.text(640, 114, 'FALLAX', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '86px',
      fontStyle: '700',
      color: '#f5f7fb',
      letterSpacing: 20,
    }).setOrigin(0.5).setShadow(5, 6, '#05070a', 0, false, true);

    this.add.text(640, 172, 'SIMPLE SHAPES / COMPLEX FIGHTS', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '15px',
      color: '#8f99aa',
      letterSpacing: 5,
    }).setOrigin(0.5);

    this.createAmbientShapes();
    this.showPage('home');

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.currentPage !== 'home') this.showPage('home');
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const offsetX = (pointer.x - 640) * 0.012;
      const offsetY = (pointer.y - 360) * 0.008;
      this.tweens.add({
        targets: glow,
        x: 640 + offsetX,
        y: 220 + offsetY,
        duration: 350,
        ease: 'Sine.Out',
      });
    });
  }

  private createTextures(): void {
    createLinearTexture(this, 'menu-background', 1280, 720, [
      { offset: 0, color: '#161a24' },
      { offset: 0.48, color: '#0d1017' },
      { offset: 1, color: '#07090d' },
    ]);
    createLinearTexture(this, 'menu-panel', 520, 370, [
      { offset: 0, color: '#252b38' },
      { offset: 0.38, color: '#171c25' },
      { offset: 1, color: '#0e1118' },
    ], 'diagonal', 24);
    createButtonTexture(this, 'button-main', 430, 72, '#343c4c', '#1b202b');
    createButtonTexture(this, 'button-bright', 430, 72, '#7e8da7', '#3b465b');
    createButtonTexture(this, 'button-small', 176, 54, '#343c4c', '#1a202a');
    createLinearTexture(this, 'vector-card', 420, 164, [
      { offset: 0, color: '#586477' },
      { offset: 0.42, color: '#2f3745' },
      { offset: 1, color: '#181d26' },
    ], 'diagonal', 20);
    createLinearTexture(this, 'menu-square', 96, 96, [
      { offset: 0, color: '#c6ccd8' },
      { offset: 0.45, color: '#737c8d' },
      { offset: 1, color: '#2e3440' },
    ], 'diagonal', 8);
    createGlowTexture(this, 'white-glow', 256, '#05070a', 1);
  }

  private createAmbientShapes(): void {
    const positions = [
      { x: 128, y: 158, size: 58, duration: 5800 },
      { x: 1110, y: 180, size: 82, duration: 7200 },
      { x: 160, y: 610, size: 44, duration: 6500 },
      { x: 1148, y: 590, size: 54, duration: 5300 },
    ];

    positions.forEach(({ x, y, size, duration }, index) => {
      const shape = this.add.image(x, y, 'menu-square')
        .setDisplaySize(size, size)
        .setAlpha(0.18 + index * 0.025)
        .setRotation(index * 0.32);
      const shapeGlow = this.add.image(x, y, 'white-glow')
        .setPosition(x + 6, y + 8)
        .setDisplaySize(size * 1.08, size * 1.08)
        .setAlpha(0.28)
        .setBlendMode(Phaser.BlendModes.NORMAL);

      this.tweens.add({
        targets: [shape, shapeGlow],
        y: y - 22,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      this.tweens.add({
        targets: shape,
        rotation: shape.rotation + Math.PI * 2,
        duration: duration * 2.1,
        repeat: -1,
        ease: 'Linear',
      });
    });
  }

  private showPage(page: MenuPage): void {
    this.pageObjects.forEach((object) => {
      this.tweens.killTweensOf(object);
      object.destroy();
    });
    this.pageObjects = [];
    this.currentPage = page;

    if (page === 'home') this.showHome();
    if (page === 'bossfights') this.showBossfights();
    if (page === 'inventory') this.showInventory();
    if (page === 'settings') this.showSettings();
  }

  private showHome(): void {
    this.addPageText(640, 230, 'SELECT', 18, '#707b8e', 4);
    this.addButton(640, 300, 'BOSSFIGHTS', () => this.showPage('bossfights'), true);
    this.addButton(640, 388, 'INVENTORY', () => this.showPage('inventory'));
    this.addButton(640, 476, 'SETTINGS', () => this.showPage('settings'));
    this.addPageText(640, 610, 'v0.2  •  ESC RETURNS TO MENU', 13, '#596170', 2);
  }

  private showBossfights(): void {
    this.addPageImage(640, 400, 'menu-panel').setDisplaySize(560, 410);
    this.addPageText(640, 240, 'BOSSFIGHTS', 24, '#eef2f8', 5);

    const bossGlow = this.addPageImage(508, 386, 'white-glow')
      .setDisplaySize(144, 144)
      .setAlpha(0.32)
      .setBlendMode(Phaser.BlendModes.NORMAL);
    const boss = this.addPageImage(500, 378, 'menu-square').setDisplaySize(132, 132);
    const core = this.addPageImage(500, 378, 'menu-square').setDisplaySize(30, 30).setTint(0xffffff);

    this.tweens.add({ targets: core, rotation: Math.PI * 2, duration: 1800, repeat: -1, ease: 'Linear' });
    this.tweens.add({
      targets: [boss, bossGlow],
      y: 368,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.addPageText(735, 320, 'PROLOGUE', 30, '#ffffff', 4).setOrigin(0, 0.5);
    this.addPageText(735, 363, 'THE FIRST FALSE SHAPE', 13, '#8792a5', 2).setOrigin(0, 0.5);
    this.addPageText(735, 418, 'Two phases\nExpanded attack set\nRecommended: VECTOR', 16, '#b8c0ce', 0)
      .setOrigin(0, 0.5)
      .setLineSpacing(8);

    this.addButton(735, 520, 'BEGIN', () => this.scene.start('fallax'), true, 270);
    this.addBackButton();
  }

  private showInventory(): void {
    this.addPageImage(640, 400, 'menu-panel').setDisplaySize(590, 410);
    this.addPageText(640, 240, 'INVENTORY', 24, '#eef2f8', 5);
    this.addPageImage(640, 350, 'vector-card').setDisplaySize(470, 178);
    this.addPageText(444, 306, 'PRIMARY', 12, '#aeb8c9', 3).setOrigin(0, 0.5);
    this.addPageText(444, 353, 'VECTOR', 34, '#ffffff', 5).setOrigin(0, 0.5);
    this.addPageText(444, 402, 'Rapid fire  •  Low damage  •  High accuracy', 14, '#b5becc', 0).setOrigin(0, 0.5);
    this.addPageText(832, 315, 'EQUIPPED', 12, '#dce8ff', 2).setOrigin(1, 0.5);

    const slotLabels = ['SECONDARY  LOCKED', 'SPECIAL I  EMPTY', 'SPECIAL II  EMPTY', 'SPECIAL III  EMPTY'];
    slotLabels.forEach((label, index) => {
      const x = 455 + (index % 2) * 370;
      const y = 475 + Math.floor(index / 2) * 58;
      this.addPageText(x, y, label, 13, '#687184', 1).setOrigin(0, 0.5);
    });
    this.addBackButton();
  }

  private showSettings(): void {
    this.addPageImage(640, 400, 'menu-panel').setDisplaySize(560, 380);
    this.addPageText(640, 250, 'SETTINGS', 24, '#eef2f8', 5);
    this.addPageText(475, 338, 'MUSIC', 17, '#dce2ec', 2).setOrigin(0, 0.5);
    this.addButton(760, 338, this.musicEnabled ? 'ON' : 'OFF', () => {
      this.musicEnabled = !this.musicEnabled;
      this.registry.set('musicEnabled', this.musicEnabled);
      this.showPage('settings');
    }, this.musicEnabled, 176, true);

    this.addPageText(475, 414, 'EFFECTS', 17, '#dce2ec', 2).setOrigin(0, 0.5);
    this.addButton(760, 414, this.effectsEnabled ? 'ON' : 'OFF', () => {
      this.effectsEnabled = !this.effectsEnabled;
      this.registry.set('effectsEnabled', this.effectsEnabled);
      this.showPage('settings');
    }, this.effectsEnabled, 176, true);

    this.addPageText(640, 500, 'More options will be added as Fallax grows.', 14, '#778195', 0);
    this.addBackButton();
  }

  private addButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    bright = false,
    width = 430,
    compact = false,
  ): void {
    const texture = compact ? 'button-small' : bright ? 'button-bright' : 'button-main';
    const height = compact ? 54 : 72;
    const buttonGlow = this.addPageImage(x + 5, y + 7, 'white-glow')
      .setDisplaySize(width, height)
      .setAlpha(bright ? 0.32 : 0.22)
      .setBlendMode(Phaser.BlendModes.NORMAL);
    const button = this.addPageImage(x, y, texture)
      .setDisplaySize(width, height)
      .setInteractive({ useHandCursor: true });
    const text = this.addPageText(x, y, label, compact ? 14 : 18, '#f5f7fb', compact ? 2 : 4);
    const baseScaleX = button.scaleX;
    const baseScaleY = button.scaleY;

    button.on('pointerover', () => {
      this.tweens.add({ targets: button, scaleX: baseScaleX * 1.025, scaleY: baseScaleY * 1.025, duration: 140, ease: 'Sine.Out' });
      this.tweens.add({ targets: text, scaleX: 1.025, scaleY: 1.025, duration: 140, ease: 'Sine.Out' });
      this.tweens.add({ targets: buttonGlow, alpha: bright ? 0.42 : 0.32, duration: 160, ease: 'Sine.Out' });
    });
    button.on('pointerout', () => {
      this.tweens.add({ targets: button, scaleX: baseScaleX, scaleY: baseScaleY, duration: 180, ease: 'Sine.Out' });
      this.tweens.add({ targets: text, scaleX: 1, scaleY: 1, duration: 180, ease: 'Sine.Out' });
      this.tweens.add({ targets: buttonGlow, alpha: bright ? 0.32 : 0.22, duration: 180, ease: 'Sine.Out' });
    });
    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: baseScaleX * 0.97,
        scaleY: baseScaleY * 0.97,
        duration: 70,
        yoyo: true,
        ease: 'Quad.Out',
        onComplete: onClick,
      });
      this.tweens.add({ targets: text, scaleX: 0.97, scaleY: 0.97, duration: 70, yoyo: true, ease: 'Quad.Out' });
    });
  }

  private addBackButton(): void {
    this.addButton(640, 623, 'BACK', () => this.showPage('home'), false, 176, true);
  }

  private addPageImage(x: number, y: number, texture: string): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, texture);
    this.pageObjects.push(image);
    return image;
  }

  private addPageText(
    x: number,
    y: number,
    text: string,
    size: number,
    color: string,
    letterSpacing: number,
  ): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, text, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: `${size}px`,
      color,
      letterSpacing,
      align: 'center',
    }).setOrigin(0.5);
    this.pageObjects.push(label);
    return label;
  }
}
