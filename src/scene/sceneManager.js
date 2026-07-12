import * as THREE from "three";

// Disposes geometries/materials/textures on a subtree so swapping presets
// repeatedly in one session doesn't leak GPU memory on a phone.
function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((m) => {
        Object.keys(m).forEach((key) => {
          const value = m[key];
          if (value && value.isTexture) value.dispose();
        });
        m.dispose();
      });
    }
  });
}

export function createSceneManager(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true, // required so recorder.js can read pixels for GIF frames
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x06060c, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const clock = new THREE.Clock();
  let current = null; // {update(dt, elapsed, camera), dispose()}
  let running = true;
  let rafId = null;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function clearScene() {
    for (let i = scene.children.length - 1; i >= 0; i--) {
      const child = scene.children[i];
      disposeObject(child);
      scene.remove(child);
    }
  }

  function loadPreset(preset, ctx = {}) {
    if (current && current.dispose) current.dispose();
    clearScene();
    camera.position.set(0, 0, 6);
    camera.rotation.set(0, 0, 0);
    current = preset.build(scene, { THREE, ...ctx }) || null;
  }

  function tick() {
    rafId = requestAnimationFrame(tick);
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();
    if (current && current.update) current.update(dt, elapsed, camera);
    renderer.render(scene, camera);
  }

  function handleVisibility() {
    running = document.visibilityState === "visible";
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  document.addEventListener("visibilitychange", handleVisibility);

  resize();
  tick();

  return {
    renderer,
    scene,
    camera,
    loadPreset,
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (current && current.dispose) current.dispose();
      clearScene();
      renderer.dispose();
    },
  };
}
