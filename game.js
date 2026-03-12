// ==========================================
//  RED BALL - 2D Platform Oyunu
//  Canvas-based game engine
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== GAME STATE =====
let gameState = 'menu'; // menu, playing, paused, gameover, complete
let score = 0;
let lives = 3;
let currentLevel = 0;
let camera = { x: 0, y: 0 };
let keys = {};
let particles = [];
let shakeTimer = 0;
let shakeIntensity = 0;
let lastTime = 0;
let animFrame = 0;

// ===== CONSTANTS =====
const GRAVITY = 0.5;
const FRICTION = 0.82;
const PLAYER_SPEED = 0.5;
const SPRINT_MULTIPLIER = 1.8;
const JUMP_FORCE = -15.5;
const TILE = 48;
const MAX_FALL_SPEED = 16;
const COYOTE_TIME = 6;   // frames of grace after leaving ground
const JUMP_BUFFER = 8;   // frames of jump input buffering
const MAX_SPEED = 6;
const MAX_SPRINT_SPEED = 10;

// ===== PLAYER =====
let player = {
    x: 100, y: 300,
    vx: 0, vy: 0,
    radius: 20,
    onGround: false,
    rotation: 0,
    squash: 1,
    stretch: 1,
    alive: true,
    facingRight: true,
    eyeBlink: 0,
    blinkTimer: 0,
    coyoteTimer: 0,     // frames since last on ground
    jumpBufferTimer: 0, // frames since jump was pressed
    wasOnGround: false,
    isSprinting: false
};

// ===== LEVEL DATA =====
// Tile types: 0=empty, 1=grass_top, 2=dirt, 3=stone, 4=spike, 5=star, 6=flag, 7=enemy, 8=moving_platform, 9=checkpoint
const levels = [
    {
        name: "Yeşil Vadi",
        bg: { sky1: '#87CEEB', sky2: '#E0F7FA', mountains: '#4a7c59', grass: '#2d5a27' },
        map: [
            "                                                                                                    ",
            "                                                                                                    ",
            "                                                                                                    ",
            "                                                                                                    ",
            "                                                                                                    ",
            "                                                                                                    ",
            "                                   5   5                                                            ",
            "                                  11111              5                                               ",
            "                5                                   111                        6                     ",
            "               111       5                                    5 5 5          111                     ",
            "                        111   7                              1111111   7     1221                     ",
            "          5                  111         5     5                      111   12221                     ",
            "    P    111       5               7    111   111    7                     122221                     ",
            "        1221     111    7         111                111    5    7         1222221                     ",
            "  1111112221    12221  111                                111  111       12222221                     ",
            "  2222222221    22221  221   111        4 4 4    111           1221      122222221                     ",
            "  2222222221    22221  221   221       111111   1221     111   2221     1222222221                     ",
            "111111111111111111111111111111111111111111111111111111111111111111111111111111111111                    ",
            "222222222222222222222222222222222222222222222222222222222222222222222222222222222222                    ",
            "222222222222222222222222222222222222222222222222222222222222222222222222222222222222                    ",
        ],
        playerStart: { x: 5 * TILE, y: 12 * TILE }
    },
    {
        name: "Karanlık Orman",
        bg: { sky1: '#1a1a2e', sky2: '#16213e', mountains: '#1a3a1a', grass: '#0f2b0f' },
        map: [
            "                                                                                                      ",
            "                                                                                                      ",
            "                                                                                                      ",
            "                                                                                                      ",
            "                                                5                                                     ",
            "                                               111                                                    ",
            "                                                                                 6                    ",
            "            5   5   5                                   5 5 5                   111                    ",
            "           111111111         7                         1111111                  1221                    ",
            "                            111    5                                    7     12221                    ",
            "    P                              111   5   5       7      5     7    111    122221                    ",
            "   111     5    7                       111 111     111    111   111  1221   1222221                    ",
            "          111  111        5                               1221       2221  12222221                    ",
            "  111          221       111    4 4 4 4            5      2221      12221  22222221                    ",
            "  221    5          7          11111111    7      111          7    122221  22222221                    ",
            "  221   111   5    111                   111    11221   7    111   1222221  22222221                    ",
            "  221        111   221   111                    22221  111   221  12222221  22222221                    ",
            "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111                   ",
            "222222222222222222222222222222222222222222222222222222222222222222222222222222222222222                   ",
            "222222222222222222222222222222222222222222222222222222222222222222222222222222222222222                   ",
        ],
        playerStart: { x: 4 * TILE, y: 10 * TILE }
    },
    {
        name: "Lav Dağı",
        bg: { sky1: '#1a0000', sky2: '#330000', mountains: '#4a1a1a', grass: '#3a1010' },
        map: [
            "                                                                                                        ",
            "                                                                                                        ",
            "                                                                                                        ",
            "                                                                                                        ",
            "                                                                                                        ",
            "                5                                                              6                        ",
            "               111               5   5   5                                    111                        ",
            "                                111111111          5                          1221                        ",
            "    P                                             111      5     5           12221                        ",
            "   111    5                                              111   111    7     122221                        ",
            "         111     7       5          7     5                          111   1222221                        ",
            "                111     111   7    111   111    7         7               12222221                        ",
            "  111                        111              111   5   111    5         122222221                        ",
            "  221     5     4 4 4              4 4 4            111       111   7   1222222221                        ",
            "  221    111   1111111    7       1111111   7                     111  12222222221                        ",
            "  221         12222221   111     122222221 111    111    7           1122222222221                        ",
            "  221    7    22222221   221     222222221 221          111    111  11222222222221                        ",
            "11111111111111111111111111111111111111111111111111111111111111111111111111111111111111                      ",
            "22222222222222222222222222222222222222222222222222222222222222222222222222222222222222                      ",
            "22222222222222222222222222222222222222222222222222222222222222222222222222222222222222                      ",
        ],
        playerStart: { x: 4 * TILE, y: 8 * TILE }
    }
];

