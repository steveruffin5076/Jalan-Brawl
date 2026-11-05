import { audioSettings } from './AudioSettings.js';

/** One-shot cues for events outside combat. */
export default class GameplayAudio {
  constructor(sound) {
    this.sound = sound;
  }

  play(name, volume = 0.7) {
    this.sound.play(`gameplay-${name}`, { volume: volume * audioSettings.values.effects });
  }

  movement(before, player) {
    const ground = before.state === 'idle' || before.state === 'walk';
    if (ground && player.state === 'jump') this.play('jump', 0.6);
    const wasJumping = before.state === 'jump' || before.state === 'jumpAttack';
    if (wasJumping && before.z > 0 && player.z === 0 && player.state === 'idle') {
      this.play('landing', 0.6);
    }
  }

  pickup(pickup, wasTaken) {
    if (wasTaken || !pickup.taken) return;
    if (pickup.spec.image === 'cash') this.play('pickup-cash');
    else if (pickup.spec.image === 'tehtarik' || pickup.spec.image === 'nasilemak') this.play('pickup-food');
  }
}

/** Result cues are stopped on exit so they do not overlap the next scene. */
export function playResultCue(scene, name) {
  const sound = scene.sound.add(`gameplay-${name}`, { volume: 0.7 * audioSettings.values.effects });
  sound.play();
  scene.events.once('shutdown', () => {
    sound.stop();
    sound.destroy();
  });
}
