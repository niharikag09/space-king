class Game {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.player = document.getElementById('player');
        this.gameState = 'start'; // start, playing, paused, gameOver, levelComplete
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.lifePlatforms = [];
        this.weaponBlocks = [];
        this.particles = [];
        
        // Player properties
        this.playerX = window.innerWidth / 2 - 20;
        this.playerY = window.innerHeight - 120;
        this.playerSpeed = 5;
        this.playerWidth = 40;
        this.playerHeight = 50;
        this.playerShootCooldown = 0;
        this.playerShootRate = 15; // frames between shots
        
        // Player power-ups
        this.rapidFire = false;
        this.rapidFireTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        this.multiShot = false;
        this.multiShotTimer = 0;
        
        // Special weapons
        this.rocketWeapon = false;
        this.rocketWeaponTimer = 0;
        this.tripleWeapon = false;
        this.tripleWeaponTimer = 0;
        this.laserWeapon = false;
        this.laserWeaponTimer = 0;
        
        // Game mechanics
        this.enemySpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        this.lifePlatformSpawnTimer = 0;
        this.weaponBlockSpawnTimer = 0;
        this.gameSpeed = 1;
        this.frameCount = 0;
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        this.setupGameElements();
        
        // Start game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
            }
            if (e.code === 'KeyP' && this.gameState === 'playing') {
                this.pauseGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Button events
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('resumeButton').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainButton').addEventListener('click', () => this.restartGame());
        document.getElementById('nextLevelButton').addEventListener('click', () => this.nextLevel());
    }
    
    setupGameElements() {
        this.updateUI();
        this.updatePlayerPosition();
        this.applyLevelTheme();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideAllScreens();
        this.resetGame();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    restartGame() {
        this.hideAllScreens();
        this.resetGame();
        this.gameState = 'playing';
    }
    
    nextLevel() {
        this.currentLevel++;
        this.hideAllScreens();
        this.gameState = 'playing';
        this.applyLevelTheme();
        this.increaseDifficulty();
    }
    
    resetGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.gameSpeed = 1;
        this.clearAllGameObjects();
        this.resetPlayerPowerups();
        this.updateUI();
        this.applyLevelTheme();
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
    }
    
    applyLevelTheme() {
        // Remove existing level classes
        this.gameArea.classList.remove('level-1', 'level-2', 'level-3');
        // Add current level class
        this.gameArea.classList.add(`level-${this.currentLevel}`);
    }
    
    increaseDifficulty() {
        this.gameSpeed += 0.5;
        this.playerShootRate = Math.max(8, this.playerShootRate - 2);
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
            this.render();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.frameCount++;
        this.handleInput();
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updatePowerups();
        this.updateLifePlatforms();
        this.updateWeaponBlocks();
        this.updateParticles();
        this.spawnEnemies();
        this.spawnPowerups();
        this.spawnLifePlatforms();
        this.spawnWeaponBlocks();
        this.checkCollisions();
        this.updatePowerupTimers();
        this.updateWeaponTimers();
        this.checkLevelComplete();
    }
    
    handleInput() {
        // Player movement
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.playerX = Math.max(0, this.playerX - this.playerSpeed);
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.playerX = Math.min(window.innerWidth - this.playerWidth, this.playerX + this.playerSpeed);
        }
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.playerY = Math.max(0, this.playerY - this.playerSpeed);
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.playerY = Math.min(window.innerHeight - this.playerHeight - 60, this.playerY + this.playerSpeed);
        }
        
        // Player shooting
        if (this.keys['Space'] && this.playerShootCooldown <= 0) {
            this.playerShoot();
            this.playerShootCooldown = this.rapidFire ? Math.floor(this.playerShootRate / 3) : this.playerShootRate;
        }
        
        if (this.playerShootCooldown > 0) {
            this.playerShootCooldown--;
        }
    }
    
    updatePlayer() {
        this.updatePlayerPosition();
    }
    
    updatePlayerPosition() {
        this.player.style.left = `${this.playerX}px`;
        this.player.style.top = `${this.playerY}px`;
    }
    
    playerShoot() {
        let bulletType = 'player';
        let bulletClass = 'bullet';
        let damage = 1;
        
        // Determine bullet type based on active weapons
        if (this.laserWeapon) {
            bulletType = 'laser';
            bulletClass = 'bullet bullet-laser';
            damage = 2;
        } else if (this.rocketWeapon) {
            bulletType = 'rocket';
            bulletClass = 'bullet bullet-rocket';
            damage = 3;
        }
        
        if (this.tripleWeapon || this.multiShot) {
            // Triple shot: 3 bullets in spread pattern
            this.createBullet(this.playerX + this.playerWidth/2 - 2, this.playerY, -8, bulletType, 0, bulletClass, damage);
            this.createBullet(this.playerX + this.playerWidth/2 - 2, this.playerY, -8, bulletType, -3, bulletClass, damage);
            this.createBullet(this.playerX + this.playerWidth/2 - 2, this.playerY, -8, bulletType, 3, bulletClass, damage);
        } else {
            this.createBullet(this.playerX + this.playerWidth/2 - 2, this.playerY, -8, bulletType, 0, bulletClass, damage);
        }
    }
    
    createBullet(x, y, velocityY, type, velocityX = 0, cssClass = null, damage = 1) {
        const bullet = {
            x: x,
            y: y,
            velocityX: velocityX,
            velocityY: velocityY,
            type: type,
            damage: damage,
            element: document.createElement('div')
        };
        
        if (cssClass) {
            bullet.element.className = cssClass;
        } else {
            bullet.element.className = type === 'player' || type === 'laser' || type === 'rocket' ? 'bullet' : 'bullet enemy-bullet';
        }
        
        bullet.element.style.left = `${x}px`;
        bullet.element.style.top = `${y}px`;
        
        this.gameArea.appendChild(bullet.element);
        
        if (type === 'player' || type === 'laser' || type === 'rocket') {
            this.bullets.push(bullet);
        } else {
            this.enemyBullets.push(bullet);
        }
    }
    
    updateBullets() {
        // Update player bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;
            bullet.element.style.left = `${bullet.x}px`;
            bullet.element.style.top = `${bullet.y}px`;
            
            if (bullet.y < 0) {
                bullet.element.remove();
                return false;
            }
            return true;
        });
    }
    
    updateEnemyBullets() {
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;
            bullet.element.style.left = `${bullet.x}px`;
            bullet.element.style.top = `${bullet.y}px`;
            
            if (bullet.y > window.innerHeight) {
                bullet.element.remove();
                return false;
            }
            return true;
        });
    }
    
    spawnEnemies() {
        this.enemySpawnTimer++;
        const spawnRate = Math.max(30, 120 - (this.currentLevel * 20) - Math.floor(this.frameCount / 1000) * 10);
        
        if (this.enemySpawnTimer >= spawnRate) {
            this.enemySpawnTimer = 0;
            this.createEnemy();
        }
    }
    
    createEnemy() {
        const enemy = {
            x: Math.random() * (window.innerWidth - 28),
            y: -32,
            width: 28,
            height: 32,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: 1 + this.gameSpeed + Math.random(),
            type: this.getEnemyType(),
            shootTimer: Math.floor(Math.random() * 120) + 60,
            health: 1,
            element: document.createElement('div')
        };
        
        // Set enemy properties based on type
        switch (enemy.type) {
            case 2:
                enemy.width = 35;
                enemy.height = 35;
                enemy.health = 2;
                enemy.velocityY *= 0.8;
                break;
            case 3:
                enemy.width = 50;
                enemy.height = 50;
                enemy.health = 3;
                enemy.velocityY *= 0.6;
                break;
        }
        
        enemy.element.className = `enemy ${enemy.type > 1 ? `enemy-type-${enemy.type}` : ''}`;
        enemy.element.style.left = `${enemy.x}px`;
        enemy.element.style.top = `${enemy.y}px`;
        
        this.gameArea.appendChild(enemy.element);
        this.enemies.push(enemy);
    }
    
    getEnemyType() {
        const rand = Math.random();
        if (this.currentLevel >= 3 && rand < 0.1) return 3; // Boss enemy
        if (this.currentLevel >= 2 && rand < 0.3) return 2; // Medium enemy
        return 1; // Basic enemy
    }
    
    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.x += enemy.velocityX * this.gameSpeed;
            enemy.y += enemy.velocityY * this.gameSpeed;
            
            // Bounce off walls
            if (enemy.x <= 0 || enemy.x >= window.innerWidth - enemy.width) {
                enemy.velocityX *= -1;
            }
            
            // Enemy shooting
            enemy.shootTimer--;
            if (enemy.shootTimer <= 0 && enemy.y > 0 && enemy.y < window.innerHeight - 200) {
                const shootChance = enemy.type === 3 ? 0.8 : enemy.type === 2 ? 0.4 : 0.2;
                if (Math.random() < shootChance) {
                    this.createBullet(
                        enemy.x + enemy.width/2 - 2,
                        enemy.y + enemy.height,
                        3 + this.gameSpeed,
                        'enemy'
                    );
                }
                enemy.shootTimer = Math.floor(Math.random() * 180) + 60;
            }
            
            enemy.element.style.left = `${enemy.x}px`;
            enemy.element.style.top = `${enemy.y}px`;
            
            if (enemy.y > window.innerHeight) {
                enemy.element.remove();
                return false;
            }
            return true;
        });
    }
    
    spawnPowerups() {
        this.powerupSpawnTimer++;
        if (this.powerupSpawnTimer >= 900) { // Every 15 seconds
            this.powerupSpawnTimer = 0;
            this.createPowerup();
        }
    }
    
    spawnLifePlatforms() {
        this.lifePlatformSpawnTimer++;
        if (this.lifePlatformSpawnTimer >= 1800) { // Every 30 seconds
            this.lifePlatformSpawnTimer = 0;
            this.createLifePlatform();
        }
    }
    
    spawnWeaponBlocks() {
        this.weaponBlockSpawnTimer++;
        if (this.weaponBlockSpawnTimer >= 1200) { // Every 20 seconds
            this.weaponBlockSpawnTimer = 0;
            this.createWeaponBlock();
        }
    }
    
    createPowerup() {
        const types = ['rapid', 'shield', 'multishot'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const powerup = {
            x: Math.random() * (window.innerWidth - 25),
            y: -25,
            velocityY: 2,
            type: type,
            element: document.createElement('div')
        };
        
        powerup.element.className = `powerup powerup-${type}`;
        powerup.element.style.left = `${powerup.x}px`;
        powerup.element.style.top = `${powerup.y}px`;
        
        this.gameArea.appendChild(powerup.element);
        this.powerups.push(powerup);
    }
    
    createLifePlatform() {
        const platform = {
            x: Math.random() * (window.innerWidth - 60),
            y: -15,
            velocityY: 1.5,
            element: document.createElement('div')
        };
        
        platform.element.className = 'life-platform';
        platform.element.style.left = `${platform.x}px`;
        platform.element.style.top = `${platform.y}px`;
        
        this.gameArea.appendChild(platform.element);
        this.lifePlatforms.push(platform);
    }
    
    createWeaponBlock() {
        const types = ['rocket', 'triple', 'laser'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const weaponBlock = {
            x: Math.random() * (window.innerWidth - 30),
            y: -30,
            velocityY: 1.8,
            type: type,
            element: document.createElement('div')
        };
        
        weaponBlock.element.className = `weapon-block weapon-block-${type}`;
        weaponBlock.element.style.left = `${weaponBlock.x}px`;
        weaponBlock.element.style.top = `${weaponBlock.y}px`;
        
        this.gameArea.appendChild(weaponBlock.element);
        this.weaponBlocks.push(weaponBlock);
    }
    
    updatePowerups() {
        this.powerups = this.powerups.filter(powerup => {
            powerup.y += powerup.velocityY;
            powerup.element.style.top = `${powerup.y}px`;
            
            if (powerup.y > window.innerHeight) {
                powerup.element.remove();
                return false;
            }
            return true;
        });
    }
    
    updateLifePlatforms() {
        this.lifePlatforms = this.lifePlatforms.filter(platform => {
            platform.y += platform.velocityY;
            platform.element.style.top = `${platform.y}px`;
            
            if (platform.y > window.innerHeight) {
                platform.element.remove();
                return false;
            }
            return true;
        });
    }
    
    updateWeaponBlocks() {
        this.weaponBlocks = this.weaponBlocks.filter(block => {
            block.y += block.velocityY;
            block.element.style.top = `${block.y}px`;
            
            if (block.y > window.innerHeight) {
                block.element.remove();
                return false;
            }
            return true;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.life--;
            if (particle.life <= 0) {
                particle.element.remove();
                return false;
            }
            return true;
        });
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    // Remove bullet
                    bullet.element.remove();
                    this.bullets.splice(bulletIndex, 1);
                    
                    // Damage enemy
                    enemy.health--;
                    if (enemy.health <= 0) {
                        // Enemy destroyed
                        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        enemy.element.remove();
                        this.enemies.splice(enemyIndex, 1);
                        
                        // Add score based on enemy type and bullet damage
                        this.score += enemy.type * 100 * (bullet.damage || 1);
                        this.updateUI();
                    }
                }
            });
        });
        
        // Enemy bullets vs player
        if (!this.shield) {
            this.enemyBullets.forEach((bullet, bulletIndex) => {
                if (this.isCollidingWithPlayer(bullet)) {
                    bullet.element.remove();
                    this.enemyBullets.splice(bulletIndex, 1);
                    this.playerHit();
                }
            });
        }
        
        // Enemies vs player
        if (!this.shield) {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isCollidingWithPlayer(enemy)) {
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    enemy.element.remove();
                    this.enemies.splice(enemyIndex, 1);
                    this.playerHit();
                }
            });
        }
        
        // Player vs powerups
        this.powerups.forEach((powerup, powerupIndex) => {
            if (this.isCollidingWithPlayer(powerup)) {
                powerup.element.remove();
                this.powerups.splice(powerupIndex, 1);
                this.activatePowerup(powerup.type);
            }
        });
        
        // Player vs life platforms
        this.lifePlatforms.forEach((platform, platformIndex) => {
            if (this.isCollidingWithPlayer(platform)) {
                platform.element.remove();
                this.lifePlatforms.splice(platformIndex, 1);
                this.gainLife();
            }
        });
        
        // Player vs weapon blocks
        this.weaponBlocks.forEach((block, blockIndex) => {
            if (this.isCollidingWithPlayer(block)) {
                block.element.remove();
                this.weaponBlocks.splice(blockIndex, 1);
                this.activateWeapon(block.type);
            }
        });
    }
    
    isColliding(obj1, obj2) {
        const obj1Right = obj1.x + (obj1.width || 4);
        const obj1Bottom = obj1.y + (obj1.height || 12);
        const obj2Right = obj2.x + obj2.width;
        const obj2Bottom = obj2.y + obj2.height;
        
        return !(obj1Right < obj2.x || obj1.x > obj2Right || 
                obj1Bottom < obj2.y || obj1.y > obj2Bottom);
    }
    
    isCollidingWithPlayer(obj) {
        const playerRight = this.playerX + this.playerWidth;
        const playerBottom = this.playerY + this.playerHeight;
        const objRight = obj.x + (obj.width || 25);
        const objBottom = obj.y + (obj.height || 25);
        
        return !(playerRight < obj.x || this.playerX > objRight || 
                playerBottom < obj.y || this.playerY > objBottom);
    }
    
    playerHit() {
        this.lives--;
        this.createExplosion(this.playerX + this.playerWidth/2, this.playerY + this.playerHeight/2);
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    activatePowerup(type) {
        switch (type) {
            case 'rapid':
                this.rapidFire = true;
                this.rapidFireTimer = 300; // 5 seconds
                break;
            case 'shield':
                this.shield = true;
                this.shieldTimer = 300;
                this.player.classList.add('player-shield');
                break;
            case 'multishot':
                this.multiShot = true;
                this.multiShotTimer = 300;
                break;
        }
    }
    
    gainLife() {
        this.lives++;
        this.updateUI();
        // Create a visual effect
        this.createExplosion(this.playerX + this.playerWidth/2, this.playerY + this.playerHeight/2, 'life');
    }
    
    activateWeapon(type) {
        // Deactivate other special weapons first
        this.rocketWeapon = false;
        this.tripleWeapon = false;
        this.laserWeapon = false;
        
        switch (type) {
            case 'rocket':
                this.rocketWeapon = true;
                this.rocketWeaponTimer = 450; // 7.5 seconds
                break;
            case 'triple':
                this.tripleWeapon = true;
                this.tripleWeaponTimer = 450;
                break;
            case 'laser':
                this.laserWeapon = true;
                this.laserWeaponTimer = 450;
                break;
        }
    }
    
    updatePowerupTimers() {
        if (this.rapidFire) {
            this.rapidFireTimer--;
            if (this.rapidFireTimer <= 0) {
                this.rapidFire = false;
            }
        }
        
        if (this.shield) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.shield = false;
                this.player.classList.remove('player-shield');
            }
        }
        
        if (this.multiShot) {
            this.multiShotTimer--;
            if (this.multiShotTimer <= 0) {
                this.multiShot = false;
            }
        }
    }
    
    updateWeaponTimers() {
        if (this.rocketWeapon) {
            this.rocketWeaponTimer--;
            if (this.rocketWeaponTimer <= 0) {
                this.rocketWeapon = false;
            }
        }
        
        if (this.tripleWeapon) {
            this.tripleWeaponTimer--;
            if (this.tripleWeaponTimer <= 0) {
                this.tripleWeapon = false;
            }
        }
        
        if (this.laserWeapon) {
            this.laserWeaponTimer--;
            if (this.laserWeaponTimer <= 0) {
                this.laserWeapon = false;
            }
        }
    }
    
    createExplosion(x, y, type = 'normal') {
        const explosion = {
            element: document.createElement('div'),
            life: 30
        };
        
        if (type === 'life') {
            explosion.element.className = 'explosion';
            explosion.element.style.background = 'radial-gradient(circle, #00ff00, #00aa00, transparent)';
        } else {
            explosion.element.className = 'explosion';
        }
        
        explosion.element.style.left = `${x - 20}px`;
        explosion.element.style.top = `${y - 20}px`;
        
        this.gameArea.appendChild(explosion.element);
        this.particles.push(explosion);
    }
    
    checkLevelComplete() {
        // Level complete when certain score thresholds are reached
        const levelThresholds = [2000, 5000, 10000];
        if (this.score >= levelThresholds[this.currentLevel - 1] && this.currentLevel <= 3) {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        const levelScore = Math.floor(this.score * 0.1);
        const bonus = this.lives * 500;
        
        document.getElementById('levelScore').textContent = this.score;
        document.getElementById('levelBonus').textContent = bonus;
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
        
        this.score += bonus;
        this.updateUI();
        
        if (this.currentLevel >= 3) {
            // Game complete
            setTimeout(() => {
                document.getElementById('levelCompleteScreen').classList.add('hidden');
                this.gameOver(true);
            }, 3000);
        }
    }
    
    gameOver(victory = false) {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.currentLevel;
        
        const gameOverTitle = document.querySelector('#gameOverScreen h2');
        gameOverTitle.textContent = victory ? 'VICTORY!' : 'GAME OVER';
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('levelValue').textContent = this.currentLevel;
        document.getElementById('livesValue').textContent = this.lives;
    }
    
    clearAllGameObjects() {
        // Remove all game objects
        [...this.bullets, ...this.enemyBullets].forEach(bullet => bullet.element.remove());
        this.enemies.forEach(enemy => enemy.element.remove());
        this.powerups.forEach(powerup => powerup.element.remove());
        this.lifePlatforms.forEach(platform => platform.element.remove());
        this.weaponBlocks.forEach(block => block.element.remove());
        this.particles.forEach(particle => particle.element.remove());
        
        // Clear arrays
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerups = [];
        this.lifePlatforms = [];
        this.weaponBlocks = [];
        this.particles = [];
        
        // Reset timers
        this.enemySpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        this.lifePlatformSpawnTimer = 0;
        this.weaponBlockSpawnTimer = 0;
        this.frameCount = 0;
    }
    
    resetPlayerPowerups() {
        this.rapidFire = false;
        this.rapidFireTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        this.multiShot = false;
        this.multiShotTimer = 0;
        this.rocketWeapon = false;
        this.rocketWeaponTimer = 0;
        this.tripleWeapon = false;
        this.tripleWeaponTimer = 0;
        this.laserWeapon = false;
        this.laserWeaponTimer = 0;
        this.player.classList.remove('player-shield');
        this.playerShootCooldown = 0;
        this.playerShootRate = 15;
    }
    
    render() {
        // Game rendering is handled by CSS and DOM updates
        // This method can be expanded for additional visual effects
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