// ===== GAME OBJECTS =====
let platforms = [];
let spikes = [];
let stars = [];
let enemies = [];
let flag = null;
let clouds = [];

// ===== INIT =====
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Generate clouds
function generateClouds() {
    clouds = [];
    for (let i = 0; i < 15; i++) {
        clouds.push({
            x: Math.random() * 4000,
            y: Math.random() * canvas.height * 0.4,
            w: 60 + Math.random() * 120,
            h: 25 + Math.random() * 35,
            speed: 0.15 + Math.random() * 0.3,
            opacity: 0.15 + Math.random() * 0.25
        });
    }
}

generateClouds();

// ===== LEVEL LOADING =====
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        // All levels done
        gameState = 'complete';
        showScreen('complete-screen');
        document.getElementById('complete-score').textContent = score;
        document.getElementById('btn-next-level').style.display = 'none';
        return;
    }

    const level = levels[levelIndex];
    platforms = [];
    spikes = [];
    stars = [];
    enemies = [];
    flag = null;
    particles = [];

    const map = level.map;

    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const char = map[row][col];
            const x = col * TILE;
            const y = row * TILE;

            switch (char) {
                case '1': // Grass top
                    platforms.push({ x, y, w: TILE, h: TILE, type: 'grass' });
                    break;
                case '2': // Dirt
                    platforms.push({ x, y, w: TILE, h: TILE, type: 'dirt' });
                    break;
                case '3': // Stone
                    platforms.push({ x, y, w: TILE, h: TILE, type: 'stone' });
                    break;
                case '4': // Spike
                    spikes.push({ x, y, w: TILE, h: TILE });
                    break;
                case '5': // Star
                    stars.push({ x: x + TILE / 2, y: y + TILE / 2, collected: false, bobPhase: Math.random() * Math.PI * 2 });
                    break;
                case '6': // Flag
                    flag = { x: x + TILE / 2, y, wavePhase: 0 };
                    break;
                case '7': // Enemy
                    enemies.push({
                        x, y: y,
                        w: 40, h: 40,
                        vx: 1.5,
                        alive: true,
                        startX: x - 80,
                        endX: x + 80,
                        squash: 1,
                        eyePhase: Math.random() * Math.PI * 2
                    });
                    break;
                case 'P': // Player start
                    // Alternative player start position
                    break;
            }
        }
    }

    // Set player position
    player.x = level.playerStart.x;
    player.y = level.playerStart.y;
    player.vx = 0;
    player.vy = 0;
    player.alive = true;
    player.rotation = 0;

    camera.x = 0;
    camera.y = 0;

    document.getElementById('level-text').textContent = `Bölüm ${levelIndex + 1}`;
    document.getElementById('score-text').textContent = score;
    document.getElementById('lives-text').textContent = lives;
}

// ===== INPUT =====
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function mobileInput(action, pressed) {
    switch (action) {
        case 'left':
            keys['ArrowLeft'] = pressed;
            break;
        case 'right':
            keys['ArrowRight'] = pressed;
            break;
        case 'jump':
            keys['Space'] = pressed;
            break;
    }
}

