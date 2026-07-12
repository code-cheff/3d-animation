import { randRange } from "./helpers.js";

const DEFAULT_PALETTE = [0xff4d6d, 0xffd23f, 0x4dc9ff, 0x8dff4d];
const GROUND = -3;

export default {
  id: "confettiPop",
  name: "Confetti Pop",
  keywords: [
    "birthday",
    "confetti",
    "win",
    "winner",
    "celebrate",
    "celebration",
    "yay",
    "congrats",
    "congratulations",
  ],
  imageAware: false,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, palette = DEFAULT_PALETTE, speed = 1 }) {
    const count = 400;
    const geometry = new THREE.PlaneGeometry(0.14, 0.22);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    const dummy = new THREE.Object3D();
    const state = [];
    const colorObjs = palette.map((hex) => new THREE.Color(hex));

    function reset(i) {
      const a = randRange(0, Math.PI * 2);
      const r = randRange(0, 0.4);
      state[i] = {
        x: Math.cos(a) * r,
        y: randRange(1.5, 2.5),
        z: Math.sin(a) * r,
        vx: randRange(-1.2, 1.2),
        vy: randRange(2, 4),
        vz: randRange(-1.2, 1.2),
        rx: randRange(0, Math.PI * 2),
        ry: randRange(0, Math.PI * 2),
        rz: randRange(0, Math.PI * 2),
        rvx: randRange(-4, 4),
        rvy: randRange(-4, 4),
        rvz: randRange(-4, 4),
      };
      mesh.setColorAt(i, colorObjs[i % colorObjs.length]);
    }

    for (let i = 0; i < count; i++) reset(i);
    scene.add(mesh);

    return {
      update(dt, elapsed) {
        for (let i = 0; i < count; i++) {
          const s = state[i];
          s.vy -= 2.2 * dt * speed;
          s.x += s.vx * dt * speed;
          s.y += s.vy * dt * speed;
          s.z += s.vz * dt * speed;
          s.rx += s.rvx * dt * speed;
          s.ry += s.rvy * dt * speed;
          s.rz += s.rvz * dt * speed;

          if (s.y < GROUND) {
            reset(i);
          }

          dummy.position.set(s.x, s.y, s.z);
          dummy.rotation.set(s.rx, s.ry, s.rz);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
  },
};
