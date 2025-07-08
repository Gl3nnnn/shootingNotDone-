const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const powerupDisplay = document.getElementById('powerup');

const bgMusic = document.getElementById('bg-music');
const shootSound = document.getElementById('shoot-sound');
const hitSound = document.getElementById('hit-sound');
const powerupSound = document.getElementById('powerup-sound');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

const particleCanvas = document.getElementById('particle-canvas');
const ctx = particleCanvas.getContext('2d');

const toggleMusicButton = document.getElementById('toggle-music');
const musicVolumeSlider = document.getElementById('music-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');

let gameWidth = gameContainer.clientWidth;
let gameHeight = gameContainer.clientHeight;

let playerX = gameWidth / 2 - player.clientWidth / 2;

window.addEventListener('resize', () => {
  gameWidth = gameContainer.clientWidth;
  gameHeight = gameContainer.clientHeight;
  playerX = Math.min(playerX, gameWidth - player.clientWidth);
  particleCanvas.width = gameWidth;
  particleCanvas.height = gameHeight;
});
particleCanvas.width = gameWidth;
particleCanvas.height = gameHeight;

const playerSpeed = 30;
const bulletSpeed = 15;

let bullets = [];
let targets = [];
let powerups = [];

let score = 0;
let lives = 3;
let level = 1;
let powerup = null;
let powerupTimer = 0;

let targetSpeed = 0.5;
let targetSpawnInterval = 2000;

bgMusic.volume = 0.3;
// Removed bgMusic.play() from page load to avoid autoplay issues

let canShoot = true;

function createBullet(x, y) {
  const bullet = document.createElement('img');
  bullet.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
  bullet.classList.add('bullet');
  bullet.style.left = x + 'px';
  bullet.style.top = y + 'px';
  bullet.style.position = 'absolute';
  bullet.style.width = '16px';
  bullet.style.height = '32px';
  gameContainer.appendChild(bullet);
  bullets.push(bullet);
  bullet.style.animation = 'shoot-flash 0.2s';
  playSound(shootSound);
  createParticles(x + 4, y, 'shoot');
}

function createTarget() {
  const target = document.createElement('img');
  target.classList.add('target');

  // Different target types with different sizes and speeds
  const type = Math.random();
  if (type < 0.5) {
    target.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
    target.style.width = '40px';
    target.style.height = '40px';
    target.speed = targetSpeed || 0.5;
    target.points = 1;
  } else if (type < 0.8) {
    target.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
    target.style.width = '30px';
    target.style.height = '30px';
    target.speed = targetSpeed * 1.5 || 0.75;
    target.points = 2;
  } else {
    target.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
    target.style.width = '20px';
    target.style.height = '20px';
    target.speed = targetSpeed * 2 || 1;
    target.points = 3;
  }

  const width = parseInt(target.style.width) || 40;
  const x = Math.random() * (gameWidth - width);
  target.style.left = x + 'px';
  target.style.top = '0px';
  target.style.position = 'absolute';
  gameContainer.appendChild(target);
  targets.push(target);
}

function createPowerup() {
  const powerup = document.createElement('img');
  powerup.classList.add('target');
  powerup.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
  powerup.style.width = '30px';
  powerup.style.height = '30px';
  const x = Math.random() * (gameWidth - 30);
  powerup.style.left = x + 'px';
  powerup.style.top = '0px';
  powerup.style.position = 'absolute';
  gameContainer.appendChild(powerup);
  powerups.push(powerup);
}

function moveBullets() {
  bullets.forEach((bullet, index) => {
    let y = parseInt(bullet.style.top);
    y -= bulletSpeed;
    if (y < 0) {
      bullet.remove();
      bullets.splice(index, 1);
    } else {
      bullet.style.top = y + 'px';
    }
  });
}

function moveTargets() {
  targets.forEach((target, index) => {
    let y = parseInt(target.style.top);
    y += target.speed;
    if (y > gameHeight) {
      target.remove();
      targets.splice(index, 1);
      loseLife();
    } else {
      target.style.top = y + 'px';
    }
  });
}

function movePowerups() {
  powerups.forEach((powerup, index) => {
    let y = parseInt(powerup.style.top);
    y += 1.5;
    if (y > gameHeight) {
      powerup.remove();
      powerups.splice(index, 1);
    } else {
      powerup.style.top = y + 'px';
    }
  });
}