// ===== PHYSICS & GAME LOGIC =====
function updatePlayer(dt) {
    if (!player.alive) return;

    // Sprint check
    player.isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
    const speedMult = player.isSprinting ? SPRINT_MULTIPLIER : 1.0;
    const currentMaxSpeed = player.isSprinting ? MAX_SPRINT_SPEED : MAX_SPEED;

    // Horizontal input
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.vx -= PLAYER_SPEED * speedMult;
        player.facingRight = false;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.vx += PLAYER_SPEED * speedMult;
        player.facingRight = true;
    }

    // Clamp horizontal speed
    if (player.vx > currentMaxSpeed) player.vx = currentMaxSpeed;
    if (player.vx < -currentMaxSpeed) player.vx = -currentMaxSpeed;

    // Coyote time management
    if (player.onGround) {
        player.coyoteTimer = COYOTE_TIME;
    } else {
        if (player.coyoteTimer > 0) player.coyoteTimer--;
    }

    // Jump buffer - remember jump presses
    if (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) {
        player.jumpBufferTimer = JUMP_BUFFER;
    } else {
        if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;
    }

    // Jump (with coyote time and jump buffering)
    const canJump = player.onGround || player.coyoteTimer > 0;
    if (player.jumpBufferTimer > 0 && canJump) {
        player.vy = JUMP_FORCE;
        player.onGround = false;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
        player.squash = 0.7;
        player.stretch = 1.3;
        spawnParticles(player.x, player.y + player.radius, 5, '#8B7355');
    }

    // Variable jump height - release jump key early for shorter jump
    if (!(keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.vy < -3) {
        player.vy *= 0.85;
    }

    // Apply gravity
    player.vy += GRAVITY;
    if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

    // Apply friction
    player.vx *= FRICTION;

    // Clamp small velocities
    if (Math.abs(player.vx) < 0.1) player.vx = 0;

    // Store previous ground state
    player.wasOnGround = player.onGround;

    // Move and collide (Y first, then X for better ground detection)
    player.y += player.vy;
    handleCollisionY();
    player.x += player.vx;
    handleCollisionX();

    // Extra ground check - raycast a few pixels below
    if (!player.onGround && player.vy >= 0) {
        checkGroundBelow();
    }

    // Sprint HUD indicator
    const sprintHud = document.getElementById('hud-sprint');
    if (sprintHud) {
        sprintHud.style.display = player.isSprinting ? 'flex' : 'none';
    }

    // Sprint trail particles
    if (player.isSprinting && player.onGround && Math.abs(player.vx) > 2 && animFrame % 3 === 0) {
        spawnParticles(player.x - player.vx * 2, player.y + player.radius - 5, 1, '#ffd60a');
    }

    // Rotation based on horizontal velocity
    player.rotation += player.vx * 0.05;

    // Squash and stretch recovery
    player.squash += (1 - player.squash) * 0.15;
    player.stretch += (1 - player.stretch) * 0.15;

    // Eye blink
    player.blinkTimer++;
    if (player.blinkTimer > 180 + Math.random() * 120) {
        player.eyeBlink = 1;
        player.blinkTimer = 0;
    }
    if (player.eyeBlink > 0) {
        player.eyeBlink -= 0.15;
        if (player.eyeBlink < 0) player.eyeBlink = 0;
    }

    // Fall off map
    if (player.y > levels[currentLevel].map.length * TILE + 200) {
        killPlayer();
    }

    // Check star collection
    for (let star of stars) {
        if (!star.collected) {
            const dx = player.x - star.x;
            const dy = player.y - star.y;
            if (Math.sqrt(dx * dx + dy * dy) < player.radius + 18) {
                star.collected = true;
                score += 100;
                document.getElementById('score-text').textContent = score;
                spawnParticles(star.x, star.y, 8, '#ffd60a');
            }
        }
    }

    // Check spike collision
    for (let spike of spikes) {
        if (player.x + player.radius > spike.x + 8 &&
            player.x - player.radius < spike.x + spike.w - 8 &&
            player.y + player.radius > spike.y + 12 &&
            player.y - player.radius < spike.y + spike.h) {
            killPlayer();
        }
    }

    // Check enemy collision
    for (let enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = player.x - (enemy.x + enemy.w / 2);
        const dy = player.y - (enemy.y + enemy.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + enemy.w / 2) {
            // Player landing on top of enemy
            if (player.vy > 0 && player.y < enemy.y) {
                // Stomp!
                enemy.alive = false;
                enemy.squash = 0.1;
                player.vy = JUMP_FORCE * 0.7;
                score += 200;
                document.getElementById('score-text').textContent = score;
                spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 10, '#e63946');
                shakeTimer = 8;
                shakeIntensity = 4;
            } else {
                // Enemy hits player
                killPlayer();
            }
        }
    }

    // Check flag
    if (flag) {
        const dx = player.x - flag.x;
        const dy = player.y - flag.y;
        if (Math.abs(dx) < 40 && Math.abs(dy) < 60) {
            levelComplete();
        }
    }
}

