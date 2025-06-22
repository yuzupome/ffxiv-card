
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 768;

const BASE_URL = "/ffxiv-card";

function drawBackground(bgFile) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.onerror = () => {
    console.error("背景画像の読み込みに失敗:", img.src);
  };
  img.src = BASE_URL + '/assets/backgrounds/' + bgFile;
}

document.querySelectorAll('#templateButtons button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const bgFile = e.target.getAttribute('data-bg');
    drawBackground(bgFile);
  });
});

drawBackground('Gothic_black.png');

document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ff14_card.png';
  link.href = canvas.toDataURL();
  link.click();
});