function detectCollisions() {
  bullets.forEach((bullet, bIndex) => {
    const bulletRect = bullet.getBoundingClientRect();
    targets.forEach((target, tIndex) => {
      const targetRect = target.getBoundingClientRect();
      if (
        bulletRect.left < targetRect.left + targetRect.width &&
        bulletRect.left + bulletRect.width > targetRect.left &&
        bulletRect.top < targetRect.top + targetRect.height &&
        bulletRect.height + bulletRect.top > targetRect.top
      ) {
        // Collision detected
        bullet.remove();
        target.remove();
        bullets.splice(bIndex, 1);
        targets.splice(tIndex, 1);
        score += target.points;
        animateScore();
        scoreDisplay.textContent = 'Score: ' + score;
        playSound(hitSound);
        createParticles(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, 'hit');
      }
    });
  });

  bullets.forEach((bullet, bIndex) => {
    const bulletRect = bullet.getBoundingClientRect();
    powerups.forEach((powerupElem, pIndex) => {
      const powerupRect = powerupElem.getBoundingClientRect();
      if (
        bulletRect.left < powerupRect.left + powerupRect.width &&
        bulletRect.left + bulletRect.width > powerupRect.left &&
        bulletRect.top < powerupRect.top + powerupRect.height &&
        bulletRect.height + bulletRect.top > powerupRect.top
      ) {
        // Powerup collected
        bullet.remove();
        powerupElem.remove();
        bullets.splice(bIndex, 1);
        powerups.splice(pIndex, 1);
        activatePowerup();
      }
    });
  });
}

function activatePowerup() {
  powerup = 'Rapid Fire';
  powerupDisplay.textContent = 'Power-up: ' + powerup;
  animatePowerup();
  powerupTimer = 500; // frames
  playSound(powerupSound);
}

function loseLife() {
  lives--;
  animateLives();
  livesDisplay.textContent = 'Lives: ' + lives;
  if (lives <= 0) {
    showGameOver();
  }
}

function resetGame() {
  // Remove all targets, bullets, powerups
  bullets.forEach(b => b.remove());
  targets.forEach(t => t.remove());
  powerups.forEach(p => p.remove());
  bullets = [];
  targets = [];
  powerups = [];
  score = 0;
  lives = 3;
  level = 1;
  powerup = null;
  powerupTimer = 0;
  targetSpeed = 0.3;
  targetSpawnInterval = 3000;
  scoreDisplay.textContent = 'Score: ' + score;
  livesDisplay.textContent = 'Lives: ' + lives;
  levelDisplay.textContent = 'Level: ' + level;
  powerupDisplay.textContent = 'Power-up: None';
  hideGameOver();
}

function updatePlayerPosition() {
  player.style.left = playerX + 'px';
}

function gameLoop() {
  moveBullets();
  moveTargets();
  movePowerups();
  detectCollisions();

  if (powerupTimer > 0) {
    powerupTimer--;
    if (powerupTimer === 0) {
      powerup = null;
      powerupDisplay.textContent = 'Power-up: None';
    }
  }

  // Increase difficulty every 40 points (slower progression)
  if (score >= level * 40) {
    level++;
    animateLevel();
    levelDisplay.textContent = 'Level: ' + level;
    targetSpeed += 0.3;
    if (targetSpawnInterval > 800) {
      targetSpawnInterval -= 100;
      clearInterval(targetSpawnTimer);
      targetSpawnTimer = setInterval(() => {
        createTarget();
        if (Math.random() < 0.3) createPowerup();
      }, targetSpawnInterval);
    }
  }

  updatePlayerPosition();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft') {
    playerX = Math.max(0, playerX - playerSpeed);
  } else if (e.code === 'ArrowRight') {
    playerX = Math.min(gameWidth - player.clientWidth, playerX + playerSpeed);
  } else if (e.code === 'Space') {
    if (canShoot) {
      const bulletX = playerX + player.clientWidth / 2 - 3;
      const bulletY = gameHeight - player.clientHeight - 20;
      createBullet(bulletX, bulletY);
      if (powerup === 'Rapid Fire') {
        canShoot = true;
      } else {
        canShoot = false;
        setTimeout(() => {
          canShoot = true;
        }, 150);
      }
    }
  }
});

let targetSpawnTimer;
let gamePaused = false;
let animationFrameId;

