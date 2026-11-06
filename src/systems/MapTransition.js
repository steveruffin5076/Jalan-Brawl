import Phaser from 'phaser';
import { DISPLAY } from '../config.js';

/**
 * Manages map transitions with fade-to-black effect.
 * Handles unloading current map area and loading the next one.
 */
export default class MapTransition {
  constructor(scene) {
    this.scene = scene;
    this.isTransitioning = false;
    this.fadeOverlay = null;
  }

  /**
   * Trigger a transition to a new map area
   * @param {string} nextAreaId - The ID of the next area (e.g., 'pasar', 'shophouse')
   * @param {Function} onTransitionComplete - Callback when transition finishes
   */
  transitionToArea(nextAreaId, onTransitionComplete) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;

    // Create black fade overlay if it doesn't exist
    if (!this.fadeOverlay) {
      this.fadeOverlay = this.scene.add.rectangle(
        DISPLAY.width / 2,
        DISPLAY.height / 2,
        DISPLAY.width,
        DISPLAY.height,
        0x000000,
        0
      ).setScrollFactor(0).setDepth(1000);
    }

    // Fade to black
    this.scene.tweens.add({
      targets: this.fadeOverlay,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Call the cleanup and reload callback
        if (onTransitionComplete) {
          onTransitionComplete(nextAreaId);
        }

        // Fade back in
        this.scene.tweens.add({
          targets: this.fadeOverlay,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.isTransitioning = false;
          }
        });
      }
    });
  }

  /**
   * Check if player has reached a transition boundary
   * @param {number} playerX - Player's X position
   * @param {Array} sections - Array of section data with boundaries
   * @returns {Object|null} - Next section or null if no transition
   */
  checkAreaTransition(playerX, sections) {
    if (!sections || sections.length === 0) return null;

    for (let i = 0; i < sections.length - 1; i++) {
      const currentSection = sections[i];
      const nextSection = sections[i + 1];

      // Check if player has crossed into the next section
      if (playerX >= nextSection.start && playerX < nextSection.end) {
        // Only trigger if moving from current section to next
        if (this.lastPlayerSection !== i + 1) {
          this.lastPlayerSection = i + 1;
          return nextSection;
        }
      }
    }

    return null;
  }

  /**
   * Reset transition state
   */
  reset() {
    this.isTransitioning = false;
    this.lastPlayerSection = 0;
    if (this.fadeOverlay) {
      this.fadeOverlay.destroy();
      this.fadeOverlay = null;
    }
  }
}
