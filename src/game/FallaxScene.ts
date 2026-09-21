import Phaser from 'phaser';

type PhysicsRectangle = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

type Surface = {
  object: PhysicsRectangle;
  x: number;
  top: number;
  width: number;
};

type Projectile = {
  object: PhysicsRectangle;
  damage: number;
  expiresAt: number;
};

type Hazard = {
  object: Phaser.GameObjects.Rectangle;
  expiresAt: number;
};

type CoreMode = 'orbit' | 'manual' | 'rotation' | 'center';

type WeaponDefinition = {
  name: string;
  cooldown: number;
  damage: number;
  speed: number;
  size: number;
  spread: number;
  pellets: number;
  recoil: number;
};

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;
const ROOM_LEFT = 50;
const ROOM_RIGHT = 1550;
const ROOM_TOP = 50;
const FLOOR_TOP = 820;
const PLAYER_SIZE = 42;
const BOSS_SIZE = 150;

const COLORS = {
  background: 0x111318,
  backgroundSoft: 0x171a21,
  room: 0x20242d,
  roomShade: 0x181b22,
  platform: 0x454b57,
  platformTop: 0x626a78,
  player: 0x9ba0aa,
  playerShade: 0x747a85,
  playerBright: 0xc6cad1,
  boss: 0x6c727d,
  bossShade: 0x4d525c,
  bossBright: 0x959ca8,
  core: 0xffffff,
  coreSoft: 0xdfe7f2,
  danger: 0xff726f,
  uiPanel: 0x282c35,
  health: 0xe8ebef,
  damage: 0xff8984,
};

const PRIMARY_WEAPONS: WeaponDefinition[] = [
  { name: 'QUADDER', cooldown: 125, damage: 4, speed: 1080, size: 9, spread: 4, pellets: 1, recoil: 0 },
  { name: 'NEEDLE', cooldown: 270, damage: 11, speed: 1320, size: 7, spread: 0, pellets: 1, recoil: 0 },
];

const SECONDARY_WEAPONS: WeaponDefinition[] = [
  { name: 'RAMSHOT', cooldown: 760, damage: 28, speed: 860, size: 19, spread: 1, pellets: 1, recoil: 95 },
  { name: 'SCATTER', cooldown: 920, damage: 6, speed: 800, size: 10, spread: 15, pellets: 6, recoil: 55 },
];

export class FallaxScene extends Phaser.Scene {
  private player!: PhysicsRectangle;
  private playerShade!: Phaser.GameObjects.Rectangle;
  private boss!: PhysicsRectangle;
  private bossShade!: Phaser.GameObjects.Rectangle;
  private core!: Phaser.GameObjects.Rectangle;
  private floor!: PhysicsRectangle;
  private platforms: Surface[] = [];
  private projectiles: Projectile[] = [];
  private hazards: Hazard[] = [];
  private cameraTarget!: Phaser.GameObjects.Zone;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private playerHealth = 100;
  private bossHealth = 900;
  private bossPhase = 1;
  private bossState = 'intro';
  private bossAlive = true;
  private bossVulnerable = false;
  private bossDangerous = false;
  private coreDangerous = false;
  private playerInvulnerableUntil = 0;
  private dashInvulnerable = false;
  private isDashing = false;
  private dashReadyAt = 0;
  private lastGroundedAt = 0;
  private jumpBufferedAt = -9999;
  private wasGrounded = false;
  private facing = 1;
  private lastPrimaryShot = -9999;
  private lastSecondaryShot = -9999;
  private primaryIndex = 0;
  private secondaryIndex = 0;
  private attackEpoch = 0;
  private previousAttack = '';

  private coreMode: CoreMode = 'orbit';
  private coreAngle = 0;
  private coreOrbitDirection = 1;
  private rotationRadius = 30;
  private rotationSpeed = 1.4;
  private ricochetVelocity = new Phaser.Math.Vector2();
  private ricochetBounces = 0;
  private ricochetResolve: (() => void) | null = null;
  private ricochetTrailAccumulator = 0;

  private bossHealthFill!: Phaser.GameObjects.Rectangle;
  private playerHealthFill!: Phaser.GameObjects.Rectangle;
  private dashFill!: Phaser.GameObjects.Rectangle;
  private phaseLabel!: Phaser.GameObjects.Text;
  private primaryLabel!: Phaser.GameObjects.Text;
  private secondaryLabel!: Phaser.GameObjects.Text;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlaySubtitle!: Phaser.GameObjects.Text;
  private soundtrackStatus!: Phaser.GameObjects.Text;

  private music?: Phaser.Sound.BaseSound;
  private audioAvailable = false;
  private musicStarted = false;
  private gameEnded = false;

  constructor() {
    super('fallax');
  }

