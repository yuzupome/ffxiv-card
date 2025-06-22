
const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");

let uploadedImg = null;
let uploadedImgScale = 1;
let uploadedImgX = 0;
let uploadedImgY = 0;
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;

let backgroundImg = new Image();
let charaName = "";
let selectedFont = "Black Han Sans";

// 赤枠の位置（テンプレ画像基準、768px高さ前提）
const TEXTBOX_TOP = 60;
const TEXTBOX_HEIGHT = 140;

const textBox = {
  x: canvas.width / 2,
  y: (TEXTBOX_TOP + TEXTBOX_HEIGHT / 2) * (canvas.height / 768)
};

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (uploadedImg) {
    const imgW = uploadedImg.width * uploadedImgScale;
    const imgH = uploadedImg.height * uploadedImgScale;
    const drawX = uploadedImgX - imgW / 2;
    const drawY = uploadedImgY - imgH / 2;
    ctx.drawImage(uploadedImg, drawX, drawY, imgW, imgH);
  }

  if (backgroundImg) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }

  if (charaName) {
    ctx.font = `48px '${selectedFont}'`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(charaName, textBox.x, textBox.y);
  }
}

document.getElementById("uploadImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    uploadedImg = new Image();
    uploadedImg.onload = function () {
      uploadedImgScale = Math.min(
        canvas.width / uploadedImg.width,
        canvas.height / uploadedImg.height
      );
      uploadedImgX = canvas.width / 2;
      uploadedImgY = canvas.height / 2;
      drawCanvas();
    };
    uploadedImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("nameInput").addEventListener("input", (e) => {
  charaName = e.target.value;
  drawCanvas();
});

document.getElementById("fontSelect").addEventListener("change", (e) => {
  selectedFont = e.target.value;
  drawCanvas();
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "ffxiv_card.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

document.querySelectorAll("#templateButtons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const bgName = btn.getAttribute("data-bg");
    backgroundImg.src = `assets/backgrounds/${bgName}`;
    backgroundImg.onload = drawCanvas;
  });
});

// PC操作：ドラッグとホイール
canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (dragging) {
    const dx = e.offsetX - dragStartX;
    const dy = e.offsetY - dragStartY;
    uploadedImgX += dx;
    uploadedImgY += dy;
    dragStartX = e.offsetX;
    dragStartY = e.offsetY;
    drawCanvas();
  }
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
});

canvas.addEventListener("mouseleave", () => {
  dragging = false;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (uploadedImg) {
    const scaleAmount = e.deltaY < 0 ? 1.05 : 0.95;
    uploadedImgScale *= scaleAmount;
    drawCanvas();
  }
});

// スマホ対応：ピンチとドラッグ
let lastTouchDistance = 0;
let lastTouchMidpoint = null;

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    dragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouchDistance = getTouchDistance(e.touches);
    lastTouchMidpoint = getTouchMidpoint(e.touches);
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && dragging) {
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    uploadedImgX += dx;
    uploadedImgY += dy;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    drawCanvas();
  } else if (e.touches.length === 2) {
    const newDistance = getTouchDistance(e.touches);
    const scaleAmount = newDistance / lastTouchDistance;
    uploadedImgScale *= scaleAmount;
    lastTouchDistance = newDistance;
    drawCanvas();
  }
}, { passive: false });

canvas.addEventListener("touchend", () => {
  dragging = false;
});

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function getTouchMidpoint(touches) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  };
}

drawCanvas();
