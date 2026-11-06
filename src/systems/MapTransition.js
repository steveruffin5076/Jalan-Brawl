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
    this.lastPlayerSection = 0;
    this.transitionState = null; // 'fading-out', 'loading', 'fading-in'
    this.fadeElapsed = 0;
    this.fadeDuration = 300;
  }

  /**
   * Update transition state each frame
   */
  update(delta) {
    if (!this.isTransitioning || !this.transitionState) return;

    this.fadeElapsed += delta;

    if (this.transitionState === 'fading-out') {
      // Fade to black
      const progress = Math.min(this.fadeElapsed / this.fadeDuration, 1);
      this.fadeOverlay.setAlpha(progress);

      if (progress >= 1) {
        console.log(`[TRANSITION-FADE] Fade complete, executing callback`);
        // Transition complete, call the callback and move to loading state
        if (this.transitionCallback) {
          try {
            console.log(`[TRANSITION-FADE] Calling callback for area: ${this.transitionAreaId}`);
            this.transitionCallback(this.transitionAreaId);
            this.transitionCallback = null;
            console.log(`[TRANSITION-FADE] Callback completed successfully`);
          } catch (error) {
            console.error('[TRANSITION-FADE] ERROR in callback:', error.message, error.stack);
          }
        }
        this.transitionState = 'fading-in';
        this.fadeElapsed = 0;
      }
    } else if (this.transitionState === 'fading-in') {
      // Fade from black
      const progress = Math.min(this.fadeElapsed / this.fadeDuration, 1);
      this.fadeOverlay.setAlpha(1 - progress);

      if (progress >= 1) {
        // Transition complete
        console.log(`[TRANSITION-FADE] Fade-in complete, transition finished`);
        this.isTransitioning = false;
        this.transitionState = null;
        this.fadeOverlay.setAlpha(0);
      }
    }
  }

  /**
   * Trigger a transition to a new map area
   * @param {string} nextAreaId - The ID of the next area (e.g., 'pasar', 'shophouse')
   * @param {Function} onTransitionComplete - Callback when transition should happen
   */
  transitionToArea(nextAreaId, onTransitionComplete) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.transitionState = 'fading-out';
    this.fadeElapsed = 0;
    this.transitionAreaId = nextAreaId;
    this.transitionCallback = onTransitionComplete;

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

    this.fadeOverlay.setAlpha(0);
  }

  /**
   * Check if player has reached a transition boundary
   * @param {number} playerX - Player's X position
   * @param {Array} sections - Array of section data with boundaries
   * @param {number} currentSectionIndex - Current section index
   * @returns {Object|null} - Next section or null if no transition
   */
  checkAreaTransition(playerX, sections, currentSectionIndex) {
    if (!sections || sections.length === 0) return null;
    if (currentSectionIndex >= sections.length - 1) return null;

    const currentSection = sections[currentSectionIndex];
    const nextSection = sections[currentSectionIndex + 1];

    // Get boundaries from span array [start, end]
    const transitionX = nextSection.span[0];

    // Check if player has crossed into the next section
    if (playerX >= transitionX) {
      // Only trigger once per section transition
      if (this.lastPlayerSection !== currentSectionIndex + 1) {
        this.lastPlayerSection = currentSectionIndex + 1;
        console.log(`[TRANSITION] Boundary detected at x=${playerX}, transition x=${transitionX}`);
        return nextSection;
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
    this.transitionState = null;
    this.fadeElapsed = 0;
    if (this.fadeOverlay) {
      this.fadeOverlay.destroy();
      this.fadeOverlay = null;
    }
  }
}

