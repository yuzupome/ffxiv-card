// ✅ main.js - 完全統合バージョン（main (4).js ベース + 不具合修正済）

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("cardCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 3750;
  canvas.height = 2250;

  let backgroundImg = null;
  let uploadedImgState = null;
  let selectedFont = "Orbitron, sans-serif";
  let raceImg = null;
  let dcImg = null;
  let progressImgs = [];
  let playstyleImgs = [];
  let timeImgs = [];
  let difficultyImgs = [];
  let mainJobImg = null;
  let subJobImgs = [];

  const nameInput = document.getElementById("nameInput");
  const fontSelect = document.getElementById("fontSelect");
  const raceSelect = document.getElementById("raceSelect");
  const dcSelect = document.getElementById("dcSelect");
  const progressSelect = document.getElementById("progressSelect");
  const styleButtons = document.querySelectorAll("#styleButtons button");
  const timeCheckboxes = document.querySelectorAll(".time-checkbox, .weekday, .holiday");
  const timeOtherCheckboxes = document.querySelectorAll(".time-other, .other");
  const difficultyCheckboxes = document.querySelectorAll(".difficulty-checkbox, .difficulty");
  const mainJobSelect = document.getElementById("mainJobSelect");
  const subJobCheckboxes = document.querySelectorAll(".subjob-checkbox, .subjob");
  const templateButtons = document.querySelectorAll("#templateButtons button");
  const uploadImageInput = document.getElementById("uploadImage");
  const downloadBtn = document.getElementById("downloadBtn");

  fontSelect?.addEventListener("change", () => {
    selectedFont = fontSelect.value;
    drawCanvas();
  });

  nameInput?.addEventListener("input", drawCanvas);

  uploadImageInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        uploadedImgState = {
          img,
          x: canvas.width / 2 - img.width / 2,
          y: canvas.height / 2 - img.height / 2,
          width: img.width,
          height: img.height,
        };
        drawCanvas();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  let dragging = false;
  let dragOffsetX, dragOffsetY;
  canvas.addEventListener("mousedown", (e) => {
    if (!uploadedImgState) return;
    dragging = true;
    dragOffsetX = e.offsetX - uploadedImgState.x;
    dragOffsetY = e.offsetY - uploadedImgState.y;
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!dragging || !uploadedImgState) return;
    uploadedImgState.x = e.offsetX - dragOffsetX;
    uploadedImgState.y = e.offsetY - dragOffsetY;
    drawCanvas();
  });
  canvas.addEventListener("mouseup", () => {
    dragging = false;
  });
  canvas.addEventListener("wheel", (e) => {
    if (!uploadedImgState) return;
    const scale = e.deltaY < 0 ? 1.05 : 0.95;
    uploadedImgState.width *= scale;
    uploadedImgState.height *= scale;
    drawCanvas();
  });
  canvas.addEventListener("touchstart", (e) => {
    if (!uploadedImgState || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    dragging = true;
    dragOffsetX = touch.clientX - rect.left - uploadedImgState.x;
    dragOffsetY = touch.clientY - rect.top - uploadedImgState.y;
  });
  canvas.addEventListener("touchmove", (e) => {
    if (!dragging || !uploadedImgState || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    uploadedImgState.x = touch.clientX - rect.left - dragOffsetX;
    uploadedImgState.y = touch.clientY - rect.top - dragOffsetY;
    drawCanvas();
  });
  canvas.addEventListener("touchend", () => {
    dragging = false;
  });

  templateButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.bg;
      const templateClass = btn.dataset.class;
      setTemplateBackground(path, templateClass);
    });
  });

  downloadBtn?.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "character_card.png";
    link.href = canvas.toDataURL();
    link.click();
  });

  raceSelect?.addEventListener("change", () => {
    raceImg = loadOverlayImage("race_icons", raceSelect.value);
    drawCanvas();
  });

  dcSelect?.addEventListener("change", () => {
    dcImg = loadOverlayImage("dc_icons", dcSelect.value);
    drawCanvas();
  });

  progressSelect?.addEventListener("change", () => {
    progressImgs = getProgressImages(progressSelect.value);
    drawCanvas();
  });

  styleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      updatePlaystyleImages();
    });
  });

  timeCheckboxes.forEach((cb) => cb.addEventListener("change", updateTimeIcons));
  timeOtherCheckboxes.forEach((cb) => cb.addEventListener("change", updateTimeIcons));
  difficultyCheckboxes.forEach((cb) => cb.addEventListener("change", updateDifficultyIcons));

  mainJobSelect?.addEventListener("change", () => {
    mainJobImg = loadJobImage("main", mainJobSelect.value);
    drawCanvas();
  });

  subJobCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const selected = [...subJobCheckboxes].filter((c) => c.checked).map((c) => c.value);
      subJobImgs = selected.map((key) => loadJobImage("sub", key));
      drawCanvas();
    });
  });

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    if (uploadedImgState) {
      ctx.drawImage(uploadedImgState.img, uploadedImgState.x, uploadedImgState.y, uploadedImgState.width, uploadedImgState.height);
    }
    [raceImg, dcImg, ...progressImgs, ...playstyleImgs, ...timeImgs, ...difficultyImgs, mainJobImg, ...subJobImgs]
      .filter(Boolean)
      .forEach((img) => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
    drawNameText();
  }

  function drawNameText() {
    if (!nameInput?.value) return;
    ctx.font = `150px ${selectedFont}`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nameInput.value, canvas.width / 2 - 100, canvas.height / 2);
  }

  function getTemplateClass() {
    return document.body.classList.contains("template-gothic-white") ? "white" : "black";
  }

  function loadOverlayImage(folder, key) {
    const template = getTemplateClass();
    const img = new Image();
    img.src = `/ffxiv-card/assets/${folder}/Gothic_${template}_${key}.png`;
    return img;
  }

  function loadJobImage(type, key) {
  if (!key) return null;
  const folder = type === "main" ? "mainjob_icons" : "subjob_icons";
  return loadOverlayImage(folder, `${type}_${key}`);
}_${key}`);
}_${key}`);
}_${key}`);
  }

  function getProgressImages(selected) {
    const levels = ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon", "all_clear"];
    const index = levels.indexOf(selected);
    return index >= 0 ? levels.slice(0, index + 1).map((key) => loadOverlayImage("progress_icons", key)) : [];
  }

  function updatePlaystyleImages() {
    const selected = [...styleButtons].filter((btn) => btn.classList.contains("active")).map((btn) => btn.dataset.value);
    playstyleImgs = selected.map((key) => loadOverlayImage("style_icons", key));
    drawCanvas();
  }

  function updateTimeIcons() {
    const selected = [...timeCheckboxes, ...timeOtherCheckboxes].filter((cb) => cb.checked).map((cb) => cb.value);
    timeImgs = selected.map((key) => loadOverlayImage("time_icons", key));
    drawCanvas();
  }

  function updateDifficultyIcons() {
    const selected = [...difficultyCheckboxes].filter((cb) => cb.checked).map((cb) => cb.value);
    difficultyImgs = selected.map((key) => loadOverlayImage("difficulty_icons", key));
    drawCanvas();
  }

  function setTemplateBackground(path, templateClass) {
    backgroundImg = new Image();
    backgroundImg.src = path;
    backgroundImg.onload = () => {
      document.body.className = templateClass;

      updatePlaystyleImages();
      updateTimeIcons();
      updateDifficultyIcons();

      raceImg = loadOverlayImage("race_icons", raceSelect.value);
      dcImg = loadOverlayImage("dc_icons", dcSelect.value);
      mainJobImg = loadJobImage("main", mainJobSelect.value);
      const selected = [...subJobCheckboxes].filter((c) => c.checked).map((c) => c.value);
      subJobImgs = selected.map((key) => loadJobImage("sub", key));
      progressImgs = getProgressImages(progressSelect.value);

      setTimeout(drawCanvas, 50);
    };
}
  }
});
