import Phaser from 'phaser';
import { createGlowTexture, createLinearTexture } from './VisualFactory';

type Surface = {
  x: number;
  top: number;
  width: number;
};

type VectorProjectile = {
  sprite: Phaser.Physics.Arcade.Image;
  expiresAt: number;
};

type Shockwave = {
  sprite: Phaser.GameObjects.Image;
  velocityX: number;
  expiresAt: number;
  damage: number;
};

type BossState = 'idle' | 'transition' | 'swing' | 'rotation' | 'crash' | 'slide' | 'ricochet' | 'defeated';
type CoreMode = 'orbit' | 'manual' | 'rotation' | 'center';
type AttackName = 'swing' | 'rotation' | 'crash' | 'slide' | 'ricochet';

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;
const ROOM_LEFT = 54;
const ROOM_RIGHT = 1546;
const ROOM_TOP = 42;
const FLOOR_TOP = 820;
const PLAYER_SIZE = 44;
const BOSS_SIZE = 154;
const MAX_PLAYER_HEALTH = 100;
const MAX_BOSS_HEALTH = 520;

export class FallaxScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private playerGlow!: Phaser.GameObjects.Image;
  private boss!: Phaser.GameObjects.Image;
  private bossGlow!: Phaser.GameObjects.Image;
  private core!: Phaser.GameObjects.Image;
  private coreGlow!: Phaser.GameObjects.Image;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private surfaces: Surface[] = [];
  private projectiles: VectorProjectile[] = [];
  private shockwaves: Shockwave[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyEscape!: Phaser.Input.Keyboard.Key;
  private keyRestart!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;

  private playerHealth = MAX_PLAYER_HEALTH;
  private bossHealth = MAX_BOSS_HEALTH;
  private playerInvulnerableUntil = 0;
  private dashUntil = 0;
  private dashReadyAt = 0;
  private coyoteUntil = 0;
  private jumpBufferedUntil = 0;
  private lastFacing = 1;
  private nextVectorShotAt = 0;

  private bossState: BossState = 'idle';
  private bossPhase = 1;
  private nextAttackAt = 0;
  private lastAttack: AttackName | null = null;
  private coreMode: CoreMode = 'orbit';
  private coreDangerous = false;
  private coreOrbitAngle = 0;
  private coreOrbitRadius = 35;
  private coreOrbitSpeed = 1.7;
  private bossHome = new Phaser.Math.Vector2(1110, 350);
  private ricochetVelocity = new Phaser.Math.Vector2();
  private ricochetEndsAt = 0;
  private fightOver = false;

  private playerHealthFill!: Phaser.GameObjects.Image;
  private bossHealthFill!: Phaser.GameObjects.Image;
  private dashText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private theme: Phaser.Sound.BaseSound | null = null;

  constructor() {
    super('fallax');
  }

  preload(): void {
    this.load.audio('prologue-theme', '/audio/themes/bossfight-prologue.mp3');
    this.load.audio('vector-shot', '/audio/effects/vector-shot.mp3');
  }

  create(): void {
    this.createTextures();
    this.createArena();
    this.createPlayer();
    this.createBoss();
    this.createInput();
    this.createHud();
    this.configureCamera();
    this.startAudio();

    this.nextAttackAt = this.time.now + 1500;
    this.physics.add.collider(this.player, this.platforms);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.theme?.stop();
      this.theme?.destroy();
      this.theme = null;
    });
  }

  update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keyEscape)) {
      this.scene.start('menu');
      return;
    }

    if (this.fightOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keyRestart)) this.scene.restart();
      if (Phaser.Input.Keyboard.JustDown(this.keyEnter)) this.scene.start('menu');
      return;
    }

    this.updatePlayerMovement(time);
    this.updateVector(time);
    this.updateProjectiles(time);
    this.updateBoss(time, delta);
    this.updateShockwaves(time, delta);
    this.updateDamageChecks(time);
    this.updateHud(time);
    this.updateVisualTracking();
    this.updateCameraLead();

    if (this.bossHealth <= MAX_BOSS_HEALTH * 0.5 && this.bossPhase === 1 && this.bossState === 'idle') {
      this.beginPhaseTwo();
    }

    if (this.bossHealth <= 0 && !this.fightOver) this.winFight();
    if (this.playerHealth <= 0 && !this.fightOver) this.loseFight();
  }

  private createTextures(): void {
    createLinearTexture(this, 'arena-background', 1280, 720, [
      { offset: 0, color: '#252b36' },
      { offset: 0.4, color: '#151a22' },
      { offset: 1, color: '#090c11' },
    ]);
    createLinearTexture(this, 'platform-gradient', 512, 80, [
      { offset: 0, color: '#8993a3' },
      { offset: 0.12, color: '#596372' },
      { offset: 0.55, color: '#343b47' },
      { offset: 1, color: '#1c212a' },
    ], 'vertical', 9);
    createLinearTexture(this, 'player-gradient', PLAYER_SIZE, PLAYER_SIZE, [
      { offset: 0, color: '#e1e4e9' },
      { offset: 0.34, color: '#aeb4be' },
      { offset: 0.7, color: '#737a86' },
      { offset: 1, color: '#464c57' },
    ], 'diagonal', 7);
    createLinearTexture(this, 'boss-gradient', BOSS_SIZE, BOSS_SIZE, [
      { offset: 0, color: '#c4cad4' },
      { offset: 0.28, color: '#8d96a5' },
      { offset: 0.67, color: '#59616f' },
      { offset: 1, color: '#303641' },
    ], 'diagonal', 12);
    createLinearTexture(this, 'core-gradient', 34, 34, [
      { offset: 0, color: '#ffffff' },
      { offset: 0.52, color: '#eaf2ff' },
      { offset: 1, color: '#9eb8dd' },
    ], 'diagonal', 4);
    createLinearTexture(this, 'vector-projectile', 24, 8, [
      { offset: 0, color: '#ffffff' },
      { offset: 0.42, color: '#cfdef4' },
      { offset: 1, color: '#667891' },
    ], 'horizontal', 5);
    createLinearTexture(this, 'shockwave-gradient', 96, 18, [
      { offset: 0, color: 'rgba(255,255,255,0)' },
      { offset: 0.48, color: '#ffffff' },
      { offset: 0.72, color: '#bcd5ff' },
      { offset: 1, color: 'rgba(188,213,255,0)' },
    ], 'horizontal', 8);
    createLinearTexture(this, 'hud-panel', 520, 48, [
      { offset: 0, color: 'rgba(56,64,78,0.92)' },
      { offset: 0.5, color: 'rgba(28,33,43,0.88)' },
      { offset: 1, color: 'rgba(12,15,21,0.9)' },
    ], 'diagonal', 12);
    createLinearTexture(this, 'health-fill', 440, 14, [
      { offset: 0, color: '#ffffff' },
      { offset: 0.48, color: '#cfd8e7' },
      { offset: 1, color: '#6f7c91' },
    ], 'horizontal', 7);
    createLinearTexture(this, 'damage-fill', 440, 14, [
      { offset: 0, color: '#ffb4ae' },
      { offset: 0.54, color: '#e86f6b' },
      { offset: 1, color: '#7f3438' },
    ], 'horizontal', 7);
    createGlowTexture(this, 'player-glow', 192, '#b9c9e2', 0.64);
    createGlowTexture(this, 'boss-glow', 384, '#9fb4d4', 0.7);
    createGlowTexture(this, 'core-glow', 192, '#ffffff', 0.95);
    createGlowTexture(this, 'projectile-glow', 96, '#cfe2ff', 0.75);
  }

  private createArena(): void {
    this.cameras.main.setBackgroundColor('#090c11');
    this.physics.world.setBounds(ROOM_LEFT, ROOM_TOP, ROOM_RIGHT - ROOM_LEFT, WORLD_HEIGHT - ROOM_TOP);

    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'arena-background')
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(-20);

    const ambientGlow = this.add.image(1050, 300, 'boss-glow')
      .setDisplaySize(900, 700)
      .setAlpha(0.035)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-18);
    this.tweens.add({
      targets: ambientGlow,
      alpha: 0.065,
      duration: 3400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(WORLD_WIDTH / 2, FLOOR_TOP + 42, ROOM_RIGHT - ROOM_LEFT, 84);
    this.addPlatform(355, 652, 360, 34);
    this.addPlatform(790, 532, 310, 34);
    this.addPlatform(1210, 665, 350, 34);
    this.addPlatform(560, 372, 240, 30);
  }

  private addPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.platforms.create(x, y, 'platform-gradient') as Phaser.Physics.Arcade.Image;
    platform.setDisplaySize(width, height).refreshBody();
    platform.setDepth(-2);
    this.surfaces.push({ x, top: y - height / 2, width });
  }

  private createPlayer(): void {
    this.playerGlow = this.add.image(250, 740, 'player-glow')
      .setDisplaySize(110, 110)
      .setAlpha(0.12)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(4);

    this.player = this.physics.add.image(250, 740, 'player-gradient');
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(5).setCollideWorldBounds(true);
    this.player.body.setSize(40, 40, true);
    this.player.body.setMaxVelocity(1200, 1250);
    this.player.body.setDragX(1500);
  }

  private createBoss(): void {
    this.bossGlow = this.add.image(this.bossHome.x, this.bossHome.y, 'boss-glow')
      .setDisplaySize(310, 310)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(1);
    this.boss = this.add.image(this.bossHome.x, this.bossHome.y, 'boss-gradient')
      .setDisplaySize(BOSS_SIZE, BOSS_SIZE)
      .setDepth(2);
    this.coreGlow = this.add.image(this.boss.x, this.boss.y, 'core-glow')
      .setDisplaySize(110, 110)
      .setAlpha(0.34)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);
    this.core = this.add.image(this.boss.x, this.boss.y, 'core-gradient')
      .setDisplaySize(34, 34)
      .setDepth(4);
  }

  private createInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable.');

    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyJ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyShift = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyEscape = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyRestart = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyEnter = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  private createHud(): void {
    this.add.image(640, 32, 'hud-panel').setDisplaySize(560, 44).setScrollFactor(0).setDepth(50);
    this.bossHealthFill = this.add.image(420, 32, 'damage-fill')
      .setOrigin(0, 0.5)
      .setDisplaySize(440, 14)
      .setScrollFactor(0)
      .setDepth(51);
    this.add.text(640, 62, 'PROLOGUE', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '13px',
      color: '#dce3ed',
      letterSpacing: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this.add.image(184, 670, 'hud-panel').setDisplaySize(310, 54).setScrollFactor(0).setDepth(50);
    this.playerHealthFill = this.add.image(54, 665, 'health-fill')
      .setOrigin(0, 0.5)
      .setDisplaySize(230, 13)
      .setScrollFactor(0)
      .setDepth(51);
    this.add.text(54, 642, 'VECTOR', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '15px',
      color: '#f4f7fb',
      letterSpacing: 3,
    }).setScrollFactor(0).setDepth(51);
    this.dashText = this.add.text(54, 681, 'DASH READY', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '12px',
      color: '#aeb9ca',
      letterSpacing: 2,
    }).setScrollFactor(0).setDepth(51);

    this.phaseText = this.add.text(1220, 34, 'PHASE I', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '14px',
      color: '#bfc8d7',
      letterSpacing: 3,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(51);

    this.statusText = this.add.text(640, 650, '', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      letterSpacing: 5,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80).setShadow(0, 0, '#dbe7ff', 20, true, true);

    this.add.text(1220, 676, 'A/D MOVE  •  W/SPACE JUMP  •  SHIFT DASH  •  LMB/J FIRE', {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '11px',
      color: '#687286',
      letterSpacing: 1,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(51);
  }

  private configureCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.player, true, 0.075, 0.075);
    camera.setDeadzone(340, 190);
    camera.setZoom(1);
  }

  private startAudio(): void {
    const musicEnabled = this.registry.get('musicEnabled') !== false;
    if (!musicEnabled) return;

    this.theme = this.sound.add('prologue-theme', { loop: true, volume: 0.5 });
    this.theme.play();
  }

  private updatePlayerMovement(time: number): void {
    const body = this.player.body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.coyoteUntil = time + 110;

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keyW)
      || Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space);
    if (jumpPressed) this.jumpBufferedUntil = time + 125;

    if (time < this.jumpBufferedUntil && time < this.coyoteUntil && time >= this.dashUntil) {
      body.setVelocityY(-690);
      this.jumpBufferedUntil = 0;
      this.coyoteUntil = 0;
      this.player.setScale(0.88, 1.12);
      this.tweens.add({ targets: this.player, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' });
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyShift) && time >= this.dashReadyAt) {
      this.startDash(time);
    }

    if (time < this.dashUntil) return;

    body.setAllowGravity(true);
    const left = this.keyA.isDown || this.cursors.left.isDown;
    const right = this.keyD.isDown || this.cursors.right.isDown;
    const direction = Number(right) - Number(left);
    const acceleration = onGround ? 1850 : 1220;
    const maximumSpeed = onGround ? 370 : 340;

    if (direction !== 0) {
      body.setAccelerationX(direction * acceleration);
      body.setVelocityX(Phaser.Math.Clamp(body.velocity.x, -maximumSpeed, maximumSpeed));
      this.lastFacing = direction;
      this.player.setRotation(Phaser.Math.Linear(this.player.rotation, direction * 0.045, 0.15));
    } else {
      body.setAccelerationX(0);
      this.player.setRotation(Phaser.Math.Linear(this.player.rotation, 0, 0.12));
    }
  }

  private startDash(time: number): void {
    const body = this.player.body;
    const inputDirection = Number(this.keyD.isDown || this.cursors.right.isDown)
      - Number(this.keyA.isDown || this.cursors.left.isDown);
    const direction = inputDirection === 0 ? this.lastFacing : inputDirection;

    this.lastFacing = direction;
    this.dashUntil = time + 245;
    this.dashReadyAt = time + 760;
    this.playerInvulnerableUntil = Math.max(this.playerInvulnerableUntil, this.dashUntil + 70);
    body.setAllowGravity(false);
    body.setAcceleration(0, 0);
    body.setVelocity(direction * 1180, 0);
    this.player.setScale(1.28, 0.72);
    this.playerGlow.setAlpha(0.32);

    for (let index = 1; index <= 6; index += 1) {
      this.time.delayedCall(index * 28, () => this.spawnAfterimage());
    }

    this.time.delayedCall(245, () => {
      if (!this.player.active) return;
      this.player.body.setAllowGravity(true);
      this.player.body.setVelocityX(this.lastFacing * 460);
      this.tweens.add({ targets: this.player, scaleX: 1, scaleY: 1, duration: 210, ease: 'Back.Out' });
      this.tweens.add({ targets: this.playerGlow, alpha: 0.12, duration: 220, ease: 'Sine.Out' });
    });
  }

  private spawnAfterimage(): void {
    const afterimage = this.add.image(this.player.x, this.player.y, 'player-gradient')
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE)
      .setRotation(this.player.rotation)
      .setAlpha(0.23)
      .setDepth(3);
    this.tweens.add({
      targets: afterimage,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 0.68,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => afterimage.destroy(),
    });
  }

  private updateVector(time: number): void {
    const pointerFiring = this.input.activePointer.isDown;
    if (!pointerFiring && !this.keyJ.isDown) return;
    if (time < this.nextVectorShotAt) return;

    this.nextVectorShotAt = time + 86;
    const pointer = this.cameras.main.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
    const aimX = pointerFiring ? pointer.x : this.boss.x;
    const aimY = pointerFiring ? pointer.y : this.boss.y;
    const direction = new Phaser.Math.Vector2(aimX - this.player.x, aimY - this.player.y).normalize();
    const spawnX = this.player.x + direction.x * 30;
    const spawnY = this.player.y + direction.y * 30;

    const glow = this.add.image(spawnX, spawnY, 'projectile-glow')
      .setDisplaySize(50, 34)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(6);
    this.tweens.add({
      targets: glow,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.5,
      duration: 120,
      onComplete: () => glow.destroy(),
    });

    const projectile = this.physics.add.image(spawnX, spawnY, 'vector-projectile');
    projectile.setDisplaySize(24, 8).setDepth(7).setRotation(direction.angle());
    projectile.body.setAllowGravity(false);
    projectile.body.setVelocity(direction.x * 1260, direction.y * 1260);
    projectile.body.setSize(22, 7, true);
    this.projectiles.push({ sprite: projectile, expiresAt: time + 1500 });

    this.player.body.setVelocityX(this.player.body.velocity.x - direction.x * 10);
    this.playerGlow.setAlpha(0.22);
    this.tweens.add({ targets: this.playerGlow, alpha: 0.12, duration: 110 });

    const effectsEnabled = this.registry.get('effectsEnabled') !== false;
    if (effectsEnabled && this.cache.audio.exists('vector-shot')) {
      this.sound.play('vector-shot', {
        volume: 0.16,
        detune: Phaser.Math.Between(-70, 70),
      });
    }
  }

  private updateProjectiles(time: number): void {
    const bossBounds = this.boss.getBounds();

    this.projectiles = this.projectiles.filter((projectile) => {
      const sprite = projectile.sprite;
      if (!sprite.active) return false;

      const outside = sprite.x < ROOM_LEFT - 80
        || sprite.x > ROOM_RIGHT + 80
        || sprite.y < ROOM_TOP - 80
        || sprite.y > WORLD_HEIGHT + 80;
      if (outside || time >= projectile.expiresAt) {
        sprite.destroy();
        return false;
      }

      if (Phaser.Geom.Intersects.RectangleToRectangle(sprite.getBounds(), bossBounds)) {
        this.bossHealth = Math.max(0, this.bossHealth - 1.7);
        this.bossGlow.setAlpha(0.3);
        this.tweens.add({ targets: this.bossGlow, alpha: 0.16, duration: 120, ease: 'Sine.Out' });
        sprite.destroy();
        return false;
      }

      return true;
    });
  }

  private updateBoss(time: number, delta: number): void {
    if (this.bossState === 'defeated') return;

    if (this.bossState === 'idle') {
      const hover = Math.sin(time * 0.0019) * 12;
      this.boss.y = Phaser.Math.Linear(this.boss.y, this.bossHome.y + hover, 0.055);
      this.boss.x = Phaser.Math.Linear(this.boss.x, this.bossHome.x, 0.04);
      this.boss.rotation = Math.sin(time * 0.0011) * 0.025;

      if (time >= this.nextAttackAt) this.chooseAttack();
    }

    if (this.bossState === 'ricochet') this.updateRicochet(time, delta);

    this.coreOrbitAngle += this.coreOrbitSpeed * (delta / 1000);
    if (this.coreMode === 'orbit' || this.coreMode === 'rotation') {
      this.core.x = this.boss.x + Math.cos(this.coreOrbitAngle) * this.coreOrbitRadius;
      this.core.y = this.boss.y + Math.sin(this.coreOrbitAngle) * this.coreOrbitRadius;
    } else if (this.coreMode === 'center') {
      this.core.x = this.boss.x;
      this.core.y = this.boss.y;
    }

    this.core.rotation += (this.bossPhase === 1 ? 2.1 : -3.4) * (delta / 1000);
  }

  private chooseAttack(): void {
    if (this.bossState !== 'idle') return;

    let choices: AttackName[] = this.bossPhase === 1
      ? ['swing', 'crash', 'slide']
      : ['swing', 'rotation', 'crash', 'ricochet'];

    const playerOnFloor = this.player.y > FLOOR_TOP - 90;
    if (!playerOnFloor) choices = choices.filter((attack) => attack !== 'slide');
    const withoutRepeat = choices.filter((attack) => attack !== this.lastAttack);
    if (withoutRepeat.length > 0) choices = withoutRepeat;

    const attack = Phaser.Utils.Array.GetRandom(choices);
    this.lastAttack = attack;

    if (attack === 'swing') this.attackSwing();
    if (attack === 'rotation') this.attackRotation();
    if (attack === 'crash') this.attackCrash();
    if (attack === 'slide') this.attackSlide();
    if (attack === 'ricochet') this.attackRicochet();
  }

  private attackSwing(): void {
    this.bossState = 'swing';
    this.coreMode = 'manual';
    this.coreDangerous = false;

    const predictedX = this.player.x + this.player.body.velocity.x * 0.24;
    const predictedY = this.player.y + this.player.body.velocity.y * 0.12;
    const direction = new Phaser.Math.Vector2(predictedX - this.boss.x, predictedY - this.boss.y).normalize();
    const backwardX = this.boss.x - direction.x * 68;
    const backwardY = this.boss.y - direction.y * 68;
    const forwardDistance = this.bossPhase === 1 ? 330 : 420;
    const forwardX = this.boss.x + direction.x * forwardDistance;
    const forwardY = this.boss.y + direction.y * forwardDistance;

    this.tweens.add({
      targets: this.core,
      x: backwardX,
      y: backwardY,
      duration: 380,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(130, () => {
          this.coreDangerous = true;
          this.tweens.add({
            targets: this.core,
            x: forwardX,
            y: forwardY,
            duration: this.bossPhase === 1 ? 190 : 145,
            ease: 'Expo.In',
            onComplete: () => {
              this.cameras.main.shake(90, 0.003);
              this.time.delayedCall(90, () => {
                this.coreDangerous = false;
                this.tweens.add({
                  targets: this.core,
                  x: this.boss.x,
                  y: this.boss.y,
                  duration: 310,
                  ease: 'Back.Out',
                  onComplete: () => this.completeAttack(470),
                });
              });
            },
          });
        });
      },
    });
  }

  private attackRotation(): void {
    this.bossState = 'rotation';
    this.coreMode = 'rotation';
    this.coreDangerous = false;
    this.coreOrbitSpeed = 1.2;
    this.coreOrbitRadius = 36;

    this.tweens.add({
      targets: this,
      coreOrbitRadius: 250,
      coreOrbitSpeed: 5.5,
      duration: 720,
      ease: 'Back.Out',
      onComplete: () => {
        this.coreDangerous = true;
        this.time.delayedCall(2050, () => {
          this.coreDangerous = false;
          this.tweens.add({
            targets: this,
            coreOrbitRadius: 35,
            coreOrbitSpeed: 1.7,
            duration: 560,
            ease: 'Sine.InOut',
            onComplete: () => this.completeAttack(520),
          });
        });
      },
    });
  }

  private attackCrash(): void {
    this.bossState = 'crash';
    this.coreMode = 'orbit';
    const surface = this.chooseCrashSurface();
    const targetX = Phaser.Math.Clamp(
      this.player.x + this.player.body.velocity.x * 0.2,
      surface.x - surface.width / 2 + 90,
      surface.x + surface.width / 2 - 90,
    );
    const targetY = surface.top - BOSS_SIZE / 2;
    const riseY = Math.max(ROOM_TOP + 90, targetY - 250);
    const telegraph = this.add.image(targetX, surface.top - 6, 'shockwave-gradient')
      .setDisplaySize(BOSS_SIZE + 90, 10)
      .setAlpha(0.25)
      .setDepth(0);

    this.tweens.add({ targets: telegraph, alpha: 0.75, scaleX: 1.18, duration: 260, yoyo: true, repeat: 1 });
    this.tweens.add({
      targets: this.boss,
      x: targetX,
      y: riseY,
      scaleX: 0.82,
      scaleY: 1.18,
      duration: 520,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.time.delayedCall(170, () => {
          this.tweens.add({
            targets: this.boss,
            y: targetY,
            scaleX: 1.18,
            scaleY: 0.78,
            duration: this.bossPhase === 1 ? 210 : 165,
            ease: 'Expo.In',
            onComplete: () => {
              telegraph.destroy();
              this.impact(surface, this.bossPhase === 2);
              this.time.delayedCall(310, () => {
                this.tweens.add({
                  targets: this.boss,
                  y: this.bossHome.y,
                  x: this.bossHome.x,
                  scaleX: 1,
                  scaleY: 1,
                  duration: 650,
                  ease: 'Back.Out',
                  onComplete: () => this.completeAttack(520),
                });
              });
            },
          });
        });
      },
    });
  }

  private attackSlide(): void {
    this.bossState = 'slide';
    this.coreMode = 'orbit';
    const floor = this.surfaces[0];
    const targetX = Phaser.Math.Clamp(this.player.x, ROOM_LEFT + 120, ROOM_RIGHT - 120);
    const targetY = floor.top - BOSS_SIZE / 2;
    const wallX = this.player.x < WORLD_WIDTH / 2 ? ROOM_LEFT + BOSS_SIZE / 2 : ROOM_RIGHT - BOSS_SIZE / 2;

    this.tweens.add({
      targets: this.boss,
      x: targetX,
      y: targetY - 230,
      scaleX: 0.84,
      scaleY: 1.18,
      duration: 480,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.time.delayedCall(150, () => {
          this.tweens.add({
            targets: this.boss,
            y: targetY,
            scaleX: 1.22,
            scaleY: 0.76,
            duration: 180,
            ease: 'Expo.In',
            onComplete: () => {
              this.impact(floor, false);
              this.time.delayedCall(180, () => {
                this.boss.setScale(0.78, 1.12);
                this.tweens.add({
                  targets: this.boss,
                  x: wallX,
                  duration: 430,
                  ease: 'Expo.In',
                  onComplete: () => {
                    this.cameras.main.shake(180, 0.009);
                    this.spawnImpactFlash(this.boss.x, this.boss.y, 220);
                    this.boss.setScale(1.2, 0.82);
                    this.time.delayedCall(260, () => {
                      this.tweens.add({
                        targets: this.boss,
                        x: this.bossHome.x,
                        y: this.bossHome.y,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 720,
                        ease: 'Back.Out',
                        onComplete: () => this.completeAttack(550),
                      });
                    });
                  },
                });
              });
            },
          });
        });
      },
    });
  }

  private attackRicochet(): void {
    this.bossState = 'ricochet';
    this.coreMode = 'center';
    const startAtLeft = this.player.x > WORLD_WIDTH / 2;
    const launchX = startAtLeft ? ROOM_LEFT + BOSS_SIZE / 2 : ROOM_RIGHT - BOSS_SIZE / 2;
    const directionX = startAtLeft ? 1 : -1;

    this.tweens.add({
      targets: this.boss,
      x: launchX,
      y: 260,
      scaleX: 0.82,
      scaleY: 1.18,
      duration: 620,
      ease: 'Back.InOut',
      onComplete: () => {
        this.ricochetVelocity.set(directionX * 910, 610);
        this.ricochetEndsAt = this.time.now + 2600;
        this.boss.setScale(1, 1);
      },
    });
  }

  private updateRicochet(time: number, delta: number): void {
    if (this.ricochetEndsAt === 0) return;

    const seconds = delta / 1000;
    this.boss.x += this.ricochetVelocity.x * seconds;
    this.boss.y += this.ricochetVelocity.y * seconds;
    let bounced = false;
    const half = BOSS_SIZE / 2;

    if (this.boss.x <= ROOM_LEFT + half || this.boss.x >= ROOM_RIGHT - half) {
      this.boss.x = Phaser.Math.Clamp(this.boss.x, ROOM_LEFT + half, ROOM_RIGHT - half);
      this.ricochetVelocity.x *= -1;
      bounced = true;
    }
    if (this.boss.y <= ROOM_TOP + half || this.boss.y >= FLOOR_TOP - half) {
      this.boss.y = Phaser.Math.Clamp(this.boss.y, ROOM_TOP + half, FLOOR_TOP - half);
      this.ricochetVelocity.y *= -1;
      bounced = true;
    }

    if (bounced) {
      this.cameras.main.shake(110, 0.006);
      this.spawnImpactFlash(this.boss.x, this.boss.y, 170);
      this.boss.rotation += 0.22 * Math.sign(this.ricochetVelocity.x);
    }

    if (time >= this.ricochetEndsAt) {
      this.ricochetEndsAt = 0;
      this.ricochetVelocity.set(0, 0);
      this.tweens.add({
        targets: this.boss,
        x: this.bossHome.x,
        y: this.bossHome.y,
        rotation: 0,
        duration: 760,
        ease: 'Back.Out',
        onComplete: () => this.completeAttack(620),
      });
    }
  }

  private chooseCrashSurface(): Surface {
    const playerFeet = this.player.y + PLAYER_SIZE / 2;
    const matching = this.surfaces.filter((surface) => {
      const withinX = this.player.x >= surface.x - surface.width / 2 && this.player.x <= surface.x + surface.width / 2;
      return withinX && Math.abs(surface.top - playerFeet) < 90;
    });
    return matching[0] ?? this.surfaces[0];
  }

  private impact(surface: Surface, createShockwave: boolean): void {
    this.cameras.main.shake(210, createShockwave ? 0.012 : 0.009);
    this.spawnImpactFlash(this.boss.x, surface.top, createShockwave ? 300 : 230);

    if (createShockwave) {
      this.createShockwave(this.boss.x - 20, surface.top - 10, -720, surface);
      this.createShockwave(this.boss.x + 20, surface.top - 10, 720, surface);
    }
  }

  private createShockwave(x: number, y: number, velocityX: number, surface: Surface): void {
    const wave = this.add.image(x, y, 'shockwave-gradient')
      .setDisplaySize(86, 18)
      .setFlipX(velocityX < 0)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);
    wave.setData('left', surface.x - surface.width / 2);
    wave.setData('right', surface.x + surface.width / 2);
    this.shockwaves.push({ sprite: wave, velocityX, expiresAt: this.time.now + 1700, damage: 16 });
  }

  private updateShockwaves(time: number, delta: number): void {
    this.shockwaves = this.shockwaves.filter((wave) => {
      const left = Number(wave.sprite.getData('left'));
      const right = Number(wave.sprite.getData('right'));
      wave.sprite.x += wave.velocityX * (delta / 1000);
      const expired = time >= wave.expiresAt || wave.sprite.x < left || wave.sprite.x > right;
      if (expired) {
        wave.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private updateDamageChecks(time: number): void {
    const playerBounds = this.player.getBounds();

    if (this.coreDangerous && Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.core.getBounds())) {
      this.damagePlayer(15, this.core.x, time);
    }

    const dangerousBoss = this.bossState === 'crash'
      || this.bossState === 'slide'
      || this.bossState === 'ricochet';
    if (dangerousBoss && Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.boss.getBounds())) {
      this.damagePlayer(this.bossState === 'ricochet' ? 22 : 18, this.boss.x, time);
    }

    this.shockwaves.forEach((wave) => {
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, wave.sprite.getBounds())) {
        this.damagePlayer(wave.damage, wave.sprite.x, time);
      }
    });
  }

  private damagePlayer(amount: number, sourceX: number, time: number): void {
    if (time < this.playerInvulnerableUntil) return;

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.playerInvulnerableUntil = time + 720;
    const knockDirection = this.player.x < sourceX ? -1 : 1;
    this.player.body.setVelocity(knockDirection * 430, -360);
    this.cameras.main.shake(150, 0.008);
    this.playerGlow.setAlpha(0.48);
    this.player.setAlpha(0.42);
    this.tweens.add({ targets: this.playerGlow, alpha: 0.12, duration: 430, ease: 'Sine.Out' });
    this.tweens.add({ targets: this.player, alpha: 1, duration: 130, yoyo: true, repeat: 2 });
  }

  private completeAttack(delay: number): void {
    if (this.fightOver) return;
    this.bossState = 'idle';
    this.coreMode = 'orbit';
    this.coreDangerous = false;
    this.coreOrbitRadius = 35;
    this.coreOrbitSpeed = this.bossPhase === 1 ? 1.7 : 2.5;
    this.boss.setScale(1, 1);
    this.nextAttackAt = this.time.now + delay;
  }

  private beginPhaseTwo(): void {
    this.bossPhase = 2;
    this.bossState = 'transition';
    this.coreMode = 'center';
    this.coreDangerous = false;
    this.phaseText.setText('PHASE II');
    this.statusText.setText('PHASE II');
    this.theme?.setRate(1.035);

    this.tweens.add({ targets: this.statusText, alpha: 0, duration: 900, delay: 650 });
    this.tweens.add({
      targets: this.core,
      rotation: this.core.rotation - Math.PI * 8,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 1200,
      ease: 'Cubic.In',
    });
    this.tweens.add({
      targets: this.bossGlow,
      alpha: 0.55,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 600,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.InOut',
    });
    this.tweens.add({
      targets: this.boss,
      scaleX: 0.9,
      scaleY: 0.9,
      rotation: 0.08,
      duration: 520,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.cameras.main.flash(180, 225, 235, 255, false);
        this.cameras.main.shake(360, 0.012);
        this.core.setScale(1);
        this.boss.setScale(1).setRotation(0);
        this.completeAttack(850);
      },
    });
  }

  private updateHud(time: number): void {
    const playerRatio = Phaser.Math.Clamp(this.playerHealth / MAX_PLAYER_HEALTH, 0, 1);
    const bossRatio = Phaser.Math.Clamp(this.bossHealth / MAX_BOSS_HEALTH, 0, 1);
    this.playerHealthFill.setDisplaySize(230 * playerRatio, 13);
    this.bossHealthFill.setDisplaySize(440 * bossRatio, 14);

    if (time >= this.dashReadyAt) {
      this.dashText.setText('DASH READY').setColor('#dce7f7');
    } else {
      const remaining = Math.max(0, (this.dashReadyAt - time) / 1000);
      this.dashText.setText(`DASH ${remaining.toFixed(1)}s`).setColor('#758095');
    }
  }

  private updateVisualTracking(): void {
    this.playerGlow.setPosition(this.player.x, this.player.y);
    this.bossGlow.setPosition(this.boss.x, this.boss.y);
    this.coreGlow.setPosition(this.core.x, this.core.y);
    this.coreGlow.setAlpha(this.coreDangerous ? 0.58 : 0.34);
    this.coreGlow.setDisplaySize(this.coreDangerous ? 150 : 110, this.coreDangerous ? 150 : 110);
  }

  private updateCameraLead(): void {
    const velocity = this.player.body.velocity;
    this.cameras.main.setFollowOffset(-velocity.x * 0.22, -velocity.y * 0.055);
  }

  private spawnImpactFlash(x: number, y: number, size: number): void {
    const flash = this.add.image(x, y, 'core-glow')
      .setDisplaySize(size, size)
      .setAlpha(0.58)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(15);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 330,
      ease: 'Quad.Out',
      onComplete: () => flash.destroy(),
    });
  }

  private winFight(): void {
    this.fightOver = true;
    this.bossState = 'defeated';
    this.coreDangerous = false;
    this.theme?.stop();
    this.statusText.setText('PROLOGUE DEFEATED\nENTER: MENU').setAlpha(1).setLineSpacing(14);
    this.tweens.killTweensOf(this.boss);
    this.tweens.killTweensOf(this.core);
    this.tweens.add({
      targets: [this.boss, this.core],
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 900,
      ease: 'Expo.Out',
    });
    this.tweens.add({ targets: this.bossGlow, alpha: 0, scaleX: 2, scaleY: 2, duration: 1100 });
    this.cameras.main.flash(240, 225, 235, 255, false);
  }

  private loseFight(): void {
    this.fightOver = true;
    this.theme?.setRate(0.8);
    this.statusText.setText('SYSTEM FRACTURED\nR: RETRY  •  ENTER: MENU').setAlpha(1).setLineSpacing(14);
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.tweens.add({ targets: [this.player, this.playerGlow], alpha: 0, rotation: 0.7, duration: 700, ease: 'Cubic.In' });
    this.cameras.main.shake(420, 0.014);
  }
}
