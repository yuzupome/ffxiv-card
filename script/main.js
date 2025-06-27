// main.js - 修正版（プレイ時間・高難易度・メインジョブ描画修正、イベントバインド修正）

// 初期設定
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

// 背景切り替え
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

// 画像アップロード
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

// 描画処理
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }
  if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  drawNameText();
  [raceImg, dcImg, ...progressImgs, ...styleImgs, ...timeImgs, ...difficultyImgs, mainJobImg, ...subJobImgs].forEach(img => {
    if (img && img.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

// 選択反映（背景変更含む）
function handleAllSelections() {
  const templateClass = document.body.classList.contains("template-gothic-white") ? "Gothic_white" : "Gothic_black";

  const loadImage = (path) => {
    const img = new Image();
    img.onload = drawCanvas;
    img.src = path;
    return img;
  };

  // 種族・DC
  const race = document.getElementById("raceSelect")?.value;
  raceImg = race ? loadImage(`/ffxiv-card/assets/race_icons/${templateClass}_${race}.png`) : null;

  const dc = document.getElementById("dcSelect")?.value;
  dcImg = dc ? loadImage(`/ffxiv-card/assets/dc_icons/${templateClass}_${dc}.png`) : null;

  // 進行度（累積）
  const progress = document.getElementById("progressSelect")?.value;
  const keys = ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon"];
  const progressKeys = progress
    ? progress === "all_clear"
      ? [...keys, "all_clear"]
      : keys.slice(0, keys.indexOf(progress) + 1)
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
  document.querySelectorAll("#playtimeOptions input:checked").forEach(cb => {
    const k = cb.value.trim();
    if (["morning","noon","night","midnight"].includes(k)) {
      const parent = cb.classList.contains("weekday") ? "weekday" : cb.classList.contains("holiday") ? "holiday" : "";
      if (parent) {
        times.add(parent);
        timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_${parent}_${k}.png`));
      }
    } else {
      timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_${k}.png`));
    }
  });
  if (times.has("weekday")) timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_weekday.png`));
  if (times.has("holiday")) timeImgs.push(loadImage(`/ffxiv-card/assets/time_icons/${templateClass}_holiday.png`));

  // 高難易度
  difficultyImgs = [];
  document.querySelectorAll("#difficultyOptions input:checked").forEach(cb => {
    const k = cb.value.trim();
    difficultyImgs.push(loadImage(`/ffxiv-card/assets/difficulty_icons/${templateClass}_${k}.png`));
  });

  // メインジョブ
  const mainJob = document.getElementById("mainjobSelect")?.value;
  mainJobImg = mainJob ? loadImage(`/ffxiv-card/assets/mainjob_icons/${templateClass}_main_${mainJob}.png`) : null;

  // サブジョブ
  subJobImgs = [];
  document.querySelectorAll("#subjobSection input:checked").forEach(cb => {
    const key = cb.value.trim();
    subJobImgs.push(loadImage(`/ffxiv-card/assets/subjob_icons/${templateClass}_sub_${key}.png`));
  });

  drawCanvas();
}

// 各イベント
["raceSelect", "dcSelect", "progressSelect", "mainjobSelect"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", handleAllSelections);
});
document.querySelectorAll("#styleButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    handleAllSelections();
  });
});
document.querySelectorAll("#playtimeOptions input, #difficultyOptions input, #subjobSection input").forEach(cb => {
  cb.addEventListener("change", handleAllSelections);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "ffxiv_card.png";
  link.href = canvas.toDataURL();
  link.click();
});
