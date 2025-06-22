// script/main.js - Canvas描画と名前描画エリア＋色切替＆フォント選択対応

const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 3750;
canvas.height = 2250;

let backgroundImg = null;
let uploadedImg = null;
let selectedFont = 'Orbitron, sans-serif';

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
    uploadedImg = new Image();
    uploadedImg.src = reader.result;
    uploadedImg.onload = drawCanvas;
  };
  reader.readAsDataURL(file);
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (uploadedImg) {
    drawCenteredImage(uploadedImg);
  }

  if (backgroundImg) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }

  drawNameText();
}

function drawCenteredImage(img) {
  const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
  const newWidth = img.width * ratio;
  const newHeight = img.height * ratio;
  const x = (canvas.width - newWidth) / 2;
  const y = (canvas.height - newHeight) / 2;
  ctx.drawImage(img, x, y, newWidth, newHeight);
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
