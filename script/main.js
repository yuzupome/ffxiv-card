// main.js - 進行度「ALL CLEAR」複数レイヤー描画対応済み

const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 3750;
canvas.height = 2250;

let backgroundImg = null;
let uploadedImgState = null;
let selectedFont = 'Orbitron, sans-serif';
let raceImg = null;
let dcImg = null;
let progressImgs = [];

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
const raceSelect = document.getElementById('raceSelect');
const dcSelect = document.getElementById('dcSelect');
const progressSelect = document.getElementById('progressSelect');

fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  document.documentElement.style.setProperty('--selected-font', selectedFont);
  drawCanvas();
});

nameInput.addEventListener('input', drawCanvas);

raceSelect.addEventListener('change', () => {
  const race = raceSelect.value;
  if (!race) {
    raceImg = null;
    drawCanvas();
    return;
  }
  const templateClass = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
  raceImg = new Image();
  raceImg.src = `/ffxiv-card/assets/race_icons/${templateClass}_${race}.png`;
  raceImg.onload = drawCanvas;
});

dcSelect.addEventListener('change', () => {
  const dc = dcSelect.value;
  if (!dc) {
    dcImg = null;
    drawCanvas();
    return;
  }
  const templateClass = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
  dcImg = new Image();
  dcImg.src = `/ffxiv-card/assets/dc_icons/${templateClass}_${dc}.png`;
  dcImg.onload = drawCanvas;
});

progressSelect?.addEventListener('change', () => {
  const value = progressSelect.value;
  const templateClass = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
  progressImgs = [];

  const addImg = (name) => {
    const img = new Image();
    img.src = `/ffxiv-card/assets/progress_icons/${templateClass}_${name}.png`;
    img.onload = drawCanvas;
    progressImgs.push(img);
  };

  if (!value) {
    drawCanvas();
  } else if (value === 'all_clear') {
    ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'].forEach(addImg);
  } else {
    addImg(value);
  }
});

function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    const race = raceSelect.value;
    if (race) {
      raceImg = new Image();
      const base = templateClass === 'template-gothic-white' ? 'Gothic_white' : 'Gothic_black';
      raceImg.src = `/ffxiv-card/assets/race_icons/${base}_${race}.png`;
      raceImg.onload = () => {
        const dc = dcSelect?.value;
        if (dc) {
          dcImg = new Image();
          dcImg.src = `/ffxiv-card/assets/dc_icons/${base}_${dc}.png`;
          dcImg.onload = drawCanvas;
        } else {
          drawCanvas();
        }
      };
    } else {
      drawCanvas();
    }
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
  if (backgroundImg) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }
  drawNameText();
  if (raceImg) {
    ctx.drawImage(raceImg, 0, 0, canvas.width, canvas.height);
  }
  if (dcImg) {
    ctx.drawImage(dcImg, 0, 0, canvas.width, canvas.height);
  }
  if (progressImgs.length > 0) {
    for (const img of progressImgs) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }
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
