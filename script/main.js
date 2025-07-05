/**
 * FFXIV Character Card Generator Script (Refactored Version)
 * - v16: Refactored based on professional review.
 * - Centralized template configurations.
 * - Separated icon drawing logic for better readability and maintenance.
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- DOM要素の取得 ---
    const appElement = document.getElementById('app');
    const loaderElement = document.getElementById('loader');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const miniLoader = document.getElementById('mini-loader');
    const miniProgressText = document.getElementById('mini-progress-text');

    const bgCanvas = document.getElementById('background-layer');
    const bgCtx = bgCanvas.getContext('2d');
    const charCanvas = document.getElementById('character-layer');
    const charCtx = charCanvas.getContext('2d');
    const uiCanvas = document.getElementById('ui-layer');
    const uiCtx = uiCanvas.getContext('2d');

    const miscIconCompositeCanvas = document.createElement('canvas');
    const miscIconCompositeCtx = miscIconCompositeCanvas.getContext('2d');
    const mainJobCompositeCanvas = document.createElement('canvas');
    const mainJobCompositeCtx = mainJobCompositeCanvas.getContext('2d');
    const subJobCompositeCanvas = document.createElement('canvas');
    const subJobCompositeCtx = subJobCompositeCanvas.getContext('2d');

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
    const subJobButtons = document.querySelectorAll('#subjobSection .button-grid button');
    const downloadBtn = document.getElementById('downloadBtn');
    const toTopBtn = document.getElementById('toTopBtn');
    const saveModal = document.getElementById('saveModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');
    
    // --- 定数定義 ---
    const EDIT_WIDTH = 1250;
    const EDIT_HEIGHT = 703;
    
    [bgCanvas, charCanvas, uiCanvas, miscIconCompositeCanvas, mainJobCompositeCanvas, subJobCompositeCanvas].forEach(c => {
        c.width = EDIT_WIDTH;
        c.height = EDIT_HEIGHT;
    });

    // --- テンプレート設定の一元管理 ---
    const templateConfig = {
        'Gothic_black':   { textColor: '#ffffff', sharedAsset: 'Gothic' },
        'Gothic_white':   { textColor: '#000000', sharedAsset: 'Gothic' },
        'Gothic_pink':    { textColor: '#ffffff', sharedAsset: 'Gothic' },
        'Neon_mono':      { textColor: '#ffffff' },
        'Neon_duotone':   { textColor: '#ffffff' },
        'Neon_meltdown':  { textColor: '#ffffff' },
        'Water':          { textColor: '#ffffff' },
        'Lovely_heart':   { textColor: '#E1C8D2' },
        'Royal_garnet':   { textColor: '#A2850A', sharedAsset: 'Royal' },
        'Royal_sapphire': { textColor: '#A2850A', sharedAsset: 'Royal' }
    };

    // --- アセット定義 ---
    const races = ['au_ra', 'viera', 'roegadyn', 'miqote', 'hyur', 'elezen', 'lalafell', 'hrothgar'];
    const dcs = ['mana', 'gaia', 'elemental', 'meteor'];
    const progresses = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
    const styles = Array.from(styleButtons).map(b => b.dataset.value);
    const playtimes = ['weekday_morning', 'weekday_daytime', 'weekday_night', 'weekday_midnight', 'holiday_morning', 'holiday_daytime', 'holiday_night', 'holiday_midnight', 'random', 'fulltime'];
    const difficulties = ['extreme', 'unreal', 'savage', 'ultimate'];
    const mainJobs = Array.from(mainJobSelect.options).filter(o => o.value).map(o => o.value);
    const allSubJobs = Array.from(subJobButtons).map(btn => btn.dataset.value);

    // --- 状態管理 ---
    const imageCache = {};
    let currentTemplatePrefix = 'Gothic_black';
    let imageTransform = { img: null, x: EDIT_WIDTH / 2, y: EDIT_HEIGHT / 2, scale: 1.0, isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0 };
    let isDownloading = false;

    // --- アセット読み込み処理 ---
    async function loadAssetsForTemplate(templateName, isInitialLoad = false) {
        const assetExt = '.webp';
        const pathsToLoad = new Set();
        
        pathsToLoad.add(`./assets/backgrounds/${templateName}${assetExt}`);
        pathsToLoad.add(`./assets/backgrounds/${templateName}_cp${assetExt}`);
        
        const iconTypes = { races, dcs, progresses, styles, playtimes, difficulties, mainJobs, allSubJobs };
        const iconPaths = {
            races: 'race_icons', dcs: 'dc_icons', progresses: 'progress_icons', styles: 'style_icons',
            playtimes: 'time_icons', difficulties: 'difficulty_icons',
            mainJobs: 'mainjob_icons', allSubJobs: 'subjob_icons'
        };
        const iconPrefixes = { mainJobs: '_main_', allSubJobs: '_sub_' };

        for (const type in iconTypes) {
            for (const item of iconTypes[type]) {
                const prefix = iconPrefixes[type] || '_';
                const isMainJobIcon = type === 'mainJobs';
                const config = templateConfig[templateName];
                const effectiveTemplateName = (!isMainJobIcon && config?.sharedAsset) ? config.sharedAsset : templateName;
                
                pathsToLoad.add(`./assets/${iconPaths[type]}/${effectiveTemplateName}${prefix}${item}${assetExt}`);
            }
        }

        const finalPaths = [...pathsToLoad].filter(p => !imageCache[p]);
        if (finalPaths.length === 0) {
            updateProgress(isInitialLoad ? { bar: progressBar, text: progressText } : { bar: null, text: miniProgressText }, 1, 1);
            return Promise.resolve();
        }

        let loadedCount = 0;
        const totalCount = finalPaths.length;
        const progressTarget = isInitialLoad ? { bar: progressBar, text: progressText } : { bar: null, text: miniProgressText };
        
        const promises = finalPaths.map(path => 
            new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    imageCache[path] = img;
                    loadedCount++;
                    updateProgress(progressTarget, loadedCount, totalCount);
                    resolve(img);
                };
                img.onerror = () => {
                    console.warn(`画像の読み込みに失敗: ${path}`);
                    loadedCount++;
                    updateProgress(progressTarget, loadedCount, totalCount);
                    resolve(null); // エラーでも止まらないように
                };
                img.src = path;
            })
        );
        return Promise.all(promises);
    }

    function updateProgress(target, loaded, total) {
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 100;
        if (target.bar) target.bar.style.width = `${percent}%`;
        target.text.textContent = `${percent}%`;
    }

    // --- 描画関数 ---
    function drawImageCover(ctx, img, canvasWidth, canvasHeight) {
        if (!img) return;
        const imgRatio = img.width / img.height;
        const canvasRatio = canvasWidth / canvasHeight;
        let sx, sy, sWidth, sHeight;

        if (imgRatio > canvasRatio) {
            sHeight = img.height; sWidth = sHeight * canvasRatio;
            sx = (img.width - sWidth) / 2; sy = 0;
        } else {
            sWidth = img.width; sHeight = sWidth / canvasRatio;
            sx = 0; sy = (img.height - sHeight) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvasWidth, canvasHeight);
    }

    function drawBackgroundLayer() {
        const bgImg = imageCache[`./assets/backgrounds/${currentTemplatePrefix}.webp`];
        bgCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        drawImageCover(bgCtx, bgImg, EDIT_WIDTH, EDIT_HEIGHT);
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

    async function redrawMiscIconComposite() {
        miscIconCompositeCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        await drawMiscIcons(miscIconCompositeCtx, {width: EDIT_WIDTH, height: EDIT_HEIGHT});
    }
    async function redrawMainJobComposite() {
        mainJobCompositeCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        await drawMainJobIcon(mainJobCompositeCtx, {width: EDIT_WIDTH, height: EDIT_HEIGHT});
    }
    async function redrawSubJobComposite() {
        subJobCompositeCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        await drawSubJobIcons(subJobCompositeCtx, {width: EDIT_WIDTH, height: EDIT_HEIGHT});
    }

    async function drawUiLayer() {
        uiCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        uiCtx.drawImage(miscIconCompositeCanvas, 0, 0);
        uiCtx.drawImage(subJobCompositeCanvas, 0, 0);
        uiCtx.drawImage(mainJobCompositeCanvas, 0, 0);
        await drawNameText(uiCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });
    }

    // --- アイコン描画ヘルパー (責務分離) ---
    function getAssetPath(type, item) {
        const pathMap = { race: 'race_icons', dc: 'dc_icons', progress: 'progress_icons', style: 'style_icons', time: 'time_icons', difficulty: 'difficulty_icons', mainJob: 'mainjob_icons', subJob: 'subjob_icons' };
        const prefix = type === 'mainJob' ? '_main_' : (type === 'subJob' ? '_sub_' : '_');
        const config = templateConfig[currentTemplatePrefix];
        const isShared = type !== 'mainJob' && config?.sharedAsset;
        const effectiveTemplate = isShared ? config.sharedAsset : currentTemplatePrefix;
        return `./assets/${pathMap[type]}/${effectiveTemplate}${prefix}${item}.webp`;
    }

    async function drawMiscIcons(context, canvasSize) {
        const draw = (path) => { if(imageCache[path]) drawImageCover(context, imageCache[path], canvasSize.width, canvasSize.height); };
        
        if (raceSelect.value) draw(getAssetPath('race', raceSelect.value));
        if (dcSelect.value) draw(getAssetPath('dc', dcSelect.value));
        
        if (progressSelect.value) {
            const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
            const toLoad = progressSelect.value === 'all_clear' ? [...stages, 'all_clear'] : stages.slice(0, stages.indexOf(progressSelect.value) + 1);
            toLoad.forEach(p => draw(getAssetPath('progress', p)));
        }
        
        styleButtons.forEach(btn => { if (btn.classList.contains('active')) draw(getAssetPath('style', btn.dataset.value)); });
        
        const timePaths = new Set();
        playtimeCheckboxes.forEach(cb => {
            if (cb.checked) {
                const value = cb.value;
                const className = cb.className;
                const pathKey = className.includes('other') ? value : `${className}_${value}`;
                timePaths.add(getAssetPath('time', pathKey));
            }
        });
        timePaths.forEach(path => draw(path));
        
        difficultyCheckboxes.forEach(cb => { if (cb.checked) draw(getAssetPath('difficulty', cb.value)); });
    }

    async function drawMainJobIcon(context, canvasSize) {
        if (mainJobSelect.value) {
            const path = `./assets/mainjob_icons/${currentTemplatePrefix}_main_${mainJobSelect.value}.webp`;
            if(imageCache[path]) drawImageCover(context, imageCache[path], canvasSize.width, canvasSize.height);
        }
    }

    async function drawSubJobIcons(context, canvasSize) {
        const draw = (path) => { if(imageCache[path]) drawImageCover(context, imageCache[path], canvasSize.width, canvasSize.height); };
        subJobButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                draw(getAssetPath('subJob', btn.dataset.value));
            }
        });
    }

    async function drawNameText(context, canvasSize) {
        const name = nameInput.value;
        if (!name) return;
        
        const scale = canvasSize.width / EDIT_WIDTH;
        const nameArea = { x: 33 * scale, y: 90 * scale, width: 222 * scale, height: 40 * scale };
        const MAX_FONT_SIZE = 40 * scale;
        
        const selectedFont = fontSelect.value || "'Orbitron', sans-serif";
        try {
            await document.fonts.load(`10px ${selectedFont}`);
        } catch (err) {
            console.warn(`フォントの読み込みに失敗した可能性があります: ${selectedFont}`, err);
        }

        let fontSize = MAX_FONT_SIZE;
        context.font = `${fontSize}px ${selectedFont}`;
        while (context.measureText(name).width > nameArea.width && fontSize > 10) {
            fontSize--;
            context.font = `${fontSize}px ${selectedFont}`;
        }
        
        const config = templateConfig[currentTemplatePrefix] || { textColor: '#ffffff' };
        context.fillStyle = config.textColor;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, nameArea.x + nameArea.width / 2, nameArea.y + nameArea.height / 2);
    }
    
    // --- パフォーマンス最適化 ---
    const createDebouncer = (func, delay) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => func(...args), delay); }; };
    
    const debouncedRedrawMisc = createDebouncer(async () => { await redrawMiscIconComposite(); await drawUiLayer(); }, 250);
    const debouncedRedrawMainJob = createDebouncer(async () => { await redrawMainJobComposite(); await drawUiLayer(); }, 250);
    const debouncedRedrawSubJob = createDebouncer(async () => { await redrawSubJobComposite(); await drawUiLayer(); }, 250);
    const debouncedNameDraw = createDebouncer(drawUiLayer, 250);

    let charAnimationFrameId;
    const throttledDrawChar = () => {
        if (charAnimationFrameId) return;
        charAnimationFrameId = requestAnimationFrame(() => {
            drawCharacterLayer();
            charAnimationFrameId = null;
        });
    };

    // --- イベントリスナー ---
    nameInput.addEventListener('input', debouncedNameDraw);
    fontSelect.addEventListener('input', debouncedNameDraw);
    
    [raceSelect, dcSelect, progressSelect, ...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes].forEach(el => {
        el.addEventListener(el.tagName === 'BUTTON' ? 'click' : 'input', (e) => {
            if (e.currentTarget.tagName === 'BUTTON') e.currentTarget.classList.toggle('active');
            debouncedRedrawMisc();
        });
    });

    mainJobSelect.addEventListener('input', debouncedRedrawMainJob);
    subJobButtons.forEach(btn => btn.addEventListener('click', (e) => { e.currentTarget.classList.toggle('active'); debouncedRedrawSubJob(); }));

    templateSelect.addEventListener('change', async (e) => {
        const newTemplate = e.target.value;
        if (newTemplate === currentTemplatePrefix) return;
        
        miniLoader.classList.remove('hidden');
        updateProgress({ bar: null, text: miniProgressText }, 0, 1);
        
        await loadAssetsForTemplate(newTemplate);
        currentTemplatePrefix = newTemplate;
        
        drawBackgroundLayer();
        await Promise.all([redrawMiscIconComposite(), redrawMainJobComposite(), redrawSubJobComposite()]);
        await drawUiLayer();

        miniLoader.classList.add('hidden');
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
                imageTransform.scale = (imageAspectRatio > canvasAspectRatio) ? (EDIT_HEIGHT / img.height) : (EDIT_WIDTH / img.width);
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
    function handleDragStart(e) { if (!imageTransform.img) return; e.preventDefault(); const loc = getEventLocation(e); imageTransform.isDragging = true; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; }
    function handleDragMove(e) { if (!imageTransform.isDragging) return; e.preventDefault(); const loc = getEventLocation(e); const dx = loc.x - imageTransform.lastX; const dy = loc.y - imageTransform.lastY; imageTransform.x += dx; imageTransform.y += dy; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; throttledDrawChar(); }
    function handleDragEnd() { imageTransform.isDragging = false; }
    uiCanvas.addEventListener('mousedown', handleDragStart, { passive: false });
    uiCanvas.addEventListener('mousemove', handleDragMove, { passive: false });
    uiCanvas.addEventListener('mouseup', handleDragEnd);
    uiCanvas.addEventListener('mouseleave', handleDragEnd);
    uiCanvas.addEventListener('wheel', (e) => { if (!imageTransform.img) return; e.preventDefault(); const scaleAmount = e.deltaY < 0 ? 1.1 : 1 / 1.1; const newScale = imageTransform.scale * scaleAmount; imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0)); throttledDrawChar(); }, { passive: false });
    uiCanvas.addEventListener('touchstart', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        if (e.touches.length === 1) { handleDragStart(e); } 
        else if (e.touches.length === 2) {
            imageTransform.isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            imageTransform.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });
    uiCanvas.addEventListener('touchmove', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        if (e.touches.length === 1 && imageTransform.isDragging) { handleDragMove(e); } 
        else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDist = Math.sqrt(dx * dx + dy * dy);
            if (imageTransform.lastTouchDistance > 0) {
                const newScale = imageTransform.scale * (newDist / imageTransform.lastTouchDistance);
                imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0));
            }
            imageTransform.lastTouchDistance = newDist;
            throttledDrawChar();
        }
    }, { passive: false });
    uiCanvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) { imageTransform.isDragging = false; }
        imageTransform.lastTouchDistance = 0;
    });

    // --- ダウンロード処理 ---
    downloadBtn.addEventListener('click', async () => {
        if (isDownloading) return;
        isDownloading = true;
        downloadBtn.querySelector('span').textContent = '画像を生成中...';
        
        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = EDIT_WIDTH;
            finalCanvas.height = EDIT_HEIGHT;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';

            // 1. 高画質背景を描画
            const bgImg = imageCache[`./assets/backgrounds/${currentTemplatePrefix}_cp.webp`];
            drawImageCover(finalCtx, bgImg, EDIT_WIDTH, EDIT_HEIGHT);

            // 2. キャラクター画像を描画
            if (imageTransform.img) {
                finalCtx.drawImage(charCanvas, 0, 0, EDIT_WIDTH, EDIT_HEIGHT);
            }

            // 3. 全てのアイコンとテキストを再描画
            await drawMiscIcons(finalCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });
            await drawSubJobIcons(finalCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });
            await drawMainJobIcon(finalCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });
            await drawNameText(finalCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });

            const imageUrl = finalCanvas.toDataURL('image/jpeg', 0.92);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                modalImage.src = imageUrl;
                saveModal.classList.remove('hidden');
            } else {
                const link = document.createElement('a');
                link.download = 'ffxiv_character_card.jpeg';
                link.href = imageUrl;
                link.click();
            }
        } catch (error) {
            console.error("ダウンロード画像の生成に失敗しました:", error);
            alert("画像の生成に失敗しました。ページをリロードして再度お試しください。");
        } finally {
            isDownloading = false;
            downloadBtn.querySelector('span').textContent = 'この内容で作る？🐕';
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

        await loadAssetsForTemplate(currentTemplatePrefix, true);
        console.log("✓ デフォルトアセットのプリロードが完了しました。");
        
        drawBackgroundLayer();
        drawCharacterLayer();
        await Promise.all([redrawMiscIconComposite(), redrawMainJobComposite(), redrawSubJobComposite()]);
        await drawUiLayer();
        
        loaderElement.classList.add('hidden');
        setTimeout(() => appElement.classList.remove('hidden'), 300);
    }

    initialize();
});
