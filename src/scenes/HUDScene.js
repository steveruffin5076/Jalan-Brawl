import Phaser from 'phaser';

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
  }

  create() {
    this.portrait = this.pin(this.add.rectangle(20, 18, 70, 84, 0x3d8bfd).setOrigin(0, 0));
    this.hpBack = this.pin(this.add.rectangle(104, 36, 260, 20, 0x2a1c18).setOrigin(0, 0.5));
    this.hpFill = this.pin(this.add.rectangle(104, 36, 260, 20, 0xd64545).setOrigin(0, 0.5));
    this.hpText = this.pin(this.add.text(374, 36, '', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#f4f1e8'
    })).setOrigin(0, 0.5);
    this.livesText = this.pin(this.add.text(104, 58, '', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#f4f1e8'
    }));
    this.scoreText = this.pin(this.add.text(280, 58, '', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#f4f1e8'
    }));
    this.comboText = this.pin(this.add.text(104, 96, '', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffd56a'
    }));

    this.enemyName = this.pin(this.add.text(104, 140, '', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#f4f1e8'
    }));
    this.enemyBack = this.pin(this.add.rectangle(104, 166, 180, 10, 0x2a1c18).setOrigin(0, 0.5));
    this.enemyFill = this.pin(this.add.rectangle(104, 166, 180, 10, 0xe07a3d).setOrigin(0, 0.5));

    this.bossName = this.pin(this.add.text(640, 12, 'TOWKAY', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#f4f1e8'
    })).setOrigin(0.5, 0);
    this.bossBack = this.pin(this.add.rectangle(640, 42, 420, 16, 0x2a1c18).setOrigin(0.5, 0.5));
    this.bossFill = this.pin(this.add.rectangle(430, 42, 420, 16, 0xc9a24a).setOrigin(0, 0.5));

    const pause = this.pin(this.add.rectangle(1228, 48, 72, 72, 0x1e3a5f).setOrigin(0.5));
    pause.setInteractive({ useHandCursor: true });
    this.pin(this.add.text(1228, 48, 'II', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff'
    })).setOrigin(0.5);
    pause.on('pointerover', () => pause.setFillStyle(0x2a5080));
    pause.on('pointerout', () => pause.setFillStyle(0x1e3a5f));
    pause.on('pointerdown', () => {
      const game = this.scene.get('Game');
      if (game && game.openPause) game.openPause();
    });

    this.bossName.setVisible(false);
    this.bossBack.setVisible(false);
    this.bossFill.setVisible(false);
    this.enemyName.setVisible(false);
    this.enemyBack.setVisible(false);
    this.enemyFill.setVisible(false);
  }

  update() {
    const hp = this.registry.get('playerHp') ?? 0;
    const maxHp = this.registry.get('playerMaxHp') || 1;
    this.hpFill.scaleX = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    this.hpText.setText(String(hp));
    this.livesText.setText(`Lives ${this.registry.get('lives') ?? 0}`);
    this.scoreText.setText(`Score ${this.registry.get('score') || 0}`);
    const combo = this.registry.get('combo') || 0;
    this.comboText.setText(combo > 0 ? `${combo} HITS!` : '');

    const bossOn = !!this.registry.get('bossActive');
    this.bossName.setVisible(bossOn);
    this.bossBack.setVisible(bossOn);
    this.bossFill.setVisible(bossOn);
    if (bossOn) {
      const bossHp = this.registry.get('bossHp') || 0;
      const bossMax = this.registry.get('bossMaxHp') || 1;
      this.bossFill.scaleX = Phaser.Math.Clamp(bossHp / bossMax, 0, 1);
    }

    const name = this.registry.get('enemyName') || '';
    const showEnemy = name.length > 0;
    this.enemyName.setVisible(showEnemy);
    this.enemyBack.setVisible(showEnemy);
    this.enemyFill.setVisible(showEnemy);
    if (showEnemy) {
      this.enemyName.setText(name);
      const enemyHp = this.registry.get('enemyHp') || 0;
      const enemyMax = this.registry.get('enemyMaxHp') || 1;
      this.enemyFill.scaleX = Phaser.Math.Clamp(enemyHp / enemyMax, 0, 1);
    }
  }

  pin(obj) {
    return obj.setScrollFactor(0).setDepth(10);
  }
}
