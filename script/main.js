/**
 * FFXIV Character Card Generator Script (v7)
 *
 * アップロード画像の描画品質を向上させ、名前の描画位置を最終調整した改修版です。
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 【重要】Google FontsをHTML側で読み込んでください ---
    // このスクリプトが正しくフォントを描画するためには、
    // HTMLファイルの<head>タグ内にGoogle Fontsの<link>タグが必要です。
    // 例: <link href="https://fonts.googleapis.com/css2?family=Orbitron&display=swap" rel="stylesheet">

    // --- 必要なHTML要素のチェック ---
    const requiredElementIds = [ 'cardCanvas', 'nameInput', 'fontSelect', 'uploadImage', 'templateButtons', 'raceSelect', 'dcSelect', 'progressSelect', 'styleButtons', 'playtimeOptions', 'difficultyOptions', 'mainjobSelect', 'subjobSection', 'downloadBtn' ];
    if (requiredElementIds.some(id => !document.getElementById(id))) {
        console.error('必須要素が見つかりません。HTMLのIDを確認してください。');
        alert('ページの初期化に失敗しました。');
        return;
    }

    // --- DOM要素の取得 ---
    const canvas = document.getElementById('cardCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 3750;
    canvas.height = 2250;

    // ★描画品質を「高」に設定
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const nameInput = document.getElementById('nameInput');
    const fontSelect = document.getElementById('fontSelect');
    const uploadImageInput = document.getElementById('uploadImage');
    const templateButtons = document.querySelectorAll('#templateButtons button');
    const raceSelect = document.getElementById('raceSelect');
    const dcSelect = document.getElementById('dcSelect');
    const progressSelect = document.getElementById('progressSelect');
    const styleButtons = document.querySelectorAll('#styleButtons button');
    const playtimeCheckboxes = document.querySelectorAll('#playtimeOptions input[type="checkbox"]');
    const difficultyCheckboxes = document.querySelectorAll('#difficultyOptions input[type="checkbox"]');
    const mainJobSelect = document.getElementById('mainjobSelect');
    const subJobCheckboxes = document.querySelectorAll('#subjobSection input[type="checkbox"]');
    const downloadBtn = document.getElementById('downloadBtn');

    // --- 状態管理オブジェクト ---
    let state = {
        background: null, raceIcon: null, dcIcon: null, progressIcons: [], styleIcons: [],
        timeIcons: [], difficultyIcons: [], mainJobIcon: null, subJobIcons: [],
        font: 'Orbitron, sans-serif', nameColor: '#ffffff'
    };
    
    // --- 画像操作用の状態管理 ---
    let imageTransform = {
        img: null, x: canvas.width / 2, y: canvas.height / 2, scale: 1.0,
        isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0
    };
    
    // --- 画像キャッシュ ---
    const imageCache = {};
    function loadImage(path) {
        if (!path) return Promise.resolve(null);
        if (imageCache[path]) return imageCache[path];
        const promise = new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => { console.warn(`画像の読み込みに失敗: ${path}`); resolve(null); };
            img.src = path;
        });
        imageCache[path] = promise;
        return promise;
    }

    // --- 描画関連関数 ---
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawUploadedImage();
        drawStretchedImage(state.background);
        const allIcons = [ state.raceIcon, state.dcIcon, ...state.progressIcons, ...state.styleIcons, ...state.timeIcons, ...state.difficultyIcons, ...state.subJobIcons ];
        allIcons.forEach(icon => drawStretchedImage(icon));
        drawStretchedImage(state.mainJobIcon);
        drawNameText();
    }
    
    function drawStretchedImage(img) {
        if (img && img.complete && img.naturalHeight !== 0) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    
    function drawUploadedImage() {
        if (imageTransform.img && imageTransform.img.complete && imageTransform.img.naturalHeight !== 0) {
            ctx.save();
            ctx.translate(imageTransform.x, imageTransform.y);
            ctx.scale(imageTransform.scale, imageTransform.scale);
            ctx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
            ctx.restore();
        }
    }

    function drawNameText() {
        const name = nameInput.value;
        if (!name) return;
        const nameArea = { x: 150, y: 150, width: 1000, height: 300 };
        const FONT_SIZE = 200;
        // ★座標オフセットを最終調整
        const charWidthApproximation = FONT_SIZE * 0.5;
        const offsetX = -4 * charWidthApproximation; // 4文字分左へ
        const offsetY = 0.5 * FONT_SIZE; // 0.5文字分下へ

        const centerX = (nameArea.x + nameArea.width / 2) + offsetX;
        const centerY = (nameArea.y + nameArea.height / 2) + offsetY;

        ctx.fillStyle = state.nameColor;
        ctx.font = `${FONT_SIZE}px ${state.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, centerX, centerY);
    }

    // --- 更新処理 ---
    async function updateAndRedraw() {
        const prefix = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
        state.nameColor = (prefix === 'Gothic_white') ? '#000000' : '#ffffff';
        state.font = fontSelect.value;
        const promises = [];
        promises.push(loadImage(`./assets/backgrounds/${prefix}.png`).then(img => state.background = img));
        promises.push(raceSelect.value ? loadImage(`./assets/race_icons/${prefix}_${raceSelect.value}.png`).then(img => state.raceIcon = img) : Promise.resolve(state.raceIcon = null));
        promises.push(dcSelect.value ? loadImage(`./assets/dc_icons/${prefix}_${dcSelect.value}.png`).then(img => state.dcIcon = img) : Promise.resolve(state.dcIcon = null));
        promises.push(mainJobSelect.value ? loadImage(`./assets/mainjob_icons/${prefix}_main_${mainJobSelect.value}.png`).then(img => state.mainJobIcon = img) : Promise.resolve(state.mainJobIcon = null));
        const progressStages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
        let progressToLoad = [];
        if (progressSelect.value) {
            progressToLoad = (progressSelect.value === 'all_clear') ? [...progressStages, 'all_clear'] : progressStages.slice(0, progressStages.indexOf(progressSelect.value) + 1);
        }
        promises.push(Promise.all(progressToLoad.map(p => loadImage(`./assets/progress_icons/${prefix}_${p}.png`))).then(imgs => state.progressIcons = imgs.filter(Boolean)));
        const activeStyles = Array.from(styleButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.dataset.value);
        promises.push(Promise.all(activeStyles.map(s => loadImage(`./assets/style_icons/${prefix}_${s}.png`))).then(imgs => state.styleIcons = imgs.filter(Boolean)));
        const timePaths = new Set();
        const checkedTimes = Array.from(playtimeCheckboxes).filter(cb => cb.checked);
        checkedTimes.forEach(cb => {
            timePaths.add(cb.classList.contains('other') ? `./assets/time_icons/${prefix}_${cb.value}.png` : `./assets/time_icons/${prefix}_${cb.className}_${cb.value}.png`);
        });
        if (checkedTimes.some(cb => cb.classList.contains('weekday'))) timePaths.add(`./assets/time_icons/${prefix}_weekday.png`);
        if (checkedTimes.some(cb => cb.classList.contains('holiday'))) timePaths.add(`./assets/time_icons/${prefix}_holiday.png`);
        promises.push(Promise.all(Array.from(timePaths).map(path => loadImage(path))).then(imgs => state.timeIcons = imgs.filter(Boolean)));
        const activeDifficulties = Array.from(difficultyCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        promises.push(Promise.all(activeDifficulties.map(d => loadImage(`./assets/difficulty_icons/${prefix}_${d}.png`))).then(imgs => state.difficultyIcons = imgs.filter(Boolean)));
        const activeSubJobs = Array.from(subJobCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        promises.push(Promise.all(activeSubJobs.map(sj => loadImage(`./assets/subjob_icons/${prefix}_sub_${sj}.png`))).then(imgs => state.subJobIcons = imgs.filter(Boolean)));
        await Promise.all(promises);
        drawCanvas();
    }

    // --- イベントリスナー ---
    [nameInput, fontSelect, raceSelect, dcSelect, progressSelect, mainJobSelect].forEach(el => el.addEventListener('input', updateAndRedraw));
    [...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes, ...subJobCheckboxes].forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.currentTarget.tagName === 'BUTTON') e.currentTarget.classList.toggle('active');
            updateAndRedraw();
        });
    });
    templateButtons.forEach(button => {
        button.addEventListener('click', () => { document.body.className = button.dataset.class; updateAndRedraw(); });
    });
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            loadImage(event.target.result).then(img => {
                if (!img) return;
                imageTransform.img = img;
                imageTransform.scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
                imageTransform.x = canvas.width / 2;
                imageTransform.y = canvas.height / 2;
                drawCanvas();
            });
        };
        reader.readAsDataURL(file);
    });
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a'); link.download = 'ffxiv_character_card.png';
        link.href = canvas.toDataURL('image/png'); link.click();
    });

    // --- 画像操作イベントリスナー ---
    function getEventLocation(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if (e.touches && e.touches[0]) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    function handleDragStart(e) {
        if (!imageTransform.img) return;
        const loc = getEventLocation(e);
        imageTransform.isDragging = true;
        imageTransform.lastX = loc.x;
        imageTransform.lastY = loc.y;
    }

    function handleDragMove(e) {
        if (!imageTransform.isDragging || !imageTransform.img) return;
        const loc = getEventLocation(e);
        const dx = loc.x - imageTransform.lastX;
        const dy = loc.y - imageTransform.lastY;
        imageTransform.x += dx;
        imageTransform.y += dy;
        imageTransform.lastX = loc.x;
        imageTransform.lastY = loc.y;
        drawCanvas();
    }
    
    function handleDragEnd() { imageTransform.isDragging = false; }

    canvas.addEventListener('mousedown', handleDragStart, { passive: false });
    canvas.addEventListener('mousemove', handleDragMove, { passive: false });
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('mouseleave', handleDragEnd);

    canvas.addEventListener('wheel', (e) => {
        if (!imageTransform.img) return;
        e.preventDefault();
        const scaleAmount = 1.1;
        const newScale = e.deltaY < 0 ? imageTransform.scale * scaleAmount : imageTransform.scale / scaleAmount;
        imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0));
        drawCanvas();
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (!imageTransform.img) return;
        e.preventDefault();
        if (e.touches.length === 1) handleDragStart(e);
        else if (e.touches.length === 2) {
            imageTransform.isDragging = false; // 2本指になったらドラッグは止める
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            imageTransform.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (!imageTransform.img) return;
        e.preventDefault();
        if (e.touches.length === 1 && imageTransform.isDragging) handleDragMove(e);
        else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDist = Math.sqrt(dx * dx + dy * dy);
            if(imageTransform.lastTouchDistance > 0) {
                const newScale = imageTransform.scale * (newDist / imageTransform.lastTouchDistance);
                imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0));
            }
            imageTransform.lastTouchDistance = newDist;
            drawCanvas();
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) imageTransform.isDragging = false;
        imageTransform.lastTouchDistance = 0;
    });
    
    // --- 初期化 ---
    updateAndRedraw();
});
