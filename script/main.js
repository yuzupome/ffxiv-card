// main.js - DOMContentLoaded で完全ラップ済みバージョン

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

  fontSelect?.addEventListener("change", () => {
    selectedFont = fontSelect.value;
    document.documentElement.style.setProperty("--selected-font", selectedFont);
    drawCanvas();
    setTemplateBackground("/ffxiv-card/assets/backgrounds/Gothic_black.png", "template-gothic-black");
  });

  nameInput?.addEventListener("input", drawCanvas);

  raceSelect?.addEventListener("change", () => {
    const race = raceSelect.value;
    raceImg = race ? loadOverlayImage("race_icons", race) : null;
  });

  dcSelect?.addEventListener("change", () => {
    const dc = dcSelect.value;
    dcImg = dc ? loadOverlayImage("dc_icons", dc) : null;
  });

  progressSelect?.addEventListener("change", () => {
    const selected = progressSelect.value;
    const values = selected === "all_clear"
      ? ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon", "all_clear"]
      : selected === "ougon" ? ["shinsei", "souten", "guren", "shikkoku", "gyougetsu", "ougon"]
      : selected === "gyougetsu" ? ["shinsei", "souten", "guren", "shikkoku", "gyougetsu"]
      : selected === "shikkoku" ? ["shinsei", "souten", "guren", "shikkoku"]
      : selected === "guren" ? ["shinsei", "souten", "guren"]
      : selected === "souten" ? ["shinsei", "souten"]
      : selected === "shinsei" ? ["shinsei"]
      : [];
    progressImgs = values.map(val => loadOverlayImage("progress_icons", val));
  });

  styleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      updatePlaystyleImages();
    });
  });

  timeCheckboxes.forEach(cb => cb.addEventListener("change", updateTimeIcons));
  timeOtherCheckboxes.forEach(cb => cb.addEventListener("change", updateTimeIcons));
  difficultyCheckboxes.forEach(cb => cb.addEventListener("change", updateDifficultyIcons));

  mainJobSelect?.addEventListener("change", () => {
    const key = mainJobSelect.value;
    mainJobImg = key ? loadJobImage("main", key) : null;
  });

  subJobCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const selected = [...subJobCheckboxes].filter(c => c.checked).map(c => c.value);
      subJobImgs = selected.map(key => loadJobImage("sub", key));
    });
  });

  const uploadInput = document.getElementById("uploadImage");
  if (uploadInput) {
    uploadInput.addEventListener("change", e => {
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
  }

  canvas.addEventListener("mousedown", e => {
    if (!uploadedImgState) return;
    uploadedImgState.dragging = true;
    uploadedImgState.offsetX = e.offsetX - uploadedImgState.x;
    uploadedImgState.offsetY = e.offsetY - uploadedImgState.y;
  });

  canvas.addEventListener("mousemove", e => {
    if (uploadedImgState?.dragging) {
      uploadedImgState.x = e.offsetX - uploadedImgState.offsetX;
      uploadedImgState.y = e.offsetY - uploadedImgState.offsetY;
      drawCanvas();
    }
  });

  canvas.addEventListener("mouseup", () => {
    if (uploadedImgState) uploadedImgState.dragging = false;
  });

  canvas.addEventListener("wheel", e => {
    if (uploadedImgState) {
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      uploadedImgState.width *= 1 + delta;
      uploadedImgState.height *= 1 + delta;
      uploadedImgState.x -= (uploadedImgState.width * delta) / 2;
      uploadedImgState.y -= (uploadedImgState.height * delta) / 2;
      drawCanvas();
    }
  });

  let lastTouchDist = null;
  canvas.addEventListener("touchstart", e => {
    if (!uploadedImgState) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      uploadedImgState.dragging = true;
      uploadedImgState.offsetX = touch.clientX - uploadedImgState.x;
      uploadedImgState.offsetY = touch.clientY - uploadedImgState.y;
    } else if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  });

  canvas.addEventListener("touchmove", e => {
    if (!uploadedImgState) return;
    if (e.touches.length === 1 && uploadedImgState.dragging) {
      const touch = e.touches[0];
      uploadedImgState.x = touch.clientX - uploadedImgState.offsetX;
      uploadedImgState.y = touch.clientY - uploadedImgState.offsetY;
      drawCanvas();
    } else if (e.touches.length === 2) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = currentDist / lastTouchDist;
      uploadedImgState.width *= delta;
      uploadedImgState.height *= delta;
      uploadedImgState.x -= (uploadedImgState.width * (delta - 1)) / 2;
      uploadedImgState.y -= (uploadedImgState.height * (delta - 1)) / 2;
      lastTouchDist = currentDist;
      drawCanvas();
    }
    e.preventDefault();
  });

  canvas.addEventListener("touchend", () => {
    if (uploadedImgState) uploadedImgState.dragging = false;
    lastTouchDist = null;
  });

  document.getElementById("downloadBtn")?.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "ffxiv_card.png";
    link.href = canvas.toDataURL();
    link.click();
  });

  document.getElementById("templateButtons")?.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") {
      const bg = e.target.dataset.bg;
      const className = e.target.dataset.class;
      if (bg && className) setTemplateBackground(bg, className);
    }
  });

  function loadOverlayImage(dir, key) {
    const template = getTemplateClass();
    const img = new Image();
    img.src = `/ffxiv-card/assets/${dir}/Gothic_${template}_${key}.png`;
    img.onload = drawCanvas;
    img.onerror = () => console.warn(`画像の読み込みに失敗しました: ${img.src}`);
    return img;
  }

  function loadJobImage(type, key) {
    const template = getTemplateClass();
    const dir = type === "main" ? "mainjob_icons" : "subjob_icons";
    const prefix = type === "main" ? "main" : "sub";
    const img = new Image();
    img.src = `/ffxiv-card/assets/${dir}/Gothic_${template}_${prefix}_${key}.png`;
    img.onload = drawCanvas;
    img.onerror = () => console.warn(`画像の読み込みに失敗しました: ${img.src}`);
    return img;
  }

  function getTemplateClass() {
    return document.body.classList.contains("template-gothic-white") ? "white" : "black";
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (uploadedImgState) {
      const { img, x, y, width, height } = uploadedImgState;
      ctx.drawImage(img, x, y, width, height);
    }
    if (backgroundImg) {
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    }
    [raceImg, dcImg, ...progressImgs, ...playstyleImgs, ...timeImgs, ...difficultyImgs, mainJobImg, ...subJobImgs]
      .filter(Boolean)
      .forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
    drawNameText();
  }

  function drawNameText() {
    const name = nameInput.value;
    if (!name) return;
    const x = parseInt(getComputedStyle(document.body).getPropertyValue("--name-area-x"));
    const y = parseInt(getComputedStyle(document.body).getPropertyValue("--name-area-y"));
    const width = parseInt(getComputedStyle(document.body).getPropertyValue("--name-area-width"));
    const height = parseInt(getComputedStyle(document.body).getPropertyValue("--name-area-height"));
    const color = getComputedStyle(document.body).getPropertyValue("--name-color").trim();
    const fontSize = Math.floor(height * 0.5);
    ctx.font = `${fontSize}px ${selectedFont}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, x + width / 2, y + height / 2);
  }

  function setTemplateBackground(path, templateClass) {
    backgroundImg = new Image();
    backgroundImg.src = path;
    backgroundImg.onload = () => {
      document.body.className = templateClass;
      updatePlaystyleImages();
      updateTimeIcons();
      updateDifficultyIcons();
      const race = raceSelect.value;
      raceImg = race ? loadOverlayImage("race_icons", race) : null;
      const dc = dcSelect.value;
      dcImg = dc ? loadOverlayImage("dc_icons", dc) : null;
      const mainJob = mainJobSelect ? mainJobSelect.value : null;
      mainJobImg = mainJob ? loadJobImage("main", mainJob) : null;
      const selectedSub = [...subJobCheckboxes].filter(c => c.checked).map(c => c.value);
      subJobImgs = selectedSub.map(key => loadJobImage("sub", key));
      drawCanvas();
    };
  }

  function updateTimeIcons() {
    const template = getTemplateClass();
    const activeKeys = [];
    let weekdayActive = false, holidayActive = false;

    timeCheckboxes.forEach(cb => {
      if (cb.checked) {
        const val = cb.value;
        const key = cb.classList.contains("weekday") ? `weekday_${val}`
                  : cb.classList.contains("holiday") ? `holiday_${val}`
                  : val;
        activeKeys.push(key);
        if (key.startsWith("weekday")) weekdayActive = true;
        if (key.startsWith("holiday")) holidayActive = true;
      }
    });

    if (weekdayActive) activeKeys.push("weekday");
    if (holidayActive) activeKeys.push("holiday");

    timeOtherCheckboxes.forEach(cb => {
      if (cb.checked) activeKeys.push(cb.value);
    });

    timeImgs = activeKeys.map(key => loadOverlayImage("time_icons", key));
    drawCanvas();
  }
