/**
 * FFXIV Character Card Generator - Complete Integrated Version
 * - main(1).js の堅牢なパフォーマンス・アーキテクチャをベースに採用
 * - test.js の新機能（多言語対応、アイコン色変更、Sticky UI）を統合
 * - 新しいアセット構造とHTML構造に完全対応
 * - 画像操作、ダウンロード処理を含むすべての機能を実装
 * - 2025-07-20 v23.20: レイヤー、フォント、パスに関するバグを修正
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. DOM要素の取得 ---
    const backgroundLayer = document.getElementById('background-layer');
    const characterLayer = document.getElementById('character-layer');
    const uiLayer = document.getElementById('ui-layer');
    const bgCtx = backgroundLayer.getContext('2d');
    const charCtx = characterLayer.getContext('2d');
    const uiCtx = uiLayer.getContext('2d');

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
    const styleButtonsContainer = document.getElementById('styleButtons');
    const playtimeOptionsContainer = document.getElementById('playtimeOptions');
    const difficultyOptionsContainer = document.getElementById('difficultyOptions');
    const mainjobSelect = document.getElementById('mainjobSelect');
    const subjobSection = document.getElementById('subjobSection');
    const downloadBtn = document.getElementById('downloadBtn');
    
    const appElement = document.getElementById('app');
    const loaderElement = document.getElementById('loader');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const miniLoader = document.getElementById('mini-loader');
    const miniProgressText = document.getElementById('mini-progress-text');
    const toTopBtn = document.getElementById('toTopBtn');
    const saveModal = document.getElementById('saveModal');
    const modalImage = document.getElementById('modalImage');
    const closeModalBtn = document.getElementById('closeModal');

    const langTabs = document.querySelector('.lang-tabs');
    const controlsJp = document.getElementById('controls-jp');
    const controlsEn = document.getElementById('controls-en');
    const mainColorPickerSection = document.getElementById('main-color-picker-section');
    const stickyColorPicker = document.getElementById('sticky-color-picker');
    const stickyPickerToggleButton = document.getElementById('sticky-picker-toggle-btn');
    const iconBgColorPicker = document.getElementById('iconBgColorPicker');
    const stickyIconBgColorPicker = document.getElementById('stickyIconBgColorPicker');
    const colorPresetButtons = document.getElementById('colorPresetButtons');
    const stickyColorPresetButtons = document.getElementById('stickyColorPresetButtons');

    // --- 2. 定数と設定 ---
    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 600;
    [backgroundLayer, characterLayer, uiLayer, miscIconCompositeCanvas, mainJobCompositeCanvas, subJobCompositeCanvas].forEach(c => {
        c.width = CANVAS_WIDTH;
        c.height = CANVAS_HEIGHT;
    });

    const templateConfig = {
        'Gothic_black':   { nameColor: '#ffffff', iconTint: null,       defaultBg: '#A142CD', frame: 'Common_background_square_frame', iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Gothic_white':   { nameColor: '#000000', iconTint: '#000000',   defaultBg: '#6CD9D6', frame: 'Common_background_square_frame', iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Gothic_pink':    { nameColor: '#ffffff', iconTint: null,       defaultBg: '#A142CD', frame: 'Common_background_square_frame', iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Neon_mono':      { nameColor: '#ffffff', iconTint: null,       defaultBg: '#B70016', frame: 'Neon_background_square_frame',   iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Neon_duotone':   { nameColor: '#ffffff', iconTint: null,       defaultBg: '#FFF500', frame: 'Neon_background_square_frame',   iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Neon_meltdown':  { nameColor: '#ffffff', iconTint: null,       defaultBg: '#FF00CF', frame: 'Neon_background_square_frame',   iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Water':          { nameColor: '#ffffff', iconTint: null,       defaultBg: '#FFFFFF', frame: 'Common_background_circle_frame', iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Lovely_heart':   { nameColor: '#E1C8D2', iconTint: '#E1C8D2',   defaultBg: '#D34669', frame: 'Common_background_circle_frame', iconTheme: 'Common', nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Royal_garnet':   { nameColor: '#A2850A', iconTint: '#A2850A',   defaultBg: '#000000', frame: 'Common_background_square_frame', iconTheme: 'Royal',  nameArea: { x: 15, y: 77, width: 180, height: 40 } },
        'Royal_sapphire': { nameColor: '#A2850A', iconTint: '#A2850A',   defaultBg: '#000000', frame: 'Common_background_square_frame', iconTheme: 'Royal',  nameArea: { x: 15, y: 77, width: 180, height: 40 } }
    };
    
    const translations = {
        jp: {
            uploadBtn: '画像をアップロード', copyrightNotice: '⚠️ 著作権表記は画像出力時に自動で付与されます', namePlaceholder: '表示したいキャラ名を入力', fontPlaceholder: 'キャラ名のフォントを選ぶ', dcPlaceholder: 'DC', racePlaceholder: '種族', progressPlaceholder: '進行度', mainJobPlaceholder: 'メインジョブを選ぶ', downloadBtnText: 'この内容で作る？🐕', generatingText: '画像を生成中...', modalTitle: '画像の保存方法', modalDesc: '画像を長押しして「"写真"に追加」を選択してください。',
        },
        en: {
            uploadBtn: 'Upload Image', copyrightNotice: '⚠️ Copyright notice is automatically added to the output image.', namePlaceholder: 'Enter character name', fontPlaceholder: 'Select a font for the name', dcPlaceholder: 'DC', racePlaceholder: 'Race', progressPlaceholder: 'Progress', mainJobPlaceholder: 'Select Main Job', downloadBtnText: 'Generate Card 🐕', generatingText: 'Generating...', modalTitle: 'How to Save Image', modalDesc: 'Long-press the image and select "Add to Photos".',
        }
    };

    // --- 3. 状態管理 ---
    let state = {
        lang: 'jp', template: 'Gothic_black', iconBgColor: '#A142CD', characterName: '', font: "'Exo 2', sans-serif", dc: '', race: '', progress: '', playstyles: [], playtimes: [], difficulties: [], mainjob: '', subjobs: [],
    };
    let imageTransform = { img: null, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 1.0, isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0 };
    let imageCache = {};
    let isDownloading = false;
    let previousMainJob = '';

    // --- 4. コア関数 ---
    function getAssetPath(options) {
        // 背景画像用の特別な処理
        if (options.category === 'background' && options.type === 'base') {
            const langSuffix = state.lang === 'en' ? '_en' : '';
            const cpSuffix = options.isDownload ? '_cp' : '';
            return `./assets/images/background/base/${options.value}${cpSuffix}${langSuffix}.webp`;
        }

        // アイコンなど、その他のアセット用の処理
        const theme = options.theme || 'Common';
        const langSuffix = (state.lang === 'en' && options.langResource) ? '_en' : '';
        
        let path = `./assets/images/${options.category}/`;
        if (options.type) {
            path += `${options.type}/`;
        }
        
        const variant = options.variant || '';
        const typeSuffix = options.type && ['bg', 'frame'].includes(options.type) ? `_${options.type}` : '';
        
        path += `${theme}_${options.category}_${options.value}${typeSuffix}${variant}${langSuffix}.webp`;
        
        return path;
    }
    
    function loadImage(src) {
        if (imageCache[src]) return Promise.resolve(imageCache[src]);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { imageCache[src] = img; resolve(img); };
            img.onerror = (err) => { console.error(`画像の読み込みに失敗: ${src}`); reject(err); };
            img.src = src;
        });
    }

    function drawImageWithTint(ctx, image, color) {
        if (!color) {
            ctx.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            return;
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = CANVAS_WIDTH; tempCanvas.height = CANVAS_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = color;
        tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(tempCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // --- 5. パフォーマンス最適化 ---
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

    // --- 6. 描画ロジック ---
    function updateState() {
        state = {
            lang: document.querySelector('.lang-tab-btn.active').dataset.lang,
            template: templateSelect.value,
            iconBgColor: iconBgColorPicker.value,
            characterName: nameInput.value,
            font: fontSelect.value,
            dc: dcSelect.value,
            race: raceSelect.value,
            progress: progressSelect.value,
            playstyles: [...styleButtonsContainer.querySelectorAll('button.active')].map(btn => btn.dataset.value),
            playtimes: [...playtimeOptionsContainer.querySelectorAll('input:checked')].map(cb => {
                const value = cb.value;
                const className = cb.className;
                return className.includes('other') ? value : `${className}_${value}`;
            }),
            difficulties: [...difficultyOptionsContainer.querySelectorAll('input:checked')].map(cb => cb.value),
            mainjob: mainjobSelect.value,
            subjobs: [...subjobSection.querySelectorAll('button.active')].map(btn => btn.dataset.value),
        };
    }

    function drawCharacterLayer() {
        // ユーザー画像を最背面のbgCtxに描画
        bgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (imageTransform.img) {
            bgCtx.save();
            bgCtx.translate(imageTransform.x, imageTransform.y);
            bgCtx.scale(imageTransform.scale, imageTransform.scale);
            bgCtx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
            bgCtx.restore();
        }
    }

    async function drawBackgroundLayer() {
        const path = getAssetPath({ category: 'background', value: state.template, type: 'base', isEn: state.lang === 'en' });
        try {
            const bgImg = await loadImage(path);
            // テンプレートを2番目のcharCtxに描画
            charCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            charCtx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } catch (error) { console.error('背景の描画に失敗:', error); }
    }

    async function redrawMiscIconComposite() {
        miscIconCompositeCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        await drawMiscIcons(miscIconCompositeCtx);
    }
    async function redrawMainJobComposite() {
        mainJobCompositeCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if(state.mainjob) await drawJobIcon(mainJobCompositeCtx, state.mainjob, 'main');
    }
    async function redrawSubJobComposite() {
        subJobCompositeCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        for(const job of state.subjobs) { await drawJobIcon(subJobCompositeCtx, job, 'sub'); }
    }

    async function drawUiLayer() {
        uiCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        uiCtx.drawImage(miscIconCompositeCanvas, 0, 0);
        uiCtx.drawImage(subJobCompositeCanvas, 0, 0);
        uiCtx.drawImage(mainJobCompositeCanvas, 0, 0);
        await drawNameText(uiCtx);
    }
    
    // --- 7. 描画ヘルパー ---
    async function drawSingleIcon(ctx, options) {
        const { category, value, type, theme, iconTint } = options;
        const path = getAssetPath({ category, value, type, theme, isEn: state.lang === 'en', langResource: options.langResource });
        try {
            const img = await loadImage(path);
            if(type === 'bg') drawImageWithTint(ctx, img, state.iconBgColor);
            else drawImageWithTint(ctx, img, iconTint);
        } catch(e) {/* ignore */}
    }

    async function drawMiscIcons(ctx) {
        const isEn = state.lang === 'en';
        const config = templateConfig[state.template];
        if (!config) return;

        if(state.dc) await drawSingleIcon(ctx, { category: 'dc', value: state.dc, theme: config.iconTheme, iconTint: config.iconTint });
        if(state.race) {
            await drawSingleIcon(ctx, { category: 'race', value: state.race, type: 'bg' });
            await drawSingleIcon(ctx, { category: 'race', value: state.race, type: 'frame', theme: config.iconTheme, iconTint: config.iconTint });
        }
        if(state.progress) {
            await drawSingleIcon(ctx, { category: 'progress', value: state.progress, type: 'frame', theme: config.iconTheme, iconTint: config.iconTint, langResource: true });
        }
        for(const style of state.playstyles) {
            await drawSingleIcon(ctx, { category: 'playstyle', value: style, type: 'frame', theme: config.iconTheme, iconTint: config.iconTint, langResource: true });
        }
        for(const time of state.playtimes) {
            const isSpecial = time === 'random' || time === 'fulltime';
            await drawSingleIcon(ctx, { category: 'time', value: time, type: isSpecial ? 'frame' : 'icon', theme: config.iconTheme, iconTint: config.iconTint, langResource: isSpecial });
        }
        for(const diff of state.difficulties) {
             await drawSingleIcon(ctx, { category: 'raid', value: diff, type: 'bg', theme: config.frame.includes('circle') ? 'Circle' : (config.frame.includes('Neon') ? 'Neon' : 'Common') });
        }
    }

    async function drawJobIcon(ctx, jobName, type) {
        const config = templateConfig[state.template];
        if (!config) return;
        if (type === 'main') {
            await drawSingleIcon(ctx, { category: 'job', value: jobName, variant: '_main', iconTint: config.iconTint });
        } else {
            const theme = config.frame.includes('circle') ? 'Circle' : 'Common';
            await drawSingleIcon(ctx, { category: 'job', value: jobName, variant: '_sub_bg', theme: theme });
        }
    }
    
    async function drawNameText(ctx) {
        if(!state.characterName || !state.font) return;
        const config = templateConfig[state.template];
        if(!config) return;
        
        try { await document.fonts.load(`32px "${state.font}"`); } catch (err) { console.warn(`フォントの読み込みに失敗: ${state.font}`, err); }
        
        ctx.fillStyle = config.nameColor || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let fontSize = 32;
        const nameArea = config.nameArea;
        ctx.font = `${fontSize}px "${state.font}"`;
        while(ctx.measureText(state.characterName).width > nameArea.width && fontSize > 10) {
            fontSize--;
            ctx.font = `${fontSize}px "${state.font}"`;
        }
        ctx.fillText(state.characterName, nameArea.x + nameArea.width / 2, nameArea.y + nameArea.height / 2);
    }
    
    // --- 8. UIロジックと言語対応 ---
    function handleImageUpload(file) {
        if (!file) { imageTransform.img = null; fileNameDisplay.textContent = ''; drawCharacterLayer(); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                imageTransform.img = img;
                const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
                const imgAspect = img.width / img.height;
                imageTransform.scale = (imgAspect > canvasAspect) ? (CANVAS_HEIGHT / img.height) : (CANVAS_WIDTH / img.width);
                imageTransform.x = CANVAS_WIDTH / 2;
                imageTransform.y = CANVAS_HEIGHT / 2;
                drawCharacterLayer();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        fileNameDisplay.textContent = file.name;
    }
    
    function updateUIText(lang) {
        const t = translations[lang];
        document.querySelector('.file-upload-label span').textContent = t.uploadBtn;
        document.querySelector('.usage-notes .notes-text').textContent = t.copyrightNotice;
        nameInput.placeholder = t.namePlaceholder;
        fontSelect.querySelector('option[disabled]').textContent = t.fontPlaceholder;
        dcSelect.querySelector('option[disabled]').textContent = t.dcPlaceholder;
        raceSelect.querySelector('option[disabled]').textContent = t.racePlaceholder;
        progressSelect.querySelector('option[disabled]').textContent = t.progressPlaceholder;
        mainjobSelect.querySelector('option[disabled]').textContent = t.mainJobPlaceholder;
        downloadBtn.querySelector('span').textContent = t.downloadBtnText;
        saveModal.querySelector('h3').textContent = t.modalTitle;
        saveModal.querySelector('p').textContent = t.modalDesc;
    }

    function syncColorPickers(source, target) { target.value = source.value; }

    // --- 9. イベントリスナー ---
    langTabs.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;
        const selectedLang = e.target.dataset.lang;
        document.querySelector('.lang-tab-btn.active').classList.remove('active');
        e.target.classList.add('active');
        state.lang = selectedLang;
        updateUIText(selectedLang);
        controlsJp.style.display = (selectedLang === 'jp') ? 'block' : 'none';
        controlsEn.style.display = (selectedLang === 'en') ? 'block' : 'none';
        drawBackgroundLayer();
        debouncedRedrawMisc();
    });

    const setColor = (color) => {
        iconBgColorPicker.value = color;
        stickyIconBgColorPicker.value = color;
        state.iconBgColor = color;
        debouncedRedrawMisc();
        debouncedRedrawSubJob();
    };
    iconBgColorPicker.addEventListener('input', () => setColor(iconBgColorPicker.value));
    stickyIconBgColorPicker.addEventListener('input', () => setColor(stickyIconBgColorPicker.value));
    colorPresetButtons.addEventListener('click', (e) => { if (e.target.classList.contains('preset-color-btn')) setColor(e.target.dataset.color); });
    stickyColorPresetButtons.addEventListener('click', (e) => { if (e.target.classList.contains('preset-color-btn')) setColor(e.target.dataset.color); });

    uploadImageInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
    
    templateSelect.addEventListener('change', async () => {
        updateState();
        const defaultConfig = templateConfig[state.template]?.defaultBg || '#CCCCCC';
        setColor(defaultConfig);
        await drawBackgroundLayer();
        await redrawMiscIconComposite();
        await drawUiLayer();
    });

    nameInput.addEventListener('input', () => { updateState(); debouncedNameDraw(); });
    fontSelect.addEventListener('change', () => { updateState(); debouncedNameDraw(); });
    
    [dcSelect, raceSelect, progressSelect].forEach(el => el.addEventListener('change', () => { updateState(); debouncedRedrawMisc(); }));
    
    [styleButtonsContainer, playtimeOptionsContainer, difficultyOptionsContainer].forEach(container => {
        container.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') e.target.classList.toggle('active');
            if(e.target.tagName === 'BUTTON' || e.target.type === 'checkbox') {
                updateState();
                debouncedRedrawMisc();
            }
        });
    });

    mainjobSelect.addEventListener('change', (e) => {
        const newMainJob = e.target.value;
        if (previousMainJob) {
            const prevBtn = subjobSection.querySelector(`button[data-value="${previousMainJob}"]`);
            if (prevBtn) prevBtn.classList.remove('active');
        }
        if (newMainJob) {
            const newBtn = subjobSection.querySelector(`button[data-value="${newMainJob}"]`);
            if (newBtn) newBtn.classList.add('active');
        }
        previousMainJob = newMainJob;
        updateState();
        debouncedRedrawMainJob();
        debouncedRedrawSubJob();
    });

    subjobSection.addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON') {
            e.target.classList.toggle('active');
            updateState();
            debouncedRedrawSubJob();
        }
    });
    
    // --- 10. イベントリスナー (画像操作) ---
    function getEventLocation(e) {
        const rect = uiLayer.getBoundingClientRect();
        const scaleX = uiLayer.width / rect.width;
        const scaleY = uiLayer.height / rect.height;
        if (e.touches && e.touches[0]) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }
    function handleDragStart(e) { if (!imageTransform.img) return; e.preventDefault(); const loc = getEventLocation(e); imageTransform.isDragging = true; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; }
    function handleDragMove(e) { if (!imageTransform.isDragging) return; e.preventDefault(); const loc = getEventLocation(e); const dx = loc.x - imageTransform.lastX; const dy = loc.y - imageTransform.lastY; imageTransform.x += dx; imageTransform.y += dy; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y; throttledDrawChar(); }
    function handleDragEnd() { imageTransform.isDragging = false; }
    
    uiLayer.addEventListener('mousedown', handleDragStart, { passive: false });
    uiLayer.addEventListener('mousemove', handleDragMove, { passive: false });
    uiLayer.addEventListener('mouseup', handleDragEnd);
    uiLayer.addEventListener('mouseleave', handleDragEnd);
    
    uiLayer.addEventListener('wheel', (e) => { if (!imageTransform.img) return; e.preventDefault(); const scaleAmount = e.deltaY < 0 ? 1.1 : 1 / 1.1; const newScale = imageTransform.scale * scaleAmount; imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0)); throttledDrawChar(); }, { passive: false });

    uiLayer.addEventListener('touchstart', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        if (e.touches.length === 1) { handleDragStart(e); } 
        else if (e.touches.length === 2) {
            imageTransform.isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            imageTransform.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });

    uiLayer.addEventListener('touchmove', (e) => {
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

    uiLayer.addEventListener('touchend', (e) => { if (e.touches.length < 2) { imageTransform.isDragging = false; } imageTransform.lastTouchDistance = 0; });

    // --- 11. ダウンロード処理 ---
    downloadBtn.addEventListener('click', async () => {
        if (isDownloading) return;
        isDownloading = true;
        const originalText = downloadBtn.querySelector('span').textContent;
        downloadBtn.querySelector('span').textContent = translations[state.lang].generatingText;
        
        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = CANVAS_WIDTH;
            finalCanvas.height = CANVAS_HEIGHT;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';

            // 1. ユーザー画像を描画
            if (imageTransform.img) {
                finalCtx.drawImage(backgroundLayer, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // bgCtxが描画したレイヤー
            }

            // 2. キャラクター画像の上にかぶせるテンプレート部分を描画
            const bgCpPath = getAssetPath({ category: 'background', value: state.template, type: 'base', isEn: state.lang === 'en', isDownload: true, langResource: true });
            const bgCpImg = await loadImage(bgCpPath);
            finalCtx.drawImage(bgCpImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // 3. UI要素をすべて再描画
            await drawMiscIcons(finalCtx);
            for(const job of state.subjobs) { await drawJobIcon(finalCtx, job, 'sub'); }
            if(state.mainjob) await drawJobIcon(finalCtx, state.mainjob, 'main');
            await drawNameText(finalCtx);

            // 4. ダウンロードまたはモーダル表示
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
            downloadBtn.querySelector('span').textContent = originalText;
        }
    });

    closeModalBtn.addEventListener('click', () => saveModal.classList.add('hidden'));
    
    // --- 12. 初期化処理 ---
    async function initialize() {
        console.log("統合版ジェネレーターを初期化します。");
        updateState();
        const initialConfig = templateConfig[state.template];
        if (initialConfig) setColor(initialConfig.defaultBg);
        
        fontSelect.value = state.font;

        await drawCharacterLayer(); //
        await drawBackgroundLayer();
        await Promise.all([ redrawMiscIconComposite(), redrawMainJobComposite(), redrawSubJobComposite() ]);
        await drawUiLayer();
        
        loaderElement.classList.add('hidden');
        appElement.classList.remove('hidden');
    }

    initialize();
});