// Fond animé "ribbon mesh" pour le hero de l'accueil : des rubans ondulants réactifs
// au curseur, avec une petite salve de particules au clic. Palette limitée à la
// marque (graphite + cuivre) — pas de bleu/violet générique.

const INK = "#121110";

// rgb() triplets so we can vary alpha per-draw without re-parsing hex each frame.
const ACCENT_RGB = "226, 103, 44";
const ACCENT_SOFT_RGB = "240, 160, 111";
const INK_LINE_RGB = "43, 39, 33";

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.maxLife = 70 + Math.random() * 50;
    this.life = this.maxLife;
    this.size = 1 + Math.random() * 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.globalAlpha = (this.life / this.maxLife) * 0.85;
    ctx.fillStyle = `rgb(${ACCENT_RGB})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function mountRibbonMesh(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let animationFrameId = 0;
  let running = false;

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const particles: Particle[] = [];
  const ripple = { x: 0, y: 0, radius: 0, maxRadius: 380, speed: 13 };

  const handleResize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const toLocal = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerMove = (e: MouseEvent) => {
    const p = toLocal(e.clientX, e.clientY);
    mouse.targetX = p.x - width / 2;
    mouse.targetY = p.y - height / 2;
  };

  const handlePointerLeave = () => {
    mouse.targetX = 0;
    mouse.targetY = 0;
  };

  const handlePointerDown = (e: MouseEvent) => {
    const p = toLocal(e.clientX, e.clientY);
    ripple.x = p.x;
    ripple.y = p.y;
    ripple.radius = 0;
    for (let i = 0; i < 24; i++) particles.push(new Particle(p.x, p.y));
  };

  const noise = (x: number, t: number, o: number) =>
    (Math.sin(x * 0.0012 + t * 0.25 + o) + Math.cos(x * 0.0028 - t * 0.4 + o * 2)) / 2;

  let lastTime = performance.now();
  let time = 0;

  const layers = [
    { ribbonCount: 14, step: 5, offsetMod: 0, freqScale: 0.0035, ampScale: 50, speedScale: 1.05, primary: true },
    { ribbonCount: 9, step: 7, offsetMod: 1.2, freqScale: 0.0075, ampScale: 28, speedScale: 0.68, primary: false },
  ];

  const render = (now: number) => {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    time += dt * 0.85;

    const lerp = 1 - Math.exp(-9 * dt);
    mouse.x += (mouse.targetX - mouse.x) * lerp;
    mouse.y += (mouse.targetY - mouse.y) * lerp;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (ripple.radius < ripple.maxRadius) ripple.radius += ripple.speed;

    layers.forEach((layer) => {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(${INK_LINE_RGB}, 0)`);
      gradient.addColorStop(0.5, `rgba(${layer.primary ? ACCENT_RGB : ACCENT_SOFT_RGB}, ${layer.primary ? 0.55 : 0.28})`);
      gradient.addColorStop(1, `rgba(${INK_LINE_RGB}, 0)`);

      for (let r = 0; r < layer.ribbonCount; r++) {
        const progress = r / layer.ribbonCount;
        const yOffset = height * 0.2 + r * (height * 0.036) + layer.offsetMod * 30;
        const baseAlpha = (1 - progress * 0.75) * 0.6;

        const rippleDistort =
          ripple.radius < ripple.maxRadius
            ? Math.sin((time * 2 + progress * Math.PI) * 2) * ((ripple.maxRadius / Math.max(ripple.radius, 1)) * 2.2)
            : 0;

        ctx.beginPath();
        for (let x = 0; x <= width + layer.step; x += layer.step) {
          const edge = Math.sin((x / width) * Math.PI);
          const nFreq = 1 + noise(x, time, progress) * 0.18;
          const nAmp = 1 + noise(x * 2, -time, progress * 0.5) * 0.15;

          const wave1 = Math.sin(x * (layer.freqScale * nFreq) + time * layer.speedScale + r * 0.18) * (layer.ampScale * edge * nAmp);
          const wave2 = Math.cos(x * 0.008 - time * 0.7 + r * 0.1) * (18 * edge);
          const wave3 = Math.sin(x * 0.018 + time * 1.4) * (7 * edge);

          const cursorXWorld = width / 2 + mouse.x;
          const distToMouseX = Math.abs(x - cursorXWorld);
          const mouseRadius = layer.primary ? 360 : 210;
          const mouseFactor = Math.exp(-((distToMouseX / mouseRadius) ** 2));
          const mouseDisplacement = Math.sin(x * 0.015 + time * 2.6) * (mouseFactor * (layer.primary ? 46 : 22) * edge);

          const rippleFactor = Math.exp(-((Math.abs(distToMouseX - ripple.radius) / (25 + rippleDistort)) ** 2));
          const rippleDisplacement = rippleFactor * rippleDistort * (1.7 - progress);

          const y = yOffset + wave1 + wave2 + wave3 + mouseDisplacement + rippleDisplacement + mouse.y * (progress * 0.08);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.globalAlpha = baseAlpha;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = (layer.primary ? 1.3 : 0.75) + (1 - progress) * 0.5;
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;
    animationFrameId = requestAnimationFrame(render);
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(render);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(animationFrameId);
  };

  handleResize();
  window.addEventListener("resize", handleResize);
  canvas.addEventListener("mousemove", handlePointerMove);
  canvas.addEventListener("mouseleave", handlePointerLeave);
  canvas.addEventListener("mousedown", handlePointerDown);

  if (reduceMotion) {
    // Draw a single calm frame and skip the animation loop entirely.
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Only animate while the hero is actually on screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);
  }
}
