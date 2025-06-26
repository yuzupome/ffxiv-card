
// main.js - 全機能統合最新版（2025-06-27）

const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 3750;
canvas.height = 2250;

let backgroundImg = null;
let uploadedImgState = null;
let selectedFont = 'Orbitron, sans-serif';

const imageLayers = {
  race: null,
  dc: null,
  progress: [],
  playstyle: [],
  playtime: [],
  difficulty: [],
  mainjob: null,
  subjob: []
};

const nameInput = document.getElementById('nameInput');
const fontSelect = document.getElementById('fontSelect');
const raceSelect = document.getElementById('raceSelect');
const dcSelect = document.getElementById('dcSelect');
const progressSelect = document.getElementById('progressSelect');
const mainjobSelect = document.getElementById('mainjobSelect');
const subjobCheckboxes = document.querySelectorAll('#subjobSection input[type="checkbox"]');

fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  document.documentElement.style.setProperty('--selected-font', selectedFont);
  drawCanvas();
});

nameInput.addEventListener('input', drawCanvas);

function getTemplateBase() {
  return document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
}

function loadImage(path, callback) {
  const img = new Image();
  img.onload = () => callback(img);
  img.src = path;
}

raceSelect.addEventListener('change', () => {
  const race = raceSelect.value;
  if (!race) {
    imageLayers.race = null;
    drawCanvas();
    return;
  }
  const base = getTemplateBase();
  loadImage(`/ffxiv-card/assets/race_icons/${base}_${race}.png`, img => {
    imageLayers.race = img;
    drawCanvas();
  });
});

dcSelect.addEventListener('change', () => {
  const dc = dcSelect.value;
  if (!dc) {
    imageLayers.dc = null;
    drawCanvas();
    return;
  }
  const base = getTemplateBase();
  loadImage(`/ffxiv-card/assets/dc_icons/${base}_${dc}.png`, img => {
    imageLayers.dc = img;
    drawCanvas();
  });
});

progressSelect.addEventListener('change', () => {
  const selected = progressSelect.value;
  const order = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
  const base = getTemplateBase();
  imageLayers.progress = [];
  if (selected) {
    const index = order.indexOf(selected);
    for (let i = 0; i <= index; i++) {
      loadImage(`/ffxiv-card/assets/progress_icons/${base}_${order[i]}.png`, img => {
        imageLayers.progress.push(img);
        drawCanvas();
      });
    }
  } else {
    drawCanvas();
  }
});

document.querySelectorAll('#styleButtons button').forEach(button => {
  button.addEventListener('click', () => {
    const value = button.dataset.value;
    if (button.classList.toggle('active')) {
      const base = getTemplateBase();
      loadImage(`/ffxiv-card/assets/style_icons/${base}_${value}.png`, img => {
        imageLayers.playstyle.push({ value, img });
        drawCanvas();
      });
    } else {
      imageLayers.playstyle = imageLayers.playstyle.filter(e => e.value !== value);
      drawCanvas();
    }
  });
});

document.querySelectorAll('#timeSection input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const base = getTemplateBase();
    const states = {
      weekday: ['morning', 'noon', 'night', 'midnight'].some(v =>
        document.getElementById(`time-weekday-${v}`).checked),
      holiday: ['morning', 'noon', 'night', 'midnight'].some(v =>
        document.getElementById(`time-holiday-${v}`).checked),
      free: document.getElementById('time-free').checked,
      eorzea: document.getElementById('time-eorzea').checked
    };

    imageLayers.playtime = [];
    Object.entries(states).forEach(([key, isOn]) => {
      if (isOn) {
        loadImage(`/ffxiv-card/assets/time_icons/${base}_${key}.png`, img => {
          imageLayers.playtime.push({ key, img });
          drawCanvas();
        });
      }
    });
  });
});

document.querySelectorAll('#difficultySection input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const base = getTemplateBase();
    imageLayers.difficulty = [];
    document.querySelectorAll('#difficultySection input[type="checkbox"]:checked').forEach(cb => {
      loadImage(`/ffxiv-card/assets/difficulty_icons/${base}_${cb.value}.png`, img => {
        imageLayers.difficulty.push({ value: cb.value, img });
        drawCanvas();
      });
    });
  });
});

mainjobSelect.addEventListener('change', () => {
  const job = mainjobSelect.value;
  const base = getTemplateBase();
  if (!job) {
    imageLayers.mainjob = null;
    drawCanvas();
    return;
  }
  loadImage(`/ffxiv-card/assets/mainjob_icons/${base}_main_${job}.png`, img => {
    imageLayers.mainjob = img;
    drawCanvas();
  });
});

subjobCheckboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    const base = getTemplateBase();
    imageLayers.subjob = [];
    document.querySelectorAll('#subjobSection input[type="checkbox"]:checked').forEach(cb => {
      loadImage(`/ffxiv-card/assets/subjob_icons/${base}_sub_${cb.value}.png`, img => {
        imageLayers.subjob.push({ value: cb.value, img });
        drawCanvas();
      });
    });
  });
});

document.getElementById('templateButtons')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const bg = e.target.dataset.bg;
    const className = e.target.dataset.class;
    if (bg && className) {
      backgroundImg = new Image();
      backgroundImg.src = bg;
      backgroundImg.onload = () => {
        document.body.className = className;
        // 再描画
        raceSelect.dispatchEvent(new Event('change'));
        dcSelect.dispatchEvent(new Event('change'));
        progressSelect.dispatchEvent(new Event('change'));
        mainjobSelect.dispatchEvent(new Event('change'));
        document.querySelectorAll('#styleButtons button.active').forEach(btn => btn.click());
        document.querySelectorAll('#styleButtons button.active').forEach(btn => btn.click());
        document.querySelectorAll('#subjobSection input[type="checkbox"]:checked').forEach(cb => cb.dispatchEvent(new Event('change')));
        document.querySelectorAll('#difficultySection input[type="checkbox"]:checked').forEach(cb => cb.dispatchEvent(new Event('change')));
        document.querySelectorAll('#timeSection input[type="checkbox"]').forEach(cb => cb.dispatchEvent(new Event('change')));
      };
    }
  }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ffxiv_card.png';
  link.href = canvas.toDataURL();
  link.click();
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImgState) {
    const { img, x, y, width, height } = uploadedImgState;
    ctx.drawImage(img, x, y, width, height);
  }
  if (backgroundImg) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  drawNameText();

  // 描画順序に従って各レイヤーを描画
  const ordered = ['race', 'dc', 'progress', 'playstyle', 'playtime', 'difficulty', 'subjob', 'mainjob'];
  ordered.forEach(key => {
    const val = imageLayers[key];
    if (Array.isArray(val)) {
      val.forEach(e => ctx.drawImage(e.img, 0, 0, canvas.width, canvas.height));
    } else if (val) {
      ctx.drawImage(val, 0, 0, canvas.width, canvas.height);
    }
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
