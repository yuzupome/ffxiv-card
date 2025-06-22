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

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
const raceSelect = document.getElementById('raceSelect');
const dcSelect = document.getElementById('dcSelect');
const progressSelect = document.getElementById('progressSelect');
const styleSelect = document.getElementById('styleSelect');

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

progressSelect.addEventListener('change', () => {
  const value = progressSelect.value;
  const templateClass = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
  progressImgs = [];

  if (!value) {
    drawCanvas();
    return;
  }

  const progressOrder = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
  const selectedKeys = value === 'all_clear'
    ? [...progressOrder, 'all_clear']
    : progressOrder.slice(0, progressOrder.indexOf(value) + 1);

  let loadedCount = 0;
  const total = selectedKeys.length;

  selectedKeys.forEach((key) => {
    const img = new Image();
    img.src = `/ffxiv-card/assets/progress_icons/${templateClass}_${key}.png`;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === total) drawCanvas();
    };
    progressImgs.push(img);
  });
});

styleSelect.addEventListener('change', () => {
  const templateClass = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
  const selected = Array.from(styleSelect.selectedOptions).map(opt => opt.value);

  styleImgs = [];
  let loaded = 0;
  const total = selected.length;

  if (total === 0) {
    drawCanvas();
    return;
  }

  selected.forEach((value) => {
    const img = new Image();
    img.src = `/ffxiv-card/assets/style_icons/${templateClass}_${value}.png`;
    img.onload = () => {
      loaded++;
      if (loaded === total) drawCanvas();
    };
    styleImgs.push(img);
  });
});

function setTemplateBackground(path, templateClass) {
  backgroundImg = new Image();
  backgroundImg.src = path;
  backgroundImg.onload = () => {
    document.body.className = templateClass;

    const race = raceSelect.value;
    if (race) {
      raceImg = new Image();
      const base = templateClass;
      raceImg.src = `/ffxiv-card/assets/race_icons/${base}_${race}.png`;
      raceImg.onload = () => {
        const dc = dcSelect?.value;
        if (dc) {
          dcImg = new Image();
          dcImg.src = `/ffxiv-card/assets/dc_icons/${base}_${dc}.png`;
          dcImg.onload = () => {
            progressSelect.dispatchEvent(new Event('change'));
            styleSelect.dispatchEvent(new Event('change'));
          };
        } else {
          progressSelect.dispatchEvent(new Event('change'));
          styleSelect.dispatchEvent(new Event('change'));
        }
      };
    } else {
      progressSelect.dispatchEvent(new Event('change'));
      styleSelect.dispatchEvent(new Event('change'));
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
  if (styleImgs.length > 0) {
    for (const img of styleImgs) {
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
