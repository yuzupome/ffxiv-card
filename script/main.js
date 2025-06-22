
const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");

let uploadedImage = null;
let backgroundImage = null;
let uploadedImageX = 0;
let uploadedImageY = 0;
let uploadedImageScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// テキストボックスの位置とサイズ
const TEXTBOX_TOP = 100;
const TEXTBOX_LEFT = 125;
const TEXTBOX_WIDTH = 640;
const TEXTBOX_HEIGHT = 120;

function drawRedBox() {
  ctx.save();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(TEXTBOX_LEFT, TEXTBOX_TOP, TEXTBOX_WIDTH, TEXTBOX_HEIGHT);
  ctx.restore();
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // アップロード画像を最背面に描画
  if (uploadedImage) {
    const drawWidth = uploadedImage.width * uploadedImageScale;
    const drawHeight = uploadedImage.height * uploadedImageScale;
    ctx.drawImage(
      uploadedImage,
      uploadedImageX - drawWidth / 2,
      uploadedImageY - drawHeight / 2,
      drawWidth,
      drawHeight
    );
  }

  // テンプレート画像
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  }

  // 赤枠
  drawRedBox();

  // テキスト
  const name = document.getElementById("nameInput").value;
  const font = document.getElementById("fontSelect").value;
  if (name) {
    ctx.save();
    ctx.font = `48px "${font}"`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const centerX = TEXTBOX_LEFT + TEXTBOX_WIDTH / 2;
    const centerY = TEXTBOX_TOP + TEXTBOX_HEIGHT / 2;
    ctx.fillText(name, centerX, centerY);
    ctx.restore();
  }
}

document.getElementById("uploadImage").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      uploadedImage = img;
      uploadedImageX = canvas.width / 2;
      uploadedImageY = canvas.height / 2;
      uploadedImageScale = 1;
      drawCanvas();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll("#templateButtons button").forEach((button) => {
  button.addEventListener("click", function () {
    const bg = new Image();
    bg.onload = function () {
      backgroundImage = bg;
      drawCanvas();
    };
    bg.src = "assets/backgrounds/" + button.getAttribute("data-bg");
  });
});

document.getElementById("nameInput").addEventListener("input", drawCanvas);
document.getElementById("fontSelect").addEventListener("change", drawCanvas);
document.getElementById("downloadBtn").addEventListener("click", function () {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "ffxiv_card.png";
  a.click();
});

canvas.addEventListener("mousedown", function (e) {
  isDragging = true;
  dragStartX = e.offsetX;
  dragStartY = e.offsetY;
});

canvas.addEventListener("mouseup", function () {
  isDragging = false;
});

canvas.addEventListener("mousemove", function (e) {
  if (isDragging) {
    uploadedImageX += e.offsetX - dragStartX;
    uploadedImageY += e.offsetY - dragStartY;
    dragStartX = e.offsetX;
    dragStartY = e.offsetY;
    drawCanvas();
  }
});

canvas.addEventListener("wheel", function (e) {
  if (uploadedImage) {
    uploadedImageScale *= e.deltaY < 0 ? 1.05 : 0.95;
    drawCanvas();
  }
});

canvas.addEventListener("touchstart", function (e) {
  if (e.touches.length === 1) {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  }
}, { passive: false });

canvas.addEventListener("touchmove", function (e) {
  if (isDragging && e.touches.length === 1) {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    uploadedImageX += touchX - dragStartX;
    uploadedImageY += touchY - dragStartY;
    dragStartX = touchX;
    dragStartY = touchY;
    drawCanvas();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (this.lastDistance) {
      uploadedImageScale *= distance / this.lastDistance;
      drawCanvas();
    }
    this.lastDistance = distance;
  }
}, { passive: false });

canvas.addEventListener("touchend", function (e) {
  isDragging = false;
  this.lastDistance = null;
});
