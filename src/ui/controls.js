export function getControls() {
  return {
    promptInput: document.getElementById("prompt-input"),
    generateBtn: document.getElementById("generate-btn"),
    canvas: document.getElementById("scene-canvas"),
  };
}

export function wireControls(controls, { onGenerate }) {
  controls.generateBtn.addEventListener("click", onGenerate);

  controls.promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  });
}