function startGame() {
  resetGame();
  startScreen.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  bgMusic.play();
  startTargetSpawn();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function startTargetSpawn() {
  targetSpawnTimer = setInterval(() => {
    createTarget();
    if (Math.random() < 0.3) createPowerup();
  }, targetSpawnInterval);
}

function stopTargetSpawn() {
  clearInterval(targetSpawnTimer);
}

function pauseGame() {
  console.log('Pause button clicked');
  if (!gamePaused) {
    gamePaused = true;
    stopTargetSpawn();
    cancelAnimationFrame(animationFrameId);
    bgMusic.pause();
    pauseButton.disabled = true;
    resumeButton.disabled = false;
    // Stop game loop by not requesting next animation frame
  }
}

function resumeGame() {
  if (gamePaused) {
    gamePaused = false;
    startTargetSpawn();
    animationFrameId = requestAnimationFrame(gameLoop);
    bgMusic.play();
    pauseButton.disabled = false;
    resumeButton.disabled = true;
  }
}

function exitGame() {
  gamePaused = false;
  stopTargetSpawn();
  cancelAnimationFrame(animationFrameId);
  bgMusic.pause();
  showStartScreen();
  gameContainer.classList.add('hidden');
  startScreen.classList.remove('hidden');
}

const pauseButton = document.getElementById('pause-game');
const resumeButton = document.getElementById('resume-game');
const exitButton = document.getElementById('exit-game');

pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
exitButton.addEventListener('click', exitGame);

function showStartScreen() {
  startScreen.classList.remove('hidden');
  gameContainer.classList.add('hidden');
}

function showGameOver() {
  gameOverScreen.classList.remove('hidden');
  gameContainer.classList.add('hidden');
  finalScoreDisplay.textContent = 'Your score: ' + score;
  bgMusic.pause();
  clearInterval(targetSpawnTimer);
}

function hideGameOver() {
  gameOverScreen.classList.add('hidden');
}

startButton.addEventListener('click', () => {
  startGame();
});

restartButton.addEventListener('click', () => {
  startGame();
});

toggleMusicButton.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play();
    toggleMusicButton.textContent = 'Pause Music';
  } else {
    bgMusic.pause();
    toggleMusicButton.textContent = 'Play Music';
  }
});

musicVolumeSlider.addEventListener('input', () => {
  bgMusic.volume = parseFloat(musicVolumeSlider.value);
});

sfxVolumeSlider.addEventListener('input', () => {
  shootSound.volume = parseFloat(sfxVolumeSlider.value);
  hitSound.volume = parseFloat(sfxVolumeSlider.value);
  powerupSound.volume = parseFloat(sfxVolumeSlider.value);
});

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

function animateScore() {
  scoreDisplay.classList.add('animate');
  setTimeout(() => {
    scoreDisplay.classList.remove('animate');
  }, 300);
}

function animateLives() {
  livesDisplay.classList.add('animate');
  setTimeout(() => {
    livesDisplay.classList.remove('animate');
  }, 300);
}

function animateLevel() {
  levelDisplay.classList.add('animate');
  setTimeout(() => {
    levelDisplay.classList.remove('animate');
  }, 300);
}

function animatePowerup() {
  powerupDisplay.classList.add('animate');
  setTimeout(() => {
    powerupDisplay.classList.remove('animate');
  }, 300);
}

// Particle system
const particles = [];

function createParticles(x, y, type) {
  const count = type === 'shoot' ? 5 : 20;
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, type));
  }
}

class Particle {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * (type === 'shoot' ? 2 : 5);
    this.speedY = (Math.random() - 0.5) * (type === 'shoot' ? 2 : 5);
    this.life = 30;
    this.color = type === 'shoot' ? 'yellow' : 'red';
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
    this.size *= 0.95;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateParticles() {
  ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw(ctx);
    if (p.life <= 0 || p.size <= 0.1) {
      particles.splice(i, 1);
    }
  }
}

function gameLoop() {
  console.log('gameLoop running, gamePaused:', gamePaused);
  if (gamePaused) {
    console.log('Game is paused, skipping gameLoop frame');
    return;
  }
  moveBullets();
  moveTargets();
  movePowerups();
  detectCollisions();
  updateParticles();

  if (powerupTimer > 0) {
    powerupTimer--;
    if (powerupTimer === 0) {
      powerup = null;
      powerupDisplay.textContent = 'Power-up: None';
    }
  }

  // Increase difficulty every 40 points (slower progression)
  if (score >= level * 40) {
    level++;
    animateLevel();
    levelDisplay.textContent = 'Level: ' + level;
    targetSpeed += 0.3;
    if (targetSpawnInterval > 800) {
      targetSpawnInterval -= 100;
      clearInterval(targetSpawnTimer);
      targetSpawnTimer = setInterval(() => {
        createTarget();
        if (Math.random() < 0.3) createPowerup();
      }, targetSpawnInterval);
    }
  }

  updatePlayerPosition();
  requestAnimationFrame(gameLoop);
}

showStartScreen();
