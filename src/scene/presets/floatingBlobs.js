import { randRange } from "./helpers.js";

const DEFAULT_PALETTE = [0xa78bfa, 0x93c5fd, 0xfbcfe8];

export default {
  id: "floatingBlobs",
  name: "Floating Blobs",
  keywords: ["blob", "blobs", "morph", "goo", "liquid", "dream", "dreamy", "float", "floating"],
  imageAware: false,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, palette = DEFAULT_PALETTE, speed = 1 }) {
    const group = new THREE.Group();
    const blobCount = 4;
    const blobs = [];

    for (let i = 0; i < blobCount; i++) {
      const geometry = new THREE.SphereGeometry(0.9, 20, 20);
      const basePositions = geometry.attributes.position.array.slice();
      const material = new THREE.MeshStandardMaterial({
        color: palette[i % palette.length],
        roughness: 0.25,
        metalness: 0.05,
        transparent: true,
        opacity: 0.85,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = {
        orbitRadius: randRange(1, 2.2),
        orbitSpeed: randRange(0.15, 0.4),
        orbitPhase: randRange(0, Math.PI * 2),
        noiseSeed: randRange(0, 100),
      };
      group.add(mesh);
      blobs.push({ mesh, geometry, material, basePositions });
    }
    scene.add(group);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 4, 5);
    scene.add(light);
    const ambient = new THREE.AmbientLight(0x404060, 1.2);
    scene.add(ambient);

    return {
      update(dt, elapsed) {
        blobs.forEach(({ mesh, geometry, basePositions }) => {
          const { orbitRadius, orbitSpeed, orbitPhase, noiseSeed } = mesh.userData;
          const t = elapsed * speed * orbitSpeed + orbitPhase;
          mesh.position.set(Math.cos(t) * orbitRadius, Math.sin(t * 1.3) * 0.8, Math.sin(t) * orbitRadius);

          const posAttr = geometry.attributes.position;
          const arr = posAttr.array;
          for (let i = 0; i < arr.length; i += 3) {
            const bx = basePositions[i];
            const by = basePositions[i + 1];
            const bz = basePositions[i + 2];
            const wobble =
              1 +
              0.12 *
                Math.sin(bx * 3 + elapsed * speed * 1.5 + noiseSeed) *
                Math.cos(by * 3 + elapsed * speed * 1.2 + noiseSeed);
            arr[i] = bx * wobble;
            arr[i + 1] = by * wobble;
            arr[i + 2] = bz * wobble;
          }
          posAttr.needsUpdate = true;
        });
        group.rotation.y += dt * speed * 0.1;
      },
      dispose() {
        blobs.forEach(({ geometry, material }) => {
          geometry.dispose();
          material.dispose();
        });
      },
    };
  },
};
