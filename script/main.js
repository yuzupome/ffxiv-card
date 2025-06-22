
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 768;

let uploadedImg = null;
let uploadedImgX = 0;
let uploadedImgY = 0;
let uploadedImgScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

let bgImage = new Image();
let nameText = "";
let selectedFont = "Black Han Sans";

// 中央に表示するための赤枠基準位置（仮置き）

const TEXTBOX_TOP = 48;
const TEXTBOX_HEIGHT = 144;

const textBox = {
  x: canvas.width / 2,
  y: TEXTBOX_TOP + TEXTBOX_HEIGHT / 2
};


document.getElementById('nameInput').addEventListener('input', (e) => {
  nameText = e.target.value;
  drawCanvas();
});

document.getElementById('fontSelect').addEventListener('change', (e) => {
  selectedFont = e.target.value;
  drawCanvas();
});

document.getElementById('uploadImage').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    uploadedImg = new Image();
    uploadedImg.onload = function () {
      uploadedImgX = (canvas.width - uploadedImg.width) / 2;
      uploadedImgY = (canvas.height - uploadedImg.height) / 2;
      uploadedImgScale = 1;
      drawCanvas();
    };
    uploadedImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll('#templateButtons button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const bgFile = e.target.getAttribute('data-bg');
    bgImage = new Image();
    bgImage.onload = drawCanvas;
    bgImage.src = './assets/backgrounds/' + bgFile;
  });
});

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging && uploadedImg) {
    uploadedImgX += e.offsetX - dragStartX;
    uploadedImgY += e.offsetY - dragStartY;
    dragStartX = e.offsetX;
    dragStartY = e.offsetY;
    drawCanvas();
  }
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

canvas.addEventListener('wheel', (e) => {
  if (uploadedImg) {
    const scaleAmount = e.deltaY * -0.001;
    uploadedImgScale += scaleAmount;
    uploadedImgScale = Math.max(0.1, Math.min(3, uploadedImgScale));
    drawCanvas();
  }
});

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (isDragging && uploadedImg && e.touches.length === 1) {
    const touch = e.touches[0];
    uploadedImgX += touch.clientX - dragStartX;
    uploadedImgY += touch.clientY - dragStartY;
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    drawCanvas();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (canvas._lastDist) {
      const scaleAmount = (dist - canvas._lastDist) * 0.01;
      uploadedImgScale += scaleAmount;
      uploadedImgScale = Math.max(0.1, Math.min(3, uploadedImgScale));
    }
    canvas._lastDist = dist;
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
  canvas._lastDist = null;
}, { passive: false });

document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (uploadedImg) {
    const imgWidth = uploadedImg.width * uploadedImgScale;
    const imgHeight = uploadedImg.height * uploadedImgScale;
    ctx.drawImage(uploadedImg, uploadedImgX, uploadedImgY, imgWidth, imgHeight);
  }

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  }

  // テキスト描画を最後に
  

  if (nameText) {
    ctx.font = `48px "${selectedFont}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nameText, textBox.x, textBox.y);

  // テキスト描画位置確認用赤枠
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(textBox.x - 200, TEXTBOX_TOP, 400, TEXTBOX_HEIGHT);
  }
}
