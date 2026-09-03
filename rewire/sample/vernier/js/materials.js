/* VERNIER — materials. Brushed and striped finishes come from canvas-drawn
   roughness maps, so there is nothing to download. */
(function () {
  'use strict';
  const V = window.Vernier = window.Vernier || {};

  function grey(v) { const k = Math.round(v * 255); return 'rgb(' + k + ',' + k + ',' + k + ')'; }

  /* Fine parallel streaks: a brushed finish is just anisotropic roughness. */
  function brushedMap(size, base, spread) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = grey(base); g.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 2; i++) {
      const y = Math.random() * size;
      g.strokeStyle = grey(Math.min(1, Math.max(0, base + (Math.random() - 0.5) * spread)));
      g.globalAlpha = 0.35; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(size, y + (Math.random() - 0.5) * 2); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
    return t;
  }

  /* Côtes de Genève: visible bands, 9 stripes, light/dark alternating with a soft edge. */
  function genevaColor(size) {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    const bands = 9, w = size / bands;
    for (let i = 0; i < bands; i++) { const gr = g.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      gr.addColorStop(0, '#c9ccd2'); gr.addColorStop(0.5, '#e9ebef'); gr.addColorStop(1, '#c9ccd2'); g.fillStyle = gr; g.fillRect(i * w, 0, w + 1, size); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6); t.center.set(0.5, 0.5); t.rotation = Math.PI / 7; return t;
  }
  /* Perlage: overlapping circular graining. */
  function perlage(size) {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    g.fillStyle = '#d7dadf'; g.fillRect(0, 0, size, size); const r = size / 9;
    for (let y = 0; y < size + r; y += r * 0.78) for (let x = 0; x < size + r; x += r * 0.78) {
      const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, 'rgba(236,238,242,0.9)'); gr.addColorStop(1, 'rgba(180,184,190,0.0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
  }

  V.materials = {
    create: function (opts) {
      opts = opts || {};
      const transmission = opts.transmission !== false;
      const brushed = brushedMap(512, 0.42, 0.5);
      const gen = genevaColor(512), perl = perlage(512);
      const m = {
        plate:    new THREE.MeshStandardMaterial({ color: 0xffffff, map: perl, bumpMap: perl, bumpScale: 0.02, metalness: 1, roughness: 0.55 }),
        bridge:   new THREE.MeshStandardMaterial({ color: 0xffffff, map: gen, bumpMap: gen, bumpScale: 0.015, metalness: 1, roughness: 0.5 }),
        steel:    new THREE.MeshStandardMaterial({ color: 0xcfd2d6, metalness: 1, roughness: 0.38, roughnessMap: brushed }),
        polished: new THREE.MeshStandardMaterial({ color: 0xe8eaed, metalness: 1, roughness: 0.1 }),
        blued:    new THREE.MeshStandardMaterial({ color: 0x2b4c8c, metalness: 1, roughness: 0.16 }),
        brass:    new THREE.MeshStandardMaterial({ color: 0xc9a55a, metalness: 1, roughness: 0.3,  roughnessMap: brushed }),
        spring:   new THREE.MeshStandardMaterial({ color: 0x3a3f47, metalness: 1, roughness: 0.35 }),
        dark:     new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.6, roughness: 0.5 }),
        ruby:     new THREE.MeshPhysicalMaterial({ color: 0xb0122f, metalness: 0, roughness: 0.05,
                    clearcoat: 1, clearcoatRoughness: 0.05, ior: 1.76, thickness: 0.3,
                    transmission: transmission ? 0.35 : 0 }),
        sapphire: transmission
          ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02,
              transmission: 1, ior: 1.77, thickness: 0.6, transparent: true, side: THREE.DoubleSide })
          : new THREE.MeshPhysicalMaterial({ color: 0xf2f6fa, metalness: 0, roughness: 0.04,
              transparent: true, opacity: 0.2, clearcoat: 1, side: THREE.DoubleSide })
      };
      m.isTransmission = transmission;
      return m;
    }
  };
})();
