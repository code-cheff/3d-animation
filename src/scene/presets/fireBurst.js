import { randRange } from "./helpers.js";

const DEFAULT_PALETTE = [0xff3d1a, 0xff9d1a, 0xffe14d];
const BOTTOM = -2.2;
const TOP = 3.2;

export default {
  id: "fireBurst",
  name: "Fire Burst",
  keywords: ["fire", "flame", "flames", "hot", "burn", "burning", "explode", "explosion", "boom", "blast"],
  imageAware: false,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, palette = DEFAULT_PALETTE, speed = 1 }) {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    function reset(i, staggered) {
      const r = randRange(0, 0.8);
      const a = randRange(0, Math.PI * 2);
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = staggered ? randRange(BOTTOM, TOP) : BOTTOM + randRange(0, 0.4);
      positions[i * 3 + 2] = Math.sin(a) * r;
      velocities[i * 3] = randRange(-0.3, 0.3);
      velocities[i * 3 + 1] = randRange(1.4, 2.6);
      velocities[i * 3 + 2] = randRange(-0.3, 0.3);
    }

    for (let i = 0; i < count; i++) reset(i, true);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const light = new THREE.PointLight(palette[1], 2, 10);
    light.position.set(0, 0, 2);
    scene.add(light);

    const c1 = new THREE.Color(palette[0]);
    const c2 = new THREE.Color(palette[1]);
    const c3 = new THREE.Color(palette[2]);

    return {
      update(dt, elapsed) {
        const posAttr = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          positions[idx] += velocities[idx] * dt * speed;
          positions[idx + 1] += velocities[idx + 1] * dt * speed;
          positions[idx + 2] += velocities[idx + 2] * dt * speed;

          if (positions[idx + 1] > TOP) {
            reset(i, false);
          }

          const t = Math.min(Math.max((positions[idx + 1] - BOTTOM) / (TOP - BOTTOM), 0), 1);
          const mixed = c1.clone().lerp(c2, Math.min(t * 1.6, 1)).lerp(c3, Math.max(t * 2 - 1, 0));
          colors[idx] = mixed.r;
          colors[idx + 1] = mixed.g;
          colors[idx + 2] = mixed.b;
        }
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        light.intensity = 1.6 + Math.sin(elapsed * 12) * 0.4 + Math.random() * 0.2;
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
  },
};
