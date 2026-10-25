import Phaser from './phaserGlobal.js';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
import { DISPLAY } from './config.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import StageClearScene from './scenes/StageClearScene.js';
import AnimPreviewScene from './scenes/AnimPreviewScene.js';
import { OrientationGuard } from './systems/OrientationGuard.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: DISPLAY.width,
  height: DISPLAY.height,
  backgroundColor: DISPLAY.backgroundColor,
  pixelArt: false,
  antialias: true,
  input: {
    gamepad: true
  },
  plugins: {
    global: [{
      key: 'rexVirtualJoystick',
      plugin: VirtualJoystickPlugin,
      start: true
    }]
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    GameScene,
    HUDScene,
    PauseScene,
    GameOverScene,
    StageClearScene,
    AnimPreviewScene
  ]
};

const game = new Phaser.Game(config);
new OrientationGuard(game);

if (import.meta.env.DEV) {
  globalThis.__JALAN__ = game;
}
