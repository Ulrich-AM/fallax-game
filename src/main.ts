import Phaser from 'phaser';
import './style.css';
import { FallaxScene } from './game/FallaxScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#111318',
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
  scene: [FallaxScene],
};

new Phaser.Game(config);
