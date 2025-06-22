
const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");

let backgroundImg = new Image();
let uploadedImg = null;

const nameInput = document.getElementById("nameInput");
const fontSelect = document.getElementById("fontSelect");

const TEXTBOX_TOP = 48;
const TEXTBOX_HEIGHT = 144;

const textBox = {
  x: canvas.width / 2,
  y: TEXTBOX_TOP + TEXTBOX_HEIGHT / 2,
  width: 500,
  height: TEXTBOX_HEIGHT
};

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw uploaded image at the back (centered)
  if (uploadedImg) {
    const scale = Math.min(canvas.width / uploadedImg.width, canvas.height / uploadedImg.height);
    const imgWidth = uploadedImg.width * scale;
    const imgHeight = uploadedImg.height * scale;
    const imgX = (canvas.width - imgWidth) / 2;
    const imgY = (canvas.height - imgHeight) / 2;
    ctx.drawImage(uploadedImg, imgX, imgY, imgWidth, imgHeight);
  }

  // Draw background template
  if (backgroundImg.src) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }

  // Draw name text in red box center
  const font = fontSelect.value;
  ctx.font = `bold 36px "${font}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(nameInput.value, textBox.x, textBox.y);
}

document.getElementById("uploadImage").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImg = new Image();
    uploadedImg.onload = drawCanvas;
    uploadedImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll("#templateButtons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    backgroundImg = new Image();
    backgroundImg.onload = drawCanvas;
    backgroundImg.src = "assets/backgrounds/" + btn.dataset.bg;
  });
});

nameInput.addEventListener("input", drawCanvas);
fontSelect.addEventListener("change", drawCanvas);

document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "ffxiv_card.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
