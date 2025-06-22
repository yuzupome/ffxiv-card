const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 768;

let userImg = null;
let userImgX = 0;
let userImgY = 0;
let userImgScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

let lastTouchDist = null;

const BASE_URL = "/ffxiv-card";

let currentBg = 'Gothic_black.png';

function drawUserImage() {
  if (!userImg) return;
  const imgW = userImg.width * userImgScale;
  const imgH = userImg.height * userImgScale;
  const drawX = userImgX - imgW / 2;
  const drawY = userImgY - imgH / 2;
  ctx.drawImage(userImg, drawX, drawY, imgW, imgH);
}

function drawBackground(bgFile) {
  const img = new Image();
  img.onload = () => {
    drawAll();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.onerror = () => {
    console.error("背景画像の読み込みに失敗:", img.src);
  };
  img.src = BASE_URL + '/assets/backgrounds/' + bgFile;
}

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawUserImage();
}

document.querySelectorAll('#templateButtons button').forEach(btn => {
  btn.addEventListener('click', e => {
    currentBg = e.target.getAttribute('data-bg');
    drawBackground(currentBg);
  });
});

document.getElementById('uploadImage').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      userImg = img;
      userImgX = canvas.width / 2;
      userImgY = canvas.height / 2;
      userImgScale = 1;
      drawBackground(currentBg);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if (!userImg) return;
  const delta = e.deltaY < 0 ? 1.05 : 0.95;
  userImgScale *= delta;
  drawBackground(currentBg);
});

canvas.addEventListener('mousedown', e => {
  isDragging = true;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
});

canvas.addEventListener('mousemove', e => {
  if (!isDragging || !userImg) return;
  userImgX += e.offsetX - dragStartX;
  userImgY += e.offsetY - dragStartY;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
  drawBackground(currentBg);
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});
canvas.addEventListener('mouseleave', () => {
  isDragging = false;
});

canvas.addEventListener('touchstart', e => {
  if (!userImg) return;
  if (e.touches.length === 1) {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouchDist = getTouchDist(e);
  }
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!userImg) return;
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    userImgX += dx;
    userImgY += dy;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    drawBackground(currentBg);
  } else if (e.touches.length === 2) {
    const newDist = getTouchDist(e);
    if (lastTouchDist) {
      const scaleChange = newDist / lastTouchDist;
      userImgScale *= scaleChange;
      drawBackground(currentBg);
    }
    lastTouchDist = newDist;
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
  lastTouchDist = null;
});

function getTouchDist(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv-card.png';
  link.href = canvas.toDataURL();
  link.click();
});

drawBackground(currentBg);
