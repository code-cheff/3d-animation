import { createSceneManager } from "./scene/sceneManager.js";
import { pickPreset } from "./promptMatcher.js";
import { loadImageFromFile } from "./scene/imageTexture.js";
import { generatePollinationsImage } from "./imageGen.js";
import { recordGif, downloadBlob } from "./recorder.js";
import { getControls, wireControls } from "./ui/controls.js";
import { showToast } from "./ui/statusToast.js";

const controls = getControls();
const sceneManager = createSceneManager(controls.canvas);

let uploadedFile = null;
let isBusy = false;

function applyPrompt(promptText, image) {
  const { preset, palette, speed } = pickPreset(promptText, { hasImage: !!image });
  sceneManager.loadPreset(preset, { palette, speed, image });
  controls.saveBtn.disabled = false;
  showToast(`${preset.name} ✨`);
}

async function handleGenerate() {
  if (isBusy) return;
  const promptText = controls.promptInput.value.trim();
  if (!promptText && !uploadedFile) {
    showToast("Type something or add a photo first!");
    return;
  }

  isBusy = true;
  controls.generateBtn.disabled = true;

  try {
    let image = null;
    if (uploadedFile) {
      image = await loadImageFromFile(uploadedFile);
    } else if (promptText) {
      showToast("Dreaming up an image...", { sticky: true });
      image = await generatePollinationsImage(promptText);
    }
    applyPrompt(promptText, image);
  } catch (err) {
    console.error(err);
    showToast("Something went wrong, try again");
  } finally {
    isBusy = false;
    controls.generateBtn.disabled = false;
  }
}

function handleImageChange(file) {
  uploadedFile = file;
  controls.imageNameEl.textContent = file ? file.name : "";
}

async function handleSave() {
  if (isBusy) return;
  isBusy = true;
  controls.saveBtn.disabled = true;
  showToast("Recording...", { sticky: true });

  try {
    const blob = await recordGif(controls.canvas, {
      onProgress: (p) => {
        if (p < 1) showToast(`Recording... ${Math.round(p * 100)}%`, { sticky: true });
        else showToast("Encoding... (a few seconds)", { sticky: true });
      },
    });
    downloadBlob(blob, `dream-machine-${Date.now()}.gif`);
    showToast("Saved! \u{1F389}");
  } catch (err) {
    console.error(err);
    showToast("Couldn't save — try your phone's screen recorder instead");
  } finally {
    isBusy = false;
    controls.saveBtn.disabled = false;
  }
}

wireControls(controls, {
  onGenerate: handleGenerate,
  onImageChange: handleImageChange,
  onSave: handleSave,
});

applyPrompt("galaxy", null);
