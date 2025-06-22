// script/main.js - Canvas描画と名前描画エリア＋色切替＆フォント選択＆画像拡縮対応（スマホ＋ピンチズーム対応）

const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 3750;
canvas.height = 2250;

let backgroundImg = null;
let uploadedImg = null;
let uploadedImgState = null;
let selectedFont = 'Orbitron, sans-serif';

let pinchStartDist = null;
let pinchCenter = null;

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');

fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  document.documentElement.style.setProperty('--selected-font', selectedFont);
  drawCanvas();
});

nameInput.addEventListener('input', drawCanvas);

function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    drawCanvas();
  };
}

const uploadImage = document.getElementById('uploadImage');
uploadImage.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      uploadedImgState = { img, x, y, width, height, dragging: false };
      drawCanvas();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }

  if (backgroundImg) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }

  drawNameText();
}

function drawNameText() {
  const name = nameInput.value;
  if (!name) return;

  const x = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-x'));
  const y = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-y'));
  const width = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-width'));
  const height = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-height'));
  const color = getComputedStyle(document.body).getPropertyValue('--name-color').trim();

  const fontSize = Math.floor(height * 0.5);
  ctx.font = `${fontSize}px ${selectedFont}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(name, x + width / 2, y + height / 2);
}

const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

document.getElementById('templateButtons')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const bg = e.target.dataset.bg;
    const className = e.target.dataset.class;
    if (bg && className) setTemplateBackground(bg, className);
  }
});

// ドラッグ操作（PC）
let dragStartX = 0;
let dragStartY = 0;
canvas.addEventListener('mousedown', (e) => {
  if (!uploadedImgState) return;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
  uploadedImgState.dragging = true;
});

canvas.addEventListener('mousemove', (e) => {
  if (uploadedImgState && uploadedImgState.dragging) {
    const dx = e.offsetX - dragStartX;
    const dy = e.offsetY - dragStartY;
    uploadedImgState.x += dx;
    uploadedImgState.y += dy;
    dragStartX = e.offsetX;
    dragStartY = e.offsetY;
    drawCanvas();
  }
});

canvas.addEventListener('mouseup', () => {
  if (uploadedImgState) uploadedImgState.dragging = false;
});

canvas.addEventListener('mouseleave', () => {
  if (uploadedImgState) uploadedImgState.dragging = false;
});

// タッチ操作（スマホ）
canvas.addEventListener('touchstart', (e) => {
  if (!uploadedImgState) return;
  const rect = canvas.getBoundingClientRect();
  if (e.touches.length === 1) {
    dragStartX = e.touches[0].clientX - rect.left;
    dragStartY = e.touches[0].clientY - rect.top;
    uploadedImgState.dragging = true;
  } else if (e.touches.length === 2) {
    pinchStartDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    pinchCenter = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
    };
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (!uploadedImgState) return;
  const rect = canvas.getBoundingClientRect();
  if (uploadedImgState.dragging && e.touches.length === 1) {
    const moveX = e.touches[0].clientX - rect.left;
    const moveY = e.touches[0].clientY - rect.top;
    const dx = moveX - dragStartX;
    const dy = moveY - dragStartY;
    uploadedImgState.x += dx;
    uploadedImgState.y += dy;
    dragStartX = moveX;
    dragStartY = moveY;
    drawCanvas();
  } else if (e.touches.length === 2) {
    const currentDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const scaleAmount = currentDist / pinchStartDist;
    pinchStartDist = currentDist;

    const { width, height, x, y } = uploadedImgState;
    const newWidth = width * scaleAmount;
    const newHeight = height * scaleAmount;
    const centerX = pinchCenter.x;
    const centerY = pinchCenter.y;
    const newX = x - (newWidth - width) * (centerX - x) / width;
    const newY = y - (newHeight - height) * (centerY - y) / height;

    uploadedImgState.width = newWidth;
    uploadedImgState.height = newHeight;
    uploadedImgState.x = newX;
    uploadedImgState.y = newY;
    drawCanvas();
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  if (uploadedImgState) uploadedImgState.dragging = false;
  pinchStartDist = null;
});

// 拡大縮小（PCホイール）
canvas.addEventListener('wheel', (e) => {
  if (!uploadedImgState) return;
  e.preventDefault();
  const scaleAmount = e.deltaY < 0 ? 1.05 : 0.95;
  const { x, y, width, height } = uploadedImgState;
  const newWidth = width * scaleAmount;
  const newHeight = height * scaleAmount;
  const newX = x - (newWidth - width) / 2;
  const newY = y - (newHeight - height) / 2;
  uploadedImgState.width = newWidth;
  uploadedImgState.height = newHeight;
  uploadedImgState.x = newX;
  uploadedImgState.y = newY;
  drawCanvas();
}, { passive: false });
