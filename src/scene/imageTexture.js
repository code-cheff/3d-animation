export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

// Downsamples an image to a small grid of positions+colors for the
// Photo Explode preset's particle cloud.
export function sampleImageGrid(image, gridSize = 48) {
  const canvas = document.createElement("canvas");
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext("2d");

  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const side = Math.min(iw, ih);
  const sx = (iw - side) / 2;
  const sy = (ih - side) / 2;
  ctx.drawImage(image, sx, sy, side, side, 0, 0, gridSize, gridSize);

  const { data } = ctx.getImageData(0, 0, gridSize, gridSize);
  const count = gridSize * gridSize;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const span = 3.6;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const idx = y * gridSize + x;
      const px = idx * 4;
      positions[idx * 3] = (x / (gridSize - 1) - 0.5) * span;
      positions[idx * 3 + 1] = (0.5 - y / (gridSize - 1)) * span;
      positions[idx * 3 + 2] = 0;

      colors[idx * 3] = data[px] / 255;
      colors[idx * 3 + 1] = data[px + 1] / 255;
      colors[idx * 3 + 2] = data[px + 2] / 255;
    }
  }

  return { positions, colors, count };
}
