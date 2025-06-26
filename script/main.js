// main_latest_with_job.js - 全統合版（種族・DC・進行度・プレイスタイル・プレイ時間・高難易度・メイン＆サブジョブ対応）

const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 3750;
canvas.height = 2250;

// 各種状態保持
let backgroundImg = null;
let uploadedImgState = null;
let selectedFont = 'Orbitron, sans-serif';
let raceImg = null;
let dcImg = null;
let progressImgs = [];
let playstyleImgs = [];
let playtimeImgs = [];
let difficultyImgs = [];
let mainjobImg = null;
let subjobImgs = [];

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
const raceSelect = document.getElementById('raceSelect');
const dcSelect = document.getElementById('dcSelect');
const progressSelect = document.getElementById('progressSelect');
const mainjobSelect = document.getElementById('mainjobSelect');

fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  document.documentElement.style.setProperty('--selected-font', selectedFont);
  drawCanvas();
});
nameInput.addEventListener('input', drawCanvas);

function getBasePrefix() {
  return document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
}

// ====================== 背景テンプレート切り替え ======================
document.getElementById('templateButtons')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const bg = e.target.dataset.bg;
    const className = e.target.dataset.class;
    if (bg && className) setTemplateBackground(bg, className);
  }
});

function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    updateAllOverlayImages();
  };
}

// ======================= アップロード画像 ========================
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
      uploadedImgState = { img, x, y, width, height };
      drawCanvas();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// ======================= 種族 ========================
raceSelect.addEventListener('change', () => {
  const race = raceSelect.value.trim();
  raceImg = null;
  if (race) {
    raceImg = new Image();
    raceImg.src = `/ffxiv-card/assets/race_icons/${getBasePrefix()}_${race}.png`;
    raceImg.onload = drawCanvas;
  } else drawCanvas();
});

// ======================= データセンター ========================
dcSelect.addEventListener('change', () => {
  const dc = dcSelect.value.trim();
  dcImg = null;
  if (dc) {
    dcImg = new Image();
    dcImg.src = `/ffxiv-card/assets/dc_icons/${getBasePrefix()}_${dc}.png`;
    dcImg.onload = drawCanvas;
  } else drawCanvas();
});

// ======================= 進行度（累積） ========================
progressSelect.addEventListener('change', () => {
  const selected = progressSelect.value;
  const order = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
  progressImgs = [];

  if (selected) {
    const index = order.indexOf(selected);
    const range = selected === 'all_clear' ? order : order.slice(0, index + 1);
    range.forEach(key => {
      const img = new Image();
      img.src = `/ffxiv-card/assets/progress_icons/${getBasePrefix()}_${key}.png`;
      progressImgs.push(img);
      img.onload = drawCanvas;
    });
  } else drawCanvas();
});

// ======================= プレイスタイル（複数） ========================
document.querySelectorAll('#styleButtons button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    updatePlaystyleImgs();
  });
});

function updatePlaystyleImgs() {
  playstyleImgs = [];
  document.querySelectorAll('#styleButtons button.active').forEach(btn => {
    const key = btn.dataset.value.trim();
    const img = new Image();
    img.src = `/ffxiv-card/assets/style_icons/${getBasePrefix()}_${key}.png`;
    playstyleImgs.push(img);
    img.onload = drawCanvas;
  });
}

// ======================= プレイ時間（複数 + 自動カテゴリ） ========================
document.querySelectorAll('#timeSection input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    updatePlaytimeImgs();
  });
});

function updatePlaytimeImgs() {
  const prefix = getBasePrefix();
  playtimeImgs = [];
  const checks = Array.from(document.querySelectorAll('#timeSection input[type="checkbox"]'))
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  if (checks.includes('weekday_morning') || checks.includes('weekday_day') || checks.includes('weekday_night') || checks.includes('weekday_late'))
    addPlaytimeImg('weekday');
  if (checks.includes('holiday_morning') || checks.includes('holiday_day') || checks.includes('holiday_night') || checks.includes('holiday_late'))
    addPlaytimeImg('holiday');
  if (checks.includes('unscheduled')) addPlaytimeImg('unscheduled');
  if (checks.includes('eorzea')) addPlaytimeImg('eorzea');

  function addPlaytimeImg(key) {
    const img = new Image();
    img.src = `/ffxiv-card/assets/time_icons/${prefix}_${key}.png`;
    playtimeImgs.push(img);
    img.onload = drawCanvas;
  }
}

// ======================= 高難易度コンテンツ ========================
document.querySelectorAll('#difficultySection input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    difficultyImgs = [];
    document.querySelectorAll('#difficultySection input[type="checkbox"]:checked').forEach(cb => {
      const key = cb.value.trim();
      const img = new Image();
      img.src = `/ffxiv-card/assets/difficulty_icons/${getBasePrefix()}_${key}.png`;
      difficultyImgs.push(img);
      img.onload = drawCanvas;
    });
  });
});

// ======================= メインジョブ ========================
mainjobSelect.addEventListener('change', () => {
  const jobKey = mainjobSelect.value.trim();
  mainjobImg = null;
  if (jobKey) {
    mainjobImg = new Image();
    mainjobImg.src = `/ffxiv-card/assets/mainjob_icons/${getBasePrefix()}_main_${jobKey}.png`;
    mainjobImg.onload = drawCanvas;
  } else drawCanvas();
});

// ======================= サブジョブ ========================
document.querySelectorAll('#subjobSection input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    subjobImgs = [];
    document.querySelectorAll('#subjobSection input[type="checkbox"]:checked').forEach(cb => {
      const key = cb.value.trim();
      const img = new Image();
      img.src = `/ffxiv-card/assets/subjob_icons/${getBasePrefix()}_sub_${key}.png`;
      subjobImgs.push(img);
      img.onload = drawCanvas;
    });
  });
});

// ======================= Canvas描画 ========================
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }
  if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  drawNameText();

  const allOverlayImgs = [
    raceImg,
    dcImg,
    ...progressImgs,
    ...playstyleImgs,
    ...playtimeImgs,
    ...difficultyImgs,
    mainjobImg,
    ...subjobImgs
  ];
  allOverlayImgs.forEach(img => {
    if (img?.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  });
}

// ======================= 名前描画 ========================
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

// ======================= PNG出力 ========================
document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

// ======================= 起動時反映 ========================
function updateAllOverlayImages() {
  raceSelect.dispatchEvent(new Event('change'));
  dcSelect.dispatchEvent(new Event('change'));
  progressSelect.dispatchEvent(new Event('change'));
  fontSelect.dispatchEvent(new Event('change'));
  mainjobSelect.dispatchEvent(new Event('change'));
  document.querySelectorAll('#styleButtons button.active, #difficultySection input:checked, #subjobSection input:checked, #timeSection input:checked')
    .forEach(el => el.dispatchEvent(new Event('change')));
}
