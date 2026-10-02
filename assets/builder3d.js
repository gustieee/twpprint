// Preview 3D untuk builder. Model dibangun langsung dari geometri (tanpa file .glb),
// desain dari state builder digambar ke canvas lalu ditempel sebagai tekstur.
(function () {
  if (!window.THREE) { document.getElementById('view-toggle').hidden = true; return; }

  const host = document.getElementById('stage3d');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(4.2, 1.6, 8);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enablePan: false, enableDamping: true, minDistance: 4, maxDistance: 14, minPolarAngle: 0.4, maxPolarAngle: 2.2 });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8ad9c, 0.62));
  const key = new THREE.DirectionalLight(0xffffff, 0.62); key.position.set(5, 4, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff4e6, 0.28); rim.position.set(-5, 1, 3); scene.add(rim);

  // Bayangan lembut di bawah produk
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const sg = sc.getContext('2d'), grad = sg.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(60,45,30,.35)'); grad.addColorStop(1, 'rgba(60,45,30,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

  /* ---------- Helper geometri ---------- */
  const P = (x, y) => [(x - 200) / 100, (200 - y) / 100];
  function shapeFrom(cmds) {
    const s = new THREE.Shape();
    cmds.forEach(([c, ...v]) => {
      if (c === 'M') s.moveTo(...P(v[0], v[1]));
      if (c === 'L') s.lineTo(...P(v[0], v[1]));
      if (c === 'Q') s.quadraticCurveTo(...P(v[0], v[1]), ...P(v[2], v[3]));
    });
    return s;
  }
  function roundRect(x, y, w, h, r) {
    const s = new THREE.Shape(), [x0, y0] = P(x, y + h), W = w / 100, H = h / 100, R = r / 100;
    s.moveTo(x0 + R, y0); s.lineTo(x0 + W - R, y0); s.quadraticCurveTo(x0 + W, y0, x0 + W, y0 + R);
    s.lineTo(x0 + W, y0 + H - R); s.quadraticCurveTo(x0 + W, y0 + H, x0 + W - R, y0 + H);
    s.lineTo(x0 + R, y0 + H); s.quadraticCurveTo(x0, y0 + H, x0, y0 + H - R);
    s.lineTo(x0, y0 + R); s.quadraticCurveTo(x0, y0, x0 + R, y0);
    return s;
  }
  function extrude(shape, depth, bevel) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 6, curveSegments: 24 });
    g.translate(0, 0, -depth / 2);
    return g;
  }
  const fabric = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92 });
  const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

  /* ---------- Tekstur desain per sisi ---------- */
  const textures = {}, logoCache = {};
  function sideCanvas(side) {
    if (!textures[side]) {
      const c = document.createElement('canvas');
      const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
      textures[side] = { c, t };
    }
    return textures[side];
  }
  function drawSide(side) {
    const p = PRODUCTS[state.product], a = p.area, s = state.sides[side];
    const { c, t } = sideCanvas(side);
    const W = 1024, H = Math.round(1024 * a.h / a.w);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    if (s && s.logo) {
      let img = logoCache[s.logo];
      if (!img) { img = logoCache[s.logo] = new Image(); img.onload = schedule; img.src = s.logo; }
      if (img.complete && img.naturalWidth) {
        const w = s.logoSize / 100 * W, h = w * img.naturalHeight / img.naturalWidth;
        g.drawImage(img, s.lx / 100 * W - w / 2, s.ly / 100 * H - h / 2, w, h);
      }
    }
    if (s && s.text.trim()) {
      const px = s.size * W / a.w, font = `700 ${px}px "${s.font}"`;
      if (!document.fonts.check(font)) document.fonts.load(font).then(schedule);
      g.font = font; g.fillStyle = s.textColor; g.textAlign = 'center'; g.textBaseline = 'middle';
      const lines = [];
      s.text.split('\n').forEach(par => {
        let line = '';
        par.split(' ').forEach(word => {
          const test = line ? line + ' ' + word : word;
          if (g.measureText(test).width > W && line) { lines.push(line); line = word; } else line = test;
        });
        lines.push(line);
      });
      const lh = px * 1.05, x = s.tx / 100 * W, y0 = s.ty / 100 * H - (lines.length - 1) * lh / 2;
      lines.forEach((l, i) => g.fillText(l, x, y0 + i * lh));
    }
    t.needsUpdate = true;
    return t;
  }
  const decalMat = (side) => new THREE.MeshStandardMaterial({
    map: drawSide(side), transparent: true, roughness: 0.85, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4, side: THREE.FrontSide
  });

  // Bidang desain datar mengikuti area cetak (koordinat SVG)
  function flatDecal(side, z) {
    const a = PRODUCTS[state.product].area;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(a.w / 100, a.h / 100), decalMat(side));
    const [cx, cy] = P(a.x + a.w / 2, a.y + a.h / 2);
    if (side === 'Belakang') { m.rotation.y = Math.PI; m.position.set(-cx, cy, -z); }
    else m.position.set(cx, cy, z);
    return m;
  }

  /* ---------- Model per produk ---------- */
  const BUILD = {
    tee(c, g) {
      g.add(new THREE.Mesh(extrude(shapeFrom([['M', 120, 62], ['L', 162, 44], ['Q', 200, 72, 238, 44], ['L', 280, 62], ['L', 346, 112], ['L', 310, 165], ['L', 282, 146], ['L', 282, 352], ['L', 118, 352], ['L', 118, 146], ['L', 90, 165], ['L', 54, 112]]), 0.34, 0.14), fabric(c)));
      g.add(new THREE.Mesh(extrude(shapeFrom([['M', 162, 44], ['Q', 200, 72, 238, 44], ['L', 230, 39], ['Q', 200, 60, 170, 39]]), 0.42, 0.15), fabric(shade(c, 0.82))));
      return 0.31;
    },
    hoodie(c, g) {
      g.add(new THREE.Mesh(extrude(shapeFrom([['M', 115, 82], ['L', 155, 62], ['L', 245, 62], ['L', 285, 82], ['L', 344, 142], ['L', 322, 304], ['L', 292, 300], ['L', 286, 178], ['L', 286, 356], ['L', 114, 356], ['L', 114, 178], ['L', 108, 300], ['L', 78, 304], ['L', 56, 142]]), 0.4, 0.16), fabric(c)));
      const hood = new THREE.Mesh(extrude(shapeFrom([['M', 146, 66], ['Q', 200, 2, 254, 66], ['Q', 200, 108, 146, 66]]), 0.5, 0.16), fabric(shade(c, 0.78)));
      hood.position.z = -0.05; g.add(hood);
      const pocket = new THREE.Mesh(extrude(shapeFrom([['M', 150, 262], ['L', 250, 262], ['L', 264, 326], ['L', 136, 326]]), 0.02, 0.03), fabric(shade(c, 0.9)));
      pocket.position.z = 0.37; g.add(pocket);
      [[186, 92, 182, 140], [214, 92, 218, 140]].forEach(([x1, y1, x2, y2]) => {
        const [ax, ay] = P(x1, y1), [bx, by] = P(x2, y2);
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, Math.hypot(bx - ax, by - ay), 8), new THREE.MeshStandardMaterial({ color: 0xdedbd5, roughness: 0.8 }));
        s.position.set((ax + bx) / 2, (ay + by) / 2, 0.4); s.rotation.z = Math.atan2(bx - ax, ay - by); g.add(s);
      });
      return 0.37;
    },
    tote(c, g) {
      g.add(new THREE.Mesh(extrude(roundRect(96, 140, 208, 222, 8), 0.1, 0.04), fabric(c)));
      [0.08, -0.08].forEach(z => {
        const h = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 12, 48, Math.PI), fabric(shade(c, 0.85)));
        h.scale.y = 1.75; h.position.set(0, 0.55, z); g.add(h);
      });
      return 0.095;
    },
    cap(c, g) {
      const base = -0.52, sy = 1.2;
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.12, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), fabric(c));
      crown.scale.y = sy; crown.position.y = base; g.add(crown);
      const bs = new THREE.Shape(); bs.absellipse(0, 0, 1.02, 2.0, 0, Math.PI, false); bs.lineTo(1.02, 0);
      const brim = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, curveSegments: 48 }), fabric(shade(c, 0.8)));
      brim.rotation.x = Math.PI / 2 + 0.22; brim.position.y = base + 0.06; g.add(brim);
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), fabric(shade(c, 0.9)));
      btn.position.y = base + 1.12 * sy; g.add(btn);
      for (let i = 0; i < 6; i++) {
        const seam = new THREE.Mesh(new THREE.TorusGeometry(1.123, 0.006, 4, 64, Math.PI / 2), fabric(shade(c, 0.7)));
        seam.rotation.y = i * Math.PI / 3; seam.scale.y = sy; seam.position.y = base;
        g.add(seam);
      }
      const d = new THREE.Mesh(new THREE.SphereGeometry(1.128, 48, 24, Math.PI / 2 - 0.575, 1.15, 0.82, 0.53), decalMat('Depan'));
      d.scale.y = sy; d.position.y = base; g.add(d);
      return null;
    },
    keychain(c, g) {
      const s = roundRect(118, 112, 164, 226, 44), hole = new THREE.Path(), [hx, hy] = P(200, 138);
      hole.absarc(hx, hy, 0.1, 0, Math.PI * 2, true); s.holes.push(hole);
      g.add(new THREE.Mesh(extrude(s, 0.06, 0.03), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 })));
      const metal = new THREE.MeshStandardMaterial({ color: 0xc9c9c9, metalness: 0.55, roughness: 0.3 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 12, 48), metal);
      ring.position.set(0, 1.34, 0); ring.rotation.y = 0.5; g.add(ring);
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 10, 24), metal);
      link.position.set(0, 0.88, 0); link.rotation.y = Math.PI / 2; g.add(link);
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8), metal);
      chain.position.y = 1.0; g.add(chain);
      return 0.072;
    },
    mug(c, g) {
      const r = 0.82, h = 2.1, cy = -0.17;
      const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.28 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.98, h, 72, 1, true), mat);
      body.position.y = cy; g.add(body);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.05, r - 0.05, h - 0.02, 72, 1, true), new THREE.MeshStandardMaterial({ color: shade(c, 0.8), roughness: 0.3, side: THREE.BackSide }));
      inner.position.y = cy + 0.01; g.add(inner);
      const bottom = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, 72), mat);
      bottom.rotation.x = Math.PI / 2; bottom.position.y = cy - h / 2; g.add(bottom);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(r - 0.05, 72), new THREE.MeshStandardMaterial({ color: shade(c, 0.7) }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = cy - h / 2 + 0.15; g.add(floor);
      const rimM = new THREE.Mesh(new THREE.TorusGeometry(r - 0.025, 0.026, 10, 72), mat);
      rimM.rotation.x = Math.PI / 2; rimM.position.y = cy + h / 2; g.add(rimM);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.11, 20, 48, Math.PI), mat);
      handle.rotation.z = -Math.PI / 2; handle.position.set(r - 0.05, cy + 0.05, 0); g.add(handle);
      const a = PRODUCTS.mug.area;
      const d = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.004, r * 0.98 + 0.004, a.h / 100, 64, 1, true, -0.8, 1.6), decalMat('Depan'));
      d.position.y = P(0, a.y + a.h / 2)[1]; g.add(d);
      return null;
    }
  };

  /* ---------- Bangun ulang & render ---------- */
  let model = null, builtKey = '', targetRot = 0, idle = true, t0 = performance.now(), active = false;

  function rebuild() {
    if (model) {
      scene.remove(model);
      model.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !Object.values(textures).some(x => x.t === o.material.map)) o.material.dispose(); });
    }
    model = new THREE.Group();
    const p = PRODUCTS[state.product];
    const z = BUILD[state.product](state.color, model);
    if (z !== null) p.sides.forEach(side => model.add(flatDecal(side, z)));
    scene.add(model);

    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.y) * 0.62;
    controls.target.set(0, (box.min.y + box.max.y) / 2, 0);
    camera.position.set(camera.position.x, controls.target.y + 0.5, camera.position.z).sub(controls.target).setLength(r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.2).add(controls.target);
    shadow.position.y = box.min.y - 0.02; shadow.scale.set(size.x * 1.2, Math.max(size.z, 0.6) * 2.2, 1);
    builtKey = state.product + state.color;
  }

  function update() {
    if (state.product + state.color !== builtKey) rebuild();
    else PRODUCTS[state.product].sides.forEach(drawSide);
    targetRot = state.side === 'Belakang' ? Math.PI : 0;
  }

  let pending = false;
  function schedule() {
    if (pending) return; pending = true;
    requestAnimationFrame(() => { pending = false; update(); });
  }
  document.addEventListener('design:change', schedule);
  controls.addEventListener('start', () => { idle = false; });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);

  function loop(now) {
    if (!active) return;
    if (model) {
      const sway = idle ? Math.sin((now - t0) / 1600) * 0.3 : 0;
      model.rotation.y += (targetRot + sway - model.rotation.y) * 0.08;
    }
    controls.update(); renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  /* ---------- Toggle 2D / 3D ---------- */
  const stage = document.getElementById('stage');
  function setView(v) {
    const is3d = v === '3d';
    stage.classList.toggle('is-3d', is3d);
    host.hidden = !is3d;
    document.querySelectorAll('#view-toggle button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    document.getElementById('hint').textContent = is3d
      ? 'Drag untuk memutar, scroll/pinch untuk zoom. Pindah ke mode 2D untuk menggeser posisi desain.'
      : 'Geser tulisan atau logo langsung di gambar untuk mengatur posisinya.';
    if (is3d && !active) { active = true; resize(); update(); requestAnimationFrame(loop); }
    if (!is3d) active = false;
  }
  document.getElementById('view-toggle').addEventListener('click', e => {
    const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view);
  });
  setView('3d');
})();
