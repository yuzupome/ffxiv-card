
// main_latest_with_job.js - 最新完全統合版
// 全機能：名前、背景、種族、DC、進行度（累積）、プレイスタイル、プレイ時間（自動判定）、高難易度、メイン＆サブジョブ、画像アップロード＆拡縮・移動対応、テンプレ変更保持

// Canvas初期化
const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 3750;
canvas.height = 2250;

let backgroundImg = null;
let uploadedImgState = null;
let selectedFont = 'Orbitron, sans-serif';
let raceImg = null, dcImg = null;
let progressImgs = [];
let styleImgs = [];
let timeImgs = [];
let difficultyImgs = [];
let mainJobImg = null;
let subJobImgs = [];

const nameInput = document.getElementById("nameInput");
const fontSelect = document.getElementById("fontSelect");
fontSelect.addEventListener("change", () => {
  selectedFont = fontSelect.value;
  document.documentElement.style.setProperty("--selected-font", selectedFont);
  drawCanvas();
});
nameInput.addEventListener("input", drawCanvas);

// 背景テンプレ変更
document.getElementById("templateButtons").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const bg = e.target.dataset.bg;
    const className = e.target.dataset.class;
    if (bg && className) {
      setTemplateBackground(bg, className);
    }
  }
});
function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;
    handleAllSelections();
  };
}

// アップロード画像処理
document.getElementById("uploadImage").addEventListener("change", (e) => {
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

// Canvas描画関数
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }
  if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  drawNameText();
  [raceImg, dcImg, ...progressImgs, ...styleImgs, ...timeImgs, ...difficultyImgs, mainJobImg, ...subJobImgs].forEach(img => {
    if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  });
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

// ダウンロード処理
document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "ffxiv_card.png";
  link.href = canvas.toDataURL();
  link.click();
});

// 選択項目を背景変更時に再読み込み
function handleAllSelections() {
  const templateClass = document.body.classList.contains("template-gothic-white") ? "Gothic_white" : "Gothic_black";

  const loadImage = (path) => {
    const img = new Image();
    img.src = path;
    return img;
  };

  // 各項目処理（種族・DC）
  const race = document.getElementById("raceSelect")?.value;
  raceImg = race ? loadImage(`/ffxiv-card/assets/race_icons/${templateClass}_${race}.png`) : null;

  const dc = document.getElementById("dcSelect")?.value;
  dcImg = dc ? loadImage(`/ffxiv-card/assets/dc_icons/${templateClass}_${dc}.png`) : null;

  // 進行度（累積）
  const progress = document.getElementById("progressSelect")?.value;
  const progressKeys = progress
    ? progress === "all_clear"
      ? ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon", "all_clear"]
      : ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon"].slice(0, ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon"].indexOf(progress) + 1)
    : [];
  progressImgs = progressKeys.map(k => loadImage(`/ffxiv-card/assets/progress_icons/${templateClass}_${k}.png`));

  // プレイスタイル
  styleImgs = [];
  document.querySelectorAll("#styleButtons button.active").forEach(btn => {
    const key = btn.dataset.value.trim();
    styleImgs.push(loadImage(`/ffxiv-card/assets/style_icons/${templateClass}_${key}.png`));
  });

  // プレイ時間
  timeImgs = [];
  const times = new Set();
  const isChecked = (v) => document.getElementById(v)?.checked;
  ["weekday_morning","weekday_noon","weekday_night","weekday_late",
   "holiday_morning","holiday_noon","holiday_night","holiday_late"].forEach(id => {
    if (isChecked(id)) {
      timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_${id}.png`));
      if (id.startsWith("weekday")) times.add("weekday");
      if (id.startsWith("holiday")) times.add("holiday");
    }
  });
  if (times.has("weekday")) timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_weekday.png`));
  if (times.has("holiday")) timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_holiday.png`));
  if (isChecked("irregular")) timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_irregular.png`));
  if (isChecked("resident")) timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_resident.png`));

  // 高難易度
  difficultyImgs = [];
  document.querySelectorAll("#difficultySection input:checked").forEach(cb => {
    const k = cb.value.trim();
    difficultyImgs.push(loadImage(`/ffxiv-card/assets/difficulty_icons/${templateClass}_${k}.png`));
  });

  // メインジョブ
  const mainJob = document.getElementById("mainJobSelect")?.value;
  mainJobImg = mainJob ? loadImage(`/ffxiv-card/assets/mainjob_icons/${templateClass}_main_${mainJob}.png`) : null;

  // サブジョブ
  subJobImgs = [];
  document.querySelectorAll("#subjobSection input:checked").forEach(cb => {
    const key = cb.value.trim();
    subJobImgs.push(loadImage(`/ffxiv-card/assets/subjob_icons/${templateClass}_sub_${key}.png`));
  });

  drawCanvas();
}

// 各UIイベントバインド
["raceSelect", "dcSelect", "progressSelect", "mainJobSelect"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", handleAllSelections);
});
document.querySelectorAll("#styleButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    handleAllSelections();
  });
});
document.querySelectorAll("#timeSection input, #difficultySection input, #subjobSection input").forEach(cb => {
  cb.addEventListener("change", handleAllSelections);
});
