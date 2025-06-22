
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 768;

const BASE_URL = "/ffxiv-card";
let currentBg = "Gothic_black.png";

let uploadedImage = null;
let userImagePos = { x: 0, y: 0, scale: 1 };

// 画像アップロード
document.getElementById('uploadImage').addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = () => {
      uploadedImage = img;

      // 初期スケール（Canvas内に収まるよう自動調整）
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      userImagePos.scale = Math.min(1, Math.min(scaleX, scaleY));

      // 中央配置
      const w = img.width * userImagePos.scale;
      const h = img.height * userImagePos.scale;
      userImagePos.x = (canvas.width - w) / 2;
      userImagePos.y = (canvas.height - h) / 2;

      drawAll();
    };
    img.src = event.target.result;
  };
  if (file) reader.readAsDataURL(file);
});

// ユーザー画像描画（最背面）
function drawUserImage() {
  if (uploadedImage) {
    const w = uploadedImage.width * userImagePos.scale;
    const h = uploadedImage.height * userImagePos.scale;
    ctx.drawImage(uploadedImage, userImagePos.x, userImagePos.y, w, h);
  }
}

// 背景描画（テンプレ画像）
function drawBackground(bgFile) {
  currentBg = bgFile;
  const img = new Image();
  const fullPath = BASE_URL + '/assets/backgrounds/' + bgFile;
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.onerror = () => {
    console.error("背景画像の読み込みに失敗:", fullPath);
  };
  img.src = fullPath;
}

// 全体描画（背景が前、ユーザー画像が後ろ）
function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawUserImage();        // 最背面に描画
  drawBackground(currentBg); // 背景テンプレを上に重ねる
}

// テンプレ切り替えボタン
document.querySelectorAll('#templateButtons button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const bgFile = e.target.getAttribute('data-bg');
    drawAll();
    currentBg = bgFile;
  });
});

// PNG出力
document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ff14_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

// ドラッグ移動用
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

canvas.addEventListener('pointerdown', (e) => {
  if (!uploadedImage) return;
  const rect = canvas.getBoundingClientRect();
  const pointerX = e.clientX - rect.left;
  const pointerY = e.clientY - rect.top;
  const w = uploadedImage.width * userImagePos.scale;
  const h = uploadedImage.height * userImagePos.scale;

  if (
    pointerX >= userImagePos.x && pointerX <= userImagePos.x + w &&
    pointerY >= userImagePos.y && pointerY <= userImagePos.y + h
  ) {
    isDragging = true;
    dragOffsetX = pointerX - userImagePos.x;
    dragOffsetY = pointerY - userImagePos.y;
    canvas.setPointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (isDragging) {
    const rect = canvas.getBoundingClientRect();
    userImagePos.x = e.clientX - rect.left - dragOffsetX;
    userImagePos.y = e.clientY - rect.top - dragOffsetY;
    drawAll();
  }
});

canvas.addEventListener('pointerup', (e) => {
  isDragging = false;
  canvas.releasePointerCapture(e.pointerId);
});

// ホイールで拡縮（PC対応）
canvas.addEventListener('wheel', (e) => {
  if (!uploadedImage) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.05 : 0.95;
  userImagePos.scale *= delta;
  drawAll();
}, { passive: false });

// 初期描画
drawAll();
