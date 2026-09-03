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

  /* Côtes de Genève: soft parallel bands, rotated like the real thing. */
  function genevaMap(size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const bands = 9, w = size / bands;
    for (let i = 0; i < bands; i++) {
      const gr = g.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      gr.addColorStop(0, grey(0.36)); gr.addColorStop(0.5, grey(0.62)); gr.addColorStop(1, grey(0.36));
      g.fillStyle = gr; g.fillRect(i * w, 0, w + 1, size);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6);
    t.center.set(0.5, 0.5); t.rotation = Math.PI / 7;
    return t;
  }

  V.materials = {
    create: function (opts) {
      opts = opts || {};
      const transmission = opts.transmission !== false;
      const brushed = brushedMap(512, 0.42, 0.5);
      const geneva  = genevaMap(512);
      const m = {
        plate:    new THREE.MeshStandardMaterial({ color: 0xd8d5ce, metalness: 1, roughness: 0.6,  roughnessMap: brushed }),
        bridge:   new THREE.MeshStandardMaterial({ color: 0xdedcd6, metalness: 1, roughness: 0.55, roughnessMap: geneva }),
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
