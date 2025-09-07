// Consolidated Game Engine for Subway Surfers
// All game classes and systems in a single file for minimal footprint

export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';
export type PowerUpType = 'magnet' | 'speed' | 'shield';

// Utility Functions
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const lerp = (start: number, end: number, factor: number): number => start + (end - start) * factor;
const random = (min: number, max: number): number => Math.random() * (max - min) + min;

// Vector2D class for position and velocity
class Vector2D {
  constructor(public x: number = 0, public y: number = 0) {}
  
  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }
  
  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }
  
  distance(other: Vector2D): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Particle System for Effects
class Particle {
  public life: number;
  public maxLife: number;
  
  constructor(
    public position: Vector2D,
    public velocity: Vector2D,
    public color: string,
    life: number = 1000
  ) {
    this.life = life;
    this.maxLife = life;
  }
  
  update(deltaTime: number): boolean {
    this.position = this.position.add(this.velocity.multiply(deltaTime));
    this.velocity = this.velocity.multiply(0.98); // Friction
    this.life -= deltaTime * 1000;
    return this.life > 0;
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x - 2, this.position.y - 2, 4, 4);
    ctx.restore();
  }
}

// Player Character Class
class Player {
  public position: Vector2D;
  public velocity: Vector2D;
  public currentLane: number = 1; // 0=left, 1=center, 2=right
  public targetLane: number = 1;
  public isJumping: boolean = false;
  public isSliding: boolean = false;
  public groundY: number;
  public jumpHeight: number = 150;
  public slideTime: number = 0;
  public width: number = 40;
  public height: number = 60;
  public animationFrame: number = 0;
  public invulnerable: boolean = false;
  public invulnerableTime: number = 0;
  
  constructor(x: number, y: number, groundY: number) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.groundY = groundY;
  }
  
  update(deltaTime: number, lanePositions: number[]): void {
    // Lane switching with smooth interpolation
    this.targetLane = clamp(this.targetLane, 0, 2);
    const targetX = lanePositions[this.targetLane];
    this.position.x = lerp(this.position.x, targetX, deltaTime * 8);
    
    // Update current lane when close enough
    if (Math.abs(this.position.x - targetX) < 5) {
      this.currentLane = this.targetLane;
    }
    
    // Jumping physics
    if (this.isJumping) {
      this.velocity.y += 800 * deltaTime; // Gravity
      this.position.y += this.velocity.y * deltaTime;
      
      if (this.position.y >= this.groundY) {
        this.position.y = this.groundY;
        this.velocity.y = 0;
        this.isJumping = false;
      }
    }
    
    // Sliding mechanics
    if (this.isSliding) {
      this.slideTime -= deltaTime * 1000;
      if (this.slideTime <= 0) {
        this.isSliding = false;
      }
    }
    
    // Invulnerability timer
    if (this.invulnerable) {
      this.invulnerableTime -= deltaTime * 1000;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Animation
    this.animationFrame += deltaTime * 10;
  }
  
  jump(): void {
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.velocity.y = -600; // Jump velocity
    }
  }
  
  slide(): void {
    if (!this.isJumping && !this.isSliding) {
      this.isSliding = true;
      this.slideTime = 800; // 800ms slide duration
    }
  }
  
  moveLane(direction: number): void {
    this.targetLane = clamp(this.targetLane + direction, 0, 2);
  }
  
  getHitbox(): { x: number, y: number, width: number, height: number } {
    const height = this.isSliding ? this.height * 0.6 : this.height;
    const y = this.isSliding ? this.position.y + this.height * 0.4 : this.position.y;
    
    return {
      x: this.position.x - this.width / 2,
      y: y - height,
      width: this.width,
      height: height
    };
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    const hitbox = this.getHitbox();
    
    ctx.save();
    
    // Invulnerability flashing effect
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
      ctx.globalAlpha = 0.5;
    }
    
    // Player body
    if (this.isSliding) {
      ctx.fillStyle = '#FF6B35';
      ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    } else {
      // Standing/jumping player
      ctx.fillStyle = '#FF6B35';
      ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
      
      // Head
      ctx.fillStyle = '#FFB84D';
      ctx.beginPath();
      ctx.arc(this.position.x, hitbox.y - 10, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Running animation effect
    if (!this.isJumping && !this.isSliding) {
      const bounce = Math.sin(this.animationFrame) * 2;
      ctx.translate(0, bounce);
    }
    
    ctx.restore();
  }
}

