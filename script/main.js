const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");
const nameInput = document.getElementById("nameInput");
const fontSelect = document.getElementById("fontSelect");
const uploadImage = document.getElementById("uploadImage");
const downloadBtn = document.getElementById("downloadBtn");
const templateButtons = document.querySelectorAll("#templateButtons button");

let uploadedImage = null;
let templateImage = new Image();
let dragging = false;
let lastX, lastY;
let scale = 1;
let offsetX = 0;
let offsetY = 0;

const TEXTBOX_TOP = 48;
const TEXTBOX_HEIGHT = 144;
const TEXTBOX_CENTER_Y = TEXTBOX_TOP + TEXTBOX_HEIGHT / 2;

// 赤枠描画（デバッグ用）
function drawRedBox() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, TEXTBOX_TOP, canvas.width, TEXTBOX_HEIGHT);
}

function drawText() {
  const name = nameInput.value;
  if (!name) return;

  const font = fontSelect.value;
  const fontSize = 48;
  ctx.font = `${fontSize}px "${font}"`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(name, canvas.width / 2, TEXTBOX_CENTER_Y);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // アップロード画像を最背面に中央表示
  if (uploadedImage) {
    const iw = uploadedImage.width * scale;
    const ih = uploadedImage.height * scale;
    const ix = canvas.width / 2 - iw / 2 + offsetX;
    const iy = canvas.height / 2 - ih / 2 + offsetY;
    ctx.drawImage(uploadedImage, ix, iy, iw, ih);
  }

  // テンプレ画像（最前面）
  if (templateImage) {
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
  }

  drawText();
  drawRedBox();
}

templateButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const bgFile = btn.getAttribute("data-bg");
    templateImage.src = "assets/backgrounds/" + bgFile;
  });
});

templateImage.onload = render;

uploadImage.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    uploadedImage = new Image();
    uploadedImage.onload = () => {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      render();
    };
    uploadedImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

nameInput.addEventListener("input", render);
fontSelect.addEventListener("change", render);

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const dx = e.offsetX - lastX;
  const dy = e.offsetY - lastY;
  offsetX += dx;
  offsetY += dy;
  lastX = e.offsetX;
  lastY = e.offsetY;
  render();
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
});
canvas.addEventListener("mouseleave", () => {
  dragging = false;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  scale *= delta;
  render();
});

// スマホ用タッチ操作
let touchStartX, touchStartY, initialOffsetX, initialOffsetY;
let initialDistance = null;
let initialScale = 1;

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    initialOffsetX = offsetX;
    initialOffsetY = offsetY;
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialDistance = Math.sqrt(dx * dx + dy * dy);
    initialScale = scale;
  }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    offsetX = initialOffsetX + dx;
    offsetY = initialOffsetY + dy;
    render();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDistance = Math.sqrt(dx * dx + dy * dy);
    scale = initialScale * (newDistance / initialDistance);
    render();
  }
}, { passive: false });

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "ffxiv_card.png";
  link.href = canvas.toDataURL();
  link.click();
});