function handleCollisionX() {
    // DO NOT reset onGround here - that was the bug!
    for (let p of platforms) {
        if (player.x + player.radius > p.x + 1 &&
            player.x - player.radius < p.x + p.w - 1 &&
            player.y + player.radius > p.y + 4 &&
            player.y - player.radius < p.y + p.h - 4) {
            if (player.vx > 0) {
                player.x = p.x - player.radius;
            } else if (player.vx < 0) {
                player.x = p.x + p.w + player.radius;
            }
            player.vx = 0;
        }
    }
}

function handleCollisionY() {
    player.onGround = false;
    for (let p of platforms) {
        if (player.x + player.radius > p.x + 1 &&
            player.x - player.radius < p.x + p.w - 1 &&
            player.y + player.radius > p.y &&
            player.y - player.radius < p.y + p.h) {
            if (player.vy >= 0) {
                // Landing (also catch vy === 0 standing on platform)
                player.y = p.y - player.radius;
                if (player.vy > 5) {
                    player.squash = 1.3;
                    player.stretch = 0.7;
                    spawnParticles(player.x, player.y + player.radius, 3, '#8B7355');
                }
                player.vy = 0;
                player.onGround = true;
            } else if (player.vy < 0) {
                // Head bump
                player.y = p.y + p.h + player.radius;
                player.vy = 0;
            }
        }
    }
}

// Extra ground detection: check if there's a platform just below the player
function checkGroundBelow() {
    const checkDist = 3; // look 3 pixels below
    for (let p of platforms) {
        if (player.x + player.radius > p.x + 1 &&
            player.x - player.radius < p.x + p.w - 1 &&
            player.y + player.radius >= p.y - checkDist &&
            player.y + player.radius <= p.y + checkDist) {
            player.y = p.y - player.radius;
            player.vy = 0;
            player.onGround = true;
            break;
        }
    }
}

function updateEnemies() {
    for (let enemy of enemies) {
        if (!enemy.alive) {
            enemy.squash += (0 - enemy.squash) * 0.1;
            continue;
        }

        enemy.x += enemy.vx;
        enemy.eyePhase += 0.03;

        // Reverse direction at boundaries
        if (enemy.x <= enemy.startX || enemy.x + enemy.w >= enemy.endX + enemy.w) {
            enemy.vx *= -1;
        }

        // Check platform edges
        let onPlatform = false;
        for (let p of platforms) {
            if (enemy.x + enemy.w > p.x &&
                enemy.x < p.x + p.w &&
                Math.abs((enemy.y + enemy.h) - p.y) < 5) {
                onPlatform = true;
            }
        }

        // Apply gravity to enemy
        if (!onPlatform) {
            // Check below
            let foundGround = false;
            for (let p of platforms) {
                if (enemy.x + enemy.w > p.x + 2 &&
                    enemy.x < p.x + p.w - 2 &&
                    enemy.y + enemy.h <= p.y &&
                    enemy.y + enemy.h + 8 >= p.y) {
                    enemy.y = p.y - enemy.h;
                    foundGround = true;
                    break;
                }
            }
        }
    }
}

function killPlayer() {
    if (!player.alive) return;
    player.alive = false;
    lives--;
    document.getElementById('lives-text').textContent = lives;
    shakeTimer = 15;
    shakeIntensity = 8;
    spawnParticles(player.x, player.y, 20, '#e63946');

    if (lives <= 0) {
        setTimeout(() => {
            gameState = 'gameover';
            showScreen('gameover-screen');
            document.getElementById('final-score').textContent = score;
        }, 1000);
    } else {
        setTimeout(() => {
            respawnPlayer();
        }, 1000);
    }
}

function respawnPlayer() {
    const level = levels[currentLevel];
    player.x = level.playerStart.x;
    player.y = level.playerStart.y;
    player.vx = 0;
    player.vy = 0;
    player.alive = true;
    player.rotation = 0;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
}

