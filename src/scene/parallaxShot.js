import * as THREE from "three";

const MAX_OFFSET = 0.04; // UV units; kept small so the clamp-to-edge smear stays subtle

function easeInOut(t) {
  return (1 - Math.cos(Math.PI * t)) / 2;
}

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D colorTex;
uniform sampler2D depthTex;
uniform vec2 uOffset;
varying vec2 vUv;
void main() {
  float depth = texture2D(depthTex, vUv).r;
  vec2 shiftedUv = clamp(vUv + uOffset * depth, 0.0, 1.0);
  gl_FragColor = texture2D(colorTex, shiftedUv);
}
`;

export function createParallaxShot(scene, aspect) {
  const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      colorTex: { value: null },
      depthTex: { value: null },
      uOffset: { value: new THREE.Vector2(0, 0) },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let panDir = 1;

  return {
    setActiveShot(colorTex, depthTex, dir) {
      material.uniforms.colorTex.value = colorTex;
      material.uniforms.depthTex.value = depthTex;
      panDir = dir;
    },
    updateOffset(tShotNormalized) {
      const eased = easeInOut(Math.min(Math.max(tShotNormalized, 0), 1));
      const shift = panDir * MAX_OFFSET * eased;
      material.uniforms.uOffset.value.set(shift, shift * 0.25);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
