import Phaser from 'phaser';
import './style.css';
import { FallaxScene } from './game/FallaxScene';
import { MenuScene } from './game/MenuScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#090b10',
  width: 1280,
  height: 720,
  antialias: true,
  pixelArt: false,
  roundPixels: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1750 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, FallaxScene],
};

const game = new Phaser.Game(config);
game.registry.set('musicEnabled', true);
game.registry.set('effectsEnabled', true);
