/**
 * FFXIV Character Card Generator Script (Subjob UI Fix)
 *
 * ボタン形式になったサブジョブの選択が正しく機能するように、
 * イベントリスナーと描画ロジックを修正。
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- DOM要素の取得 ---
    const appElement = document.getElementById('app');
    const loaderElement = document.getElementById('loader');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const canvas = document.getElementById('cardCanvas');
    const ctx = canvas.getContext('2d');
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
    // ★★★ サブジョブの要素をボタンとして取得 ★★★
    const subjobButtons = document.querySelectorAll('#subjobSection .button-grid button');
    const downloadBtn = document.getElementById('downloadBtn');

    // --- 初期設定 ---
    canvas.width = 3750;
    canvas.height = 2250;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // --- アセット定義 ---
    const templates = ['Gothic_black', 'Gothic_white'];
    const races = ['au_ra', 'viera', 'roegadyn', 'miqote', 'hyur', 'elezen', 'lalafell', 'hrothgar'];
    const dcs = ['mana', 'gaia', 'elemental', 'meteor'];
    const progresses = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
    const styles = Array.from(styleButtons).map(b => b.dataset.value);
    const playtimes = ['weekday', 'weekday_morning', 'weekday_daytime', 'weekday_night', 'weekday_midnight', 'holiday', 'holiday_morning', 'holiday_daytime', 'holiday_night', 'holiday_midnight', 'random', 'fulltime'];
    const difficulties = ['extreme', 'unreal', 'savage', 'ultimate'];
    const mainJobs = Array.from(mainJobSelect.options).filter(o => o.value).map(o => o.value);
    // ★★★ サブジョブのリストをボタンから生成 ★★★
    const allSubJobs = Array.from(subjobButtons).map(btn => btn.dataset.value);
    
    // --- 画像キャッシュ ---
    const imageCache = {};

    // --- プリロード処理 ---
    let loadedAssetCount = 0;
    let totalAssetCount = 0;

    function updateProgress() {
        loadedAssetCount++;
        const percent = Math.round((loadedAssetCount / totalAssetCount) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${loadedAssetCount} / ${totalAssetCount}`;
    }

    function loadImage(path) {
        if (!path) return Promise.resolve(null);
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { imageCache[path] = img; updateProgress(); resolve(img); };
            img.onerror = () => { console.error(`画像の読み込みに失敗: ${path}`); updateProgress(); resolve(null); };
            img.src = path;
        });
    }

    async function preloadAllAssets() {
        const allImagePaths = new Set();
        templates.forEach(template => {
            allImagePaths.add(`./assets/backgrounds/${template}.png`);
            allImagePaths.add(`./assets/backgrounds/${template}_cp.png`); 
            races.forEach(item => allImagePaths.add(`./assets/race_icons/${template}_${item}.png`));
            dcs.forEach(item => allImagePaths.add(`./assets/dc_icons/${template}_${item}.png`));
            progresses.forEach(item => allImagePaths.add(`./assets/progress_icons/${template}_${item}.png`));
            styles.forEach(item => allImagePaths.add(`./assets/style_icons/${template}_${item}.png`));
            playtimes.forEach(item => allImagePaths.add(`./assets/time_icons/${template}_${item}.png`));
            difficulties.forEach(item => allImagePaths.add(`./assets/difficulty_icons/${template}_${item}.png`));
            mainJobs.forEach(item => allImagePaths.add(`./assets/mainjob_icons/${template}_main_${item}.png`));
            allSubJobs.forEach(item => allImagePaths.add(`./assets/subjob_icons/${template}_sub_${item}.png`));
        });
        
        totalAssetCount = allImagePaths.size;
        progressText.textContent = `0 / ${totalAssetCount}`;
        const promises = Array.from(allImagePaths).map(path => loadImage(path));
        await Promise.all(promises);
    }

    // --- 状態管理 ---
    let imageTransform = {
        img: null, x: canvas.width / 2, y: canvas.height / 2, scale: 1.0,
        isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0
    };

    // --- 描画関数 ---
    function drawCard(useCopyrightBg) { 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawUploadedImage();
        let prefix = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
        if (useCopyrightBg === true) { prefix += '_cp'; }
        const bgImg = imageCache[`./assets/backgrounds/${prefix}.png`];
        drawStretchedImage(bgImg);
        drawIcons();
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
        const nameArea = { x: 98, y: 270, width: 665, height: 120 };
        const MAX_FONT_SIZE = 120;
        const name = nameInput.value;
        if (!name) return;
        let fontSize = MAX_FONT_SIZE;
        const selectedFont = fontSelect.value;
        ctx.font = `${fontSize}px ${selectedFont}`;
        while (ctx.measureText(name).width > nameArea.width && fontSize > 10) {
            fontSize--;
            ctx.font = `${fontSize}px ${selectedFont}`;
        }
        const centerX = nameArea.x + nameArea.width / 2;
        const centerY = nameArea.y + nameArea.height / 2;
        ctx.fillStyle = document.body.classList.contains('template-gothic-white') ? '#000000' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, centerX, centerY);
    }
    
    function drawIcons() {
        const prefix = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
        const draw = (path) => {
            const img = imageCache[path];
            if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        if (raceSelect.value) draw(`./assets/race_icons/${prefix}_${raceSelect.value}.png`);
        if (dcSelect.value) draw(`./assets/dc_icons/${prefix}_${dcSelect.value}.png`);
        if (progressSelect.value) {
            const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
            const toLoad = progressSelect.value === 'all_clear' ? [...stages, 'all_clear'] : stages.slice(0, stages.indexOf(progressSelect.value) + 1);
            toLoad.forEach(p => draw(`./assets/progress_icons/${prefix}_${p}.png`));
        }
        styleButtons.forEach(btn => { if (btn.classList.contains('active')) draw(`./assets/style_icons/${prefix}_${btn.dataset.value}.png`); });
        const timePaths = new Set();
        const checkedTimes = Array.from(playtimeCheckboxes).filter(cb => cb.checked);
        checkedTimes.forEach(cb => timePaths.add(`./assets/time_icons/${prefix}_${cb.className}_${cb.value}.png`));
        if (checkedTimes.some(cb => cb.classList.contains('weekday'))) timePaths.add(`./assets/time_icons/${prefix}_weekday.png`);
        if (checkedTimes.some(cb => cb.classList.contains('holiday'))) timePaths.add(`./assets/time_icons/${prefix}_holiday.png`);
        timePaths.forEach(path => draw(path));
        difficultyCheckboxes.forEach(cb => { if (cb.checked) draw(`./assets/difficulty_icons/${prefix}_${cb.value}.png`); });
        
        // ★★★ サブジョブの描画ロジックをボタンに対応 ★★★
        subjobButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                draw(`./assets/subjob_icons/${prefix}_sub_${btn.dataset.value}.png`);
            }
        });

        if (mainJobSelect.value) draw(`./assets/mainjob_icons/${prefix}_main_${mainJobSelect.value}.png`);
    }

    // --- イベントリスナー ---
    // ★★★ イベントリスナーの対象にサブジョブボタンを追加 ★★★
    const allInputs = [nameInput, fontSelect, raceSelect, dcSelect, progressSelect, mainJobSelect, ...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes, ...subjobButtons];
    allInputs.forEach(el => {
        const eventType = (el.tagName === 'SELECT' || el.type === 'text') ? 'input' : 'click';
        el.addEventListener(eventType, (e) => {
            if (e.currentTarget.tagName === 'BUTTON') { e.currentTarget.classList.toggle('active'); }
            drawCard(false);
        });
    });
    
    templateButtons.forEach(button => {
        button.addEventListener('click', () => { document.body.className = button.dataset.class; drawCard(false); });
    });
    
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                imageTransform.img = img;
                imageTransform.scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
                imageTransform.x = canvas.width / 2;
                imageTransform.y = canvas.height / 2;
                drawCard(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    downloadBtn.addEventListener('click', async () => {
        drawCard(true);
        const link = document.createElement('a');
        link.download = 'ffxiv_character_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        setTimeout(() => drawCard(false), 100);
    });

    // --- 画像操作イベントリスナー ---
    function getEventLocation(e) {
        const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
        if (e.touches && e.touches[0]) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }
    function handleDragStart(e) {
        if (!imageTransform.img) return; const loc = getEventLocation(e);
        imageTransform.isDragging = true; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y;
    }
    function handleDragMove(e) {
        if (!imageTransform.isDragging || !imageTransform.img) return; const loc = getEventLocation(e);
        const dx = loc.x - imageTransform.lastX; const dy = loc.y - imageTransform.lastY;
        imageTransform.x += dx; imageTransform.y += dy;
        imageTransform.lastX = loc.x; imageTransform.lastY = loc.y;
        drawCard(false);
    }
    function handleDragEnd() { imageTransform.isDragging = false; }
    canvas.addEventListener('mousedown', handleDragStart, { passive: false });
    canvas.addEventListener('mousemove', handleDragMove, { passive: false });
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('mouseleave', handleDragEnd);
    canvas.addEventListener('wheel', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        const scaleAmount = 1.1; const newScale = e.deltaY < 0 ? imageTransform.scale * scaleAmount : imageTransform.scale / scaleAmount;
        imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0));
        drawCard(false);
    }, { passive: false });
    canvas.addEventListener('touchstart', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        if (e.touches.length === 1) handleDragStart(e);
        else if (e.touches.length === 2) {
            imageTransform.isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY;
            imageTransform.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        if (e.touches.length === 1 && imageTransform.isDragging) handleDragMove(e);
        else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDist = Math.sqrt(dx * dx + dy * dy);
            if(imageTransform.lastTouchDistance > 0) {
                const newScale = imageTransform.scale * (newDist / imageTransform.lastTouchDistance);
                imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0));
            }
            imageTransform.lastTouchDistance = newDist;
            drawCard(false);
        }
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) imageTransform.isDragging = false;
        imageTransform.lastTouchDistance = 0;
    });

    // --- ★★★ 初期化処理 ★★★ ---
    async function initialize() {
        console.log("初期化処理を開始します。");
        await document.fonts.ready;
        console.log("✓ フォントの準備が完了しました。");
        await preloadAllAssets();
        console.log("✓ 全てのアセットのプリロードが完了しました。");
        loaderElement.classList.add('hidden');
        setTimeout(() => {
            appElement.classList.remove('hidden');
            drawCard(false);
        }, 300);
    }

    initialize();
});