function levelComplete() {
    gameState = 'complete';
    spawnParticles(flag.x, flag.y, 30, '#ffd60a');
    spawnParticles(flag.x, flag.y, 20, '#3fb950');

    const totalStars = stars.length;
    const collected = stars.filter(s => s.collected).length;
    const ratio = totalStars > 0 ? collected / totalStars : 1;

    let starDisplay = '';
    if (ratio >= 0.9) starDisplay = '⭐⭐⭐';
    else if (ratio >= 0.5) starDisplay = '⭐⭐';
    else starDisplay = '⭐';

    score += 500;

    setTimeout(() => {
        showScreen('complete-screen');
        document.getElementById('complete-score').textContent = score;
        document.getElementById('stars-earned').textContent = starDisplay;

        if (currentLevel + 1 >= levels.length) {
            document.getElementById('btn-next-level').innerHTML = '<span>🏆</span> Tebrikler! Tüm Bölümler Tamam!';
            document.getElementById('btn-next-level').onclick = quitToMenu;
        } else {
            document.getElementById('btn-next-level').innerHTML = '<span>➡</span> Sonraki Bölüm';
            document.getElementById('btn-next-level').onclick = nextLevel;
            document.getElementById('btn-next-level').style.display = '';
        }
    }, 800);
}

// ===== PARTICLES =====
function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 1,
            decay: 0.015 + Math.random() * 0.02,
            size: 3 + Math.random() * 5,
            color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= p.decay;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ===== CAMERA =====
function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * 0.08;
    camera.y += (targetY - camera.y) * 0.06;

    // Clamp camera
    if (camera.x < 0) camera.x = 0;
    if (camera.y < -100) camera.y = -100;

    const maxY = levels[currentLevel].map.length * TILE - canvas.height + 100;
    if (camera.y > maxY) camera.y = maxY;
}

