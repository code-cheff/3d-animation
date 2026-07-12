import { randRange, randomOnSphere } from "./helpers.js";

const DEFAULT_PALETTE = [0xff4d79, 0xff8fab, 0xffffff];

export default {
  id: "heartPulse",
  name: "Heart Pulse",
  keywords: ["love", "heart", "hearts", "valentine", "crush", "romance", "romantic"],
  imageAware: false,
  defaultPalette: DEFAULT_PALETTE,

  build(scene, { THREE, palette = DEFAULT_PALETTE, speed = 1 }) {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
      color: palette[0],
      emissive: new THREE.Color(palette[0]).multiplyScalar(0.3),
      roughness: 0.35,
      metalness: 0.1,
    });

    const lobeGeo = new THREE.SphereGeometry(0.85, 28, 28);
    const lobeL = new THREE.Mesh(lobeGeo, material);
    lobeL.position.set(-0.55, 0.4, 0);
    const lobeR = new THREE.Mesh(lobeGeo, material);
    lobeR.position.set(0.55, 0.4, 0);

    const coneGeo = new THREE.ConeGeometry(1.15, 1.9, 28);
    const cone = new THREE.Mesh(coneGeo, material);
    cone.rotation.z = Math.PI; // flip so the point faces down
    cone.position.set(0, -0.75, 0);

    group.add(lobeL, lobeR, cone);
    scene.add(group);

    // Sparkle particles orbiting the heart
    const sparkleCount = 200;
    const sparklePositions = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount; i++) {
      const p = randomOnSphere(randRange(1.8, 3.2));
      sparklePositions[i * 3] = p.x;
      sparklePositions[i * 3 + 1] = p.y;
      sparklePositions[i * 3 + 2] = p.z;
    }
    const sparkleGeo = new THREE.BufferGeometry();
    sparkleGeo.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));
    const sparkleMat = new THREE.PointsMaterial({
      size: 0.05,
      color: palette[2],
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
    scene.add(sparkles);

    const light = new THREE.PointLight(palette[0], 1.5, 10);
    light.position.set(2, 2, 3);
    scene.add(light);
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    return {
      update(dt, elapsed) {
        const pulse = 1 + Math.sin(elapsed * speed * 4) * 0.08 + Math.max(Math.sin(elapsed * speed * 4), 0) * 0.05;
        group.scale.setScalar(pulse);
        group.rotation.y += dt * speed * 0.25;
        sparkles.rotation.y -= dt * speed * 0.1;
      },
      dispose() {
        lobeGeo.dispose();
        coneGeo.dispose();
        material.dispose();
        sparkleGeo.dispose();
        sparkleMat.dispose();
      },
    };
  },
};
