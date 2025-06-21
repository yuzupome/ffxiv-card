const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let img = null;
let scale = 1;
let imgX = 0;
let imgY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

document.getElementById('bgUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const image = new Image();
    image.onload = function() {
      img = image;
      scale = 1;
      imgX = (canvas.width - img.width) / 2;
      imgY = (canvas.height - img.height) / 2;
      draw();
    };
    image.src = event.target.result;
  };
  if (file) reader.readAsDataURL(file);
});

canvas.addEventListener('wheel', function(e) {
  if (!img) return;
  e.preventDefault();
  const prevWidth = img.width * scale;
  const prevHeight = img.height * scale;
  const prevX = imgX;
  const prevY = imgY;

  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  scale *= delta;
  scale = Math.min(Math.max(scale, 0.2), 5);

  const newWidth = img.width * scale;
  const newHeight = img.height * scale;
  const dx = (newWidth - prevWidth) * ((e.offsetX - prevX) / prevWidth);
  const dy = (newHeight - prevHeight) * ((e.offsetY - prevY) / prevHeight);
  imgX -= dx;
  imgY -= dy;

  draw();
});

canvas.addEventListener("mousedown", function(e) {
  if (!img) return;
  isDragging = true;
  dragStartX = e.offsetX - imgX;
  dragStartY = e.offsetY - imgY;
});

canvas.addEventListener("mousemove", function(e) {
  if (isDragging) {
    imgX = e.offsetX - dragStartX;
    imgY = e.offsetY - dragStartY;
    draw();
  }
});

canvas.addEventListener("mouseup", function() {
  isDragging = false;
});
canvas.addEventListener("mouseleave", function() {
  isDragging = false;
});

document.getElementById('generateBtn').addEventListener('click', () => {
  draw(true);
  const dataURL = canvas.toDataURL("image/png");
  const link = document.getElementById("downloadLink");
  link.href = dataURL;
  link.style.display = "inline-block";
  link.textContent = "画像をダウンロード";
});

function draw(includeText = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img) {
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
  }

  if (includeText) {
    ctx.fillStyle = "#000000";
    ctx.font = "24px sans-serif";
    const dc = document.getElementById('dcSelect').value;
    const playstyles = Array.from(document.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
    const prog = document.getElementById('progressSelect').value;

    ctx.fillText("DC: " + (dc || "未選択"), 30, 40);
    ctx.fillText("Play Style: " + (playstyles.join(", ") || "なし"), 30, 80);
    ctx.fillText("進行度: " + (prog || "未選択"), 30, 120);
  }
}