// Obstacle Class
class Obstacle {
  public width: number;
  public height: number;
  public type: 'barrier' | 'train' | 'low';
  
  constructor(
    public position: Vector2D,
    public lane: number,
    type: 'barrier' | 'train' | 'low' = 'barrier'
  ) {
    this.type = type;
    
    switch (type) {
      case 'barrier':
        this.width = 40;
        this.height = 80;
        break;
      case 'train':
        this.width = 60;
        this.height = 100;
        break;
      case 'low':
        this.width = 50;
        this.height = 40;
        break;
    }
  }
  
  update(deltaTime: number, gameSpeed: number): void {
    this.position.y += gameSpeed * deltaTime;
  }
  
  getHitbox(): { x: number, y: number, width: number, height: number } {
    return {
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height,
      width: this.width,
      height: this.height
    };
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    const hitbox = this.getHitbox();
    
    ctx.save();
    
    switch (this.type) {
      case 'barrier':
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        // Add details
        ctx.fillStyle = '#654321';
        ctx.fillRect(hitbox.x + 5, hitbox.y + 5, hitbox.width - 10, 10);
        break;
      case 'train':
        // Train car
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        // Windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(hitbox.x + 10, hitbox.y + 20, 15, 15);
        ctx.fillRect(hitbox.x + 35, hitbox.y + 20, 15, 15);
        break;
      case 'low':
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        break;
    }
    
    ctx.restore();
  }
}

// Coin Collectible Class
class Coin {
  public width: number = 20;
  public height: number = 20;
  public collected: boolean = false;
  public animationFrame: number = 0;
  public magnetTarget: Vector2D | null = null;
  
  constructor(public position: Vector2D, public lane: number) {}
  
  update(deltaTime: number, gameSpeed: number, playerPos: Vector2D, magnetActive: boolean): void {
    this.animationFrame += deltaTime * 15;
    
    // Magnetic attraction
    if (magnetActive && !this.collected) {
      const distance = this.position.distance(playerPos);
      if (distance < 150) {
        const force = Math.min(1, 300 / distance);
        this.position.x = lerp(this.position.x, playerPos.x, deltaTime * force * 5);
        this.position.y = lerp(this.position.y, playerPos.y, deltaTime * force * 5);
      }
    }
    
    if (!this.magnetTarget) {
      this.position.y += gameSpeed * deltaTime;
    }
  }
  
