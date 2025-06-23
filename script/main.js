
// 修正済み main.js - プレイスタイルのIDと属性名を修正済み

const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 3750;
canvas.height = 2250;

let backgroundImg = null;
let uploadedImgState = null;
let selectedFont = 'Orbitron, sans-serif';
let raceImg = null;
let dcImg = null;
let progressImages = [];
let playstyleImages = [];

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
const raceSelect = document.getElementById('raceSelect');
const dcSelect = document.getElementById('dcSelect');
const progressSelect = document.getElementById('progressSelect');

fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  drawCanvas();
});
nameInput.addEventListener('input', drawCanvas);
raceSelect.addEventListener('change', updateRaceImage);
dcSelect.addEventListener('change', updateDcImage);
progressSelect.addEventListener('change', updateProgressImages);

// ✅ 修正済みのイベントバインド（#styleButtons + data-value）
document.querySelectorAll('#styleButtons button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    updatePlaystyleImages();
  });
});

function getTemplateBaseName() {
  return document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
}

function updateRaceImage() {
  const race = raceSelect.value;
  if (!race) {
    raceImg = null;
    drawCanvas();
    return;
  }
  const base = getTemplateBaseName();
  raceImg = new Image();
  raceImg.src = `/ffxiv-card/assets/race_icons/${base}_${race}.png`;
  raceImg.onload = drawCanvas;
}

function updateDcImage() {
  const dc = dcSelect.value;
  if (!dc) {
    dcImg = null;
    drawCanvas();
    return;
  }
  const base = getTemplateBaseName();
  dcImg = new Image();
  dcImg.src = `/ffxiv-card/assets/dc_icons/${base}_${dc}.png`;
  dcImg.onload = drawCanvas;
}

function updateProgressImages() {
  const base = getTemplateBaseName();
  const selected = progressSelect.value;
  const mapping = ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon", "all_clear"];
  progressImages = [];

  let maxIndex = -1;
  if (selected === "all_clear") {
    maxIndex = mapping.length - 1;
  } else {
    maxIndex = mapping.indexOf(selected);
  }

  if (maxIndex >= 0) {
    for (let i = 0; i <= maxIndex; i++) {
      const img = new Image();
      img.src = `/ffxiv-card/assets/progress_icons/${base}_${mapping[i]}.png`;
      progressImages.push(img);
      img.onload = drawCanvas;
    }
  } else {
    drawCanvas();
  }
}

function updatePlaystyleImages() {
  const base = getTemplateBaseName();
  playstyleImages = [];
  document.querySelectorAll('#styleButtons .active').forEach(btn => {
    const key = btn.dataset.value;
    const img = new Image();
    img.src = `/ffxiv-card/assets/playstyle_icons/${base}_${key}.png`;
    playstyleImages.push(img);
    img.onload = drawCanvas;
  });
}

function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    updateRaceImage();
    updateDcImage();
    updateProgressImages();
    updatePlaystyleImages();
  };
}

const uploadImage = document.getElementById('uploadImage');
uploadImage.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      uploadedImgState = { img, x, y, width, height, dragging: false };
      drawCanvas();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }
  if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  drawNameText();
  if (raceImg) ctx.drawImage(raceImg, 0, 0, canvas.width, canvas.height);
  if (dcImg) ctx.drawImage(dcImg, 0, 0, canvas.width, canvas.height);
  progressImages.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  playstyleImages.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
}

function drawNameText() {
  const name = nameInput.value;
  if (!name) return;
  const x = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-x'));
  const y = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-y'));
  const width = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-width'));
  const height = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-height'));
  const color = getComputedStyle(document.body).getPropertyValue('--name-color').trim();
  const fontSize = Math.floor(height * 0.5);
  ctx.font = `${fontSize}px ${selectedFont}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + width / 2, y + height / 2);
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

document.getElementById('templateButtons')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const bg = e.target.dataset.bg;
    const className = e.target.dataset.class;
    if (bg && className) setTemplateBackground(bg, className);
  }
});
