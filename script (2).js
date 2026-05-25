// ═══════════════════════════════════════════════════════════
//  ESCAPE THE BLACK HOLE  —  Full Game Script
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Canvas Setup ──────────────────────────────────────────
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    blackHole.x = W / 2;
    blackHole.y = H / 2;
    if (!gameState.running) drawIdleBackground();
  });

  // ── DOM References ─────────────────────────────────────────
  const startScreen   = document.getElementById('start-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const hud           = document.getElementById('hud');
  const pauseOverlay  = document.getElementById('pause-overlay');
  const factBanner    = document.getElementById('fact-banner');
  const factText      = document.getElementById('fact-text');
  const scoreDisplay  = document.getElementById('score-display');
  const levelDisplay  = document.getElementById('level-display');
  const healthBar     = document.getElementById('health-bar');
  const startBtn      = document.getElementById('start-btn');
  const restartBtn    = document.getElementById('restart-btn');
  const finalScore    = document.getElementById('final-score');
  const finalLevel    = document.getElementById('final-level');
  const finalTime     = document.getElementById('final-time');
  const gameoverCause = document.getElementById('gameover-cause');
  const gameoverFact  = document.getElementById('gameover-fact');

  // ── Black Hole Facts ──────────────────────────────────────
  const FACTS = [
    "Nothing, not even light, can escape a black hole once past the event horizon.",
    "The nearest known black hole to Earth is about 1,011 light-years away.",
    "Time dilates near a black hole — clocks run slower the closer you get.",
    "If you fell into a black hole, you'd experience 'spaghettification' — stretched into strands.",
    "Black holes can spin up to 99.998% of the theoretical maximum speed.",
    "Supermassive black holes can contain billions of solar masses of material.",
    "Hawking radiation slowly causes black holes to evaporate over trillions of years.",
    "The first image of a black hole was captured by the Event Horizon Telescope in 2019.",
    "At the centre of the Milky Way sits Sagittarius A*, 4 million times our Sun's mass.",
    "A black hole the mass of Earth would be the size of a marble.",
    "Tidal forces near a stellar black hole would tear a human apart atom by atom.",
    "The gravitational redshift near a black hole shifts light toward longer wavelengths.",
    "Black holes grow by accreting gas, dust, and stars into their accretion disk.",
    "Inside a black hole lies a 'singularity' — a point of infinite density.",
    "Stephen Hawking showed black holes emit thermal radiation, now called Hawking radiation.",
    "Merging black holes produce gravitational waves detectable across the universe.",
    "A photon sphere exists around black holes where light orbits in circles.",
    "Black holes do not suck — they only attract, like any massive object.",
  ];

  let factIndex = 0;
  let factTimer = 0;
  const FACT_INTERVAL = 10000; // ms between facts

  // ── Game State ────────────────────────────────────────────
  const gameState = {
    running: false,
    paused: false,
    score: 0,
    level: 1,
    health: 100,
    maxHealth: 100,
    startTime: 0,
    deathCause: '',
  };

  // ── Input ─────────────────────────────────────────────────
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;

    if ((e.code === 'KeyP' || e.code === 'Escape') && gameState.running) {
      togglePause();
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ── Stars ─────────────────────────────────────────────────
  const STAR_COUNT = 200;
  const stars = [];

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawStars(t) {
    for (const s of stars) {
      const a = s.alpha + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${Math.max(0, Math.min(1, a))})`;
      ctx.fill();
    }
  }

  // ── Black Hole ────────────────────────────────────────────
  const blackHole = {
    x: 0, y: 0,
    radius: 55,
    glowRadius: 130,
    angle: 0,
    gravitationalConstant: 18000,
    dangerRadius: 80,
  };

  function drawBlackHole(t) {
    const bx = blackHole.x, by = blackHole.y;
    blackHole.angle += 0.008;

    // Outer glow rings
    for (let i = 5; i >= 1; i--) {
      const ringR = blackHole.glowRadius * (i / 5) * 1.6;
      const alpha = (i / 5) * 0.12;
      ctx.beginPath();
      ctx.arc(bx, by, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(120, 30, 220, ${alpha})`;
      ctx.lineWidth = 18;
      ctx.stroke();
    }

    // Accretion disk (rotating ellipse)
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(blackHole.angle);
    const diskGrad = ctx.createConicalGradient
      ? null // not standard; use fallback
      : null;

    // Accretion disk segments (colorful rotating arcs)
    for (let seg = 0; seg < 8; seg++) {
      const segAngle = (seg / 8) * Math.PI * 2;
      const hue = 200 + seg * 20;
      const bright = seg % 2 === 0 ? 0.9 : 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, blackHole.glowRadius * 0.75, segAngle, segAngle + Math.PI / 8);
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${bright * 0.6})`;
      ctx.lineWidth = 12;
      ctx.stroke();
    }

    // Inner glowing ring
    const innerGrad = ctx.createRadialGradient(0, 0, blackHole.radius * 0.8, 0, 0, blackHole.radius * 1.4);
    innerGrad.addColorStop(0, 'rgba(180, 80, 255, 0.0)');
    innerGrad.addColorStop(0.5, 'rgba(80, 20, 180, 0.8)');
    innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.beginPath();
    ctx.arc(0, 0, blackHole.radius * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    ctx.restore();

    // Event horizon — pure black circle
    const horizonGrad = ctx.createRadialGradient(bx, by, 0, bx, by, blackHole.radius);
    horizonGrad.addColorStop(0, 'rgba(0,0,0,1)');
    horizonGrad.addColorStop(0.85, 'rgba(0,0,0,1)');
    horizonGrad.addColorStop(1, 'rgba(20,0,50,0.0)');
    ctx.beginPath();
    ctx.arc(bx, by, blackHole.radius, 0, Math.PI * 2);
    ctx.fillStyle = horizonGrad;
    ctx.fill();

    // Photon sphere glow
    const photonAlpha = 0.3 + Math.sin(t * 0.003) * 0.1;
    ctx.beginPath();
    ctx.arc(bx, by, blackHole.radius * 1.18, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150, 100, 255, ${photonAlpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Lensing distortion rings
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(bx, by, blackHole.radius * (1 + i * 0.22), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(100, 50, 200, ${0.15 / i})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // ── Player Ship ───────────────────────────────────────────
  const ship = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    angle: 0,          // radians, points in direction of movement
    thrustPower: 420,
    maxSpeed: 400,
    drag: 0.985,
    radius: 14,
    invincible: false,
    invincibleTimer: 0,
    thrustParticles: [],
  };

  function resetShip() {
    ship.x = W * 0.2;
    ship.y = H * 0.35;
    ship.vx = 80;
    ship.vy = 50;
    ship.angle = 0;
    ship.invincible = true;
    ship.invincibleTimer = 2500;
    ship.thrustParticles = [];
  }

  function drawShip(dt) {
    const { x, y, angle, invincible, invincibleTimer } = ship;

    // Thrust particles
    if (isThrusting()) {
      for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * 0.4;
        const oppAngle = angle + Math.PI + spread;
        ship.thrustParticles.push({
          x: x + Math.cos(angle + Math.PI) * 12,
          y: y + Math.sin(angle + Math.PI) * 12,
          vx: Math.cos(oppAngle) * (Math.random() * 120 + 60),
          vy: Math.sin(oppAngle) * (Math.random() * 120 + 60),
          life: 1,
          maxLife: 1,
          r: Math.random() * 4 + 1,
          hue: 30 + Math.random() * 40,
        });
      }
    }

    // Update & draw thrust particles
    ship.thrustParticles = ship.thrustParticles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 3;
      if (p.life <= 0) return false;
      const a = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${a * 0.8})`;
      ctx.fill();
      return true;
    });

    // Invincibility flicker
    if (invincible && Math.floor(invincibleTimer / 80) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2); // ship nose up in local coords

    // Engine glow
    const engineGlow = ctx.createRadialGradient(0, 8, 0, 0, 8, 20);
    engineGlow.addColorStop(0, 'rgba(0, 200, 255, 0.6)');
    engineGlow.addColorStop(1, 'rgba(0, 100, 255, 0)');
    ctx.beginPath();
    ctx.arc(0, 8, 20, 0, Math.PI * 2);
    ctx.fillStyle = engineGlow;
    ctx.fill();

    // Ship body
    ctx.beginPath();
    ctx.moveTo(0, -18);          // nose
    ctx.lineTo(12, 12);          // right wing tip
    ctx.lineTo(6, 6);            // right inner
    ctx.lineTo(0, 10);           // tail center
    ctx.lineTo(-6, 6);           // left inner
    ctx.lineTo(-12, 12);         // left wing tip
    ctx.closePath();

    const shipGrad = ctx.createLinearGradient(0, -18, 0, 12);
    shipGrad.addColorStop(0, '#ffffff');
    shipGrad.addColorStop(0.5, '#7eeeff');
    shipGrad.addColorStop(1, '#0066cc');
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 220, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cockpit
    ctx.beginPath();
    ctx.ellipse(0, -6, 4, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 200, 255, 0.6)';
    ctx.fill();

    ctx.restore();

    // Shield ring when invincible
    if (invincible) {
      ctx.beginPath();
      ctx.arc(x, y, ship.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 220, 255, ${0.4 + Math.sin(Date.now() * 0.01) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function isThrusting() {
    return keys['KeyW'] || keys['ArrowUp'] ||
           keys['KeyS'] || keys['ArrowDown'] ||
           keys['KeyA'] || keys['ArrowLeft'] ||
           keys['KeyD'] || keys['ArrowRight'];
  }

  function updateShip(dt) {
    // Direction keys → apply thrust
    let ax = 0, ay = 0;

    if (keys['KeyW'] || keys['ArrowUp'])    ay -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  ay += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  ax -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) ax += 1;

    if (ax !== 0 || ay !== 0) {
      const len = Math.hypot(ax, ay);
      ax /= len; ay /= len;
      ship.vx += ax * ship.thrustPower * dt;
      ship.vy += ay * ship.thrustPower * dt;
      ship.angle = Math.atan2(ay, ax);
    }

    // Black hole gravity
    const dx = blackHole.x - ship.x;
    const dy = blackHole.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const gravForce = blackHole.gravitationalConstant / (dist * dist);
      const factor = Math.min(gravForce, 2500); // cap so it doesn't go infinite at center
      ship.vx += (dx / dist) * factor * dt;
      ship.vy += (dy / dist) * factor * dt;
    }

    // Speed cap
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > ship.maxSpeed) {
      ship.vx = (ship.vx / speed) * ship.maxSpeed;
      ship.vy = (ship.vy / speed) * ship.maxSpeed;
    }

    // Drag
    ship.vx *= Math.pow(ship.drag, dt * 60);
    ship.vy *= Math.pow(ship.drag, dt * 60);

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Wrap screen edges
    if (ship.x < -ship.radius) ship.x = W + ship.radius;
    if (ship.x > W + ship.radius) ship.x = -ship.radius;
    if (ship.y < -ship.radius) ship.y = H + ship.radius;
    if (ship.y > H + ship.radius) ship.y = -ship.radius;

    // Invincibility timer
    if (ship.invincible) {
      ship.invincibleTimer -= dt * 1000;
      if (ship.invincibleTimer <= 0) ship.invincible = false;
    }

    // Black hole collision
    if (dist < blackHole.radius + ship.radius * 0.6) {
      if (!ship.invincible) killPlayer('CONSUMED BY THE BLACK HOLE');
    }

    // Proximity damage (near event horizon)
    if (dist < blackHole.dangerRadius && !ship.invincible) {
      const dmg = ((blackHole.dangerRadius - dist) / blackHole.dangerRadius) * 60 * dt;
      damagePlayer(dmg);
    }
  }

  // ── Asteroids ─────────────────────────────────────────────
  let asteroids = [];
  let asteroidTimer = 0;

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 30;
    if (side === 0) { x = Math.random() * W; y = -margin; }
    else if (side === 1) { x = W + margin; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = H + margin; }
    else { x = -margin; y = Math.random() * H; }

    const speed = 60 + Math.random() * 100 + gameState.level * 10;
    const targetX = W / 2 + (Math.random() - 0.5) * W * 0.6;
    const targetY = H / 2 + (Math.random() - 0.5) * H * 0.6;
    const angle = Math.atan2(targetY - y, targetX - x);

    const r = 14 + Math.random() * 26;
    const points = [];
    const numPoints = Math.floor(Math.random() * 5) + 7;
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2;
      const rVariation = r * (0.7 + Math.random() * 0.6);
      points.push({ x: Math.cos(a) * rVariation, y: Math.sin(a) * rVariation });
    }

    asteroids.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: r,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 2.5,
      points,
      hue: Math.floor(Math.random() * 40 + 10),
      health: Math.ceil(r / 14),
    });
  }

  function updateAsteroids(dt) {
    const level = gameState.level;
    const spawnRate = Math.max(300, 2000 - level * 150); // ms

    asteroidTimer += dt * 1000;
    if (asteroidTimer >= spawnRate) {
      asteroidTimer = 0;
      const count = 1 + Math.floor(level / 3);
      for (let i = 0; i < count; i++) spawnAsteroid();
    }

    asteroids = asteroids.filter(a => {
      // Gravity on asteroid
      const dx = blackHole.x - a.x;
      const dy = blackHole.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const gravForce = Math.min(blackHole.gravitationalConstant * 0.3 / (dist * dist), 500);
        a.vx += (dx / dist) * gravForce * dt;
        a.vy += (dy / dist) * gravForce * dt;
      }

      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle += a.spinSpeed * dt;

      // Remove if sucked into black hole or way off screen
      if (dist < blackHole.radius) return false;
      if (a.x < -300 || a.x > W + 300 || a.y < -300 || a.y > H + 300) return false;

      // Ship collision
      const sdx = ship.x - a.x;
      const sdy = ship.y - a.y;
      const shipDist = Math.hypot(sdx, sdy);
      if (shipDist < a.radius + ship.radius && !ship.invincible) {
        a.health--;
        damagePlayer(25);
        spawnCollisionParticles(ship.x, ship.y);
        if (a.health <= 0) {
          gameState.score += Math.floor(a.radius * 2);
          return false;
        }
      }

      return true;
    });
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);

      // Glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, a.radius * 1.5);
      glow.addColorStop(0, `hsla(${a.hue}, 40%, 50%, 0.15)`);
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, a.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Rock body
      ctx.beginPath();
      ctx.moveTo(a.points[0].x, a.points[0].y);
      for (let i = 1; i < a.points.length; i++) {
        ctx.lineTo(a.points[i].x, a.points[i].y);
      }
      ctx.closePath();

      const rockGrad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, 0, 0, 0, a.radius);
      rockGrad.addColorStop(0, `hsl(${a.hue}, 20%, 55%)`);
      rockGrad.addColorStop(1, `hsl(${a.hue}, 10%, 20%)`);
      ctx.fillStyle = rockGrad;
      ctx.fill();
      ctx.strokeStyle = `hsla(${a.hue}, 20%, 70%, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  // ── Particles ─────────────────────────────────────────────
  let particles = [];

  function spawnCollisionParticles(x, y, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 80;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        r: Math.random() * 4 + 1,
        hue: Math.random() > 0.5 ? 200 : 30,
      });
    }
  }

  function updateDrawParticles(dt) {
    particles = particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt * 2;
      if (p.life <= 0) return false;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life})`;
      ctx.fill();
      return true;
    });
  }

  // ── Score / Level / Health ─────────────────────────────────
  function updateScore(dt) {
    // Passive score for surviving
    gameState.score += dt * 10 * gameState.level;
    // Level up every 500 points
    const newLevel = Math.floor(gameState.score / 500) + 1;
    if (newLevel > gameState.level) {
      gameState.level = newLevel;
      blackHole.gravitationalConstant = 18000 + (newLevel - 1) * 1500;
      showFactBanner();
    }

    scoreDisplay.textContent = Math.floor(gameState.score);
    levelDisplay.textContent = gameState.level;

    const pct = gameState.health / gameState.maxHealth;
    healthBar.style.width = (pct * 100) + '%';
    if (pct > 0.6) {
      healthBar.style.background = 'linear-gradient(90deg, #00ff88, #00e5ff)';
      healthBar.style.boxShadow = '0 0 8px #00ff8888';
    } else if (pct > 0.3) {
      healthBar.style.background = 'linear-gradient(90deg, #ffcc00, #ff8800)';
      healthBar.style.boxShadow = '0 0 8px #ffaa0088';
    } else {
      healthBar.style.background = 'linear-gradient(90deg, #ff2244, #ff6600)';
      healthBar.style.boxShadow = '0 0 8px #ff224488';
    }
  }

  function damagePlayer(amount) {
    if (ship.invincible) return;
    gameState.health = Math.max(0, gameState.health - amount);
    if (gameState.health <= 0) {
      killPlayer('HULL INTEGRITY FAILURE');
    }
  }

  function killPlayer(cause) {
    gameState.running = false;
    gameState.deathCause = cause;
    spawnCollisionParticles(ship.x, ship.y, 40);
    showGameOver();
  }

  // ── Facts ─────────────────────────────────────────────────
  function showFactBanner() {
    factIndex = (factIndex + 1) % FACTS.length;
    factText.textContent = FACTS[factIndex];
    factBanner.classList.remove('hidden');
    clearTimeout(factBanner._hideTimeout);
    factBanner._hideTimeout = setTimeout(() => factBanner.classList.add('hidden'), 6000);
  }

  function updateFacts(dt) {
    factTimer += dt * 1000;
    if (factTimer >= FACT_INTERVAL) {
      factTimer = 0;
      showFactBanner();
    }
  }

  // ── UI Toggles ────────────────────────────────────────────
  function togglePause() {
    gameState.paused = !gameState.paused;
    pauseOverlay.classList.toggle('hidden', !gameState.paused);
    if (!gameState.paused) requestAnimationFrame(loop);
  }

  function showGameOver() {
    hud.classList.add('hidden');
    factBanner.classList.add('hidden');
    pauseOverlay.classList.add('hidden');

    finalScore.textContent = Math.floor(gameState.score);
    finalLevel.textContent = gameState.level;
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    finalTime.textContent = elapsed + 's';
    gameoverCause.textContent = gameState.deathCause;
    gameoverFact.textContent = '🌌 ' + FACTS[Math.floor(Math.random() * FACTS.length)];

    gameoverScreen.classList.remove('hidden');
  }

  function startGame() {
    // Reset everything
    gameState.running = false;
    gameState.paused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.health = gameState.maxHealth;
    gameState.startTime = Date.now();

    blackHole.x = W / 2;
    blackHole.y = H / 2;
    blackHole.gravitationalConstant = 18000;

    initStars();
    asteroids = [];
    particles = [];
    asteroidTimer = 0;
    factTimer = 0;
    factIndex = Math.floor(Math.random() * FACTS.length);

    resetShip();

    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    hud.classList.remove('hidden');

    // Show first fact after 3s
    setTimeout(() => {
      if (gameState.running) {
        factText.textContent = FACTS[factIndex];
        factBanner.classList.remove('hidden');
        clearTimeout(factBanner._hideTimeout);
        factBanner._hideTimeout = setTimeout(() => factBanner.classList.add('hidden'), 6000);
      }
    }, 3000);

    gameState.running = true;
    lastTime = null;
    requestAnimationFrame(loop);
  }

  // ── Idle Background (shown on start / gameover screens) ───
  function drawIdleBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    drawStars(Date.now());
    drawBlackHole(Date.now());
  }

  // ── Main Loop ─────────────────────────────────────────────
  let lastTime = null;

  function loop(timestamp) {
    if (!gameState.running) return;
    if (gameState.paused) return;

    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#000007';
    ctx.fillRect(0, 0, W, H);

    // Draw
    drawStars(timestamp);
    drawBlackHole(timestamp);
    updateAsteroids(dt);
    drawAsteroids();
    updateShip(dt);
    drawShip(dt);
    updateDrawParticles(dt);
    updateScore(dt);
    updateFacts(dt);

    if (gameState.running) requestAnimationFrame(loop);
  }

  // ── Button Events ─────────────────────────────────────────
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  // ── Initial Idle State ────────────────────────────────────
  blackHole.x = W / 2;
  blackHole.y = H / 2;
  initStars();

  // Animate idle background while on start screen
  let idleRunning = true;
  function idleLoop() {
    if (!idleRunning) return;
    drawIdleBackground();
    requestAnimationFrame(idleLoop);
  }
  idleLoop();

  startBtn.addEventListener('click', () => { idleRunning = false; }, { once: true });

})();
