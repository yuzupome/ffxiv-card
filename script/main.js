/**
 * FFXIV Character Card Generator Script (Final Version)
 * - v13: Aspect ratio fix and asset sharing logic update
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- DOM要素の取得 ---
    const appElement = document.getElementById('app');
    const loaderElement = document.getElementById('loader');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const miniLoader = document.getElementById('mini-loader');
    const miniProgressText = document.getElementById('mini-progress-text');

    // 表示用Canvasレイヤー
    const charCanvas = document.getElementById('character-layer'); // Note: ID might be different in HTML
    const charCtx = charCanvas.getContext('2d');
    const bgCanvas = document.getElementById('background-layer'); // Note: ID might be different in HTML
    const bgCtx = bgCanvas.getContext('2d');
    const uiCanvas = document.getElementById('ui-layer');
    const uiCtx = uiCanvas.getContext('2d');

    // 合成用Canvasをメモリ上に作成
    const miscIconCompositeCanvas = document.createElement('canvas');
    const miscIconCompositeCtx = miscIconCompositeCanvas.getContext('2d');
    const mainJobCompositeCanvas = document.createElement('canvas');
    const mainJobCompositeCtx = mainJobCompositeCanvas.getContext('2d');
    const combatSubJobCompositeCanvas = document.createElement('canvas');
    const combatSubJobCompositeCtx = combatSubJobCompositeCanvas.getContext('2d');
    const gatherCraSubJobCompositeCanvas = document.createElement('canvas');
    const gatherCraSubJobCompositeCtx = gatherCraSubJobCompositeCanvas.getContext('2d');

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
    const combatSubJobButtons = document.querySelectorAll('#subjobSection .button-grid button:not([data-value*="er"])');
    const gatherCraSubJobButtons = document.querySelectorAll('#subjobSection .button-grid button[data-value*="er"]');
    const downloadBtn = document.getElementById('downloadBtn');
    const toTopBtn = document.getElementById('toTopBtn');
    const saveModal = document.getElementById('saveModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');
    
    // --- 定数定義 ---
    const EDIT_WIDTH = 1250;
    const EDIT_HEIGHT = 703;
    
    // Canvas解像度設定
    [charCanvas, bgCanvas, uiCanvas, miscIconCompositeCanvas, mainJobCompositeCanvas, combatSubJobCompositeCanvas, gatherCraSubJobCompositeCanvas].forEach(c => {
        c.width = EDIT_WIDTH;
        c.height = EDIT_HEIGHT;
    });

    // --- アセット定義 ---
    const templates = [ 'Gothic_black', 'Gothic_white', 'Gothic_pink', 'Neon_mono', 'Neon_duotone', 'Neon_meltdown', 'Water', 'Lovely_heart', 'Royal_garnet', 'Royal_sapphire' ];
    const races = ['au_ra', 'viera', 'roegadyn', 'miqote', 'hyur', 'elezen', 'lalafell', 'hrothgar'];
    const dcs = ['mana', 'gaia', 'elemental', 'meteor'];
    const progresses = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
    const styles = Array.from(styleButtons).map(b => b.dataset.value);
    const playtimes = ['weekday', 'weekday_morning', 'weekday_daytime', 'weekday_night', 'weekday_midnight', 'holiday', 'holiday_morning', 'holiday_daytime', 'holiday_night', 'holiday_midnight', 'random', 'fulltime'];
    const difficulties = ['extreme', 'unreal', 'savage', 'ultimate'];
    const mainJobs = Array.from(mainJobSelect.options).filter(o => o.value).map(o => o.value);
    const allSubJobs = Array.from([...combatSubJobButtons, ...gatherCraSubJobButtons]).map(btn => btn.dataset.value);
    
    // アセット共有のための設定
    const sharedAssetMap = {
        'Gothic_pink': 'Gothic',
        'Gothic_black': 'Gothic',
        'Royal_sapphire': 'Royal',
        'Royal_garnet': 'Royal'
    };
    
    // --- 状態管理 ---
    const imageCache = {};
    const loadedTemplates = new Set();
    let currentTemplatePrefix = 'Gothic_black';
    let imageTransform = { img: null, x: EDIT_WIDTH / 2, y: EDIT_HEIGHT / 2, scale: 1.0, isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0 };
    let isDownloading = false;

    // --- アセット読み込み処理 ---
    async function loadAssetsForTemplate(templateName, isInitialLoad = false) {
        const assetExt = '.webp';
        const pathsToLoad = new Set();
        
        // 背景は常に固有のものを読み込む
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
                let effectiveTemplateName = templateName;
                const sharedName = sharedAssetMap[templateName];
                const isMainJobIcon = iconPaths[type] === 'mainjob_icons';

                // メインジョブ以外で、かつ共有設定が存在する場合、アセット名を共有名に差し替える
                if (sharedName && !isMainJobIcon) {
                    effectiveTemplateName = sharedName;
                }
                
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
        const promises = finalPaths.map(path => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    imageCache[path] = img;
                    loadedCount++;
                    updateProgress(progressTarget, loadedCount, totalCount);
                    resolve(img);
                };
                img.onerror = () => {
                    // 共有アセットの場合、読み込み失敗は警告に留める（例：Gothic.webpがない場合など）
                    console.warn(`画像の読み込みに失敗: ${path}`);
                    loadedCount++;
                    updateProgress(progressTarget, loadedCount, totalCount);
                    resolve(null);
                };
                img.src = path;
            });
        });
        return Promise.all(promises);
    }

    function updateProgress(target, loaded, total) {
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 100;
        if (target.bar) target.bar.style.width = `${percent}%`;
        target.text.textContent = `${percent}%`;
    }

    // --- 描画関数 ---
    /**
     * 画像のアスペクト比を維持し、Canvasを完全に覆うように描画します (cover)
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     * @param {HTMLImageElement} img - 描画する画像
     * @param {number} canvasWidth - Canvasの幅
     * @param {number} canvasHeight - Canvasの高さ
     */
    function drawImageCover(ctx, img, canvasWidth, canvasHeight) {
        if (!img) return;
        const imgRatio = img.width / img.height;
        const canvasRatio = canvasWidth / canvasHeight;
        let sx, sy, sWidth, sHeight;

        // 画像がCanvasより横長か、縦長かに基づいてクロップ範囲を計算
        if (imgRatio > canvasRatio) { // 画像が横長の場合
            sHeight = img.height;
            sWidth = sHeight * canvasRatio;
            sx = (img.width - sWidth) / 2;
            sy = 0;
        } else { // 画像が縦長または同じ比率の場合
            sWidth = img.width;
            sHeight = sWidth / canvasRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2;
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
        miscIconCompositeCtx.clearRect(0,0,EDIT_WIDTH,EDIT_HEIGHT);
        await drawIcons(miscIconCompositeCtx, {width:EDIT_WIDTH, height:EDIT_HEIGHT}, 'misc');
    }
    async function redrawMainJobComposite() {
        mainJobCompositeCtx.clearRect(0,0,EDIT_WIDTH,EDIT_HEIGHT);
        await drawIcons(mainJobCompositeCtx, {width:EDIT_WIDTH, height:EDIT_HEIGHT}, 'mainJob');
    }
    async function redrawCombatSubJobComposite() {
        combatSubJobCompositeCtx.clearRect(0,0,EDIT_WIDTH,EDIT_HEIGHT);
        await drawIcons(combatSubJobCompositeCtx, {width:EDIT_WIDTH, height:EDIT_HEIGHT}, 'combatSubJob');
    }
    async function redrawGatherCraSubJobComposite() {
        gatherCraSubJobCompositeCtx.clearRect(0,0,EDIT_WIDTH,EDIT_HEIGHT);
        await drawIcons(gatherCraSubJobCompositeCtx, {width:EDIT_WIDTH, height:EDIT_HEIGHT}, 'gatherCraSubJob');
    }

    async function drawUiLayer() {
        uiCtx.clearRect(0, 0, EDIT_WIDTH, EDIT_HEIGHT);
        uiCtx.drawImage(miscIconCompositeCanvas, 0, 0);
        uiCtx.drawImage(gatherCraSubJobCompositeCanvas, 0, 0);
        uiCtx.drawImage(combatSubJobCompositeCanvas, 0, 0);
        uiCtx.drawImage(mainJobCompositeCanvas, 0, 0);
        await drawNameText(uiCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT });
    }

    // --- 描画ヘルパー関数 ---
    async function drawIcons(context, canvasSize, category = 'all') {
        const { width, height } = canvasSize;
        const prefix = currentTemplatePrefix;
        const draw = (path) => { const img = imageCache[path]; if (img) context.drawImage(img, 0, 0, width, height); };
        
        const sharedName = sharedAssetMap[prefix];

        const getEffectiveTemplate = (isMainJob = false) => {
            if (sharedName && !isMainJob) {
                return sharedName;
            }
            return prefix;
        };

        if(category === 'all' || category === 'misc'){
            const miscTemplate = getEffectiveTemplate();
            if (raceSelect.value) draw(`./assets/race_icons/${miscTemplate}_${raceSelect.value}.webp`);
            if (dcSelect.value) draw(`./assets/dc_icons/${miscTemplate}_${dcSelect.value}.webp`);
            if (progressSelect.value) {
                const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
                const toLoad = progressSelect.value === 'all_clear' ? [...stages, 'all_clear'] : stages.slice(0, stages.indexOf(progressSelect.value) + 1);
                toLoad.forEach(p => draw(`./assets/progress_icons/${miscTemplate}_${p}.webp`));
            }
            styleButtons.forEach(btn => { if (btn.classList.contains('active')) draw(`./assets/style_icons/${miscTemplate}_${btn.dataset.value}.webp`); });
            const timePaths = new Set();
            const checkedTimes = Array.from(playtimeCheckboxes).filter(cb => cb.checked);
            checkedTimes.forEach(cb => {
                const pathKey = cb.classList.contains('other') ? cb.value : `${cb.className}_${cb.value}`;
                timePaths.add(`./assets/time_icons/${miscTemplate}_${pathKey}.webp`);
            });
            if (checkedTimes.some(cb => cb.classList.contains('weekday'))) timePaths.add(`./assets/time_icons/${miscTemplate}_weekday.webp`);
            if (checkedTimes.some(cb => cb.classList.contains('holiday'))) timePaths.add(`./assets/time_icons/${miscTemplate}_holiday.webp`);
            timePaths.forEach(path => draw(path));
            difficultyCheckboxes.forEach(cb => { if (cb.checked) draw(`./assets/difficulty_icons/${miscTemplate}_${cb.value}.webp`); });
        }
        if(category === 'all' || category === 'mainJob'){
            // メインジョブは常に固有アセット
            if (mainJobSelect.value) draw(`./assets/mainjob_icons/${prefix}_main_${mainJobSelect.value}.webp`);
        }
        if(category === 'all' || category === 'combatSubJob'){
            const subJobTemplate = getEffectiveTemplate();
            combatSubJobButtons.forEach(btn => { if (btn.classList.contains('active')) draw(`./assets/subjob_icons/${subJobTemplate}_sub_${btn.dataset.value}.webp`); });
        }
        if(category === 'all' || category === 'gatherCraSubJob'){
            const subJobTemplate = getEffectiveTemplate();
            gatherCraSubJobButtons.forEach(btn => { if (btn.classList.contains('active')) draw(`./assets/subjob_icons/${subJobTemplate}_sub_${btn.dataset.value}.webp`); });
        }
    }

    async function drawNameText(context, canvasSize) {
        const scale = canvasSize.width / EDIT_WIDTH;
        const nameArea = { x: 33 * scale, y: 90 * scale, width: 222 * scale, height: 40 * scale };
        const MAX_FONT_SIZE = 40 * scale;
        const name = nameInput.value;
        if (!name) return;
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
        const centerX = nameArea.x + nameArea.width / 2;
        const centerY = nameArea.y + nameArea.height / 2;
        const blackTextTemplates = ['Gothic_white'];
        context.fillStyle = blackTextTemplates.includes(currentTemplatePrefix) ? '#000000' : '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, centerX, centerY);
    }
    
    // --- パフォーマンス最適化 ---
    const createDebouncer = (func, delay) => {
        let timer;
        return () => {
            clearTimeout(timer);
            timer = setTimeout(func, delay);
        };
    };
    const debouncedRedrawMisc = createDebouncer(async () => { await redrawMiscIconComposite(); await drawUiLayer(); }, 250);
    const debouncedRedrawMainJob = createDebouncer(async () => { await redrawMainJobComposite(); await drawUiLayer(); }, 250);
    const debouncedRedrawCombat = createDebouncer(async () => { await redrawCombatSubJobComposite(); await drawUiLayer(); }, 250);
    const debouncedRedrawGatherCra = createDebouncer(async () => { await redrawGatherCraSubJobComposite(); await drawUiLayer(); }, 250);
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
    const miscIconControls = [raceSelect, dcSelect, progressSelect, ...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes];
    miscIconControls.forEach(el => {
        el.addEventListener(el.tagName === 'BUTTON' ? 'click' : 'input', (e) => {
            if (e.currentTarget.tagName === 'BUTTON') e.currentTarget.classList.toggle('active');
            debouncedRedrawMisc();
        });
    });
    mainJobSelect.addEventListener('input', debouncedRedrawMainJob);
    combatSubJobButtons.forEach(btn => btn.addEventListener('click', (e) => { e.currentTarget.classList.toggle('active'); debouncedRedrawCombat(); }));
    gatherCraSubJobButtons.forEach(btn => btn.addEventListener('click', (e) => { e.currentTarget.classList.toggle('active'); debouncedRedrawGatherCra(); }));
    templateSelect.addEventListener('change', async (e) => {
        const newTemplate = e.target.value;
        if (newTemplate === currentTemplatePrefix) return;
        
        miniLoader.classList.remove('hidden');
        updateProgress({ bar: null, text: miniProgressText }, 0, 1);
        await loadAssetsForTemplate(newTemplate);
        loadedTemplates.add(newTemplate);
        miniLoader.classList.add('hidden');
        
        currentTemplatePrefix = newTemplate;
        drawBackgroundLayer();
        await Promise.all([redrawMiscIconComposite(), redrawMainJobComposite(), redrawCombatSubJobComposite(), redrawGatherCraSubJobComposite()]);
        await drawUiLayer();
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
    function handleDragStart(e) { if (!imageTransform.img) return; e.preventDefault(); const loc = getEventLocation(e); imageTransform.isDragging = true; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; }
    function handleDragMove(e) { if (!imageTransform.isDragging) return; e.preventDefault(); const loc = getEventLocation(e); const dx = loc.x - imageTransform.lastX; const dy = loc.y - imageTransform.lastY; imageTransform.x += dx; imageTransform.y += dy; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; throttledDrawChar(); }
    function handleDragEnd() { imageTransform.isDragging = false; }
    uiCanvas.addEventListener('mousedown', handleDragStart, { passive: false });
    uiCanvas.addEventListener('mousemove', handleDragMove, { passive: false });
    uiCanvas.addEventListener('mouseup', handleDragEnd);
    uiCanvas.addEventListener('mouseleave', handleDragEnd);
    uiCanvas.addEventListener('wheel', (e) => { if (!imageTransform.img) return; e.preventDefault(); const scaleAmount = e.deltaY < 0 ? 1.1 : 1 / 1.1; const newScale = imageTransform.scale * scaleAmount; imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0)); throttledDrawChar(); }, { passive: false });
    uiCanvas.addEventListener('touchstart', (e) => {
        if (!imageTransform.img) return;
        e.preventDefault();
        if (e.touches.length === 1) {
            handleDragStart(e);
        } else if (e.touches.length === 2) {
            imageTransform.isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            imageTransform.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });
    uiCanvas.addEventListener('touchmove', (e) => {
        if (!imageTransform.img) return;
        e.preventDefault();
        if (e.touches.length === 1 && imageTransform.isDragging) {
            handleDragMove(e);
        } else if (e.touches.length === 2) {
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
        if (e.touches.length < 2) {
            imageTransform.isDragging = false;
        }
        imageTransform.lastTouchDistance = 0;
    });

    // --- ダウンロード処理 ---
    downloadBtn.addEventListener('click', async () => {
        if (isDownloading) return;
        isDownloading = true;
        const originalText = downloadBtn.querySelector('span').textContent;
        downloadBtn.querySelector('span').textContent = '画像を生成中...';
        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = EDIT_WIDTH;
            finalCanvas.height = EDIT_HEIGHT;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';

            // 1. キャラクター画像を描画
            if (imageTransform.img) {
                finalCtx.drawImage(charCanvas, 0, 0, EDIT_WIDTH, EDIT_HEIGHT);
            }
            // 2. 背景テンプレートを高画質元データから描画
            const bgImg = imageCache[`./assets/backgrounds/${currentTemplatePrefix}_cp.webp`];
            drawImageCover(finalCtx, bgImg, EDIT_WIDTH, EDIT_HEIGHT);

            // 3. アイコンとテキストを再描画
            await drawIcons(finalCtx, { width: EDIT_WIDTH, height: EDIT_HEIGHT }, 'all');
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

        await loadAssetsForTemplate('Gothic_black', true);
        loadedTemplates.add('Gothic_black');
        console.log("✓ デフォルトアセットのプリロードが完了しました。");
        
        drawCharacterLayer();
        drawBackgroundLayer();
        await Promise.all([redrawMiscIconComposite(), redrawMainJobComposite(), redrawCombatSubJobComposite(), redrawGatherCraSubJobComposite()]);
        await drawUiLayer();
        
        loaderElement.classList.add('hidden');
        setTimeout(() => appElement.classList.remove('hidden'), 300);
    }

    initialize();
});
