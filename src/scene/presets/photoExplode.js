import { randomOnSphere, randRange, easeInOutSine } from "./helpers.js";
import { sampleImageGrid } from "../imageTexture.js";

const DEFAULT_PALETTE = [0xffffff, 0xffffff, 0xffffff]; // colors come from the photo itself

export default {
  id: "photoExplode",
  name: "Photo Explode",
  keywords: ["photo", "picture", "pic", "explode", "explosion"],
  imageAware: true,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, image, speed = 1 }) {
    const gridSize = 48;
    const sampled = image ? sampleImageGrid(image, gridSize) : sampleFallback(gridSize);
    const { positions: origin, colors, count } = sampled;

    const exploded = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = randomOnSphere(randRange(2.5, 5));
      exploded[i * 3] = p.x;
      exploded[i * 3 + 1] = p.y;
      exploded[i * 3 + 2] = p.z;
    }

    const positions = new Float32Array(origin); // working buffer, mutated per-frame
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);

    return {
      update(dt, elapsed) {
        const cycle = 5.5 / speed; // seconds per full explode+reassemble loop
        const phase = (elapsed % cycle) / cycle;
        const tri = phase < 0.5 ? phase * 2 : (1 - phase) * 2; // 0 -> 1 -> 0
        const t = easeInOutSine(tri);

        const posAttr = geometry.attributes.position;
        const arr = posAttr.array;
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          arr[idx] = origin[idx] + (exploded[idx] - origin[idx]) * t;
          arr[idx + 1] = origin[idx + 1] + (exploded[idx + 1] - origin[idx + 1]) * t;
          arr[idx + 2] = origin[idx + 2] + (exploded[idx + 2] - origin[idx + 2]) * t;
        }
        posAttr.needsUpdate = true;
        points.rotation.y += dt * speed * 0.15;
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
  },
};

function sampleFallback(gridSize) {
  const count = gridSize * gridSize;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = Math.random();
    colors[i * 3 + 1] = Math.random();
    colors[i * 3 + 2] = Math.random();
  }
  return { positions, colors, count };
}
