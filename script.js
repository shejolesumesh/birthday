(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallScreen = () => window.innerWidth <= 600;
  const lowPower = () => isSmallScreen() || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const rand = (min, max) => Math.random() * (max - min) + min;


  const bgCanvas = document.getElementById("bg-canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgW, bgH, bgDpr, stars = [];
  let bgRunning = true;

  function resizeBg() {
    bgDpr = Math.min(window.devicePixelRatio || 1, 2);
    bgW = window.innerWidth;
    bgH = window.innerHeight;
    bgCanvas.width = bgW * bgDpr;
    bgCanvas.height = bgH * bgDpr;
    bgCanvas.style.width = bgW + "px";
    bgCanvas.style.height = bgH + "px";
    bgCtx.setTransform(bgDpr, 0, 0, bgDpr, 0, 0);
  }

  function buildStars() {
    const count = lowPower() ? 40 : 85;
    stars = Array.from({ length: count }, () => ({
      x: rand(0, bgW),
      y: rand(0, bgH),
      r: rand(0.6, 2.1),
      tw: rand(0, Math.PI * 2),
      speed: rand(0.01, 0.025),
      alpha: rand(0.35, 0.95)
    }));
  }

  function drawStars() {
    bgCtx.clearRect(0, 0, bgW, bgH);
    stars.forEach((s) => {
      s.tw += s.speed;
      const flicker = 0.5 + Math.sin(s.tw) * 0.5;
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255,255,255,${(s.alpha * flicker).toFixed(3)})`;
      bgCtx.fill();
    });
    if (bgRunning) requestAnimationFrame(drawStars);
  }

  function drawStarsStatic() {
    bgCtx.clearRect(0, 0, bgW, bgH);
    stars.forEach((s) => {
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      bgCtx.fill();
    });
  }

  window.addEventListener("resize", () => { resizeBg(); buildStars(); if (reduceMotion) drawStarsStatic(); });
  resizeBg();
  buildStars();
  if (!reduceMotion) requestAnimationFrame(drawStars);
  else drawStarsStatic();

  const fxCanvas = document.getElementById("confetti-canvas");
  const fxCtx = fxCanvas.getContext("2d");
  let fxW, fxH, fxDpr, confetti = [];
  let fxLoopId = null;

  const CONFETTI_COLORS = ["#ffd166", "#ff6fb0", "#a78bfa", "#5ec8ff", "#fdfbff"];

  function resizeFx() {
    fxDpr = Math.min(window.devicePixelRatio || 1, 2);
    fxW = window.innerWidth;
    fxH = window.innerHeight;
    fxCanvas.width = fxW * fxDpr;
    fxCanvas.height = fxH * fxDpr;
    fxCanvas.style.width = fxW + "px";
    fxCanvas.style.height = fxH + "px";
    fxCtx.setTransform(fxDpr, 0, 0, fxDpr, 0, 0);
  }
  window.addEventListener("resize", resizeFx);
  resizeFx();

  function burstConfetti(count, originX, originY) {
    const max = lowPower() ? Math.round(count * 0.55) : count;
    const ox = originX ?? fxW / 2;
    const oy = originY ?? fxH * 0.28;
    for (let i = 0; i < max; i++) {
      const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15);
      const speed = rand(3, 9);
      confetti.push({
        x: ox + rand(-40, 40),
        y: oy,
        vx: Math.cos(angle) * speed * 0.6,
        vy: Math.sin(angle) * speed,
        size: rand(6, 11),
        rot: rand(0, 360),
        vr: rand(-8, 8),
        color: CONFETTI_COLORS[Math.floor(rand(0, CONFETTI_COLORS.length))],
        gravity: rand(0.12, 0.22),
        life: rand(70, 120)
      });
    }
    ensureFxLoop();
  }

  function fxStep() {
    fxCtx.clearRect(0, 0, fxW, fxH);
    confetti.forEach((p) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      fxCtx.save();
      fxCtx.globalAlpha = clampNum(p.life / 40, 0, 1);
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate((p.rot * Math.PI) / 180);
      fxCtx.fillStyle = p.color;
      fxCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      fxCtx.restore();
    });
    confetti = confetti.filter((p) => p.life > 0 && p.y < fxH + 60);
    if (confetti.length) fxLoopId = requestAnimationFrame(fxStep);
    else fxLoopId = null;
  }

  function ensureFxLoop() {
    if (!fxLoopId) fxLoopId = requestAnimationFrame(fxStep);
  }

  function clampNum(v, min, max) { return Math.max(min, Math.min(max, v)); }


  const balloonLayer = document.getElementById("balloon-layer");
  const BALLOON_EMOJI = ["🎈", "🎈", "🎈", "🎁", "✨", "⭐", "🎉"];
  let balloonTimer = null;

  function spawnBalloon() {
    const el = document.createElement("span");
    el.className = "balloon";
    el.textContent = BALLOON_EMOJI[Math.floor(rand(0, BALLOON_EMOJI.length))];
    const size = rand(1.6, 2.8);
    const left = rand(2, 92);
    const dur = rand(11, 17);
    const swayDur = rand(3, 5);
    el.style.left = left + "vw";
    el.style.setProperty("--size", size + "rem");
    el.style.setProperty("--dur", dur + "s");
    el.style.setProperty("--sway-dur", swayDur + "s");
    balloonLayer.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 200);
  }

  function startBalloons() {
    const initial = lowPower() ? 4 : 7;
    for (let i = 0; i < initial; i++) {
      setTimeout(() => spawnBalloon(), i * 550);
    }
    const interval = lowPower() ? 3600 : 2400;
    balloonTimer = setInterval(spawnBalloon, interval);
  }

  function stopBalloons() {
    clearInterval(balloonTimer);
  }

  if (!reduceMotion) startBalloons();
  else {
  
    for (let i = 0; i < 3; i++) spawnBalloon();
  }


  const cakeBtn = document.getElementById("cake-btn");
  cakeBtn.addEventListener("click", () => {
    const rect = cakeBtn.getBoundingClientRect();
    burstConfetti(reduceMotion ? 30 : 90, rect.left + rect.width / 2, rect.top + rect.height * 0.3);
  });


  window.addEventListener("load", () => {
    setTimeout(() => {
      burstConfetti(reduceMotion ? 40 : 130, window.innerWidth / 2, window.innerHeight * 0.22);
    }, reduceMotion ? 200 : 950);
  });


  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      bgRunning = false;
      stopBalloons();
    } else {
      if (!bgRunning) {
        bgRunning = true;
        if (!reduceMotion) requestAnimationFrame(drawStars);
      }
      if (!reduceMotion && !balloonTimer) startBalloons();
    }
  });
})();
