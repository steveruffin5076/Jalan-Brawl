import Phaser from 'phaser';

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
  }

  create() {
    const label = (x, y, text, size, color = '#f8ead0') => this.pin(this.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: `${size}px`,
      color, stroke: '#11100d', strokeThickness: 3
    }));
    // Compact framed HUD leaves the playfield and existing character art untouched.
    this.pin(this.add.rectangle(20, 15, 346, 92, 0x101c2c, 0.94).setOrigin(0).setStrokeStyle(2, 0xb8945e));
    label(32, 23, 'HP', 19);
    this.hpText = label(350, 23, '', 18).setOrigin(1, 0);
    this.hpBack = this.pin(this.add.rectangle(32, 54, 322, 17, 0x301e1b).setOrigin(0, 0.5).setStrokeStyle(1, 0x9f8054));
    this.hpFill = this.pin(this.add.rectangle(34, 54, 318, 13, 0xc64b3c).setOrigin(0, 0.5));
    this.livesText = label(32, 72, '', 18);
    this.scoreText = label(350, 72, '', 18).setOrigin(1, 0);
    this.comboText = label(32, 116, '', 25, '#ffcf70');
    this.bonusText = label(32, 207, '', 20, '#ffcf70');
    this.boostText = label(32, 235, '', 20, '#ffcf70');
    this.lastComboBonus = null;
    this.bonusMs = 0;

    this.enemyName = label(32, 153, '', 18);
    this.enemyBack = this.pin(this.add.rectangle(32, 184, 180, 10, 0x301e1b).setOrigin(0, 0.5).setStrokeStyle(1, 0x9f8054));
    this.enemyFill = this.pin(this.add.rectangle(32, 184, 180, 10, 0xe07a3d).setOrigin(0, 0.5));

    this.bossFrame = this.pin(this.add.rectangle(720, 57, 530, 84, 0x101c2c, 0.94).setStrokeStyle(2, 0xb8945e));
    this.bossName = label(720, 26, 'BOSS — TOWKAY', 21).setOrigin(0.5, 0);
    this.bossBack = this.pin(this.add.rectangle(720, 78, 490, 17, 0x301e1b).setStrokeStyle(1, 0x9f8054));
    this.bossFill = this.pin(this.add.rectangle(477, 78, 486, 13, 0xc34a3d).setOrigin(0, 0.5));

    const pause = this.pin(this.add.rectangle(1228, 48, 72, 72, 0x17283a).setStrokeStyle(3, 0xb8945e));
    pause.setInteractive({ useHandCursor: true });
    label(1228, 48, 'II', 28).setOrigin(0.5);
    pause.on('pointerover', () => pause.setFillStyle(0x94632f));
    pause.on('pointerout', () => pause.setFillStyle(0x17283a));
    pause.on('pointerdown', () => {
      const game = this.scene.get('Game');
      if (game && game.openPause) game.openPause();
    });

    this.bossFrame.setVisible(false);
    this.bossName.setVisible(false);
    this.bossBack.setVisible(false);
    this.bossFill.setVisible(false);
    this.enemyName.setVisible(false);
    this.enemyBack.setVisible(false);
    this.enemyFill.setVisible(false);
  }

  update(_time, delta) {
    const hp = this.registry.get('playerHp') ?? 0;
    const maxHp = this.registry.get('playerMaxHp') || 1;
    this.hpFill.scaleX = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    this.hpText.setText(String(hp));
    this.livesText.setText(`Lives ${this.registry.get('lives') ?? 0}`);
    this.scoreText.setText(`Score ${this.registry.get('score') || 0}`);
    const combo = this.registry.get('combo') || 0;
    this.comboText.setText(combo > 0 ? `${combo} HITS!` : '');
    const boostSeconds = this.registry.get('attackBoostSeconds') || 0;
    this.boostText.setText(boostSeconds > 0 ? `ATK +10%  ${boostSeconds}s` : '');
    const bonus = this.registry.get('comboBonus');
    if (bonus && bonus !== this.lastComboBonus) {
      this.lastComboBonus = bonus;
      this.bonusMs = 1500;
      this.bonusText.setText(`COMBO BONUS +${bonus.amount}`);
    }
    if (this.bonusMs > 0) {
      this.bonusMs = Math.max(0, this.bonusMs - delta);
      if (this.bonusMs === 0) this.bonusText.setText('');
    }

    const bossOn = !!this.registry.get('bossActive');
    this.bossFrame.setVisible(bossOn);
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
