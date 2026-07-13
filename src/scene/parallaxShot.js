import * as THREE from "three";

// Stronger than the original tuning: the first pass (0.04 offset, no zoom) was
// confirmed too subtle to read as motion at all - frame-to-frame difference
// within a shot measured under 3/255, looking like a slideshow of stills.
const MAX_OFFSET = 0.1; // UV units of depth-weighted parallax pan
const ZOOM_AMOUNT = 0.18; // Ken Burns push-in, independent of depth map quality so motion is always visible

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
uniform float uZoom;
varying vec2 vUv;
void main() {
  vec2 zoomedUv = (vUv - 0.5) / uZoom + 0.5;
  float depth = texture2D(depthTex, clamp(zoomedUv, 0.0, 1.0)).r;
  vec2 shiftedUv = clamp(zoomedUv + uOffset * depth, 0.0, 1.0);
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
      uZoom: { value: 1 },
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
      material.uniforms.uZoom.value = 1 + ZOOM_AMOUNT * eased;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
