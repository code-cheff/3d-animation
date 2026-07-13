import * as THREE from "three";
import { createSceneManager } from "./scene/sceneManager.js";
import { createParallaxShot } from "./scene/parallaxShot.js";
import { scheduleShot } from "./scene/shotScheduler.js";
import { buildStoryboard } from "./shotPlanner.js";
import { computeHeuristicDepth } from "./depthHeuristic.js";
import { generateHuggingFaceImage, generatePollinationsImage } from "./imageGen.js";
import { generateProceduralImage } from "./proceduralArt.js";
import { startRecording, downloadBlob, isRecordingSupported } from "./recorder.js";
import { getControls, wireControls } from "./ui/controls.js";
import { showToast } from "./ui/statusToast.js";

const SHOT_DURATION_MS = 5000;

const controls = getControls();
const sceneManager = createSceneManager(controls.canvas);
const parallaxShot = createParallaxShot(sceneManager.scene, sceneManager.aspect);

let isBusy = false;
let activeTextures = [];

function disposePreviousTextures() {
  for (const tex of activeTextures) tex.dispose();
  activeTextures = [];
}

function buildTextureFromImage(image) {
  const texture = new THREE.Texture(image);
  // Deliberately NOT setting colorSpace = SRGBColorSpace here: our shader is a
  // raw passthrough (no lighting math), and setting it triggers an automatic
  // sRGB->linear hardware decode on every texture2D sample that our shader
  // doesn't compensate for, silently darkening the image by roughly 6x
  // (confirmed by comparing rendered vs. source average brightness).
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function playShotsWhileRecording(assets) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let currentShotIndex = -1;
    sceneManager.setOnTick(() => {
      // Use real wall-clock time, not accumulated per-frame dt: a throttled or
      // backgrounded rAF (phone screen lock, or this test harness's always-hidden
      // tab) fires ticks rarely, and dt-accumulation with a per-tick clamp would
      // make the recording take far longer than the real 30s it should.
      const elapsedMs = performance.now() - startTime;
      const { shotIndex, tShotNormalized, done } = scheduleShot(elapsedMs, SHOT_DURATION_MS, assets.length);
      if (done) {
        sceneManager.setOnTick(null);
        resolve();
        return;
      }
      if (shotIndex !== currentShotIndex) {
        const asset = assets[shotIndex];
        parallaxShot.setActiveShot(asset.colorTexture, asset.depthTexture, asset.panDir);
        currentShotIndex = shotIndex;
      }
      parallaxShot.updateOffset(tShotNormalized);
    });
  });
}

async function handleGenerate() {
  if (isBusy) return;
  const promptText = controls.promptInput.value.trim();
  if (!promptText) {
    showToast("Type something first!");
    return;
  }

  isBusy = true;
  controls.generateBtn.disabled = true;
  disposePreviousTextures();

  try {
    const shots = buildStoryboard(promptText);
    const assets = [];

    for (let i = 0; i < shots.length; i++) {
      showToast(`Preparing shot ${i + 1}/${shots.length}...`, { sticky: true });
      const shot = shots[i];
      let image = await generateHuggingFaceImage(shot.prompt, {
        width: sceneManager.width,
        height: sceneManager.height,
      });
      if (!image) {
        image = await generatePollinationsImage(shot.prompt, {
          width: sceneManager.width,
          height: sceneManager.height,
        });
      }
      if (!image) {
        image = generateProceduralImage(shot.prompt, {
          width: sceneManager.width,
          height: sceneManager.height,
          seed: i,
        });
      }

      const colorTexture = buildTextureFromImage(image);
      const depthTexture = computeHeuristicDepth(image, { verticalBiasWeight: shot.verticalBiasWeight });
      activeTextures.push(colorTexture, depthTexture);
      assets.push({ colorTexture, depthTexture, panDir: shot.panDir });
    }

    showToast("Recording your video...", { sticky: true });
    sceneManager.setRecording(true);
    const recorderHandle = startRecording(controls.canvas, { fps: 24 });

    await playShotsWhileRecording(assets);

    const blob = await recorderHandle.stop();
    sceneManager.setRecording(false);
    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    downloadBlob(blob, `dream-reel-${Date.now()}.${extension}`);
    showToast("Saved! \u{1F389}");
  } catch (err) {
    console.error(err);
    sceneManager.setRecording(false);
    showToast("Something went wrong, try again");
  } finally {
    isBusy = false;
    controls.generateBtn.disabled = false;
  }
}

wireControls(controls, { onGenerate: handleGenerate });

if (!isRecordingSupported(controls.canvas)) {
  controls.generateBtn.disabled = true;
  showToast("Video recording isn't supported in this browser — try Chrome on Android.", { sticky: true });
}
