
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 768;

let backgroundImage = new Image();
let uploadedImage = null;
let imageX = canvas.width / 2;
let imageY = canvas.height / 2;
let imageScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let nameText = '';
let fontName = 'Black Han Sans';

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // アップロード画像（最背面）
  if (uploadedImage) {
    const scaledWidth = uploadedImage.width * imageScale;
    const scaledHeight = uploadedImage.height * imageScale;
    const drawX = imageX - scaledWidth / 2;
    const drawY = imageY - scaledHeight / 2;
    ctx.drawImage(uploadedImage, drawX, drawY, scaledWidth, scaledHeight);
  }

  // 背景テンプレ画像（前面）
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  }

  // 名前テキスト描画（赤枠の中央、中央揃え）
  if (nameText) {
    ctx.font = `48px '${fontName}'`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textX = canvas.width / 2;
    const textY = 95; // 赤枠の中央位置に調整
    ctx.fillText(nameText, textX, textY);
  }
}

document.getElementById('uploadImage').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    uploadedImage = new Image();
    uploadedImage.onload = function() {
      drawCanvas();
    };
    uploadedImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll('#templateButtons button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const bgFile = e.target.getAttribute('data-bg');
    backgroundImage.src = `/ffxiv-card/assets/backgrounds/${bgFile}`;
    backgroundImage.onload = drawCanvas;
  });
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

document.getElementById('nameInput').addEventListener('input', (e) => {
  nameText = e.target.value;
  drawCanvas();
});

document.getElementById('fontSelect').addEventListener('change', (e) => {
  fontName = e.target.value;
  drawCanvas();
});

// PC：マウス操作

canvas.addEventListener('mousedown', (e) => {
  if (!uploadedImage) return;

  isDragging = true;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging || !uploadedImage) return;

  if (!isDragging) return;
  const dx = e.offsetX - dragStartX;
  const dy = e.offsetY - dragStartY;
  imageX += dx;
  imageY += dy;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
  drawCanvas();
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  imageScale += e.deltaY * -0.001;
  imageScale = Math.min(Math.max(0.1, imageScale), 5);
  drawCanvas();
});

// スマホ：ピンチと1本指
let lastTouchDist = null;


canvas.addEventListener('touchstart', (e) => {
  if (!uploadedImage) return;

  if (e.touches.length === 1) {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });


canvas.addEventListener('touchmove', (e) => {
  if (!uploadedImage) return;

  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    imageX += dx;
    imageY += dy;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    drawCanvas();
  } else if (e.touches.length === 2 && lastTouchDist !== null) {
    const newDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const scaleChange = newDist / lastTouchDist;
    imageScale *= scaleChange;
    imageScale = Math.min(Math.max(0.1, imageScale), 5);
    lastTouchDist = newDist;
    drawCanvas();
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
  lastTouchDist = null;
});
