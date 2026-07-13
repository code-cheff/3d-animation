import * as THREE from "three";

// Cheap 2D-canvas depth approximation: no ML model, no download, near-zero
// compute. Blends Sobel edge magnitude (busier detail tends to be foreground)
// with a vertical-position bias (ground/foreground usually lower in frame).
// Deliberately approximate - see shotPlanner.js's per-shot verticalBiasWeight
// for how the one known failure case (overhead shots) is guarded.

function toGrayscale(imageData, w, h) {
  const { data } = imageData;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return gray;
}

function sample(gray, w, h, x, y) {
  const cx = Math.min(Math.max(x, 0), w - 1);
  const cy = Math.min(Math.max(y, 0), h - 1);
  return gray[cy * w + cx];
}

function sobelMagnitude(gray, w, h) {
  const mag = new Float32Array(w * h);
  let max = 1e-6;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx =
        -sample(gray, w, h, x - 1, y - 1) + sample(gray, w, h, x + 1, y - 1) +
        -2 * sample(gray, w, h, x - 1, y) + 2 * sample(gray, w, h, x + 1, y) +
        -sample(gray, w, h, x - 1, y + 1) + sample(gray, w, h, x + 1, y + 1);
      const gy =
        -sample(gray, w, h, x - 1, y - 1) - 2 * sample(gray, w, h, x, y - 1) - sample(gray, w, h, x + 1, y - 1) +
        sample(gray, w, h, x - 1, y + 1) + 2 * sample(gray, w, h, x, y + 1) + sample(gray, w, h, x + 1, y + 1);
      const m = Math.sqrt(gx * gx + gy * gy);
      mag[y * w + x] = m;
      if (m > max) max = m;
    }
  }
  for (let i = 0; i < mag.length; i++) mag[i] /= max;
  return mag;
}

function boxBlur5(src, w, h) {
  const out = new Float32Array(w * h);
  const r = 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const cx = x + dx;
          const cy = y + dy;
          if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
            sum += src[cy * w + cx];
            count++;
          }
        }
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

export function computeHeuristicDepth(image, { w = 96, h = 170, verticalBiasWeight = 0.4 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);

  const gray = toGrayscale(imageData, w, h);
  const edges = sobelMagnitude(gray, w, h);

  const combined = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const verticalPos = h > 1 ? y / (h - 1) : 0;
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const value = 0.6 * edges[idx] + verticalBiasWeight * verticalPos;
      combined[idx] = Math.min(Math.max(value, 0), 1);
    }
  }

  const blurred = boxBlur5(combined, w, h);

  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = Math.round(blurred[i] * 255);
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(rgba, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