  getHitbox(): { x: number, y: number, width: number, height: number } {
    return {
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;
    
    const rotation = this.animationFrame;
    
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(rotation);
    
    // Coin with golden color and shine effect
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner shine
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-3, -3, this.width / 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// PowerUp Class
class PowerUp {
  public width: number = 30;
  public height: number = 30;
  public collected: boolean = false;
  public animationFrame: number = 0;
  
  constructor(
    public position: Vector2D,
    public lane: number,
    public type: PowerUpType
  ) {}
  
  update(deltaTime: number, gameSpeed: number): void {
    this.position.y += gameSpeed * deltaTime;
    this.animationFrame += deltaTime * 8;
  }
  
  getHitbox(): { x: number, y: number, width: number, height: number } {
    return {
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;
    
    const bounce = Math.sin(this.animationFrame) * 5;
    
    ctx.save();
    ctx.translate(this.position.x, this.position.y + bounce);
    
    // Power-up base
    ctx.fillStyle = this.getPowerUpColor();
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Icon/Symbol
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getPowerUpSymbol(), 0, 0);
    
    ctx.restore();
  }
  
  private getPowerUpColor(): string {
    switch (this.type) {
      case 'magnet': return '#9B59B6';
      case 'speed': return '#E74C3C';
      case 'shield': return '#3498DB';
    }
  }
  
  private getPowerUpSymbol(): string {
    switch (this.type) {
      case 'magnet': return '🧲';
      case 'speed': return '⚡';
      case 'shield': return '🛡️';
    }
  }
}

// Main Game Engine Class
export class GameEngine {
  // Game state
  private state: GameState = 'menu';
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private fpsCounter: number = 0;
  private fpsTime: number = 0;
  
  // Game entities
  private player: Player;
  private obstacles: Obstacle[] = [];
  private coins: Coin[] = [];
  private powerUps: PowerUp[] = [];
  private particles: Particle[] = [];
  
  // Game settings
  private lanePositions: number[];
  private gameSpeed: number = 300;
  private baseSpeed: number = 300;
  private score: number = 0;
  private highScore: number = 0;
  private lives: number = 3;
  private groundY: number;
  
  // Spawning
  private lastObstacleSpawn: number = 0;
  private lastCoinSpawn: number = 0;
  private lastPowerUpSpawn: number = 0;
  private obstacleSpawnInterval: number = 2000; // 2 seconds
  
  // Power-ups
  private activePowerUps: Map<PowerUpType, number> = new Map();
  
  // Input handling
  private keys: Set<string> = new Set();
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  
  // Callbacks
  public onStateChange?: (state: string) => void;
  public onScoreChange?: (score: number) => void;
  public onFpsChange?: (fps: number) => void;
  public onPlaySound?: (soundName: string) => void;
  
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, isMobile: boolean) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    
    // Calculate lane positions
    this.lanePositions = [
      width * 0.25,  // Left lane
      width * 0.5,   // Center lane
      width * 0.75   // Right lane
    ];
    
    this.groundY = height * 0.8;
    
    // Initialize player
    this.player = new Player(this.lanePositions[1], this.groundY, this.groundY);
    
    // Setup input handlers
    this.setupInputHandlers(isMobile);
  }
  
  private setupInputHandlers(isMobile: boolean): void {
    if (isMobile) {
      // Touch controls
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
      });
      
      this.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (this.state === 'menu' || this.state === 'gameOver') {
          this.startGame();
          return;
        }
        
        if (this.state !== 'playing') return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const threshold = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > threshold) {
            this.player.moveLane(1); // Right
          } else if (deltaX < -threshold) {
            this.player.moveLane(-1); // Left
          }
        } else {
          // Vertical swipe
          if (deltaY < -threshold) {
            this.player.jump(); // Up
            this.onPlaySound?.('jump');
          } else if (deltaY > threshold) {
            this.player.slide(); // Down
            this.onPlaySound?.('slide');
          }
        }
      });
    } else {
      // Keyboard controls
      window.addEventListener('keydown', (e) => {
        this.keys.add(e.code);
        
        if (this.state === 'menu' || this.state === 'gameOver') {
          if (e.code === 'Enter' || e.code === 'Space') {
            this.startGame();
          }
          return;
        }
        
        if (this.state === 'playing') {
          switch (e.code) {
            case 'ArrowLeft':
              this.player.moveLane(-1);
              break;
            case 'ArrowRight':
              this.player.moveLane(1);
              break;
            case 'ArrowUp':
            case 'Space':
              this.player.jump();
              this.onPlaySound?.('jump');
              break;
            case 'ArrowDown':
              this.player.slide();
              this.onPlaySound?.('slide');
              break;
            case 'Escape':
              this.pauseGame();
              break;
          }
        } else if (this.state === 'paused' && e.code === 'Escape') {
          this.resumeGame();
        }
        
        e.preventDefault();
      });
      
      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
      });
    }
    
    // Click handler for menu/game over
    this.canvas.addEventListener('click', () => {
      if (this.state === 'menu' || this.state === 'gameOver') {
        this.startGame();
      }
    });
  }
  
  // Game flow methods
  public start(): void {
    this.gameLoop(0);
  }
  
  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  public startGame(): void {
    this.resetGame();
    this.setState('playing');
  }
  
  public pauseGame(): void {
    if (this.state === 'playing') {
      this.setState('paused');
    }
  }
  
  public resumeGame(): void {
    if (this.state === 'paused') {
      this.setState('playing');
    }
  }
  
  public resetGame(): void {
    this.score = 0;
    this.lives = 3;
    this.gameSpeed = this.baseSpeed;
    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
    this.particles = [];
    this.activePowerUps.clear();
    this.lastObstacleSpawn = 0;
    this.lastCoinSpawn = 0;
    this.lastPowerUpSpawn = 0;
    
    // Reset player
    this.player = new Player(this.lanePositions[1], this.groundY, this.groundY);
    
    this.onScoreChange?.(this.score);
  }
  
  public setHighScore(score: number): void {
    this.highScore = score;
  }
  
  private setState(newState: GameState): void {
    this.state = newState;
    this.onStateChange?.(newState);
  }
  
  // Game loop
  private gameLoop(currentTime: number): void {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
    this.lastTime = currentTime;
    
    // FPS calculation
    this.fpsCounter++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1) {
      this.onFpsChange?.(this.fpsCounter / this.fpsTime);
      this.fpsCounter = 0;
      this.fpsTime = 0;
    }
    
    // Update and render
    if (this.state === 'playing') {
      this.update(deltaTime);
    }
    this.render();
    
    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  private update(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Update player
    this.player.update(deltaTime, this.lanePositions);
    
    // Spawn obstacles
    if (currentTime - this.lastObstacleSpawn > this.obstacleSpawnInterval) {
      this.spawnObstacle();
      this.lastObstacleSpawn = currentTime;
    }
    
    // Spawn coins
    if (currentTime - this.lastCoinSpawn > 1500) {
      this.spawnCoin();
      this.lastCoinSpawn = currentTime;
    }
    
    // Spawn power-ups
    if (currentTime - this.lastPowerUpSpawn > 15000) { // Every 15 seconds
      this.spawnPowerUp();
      this.lastPowerUpSpawn = currentTime;
    }
    
    // Update obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.update(deltaTime, this.gameSpeed);
      return obstacle.position.y < this.canvas.height + 100;
    });
    
    // Update coins
    const magnetActive = this.activePowerUps.has('magnet');
    this.coins = this.coins.filter(coin => {
      coin.update(deltaTime, this.gameSpeed, this.player.position, magnetActive);
      return coin.position.y < this.canvas.height + 50 && !coin.collected;
    });
    
    // Update power-ups
    this.powerUps = this.powerUps.filter(powerUp => {
      powerUp.update(deltaTime, this.gameSpeed);
      return powerUp.position.y < this.canvas.height + 50 && !powerUp.collected;
    });
    
    // Update particles
    this.particles = this.particles.filter(particle => particle.update(deltaTime));
    
    // Update active power-ups
    for (const [type, endTime] of this.activePowerUps.entries()) {
      if (currentTime > endTime) {
        this.activePowerUps.delete(type);
      }
    }
    
    // Collision detection
    this.checkCollisions();
    
    // Update game speed
    const speedIncrease = Math.floor(this.score / 500) * 50;
    this.gameSpeed = this.baseSpeed + speedIncrease;
    
    // Update spawn interval (get harder)
    this.obstacleSpawnInterval = Math.max(800, 2000 - Math.floor(this.score / 200) * 100);
    
    // Score increment
    this.score += deltaTime * 10;
    this.onScoreChange?.(Math.floor(this.score));
  }
  
  private spawnObstacle(): void {
    const lane = Math.floor(Math.random() * 3);
    const types: ('barrier' | 'train' | 'low')[] = ['barrier', 'train', 'low'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const obstacle = new Obstacle(
      new Vector2D(this.lanePositions[lane], -100),
      lane,
      type
    );
    
    this.obstacles.push(obstacle);
  }
  
  private spawnCoin(): void {
    const numCoins = Math.random() < 0.3 ? 3 : Math.random() < 0.6 ? 2 : 1;
    const baseLane = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numCoins; i++) {
      const lane = Math.min(2, baseLane + i);
      const coin = new Coin(
        new Vector2D(this.lanePositions[lane], -100 - i * 30),
        lane
      );
      this.coins.push(coin);
    }
  }
  
  private spawnPowerUp(): void {
    const lane = Math.floor(Math.random() * 3);
    const types: PowerUpType[] = ['magnet', 'speed', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerUp = new PowerUp(
      new Vector2D(this.lanePositions[lane], -100),
      lane,
      type
    );
    
    this.powerUps.push(powerUp);
  }
  
  private checkCollisions(): void {
    const playerHitbox = this.player.getHitbox();
    
    // Check coin collection
    for (const coin of this.coins) {
      if (!coin.collected && this.isColliding(playerHitbox, coin.getHitbox())) {
        coin.collected = true;
        this.score += 10;
        this.onPlaySound?.('coin');
        
        // Create coin collection particles
        this.createParticles(coin.position, '#FFD700', 5);
      }
    }
    
    // Check power-up collection
    for (const powerUp of this.powerUps) {
      if (!powerUp.collected && this.isColliding(playerHitbox, powerUp.getHitbox())) {
        powerUp.collected = true;
        this.activatePowerUp(powerUp.type);
        this.onPlaySound?.('powerup');
        
        // Create power-up particles
        this.createParticles(powerUp.position, powerUp.type === 'magnet' ? '#9B59B6' : powerUp.type === 'speed' ? '#E74C3C' : '#3498DB', 8);
      }
    }
    
    // Check obstacle collision
    if (!this.player.invulnerable) {
      for (const obstacle of this.obstacles) {
        if (this.isColliding(playerHitbox, obstacle.getHitbox())) {
          this.handlePlayerHit();
          break;
        }
      }
    }
  }
  
  private isColliding(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  private activatePowerUp(type: PowerUpType): void {
    const duration = type === 'magnet' ? 8000 : type === 'speed' ? 6000 : 10000;
    this.activePowerUps.set(type, Date.now() + duration);
    
    if (type === 'shield') {
      this.player.invulnerable = true;
      this.player.invulnerableTime = duration;
    }
  }
  
  private handlePlayerHit(): void {
    if (this.activePowerUps.has('shield')) return;
    
    this.lives--;
    this.onPlaySound?.('hit');
    
    // Create impact particles
    this.createParticles(this.player.position, '#FF4444', 10);
    
    // Temporary invulnerability
    this.player.invulnerable = true;
    this.player.invulnerableTime = 2000;
    
    if (this.lives <= 0) {
      this.setState('gameOver');
      this.onPlaySound?.('gameover');
    }
  }
  
  private createParticles(position: Vector2D, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const velocity = new Vector2D(
        random(-100, 100),
        random(-100, -200)
      );
      this.particles.push(new Particle(position, velocity, color));
    }
  }
  
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#4682B4');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw subway tracks
    this.drawTracks();
    
    if (this.state === 'playing') {
      // Render game entities
      this.obstacles.forEach(obstacle => obstacle.render(this.ctx));
      this.coins.forEach(coin => coin.render(this.ctx));
      this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
      this.particles.forEach(particle => particle.render(this.ctx));
      
      // Render player
      this.player.render(this.ctx);
      
      // Render power-up effects
      this.renderPowerUpEffects();
      
      // Render HUD elements
      this.renderHUD();
    }
  }
  
  private drawTracks(): void {
    // Draw subway tracks
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 4;
    
    for (let i = 0; i < this.lanePositions.length + 1; i++) {
      const x = i === 0 ? this.lanePositions[0] - 40 : 
                i === this.lanePositions.length ? this.lanePositions[2] + 40 :
                (this.lanePositions[i-1] + this.lanePositions[i]) / 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Draw ground
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
  }
  
  private renderPowerUpEffects(): void {
    // Magnet field effect
    if (this.activePowerUps.has('magnet')) {
      this.ctx.save();
      this.ctx.strokeStyle = '#9B59B6';
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(this.player.position.x, this.player.position.y - 30, 60, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
    
    // Speed effect
    if (this.activePowerUps.has('speed')) {
      this.ctx.save();
      this.ctx.strokeStyle = '#E74C3C';
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = 0.7;
      for (let i = 0; i < 3; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.position.x - 20, this.player.position.y + i * 10);
        this.ctx.lineTo(this.player.position.x - 40, this.player.position.y + i * 10);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }
  
  private renderHUD(): void {
    // Lives display
    this.ctx.fillStyle = '#FF4444';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 40);
    
    // Active power-ups display
    let powerUpY = 70;
    for (const [type, endTime] of this.activePowerUps.entries()) {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      this.ctx.fillStyle = type === 'magnet' ? '#9B59B6' : type === 'speed' ? '#E74C3C' : '#3498DB';
      this.ctx.fillText(`${type.toUpperCase()}: ${remaining}s`, 10, powerUpY);
      powerUpY += 25;
    }
  }
}