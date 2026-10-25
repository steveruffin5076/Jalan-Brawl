/**
 * Pauses the game while the browser viewport is portrait.
 * Phaser's own orientation follows the 1280×720 game size, which is always
 * landscape, so this watches the window instead.
 */
export class OrientationGuard {
  constructor(game) {
    this.game = game;
    this.overlay = document.getElementById('rotate-overlay');
    this.held = false;
    this.onChange = () => this.update();
    window.addEventListener('resize', this.onChange);
    window.addEventListener('orientationchange', this.onChange);
    this.update();
  }

  update() {
    const portrait = window.innerHeight > window.innerWidth;
    this.overlay.hidden = !portrait;

    if (portrait && !this.held) {
      this.game.loop.sleep();
      this.held = true;
    } else if (!portrait && this.held) {
      this.game.loop.wake();
      this.held = false;
    }
  }
}
