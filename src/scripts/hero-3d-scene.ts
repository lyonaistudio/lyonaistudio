// Scène 3D premium pour le hero — véritable univers technologique (noyau IA
// sophistiqué + interfaces flottantes + flux de données + particules), dans
// la charte noir/rouge du site. Vraie scène Three.js avec profondeur réelle,
// mouvements organiques indépendants et parallaxe multi-plan.
//
// Composition : texte à gauche (HTML), scène concentrée à droite (desktop).
// Sur mobile, la MÊME scène (même noyau, mêmes interfaces, mêmes flux,
// mêmes particules) est simplement recomposée — pas une version appauvrie.
import * as THREE from "three";

const ACCENT = 0xff003d;
const ACCENT_SOFT = 0xff3860;
const INK = 0x0a0a0a;
const PAPER = 0xffffff;
const PAPER_DIM = 0x8a8a8a;

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function isMobile() {
  return window.innerWidth < 768;
}

function isLowPower() {
  const cores = (navigator as any).hardwareConcurrency ?? 8;
  return cores <= 4;
}

// ---------- Procedural textures (no external assets) ----------

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type PanelKind = "site" | "agent" | "automation" | "analytics" | "code" | "mobile";

function makePanelTexture(kind: PanelKind, blurPx = 0): THREE.CanvasTexture {
  const W = 512;
  const H = 320;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`;

  // card background
  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.fillStyle = "#12100f";
  ctx.fill();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(255,255,255,0.05)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.fillStyle = grad;
  ctx.fill();
  roundRectPath(ctx, 2, 2, W - 4, H - 4, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // header bar
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRectPath(ctx, 0, 0, W, 54, 28);
  ctx.fill();
  ctx.fillRect(0, 40, W, 14);

  const dotColors = ["#ff003d", "rgba(255,255,255,0.25)", "rgba(255,255,255,0.25)"];
  dotColors.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(30 + i * 26, 27, 7, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });

  ctx.font = "600 20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textBaseline = "middle";

  function textLines(n: number, startY: number, widths: number[]) {
    for (let i = 0; i < n; i++) {
      const y = startY + i * 34;
      roundRectPath(ctx, 32, y, widths[i % widths.length], 12, 6);
      ctx.fillStyle = i === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.28)";
      ctx.fill();
    }
  }

  if (kind === "site") {
    ctx.fillStyle = "rgba(255,0,61,0.85)";
    roundRectPath(ctx, 32, 84, 160, 120, 10);
    ctx.fill();
    textLines(3, 232, [200, 260, 150]);
  } else if (kind === "agent") {
    roundRectPath(ctx, 32, 84, 300, 50, 14);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    roundRectPath(ctx, 90, 148, 300, 50, 14);
    ctx.fillStyle = "rgba(255,0,61,0.75)";
    ctx.fill();
    textLines(2, 232, [220, 180]);
  } else if (kind === "automation") {
    const pts: [number, number][] = [
      [60, 100],
      [180, 70],
      [300, 120],
      [420, 80],
    ];
    ctx.strokeStyle = "rgba(255,0,61,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
    pts.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc(x, y, i === pts.length - 1 ? 12 : 9, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? "#ff003d" : "rgba(255,255,255,0.75)";
      ctx.fill();
    });
    textLines(2, 200, [220, 160]);
  } else if (kind === "analytics") {
    const bars = [40, 70, 55, 90, 65, 100];
    const bw = 34;
    bars.forEach((h, i) => {
      roundRectPath(ctx, 40 + i * (bw + 14), 200 - h, bw, h, 6);
      ctx.fillStyle = i === bars.length - 1 ? "rgba(255,0,61,0.85)" : "rgba(255,255,255,0.25)";
      ctx.fill();
    });
    textLines(1, 232, [180]);
  } else if (kind === "code") {
    ctx.font = "500 18px monospace";
    const lines = ["const agent = ", "  new Agent();", "agent.listen();"];
    lines.forEach((l, i) => {
      ctx.fillStyle = i === 0 ? "rgba(255,0,61,0.8)" : "rgba(255,255,255,0.4)";
      ctx.fillText(l, 32, 100 + i * 30);
    });
    textLines(1, 232, [200]);
  } else {
    roundRectPath(ctx, 190, 80, 130, 190, 20);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();
    roundRectPath(ctx, 206, 96, 98, 158, 8);
    ctx.fillStyle = "rgba(255,0,61,0.55)";
    ctx.fill();
  }

  ctx.filter = "none";
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeSoftDotTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// ---------- Data-flow shader material (pulses + slow breathing envelope) ----------

const flowVertexShader = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flowFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uEnvelope;
  varying float vT;
  void main() {
    float band = fract(vT * 1.0 - uTime * uSpeed);
    float pulse = smoothstep(0.0, 0.08, band) * (1.0 - smoothstep(0.08, 0.22, band));
    float base = 0.035;
    float alpha = (base + pulse * 0.9) * uEnvelope;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function makeFlowLine(curve: THREE.CatmullRomCurve3, color: number, speed: number) {
  const points = curve.getPoints(48);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const aT = new Float32Array(points.length);
  for (let i = 0; i < points.length; i++) aT[i] = i / (points.length - 1);
  geometry.setAttribute("aT", new THREE.BufferAttribute(aT, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: Math.random() * 10 },
      uColor: { value: new THREE.Color(color) },
      uSpeed: { value: speed },
      uEnvelope: { value: 1 },
    },
    vertexShader: flowVertexShader,
    fragmentShader: flowFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Line(geometry, material);
}

// ---------- Particle field ----------

function makeParticleLayer(count: number, spread: number, size: number, opacity: number, sprite: THREE.Texture) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    phases[i * 3] = Math.random() * Math.PI * 2;
    phases[i * 3 + 1] = 0.15 + Math.random() * 0.35;
    phases[i * 3 + 2] = Math.random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));

  const material = new THREE.PointsMaterial({
    size,
    map: sprite,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: PAPER_DIM,
  });

  const points = new THREE.Points(geometry, material);
  return { points, basePositions: positions.slice(), phases };
}

// ---------- Main mount ----------

export function mountHero3DScene(canvas: HTMLCanvasElement) {
  const mobile = isMobile();
  const lowPower = isLowPower();
  const tier: "mobile" | "low" | "full" = mobile ? "mobile" : lowPower ? "low" : "full";

  // Elegant fade-in — no white flash, no abrupt pop.
  canvas.style.opacity = "0";
  canvas.style.transition = "opacity 1.6s ease";
  requestAnimationFrame(() => requestAnimationFrame(() => (canvas.style.opacity = "1")));

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: tier === "full",
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === "full" ? 2 : 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(INK, 0.05);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0, 9.5);

  // Scene group — center of gravity kept firmly on the right on desktop so
  // it never sits behind the headline; same scene recomposed (not stripped)
  // on mobile via position/scale only.
  const group = new THREE.Group();
  scene.add(group);

  function layoutGroup() {
    const w = canvas.clientWidth;
    if (w < 768) {
      group.position.set(1.3, 0.4, 0);
      group.scale.setScalar(0.62);
    } else if (w < 1100) {
      group.position.set(2.7, 0.1, 0);
      group.scale.setScalar(0.8);
    } else {
      group.position.set(3.6, 0.1, 0);
      group.scale.setScalar(1);
    }
  }

  // ================= CORE =================
  // Layered abstract "AI core": hot inner point + translucent energy shell +
  // orbiting angular shards + tilted rings + traveling light impulses.
  // Deliberately NOT a single sphere-with-wireframe.
  const coreGroup = new THREE.Group();
  group.add(coreGroup);

  const outerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeSoftDotTexture(),
      color: ACCENT,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  outerGlow.scale.setScalar(3.2);
  coreGroup.add(outerGlow);

  const innerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeSoftDotTexture(),
      color: PAPER,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  innerGlow.scale.setScalar(0.9);
  coreGroup.add(innerGlow);

  // hot point at the very center
  const coreHot = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.16, 3),
    new THREE.MeshBasicMaterial({ color: PAPER })
  );
  coreGroup.add(coreHot);

  // translucent energy shell around the hot point
  const coreShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.48, 1),
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.22, depthWrite: false })
  );
  coreGroup.add(coreShell);

  const coreShellEdge = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 1),
    new THREE.MeshBasicMaterial({ color: ACCENT_SOFT, wireframe: true, transparent: true, opacity: 0.4 })
  );
  coreGroup.add(coreShellEdge);

  // orbital rings — slightly elliptical, tilted on independent axes
  const rings: THREE.Mesh[] = [];
  const ringConfigs = [
    { r: 1.25, squash: 0.62, tilt: [0.5, 0.15, 0.1], speed: 0.05, opacity: 0.38 },
    { r: 1.6, squash: 0.8, tilt: [-0.25, 0.65, 0.3], speed: -0.038, opacity: 0.26 },
    { r: 2.0, squash: 0.7, tilt: [0.2, -0.5, 0.55], speed: 0.03, opacity: 0.18 },
  ];
  for (const cfg of ringConfigs) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(cfg.r, 0.005, 8, 96),
      new THREE.MeshBasicMaterial({ color: ACCENT_SOFT, transparent: true, opacity: cfg.opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.set(cfg.tilt[0], cfg.tilt[1], cfg.tilt[2]);
    ring.scale.set(1, cfg.squash, 1);
    ring.userData.speed = cfg.speed;
    ring.userData.radius = cfg.r;
    ring.userData.squash = cfg.squash;
    coreGroup.add(ring);
    rings.push(ring);
  }

  // small light impulses traveling along the rings
  const impulses: { mesh: THREE.Sprite; ring: THREE.Mesh; speed: number; offset: number }[] = [];
  const impulseCount = tier === "mobile" ? 2 : 3;
  for (let i = 0; i < impulseCount; i++) {
    const ring = rings[i % rings.length];
    const mesh = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: makeSoftDotTexture(), color: PAPER, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    mesh.scale.setScalar(0.14);
    coreGroup.add(mesh);
    impulses.push({ mesh, ring, speed: 0.25 + Math.random() * 0.2, offset: Math.random() * Math.PI * 2 });
  }

  // orbiting angular shards — "petites structures flottantes"
  const shards: { mesh: THREE.Mesh; radius: number; speed: number; offset: number; axis: THREE.Vector3; spin: number }[] = [];
  const shardCount = tier === "mobile" ? 4 : tier === "low" ? 6 : 9;
  for (let i = 0; i < shardCount; i++) {
    const size = 0.045 + Math.random() * 0.05;
    const geometry = i % 2 === 0 ? new THREE.TetrahedronGeometry(size) : new THREE.OctahedronGeometry(size);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? PAPER : ACCENT, transparent: true, opacity: 0.85 })
    );
    coreGroup.add(mesh);
    shards.push({
      mesh,
      radius: 0.75 + Math.random() * 0.9,
      speed: 0.12 + Math.random() * 0.18,
      offset: Math.random() * Math.PI * 2,
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      spin: (Math.random() - 0.5) * 0.8,
    });
  }

  // ================= FLOATING INTERFACE PANELS =================
  const panelKinds: PanelKind[] = ["site", "agent", "automation", "analytics", "code", "mobile"];
  const panelCount = tier === "mobile" ? 5 : tier === "low" ? 5 : 6;

  type PanelMotion = "float" | "depth" | "lateral" | "microrotate" | "still";
  const motionCycle: PanelMotion[] = ["float", "depth", "lateral", "microrotate", "still", "float"];

  const panels: {
    mesh: THREE.Mesh;
    basePos: THREE.Vector3;
    phase: number;
    speed: number;
    rotSpeed: number;
    motion: PanelMotion;
    parallax: number;
  }[] = [];

  const panelLayout = [
    { pos: [-1.6, 1.35, -0.6], rot: [0.1, 0.35, 0.05] },
    { pos: [2.5, 1.5, -1.3], rot: [-0.05, -0.4, -0.08] },
    { pos: [-2.1, -0.85, -1.0], rot: [0.15, 0.5, 0.1] },
    { pos: [2.7, -1.05, -1.9], rot: [-0.1, -0.3, 0.05] },
    { pos: [0.35, 2.15, -2.3], rot: [0.2, 0.1, -0.1] },
    { pos: [-0.5, -2.0, -2.6], rot: [-0.15, 0.25, 0.12] },
  ];

  for (let i = 0; i < panelCount; i++) {
    const kind = panelKinds[i % panelKinds.length];
    const layout = panelLayout[i % panelLayout.length];
    const depthFactor = 1 - Math.abs(layout.pos[2]) / 3.2;
    const isFar = layout.pos[2] < -1.8;
    const texture = makePanelTexture(kind, isFar ? 2.2 : 0);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.72),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.3 + depthFactor * 0.6,
        depthWrite: false,
      })
    );
    mesh.position.set(layout.pos[0], layout.pos[1], layout.pos[2]);
    mesh.rotation.set(layout.rot[0], layout.rot[1], layout.rot[2]);
    const scale = 0.85 + depthFactor * 0.35;
    mesh.scale.setScalar(scale);
    group.add(mesh);
    panels.push({
      mesh,
      basePos: mesh.position.clone(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.14 + Math.random() * 0.16,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      motion: motionCycle[i % motionCycle.length],
      parallax: 0.12 + depthFactor * 0.3,
    });
  }

  // ================= DATA-FLOW STREAMS =================
  const flows: { line: THREE.Line; envSpeed: number; envPhase: number }[] = [];
  const flowTargets = panels.slice(0, tier === "mobile" ? 3 : Math.min(4, panels.length));
  for (const p of flowTargets) {
    const mid = new THREE.Vector3(
      p.basePos.x / 2 + (Math.random() - 0.5) * 0.8,
      p.basePos.y / 2 + (Math.random() - 0.5) * 0.8,
      p.basePos.z / 2 + 0.4
    );
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), mid, p.basePos.clone()]);
    const line = makeFlowLine(curve, Math.random() > 0.5 ? ACCENT : ACCENT_SOFT, 0.3 + Math.random() * 0.25);
    group.add(line);
    flows.push({ line, envSpeed: 0.08 + Math.random() * 0.1, envPhase: Math.random() * Math.PI * 2 });
  }

  // ================= PARTICLES (far / mid / near) =================
  const sprite = makeSoftDotTexture();
  const particleTier = { mobile: 220, low: 220, full: 340 }[tier];
  const particleLayerConfigs = [
    { ratio: 0.45, spread: 9, size: 0.028, opacity: 0.32, parallax: 0.08 },
    { ratio: 0.35, spread: 6, size: 0.045, opacity: 0.48, parallax: 0.22 },
    { ratio: 0.2, spread: 3.2, size: 0.065, opacity: 0.62, parallax: 0.42 },
  ];
  const layers = particleLayerConfigs.map((cfg) => ({
    ...makeParticleLayer(Math.round(particleTier * cfg.ratio), cfg.spread, cfg.size, cfg.opacity, sprite),
    parallax: cfg.parallax,
  }));
  for (const layer of layers) group.add(layer.points);

  // ================= RESIZE =================
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layoutGroup();
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  // ================= MOUSE PARALLAX (dampened, multi-plane) =================
  const pointerTarget = new THREE.Vector2(0, 0);
  const pointerCurrent = new THREE.Vector2(0, 0);
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (supportsHover && !REDUCED_MOTION) {
    window.addEventListener("pointermove", (e) => {
      pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  // ================= RENDER LOOP =================
  const clock = new THREE.Clock();
  let running = true;
  let frameId = 0;

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !REDUCED_MOTION) frameId = requestAnimationFrame(tick);
  });

  function tick() {
    if (!running) return;
    frameId = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    pointerCurrent.lerp(pointerTarget, 0.025);

    // --- core: layered independent motion, never a clean uniform spin ---
    coreGroup.rotation.y = t * 0.06 + Math.sin(t * 0.021) * 0.3;
    coreGroup.rotation.x = Math.sin(t * 0.13) * 0.09;
    const breathe = 1 + Math.sin(t * 0.55) * 0.05 + Math.sin(t * 1.7) * 0.012;
    coreHot.scale.setScalar(breathe);
    innerGlow.material.opacity = 0.65 + Math.sin(t * 0.55) * 0.15;
    coreShell.rotation.y = -t * 0.04;
    coreShell.scale.setScalar(1 + Math.sin(t * 0.4 + 1.1) * 0.04);
    coreShellEdge.rotation.y = -t * 0.04;
    coreShellEdge.rotation.x = t * 0.025;
    outerGlow.material.opacity = 0.28 + Math.sin(t * 0.3) * 0.08;

    for (const ring of rings) {
      ring.rotation.z += (ring.userData.speed as number) * 0.01;
    }

    for (const imp of impulses) {
      const a = t * imp.speed + imp.offset;
      const r = imp.ring.userData.radius as number;
      const sq = imp.ring.userData.squash as number;
      const local = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * sq, 0);
      local.applyEuler(imp.ring.rotation);
      imp.mesh.position.copy(local);
    }

    for (const shard of shards) {
      const a = t * shard.speed + shard.offset;
      const pos = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.6, Math.sin(a * 0.7)).multiplyScalar(shard.radius);
      pos.applyAxisAngle(shard.axis, t * 0.08);
      shard.mesh.position.copy(pos);
      shard.mesh.rotation.x += shard.spin * 0.01;
      shard.mesh.rotation.y += shard.spin * 0.007;
    }

    // --- panels: each behaves differently, not a shared circular orbit ---
    for (const p of panels) {
      const px = pointerCurrent.x * p.parallax;
      const py = pointerCurrent.y * -p.parallax * 0.7;
      switch (p.motion) {
        case "float":
          p.mesh.position.y = p.basePos.y + Math.sin(t * p.speed + p.phase) * 0.14 + py;
          p.mesh.position.x = p.basePos.x + px;
          break;
        case "depth":
          p.mesh.position.z = p.basePos.z + Math.sin(t * p.speed * 0.8 + p.phase) * 0.22;
          p.mesh.position.x = p.basePos.x + px;
          p.mesh.position.y = p.basePos.y + py;
          break;
        case "lateral":
          p.mesh.position.x = p.basePos.x + Math.sin(t * p.speed + p.phase) * 0.16 + px;
          p.mesh.position.y = p.basePos.y + py;
          break;
        case "microrotate":
          p.mesh.position.x = p.basePos.x + px;
          p.mesh.position.y = p.basePos.y + py;
          p.mesh.rotation.z += p.rotSpeed * 0.015;
          break;
        case "still":
        default:
          p.mesh.position.x = p.basePos.x + px * 0.4;
          p.mesh.position.y = p.basePos.y + Math.sin(t * p.speed * 0.4 + p.phase) * 0.04 + py * 0.4;
          break;
      }
    }

    for (const flow of flows) {
      const mat = flow.line.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      const env = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * flow.envSpeed + flow.envPhase));
      mat.uniforms.uEnvelope.value = env;
    }

    for (const layer of layers) {
      const px = pointerCurrent.x * layer.parallax;
      const py = pointerCurrent.y * -layer.parallax * 0.7;
      const posAttr = layer.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        const bx = layer.basePositions[i * 3];
        const by = layer.basePositions[i * 3 + 1];
        const bz = layer.basePositions[i * 3 + 2];
        const phaseX = layer.phases[i * 3];
        const freq = layer.phases[i * 3 + 1];
        const phaseZ = layer.phases[i * 3 + 2];
        arr[i * 3] = bx + Math.sin(t * freq + phaseX) * 0.25 + px;
        arr[i * 3 + 1] = by + Math.cos(t * freq * 0.8 + phaseZ) * 0.2 + py;
        arr[i * 3 + 2] = bz + Math.sin(t * freq * 0.6 + phaseX) * 0.25;
      }
      posAttr.needsUpdate = true;
    }

    // --- cinematic camera: slow multi-frequency drift + dampened parallax ---
    const idleX = Math.sin(t * 0.07) * 0.22 + Math.sin(t * 0.017) * 0.1;
    const idleY = Math.cos(t * 0.09) * 0.1;
    const idleZ = Math.sin(t * 0.05) * 0.15;
    camera.position.x = idleX + pointerCurrent.x * 0.35;
    camera.position.y = idleY + pointerCurrent.y * -0.22;
    camera.position.z = 9.5 + idleZ;
    camera.rotation.z = pointerCurrent.x * -0.008;
    camera.lookAt(group.position.x * 0.35, group.position.y * 0.2, 0);

    renderer.render(scene, camera);
  }

  if (REDUCED_MOTION) {
    renderer.render(scene, camera);
  } else {
    tick();
  }

  return () => {
    running = false;
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    renderer.dispose();
  };
}
