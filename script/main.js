
// main.js - 最新統合版（プレイ時間・進行度・スタイル・DC・種族など全対応）

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
let playstyleImgs = [];
let timeImgs = [];
let weekdaySummaryImg = null;
let holidaySummaryImg = null;

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
const raceSelect = document.getElementById('raceSelect');
const dcSelect = document.getElementById('dcSelect');
const progressSelect = document.getElementById('progressSelect');
const playstyleButtons = document.querySelectorAll('#styleButtons button');
const timeCheckboxes = document.querySelectorAll('#timeSection input[type="checkbox"]');

let currentTemplateClass = 'template-gothic-black';
let currentBase = 'Gothic_black';

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
  raceImg = new Image();
  raceImg.src = `/ffxiv-card/assets/race_icons/${currentBase}_${race}.png`;
  raceImg.onload = drawCanvas;
});

dcSelect.addEventListener('change', () => {
  const dc = dcSelect.value;
  if (!dc) {
    dcImg = null;
    drawCanvas();
    return;
  }
  dcImg = new Image();
  dcImg.src = `/ffxiv-card/assets/dc_icons/${currentBase}_${dc}.png`;
  dcImg.onload = drawCanvas;
});

progressSelect.addEventListener('change', () => {
  const value = progressSelect.value;
  const list = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
  const index = list.indexOf(value);
  progressImgs = [];
  if (index >= 0) {
    for (let i = 0; i <= index; i++) {
      const img = new Image();
      img.src = `/ffxiv-card/assets/progress_icons/${currentBase}_${list[i]}.png`;
      progressImgs.push(img);
      img.onload = drawCanvas;
    }
  } else {
    drawCanvas();
  }
});

playstyleButtons.forEach(button => {
  button.addEventListener('click', () => {
    button.classList.toggle('active');
    updatePlaystyleImages();
  });
});

function updatePlaystyleImages() {
  playstyleImgs = [];
  playstyleButtons.forEach(button => {
    if (button.classList.contains('active')) {
      const key = button.dataset.value.trim();
      const img = new Image();
      img.src = `/ffxiv-card/assets/style_icons/${currentBase}_${key}.png`;
      playstyleImgs.push(img);
      img.onload = drawCanvas;
    }
  });
  drawCanvas();
}

timeCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', updateTimeImages);
});

function updateTimeImages() {
  timeImgs = [];
  let hasWeekday = false;
  let hasHoliday = false;

  timeCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const value = checkbox.dataset.value.trim();
      if (value.startsWith('weekday_')) hasWeekday = true;
      if (value.startsWith('holiday_')) hasHoliday = true;

      const img = new Image();
      img.src = `/ffxiv-card/assets/time_icons/${currentBase}_${value}.png`;
      timeImgs.push(img);
      img.onload = drawCanvas;
    }
  });

  if (hasWeekday) {
    weekdaySummaryImg = new Image();
    weekdaySummaryImg.src = `/ffxiv-card/assets/time_icons/${currentBase}_weekday.png`;
    weekdaySummaryImg.onload = drawCanvas;
  } else {
    weekdaySummaryImg = null;
  }

  if (hasHoliday) {
    holidaySummaryImg = new Image();
    holidaySummaryImg.src = `/ffxiv-card/assets/time_icons/${currentBase}_holiday.png`;
    holidaySummaryImg.onload = drawCanvas;
  } else {
    holidaySummaryImg = null;
  }

  drawCanvas();
}

function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    currentTemplateClass = templateClass;
    currentBase = templateClass === 'template-gothic-white' ? 'Gothic_white' : 'Gothic_black';
    updateAllAssets();
  };
}

function updateAllAssets() {
  const race = raceSelect.value;
  if (race) {
    raceImg = new Image();
    raceImg.src = `/ffxiv-card/assets/race_icons/${currentBase}_${race}.png`;
    raceImg.onload = drawCanvas;
  } else {
    raceImg = null;
  }

  const dc = dcSelect.value;
  if (dc) {
    dcImg = new Image();
    dcImg.src = `/ffxiv-card/assets/dc_icons/${currentBase}_${dc}.png`;
    dcImg.onload = drawCanvas;
  } else {
    dcImg = null;
  }

  progressSelect.dispatchEvent(new Event('change'));
  updatePlaystyleImages();
  updateTimeImages();
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
  progressImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  playstyleImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  timeImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  if (weekdaySummaryImg) ctx.drawImage(weekdaySummaryImg, 0, 0, canvas.width, canvas.height);
  if (holidaySummaryImg) ctx.drawImage(holidaySummaryImg, 0, 0, canvas.width, canvas.height);
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
