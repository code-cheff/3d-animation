import { randRange } from "./helpers.js";

const DEFAULT_PALETTE = [0x8a7dff, 0x4d2fff, 0xffffff];

export default {
  id: "galaxySwirl",
  name: "Galaxy Swirl",
  keywords: ["galaxy", "space", "star", "stars", "universe", "cosmos", "nebula", "night sky", "planet"],
  imageAware: false,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, palette = DEFAULT_PALETTE, speed = 1 }) {
    const count = 3200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color(palette[0]);
    const c2 = new THREE.Color(palette[1]);
    const c3 = new THREE.Color(palette[2]);

    const arms = 3;
    for (let i = 0; i < count; i++) {
      const arm = i % arms;
      const t = Math.random();
      const angle = (arm / arms) * Math.PI * 2 + t * Math.PI * 4;
      const radius = t * 4.5 + randRange(-0.3, 0.3);
      const spread = randRange(-0.35, 0.35);
      const x = Math.cos(angle) * radius + spread;
      const y = randRange(-0.4, 0.4) * (1 - t * 0.5);
      const z = Math.sin(angle) * radius + spread;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixed = c1.clone().lerp(c2, t).lerp(c3, Math.random() * 0.2);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const ambient = new THREE.AmbientLight(0x333366, 1);
    scene.add(ambient);

    return {
      update(dt, elapsed, camera) {
        points.rotation.y += dt * speed * 0.12;
        camera.position.x = Math.sin(elapsed * speed * 0.08) * 6.5;
        camera.position.z = Math.cos(elapsed * speed * 0.08) * 6.5;
        camera.position.y = Math.sin(elapsed * speed * 0.05) * 1.2;
        camera.lookAt(0, 0, 0);
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
  },
};
