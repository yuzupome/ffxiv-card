
// main.js - メインジョブとサブジョブ対応、全機能統合・描画順調整済み

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
let styleImgs = [];
let timeImgs = [];
let weekdaySummaryImg = null;
let holidaySummaryImg = null;
let difficultyImgs = [];
let mainJobImg = null;
let subJobImgs = [];

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  drawCanvas();
});
nameInput.addEventListener('input', drawCanvas);

// 背景テンプレート切替
function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    updateAllImages();
  };
}

// 種族
document.getElementById('raceSelect').addEventListener('change', () => updateImage('race'));
// DC
document.getElementById('dcSelect').addEventListener('change', () => updateImage('dc'));
// メインジョブ
document.getElementById('mainjobSelect').addEventListener('change', () => updateImage('mainjob'));
// サブジョブ
document.querySelectorAll('.subjob').forEach(cb => cb.addEventListener('change', () => updateImage('subjob')));

// 難易度
document.querySelectorAll('.difficulty').forEach(cb => cb.addEventListener('change', () => updateImage('difficulty')));

// スタイル
document.querySelectorAll('#styleButtons button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    updateImage('style');
  });
});

// プレイ時間
document.querySelectorAll('#playtimeOptions input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => updateImage('time'));
});

// 進行度
document.getElementById('progressSelect').addEventListener('change', () => updateImage('progress'));

// アップロード画像
document.getElementById('uploadImage').addEventListener('change', (e) => {
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

function getBase() {
  return document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
}

function updateAllImages() {
  updateImage('race');
  updateImage('dc');
  updateImage('mainjob');
  updateImage('subjob');
  updateImage('difficulty');
  updateImage('style');
  updateImage('time');
  updateImage('progress');
}

function updateImage(type) {
  const base = getBase();

  if (type === 'race') {
    const val = document.getElementById('raceSelect').value;
    raceImg = val ? new Image() : null;
    if (raceImg) {
      raceImg.src = `/ffxiv-card/assets/race_icons/${base}_${val}.png`;
      raceImg.onload = drawCanvas;
    } else drawCanvas();
  }

  if (type === 'dc') {
    const val = document.getElementById('dcSelect').value;
    dcImg = val ? new Image() : null;
    if (dcImg) {
      dcImg.src = `/ffxiv-card/assets/dc_icons/${base}_${val}.png`;
      dcImg.onload = drawCanvas;
    } else drawCanvas();
  }

  if (type === 'mainjob') {
    const val = document.getElementById('mainjobSelect').value;
    mainJobImg = val ? new Image() : null;
    if (mainJobImg) {
      mainJobImg.src = `/ffxiv-card/assets/mainjob_icons/${base}_main_${val}.png`;
      mainJobImg.onload = drawCanvas;
    } else drawCanvas();
  }

  if (type === 'subjob') {
    subJobImgs = [];
    document.querySelectorAll('.subjob:checked').forEach(cb => {
      const img = new Image();
      img.src = `/ffxiv-card/assets/subjob_icons/${base}_sub_${cb.value}.png`;
      subJobImgs.push(img);
      img.onload = drawCanvas;
    });
    drawCanvas();
  }

  if (type === 'difficulty') {
    difficultyImgs = [];
    document.querySelectorAll('.difficulty:checked').forEach(cb => {
      const img = new Image();
      img.src = `/ffxiv-card/assets/difficulty_icons/${base}_${cb.value}.png`;
      difficultyImgs.push(img);
      img.onload = drawCanvas;
    });
    drawCanvas();
  }

  if (type === 'style') {
    styleImgs = [];
    document.querySelectorAll('#styleButtons button.active').forEach(btn => {
      const val = btn.dataset.value.trim();
      const img = new Image();
      img.src = `/ffxiv-card/assets/style_icons/${base}_${val}.png`;
      styleImgs.push(img);
      img.onload = drawCanvas;
    });
    drawCanvas();
  }

  if (type === 'time') {
    timeImgs = [];
    let hasWeekday = false;
    let hasHoliday = false;
    document.querySelectorAll('#playtimeOptions input[type="checkbox"]:checked').forEach(cb => {
      const cls = cb.classList[0];
      const val = cb.value;
      if (cls === 'weekday') hasWeekday = true;
      if (cls === 'holiday') hasHoliday = true;
      const img = new Image();
      img.src = `/ffxiv-card/assets/time_icons/${base}_${cls}_${val}.png`;
      timeImgs.push(img);
      img.onload = drawCanvas;
    });
    weekdaySummaryImg = hasWeekday ? new Image() : null;
    holidaySummaryImg = hasHoliday ? new Image() : null;
    if (weekdaySummaryImg) {
      weekdaySummaryImg.src = `/ffxiv-card/assets/time_icons/${base}_weekday.png`;
      weekdaySummaryImg.onload = drawCanvas;
    }
    if (holidaySummaryImg) {
      holidaySummaryImg.src = `/ffxiv-card/assets/time_icons/${base}_holiday.png`;
      holidaySummaryImg.onload = drawCanvas;
    }
    drawCanvas();
  }

  if (type === 'progress') {
    const val = document.getElementById('progressSelect').value;
    const order = ['shinsei','souten','guren','shikkoku','gyougetsu','ougon','all_clear'];
    const idx = order.indexOf(val);
    progressImgs = [];
    for (let i = 0; i <= idx; i++) {
      const key = order[i];
      const img = new Image();
      img.src = `/ffxiv-card/assets/progress_icons/${base}_${key}.png`;
      progressImgs.push(img);
      img.onload = drawCanvas;
    }
    drawCanvas();
  }
}

function drawNameText() {
  const name = nameInput.value;
  if (!name) return;
  const style = getComputedStyle(document.body);
  const x = parseInt(style.getPropertyValue('--name-area-x'));
  const y = parseInt(style.getPropertyValue('--name-area-y'));
  const width = parseInt(style.getPropertyValue('--name-area-width'));
  const height = parseInt(style.getPropertyValue('--name-area-height'));
  const color = style.getPropertyValue('--name-color').trim();
  const fontSize = Math.floor(height * 0.5);
  ctx.font = `${fontSize}px ${selectedFont}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + width / 2, y + height / 2);
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }
  if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  if (raceImg) ctx.drawImage(raceImg, 0, 0, canvas.width, canvas.height);
  if (dcImg) ctx.drawImage(dcImg, 0, 0, canvas.width, canvas.height);
  progressImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  styleImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  timeImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  if (weekdaySummaryImg) ctx.drawImage(weekdaySummaryImg, 0, 0, canvas.width, canvas.height);
  if (holidaySummaryImg) ctx.drawImage(holidaySummaryImg, 0, 0, canvas.width, canvas.height);
  difficultyImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  subJobImgs.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
  if (mainJobImg) ctx.drawImage(mainJobImg, 0, 0, canvas.width, canvas.height);
  drawNameText();
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
