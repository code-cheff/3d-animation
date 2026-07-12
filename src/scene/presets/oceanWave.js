const DEFAULT_PALETTE = [0x0ea5e9, 0x22d3ee, 0xffffff];

export default {
  id: "oceanWave",
  name: "Ocean Wave",
  keywords: ["ocean", "wave", "waves", "water", "sea", "beach", "surf"],
  imageAware: false,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, palette = DEFAULT_PALETTE, speed = 1 }) {
    const segments = 48;
    // Plane lies in the local XY plane (z=0 for every vertex); we displace z for wave
    // height, then tilt the whole mesh so it reads as a horizon-view ocean.
    const geometry = new THREE.PlaneGeometry(8, 8, segments, segments);
    const basePositions = geometry.attributes.position.array.slice();
    const colors = new Float32Array(basePositions.length);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -1.15;
    mesh.position.y = -0.5;
    scene.add(mesh);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 5, 3);
    scene.add(light);
    const ambient = new THREE.AmbientLight(0x223344, 1);
    scene.add(ambient);

    const c1 = new THREE.Color(palette[0]);
    const c2 = new THREE.Color(palette[1]);
    const c3 = new THREE.Color(palette[2]);

    return {
      update(dt, elapsed, camera) {
        const posAttr = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;
        const arr = posAttr.array;
        for (let i = 0; i < arr.length; i += 3) {
          const bx = basePositions[i];
          const by = basePositions[i + 1];
          const h = Math.sin(bx * 0.6 + elapsed * speed * 1.4) * 0.35 + Math.cos(by * 0.5 + elapsed * speed * 1.1) * 0.25;
          arr[i + 2] = h;

          const t = Math.min(Math.max((h + 0.6) / 1.2, 0), 1);
          const mixed = c1.clone().lerp(c2, t).lerp(c3, Math.max(t - 0.7, 0) * 2);
          colors[i] = mixed.r;
          colors[i + 1] = mixed.g;
          colors[i + 2] = mixed.b;
        }
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;

        camera.position.x = Math.sin(elapsed * speed * 0.08) * 1.5;
        camera.position.y = 1.2;
        camera.position.z = 6;
        camera.lookAt(0, -0.5, 0);
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
  },
};
