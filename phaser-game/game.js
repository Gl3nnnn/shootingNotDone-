class SpaceShooter extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceShooter' });
  }

  preload() {
    // Load images
    this.load.image('background', 'https://cdn.pixabay.com/photo/2013/07/12/18/20/space-153712_960_720.png');
    this.load.image('player', 'assets/bone.png');
    this.load.image('bullet', 'https://cdn-icons-png.flaticon.com/512/616/616408.png');
    this.load.image('targetRed', 'https://cdn-icons-png.flaticon.com/512/616/616490.png');
    this.load.image('targetBlue', 'https://cdn-icons-png.flaticon.com/512/616/616491.png');
    this.load.image('targetYellow', 'https://cdn-icons-png.flaticon.com/512/616/616492.png');
    this.load.image('powerup', 'https://cdn-icons-png.flaticon.com/512/616/616493.png');

    // Load audio
    this.load.audio('bgMusic', 'audio/bg-music.mp3');
    this.load.audio('shootSound', 'audio/shoot-sound.mp3');
    this.load.audio('hitSound', 'audio/hit-sound.mp3');
    this.load.audio('powerupSound', 'audio/powerup-sound.mp3');

    // Load particle image
    this.load.image('particle', 'https://cdn.pixabay.com/photo/2013/07/12/18/20/star-153713_960_720.png');
  }

  create() {
    // Background
    this.add.image(400, 300, 'background').setScale(1.2);

    // Player
    this.player = this.physics.add.sprite(400, 550, 'player').setCollideWorldBounds(true);

    // Bullets group
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 10
    });

    // Targets group
    this.targets = this.physics.add.group();

    // Powerups group
    this.powerups = this.physics.add.group();

    // Input keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Score and UI
    this.score = 0;
    this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#0ff' });

    // Lives
    this.lives = 3;
    this.livesText = this.add.text(10, 40, 'Lives: 3', { fontSize: '20px', fill: '#0ff' });

    // Level
    this.level = 1;
    this.levelText = this.add.text(10, 70, 'Level: 1', { fontSize: '20px', fill: '#0ff' });

    // Powerup
    this.powerup = null;
    this.powerupText = this.add.text(10, 100, 'Power-up: None', { fontSize: '20px', fill: '#0ff' });

    // Sounds
    this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.3 });
    this.shootSound = this.sound.add('shootSound');
    this.hitSound = this.sound.add('hitSound');
    this.powerupSound = this.sound.add('powerupSound');

    this.bgMusic.play();

    // Timers
    this.targetSpawnTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnTarget,
      callbackScope: this,
      loop: true
    });

    this.powerupSpawnTimer = this.time.addEvent({
      delay: 10000,
      callback: this.spawnPowerup,
      callbackScope: this,
      loop: true
    });

    // Collisions
    this.physics.add.overlap(this.bullets, this.targets, this.hitTarget, null, this);
    this.physics.add.overlap(this.bullets, this.powerups, this.collectPowerup, null, this);

    // Particle emitter for shooting
    this.particles = this.add.particles('particle');
    this.shootEmitter = this.particles.createEmitter({
      speed: { min: -100, max: 100 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      on: false
    });
  }

  update() {
    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(300);
    } else {
      this.player.setVelocityX(0);
    }

    // Shooting
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.shootBullet();
    }

    // Update bullets
    this.bullets.children.each(function(bullet) {
      if (bullet.active) {
        bullet.y -= 10;
        if (bullet.y < 0) {
          bullet.setActive(false);
          bullet.setVisible(false);
        }
      }
    }, this);

    // Update targets
    this.targets.children.each(function(target) {
      if (target.active) {
        target.y += target.speed;
        if (target.y > 600) {
          target.setActive(false);
          target.setVisible(false);
          this.loseLife();
        }
      }
    }, this);

    // Update powerups
    this.powerups.children.each(function(powerup) {
      if (powerup.active) {
        powerup.y += 2;
        if (powerup.y > 600) {
          powerup.setActive(false);
          powerup.setVisible(false);
        }
      }
    }, this);
  }

  shootBullet() {
    const bullet = this.bullets.get(this.player.x, this.player.y - 20);
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.enable = true;
      this.shootSound.play();

      // Emit particles at bullet position
      this.shootEmitter.setPosition(bullet.x, bullet.y);
      this.shootEmitter.explode(10);
    }
  }

  spawnTarget() {
    const x = Phaser.Math.Between(50, 750);
    const targetTypes = ['targetRed', 'targetBlue', 'targetYellow'];
    const type = Phaser.Math.RND.pick(targetTypes);
    const target = this.targets.create(x, 0, type);
    target.speed = Phaser.Math.Between(1, 3);
    target.setCollideWorldBounds(false);
    target.setImmovable(true);
  }

  spawnPowerup() {
    const x = Phaser.Math.Between(50, 750);
    const powerup = this.powerups.create(x, 0, 'powerup');
    powerup.setCollideWorldBounds(false);
    powerup.setImmovable(true);
  }

  hitTarget(bullet, target) {
    bullet.setActive(false);
    bullet.setVisible(false);
    target.setActive(false);
    target.setVisible(false);
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
    this.hitSound.play();
  }

  collectPowerup(bullet, powerup) {
    bullet.setActive(false);
    bullet.setVisible(false);
    powerup.setActive(false);
    powerup.setVisible(false);
    this.powerup = 'Rapid Fire';
    this.powerupText.setText('Power-up: ' + this.powerup);
    this.powerupSound.play();

    // Powerup lasts 10 seconds
    this.time.delayedCall(10000, () => {
      this.powerup = null;
      this.powerupText.setText('Power-up: None');
    });
  }

  loseLife() {
    this.lives--;
    this.livesText.setText('Lives: ' + this.lives);
    if (this.lives <= 0) {
      this.scene.restart();
      this.lives = 3;
      this.score = 0;
      this.level = 1;
      this.powerup = null;
      this.powerupText.setText('Power-up: None');
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: SpaceShooter
};

const game = new Phaser.Game(config);
