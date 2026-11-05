import { audioSettings } from '../systems/AudioSettings.js';
/** Apply menu cues to an existing interactive button. */
export function wireMenuSounds(scene, button, onPress, colors = { normal: 0x1e3a5f, hover: 0x2a5080 }) {
  button.on('pointerover', () => {
    button.setFillStyle(colors.hover);
    scene.sound.play('menuHover', { volume: 0.35 * audioSettings.values.effects });
  });
  button.on('pointerout', () => button.setFillStyle(colors.normal));
  button.on('pointerdown', () => {
    scene.sound.play('menuConfirm', { volume: 0.6 * audioSettings.values.effects });
    onPress();
  });
}
