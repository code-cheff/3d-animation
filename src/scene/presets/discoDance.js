import { randRange, randomOnSphere } from "./helpers.js";

const DEFAULT_PALETTE = [0xff2fd6, 0x2fe0ff, 0xffe14d];

export default {
  id: "discoDance",
  name: "Disco Dance",
  keywords: ["dance", "dancing", "party", "disco", "music", "groove", "celebrate", "celebration"],
  imageAware: false,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, palette = DEFAULT_PALETTE, speed = 1 }) {
    const geometry = new THREE.IcosahedronGeometry(1.6, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(palette[0]),
      emissiveIntensity: 1,
      flatShading: true,
      metalness: 0.3,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const lights = palette.map((hex) => {
      const light = new THREE.PointLight(new THREE.Color(hex), 2.5, 12);
      scene.add(light);
      return light;
    });

    const ambient = new THREE.AmbientLight(0x222222, 1);
    scene.add(ambient);

    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = randomOnSphere(randRange(3, 6));
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    const sparkleGeo = new THREE.BufferGeometry();
    sparkleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const sparkleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
    scene.add(sparkles);

    return {
      update(dt, elapsed) {
        mesh.rotation.x += dt * speed * 0.9;
        mesh.rotation.y += dt * speed * 1.3;

        const hue = (elapsed * speed * 0.15) % 1;
        material.emissive.setHSL(hue, 1, 0.5);

        lights.forEach((light, i) => {
          const angle = elapsed * speed * (0.6 + i * 0.3) + (i * Math.PI * 2) / lights.length;
          light.position.set(Math.cos(angle) * 3.5, Math.sin(angle * 1.3) * 2, Math.sin(angle) * 3.5);
        });

        sparkles.rotation.y += dt * speed * 0.05;
      },
      dispose() {
        geometry.dispose();
        material.dispose();
        sparkleGeo.dispose();
        sparkleMat.dispose();
      },
    };
  },
};
