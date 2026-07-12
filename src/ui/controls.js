export function getControls() {
  return {
    promptInput: document.getElementById("prompt-input"),
    imageInput: document.getElementById("image-input"),
    imageNameEl: document.getElementById("image-name"),
    generateBtn: document.getElementById("generate-btn"),
    saveBtn: document.getElementById("save-btn"),
    canvas: document.getElementById("scene-canvas"),
  };
}

export function wireControls(controls, { onGenerate, onImageChange, onSave }) {
  controls.generateBtn.addEventListener("click", onGenerate);
  controls.saveBtn.addEventListener("click", onSave);

  controls.imageInput.addEventListener("change", () => {
    const file = controls.imageInput.files && controls.imageInput.files[0];
    onImageChange(file || null);
  });

  controls.promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  });
}