// ===== RENDERING =====
function drawBackground() {
    const level = levels[currentLevel];
    const bg = level.bg;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, bg.sky1);
    skyGrad.addColorStop(1, bg.sky2);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun/Moon
    if (currentLevel === 0) {
        // Sun
        ctx.save();
        ctx.globalAlpha = 0.9;
        const sunGrad = ctx.createRadialGradient(
            canvas.width * 0.8, canvas.height * 0.15, 10,
            canvas.width * 0.8, canvas.height * 0.15, 60
        );
        sunGrad.addColorStop(0, '#fff7a1');
        sunGrad.addColorStop(0.5, '#ffd60a');
        sunGrad.addColorStop(1, 'rgba(255, 214, 10, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(canvas.width * 0.8, canvas.height * 0.15, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else if (currentLevel === 1) {
        // Moon
        ctx.save();
        ctx.globalAlpha = 0.8;
        const moonGrad = ctx.createRadialGradient(
            canvas.width * 0.75, canvas.height * 0.12, 10,
            canvas.width * 0.75, canvas.height * 0.12, 35
        );
        moonGrad.addColorStop(0, '#f0f0f0');
        moonGrad.addColorStop(0.7, '#c0c0c0');
        moonGrad.addColorStop(1, 'rgba(200, 200, 200, 0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(canvas.width * 0.75, canvas.height * 0.12, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else {
        // Lava glow
        ctx.save();
        ctx.globalAlpha = 0.3;
        const lavaGlow = ctx.createRadialGradient(
            canvas.width * 0.5, canvas.height, 100,
            canvas.width * 0.5, canvas.height, canvas.height
        );
        lavaGlow.addColorStop(0, '#ff4500');
        lavaGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = lavaGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Clouds
    ctx.save();
    for (let cloud of clouds) {
        const cx = cloud.x - camera.x * 0.2;
        const cy = cloud.y;
        ctx.globalAlpha = cloud.opacity;
        ctx.fillStyle = currentLevel === 0 ? '#ffffff' : currentLevel === 1 ? '#2a3a5a' : '#4a2020';
        drawCloud(cx, cy, cloud.w, cloud.h);
    }
    ctx.restore();

    // Mountains (parallax)
    drawMountains(bg.mountains, 0.3, canvas.height * 0.45, canvas.height * 0.35);
    drawMountains(bg.grass, 0.5, canvas.height * 0.55, canvas.height * 0.25);
}

function drawCloud(x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x - w * 0.25, y + h * 0.1, w * 0.35, h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.25, y + h * 0.1, w * 0.35, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawMountains(color, parallax, baseY, height) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    const offset = -camera.x * parallax;
    for (let x = 0; x <= canvas.width + 200; x += 5) {
        const worldX = x + offset;
        const y = baseY + Math.sin(worldX * 0.003) * height * 0.5
                        + Math.sin(worldX * 0.007 + 1) * height * 0.3
                        + Math.sin(worldX * 0.015 + 3) * height * 0.2;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawPlatforms() {
    for (let p of platforms) {
        const sx = p.x - camera.x;
        const sy = p.y - camera.y;

        // Skip if off screen
        if (sx + p.w < -TILE || sx > canvas.width + TILE || sy + p.h < -TILE || sy > canvas.height + TILE) continue;

        if (p.type === 'grass') {
            // Grass top block
            const grassGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
            grassGrad.addColorStop(0, '#4ade80');
            grassGrad.addColorStop(0.3, '#22c55e');
            grassGrad.addColorStop(1, '#8B6914');
            ctx.fillStyle = grassGrad;
            ctx.fillRect(sx, sy, p.w, p.h);

            // Grass top detail
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(sx, sy, p.w, 6);

            // Grass blades
            ctx.fillStyle = '#6ee7a0';
            for (let gx = 0; gx < p.w; gx += 8) {
                const gh = 4 + Math.sin((p.x + gx) * 0.5 + animFrame * 0.05) * 3;
                ctx.fillRect(sx + gx, sy - gh + 2, 3, gh);
            }

            // Outline
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, p.w, p.h);
        } else if (p.type === 'dirt') {
            const dirtGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
            dirtGrad.addColorStop(0, '#8B6914');
            dirtGrad.addColorStop(1, '#6B4E12');
            ctx.fillStyle = dirtGrad;
            ctx.fillRect(sx, sy, p.w, p.h);

            // Dirt texture dots
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            const seed = p.x * 7 + p.y * 13;
            for (let i = 0; i < 4; i++) {
                const dx = ((seed + i * 37) % 40) + 4;
                const dy = ((seed + i * 59) % 40) + 4;
                ctx.beginPath();
                ctx.arc(sx + dx, sy + dy, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, p.w, p.h);
        } else if (p.type === 'stone') {
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(sx, sy, p.w, p.h);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, p.w, p.h);
        }
    }
}

function drawSpikes() {
    for (let spike of spikes) {
        const sx = spike.x - camera.x;
        const sy = spike.y - camera.y;

        if (sx + spike.w < 0 || sx > canvas.width) continue;

        const spikeCount = 3;
        const spikeW = spike.w / spikeCount;

        for (let i = 0; i < spikeCount; i++) {
            ctx.fillStyle = '#9ca3af';
            ctx.beginPath();
            ctx.moveTo(sx + i * spikeW, sy + spike.h);
            ctx.lineTo(sx + i * spikeW + spikeW / 2, sy + 6);
            ctx.lineTo(sx + (i + 1) * spikeW, sy + spike.h);
            ctx.closePath();
            ctx.fill();

            // Spike highlight
            ctx.fillStyle = '#d1d5db';
            ctx.beginPath();
            ctx.moveTo(sx + i * spikeW + spikeW * 0.3, sy + spike.h);
            ctx.lineTo(sx + i * spikeW + spikeW / 2, sy + 6);
            ctx.lineTo(sx + i * spikeW + spikeW * 0.5, sy + spike.h);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawStars() {
    for (let star of stars) {
        if (star.collected) continue;

        const sx = star.x - camera.x;
        const sy = star.y - camera.y + Math.sin(animFrame * 0.06 + star.bobPhase) * 6;

        if (sx < -30 || sx > canvas.width + 30) continue;

        // Star glow
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(animFrame * 0.08) * 0.15;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 25);
        glow.addColorStop(0, '#ffd60a');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Star shape
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(animFrame * 0.02);
        drawStarShape(0, 0, 14, 7, 5, '#ffd60a', '#ffed4a');
        ctx.restore();
    }
}

function drawStarShape(cx, cy, outerR, innerR, points, color1, color2) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / points) * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color1;
    ctx.fill();
    ctx.strokeStyle = color2;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawEnemies() {
    for (let enemy of enemies) {
        const sx = enemy.x - camera.x;
        const sy = enemy.y - camera.y;

        if (sx + enemy.w < 0 || sx > canvas.width) continue;

        const centerX = sx + enemy.w / 2;
        const centerY = sy + enemy.h / 2;

        ctx.save();
        ctx.translate(centerX, centerY);

        if (!enemy.alive) {
            ctx.scale(1, enemy.squash);
        }

        // Enemy body (evil square)
        const eGrad = ctx.createLinearGradient(-enemy.w / 2, -enemy.h / 2, enemy.w / 2, enemy.h / 2);
        eGrad.addColorStop(0, '#7c3aed');
        eGrad.addColorStop(1, '#4c1d95');
        ctx.fillStyle = eGrad;

        // Rounded rect
        const hw = enemy.w / 2;
        const hh = enemy.h / 2;
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(-hw + r, -hh);
        ctx.lineTo(hw - r, -hh);
        ctx.quadraticCurveTo(hw, -hh, hw, -hh + r);
        ctx.lineTo(hw, hh - r);
        ctx.quadraticCurveTo(hw, hh, hw - r, hh);
        ctx.lineTo(-hw + r, hh);
        ctx.quadraticCurveTo(-hw, hh, -hw, hh - r);
        ctx.lineTo(-hw, -hh + r);
        ctx.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
        ctx.closePath();
        ctx.fill();

        // Enemy outline
        ctx.strokeStyle = '#5b21b6';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (enemy.alive) {
            // Evil eyes
            const eyeOffsetX = Math.sin(enemy.eyePhase) * 2;

            // Left eye
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(-8, -5, 7, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(-8 + eyeOffsetX, -4, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Right eye
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(8, -5, 7, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(8 + eyeOffsetX, -4, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Angry eyebrows
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-14, -14);
            ctx.lineTo(-3, -10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(14, -14);
            ctx.lineTo(3, -10);
            ctx.stroke();

            // Mean mouth
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7, 10);
            ctx.lineTo(-3, 7);
            ctx.lineTo(3, 7);
            ctx.lineTo(7, 10);
            ctx.stroke();
        } else {
            // Dead eyes (X X)
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-11, -8); ctx.lineTo(-5, -2);
            ctx.moveTo(-5, -8); ctx.lineTo(-11, -2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(5, -8); ctx.lineTo(11, -2);
            ctx.moveTo(11, -8); ctx.lineTo(5, -2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

function drawPlayer() {
    if (!player.alive && shakeTimer <= 0) return;

    const sx = player.x - camera.x;
    const sy = player.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(player.rotation);
    ctx.scale(player.stretch, player.squash);

    const r = player.radius;

    // Ball shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(3, r + 4, r * 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ball body
    const ballGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    ballGrad.addColorStop(0, '#ff8a8a');
    ballGrad.addColorStop(0.4, '#e63946');
    ballGrad.addColorStop(1, '#9d0208');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Ball outline
    ctx.strokeStyle = '#7d0208';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.35, r * 0.45, r * 0.3, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Face (unrotate for face)
    ctx.save();
    ctx.rotate(-player.rotation);

    // Eyes
    const eyeY = -3;
    const eyeSpacing = 7;
    const blinkH = Math.max(1, 6 * (1 - player.eyeBlink));

    // Left eye white
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right eye white
    ctx.beginPath();
    ctx.ellipse(eyeSpacing, eyeY, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    const lookDir = player.facingRight ? 1.5 : -1.5;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing + lookDir, eyeY + 1, 2.5, blinkH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeSpacing + lookDir, eyeY + 1, 2.5, blinkH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil highlights
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + lookDir + 1, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + lookDir + 1, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#7d0208';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 3, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
}

function drawFlag() {
    if (!flag) return;

    const sx = flag.x - camera.x;
    const sy = flag.y - camera.y;
    flag.wavePhase += 0.05;

    // Pole
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, sy + TILE);
    ctx.lineTo(sx, sy - 30);
    ctx.stroke();

    // Pole ball
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.arc(sx, sy - 32, 5, 0, Math.PI * 2);
    ctx.fill();

    // Flag cloth (waving)
    ctx.fillStyle = '#3fb950';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 28);
    for (let i = 0; i <= 30; i++) {
        const wave = Math.sin(flag.wavePhase + i * 0.2) * 3;
        ctx.lineTo(sx + i, sy - 28 + wave + i * 0.3);
    }
    ctx.lineTo(sx + 30, sy - 10);
    for (let i = 30; i >= 0; i--) {
        const wave = Math.sin(flag.wavePhase + i * 0.2) * 3;
        ctx.lineTo(sx + i, sy - 10 + wave + (30 - i) * 0.05);
    }
    ctx.closePath();
    ctx.fill();

    // Flag highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 28);
    for (let i = 0; i <= 15; i++) {
        const wave = Math.sin(flag.wavePhase + i * 0.2) * 3;
        ctx.lineTo(sx + i, sy - 28 + wave + i * 0.3);
    }
    ctx.lineTo(sx + 15, sy - 18);
    ctx.lineTo(sx, sy - 18);
    ctx.closePath();
    ctx.fill();
}

function drawParticles() {
    for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawDecorations() {
    // Decorative trees in background
    const treeColors = currentLevel === 0 ? ['#166534', '#15803d', '#22c55e'] :
                       currentLevel === 1 ? ['#0f2b0f', '#1a3a1a', '#2d5a27'] :
                                           ['#3a1010', '#4a1a1a', '#5a2020'];

    for (let i = 0; i < 8; i++) {
        const tx = i * 350 + 100 - camera.x * 0.4;
        const ty = canvas.height * 0.6;

        if (tx < -100 || tx > canvas.width + 100) continue;

        ctx.save();
        ctx.globalAlpha = 0.4;

        // Trunk
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(tx - 6, ty, 12, 50);

        // Foliage
        ctx.fillStyle = treeColors[0];
        ctx.beginPath();
        ctx.moveTo(tx - 35, ty + 5);
        ctx.lineTo(tx, ty - 55);
        ctx.lineTo(tx + 35, ty + 5);
        ctx.fill();

        ctx.fillStyle = treeColors[1];
        ctx.beginPath();
        ctx.moveTo(tx - 28, ty - 15);
        ctx.lineTo(tx, ty - 70);
        ctx.lineTo(tx + 28, ty - 15);
        ctx.fill();

        ctx.fillStyle = treeColors[2];
        ctx.beginPath();
        ctx.moveTo(tx - 20, ty - 35);
        ctx.lineTo(tx, ty - 80);
        ctx.lineTo(tx + 20, ty - 35);
        ctx.fill();

        ctx.restore();
    }
}

// ===== MAIN GAME LOOP =====
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;
    animFrame++;

    if (gameState === 'playing') {
        updatePlayer(dt);
        updateEnemies();
        updateParticles();
        updateCamera();

        // Update clouds
        for (let cloud of clouds) {
            cloud.x += cloud.speed;
            if (cloud.x > camera.x + canvas.width + 200) {
                cloud.x = camera.x - 200;
            }
        }

        // Screen shake
        if (shakeTimer > 0) shakeTimer--;
    }

    // Render
    ctx.save();

    if (shakeTimer > 0 && gameState === 'playing') {
        ctx.translate(
            (Math.random() - 0.5) * shakeIntensity,
            (Math.random() - 0.5) * shakeIntensity
        );
    }

    if (gameState === 'playing' || gameState === 'paused' || gameState === 'complete' || gameState === 'gameover') {
        drawBackground();
        drawDecorations();
        drawPlatforms();
        drawSpikes();
        drawStars();
        drawFlag();
        drawEnemies();
        drawPlayer();
        drawParticles();
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// ===== SCREEN MANAGEMENT =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');

    if (id === 'game-screen') {
        document.getElementById(id).classList.remove('hidden');
    }
}

function startGame() {
    score = 0;
    lives = 3;
    currentLevel = 0;
    loadLevel(currentLevel);
    showScreen('game-screen');
    document.getElementById('game-screen').classList.remove('hidden');
    gameState = 'playing';
}

function restartGame() {
    loadLevel(currentLevel);
    showScreen('game-screen');
    document.getElementById('game-screen').classList.remove('hidden');
    gameState = 'playing';
}

function nextLevel() {
    currentLevel++;
    loadLevel(currentLevel);
    showScreen('game-screen');
    document.getElementById('game-screen').classList.remove('hidden');
    gameState = 'playing';
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showScreen('game-screen');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('pause-screen').classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pause-screen').classList.add('hidden');
    }
}

function quitToMenu() {
    gameState = 'menu';
    showScreen('start-screen');
}

function showHowTo() {
    document.getElementById('howto-screen').classList.remove('hidden');
}

function hideHowTo() {
    document.getElementById('howto-screen').classList.add('hidden');
}

// ESC key for pause
window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        if (gameState === 'playing' || gameState === 'paused') {
            togglePause();
        }
    }
});

// Prevent right-click menu on canvas
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ===== START =====
showScreen('start-screen');
requestAnimationFrame(gameLoop);
