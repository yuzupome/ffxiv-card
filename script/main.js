
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
const BASE_URL = "/ffxiv-card";  // GitHub Pages 用パス

let uploadedImg = null;
let uploadedPos = { x: 0, y: 0 };
let scale = 1;
let dragging = false;
let lastX, lastY;

// 初期テンプレート
drawBackground('Gothic_black.png');

function drawBackground(bgFile) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (uploadedImg) drawUploadedImage();
    drawName();
  };
  img.src = BASE_URL + '/assets/backgrounds/' + bgFile;
}

function drawUploadedImage() {
  if (!uploadedImg) return;
  const w = uploadedImg.width * scale;
  const h = uploadedImg.height * scale;
  const x = canvas.width / 2 - w / 2 + uploadedPos.x;
  const y = canvas.height / 2 - h / 2 + uploadedPos.y;
  ctx.drawImage(uploadedImg, x, y, w, h);
}

function drawName() {
  const name = document.getElementById("charName").value;
  const font = document.getElementById("fontSelector").value;
  ctx.font = `48px '${font}'`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(name, canvas.width / 2, 80);
}

document.querySelectorAll('#templateButtons button').forEach(btn => {
  btn.addEventListener('click', e => {
    drawBackground(e.target.getAttribute('data-bg'));
  });
});

document.getElementById("uploadImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      uploadedImg = img;
      uploadedPos = { x: 0, y: 0 };
      scale = 1;
      drawBackground(document.querySelector('button[data-bg].active')?.getAttribute('data-bg') || 'Gothic_black.png');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
});
canvas.addEventListener("mouseup", () => dragging = false);
canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  uploadedPos.x += e.offsetX - lastX;
  uploadedPos.y += e.offsetY - lastY;
  lastX = e.offsetX;
  lastY = e.offsetY;
  drawBackground(document.querySelector('button[data-bg].active')?.getAttribute('data-bg') || 'Gothic_black.png');
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  scale *= e.deltaY < 0 ? 1.05 : 0.95;
  drawBackground(document.querySelector('button[data-bg].active')?.getAttribute('data-bg') || 'Gothic_black.png');
});

// スマホ対応
let touchStart = {};
canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    touchStart.x = e.touches[0].clientX;
    touchStart.y = e.touches[0].clientY;
  }
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (e.touches.length === 1) {
    const dx = e.touches[0].clientX - touchStart.x;
    const dy = e.touches[0].clientY - touchStart.y;
    uploadedPos.x += dx;
    uploadedPos.y += dy;
    touchStart.x = e.touches[0].clientX;
    touchStart.y = e.touches[0].clientY;
    drawBackground(document.querySelector('button[data-bg].active')?.getAttribute('data-bg') || 'Gothic_black.png');
  }
}, { passive: false });

document.getElementById("charName").addEventListener("input", drawBackground);
document.getElementById("fontSelector").addEventListener("change", drawBackground);
document.getElementById("downloadBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "ffxiv_card.png";
  a.click();
});