  preload(): void {
    this.load.once('filecomplete-audio-prologueTheme', () => {
      this.audioAvailable = true;
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === 'prologueTheme') this.audioAvailable = false;
    });
    this.load.audio('prologueTheme', 'audio/623104_Bossfight---Milky-Ways.mp3');
  }

  create(): void {
    this.physics.world.setBounds(ROOM_LEFT, ROOM_TOP, ROOM_RIGHT - ROOM_LEFT, FLOOR_TOP - ROOM_TOP);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.input.mouse?.disableContextMenu();

    this.createRoom();
    this.createPlayer();
    this.createBoss();
    this.createInput();
    this.createUI();
    this.createCamera();
    this.createCollisions();
    this.createAudioUnlock();
    this.showIntro();
  }

  update(time: number, delta: number): void {
    if (this.gameEnded) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();
      return;
    }

    this.updatePlayer(time);
    this.updateWeapons(time);
    this.updateProjectiles(time);
    this.updateHazards(time);
    this.updateBossMotion(delta);
    this.updateVisuals(time, delta);
    this.updateCamera(delta);
    this.updateUI(time);
    this.checkDangerCollisions(time);
  }

  private createRoom(): void {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, COLORS.background);
    this.add.rectangle(WORLD_WIDTH / 2, 435, ROOM_RIGHT - ROOM_LEFT, 770, COLORS.room);
    this.add.rectangle(WORLD_WIDTH / 2 + 22, 454, ROOM_RIGHT - ROOM_LEFT - 44, 732, COLORS.backgroundSoft);
    this.add.rectangle(ROOM_LEFT, 435, 28, 770, COLORS.roomShade).setDepth(2);
    this.add.rectangle(ROOM_RIGHT, 435, 28, 770, COLORS.roomShade).setDepth(2);
    this.add.rectangle(WORLD_WIDTH / 2, ROOM_TOP, ROOM_RIGHT - ROOM_LEFT, 28, COLORS.roomShade);

    this.floor = this.makeStaticRect(WORLD_WIDTH / 2, FLOOR_TOP + 40, ROOM_RIGHT - ROOM_LEFT, 80, COLORS.platform);
    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_TOP + 4, ROOM_RIGHT - ROOM_LEFT, 8, COLORS.platformTop).setDepth(3);

    const definitions = [
      { x: 270, y: 650, width: 320 },
      { x: 650, y: 535, width: 300 },
      { x: 1015, y: 645, width: 260 },
      { x: 1320, y: 495, width: 260 },
      { x: 805, y: 710, width: 230 },
    ];

    for (const definition of definitions) {
      const platform = this.makeStaticRect(definition.x, definition.y, definition.width, 26, COLORS.platform);
      this.add.rectangle(definition.x, definition.y - 9, definition.width, 8, COLORS.platformTop).setDepth(3);
      this.add.rectangle(definition.x + 10, definition.y + 10, definition.width - 20, 9, COLORS.roomShade, 0.7).setDepth(2);
      this.platforms.push({ object: platform, x: definition.x, top: definition.y - 13, width: definition.width });
    }
  }

  private createPlayer(): void {
    this.player = this.makeDynamicRect(250, 730, PLAYER_SIZE, PLAYER_SIZE, COLORS.player);
    this.player.setDepth(20);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(430, 1250);
    this.player.body.setDragX(1550);
    this.player.body.setSize(PLAYER_SIZE, PLAYER_SIZE);
    this.playerShade = this.add.rectangle(this.player.x + 12, this.player.y + 2, 14, PLAYER_SIZE - 6, COLORS.playerShade).setDepth(21);
  }

  private createBoss(): void {
    this.boss = this.makeDynamicRect(1110, 250, BOSS_SIZE, BOSS_SIZE, COLORS.boss);
    this.boss.body.setAllowGravity(false);
    this.boss.body.setImmovable(true);
    this.boss.body.setSize(BOSS_SIZE, BOSS_SIZE);
    this.boss.setDepth(12);
    this.bossShade = this.add.rectangle(this.boss.x + 42, this.boss.y + 6, 40, BOSS_SIZE - 16, COLORS.bossShade).setDepth(13);
    this.core = this.add.rectangle(this.boss.x, this.boss.y, 34, 34, COLORS.core).setDepth(18);
  }

  private createInput(): void {
    this.cursors = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);
    this.keys = this.input.keyboard?.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      R: Phaser.Input.Keyboard.KeyCodes.R,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private createCollisions(): void {
    this.physics.add.collider(this.player, this.floor);
    for (const platform of this.platforms) {
      this.physics.add.collider(this.player, platform.object, undefined, () => {
        const body = this.player.body;
        const platformBody = platform.object.body;
        const wasAbove = body.prev.y + body.height <= platformBody.top + 9;
        return body.velocity.y >= 0 && wasAbove;
      });
    }
  }

  private createCamera(): void {
    this.cameraTarget = this.add.zone(this.player.x, this.player.y, 1, 1);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.075, 0.075);
  }

  private createUI(): void {
    this.add.rectangle(640, 30, 540, 14, COLORS.uiPanel).setScrollFactor(0).setDepth(100);
    this.bossHealthFill = this.add.rectangle(374, 30, 532, 8, COLORS.health).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    this.add.text(640, 48, 'PROLOGUE', { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#e8ebef', letterSpacing: 7 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
    this.phaseLabel = this.add.text(930, 21, 'PHASE I', { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#858c98', letterSpacing: 2 }).setScrollFactor(0).setDepth(101);

    this.add.rectangle(164, 674, 250, 14, COLORS.uiPanel).setScrollFactor(0).setDepth(100);
    this.playerHealthFill = this.add.rectangle(43, 674, 242, 8, COLORS.health).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    this.add.text(42, 644, 'INTEGRITY', { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#858c98', letterSpacing: 2 }).setScrollFactor(0).setDepth(101);
    this.add.rectangle(164, 704, 250, 8, COLORS.uiPanel).setScrollFactor(0).setDepth(100);
    this.dashFill = this.add.rectangle(43, 704, 242, 4, COLORS.playerBright).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    this.add.text(310, 668, 'DASH', { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#858c98', letterSpacing: 2 }).setScrollFactor(0).setDepth(101);

    const loadoutX = 500;
    this.add.rectangle(loadoutX, 675, 178, 52, COLORS.uiPanel).setScrollFactor(0).setDepth(100);
    this.add.rectangle(loadoutX + 194, 675, 178, 52, COLORS.uiPanel).setScrollFactor(0).setDepth(100);
    this.primaryLabel = this.add.text(loadoutX - 78, 660, PRIMARY_WEAPONS[this.primaryIndex].name, { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#e8ebef', letterSpacing: 1 }).setScrollFactor(0).setDepth(101);
    this.secondaryLabel = this.add.text(loadoutX + 116, 660, SECONDARY_WEAPONS[this.secondaryIndex].name, { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#e8ebef', letterSpacing: 1 }).setScrollFactor(0).setDepth(101);
    this.add.text(loadoutX - 78, 682, 'PRIMARY · Q', { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#858c98', letterSpacing: 1 }).setScrollFactor(0).setDepth(101);
    this.add.text(loadoutX + 116, 682, 'SECONDARY · E', { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#858c98', letterSpacing: 1 }).setScrollFactor(0).setDepth(101);

    for (let index = 0; index < 3; index += 1) {
      const x = 895 + index * 92;
      this.add.rectangle(x, 675, 78, 52, COLORS.uiPanel).setScrollFactor(0).setDepth(100);
      this.add.text(x, 664, `${index + 1}`, { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#858c98' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      this.add.text(x, 684, 'EMPTY', { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#5f6570', letterSpacing: 1 }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    }

    this.add.text(30, 28, 'A/D MOVE  ·  SPACE JUMP  ·  SHIFT DASH  ·  MOUSE FIRE', { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#858c98', letterSpacing: 1 }).setScrollFactor(0).setDepth(101);
    this.soundtrackStatus = this.add.text(1250, 704, '', { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#858c98', align: 'right' }).setOrigin(1, 1).setScrollFactor(0).setDepth(101);
    this.overlayTitle = this.add.text(640, 278, '', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '58px', color: '#ffffff', letterSpacing: 12 }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
    this.overlaySubtitle = this.add.text(640, 350, '', { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#a6adb8', letterSpacing: 4, align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
  }

  private createAudioUnlock(): void {
    const unlock = (): void => this.startMusic();
    this.input.once('pointerdown', unlock);
    this.input.keyboard?.once('keydown', unlock);
    this.soundtrackStatus.setText(this.audioAvailable ? 'INPUT ENABLES PROLOGUE THEME' : 'ADD THE SUPPLIED MP3 TO public/audio');
  }

  private showIntro(): void {
    this.bossVulnerable = false;
    this.overlayTitle.setText('FALLAX').setAlpha(1).setScale(0.86);
    this.overlaySubtitle.setText('PROLOGUE').setAlpha(0);
    this.tweens.add({ targets: this.overlayTitle, scale: 1, alpha: 1, duration: 650, ease: 'Back.easeOut' });
    this.time.delayedCall(500, () => {
      this.tweens.add({ targets: this.overlaySubtitle, alpha: 1, y: 340, duration: 500, ease: 'Cubic.easeOut' });
    });
    this.time.delayedCall(1700, () => {
      this.tweens.add({
        targets: [this.overlayTitle, this.overlaySubtitle],
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.bossVulnerable = true;
          this.bossState = 'idle';
          this.attackEpoch += 1;
          void this.runBossLoop(this.attackEpoch);
        },
      });
    });
  }

  private updatePlayer(time: number): void {
    const body = this.player.body;
    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.lastGroundedAt = time;

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (jumpPressed) this.jumpBufferedAt = time;

    if (!this.wasGrounded && grounded && body.velocity.y >= 0) {
      this.spawnImpact(this.player.x, this.player.y + PLAYER_SIZE / 2, 6, COLORS.playerShade, 0.35);
      this.tweens.add({ targets: this.player, scaleX: 1.18, scaleY: 0.82, duration: 85, yoyo: true, ease: 'Quad.easeOut' });
    }
    this.wasGrounded = grounded;

    if (time - this.jumpBufferedAt < 130 && time - this.lastGroundedAt < 115 && !this.isDashing) {
      body.setVelocityY(-690);
      this.jumpBufferedAt = -9999;
      this.lastGroundedAt = -9999;
      this.tweens.add({ targets: this.player, scaleX: 0.86, scaleY: 1.16, duration: 95, yoyo: true, ease: 'Quad.easeOut' });
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) && time >= this.dashReadyAt) this.startDash(time);

    if (!this.isDashing) {
      const left = this.keys.A.isDown || this.cursors.left.isDown;
      const right = this.keys.D.isDown || this.cursors.right.isDown;
      const direction = Number(right) - Number(left);
      if (direction !== 0) {
        this.facing = direction;
        body.setAccelerationX(direction * (grounded ? 2450 : 1650));
        body.setDragX(grounded ? 1250 : 380);
      } else {
        body.setAccelerationX(0);
        body.setDragX(grounded ? 1750 : 420);
      }

      if (!this.keys.SPACE.isDown && !this.keys.W.isDown && !this.cursors.up.isDown && body.velocity.y < -250) {
        body.setVelocityY(body.velocity.y * 0.88);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.primaryIndex = (this.primaryIndex + 1) % PRIMARY_WEAPONS.length;
      this.primaryLabel.setText(PRIMARY_WEAPONS[this.primaryIndex].name);
      this.pulseUI(this.primaryLabel);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.secondaryIndex = (this.secondaryIndex + 1) % SECONDARY_WEAPONS.length;
      this.secondaryLabel.setText(SECONDARY_WEAPONS[this.secondaryIndex].name);
      this.pulseUI(this.secondaryLabel);
    }
  }

  private startDash(time: number): void {
    this.isDashing = true;
    this.dashInvulnerable = true;
    this.dashReadyAt = time + 650;
    const left = this.keys.A.isDown || this.cursors.left.isDown;
    const right = this.keys.D.isDown || this.cursors.right.isDown;
    const direction = Number(right) - Number(left) || this.facing;
    this.player.body.setAllowGravity(false);
    this.player.body.setAcceleration(0, 0);
    this.player.body.setVelocity(direction * 930, 0);
    this.player.setFillStyle(COLORS.playerBright);

    for (let index = 0; index < 5; index += 1) {
      this.time.delayedCall(index * 28, () => this.spawnAfterimage(this.player.x, this.player.y, PLAYER_SIZE, PLAYER_SIZE, COLORS.player, 0.34));
    }

    this.time.delayedCall(155, () => {
      if (!this.player.active) return;
      this.isDashing = false;
      this.dashInvulnerable = false;
      this.player.body.setAllowGravity(true);
      this.player.body.setVelocityX(direction * 420);
      this.player.setFillStyle(COLORS.player);
    });
  }

  private updateWeapons(time: number): void {
    if (!this.bossAlive || this.bossState === 'intro') return;
    const pointer = this.input.activePointer;
    if (pointer.leftButtonDown()) {
      const weapon = PRIMARY_WEAPONS[this.primaryIndex];
      if (time - this.lastPrimaryShot >= weapon.cooldown) {
        this.lastPrimaryShot = time;
        this.fireWeapon(weapon);
      }
    }
    if (pointer.rightButtonDown()) {
      const weapon = SECONDARY_WEAPONS[this.secondaryIndex];
      if (time - this.lastSecondaryShot >= weapon.cooldown) {
        this.lastSecondaryShot = time;
        this.fireWeapon(weapon);
      }
    }
  }

  private fireWeapon(weapon: WeaponDefinition): void {
    const pointer = this.input.activePointer;
    const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    for (let index = 0; index < weapon.pellets; index += 1) {
      const offset = weapon.pellets === 1 ? Phaser.Math.FloatBetween(-weapon.spread, weapon.spread) : Phaser.Math.Linear(-weapon.spread, weapon.spread, index / Math.max(1, weapon.pellets - 1));
      const angle = baseAngle + Phaser.Math.DegToRad(offset);
      const x = this.player.x + Math.cos(angle) * PLAYER_SIZE * 0.72;
      const y = this.player.y + Math.sin(angle) * PLAYER_SIZE * 0.72;
      const projectile = this.makeDynamicRect(x, y, weapon.size, weapon.size, COLORS.coreSoft);
      projectile.body.setAllowGravity(false);
      projectile.body.setVelocity(Math.cos(angle) * weapon.speed, Math.sin(angle) * weapon.speed);
      projectile.setRotation(angle).setDepth(16);
      this.projectiles.push({ object: projectile, damage: weapon.damage, expiresAt: this.time.now + 2200 });
    }

    if (weapon.recoil > 0 && !this.isDashing) {
      this.player.body.velocity.x -= Math.cos(baseAngle) * weapon.recoil;
      this.player.body.velocity.y -= Math.sin(baseAngle) * weapon.recoil * 0.55;
    }
    this.spawnMuzzle(this.player.x + Math.cos(baseAngle) * 28, this.player.y + Math.sin(baseAngle) * 28, baseAngle);
  }

  private updateProjectiles(time: number): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      const object = projectile.object;
      if (!object.active || time >= projectile.expiresAt || this.projectileHitRoom(object)) {
        this.destroyProjectile(index);
        continue;
      }
      if (this.bossVulnerable && Phaser.Geom.Intersects.RectangleToRectangle(object.getBounds(), this.boss.getBounds())) {
        this.damageBoss(projectile.damage);
        this.spawnImpact(object.x, object.y, 4, COLORS.core, 0.32);
        this.destroyProjectile(index);
      }
    }
  }

  private updateHazards(time: number): void {
    for (let index = this.hazards.length - 1; index >= 0; index -= 1) {
      const hazard = this.hazards[index];
      if (!hazard.object.active || time >= hazard.expiresAt) {
        hazard.object.destroy();
        this.hazards.splice(index, 1);
      }
    }
  }

  private updateBossMotion(delta: number): void {
    const seconds = delta / 1000;
    if (this.bossState === 'ricochet') {
      this.boss.x += this.ricochetVelocity.x * seconds;
      this.boss.y += this.ricochetVelocity.y * seconds;
      this.spawnRicochetTrail(delta);
      const half = BOSS_SIZE / 2;
      let bounced = false;

      if (this.boss.x - half <= ROOM_LEFT + 14 && this.ricochetVelocity.x < 0) {
        this.boss.x = ROOM_LEFT + 14 + half;
        this.ricochetVelocity.x *= -1;
        bounced = true;
      } else if (this.boss.x + half >= ROOM_RIGHT - 14 && this.ricochetVelocity.x > 0) {
        this.boss.x = ROOM_RIGHT - 14 - half;
        this.ricochetVelocity.x *= -1;
        bounced = true;
      }
      if (this.boss.y - half <= ROOM_TOP + 14 && this.ricochetVelocity.y < 0) {
        this.boss.y = ROOM_TOP + 14 + half;
        this.ricochetVelocity.y *= -1;
        bounced = true;
      } else if (this.boss.y + half >= FLOOR_TOP && this.ricochetVelocity.y > 0) {
        this.boss.y = FLOOR_TOP - half;
        this.ricochetVelocity.y *= -1;
        bounced = true;
      }

      if (bounced) {
        this.ricochetBounces += 1;
        this.impactBoss(this.boss.x, this.boss.y, 0.008, 90);
        this.tweens.add({ targets: this.boss, scaleX: Math.abs(this.ricochetVelocity.x) > Math.abs(this.ricochetVelocity.y) ? 0.78 : 1.2, scaleY: Math.abs(this.ricochetVelocity.y) >= Math.abs(this.ricochetVelocity.x) ? 0.78 : 1.2, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
        if (this.ricochetBounces >= 7 && this.ricochetResolve) {
          const resolve = this.ricochetResolve;
          this.ricochetResolve = null;
          resolve();
        }
      }
    }

    if (this.coreMode === 'orbit') {
      this.coreAngle += seconds * 1.8 * this.coreOrbitDirection;
      this.core.x = this.boss.x + Math.cos(this.coreAngle) * 34;
      this.core.y = this.boss.y + Math.sin(this.coreAngle) * 34;
    } else if (this.coreMode === 'rotation') {
      this.coreAngle += seconds * this.rotationSpeed * this.coreOrbitDirection;
      this.core.x = this.boss.x + Math.cos(this.coreAngle) * this.rotationRadius;
      this.core.y = this.boss.y + Math.sin(this.coreAngle) * this.rotationRadius;
    } else if (this.coreMode === 'center') {
      this.core.x = this.boss.x;
      this.core.y = this.boss.y;
    }
    this.core.rotation += seconds * 4.4 * this.coreOrbitDirection;
  }

  private updateVisuals(time: number, delta: number): void {
    this.playerShade.x = this.player.x + 12 * this.player.scaleX;
    this.playerShade.y = this.player.y + 2;
    this.playerShade.setScale(this.player.scaleX, this.player.scaleY).setAlpha(this.player.alpha);
    this.bossShade.x = this.boss.x + 42 * this.boss.scaleX;
    this.bossShade.y = this.boss.y + 6;
    this.bossShade.setScale(this.boss.scaleX, this.boss.scaleY).setRotation(this.boss.rotation).setAlpha(this.boss.alpha);

    if (time < this.playerInvulnerableUntil && !this.dashInvulnerable) this.player.setAlpha(Math.floor(time / 70) % 2 === 0 ? 0.36 : 1);
    else this.player.setAlpha(1);

    const horizontalStretch = Phaser.Math.Clamp(Math.abs(this.player.body.velocity.x) / 2200, 0, 0.08);
    if (!this.isDashing && !this.tweens.isTweening(this.player)) {
      this.player.scaleX = Phaser.Math.Linear(this.player.scaleX, 1 + horizontalStretch, 0.12 * (delta / 16.67));
      this.player.scaleY = Phaser.Math.Linear(this.player.scaleY, 1 - horizontalStretch, 0.12 * (delta / 16.67));
    }
  }

  private updateCamera(delta: number): void {
    const targetX = this.player.x + Phaser.Math.Clamp(this.player.body.velocity.x * 0.22, -125, 125);
    const targetY = this.player.y + Phaser.Math.Clamp(this.player.body.velocity.y * 0.06, -48, 70) - 30;
    const factor = 1 - Math.pow(0.001, delta / 1000);
    this.cameraTarget.x = Phaser.Math.Linear(this.cameraTarget.x, targetX, factor);
    this.cameraTarget.y = Phaser.Math.Linear(this.cameraTarget.y, targetY, factor);
  }

  private updateUI(time: number): void {
    this.playerHealthFill.displayWidth = 242 * Phaser.Math.Clamp(this.playerHealth / 100, 0, 1);
    this.bossHealthFill.displayWidth = 532 * Phaser.Math.Clamp(this.bossHealth / 900, 0, 1);
    this.phaseLabel.setText(`PHASE ${this.bossPhase === 1 ? 'I' : 'II'}`);
    this.dashFill.displayWidth = 242 * Phaser.Math.Clamp(1 - (this.dashReadyAt - time) / 650, 0, 1);
  }

  private checkDangerCollisions(time: number): void {
    const playerBounds = this.player.getBounds();
    if (this.bossDangerous && Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.boss.getBounds())) this.damagePlayer(this.bossPhase === 1 ? 22 : 28, time);
    if (this.coreDangerous && Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.core.getBounds())) this.damagePlayer(this.bossPhase === 1 ? 18 : 24, time);
    for (const hazard of this.hazards) {
      if (hazard.object.active && Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, hazard.object.getBounds())) this.damagePlayer(18, time);
    }
  }

  private damagePlayer(amount: number, time: number): void {
    if (time < this.playerInvulnerableUntil || this.dashInvulnerable || this.gameEnded) return;
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.playerInvulnerableUntil = time + 780;
    this.cameras.main.shake(130, 0.006);
    this.flashScreen(COLORS.damage, 0.18, 120);
    this.spawnImpact(this.player.x, this.player.y, 10, COLORS.damage, 0.45);
    const away = Math.sign(this.player.x - this.boss.x) || 1;
    this.player.body.setVelocity(away * 380, -330);
    if (this.playerHealth <= 0) this.endGame(false);
  }

  private damageBoss(amount: number): void {
    if (!this.bossVulnerable || !this.bossAlive || this.gameEnded) return;
    this.bossHealth = Math.max(0, this.bossHealth - amount);
    this.boss.setFillStyle(COLORS.bossBright);
    this.time.delayedCall(45, () => {
      if (this.boss.active) this.boss.setFillStyle(COLORS.boss);
    });
    if (this.bossHealth <= 0) this.endGame(true);
  }

  private async runBossLoop(epoch: number): Promise<void> {
    await this.wait(700);
    while (this.bossAlive && !this.gameEnded && epoch === this.attackEpoch) {
      if (this.bossPhase === 1 && this.bossHealth <= 450) await this.phaseTransition();
      const attack = this.chooseAttack();
      this.previousAttack = attack;
      if (attack === 'swing') await this.attackSwing();
      else if (attack === 'crash') await this.attackCrash(this.bossPhase === 2);
      else if (attack === 'slide') await this.attackSlide();
      else if (attack === 'rotation') await this.attackRotation();
      else if (attack === 'ricochet') await this.attackRicochet();
      this.bossDangerous = false;
      this.coreDangerous = false;
      this.coreMode = 'orbit';
      this.bossState = 'idle';
      await this.wait(this.bossPhase === 1 ? 680 : 440);
    }
  }

  private chooseAttack(): string {
    const playerOnFloor = this.player.body.blocked.down && this.player.y > FLOOR_TOP - 120;
    const pool = this.bossPhase === 1 ? (playerOnFloor ? ['swing', 'crash', 'slide'] : ['swing', 'crash', 'swing']) : ['swing', 'rotation', 'crash', 'ricochet'];
    const filtered = pool.filter((attack) => attack !== this.previousAttack);
    return Phaser.Utils.Array.GetRandom(filtered.length > 0 ? filtered : pool);
  }

  private async attackSwing(): Promise<void> {
    this.bossState = 'swing';
    this.coreMode = 'manual';
    this.coreDangerous = false;
    await this.tweenTo(this.boss, { y: 270, angle: 0 }, 320, 'Sine.easeInOut');

    const predicted = this.predictPlayer(0.24);
    const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, predicted.x, predicted.y);
    const pullX = this.boss.x - Math.cos(angle) * 44;
    const pullY = this.boss.y - Math.sin(angle) * 44;
    const line = this.createBeam(this.boss.x, this.boss.y, predicted.x, predicted.y, 8, COLORS.danger, 0.28).setDepth(10);
    this.tweens.add({ targets: line, alpha: 0.55, duration: 140, yoyo: true, repeat: 2 });

    await Promise.all([
      this.tweenTo(this.core, { x: pullX, y: pullY, scaleX: 0.82, scaleY: 1.2 }, 380, 'Back.easeOut'),
      this.tweenTo(this.boss, { x: this.boss.x - Math.cos(angle) * 18, y: this.boss.y - Math.sin(angle) * 18, angle: Phaser.Math.RadToDeg(angle) * 0.035 }, 380, 'Cubic.easeOut'),
    ]);
    await this.wait(150);
    line.destroy();

    const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, predicted.x, predicted.y);
    const maxDistance = Math.min(distance, this.bossPhase === 1 ? 630 : 760);
    const targetX = this.boss.x + Math.cos(angle) * maxDistance;
    const targetY = this.boss.y + Math.sin(angle) * maxDistance;
    this.coreDangerous = true;
    this.spawnAfterimage(this.core.x, this.core.y, 34, 34, COLORS.core, 0.45);
    await this.tweenTo(this.core, { x: targetX, y: targetY, scaleX: 1.45, scaleY: 0.72 }, this.bossPhase === 1 ? 210 : 170, 'Expo.easeIn');
    this.spawnImpact(targetX, targetY, 8, COLORS.core, 0.45);
    this.cameras.main.shake(70, 0.003);
    await this.wait(70);
    this.coreDangerous = false;
    await Promise.all([
      this.tweenTo(this.core, { x: this.boss.x, y: this.boss.y, scaleX: 1, scaleY: 1 }, 310, 'Back.easeOut'),
      this.tweenTo(this.boss, { x: 1110, y: 250, angle: 0 }, 430, 'Cubic.easeInOut'),
    ]);
  }

  private async attackCrash(phaseTwo: boolean): Promise<void> {
    this.bossState = 'crash';
    this.coreMode = 'orbit';
    const surface = this.findPlayerSurface();
    const targetX = Phaser.Math.Clamp(this.player.x + this.player.body.velocity.x * 0.12, surface.x - surface.width / 2 + BOSS_SIZE / 2, surface.x + surface.width / 2 - BOSS_SIZE / 2);
    const targetY = surface.top - BOSS_SIZE / 2;
    await this.tweenTo(this.boss, { x: targetX, y: Math.max(145, targetY - 270), angle: 0 }, 520, 'Cubic.easeInOut');

    const marker = this.add.rectangle(targetX, surface.top - 5, Math.min(160, surface.width), 10, COLORS.danger, 0.38).setDepth(9);
    this.tweens.add({ targets: marker, alpha: 0.85, scaleX: 0.42, duration: 300, ease: 'Cubic.easeIn' });
    await this.tweenTo(this.boss, { y: this.boss.y - 48, scaleX: 0.88, scaleY: 1.14 }, 360, 'Back.easeOut');
    await this.wait(this.bossPhase === 1 ? 170 : 120);
    marker.destroy();
    this.bossDangerous = true;
    await this.tweenTo(this.boss, { y: targetY, scaleX: 1.16, scaleY: 0.82 }, this.bossPhase === 1 ? 300 : 235, 'Expo.easeIn');
    this.impactBoss(targetX, surface.top, phaseTwo ? 0.014 : 0.01, phaseTwo ? 190 : 140);
    if (phaseTwo) this.emitShockwaves(surface, targetX);
    await this.wait(230);
    this.bossDangerous = false;
    await this.tweenTo(this.boss, { scaleX: 1, scaleY: 1, y: Math.max(180, targetY - 180) }, 360, 'Back.easeOut');
    await this.tweenTo(this.boss, { x: 1110, y: 250 }, 410, 'Cubic.easeInOut');
  }

  private async attackSlide(): Promise<void> {
    this.bossState = 'slide';
    this.coreMode = 'orbit';
    const targetX = Phaser.Math.Clamp(this.player.x, ROOM_LEFT + BOSS_SIZE / 2 + 40, ROOM_RIGHT - BOSS_SIZE / 2 - 40);
    const groundY = FLOOR_TOP - BOSS_SIZE / 2;
    await this.tweenTo(this.boss, { x: targetX, y: groundY - 260, angle: 0 }, 500, 'Cubic.easeInOut');
    await this.tweenTo(this.boss, { y: groundY - 305, scaleX: 0.88, scaleY: 1.15 }, 310, 'Back.easeOut');
    await this.wait(135);
    this.bossDangerous = true;
    await this.tweenTo(this.boss, { y: groundY, scaleX: 1.15, scaleY: 0.82 }, 255, 'Expo.easeIn');
    this.impactBoss(this.boss.x, FLOOR_TOP, 0.01, 140);
    await this.wait(150);

    const goLeft = this.player.x - ROOM_LEFT < ROOM_RIGHT - this.player.x;
    const wallX = goLeft ? ROOM_LEFT + 14 + BOSS_SIZE / 2 : ROOM_RIGHT - 14 - BOSS_SIZE / 2;
    const beam = this.add.rectangle((this.boss.x + wallX) / 2, groundY, Math.abs(wallX - this.boss.x), 20, COLORS.danger, 0.25).setDepth(8);
    this.tweens.add({ targets: beam, alpha: 0.58, duration: 110, yoyo: true, repeat: 2 });
    await this.tweenTo(this.boss, { x: this.boss.x + (goLeft ? 38 : -38), scaleX: 0.78, scaleY: 1.12 }, 290, 'Back.easeOut');
    await this.wait(110);
    beam.destroy();
    for (let index = 0; index < 5; index += 1) {
      this.time.delayedCall(index * 45, () => this.spawnAfterimage(this.boss.x, this.boss.y, BOSS_SIZE, BOSS_SIZE, COLORS.boss, 0.22));
    }
    await this.tweenTo(this.boss, { x: wallX, scaleX: 1.25, scaleY: 0.82 }, 390, 'Expo.easeIn');
    this.impactBoss(wallX, groundY, 0.014, 190);
    await this.wait(230);
    this.bossDangerous = false;
    await this.tweenTo(this.boss, { scaleX: 1, scaleY: 1, y: 250, x: 1110 }, 620, 'Back.easeOut');
  }

  private async attackRotation(): Promise<void> {
    this.bossState = 'rotation';
    this.coreMode = 'center';
    this.coreDangerous = false;
    await this.tweenTo(this.boss, { x: 800, y: 355, angle: 0 }, 620, 'Cubic.easeInOut');
    await this.tweenTo(this.core, { x: this.boss.x, y: this.boss.y, scaleX: 1.2, scaleY: 1.2 }, 240, 'Back.easeOut');

    const markers: Phaser.GameObjects.Rectangle[] = [];
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI / 2) * index;
      const marker = this.add.rectangle(this.boss.x + Math.cos(angle) * 225, this.boss.y + Math.sin(angle) * 225, 24, 24, COLORS.danger, 0.25).setDepth(8);
      markers.push(marker);
      this.tweens.add({ targets: marker, angle: 180, alpha: 0.65, duration: 520, ease: 'Cubic.easeIn' });
    }

    this.rotationRadius = 30;
    this.rotationSpeed = 1.4;
    this.coreMode = 'rotation';
    await Promise.all([
      this.tweenNumber(this, 'rotationRadius', 235, 820, 'Cubic.easeInOut'),
      this.tweenNumber(this, 'rotationSpeed', 8.3, 820, 'Cubic.easeIn'),
    ]);
    markers.forEach((marker) => marker.destroy());
    this.coreDangerous = true;
    await this.wait(2800);
    this.coreDangerous = false;
    await Promise.all([
      this.tweenNumber(this, 'rotationRadius', 30, 700, 'Cubic.easeInOut'),
      this.tweenNumber(this, 'rotationSpeed', 1.6, 700, 'Cubic.easeOut'),
    ]);
    this.coreMode = 'orbit';
    await this.tweenTo(this.boss, { x: 1110, y: 250 }, 520, 'Cubic.easeInOut');
  }

  private async attackRicochet(): Promise<void> {
    this.bossState = 'ricochet-charge';
    this.coreMode = 'orbit';
    const useLeftWall = this.player.x < WORLD_WIDTH / 2;
    const wallX = useLeftWall ? ROOM_LEFT + 14 + BOSS_SIZE / 2 : ROOM_RIGHT - 14 - BOSS_SIZE / 2;
    const targetY = Phaser.Math.Clamp(this.player.y - 80, 170, 610);
    await this.tweenTo(this.boss, { x: 800, y: targetY, scaleX: 1, scaleY: 1 }, 520, 'Cubic.easeInOut');

    const wallBeam = this.add.rectangle((this.boss.x + wallX) / 2, targetY, Math.abs(wallX - this.boss.x), 12, COLORS.danger, 0.35).setDepth(8);
    this.tweens.add({ targets: wallBeam, alpha: 0.75, scaleY: 1.7, duration: 130, yoyo: true, repeat: 2 });
    await this.tweenTo(this.boss, { x: this.boss.x + (useLeftWall ? 45 : -45), scaleX: 0.8, scaleY: 1.16 }, 340, 'Back.easeOut');
    await this.wait(120);
    wallBeam.destroy();
    this.bossDangerous = true;
    await this.tweenTo(this.boss, { x: wallX, scaleX: 1.23, scaleY: 0.8 }, 300, 'Expo.easeIn');
    this.impactBoss(wallX, targetY, 0.015, 180);

    const inward = useLeftWall ? 1 : -1;
    const verticalDirection = this.player.y > targetY ? 1 : -1;
    this.ricochetVelocity.set(inward * 720, verticalDirection * Phaser.Math.Between(430, 510));
    this.ricochetBounces = 0;
    const preview = this.createBeam(this.boss.x, this.boss.y, this.boss.x + inward * 520, this.boss.y + verticalDirection * 340, 10, COLORS.danger, 0.34);
    this.tweens.add({ targets: preview, alpha: 0, duration: 430, ease: 'Cubic.easeOut', onComplete: () => preview.destroy() });
    this.boss.setScale(1);
    this.bossState = 'ricochet';
    await new Promise<void>((resolve) => {
      this.ricochetResolve = resolve;
    });
    this.bossState = 'ricochet-recover';
    this.bossDangerous = false;
    this.ricochetVelocity.set(0, 0);
    await this.tweenTo(this.boss, { scaleX: 0.92, scaleY: 1.08 }, 150, 'Quad.easeOut');
    await this.tweenTo(this.boss, { x: 1110, y: 250, scaleX: 1, scaleY: 1 }, 720, 'Back.easeOut');
  }

  private async phaseTransition(): Promise<void> {
    this.bossPhase = 2;
    this.bossVulnerable = false;
    this.bossDangerous = false;
    this.coreDangerous = false;
    this.bossState = 'transition';
    this.coreMode = 'center';
    await Promise.all([
      this.tweenTo(this.boss, { x: 800, y: 350, angle: 0, scaleX: 1, scaleY: 1 }, 620, 'Cubic.easeInOut'),
      this.tweenTo(this.core, { scaleX: 1, scaleY: 1 }, 320, 'Cubic.easeOut'),
    ]);

    this.overlayTitle.setText('PHASE II').setScale(0.72).setAlpha(0);
    this.overlaySubtitle.setText('PROLOGUE REVERSES').setAlpha(0);
    this.tweens.add({ targets: this.overlayTitle, alpha: 1, scale: 1, duration: 460, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.overlaySubtitle, alpha: 1, delay: 180, duration: 420 });
    await this.wait(420);
    this.coreOrbitDirection = -1;
    for (let index = 0; index < 3; index += 1) {
      await this.tweenTo(this.core, { scaleX: 2.2, scaleY: 2.2, angle: this.core.angle - 90 }, 160, 'Expo.easeOut');
      this.flashScreen(COLORS.core, 0.14 + index * 0.04, 100);
      await this.tweenTo(this.core, { scaleX: 1, scaleY: 1 }, 140, 'Cubic.easeIn');
    }
    this.impactBoss(this.boss.x, this.boss.y, 0.012, 180);
    await this.wait(330);
    this.tweens.add({ targets: [this.overlayTitle, this.overlaySubtitle], alpha: 0, duration: 360 });
    this.coreMode = 'orbit';
    this.bossVulnerable = true;
    this.bossState = 'idle';
    await this.tweenTo(this.boss, { x: 1110, y: 250 }, 520, 'Cubic.easeInOut');
  }

  private emitShockwaves(surface: Surface, originX: number): void {
    const createWave = (targetX: number): void => {
      const wave = this.add.rectangle(originX, surface.top - 12, 38, 24, COLORS.coreSoft, 0.92).setDepth(11);
      this.hazards.push({ object: wave, expiresAt: this.time.now + 1050 });
      this.tweens.add({ targets: wave, x: targetX, scaleX: 1.65, alpha: 0.08, duration: 820, ease: 'Cubic.easeOut', onComplete: () => wave.destroy() });
    };
    createWave(surface.x - surface.width / 2 + 16);
    createWave(surface.x + surface.width / 2 - 16);
  }

  private findPlayerSurface(): Surface {
    const playerBottom = this.player.y + PLAYER_SIZE / 2;
    let best: Surface | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const platform of this.platforms) {
      const withinHorizontal = Math.abs(this.player.x - platform.x) <= platform.width / 2 + 12;
      const distance = Math.abs(playerBottom - platform.top);
      if (withinHorizontal && distance < 55 && distance < bestDistance) {
        best = platform;
        bestDistance = distance;
      }
    }
    return best ?? { object: this.floor, x: WORLD_WIDTH / 2, top: FLOOR_TOP, width: ROOM_RIGHT - ROOM_LEFT };
  }

  private predictPlayer(seconds: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      Phaser.Math.Clamp(this.player.x + this.player.body.velocity.x * seconds, ROOM_LEFT + 30, ROOM_RIGHT - 30),
      Phaser.Math.Clamp(this.player.y + this.player.body.velocity.y * seconds * 0.55, ROOM_TOP + 30, FLOOR_TOP - 30),
    );
  }

  private projectileHitRoom(projectile: PhysicsRectangle): boolean {
    const bounds = projectile.getBounds();
    if (bounds.right < ROOM_LEFT || bounds.left > ROOM_RIGHT || bounds.bottom < ROOM_TOP || bounds.top > FLOOR_TOP + 20) return true;
    if (Phaser.Geom.Intersects.RectangleToRectangle(bounds, this.floor.getBounds())) return true;
    return this.platforms.some((platform) => Phaser.Geom.Intersects.RectangleToRectangle(bounds, platform.object.getBounds()));
  }

  private destroyProjectile(index: number): void {
    const [projectile] = this.projectiles.splice(index, 1);
    projectile.object.destroy();
  }

  private startMusic(): void {
    if (this.musicStarted || !this.audioAvailable) return;
    this.musicStarted = true;
    this.music = this.sound.add('prologueTheme', { loop: true, volume: 0.58 });
    this.music.play();
    this.soundtrackStatus.setText('PROLOGUE THEME · PLAYING');
    this.tweens.add({ targets: this.soundtrackStatus, alpha: 0.35, delay: 1800, duration: 900 });
  }

  private endGame(victory: boolean): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.attackEpoch += 1;
    this.bossAlive = false;
    this.bossDangerous = false;
    this.coreDangerous = false;
    this.bossVulnerable = false;
    this.player.body.setAcceleration(0, 0);
    this.player.body.setVelocity(0, 0);

    if (victory) {
      this.flashScreen(COLORS.core, 0.55, 380);
      this.spawnImpact(this.boss.x, this.boss.y, 34, COLORS.core, 1.1);
      this.tweens.add({ targets: [this.boss, this.bossShade, this.core], alpha: 0, scaleX: 1.7, scaleY: 1.7, angle: 135, duration: 850, ease: 'Expo.easeOut' });
      this.overlayTitle.setText('PROLOGUE CLEARED').setFontSize(40).setAlpha(0).setScale(0.8);
    } else {
      this.flashScreen(COLORS.damage, 0.42, 300);
      this.tweens.add({ targets: [this.player, this.playerShade], alpha: 0, angle: 90, duration: 520 });
      this.overlayTitle.setText('FALLEN').setFontSize(58).setAlpha(0).setScale(0.8);
    }
    this.overlaySubtitle.setText('PRESS R TO REENTER').setAlpha(0);
    this.time.delayedCall(420, () => {
      this.tweens.add({ targets: this.overlayTitle, alpha: 1, scale: 1, duration: 520, ease: 'Back.easeOut' });
      this.tweens.add({ targets: this.overlaySubtitle, alpha: 1, delay: 220, duration: 420 });
    });
  }

  private impactBoss(x: number, y: number, shake: number, duration: number): void {
    this.cameras.main.shake(duration, shake);
    this.flashScreen(COLORS.core, 0.18, 95);
    this.spawnImpact(x, y, 18, COLORS.platformTop, 0.85);
  }

  private spawnImpact(x: number, y: number, count: number, color: number, force: number): void {
    for (let index = 0; index < count; index += 1) {
      const size = Phaser.Math.Between(4, 13);
      const particle = this.add.rectangle(x, y, size, size, color, Phaser.Math.FloatBetween(0.45, 0.95)).setDepth(40);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(35, 115) * force;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.25,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(300, 620),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private spawnAfterimage(x: number, y: number, width: number, height: number, color: number, alpha: number): void {
    const image = this.add.rectangle(x, y, width, height, color, alpha).setScale(this.bossState === 'ricochet' ? this.boss.scaleX : 1, this.bossState === 'ricochet' ? this.boss.scaleY : 1).setDepth(7);
    this.tweens.add({ targets: image, alpha: 0, scaleX: image.scaleX * 0.82, scaleY: image.scaleY * 0.82, duration: 260, ease: 'Cubic.easeOut', onComplete: () => image.destroy() });
  }

  private spawnRicochetTrail(delta: number): void {
    this.ricochetTrailAccumulator += delta;
    if (this.ricochetTrailAccumulator >= 52) {
      this.ricochetTrailAccumulator = 0;
      this.spawnAfterimage(this.boss.x, this.boss.y, BOSS_SIZE, BOSS_SIZE, COLORS.boss, 0.2);
    }
  }

  private spawnMuzzle(x: number, y: number, angle: number): void {
    const flash = this.add.rectangle(x, y, 26, 8, COLORS.core, 0.9).setRotation(angle).setDepth(24);
    this.tweens.add({ targets: flash, scaleX: 1.8, scaleY: 0.2, alpha: 0, duration: 90, ease: 'Expo.easeOut', onComplete: () => flash.destroy() });
  }

  private flashScreen(color: number, alpha: number, duration: number): void {
    const flash = this.add.rectangle(640, 360, 1280, 720, color, alpha).setScrollFactor(0).setDepth(300);
    this.tweens.add({ targets: flash, alpha: 0, duration, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
  }

  private createBeam(x1: number, y1: number, x2: number, y2: number, width: number, color: number, alpha: number): Phaser.GameObjects.Rectangle {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
    return this.add.rectangle((x1 + x2) / 2, (y1 + y2) / 2, distance, width, color, alpha).setRotation(angle);
  }

  private pulseUI(target: Phaser.GameObjects.Text): void {
    this.tweens.add({ targets: target, scaleX: 1.08, scaleY: 1.08, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  private makeDynamicRect(x: number, y: number, width: number, height: number, color: number): PhysicsRectangle {
    const rectangle = this.add.rectangle(x, y, width, height, color) as PhysicsRectangle;
    this.physics.add.existing(rectangle);
    return rectangle;
  }

  private makeStaticRect(x: number, y: number, width: number, height: number, color: number): PhysicsRectangle {
    const rectangle = this.add.rectangle(x, y, width, height, color) as PhysicsRectangle;
    this.physics.add.existing(rectangle, true);
    return rectangle;
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(duration, resolve));
  }

  private tweenTo(target: Phaser.GameObjects.GameObject, properties: Record<string, number>, duration: number, ease: string): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ targets: target, ...properties, duration, ease, onComplete: () => resolve() });
    });
  }

  private tweenNumber(target: object, property: string, value: number, duration: number, ease: string): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ targets: target, [property]: value, duration, ease, onComplete: () => resolve() });
    });
  }
}
