// script/main.js - Canvas描画と名前描画エリア調整付き

const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 3750;
canvas.height = 2250;

let backgroundImg = null;
let uploadedImg = null;
let selectedFont = 'Orbitron';

// 名前とフォント設定
const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');

fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  document.documentElement.style.setProperty('--selected-font', `'${selectedFont}', sans-serif`);
  drawCanvas();
});

nameInput.addEventListener('input', drawCanvas);

// 背景テンプレ切り替え
function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    drawCanvas();
  };
}

// 画像アップロード
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

// Canvas描画
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

// 名前テキスト描画
function drawNameText() {
  const name = nameInput.value;
  if (!name) return;

  const x = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--name-area-x'));
  const y = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--name-area-y'));
  const width = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--name-area-width'));
  const height = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--name-area-height'));

  const fontSize = Math.floor(height * 0.5);
  ctx.font = `${fontSize}px '${selectedFont}', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(name, x + width / 2, y + height / 2);
}

// PNG出力
const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

// 初期背景設定
document.getElementById('templateButtons')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const bg = e.target.dataset.bg;
    const className = e.target.dataset.class;
    if (bg && className) setTemplateBackground(bg, className);
  }
});
