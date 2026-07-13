export function getControls() {
  return {
    promptInput: document.getElementById("prompt-input"),
    generateBtn: document.getElementById("generate-btn"),
    canvas: document.getElementById("scene-canvas"),
    gallery: document.getElementById("gallery"),
    galleryGrid: document.getElementById("gallery-grid"),
    requestRealBtn: document.getElementById("request-real-btn"),
    requestStatus: document.getElementById("request-status"),
  };
}

export function wireControls(controls, { onGenerate, onRequestReal }) {
  controls.generateBtn.addEventListener("click", onGenerate);
  controls.requestRealBtn.addEventListener("click", onRequestReal);

  controls.promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  });
}
