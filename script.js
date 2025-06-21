const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let img = null;
let scale = 1;
let imgX = 0;
let imgY = 0;

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
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  scale *= delta;
  scale = Math.min(Math.max(scale, 0.2), 5);
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img) {
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const drawX = imgX + (canvas.width - drawWidth) / 2;
    const drawY = imgY + (canvas.height - drawHeight) / 2;
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }
}