// main_latest_with_job.js - 最新統合版（全機能対応・描画順修正済）

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
let difficultyImgs = [];
let mainJobImg = null;
let subJobImgs = [];

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
const raceSelect = document.getElementById('raceSelect');
const dcSelect = document.getElementById('dcSelect');
const progressSelect = document.getElementById('progressSelect');
const mainJobSelect = document.getElementById('mainJobSelect');

function getTemplatePrefix() {
  return document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
}

fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  document.documentElement.style.setProperty('--selected-font', selectedFont);
  drawCanvas();
});

nameInput.addEventListener('input', drawCanvas);

function preloadIcon(path, callback) {
  const img = new Image();
  img.src = path;
  img.onload = () => {
    if (callback) callback(img);
    drawCanvas();
  };
  return img;
}

function updateProgress() {
  const value = progressSelect?.value;
  const base = getTemplatePrefix();
  progressImgs = [];
  const add = (name) => progressImgs.push(preloadIcon(`/ffxiv-card/assets/progress_icons/${base}_${name}.png`));
  if (!value) return;
  if (value === 'all_clear') {
    ['shinsei','souten','guren','shikkoku','gyougetsu','ougon','all_clear'].forEach(add);
  } else {
    const stages = ['shinsei','souten','guren','shikkoku','gyougetsu','ougon'];
    const index = stages.indexOf(value);
    if (index !== -1) stages.slice(0, index + 1).forEach(add);
  }
}

function updatePlayStyle() {
  const base = getTemplatePrefix();
  styleImgs = [];
  document.querySelectorAll('#styleButtons button.active').forEach(btn => {
    const key = btn.dataset.value;
    styleImgs.push(preloadIcon(`/ffxiv-card/assets/style_icons/${base}_${key}.png`));
  });
}

function updatePlayTime() {
  const base = getTemplatePrefix();
  timeImgs = [];
  const times = document.querySelectorAll('input[name^="time-"]:checked');
  let hasWeekday = false, hasHoliday = false;
  times.forEach(input => {
    const key = input.value;
    if (key.startsWith('weekday')) hasWeekday = true;
    if (key.startsWith('holiday')) hasHoliday = true;
    timeImgs.push(preloadIcon(`/ffxiv-card/assets/time_icons/${base}_${key}.png`));
  });
  document.querySelectorAll('input[name="time-other"]:checked').forEach(input => {
    timeImgs.push(preloadIcon(`/ffxiv-card/assets/time_icons/${base}_${input.value}.png`));
  });
  if (hasWeekday) timeImgs.push(preloadIcon(`/ffxiv-card/assets/time_icons/${base}_weekday.png`));
  if (hasHoliday) timeImgs.push(preloadIcon(`/ffxiv-card/assets/time_icons/${base}_holiday.png`));
}

function updateDifficulty() {
  const base = getTemplatePrefix();
  difficultyImgs = [];
  document.querySelectorAll('input[name="difficulty"]:checked').forEach(input => {
    difficultyImgs.push(preloadIcon(`/ffxiv-card/assets/difficulty_icons/${base}_${input.value}.png`));
  });
}

function updateMainJob() {
  const key = mainJobSelect.value;
  if (!key) return mainJobImg = null;
  const base = getTemplatePrefix();
  mainJobImg = preloadIcon(`/ffxiv-card/assets/mainjob_icons/${base}_main_${key}.png`);
}

function updateSubJobs() {
  const base = getTemplatePrefix();
  subJobImgs = [];
  document.querySelectorAll('input[name="subjob"]:checked').forEach(input => {
    subJobImgs.push(preloadIcon(`/ffxiv-card/assets/subjob_icons/${base}_sub_${input.value}.png`));
  });
}

[raceSelect, dcSelect].forEach(select => {
  select.addEventListener('change', () => {
    const val = select.value;
    if (!val) return select === raceSelect ? raceImg = null : dcImg = null;
    const base = getTemplatePrefix();
    const dir = select === raceSelect ? 'race_icons' : 'dc_icons';
    const target = select === raceSelect ? 'raceImg' : 'dcImg';
    window[target] = preloadIcon(`/ffxiv-card/assets/${dir}/${base}_${val}.png`);
  });
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }
  if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  drawNameText();
  [raceImg, dcImg, ...progressImgs, ...styleImgs, ...timeImgs, ...difficultyImgs, ...subJobImgs].forEach(img => {
    if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  });
  if (mainJobImg) {
    ctx.drawImage(mainJobImg, 0, 0, canvas.width, canvas.height);
  }
}
