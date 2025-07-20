document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 初期設定と要素の取得 ---
    const app = document.getElementById('app');
    const loader = document.getElementById('loader');
    const backgroundLayer = document.getElementById('background-layer');
    const characterLayer = document.getElementById('character-layer');
    const uiLayer = document.getElementById('ui-layer');
    const bgCtx = backgroundLayer.getContext('2d');
    const charCtx = characterLayer.getContext('2d');
    const uiCtx = uiLayer.getContext('2d');
    const canvasContainer = document.querySelector('.canvas-container');

    // --- UI要素 ---
    const templateSelect = document.getElementById('templateSelect');
    const uploadImageInput = document.getElementById('uploadImage');
    const fileNameDisplay = document.getElementById('fileName');
    const nameInput = document.getElementById('nameInput');
    const fontSelect = document.getElementById('fontSelect');
    const dcSelect = document.getElementById('dcSelect');
    const raceSelect = document.getElementById('raceSelect');
    const progressSelect = document.getElementById('progressSelect');
    const styleButtonsContainer = document.getElementById('styleButtons');
    const playtimeOptionsContainer = document.getElementById('playtimeOptions');
    const difficultyOptionsContainer = document.getElementById('difficultyOptions');
    const mainjobSelect = document.getElementById('mainjobSelect');
    const subjobSection = document.getElementById('subjobSection');
    const downloadBtn = document.getElementById('downloadBtn');
    const toTopBtn = document.getElementById('toTopBtn');
    
    // --- 新UI要素 ---
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

    // --- 2. 状態管理 ---
    let characterImage = null;
    let charPos = { x: 500, y: 300 };
    let charScale = 1.0;
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let lastCharPos = { x: 500, y: 300 };
    let cardState = {};
    let imageCache = {}; 

    // --- 描画位置と設定の定義 ---
    const positions = {
        dc: { x: 800, y: 50, w: 150, h: 40 },
        characterName: { x: 800, y: 120 },
        race: { x: 750, y: 180, w: 60, h: 60 },
        progress: [
            { x: 720, y: 250, w: 40, h: 40 }, { x: 770, y: 250, w: 40, h: 40 },
            { x: 820, y: 250, w: 40, h: 40 }, { x: 870, y: 250, w: 40, h: 40 },
            { x: 920, y: 250, w: 40, h: 40 }, { x: 745, y: 300, w: 40, h: 40 },
            { x: 795, y: 300, w: 40, h: 40 }
        ],
        playstyle: { startX: 720, startY: 360, w: 60, h: 60, gap: 10, perRow: 4 },
        time: { startX: 720, startY: 480, w: 40, h: 40, gap: 5, perRow: 6 },
        raid: { x: 100, y: 400, w: 80, h: 80 },
        mainjob: { x: 200, y: 400, w: 80, h: 80 },
        subjob: { startX: 300, startY: 400, w: 50, h: 50, gap: 5, perRow: 5 },
    };

    const progressOrder = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
    const playstyleMap = {
        leveling: { ja: '01', en: '01' }, raid: { ja: '02', en: '02' }, pvp: { ja: '03', en: '03' },
        dd: { ja: '04', en: '04' }, mobhunt: { ja: '05', en: '10' }, map: { ja: '06', en: '06' },
        gatherer: { ja: '07', en: '07' }, crafter: { ja: '08', en: '08' }, gil: { ja: '09', en: '09' },
        perform: { ja: '10', en: '05' }, streaming: { ja: '11', en: '15' }, glam: { ja: '12', en: '11' },
        studio: { ja: '13', en: '12' }, housing: { ja: '14', en: '14' }, screenshot: { ja: '15', en: '13' },
        drawing: { ja: '16', en: '16' }, roleplay: { ja: '17', en: '17' }
    };

    // --- 3. 関数定義 ---

    function updateCardState() {
        const selectedStyles = [...styleButtonsContainer.querySelectorAll('button.active')].map(btn => btn.dataset.value);
        const selectedPlaytimes = [...playtimeOptionsContainer.querySelectorAll('input:checked')].map(cb => cb.value);
        const selectedDifficulties = [...difficultyOptionsContainer.querySelectorAll('input:checked')].map(cb => cb.value);
        const selectedSubjobs = [...subjobSection.querySelectorAll('button.active')].map(btn => btn.dataset.value);

        cardState = {
            lang: document.querySelector('.lang-tab-btn.active').dataset.lang,
            template: templateSelect.value,
            iconBgColor: iconBgColorPicker.value,
            characterName: nameInput.value,
            font: fontSelect.value,
            dc: dcSelect.value,
            race: raceSelect.value,
            progress: progressSelect.value,
            playstyles: selectedStyles,
            playtimes: selectedPlaytimes,
            difficulties: selectedDifficulties,
            mainjob: mainjobSelect.value,
            subjobs: selectedSubjobs,
        };
        
        drawCard();
    }

    async function drawCard() {
        if (!cardState.template) return;

        bgCtx.clearRect(0, 0, 1000, 600);
        charCtx.clearRect(0, 0, 1000, 600);
        uiCtx.clearRect(0, 0, 1000, 600);

        try {
            const langSuffix = cardState.lang === 'en' ? '_en' : '';

            // --- 1. ベース背景の描画 ---
            const bgPath = `assets/images/background/base/${cardState.template}${langSuffix}.webp`;
            const baseBgImg = await loadImage(bgPath);
            bgCtx.drawImage(baseBgImg, 0, 0, 1000, 600);

            // --- 2. 低階層アイコン（レイド、メインジョブ、サブジョブ）---
            await drawLowLayerIcons(bgCtx);

            // --- 3. オーバーレイフレームの描画 ---
            let framePath = 'assets/images/background/frame/Common_square_frame.webp';
            let frameTint = getFrameTint(cardState.template);
            if (cardState.template.startsWith('Water') || cardState.template.startsWith('Lovely_')) {
                framePath = 'assets/images/background/frame/Common_circle_frame.webp';
            } else if (cardState.template.startsWith('Neon_')) {
                framePath = 'assets/images/background/frame/Neon_square_frame.webp';
            }
            const frameImg = await loadImage(framePath);
            if(frameTint) {
                drawImageWithTint(bgCtx, frameImg, 0, 0, 1000, 600, frameTint);
            } else {
                bgCtx.drawImage(frameImg, 0, 0, 1000, 600);
            }

            // --- 4. キャラクター画像の描画 ---
            if (characterImage) {
                charCtx.save();
                charCtx.translate(charPos.x, charPos.y);
                charCtx.scale(charScale, charScale);
                charCtx.drawImage(characterImage, -characterImage.width / 2, -characterImage.height / 2);
                charCtx.restore();
            }

            // --- 5. 高階層アイコン（種族、進行度、プレイスタイル、時間）---
            await drawHighLayerIcons(uiCtx);

            // --- 6. テキスト（DC、キャラ名など）---
            await drawTexts(uiCtx);
            
        } catch (error) {
            console.error("Error during card drawing:", error);
        }
    }
    
    // --- 描画ヘルパー関数群 ---
    
    async function drawLowLayerIcons(ctx) {
        // レイド
        for (const difficulty of cardState.difficulties) {
            const theme = (cardState.template.startsWith('Water') || cardState.template.startsWith('Lovely_')) ? 'Circle' : (cardState.template.startsWith('Neon_') ? 'Neon' : 'Common');
            const path = `assets/images/raid/${theme}_raid_${difficulty}_bg.webp`;
            const img = await loadImage(path);
            const color = getDefaultBgColor(cardState.template, 'raid');
            drawImageWithTint(ctx, img, positions.raid.x, positions.raid.y, positions.raid.w, positions.raid.h, cardState.iconBgColor || color);
        }
        // メインジョブ
        if (cardState.mainjob) {
            const path = `assets/images/job/Common_job_${cardState.mainjob}_main.webp`;
            const img = await loadImage(path);
            const tint = getIconTint(cardState.template);
            if (tint) {
                drawImageWithTint(ctx, img, positions.mainjob.x, positions.mainjob.y, positions.mainjob.w, positions.mainjob.h, tint);
            } else {
                ctx.drawImage(img, positions.mainjob.x, positions.mainjob.y, positions.mainjob.w, positions.mainjob.h);
            }
        }
        // サブジョブ
        cardState.subjobs.forEach(async (job, index) => {
            const row = Math.floor(index / positions.subjob.perRow);
            const col = index % positions.subjob.perRow;
            const x = positions.subjob.startX + col * (positions.subjob.w + positions.subjob.gap);
            const y = positions.subjob.startY + row * (positions.subjob.h + positions.subjob.gap);
            
            const bgTheme = (cardState.template.startsWith('Water') || cardState.template.startsWith('Lovely_')) ? 'Circle' : 'Common';
            const bgPath = `assets/images/job/${bgTheme}_job_${job}_sub_bg.webp`;
            const bgImg = await loadImage(bgPath);
            const color = getDefaultBgColor(cardState.template, 'subjob');
            drawImageWithTint(ctx, bgImg, x, y, positions.subjob.w, positions.subjob.h, cardState.iconBgColor || color);

            // サブジョブの_frameは存在しないので、描画しない
        });
    }

    async function drawHighLayerIcons(ctx) {
        const langSuffix = cardState.lang === 'en' ? '_en' : '';
        // 種族
        if (cardState.race) {
            const bgPath = `assets/images/race/bg/Common_race_${cardState.race}_bg.webp`;
            const bgImg = await loadImage(bgPath);
            const color = getDefaultBgColor(cardState.template, 'race');
            drawImageWithTint(ctx, bgImg, positions.race.x, positions.race.y, positions.race.w, positions.race.h, cardState.iconBgColor || color);
            
            const frameTheme = cardState.template.startsWith('Royal_') ? 'Royal' : 'Common';
            const framePath = `assets/images/race/frame/${frameTheme}_race_${cardState.race}_frame.webp`;
            const frameImg = await loadImage(framePath);
            const tint = getIconTint(cardState.template);
             if(tint && frameTheme === 'Common') {
                drawImageWithTint(ctx, frameImg, positions.race.x, positions.race.y, positions.race.w, positions.race.h, tint);
            } else {
                ctx.drawImage(frameImg, positions.race.x, positions.race.y, positions.race.w, positions.race.h);
            }
        }
        // 進行度
        if (cardState.progress) {
            const progressIndex = progressOrder.indexOf(cardState.progress);
            for (let i = 0; i <= progressIndex; i++) {
                const currentProgress = progressOrder[i];
                const pos = positions.progress[i];
                const bgPath = `assets/images/progress/bg/Common_progress_${currentProgress}_bg.webp`;
                const bgImg = await loadImage(bgPath);
                const color = getDefaultBgColor(cardState.template, 'progress');
                drawImageWithTint(ctx, bgImg, pos.x, pos.y, pos.w, pos.h, cardState.iconBgColor || color);
            }
            const frameTheme = cardState.template.startsWith('Royal_') ? 'Royal' : 'Common';
            const framePath = `assets/images/progress/frame/${frameTheme}_progress_${cardState.progress}_frame${langSuffix}.webp`;
            const frameImg = await loadImage(framePath);
            const pos = positions.progress[progressIndex];
            const tint = getIconTint(cardState.template);
            if(tint && frameTheme === 'Common') {
                drawImageWithTint(ctx, frameImg, pos.x, pos.y, pos.w, pos.h, tint);
            } else {
                ctx.drawImage(frameImg, pos.x, pos.y, pos.w, pos.h);
            }
        }
        
        // プレイスタイル
        cardState.playstyles.forEach(async (style, index) => {
            const row = Math.floor(index / positions.playstyle.perRow);
            const col = index % positions.playstyle.perRow;
            const x = positions.playstyle.startX + col * (positions.playstyle.w + positions.playstyle.gap);
            const y = positions.playstyle.startY + row * (positions.playstyle.h + positions.playstyle.gap);

            const bgNumber = playstyleMap[style][cardState.lang];
            const bgPath = `assets/images/playstyle/bg/Common_playstyle_${bgNumber}_bg.webp`;
            const bgImg = await loadImage(bgPath);
            const color = getDefaultBgColor(cardState.template, 'playstyle');
            drawImageWithTint(ctx, bgImg, x, y, positions.playstyle.w, positions.playstyle.h, cardState.iconBgColor || color);

            const framePath = `assets/images/playstyle/frame/Common_playstyle_${style}_frame${langSuffix}.webp`;
            const frameImg = await loadImage(framePath);
            const tint = getIconTint(cardState.template);
            if(tint) {
                drawImageWithTint(ctx, frameImg, x, y, positions.playstyle.w, positions.playstyle.h, tint);
            } else {
                ctx.drawImage(frameImg, x, y, positions.playstyle.w, positions.playstyle.h);
            }
        });

        // 時間
        cardState.playtimes.forEach(async (time, index) => {
            const row = Math.floor(index / positions.time.perRow);
            const col = index % positions.time.perRow;
            const x = positions.time.startX + col * (positions.time.w + positions.time.gap);
            const y = positions.time.startY + row * (positions.time.h + positions.time.gap);

            const isSpecial = time === 'fulltime' || time === 'random';
            if (isSpecial) {
                const bgPath = `assets/images/time/bg/Common_time_${time}_bg.webp`;
                const bgImg = await loadImage(bgPath);
                const color = getDefaultBgColor(cardState.template, 'time');
                drawImageWithTint(ctx, bgImg, x, y, positions.time.w, positions.time.h, cardState.iconBgColor || color);

                const frameTheme = cardState.template.startsWith('Royal_') ? 'Royal' : 'Common';
                const framePath = `assets/images/time/frame/${frameTheme}_time_${time}_frame${langSuffix}.webp`;
                const frameImg = await loadImage(framePath);
                const tint = getIconTint(cardState.template);
                if(tint && frameTheme === 'Common') {
                    drawImageWithTint(ctx, frameImg, x, y, positions.time.w, positions.time.h, tint);
                } else {
                    ctx.drawImage(frameImg, x, y, positions.time.w, positions.time.h);
                }
            } else {
                const path = `assets/images/time/icon/Common_time_${time}.webp`;
                const img = await loadImage(path);
                const tint = getIconTint(cardState.template);
                if(tint) {
                    drawImageWithTint(ctx, img, x, y, positions.time.w, positions.time.h, tint);
                } else {
                    ctx.drawImage(img, x, y, positions.time.w, positions.time.h);
                }
            }
        });
    }

    async function drawTexts(ctx) {
        // DC
        if(cardState.dc) {
            const theme = cardState.template.startsWith('Royal_') ? 'Royal' : 'Common';
            const tint = getIconTint(cardState.template);
            const path = `assets/images/dc/${theme}_dc_${cardState.dc}.webp`;
            const img = await loadImage(path);
            if(tint && theme === 'Common') {
                drawImageWithTint(ctx, img, positions.dc.x, positions.dc.y, positions.dc.w, positions.dc.h, tint);
            } else {
                ctx.drawImage(img, positions.dc.x, positions.dc.y, positions.dc.w, positions.dc.h);
            }
        }
        // キャラクター名
        if(cardState.characterName && cardState.font) {
            ctx.font = `32px ${cardState.font}`;
            ctx.fillStyle = '#FFFFFF'; // TODO: テンプレート毎に色を変える
            ctx.textAlign = 'center';
            ctx.fillText(cardState.characterName, positions.characterName.x, positions.characterName.y);
        }
    }
    
    function getFrameTint(template) {
        if (template.startsWith('Lovely_')) return '#E1C8D2';
        if (template.startsWith('Royal_')) return '#A2850A';
        if (template === 'Gothic_white') return '#000000';
        return null;
    }

    function getIconTint(template) {
        if (template === 'Gothic_white') return '#000000';
        if (template.startsWith('Lovely_')) return '#E1C8D2';
        if (template.startsWith('Royal_')) return '#A2850A';
        return null;
    }

    function getDefaultBgColor(template, componentType = '') {
        const colors = {
            'Gothic_black': '#A142CD', 'Gothic_pink': '#A142CD',
            'Gothic_white': '#6CD9D6',
            'Lovely_heart': '#D34669',
            'Neon_mono': '#B70016',
            'Neon_duotonek': (componentType === 'raid' || componentType === 'subjob') ? '#80FF00' : '#FFF500',
            'Neon_meltdown': (componentType === 'raid' || componentType === 'subjob') ? '#00BAFF' : '#FF00CF',
            'Water': '#FFFFFF',
            'Royal_garnet': '#000000', 'Royal_sapphire': '#000000',
        };
        const colorValue = colors[template];
        return typeof colorValue === 'function' ? colorValue(componentType) : colorValue || '#CCCCCC';
    }

    function loadImage(src) {
        if (imageCache[src]) return Promise.resolve(imageCache[src]);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { imageCache[src] = img; resolve(img); };
            img.onerror = (err) => { console.error(`画像の読み込みに失敗: ${src}`); reject(new Error(`Failed to load image: ${src}`)); };
            img.src = src;
        });
    }

    function drawImageWithTint(ctx, image, x, y, width, height, color) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width; tempCanvas.height = height;
        tempCtx.drawImage(image, 0, 0, width, height);
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = color;
        tempCtx.fillRect(0, 0, width, height);
        ctx.drawImage(tempCanvas, x, y, width, height);
    }

    function handleImageUpload(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                characterImage = img;
                const canvasAspect = 1000 / 600;
                const imgAspect = img.width / img.height;
                charScale = (imgAspect > canvasAspect) ? 1000 / img.width : 600 / img.height;
                charPos = { x: 500, y: 300 };
                updateCardState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        fileNameDisplay.textContent = file.name;
    }

    // --- 4. 新機能のイベントリスナー ---
    if (langTabs) {
        langTabs.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const selectedLang = e.target.dataset.lang;
            document.querySelector('.lang-tab-btn.active').classList.remove('active');
            e.target.classList.add('active');
            controlsJp.style.display = (selectedLang === 'jp') ? 'block' : 'none';
            controlsEn.style.display = (selectedLang === 'en') ? 'block' : 'none';
            updateCardState();
        });
    }

    function handleStickyPickerVisibility() {
        if (!mainColorPickerSection || !stickyColorPicker || !toTopBtn) return;
        const rect = mainColorPickerSection.getBoundingClientRect();
        if (rect.bottom < 80) {
            stickyColorPicker.classList.remove('is-hidden');
            toTopBtn.classList.add('with-sticky-picker');
        } else {
            stickyColorPicker.classList.add('is-hidden');
            stickyColorPicker.classList.remove('is-open');
            toTopBtn.classList.remove('with-sticky-picker');
        }
    }
    window.addEventListener('scroll', handleStickyPickerVisibility);

    if (stickyPickerToggleButton) {
        stickyPickerToggleButton.addEventListener('click', () => {
            stickyColorPicker.classList.toggle('is-open');
        });
    }

    function syncColorPickers(source, target) { target.value = source.value; }
    
    if (iconBgColorPicker && stickyIconBgColorPicker) {
        iconBgColorPicker.addEventListener('input', () => { syncColorPickers(iconBgColorPicker, stickyIconBgColorPicker); updateCardState(); });
        stickyIconBgColorPicker.addEventListener('input', () => { syncColorPickers(stickyIconBgColorPicker, iconBgColorPicker); updateCardState(); });
    }

    function applyColorPreset(color) {
        iconBgColorPicker.value = color;
        stickyIconBgColorPicker.value = color;
        updateCardState();
    }

    if (colorPresetButtons) {
        colorPresetButtons.addEventListener('click', (e) => { if (e.target.classList.contains('preset-color-btn')) applyColorPreset(e.target.dataset.color); });
    }
    if (stickyColorPresetButtons) {
        stickyColorPresetButtons.addEventListener('click', (e) => { if (e.target.classList.contains('preset-color-btn')) applyColorPreset(e.target.dataset.color); });
    }
    
    // --- 5. 既存のイベントリスナー ---
    [templateSelect, nameInput, fontSelect, dcSelect, raceSelect, progressSelect, mainjobSelect].forEach(el => { if(el) el.addEventListener('change', updateCardState); });
    nameInput.addEventListener('input', updateCardState);
    [styleButtonsContainer, playtimeOptionsContainer, difficultyOptionsContainer, subjobSection].forEach(container => {
        if(container) container.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') e.target.classList.toggle('active');
            if(e.target.tagName === 'BUTTON' || e.target.type === 'checkbox') updateCardState();
        });
    });
    uploadImageInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
    canvasContainer.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    canvasContainer.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); });
    canvasContainer.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files[0]) handleImageUpload(e.dataTransfer.files[0]); });
    uiLayer.addEventListener('mousedown', (e) => { isDragging = true; startPos = { x: e.clientX, y: e.clientY }; lastCharPos = { ...charPos }; uiLayer.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', () => { isDragging = false; uiLayer.style.cursor = 'grab'; });
    window.addEventListener('mousemove', (e) => { if (!isDragging) return; const dx = e.clientX - startPos.x; const dy = e.clientY - startPos.y; charPos.x = lastCharPos.x + dx; charPos.y = lastCharPos.y + dy; updateCardState(); });
    uiLayer.addEventListener('wheel', (e) => { e.preventDefault(); const scaleAmount = 0.1; charScale += (e.deltaY < 0) ? scaleAmount : -scaleAmount; charScale = Math.max(0.1, charScale); updateCardState(); });
    window.addEventListener('scroll', () => { if (window.scrollY > 300) toTopBtn.classList.add('visible'); else toTopBtn.classList.remove('visible'); });
    toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // --- 6. GTMイベントリスナー ---
    document.getElementById('templateSelect').addEventListener('change', function() { window.dataLayer.push({ event: 'template_select', templateName: this.value }); });
    document.getElementById('downloadBtn').addEventListener('click', function() { window.dataLayer.push({ event: 'generate_card' }); });
    document.getElementById('uploadImage').addEventListener('change', function() { window.dataLayer.push({ event: 'upload_image' }); });
    document.getElementById('fontSelect').addEventListener('change', function() { window.dataLayer.push({ event: 'select_font', fontName: this.value }); });
    document.getElementById('dcSelect').addEventListener('change', function() { window.dataLayer.push({ event: 'select_dc', dcName: this.value }); });
    document.getElementById('raceSelect').addEventListener('change', function() { window.dataLayer.push({ event: 'select_race', raceName: this.value }); });
    document.getElementById('progressSelect').addEventListener('change', function() { window.dataLayer.push({ event: 'select_progress', progressName: this.value }); });
    document.getElementById('styleButtons').addEventListener('click', function(e) { if (e.target.tagName === 'BUTTON') { window.dataLayer.push({ event: 'select_playstyle', playstyleName: e.target.dataset.value }); } });

    // --- 7. 初期化処理 ---
    function init() {
        [backgroundLayer, characterLayer, uiLayer].forEach(canvas => { canvas.width = 1000; canvas.height = 600; });
        updateCardState();
        loader.classList.add('hidden');
        app.classList.remove('hidden');
    }

    init();
});
