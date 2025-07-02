/**
 * FFXIV Character Card Generator Script (Layered Architecture)
 *
 * - レイヤー化アーキテクチャによるパフォーマンスの根本改善
 * - 編集時(低解像度)と出力時(高解像度)の分離
 * - フォント読み込み遅延問題の解決
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- DOM要素の取得 ---
    const appElement = document.getElementById('app');
    const loaderElement = document.getElementById('loader');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Canvasレイヤー
    const bgCanvas = document.getElementById('background-layer');
    const bgCtx = bgCanvas.getContext('2d');
    const charCanvas = document.getElementById('character-layer');
    const charCtx = charCanvas.getContext('2d');
    const uiCanvas = document.getElementById('ui-layer');
    const uiCtx = uiCanvas.getContext('2d');

    // UIコントロール
    const nameInput = document.getElementById('nameInput');
    const fontSelect = document.getElementById('fontSelect');
    const uploadImageInput = document.getElementById('uploadImage');
    const fileNameDisplay = document.getElementById('fileName');
    const templateSelect = document.getElementById('templateSelect');
    const raceSelect = document.getElementById('raceSelect');
    const dcSelect = document.getElementById('dcSelect');
    const progressSelect = document.getElementById('progressSelect');
    const styleButtons = document.querySelectorAll('#styleButtons button');
    const playtimeCheckboxes = document.querySelectorAll('#playtimeOptions input[type="checkbox"]');
    const difficultyCheckboxes = document.querySelectorAll('#difficultyOptions input[type="checkbox"]');
    const mainJobSelect = document.getElementById('mainjobSelect');
    const subjobButtons = document.querySelectorAll('#subjobSection .button-grid button');
    const downloadBtn = document.getElementById('downloadBtn');
    const toTopBtn = document.getElementById('toTopBtn');
    const saveModal = document.getElementById('saveModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');

    // --- 定数定義 ---
    const EDIT_WIDTH = 1250;
    const EDIT_HEIGHT = 703;
    const DOWNLOAD_WIDTH = 2500;
    const DOWNLOAD_HEIGHT = 1406;

    // --- アセット定義 ---
    const templates = [ 'Gothic_black', 'Gothic_white', 'Gothic_pink', 'Neon_mono', 'Neon_duotone', 'Neon_meltdown', 'Water', 'Wafu', 'Wood', 'China' ];
    const races = ['au_ra', 'viera', 'roegadyn', 'miqote', 'hyur', 'elezen', 'lalafell', 'hrothgar'];
    const dcs = ['mana', 'gaia', 'elemental', 'meteor'];
    const progresses = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
    const styles = Array.from(styleButtons).map(b => b.dataset.value);
    const playtimes = ['weekday', 'weekday_morning', 'weekday_daytime', 'weekday_night', 'weekday_midnight', 'holiday', 'holiday_morning', 'holiday_daytime', 'holiday_night', 'holiday_midnight', 'random', 'fulltime'];
    const difficulties = ['extreme', 'unreal', 'savage', 'ultimate'];
    const mainJobs = Array.from(mainJobSelect.options).filter(o => o.value).map(o => o.value);
    const allSubJobs = Array.from(subjobButtons).map(btn => btn.dataset.value);
    
    // --- 状態管理 ---
    const imageCache = {};
    let currentTemplatePrefix = 'Gothic_black';
    let imageTransform = {
        img: null, x: EDIT_WIDTH / 2, y: EDIT_HEIGHT / 2, scale: 1.0,
        isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0
    };
    let isDownloading = false;

    // --- プリロード処理 ---
    // (省略... 元のコードと同じ)
    async function preloadAllAssets() {
        const allImagePaths = new Set();
        const assetExt = '.webp'; // .png から変更
        templates.forEach(template => {
            allImagePaths.add(`./assets/backgrounds/${template}${assetExt}`);
            allImagePaths.add(`./assets/backgrounds/${template}_cp${assetExt}`); 
            races.forEach(item => allImagePaths.add(`./assets/race_icons/${template}_${item}${assetExt}`));
            dcs.forEach(item => allImagePaths.add(`./assets/dc_icons/${template}_${item}${assetExt}`));
            progresses.forEach(item => allImagePaths.add(`./assets/progress_icons/${template}_${item}${assetExt}`));
            styles.forEach(item => allImagePaths.add(`./assets/style_icons/${template}_${item}${assetExt}`));
            playtimes.forEach(item => allImagePaths.add(`./assets/time_icons/${template}_${item}${assetExt}`));
            difficulties.forEach(item => allImagePaths.add(`./assets/difficulty_icons/${template}_${item}${assetExt}`));
            mainJobs.forEach(item => allImagePaths.add(`./assets/mainjob_icons/${template}_main_${item}${assetExt}`));
            allSubJobs.forEach(item => allImagePaths.add(`./assets/subjob_icons/${template}_sub_${item}${assetExt}`));
        });
        
        totalAssetCount = allImagePaths.size;
        progressText.textContent = '0%';
        const promises = Array.from(allImagePaths).map(path => loadImage(path));
        await Promise.all(promises);
    }
    function loadImage(path) {
        if (!path) return Promise.resolve(null);
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { imageCache[path] = img; updateProgress(); resolve(img); };
            img.onerror = () => { console.warn(`画像の読み込みに失敗: ${path}`); updateProgress(); resolve(null); };
            img.src = path;
        });
    }
    function updateProgress() {
        loadedAssetCount++;
        const percent = Math.round((loadedAssetCount / totalAssetCount) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }


    // --- 描画関数 (レイヤーごと) ---
    function drawBackgroundLayer() {
        const bgImg = imageCache[`./assets/backgrounds/${currentTemplatePrefix}.webp`];
        bgCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        if (bgImg) {
            bgCtx.drawImage(bgImg, 0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        }
    }

    function drawCharacterLayer() {
        charCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        if (imageTransform.img) {
            charCtx.save();
            charCtx.translate(imageTransform.x, imageTransform.y);
            charCtx.scale(imageTransform.scale, imageTransform.scale);
            charCtx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
            charCtx.restore();
        }
    }
    
    async function drawUiLayer() {
        uiCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        await drawIcons(uiCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });
        await drawNameText(uiCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });
    }

    // --- 描画ヘルパー関数 ---
    async function drawIcons(context, canvasSize) {
        const { width, height } = canvasSize;
        const prefix = currentTemplatePrefix;
        const draw = (path) => { const img = imageCache[path]; if (img) context.drawImage(img, 0, 0, width, height); };
        
        // アイコン描画ロジック (元のコードから移植)
        if (raceSelect.value) draw(`./assets/race_icons/${prefix}_${raceSelect.value}.webp`);
        if (dcSelect.value) draw(`./assets/dc_icons/${prefix}_${dcSelect.value}.webp`);
        if (progressSelect.value) {
            const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
            const toLoad = progressSelect.value === 'all_clear' ? [...stages, 'all_clear'] : stages.slice(0, stages.indexOf(progressSelect.value) + 1);
            toLoad.forEach(p => draw(`./assets/progress_icons/${prefix}_${p}.webp`));
        }
        styleButtons.forEach(btn => { if (btn.classList.contains('active')) draw(`./assets/style_icons/${prefix}_${btn.dataset.value}.webp`); });
        const timePaths = new Set();
        const checkedTimes = Array.from(playtimeCheckboxes).filter(cb => cb.checked);
        checkedTimes.forEach(cb => {
            const pathKey = cb.classList.contains('other') ? cb.value : `${cb.className}_${cb.value}`;
            timePaths.add(`./assets/time_icons/${prefix}_${pathKey}.webp`);
        });
        if (checkedTimes.some(cb => cb.classList.contains('weekday'))) timePaths.add(`./assets/time_icons/${prefix}_weekday.webp`);
        if (checkedTimes.some(cb => cb.classList.contains('holiday'))) timePaths.add(`./assets/time_icons/${prefix}_holiday.webp`);
        timePaths.forEach(path => draw(path));
        difficultyCheckboxes.forEach(cb => { if (cb.checked) draw(`./assets/difficulty_icons/${prefix}_${cb.value}.webp`); });
        subjobButtons.forEach(btn => { if (btn.classList.contains('active')) { draw(`./assets/subjob_icons/${prefix}_sub_${btn.dataset.value}.webp`); } });
        if (mainJobSelect.value) draw(`./assets/mainjob_icons/${prefix}_main_${mainJobSelect.value}.webp`);
    }

    async function drawNameText(context, canvasSize) {
        const scale = canvasSize.width / EDIT_WIDTH;
        const nameArea = { x: 33 * scale, y: 90 * scale, width: 222 * scale, height: 40 * scale };
        const MAX_FONT_SIZE = 40 * scale;
        const name = nameInput.value;
        if (!name) return;

        const selectedFont = fontSelect.value || "'Orbitron', sans-serif";
        
        // フォントが利用可能になるまで待つ
        await document.fonts.load(`10px ${selectedFont}`);

        let fontSize = MAX_FONT_SIZE;
        context.font = `${fontSize}px ${selectedFont}`;
        
        while (context.measureText(name).width > nameArea.width && fontSize > 10) {
            fontSize--;
            context.font = `${fontSize}px ${selectedFont}`;
        }
        
        const centerX = nameArea.x + nameArea.width / 2;
        const centerY = nameArea.y + nameArea.height / 2;
        const blackTextTemplates = ['Gothic_white', 'Wood'];
        context.fillStyle = blackTextTemplates.includes(currentTemplatePrefix) ? '#000000' : '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, centerX, centerY);
    }
    
    // --- パフォーマンス最適化 ---
    let uiDebounceTimer;
    const debouncedDrawUi = () => {
        clearTimeout(uiDebounceTimer);
        uiDebounceTimer = setTimeout(drawUiLayer, 250);
    };

    let charAnimationFrameId;
    const throttledDrawChar = () => {
        if (charAnimationFrameId) return;
        charAnimationFrameId = requestAnimationFrame(() => {
            drawCharacterLayer();
            charAnimationFrameId = null;
        });
    };

    // --- イベントリスナー ---
    const uiControls = [nameInput, fontSelect, raceSelect, dcSelect, progressSelect, mainJobSelect, ...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes, ...subjobButtons];
    uiControls.forEach(el => {
        const eventType = (el.tagName === 'SELECT' || el.type === 'text') ? 'input' : 'click';
        el.addEventListener(eventType, (e) => {
            if (e.currentTarget.tagName === 'BUTTON') { e.currentTarget.classList.toggle('active'); }
            debouncedDrawUi();
        });
    });

    templateSelect.addEventListener('change', () => {
        currentTemplatePrefix = templateSelect.value;
        drawBackgroundLayer();
        drawUiLayer(); // アイコンの色が変わるためUIも再描画
    });
    
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) { fileNameDisplay.textContent = ''; return; }
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                imageTransform.img = img;
                const canvasAspectRatio = EDIT_WIDTH / EDIT_HEIGHT;
                const imageAspectRatio = img.width / img.height;
                if (imageAspectRatio > canvasAspectRatio) {
                    imageTransform.scale = EDIT_HEIGHT / img.height;
                } else {
                    imageTransform.scale = EDIT_WIDTH / img.width;
                }
                imageTransform.x = EDIT_WIDTH / 2;
                imageTransform.y = EDIT_HEIGHT / 2;
                drawCharacterLayer();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // --- 画像操作イベントリスナー ---
    function getEventLocation(e) {
        const rect = uiCanvas.getBoundingClientRect();
        const scaleX = uiCanvas.width / rect.width;
        const scaleY = uiCanvas.height / rect.height;
        if (e.touches && e.touches[0]) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }
    // (画像操作のハンドラ関数は throttledDrawChar を呼ぶように変更)
    function handleDragStart(e) { if (!imageTransform.img) return; e.preventDefault(); const loc = getEventLocation(e); imageTransform.isDragging = true; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; }
    function handleDragMove(e) { if (!imageTransform.isDragging) return; e.preventDefault(); const loc = getEventLocation(e); const dx = loc.x - imageTransform.lastX; const dy = loc.y - imageTransform.lastY; imageTransform.x += dx; imageTransform.y += dy; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; throttledDrawChar(); }
    function handleDragEnd() { imageTransform.isDragging = false; }
    uiCanvas.addEventListener('mousedown', handleDragStart, { passive: false });
    uiCanvas.addEventListener('mousemove', handleDragMove, { passive: false });
    uiCanvas.addEventListener('mouseup', handleDragEnd);
    uiCanvas.addEventListener('mouseleave', handleDragEnd);
    uiCanvas.addEventListener('wheel', (e) => { if (!imageTransform.img) return; e.preventDefault(); const scaleAmount = e.deltaY < 0 ? 1.1 : 1 / 1.1; const newScale = imageTransform.scale * scaleAmount; imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0)); throttledDrawChar(); }, { passive: false });
    // (Touchイベントも同様)
    uiCanvas.addEventListener('touchstart', (e) => { if (!imageTransform.img) return; e.preventDefault(); if (e.touches.length === 1) handleDragStart(e); else if (e.touches.length === 2) { imageTransform.isDragging = false; const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; imageTransform.lastTouchDistance = Math.sqrt(dx * dx + dy * dy); } }, { passive: false });
    uiCanvas.addEventListener('touchmove', (e) => { if (!imageTransform.isDragging || !imageTransform.img) return; e.preventDefault(); if (e.touches.length === 1) { handleDragMove(e); } else if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; const newDist = Math.sqrt(dx * dx + dy * dy); if(imageTransform.lastTouchDistance > 0) { const newScale = imageTransform.scale * (newDist / imageTransform.lastTouchDistance); imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0)); } imageTransform.lastTouchDistance = newDist; throttledDrawChar(); } }, { passive: false });
    uiCanvas.addEventListener('touchend', (e) => { if (e.touches.length < 2) { imageTransform.isDragging = false; } imageTransform.lastTouchDistance = 0; });
    

    // --- ダウンロード処理 ---
    downloadBtn.addEventListener('click', async () => {
        if (isDownloading) return;
        isDownloading = true;
        const originalText = downloadBtn.querySelector('span').textContent;
        downloadBtn.querySelector('span').textContent = '画像を生成中...';

        try {
            const dlCanvas = document.createElement('canvas');
            dlCanvas.width = DOWNLOAD_WIDTH;
            dlCanvas.height = DOWNLOAD_HEIGHT;
            const dlCtx = dlCanvas.getContext('2d');
            dlCtx.imageSmoothingEnabled = true;
            dlCtx.imageSmoothingQuality = 'high';

            // 1. 背景を描画
            const bgImg = imageCache[`./assets/backgrounds/${currentTemplatePrefix}_cp.webp`];
            if (bgImg) dlCtx.drawImage(bgImg, 0, 0, DOWNLOAD_WIDTH, DOWNLOAD_HEIGHT);

            // 2. キャラクター画像を描画
            if (imageTransform.img) {
                dlCtx.save();
                const scale = DOWNLOAD_WIDTH / EDIT_WIDTH;
                dlCtx.translate(imageTransform.x * scale, imageTransform.y * scale);
                dlCtx.scale(imageTransform.scale, imageTransform.scale);
                dlCtx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
                dlCtx.restore();
            }

            // 3. UI（アイコンとテキスト）を描画
            await drawIcons(dlCtx, { width: DOWNLOAD_WIDTH, height: DOWNLOAD_HEIGHT });
            await drawNameText(dlCtx, { width: DOWNLOAD_WIDTH, height: DOWNLOAD_HEIGHT });

            const imageUrl = dlCanvas.toDataURL('image/png');
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (isIOS) {
                modalImage.src = imageUrl;
                saveModal.classList.remove('hidden');
            } else {
                const link = document.createElement('a');
                link.download = 'ffxiv_character_card.png';
                link.href = imageUrl;
                link.click();
            }
        } catch (error) {
            console.error("ダウンロード画像の生成に失敗しました:", error);
            alert("画像の生成に失敗しました。ページをリロードして再度お試しください。");
        } finally {
            isDownloading = false;
            downloadBtn.querySelector('span').textContent = originalText;
        }
    });

    closeModal.addEventListener('click', () => { saveModal.classList.add('hidden'); });

    // --- その他UIイベント ---
    const controlsPanel = document.querySelector('.controls-panel');
    const scrollContainer = window.innerWidth >= 1024 ? controlsPanel : window;
    scrollContainer.onscroll = () => {
        const scrollTop = window.innerWidth >= 1024 ? controlsPanel.scrollTop : (document.body.scrollTop || document.documentElement.scrollTop);
        toTopBtn.classList.toggle('visible', scrollTop > 100);
    };
    toTopBtn.addEventListener('click', () => { scrollContainer.scrollTo({ top: 0, behavior: 'smooth' }); });

    // --- 初期化処理 ---
    async function initialize() {
        console.log("初期化処理を開始します。");
        await document.fonts.ready;
        console.log("✓ フォントの準備が完了しました。");
        await preloadAllAssets();
        console.log("✓ 全てのアセットのプリロードが完了しました。");
        
        drawBackgroundLayer();
        drawCharacterLayer();
        await drawUiLayer();
        
        loaderElement.classList.add('hidden');
        setTimeout(() => {
            appElement.classList.remove('hidden');
        }, 300);
    }

    initialize();
});
