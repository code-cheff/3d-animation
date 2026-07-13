import * as THREE from "three";

const WIDTH = 480;
const HEIGHT = 854;
const ASPECT = WIDTH / HEIGHT;

export function createSceneManager(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(1); // fixed regardless of devicePixelRatio - predictable perf/encode cost on unknown phones
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x06060c, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-ASPECT, ASPECT, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const clock = new THREE.Clock();
  let running = true;
  let recording = false;
  let rafId = null;
  let onTick = null;
  let lastTickAt = performance.now();

  function doTick() {
    lastTickAt = performance.now();
    if (!running && !recording) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (onTick) onTick(dt);
    renderer.render(scene, camera);
  }

  function tick() {
    rafId = requestAnimationFrame(tick);
    doTick();
  }

  function handleVisibility() {
    if (recording) return; // never pause mid-recording, even if the tab backgrounds
    running = document.visibilityState === "visible";
  }

  document.addEventListener("visibilitychange", handleVisibility);
  tick();

  // Watchdog: rAF can stall or be throttled to near-zero on a backgrounded/
  // deprioritized tab (e.g. the friend's phone screen locking mid-recording).
  // If a recording is in progress and rAF hasn't ticked recently, force one via
  // setInterval so the video keeps progressing instead of hanging indefinitely.
  setInterval(() => {
    if (recording && performance.now() - lastTickAt > 150) {
      doTick();
    }
  }, 100);

  return {
    renderer,
    scene,
    camera,
    aspect: ASPECT,
    width: WIDTH,
    height: HEIGHT,
    setOnTick(fn) {
      onTick = fn;
    },
    setRecording(value) {
      recording = value;
    },
    destroy() {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", handleVisibility);
      renderer.dispose();
    },
  };
}
