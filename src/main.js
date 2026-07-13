import * as THREE from "three";
import { createSceneManager } from "./scene/sceneManager.js";
import { createParallaxShot } from "./scene/parallaxShot.js";
import { scheduleShot } from "./scene/shotScheduler.js";
import { buildStoryboard } from "./shotPlanner.js";
import { computeHeuristicDepth } from "./depthHeuristic.js";
import { generateHuggingFaceImage, generatePollinationsImage } from "./imageGen.js";
import { generateProceduralImage } from "./proceduralArt.js";
import { startRecording, downloadBlob, isRecordingSupported } from "./recorder.js";
import { submitRealAnimationRequest, pollRequestStatus } from "./realAnimation.js";
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

function resetGallery() {
  controls.galleryGrid.innerHTML = "";
  controls.gallery.hidden = true;
}

function imageToDownloadUrl(image) {
  const canvas = image.tagName === "CANVAS" ? image : (() => {
    const c = document.createElement("canvas");
    c.width = image.naturalWidth || image.width;
    c.height = image.naturalHeight || image.height;
    c.getContext("2d").drawImage(image, 0, 0);
    return c;
  })();
  return canvas.toDataURL("image/jpeg", 0.92);
}

function addToGallery(index, image) {
  const url = imageToDownloadUrl(image);
  const item = document.createElement("div");
  item.className = "gallery-item";

  const thumb = document.createElement("img");
  thumb.src = url;
  thumb.alt = `Shot ${index + 1}`;

  const link = document.createElement("a");
  link.href = url;
  link.download = `dream-shot-${index + 1}.jpg`;
  link.textContent = `Shot ${index + 1} ⬇`;

  item.appendChild(thumb);
  item.appendChild(link);
  controls.galleryGrid.appendChild(item);
  controls.gallery.hidden = false;
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
  resetGallery();

  try {
    const shots = buildStoryboard(promptText);
    const assets = [];

    for (let i = 0; i < shots.length; i++) {
      showToast(`Preparing shot ${i + 1}/${shots.length}...`, { sticky: true });
      const shot = shots[i];
      // Pollinations first: genuinely free with no per-account cap when it's up.
      // Hugging Face is a quality bonus, but free HF accounts only get $0.10/month
      // in Inference Provider credits (~10 images) before every call fails - so
      // leading with it would burn the whole month's free allowance on one video.
      let image = await generatePollinationsImage(shot.prompt, {
        width: sceneManager.width,
        height: sceneManager.height,
      });
      if (!image) {
        image = await generateHuggingFaceImage(shot.prompt, {
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

      addToGallery(i, image);

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

let stopPolling = null;

function renderReadyVideo(videoUrl) {
  controls.requestStatus.innerHTML = "";

  const msg = document.createElement("p");
  msg.textContent = "Your real animation is ready! \u{1F389}";

  const video = document.createElement("video");
  video.src = videoUrl;
  video.controls = true;
  video.playsInline = true;

  const link = document.createElement("a");
  link.href = videoUrl;
  link.download = "real-animation.mp4";
  link.textContent = "Download video";

  controls.requestStatus.appendChild(msg);
  controls.requestStatus.appendChild(video);
  controls.requestStatus.appendChild(link);
  controls.requestRealBtn.disabled = false;
}

async function handleRequestReal() {
  const promptText = controls.promptInput.value.trim();
  if (!promptText) {
    showToast("Type something first!");
    return;
  }

  controls.requestRealBtn.disabled = true;
  controls.requestStatus.hidden = false;
  controls.requestStatus.textContent = "Sending your request...";

  try {
    const id = await submitRealAnimationRequest(promptText);
    controls.requestStatus.textContent =
      "Request sent! Your real animation is being made - this can take a while. Keep this page open (or check back later) and it'll appear here once it's ready.";

    if (stopPolling) stopPolling();
    stopPolling = pollRequestStatus(id, { onReady: renderReadyVideo });
  } catch (err) {
    console.error(err);
    controls.requestStatus.textContent = "Couldn't send request, try again.";
    controls.requestRealBtn.disabled = false;
  }
}

wireControls(controls, { onGenerate: handleGenerate, onRequestReal: handleRequestReal });

if (!isRecordingSupported(controls.canvas)) {
  controls.generateBtn.disabled = true;
  showToast("Video recording isn't supported in this browser — try Chrome on Android.", { sticky: true });
}
