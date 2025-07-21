/**
 * FFXIV Character Card Generator - Complete Integrated Version
 * - main(1).js の堅牢なパフォーマンス・アーキテクチャをベースに採用
 * - test.js の新機能（多言語対応、アイコン色変更、Sticky UI）を統合
 * - 新しいアセット構造とHTML構造に完全対応
 * - 画像操作、ダウンロード処理を含むすべての機能を実装
 * - 2025-07-21 v11:15: 参照エラーを含む最終バグ修正
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
        lang: 'jp', template: 'Gothic_black', iconBgColor: '#A142CD', characterName: '',
        font: "'Exo 2', sans-serif",
        dc: '', race: '', progress: '', playstyles: [], playtimes: [], difficulties: [], mainjob: '', subjobs: [],
    };
    let imageTransform = { img: null, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 1.0, isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0 };
    let imageCache = {};
    let isDownloading = false;
    let previousMainJob = '';

    // --- 4. コア関数 ---
    function getAssetPath(options) {
        if (options.category === 'background' && options.type === 'base') {
            const langSuffix = (state.lang === 'en' && options.langResource) ? '_en' : '';
            const cpSuffix = options.isDownload ? '_cp' : '';
            return `./assets/images/background/base/${options.value}${cpSuffix}${langSuffix}.webp`;
        }
    
        const theme = options.theme || 'Common';
        const langSuffix = (options.isEn && options.langResource) ? '_en' : '';
        let path = `./assets/images/${options.category}/`;
        if (options.type) path += `${options.type}/`;
        const variant = options.variant || '';

        const value = options.mappedValue || options.value;
        path += `${theme}_${options.category}_${value}${variant}${langSuffix}.webp`;
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
        if (!image) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width; tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0);

        if(color) {
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = color;
            tempCtx.fillRect(0, 0, image.width, image.height);
        }
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
    async function drawMiscIcons(ctx) {
        const config = templateConfig[state.template];
        if (!config) return;

        const raceAssetMap = {
            'au_ra': 'aura', 'roegadyn': 'roegadyn', 'miqote': 'miqote', 'hyur': 'hyur', 'elezen': 'elezen',
            'lalafell': 'lalafell', 'hrothgar': 'hrothgar', 'viera': 'viera'
        };
        const playstyleAssetMap = { raid: 'dd' };
        const playstyleBgNumMap = {
            leveling: '01', raid: '02', pvp: '03', dd: '04', hunt: '05', map: '06', gatherer: '07', crafter: '08', gil: '09', perform: '10',
            streaming: '11', glam: '12', studio: '13', housing: '14', screenshot: '15', drawing: '16', roleplay: '17',
        };

        const drawIcon = async (path, tintColor) => {
            try {
                const img = await loadImage(path);
                drawImageWithTint(ctx, img, tintColor);
            } catch (e) { /* 画像がなければ無視 */ }
        };

        if (state.dc) await drawIcon(getAssetPath({ category: 'dc', value: state.dc, theme: config.iconTheme }), config.iconTint);
        
        if (state.race) {
            const raceValueForAsset = raceAssetMap[state.race] || state.race;
            await drawIcon(getAssetPath({ category: 'race', value: raceValueForAsset, type: 'bg', variant: '_bg'}), state.iconBgColor);
            await drawIcon(getAssetPath({ category: 'race', value: raceValueForAsset, type: 'frame', variant: '_frame', theme: config.iconTheme }), config.iconTint);
        }
        
        if (state.progress) {
            const progressStages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
            const isAllClear = state.progress === 'all_clear';
            const currentIndex = isAllClear ? progressStages.length - 1 : progressStages.indexOf(state.progress);
            
            if (currentIndex > -1) {
                for (let i = 0; i <= currentIndex; i++) {
                    await drawIcon(getAssetPath({ category: 'progress', value: progressStages[i], type: 'bg', variant: '_bg' }), state.iconBgColor);
                }
            }
            if (isAllClear) {
                await drawIcon(getAssetPath({ category: 'progress', value: 'all_clear', type: 'bg', variant: '_bg' }), state.iconBgColor);
            }

            const isRoyalAllClear = config.iconTheme === 'Royal' && state.progress === 'all_clear';
            await drawIcon(getAssetPath({ category: 'progress', value: state.progress, type: 'frame', variant: '_frame', theme: config.iconTheme, langResource: true, isEn: isRoyalAllClear || state.lang === 'en' }), config.iconTint);
        }

        for (const style of state.playstyles) {
            const assetValue = playstyleAssetMap[style] || style;
            await drawIcon(getAssetPath({ category: 'playstyle', mappedValue: playstyleBgNumMap[style], type: 'bg', variant: '_bg' }), state.iconBgColor);
            await drawIcon(getAssetPath({ category: 'playstyle', value: assetValue, type: 'frame', variant: '_frame', theme: config.iconTheme, langResource: true }), config.iconTint);
        }

        for (const time of state.playtimes) {
            const isSpecial = time === 'random' || time === 'fulltime';
            const timeTheme = isSpecial ? config.iconTheme : 'Common';
            if (isSpecial) {
                await drawIcon(getAssetPath({ category: 'time', value: time, type: 'bg', variant: '_bg' }), state.iconBgColor);
            }
            await drawIcon(getAssetPath({ category: 'time', value: time, type: isSpecial ? 'frame' : 'icon', variant: isSpecial ? '_frame' : '', theme: timeTheme, langResource: isSpecial }), config.iconTint);
        }

        for (const diff of state.difficulties) {
            const theme = config.frame.includes('circle') ? 'Circle' : (config.frame.includes('Neon') ? 'Neon' : 'Common');
            await drawIcon(getAssetPath({ category: 'raid', value: diff, type: 'bg', theme, variant: '_bg' }), state.iconBgColor);
        }
        if (state.difficulties.length > 0) {
            await drawIcon(getAssetPath({ category: 'raid', value: 'frame', theme: config.iconTheme, langResource: true }), config.iconTint);
        }
    }

    async function drawJobIcon(ctx, jobName, type) {
        const config = templateConfig[state.template];
        if (!config) return;

        const drawIcon = async (path, tintColor) => {
            try {
                const img = await loadImage(path);
                drawImageWithTint(ctx, img, tintColor);
            } catch (e) { /* 画像がなければ無視 */ }
        };

        if (type === 'main') {
            await drawIcon(getAssetPath({ category: 'job', value: jobName, variant: '_main' }), config.iconTint);
        } else {
            const theme = config.frame.includes('circle') ? 'Circle' : 'Common';
            await drawIcon(getAssetPath({ category: 'job', value: jobName, theme: theme, variant: '_sub_bg' }), state.iconBgColor);
        }
    }
    
    async function drawNameText(ctx) {
        if(!state.characterName || !state.font) return;
        const config = templateConfig[state.template];
        if(!config) return;
        
        const fontName = state.font.split(',')[0].replace(/'/g, '');

        try { await document.fonts.load(`32px "${fontName}"`); } catch (err) { console.warn(`フォントの読み込みに失敗: ${fontName}`, err); }
        
        ctx.fillStyle = config.nameColor || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let fontSize = 32;
        const nameArea = config.nameArea;
        ctx.font = `${fontSize}px "${fontName}"`;
        while(ctx.measureText(state.characterName).width > nameArea.width && fontSize > 10) {
            fontSize--;
            ctx.font = `${fontSize}px "${fontName}"`;
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

            if (imageTransform.img) {
                finalCtx.drawImage(backgroundLayer, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            const bgCpPath = getAssetPath({ category: 'background', value: state.template, type: 'base', isEn: state.lang === 'en', isDownload: true, langResource: true });
            const bgCpImg = await loadImage(bgCpPath);
            finalCtx.drawImage(bgCpImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            await drawMiscIcons(finalCtx);
            for(const job of state.subjobs) { await drawJobIcon(finalCtx, job, 'sub'); }
            if(state.mainjob) await drawJobIcon(finalCtx, state.mainjob, 'main');
            await drawNameText(finalCtx);

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
        
        fontSelect.value = state.font;
        updateState();
        
        const initialConfig = templateConfig[state.template];
        if (initialConfig) setColor(initialConfig.defaultBg);

        await drawCharacterLayer();
        await drawBackgroundLayer();
        await Promise.all([ redrawMiscIconComposite(), redrawMainJobComposite(), redrawSubJobComposite() ]);
        await drawUiLayer();
        
        loaderElement.classList.add('hidden');
        appElement.classList.remove('hidden');
    }

    initialize();
});