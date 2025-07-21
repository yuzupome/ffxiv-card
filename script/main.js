/**
 * FFXIV Character Card Generator - Final Version
 * - 2025-07-21 v19:00: すべての描画ロジックとUI機能を統合した最終版
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. DOM要素の取得 ---
    const backgroundLayer = document.getElementById('background-layer');
    const characterLayer = document.getElementById('character-layer');
    const uiLayer = document.getElementById('ui-layer');
    const bgCtx = backgroundLayer.getContext('2d');
    const charCtx = characterLayer.getContext('2d');
    const uiCtx = uiLayer.getContext('2d');

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
    
    const toTopBtn = document.getElementById('toTopBtn');
    const saveModal = document.getElementById('saveModal');
    const modalImage = document.getElementById('modalImage');
    const closeModalBtn = document.getElementById('closeModal');

    // --- 2. 定数と設定 ---
    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 600;
    [backgroundLayer, characterLayer, uiLayer].forEach(c => { c.width = CANVAS_WIDTH; c.height = CANVAS_HEIGHT; });

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

    // --- 3. 状態管理 ---
    let state = {
        font: "'Exo 2', sans-serif",
    };
    let imageTransform = { img: null, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 1.0, isDragging: false, lastX: 0, lastY: 0 };
    let imageCache = {};
    let isDownloading = false;

    // --- 4. コア関数 ---
    const getAssetPath = (options) => `./assets/images/${options.category}/${options.filename}.webp`;

    const loadImage = (src) => {
        if (imageCache[src]) return Promise.resolve(imageCache[src]);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { imageCache[src] = img; resolve(img); };
            img.onerror = (err) => { console.error(`Failed to load: ${src}`); reject(err); };
            img.src = src;
        });
    };

    const drawTinted = async (ctx, path, tintColor) => {
        try {
            const img = await loadImage(path);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = CANVAS_WIDTH;
            tempCanvas.height = CANVAS_HEIGHT;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            if (tintColor) {
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = tintColor;
                tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            ctx.drawImage(tempCanvas, 0, 0);
        } catch (e) { /* Ignore failed loads */ }
    };

    // --- 5. 描画ロジック ---
    const updateState = () => {
        state = {
            template: templateSelect.value,
            iconBgColor: document.getElementById('iconBgColorPicker')?.value || '#A142CD',
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
    };

    const drawCharacterLayer = () => {
        bgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (imageTransform.img) {
            bgCtx.save();
            bgCtx.translate(imageTransform.x, imageTransform.y);
            bgCtx.scale(imageTransform.scale, imageTransform.scale);
            bgCtx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
            bgCtx.restore();
        }
    };
    
    const drawTemplateLayer = async () => {
        charCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const path = getAssetPath({ category: 'background/base', filename: state.template });
        await drawTinted(charCtx, path);
    };

    const drawUiLayer = async (targetCtx = uiCtx) => {
        if(targetCtx === uiCtx) {
            uiCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        const config = templateConfig[state.template];
        if (!config) return;

        const raceAssetMap = { 'au_ra': 'aura' };
        const playstyleBgNumMap = {
             leveling: '01', raid: '02', pvp: '03', dd: '04', hunt: '05', map: '06', gatherer: '07', crafter: '08', gil: '09', perform: '10',
             streaming: '11', glam: '12', studio: '13', housing: '14', screenshot: '15', drawing: '16', roleplay: '17',
        };

        // 1. アイコン背景 (BG)
        const raceValue = raceAssetMap[state.race] || state.race;
        if (raceValue) await drawTinted(targetCtx, getAssetPath({ category: 'race/bg', filename: `Common_race_${raceValue}_bg` }), state.iconBgColor);
        
        const progressStages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
        const currentIndex = progressStages.indexOf(state.progress);
        if (currentIndex > -1) {
            for (let i = 0; i <= currentIndex; i++) {
                await drawTinted(targetCtx, getAssetPath({ category: 'progress/bg', filename: `Common_progress_${progressStages[i]}_bg` }), state.iconBgColor);
            }
        }
        if (state.progress === 'all_clear') {
            for (const stage of progressStages) await drawTinted(targetCtx, getAssetPath({ category: 'progress/bg', filename: `Common_progress_${stage}_bg` }), state.iconBgColor);
        }

        for (const style of state.playstyles) {
            const bgNum = playstyleBgNumMap[style];
            if (bgNum) await drawTinted(targetCtx, getAssetPath({ category: 'playstyle/bg', filename: `Common_playstyle_${bgNum}_bg` }), state.iconBgColor);
        }

        for (const time of state.playtimes) {
            const isSpecial = time === 'random' || time === 'fulltime';
            if(isSpecial) await drawTinted(targetCtx, getAssetPath({ category: 'time/bg', filename: `Common_time_${time}_bg` }), state.iconBgColor);
        }

        for (const diff of state.difficulties) await drawTinted(targetCtx, getAssetPath({ category: 'raid/bg', filename: `Common_raid_${diff}_bg` }), state.iconBgColor);
        for (const job of state.subjobs) await drawTinted(targetCtx, getAssetPath({ category: 'job', filename: `Common_job_${job}_sub_bg` }), state.iconBgColor);

        // 2. アイコン本体・フレーム (Frame)
        if(state.dc) await drawTinted(targetCtx, getAssetPath({ category: 'dc', filename: `${config.iconTheme}_dc_${state.dc}` }), config.iconTint);
        if (raceValue) await drawTinted(targetCtx, getAssetPath({ category: 'race/frame', filename: `${config.iconTheme}_race_${raceValue}_frame` }), config.iconTint);
        
        if (state.progress) {
            const progressFile = state.progress === 'gyougetsu' ? 'gyogetsu' : state.progress;
            await drawTinted(targetCtx, getAssetPath({ category: 'progress/frame', filename: `${config.iconTheme}_progress_${progressFile}_frame` }), config.iconTint);
        }

        for (const style of state.playstyles) await drawTinted(targetCtx, getAssetPath({ category: 'playstyle/frame', filename: `Common_playstyle_${style}_frame` }), config.iconTint);
        
        for (const time of state.playtimes) {
            const isSpecial = time === 'random' || time === 'fulltime';
            const timeTheme = isSpecial ? config.iconTheme : 'Common';
            await drawTinted(targetCtx, getAssetPath({ category: `time/${isSpecial ? 'frame' : 'icon'}`, filename: `${timeTheme}_time_${time}${isSpecial ? '_frame' : ''}` }), config.iconTint);
        }

        if (state.difficulties.length > 0) await drawTinted(targetCtx, getAssetPath({ category: 'raid/frame', filename: `${config.iconTheme}_raid_frame` }), config.iconTint);
        if(state.mainjob) await drawTinted(targetCtx, getAssetPath({ category: 'job', filename: `Common_job_${state.mainjob}_main` }), config.iconTint);

        // 3. UIの基本フレーム
        const framePath = getAssetPath({ category: 'background/frame', filename: config.frame });
        await drawTinted(targetCtx, framePath);

        // 4. テキスト
        if (state.characterName && state.font) {
            const fontName = state.font.split(',')[0].replace(/'/g, '');
            const nameArea = config.nameArea;
            let fontSize = 32;
            targetCtx.font = `${fontSize}px "${fontName}"`;
            while(targetCtx.measureText(state.characterName).width > nameArea.width && fontSize > 10) {
                fontSize--;
                targetCtx.font = `${fontSize}px "${fontName}"`;
            }
            targetCtx.fillStyle = config.nameColor || '#ffffff';
            targetCtx.textAlign = 'center';
            targetCtx.textBaseline = 'middle';
            targetCtx.fillText(state.characterName, nameArea.x + nameArea.width / 2, nameArea.y + nameArea.height / 2);
        }
    };
    
    const redrawAll = async () => {
        updateState();
        await Promise.all([
            drawTemplateLayer(),
            drawUiLayer()
        ]);
    };

    // --- 6. イベントリスナー ---
    document.querySelectorAll('#controls input, #controls select').forEach(el => {
        el.addEventListener('change', redrawAll);
        el.addEventListener('input', redrawAll);
    });

    document.querySelectorAll('#controls button[data-value]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            redrawAll();
        });
    });
    
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
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
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    const handleDrag = (e) => {
        if (!imageTransform.isDragging || !imageTransform.img) return;
        e.preventDefault();
        const dx = e.clientX - imageTransform.lastX;
        const dy = e.clientY - imageTransform.lastY;
        imageTransform.x += dx;
        imageTransform.y += dy;
        imageTransform.lastX = e.clientX;
        imageTransform.lastY = e.clientY;
        drawCharacterLayer();
    };
    uiLayer.addEventListener('mousedown', (e) => {
        if (!imageTransform.img) return;
        imageTransform.isDragging = true;
        imageTransform.lastX = e.clientX;
        imageTransform.lastY = e.clientY;
    });
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', () => { imageTransform.isDragging = false; });
    uiLayer.addEventListener('wheel', (e) => {
        if (!imageTransform.img) return;
        e.preventDefault();
        const scaleAmount = e.deltaY < 0 ? 1.05 : 1 / 1.05;
        imageTransform.scale *= scaleAmount;
        drawCharacterLayer();
    });
    
    // --- ダウンロード、モーダル、トップへ戻るボタン ---
    downloadBtn.addEventListener('click', async () => {
        if (isDownloading) return;
        isDownloading = true;
        downloadBtn.querySelector('span').textContent = '画像を生成中...';
        
        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = CANVAS_WIDTH;
            finalCanvas.height = CANVAS_HEIGHT;
            const finalCtx = finalCanvas.getContext('2d');
            
            // 1. ユーザー画像
            if (imageTransform.img) finalCtx.drawImage(backgroundLayer, 0, 0);
            // 2. テンプレート背景
            finalCtx.drawImage(characterLayer, 0, 0);
            
            // 3. UI要素をダウンロード用に再描画
            await drawUiLayer(finalCtx);

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
            alert("画像の生成に失敗しました。");
        } finally {
            isDownloading = false;
            downloadBtn.querySelector('span').textContent = 'この内容で作る？🐕';
        }
    });

    closeModalBtn.addEventListener('click', () => {
        saveModal.classList.add('hidden');
    });

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        toTopBtn.classList.toggle('visible', scrollTop > 100);
    });

    toTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- 7. 初期化処理 ---
    const initialize = async () => {
        fontSelect.value = state.font;
        drawCharacterLayer();
        await redrawAll();
        loaderElement.style.display = 'none';
        appElement.style.visibility = 'visible';
    };

    initialize();
});