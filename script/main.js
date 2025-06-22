
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

function drawNameText(text, font) {
  ctx.save();
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 48px " + font;
  ctx.fillText(text, TEXTBOX_LEFT + TEXTBOX_WIDTH / 2, TEXTBOX_TOP + TEXTBOX_HEIGHT / 2);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImage) {
    const iw = uploadedImage.width * uploadedImageScale;
    const ih = uploadedImage.height * uploadedImageScale;
    ctx.drawImage(uploadedImage, uploadedImageX, uploadedImageY, iw, ih);
  }
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  }
  drawNameText(document.getElementById("nameInput").value, document.getElementById("fontSelect").value);
  drawRedBox();
}

document.getElementById("nameInput").addEventListener("input", draw);
document.getElementById("fontSelect").addEventListener("change", draw);
document.getElementById("uploadImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      uploadedImage = img;
      uploadedImageX = 0;
      uploadedImageY = 0;
      uploadedImageScale = canvas.width / img.width;
      draw();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function loadBackground(src) {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    backgroundImage = img;
    draw();
  };
  img.src = src;
}

document.getElementById("templateButtons").innerHTML = `
  <button onclick="loadBackground('./assets/backgrounds/Gothic_black.png')">黒背景</button>
  <button onclick="loadBackground('./assets/backgrounds/Gothic_white.png')">白背景</button>
`;

document.getElementById("downloadBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "ffxiv_card.png";
  a.click();
});
