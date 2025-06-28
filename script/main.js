// main.js - 改修版

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const canvas = document.getElementById('cardCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');
    canvas.width = 3750;
    canvas.height = 2250;

    const nameInput = document.getElementById('nameInput');
    const fontSelect = document.getElementById('fontSelect');
    const raceSelect = document.getElementById('raceSelect');
    const dcSelect = document.getElementById('dcSelect');
    const progressSelect = document.getElementById('progressSelect');
    const mainJobSelect = document.getElementById('mainJobSelect');
    const uploadImageInput = document.getElementById('uploadImage');
    const templateButtons = document.querySelectorAll('#templateButtons button');
    const styleButtons = document.querySelectorAll('#styleButtons button');
    const playtimeCheckboxes = document.querySelectorAll('#playtimeOptions input[type="checkbox"]');
    const difficultyCheckboxes = document.querySelectorAll('#difficultyOptions input[type="checkbox"]');
    const subJobCheckboxes = document.querySelectorAll('#subjobSection input[type="checkbox"]');
    const downloadBtn = document.getElementById('downloadBtn');

    // --- 状態管理用の変数 ---
    let backgroundImg = null;
    let uploadedImgState = null;
    let selectedFont = 'Orbitron, sans-serif';
    let raceImg = null;
    let dcImg = null;
    let progressImgs = [];
    let styleImgs = [];
    let timeImgs = [];
    let difficultyImgs = [];
    let mainJobImg = null;
    let subJobImgs = [];
    let nameColor = '#000000'; // デフォルトは黒

    // --- 関数定義 ---

    // テンプレート（黒背景/白背景）の切り替え
    function switchTemplate(templateName) {
        document.body.className = ''; // いったんクラスをリセット
        document.body.classList.add(templateName);
        nameColor = (templateName === 'template-gothic-white') ? '#000000' : '#ffffff';
    }

    // テンプレートのプレフィックスを取得（画像パス用）
    function getTemplatePrefix() {
        return document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
    }

    // 画像を非同期で読み込む関数
    function preloadIcon(path, callback) {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            if (callback) callback(img);
            drawCanvas(); // 画像読み込み完了後に再描画
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${path}`);
        };
        return img;
    }
    
    // キャンバス全体を再描画するメイン関数
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. ユーザーがアップロードした画像を描画
        if (uploadedImgState) {
            const { img, x, y, width, height } = uploadedImgState;
            ctx.drawImage(img, x, y, width, height);
        }

        // 2. 背景テンプレートを描画
        if (backgroundImg) {
            ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        }
        
        // 3. アイコン群を描画
        // 配列を結合して一度にループ処理
        [raceImg, dcImg, ...progressImgs, ...styleImgs, ...timeImgs, ...difficultyImgs, ...subJobImgs].forEach(img => {
            if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        });

        // 4. メインジョブのアイコンを最前面に描画
        if (mainJobImg) {
            ctx.drawImage(mainJobImg, 0, 0, canvas.width, canvas.height);
        }

        // 5. キャラクター名を描画
        drawNameText();
    }
    
    // 名前を描画する関数（★不足していたため追加）
    function drawNameText() {
        const name = nameInput.value;
        if (!name) return;

        ctx.fillStyle = nameColor;
        ctx.font = `200px ${selectedFont}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 描画位置をCSS変数から取得（なければデフォルト値）
        const x = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-x') || '1875', 10);
        const y = parseInt(getComputedStyle(document.body).getPropertyValue('--name-area-y') || '300', 10);
        
        ctx.fillText(name, x, y);
    }
    
    // 各種更新関数
    function updateAllIcons() {
        updateRace();
        updateDc();
        updateProgress();
        updatePlayStyle();
        updatePlayTime();
        updateDifficulty();
        updateMainJob();
        updateSubJobs();
        drawCanvas();
    }

    function updateRace() {
        const val = raceSelect.value;
        if (!val) { raceImg = null; return; }
        const base = getTemplatePrefix();
        // ★パスを相対パスに修正
        raceImg = preloadIcon(`./assets/race_icons/${base}_${val}.png`);
    }

    function updateDc() {
        const val = dcSelect.value;
        if (!val) { dcImg = null; return; }
        const base = getTemplatePrefix();
        dcImg = preloadIcon(`./assets/dc_icons/${base}_${val}.png`);
    }
    
    function updateProgress() {
        const value = progressSelect?.value;
        const base = getTemplatePrefix();
        progressImgs = [];
        if (!value) { drawCanvas(); return; }

        const add = (name) => progressImgs.push(preloadIcon(`./assets/progress_icons/${base}_${name}.png`));
        const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
        
        if (value === 'all_clear') {
            [...stages, 'all_clear'].forEach(add);
        } else {
            const index = stages.indexOf(value);
            if (index !== -1) stages.slice(0, index + 1).forEach(add);
        }
    }

    function updatePlayStyle() {
        const base = getTemplatePrefix();
        styleImgs = [];
        document.querySelectorAll('#styleButtons button.active').forEach(btn => {
            const key = btn.dataset.value;
            styleImgs.push(preloadIcon(`./assets/style_icons/${base}_${key}.png`));
        });
        drawCanvas();
    }
    
    function updatePlayTime() {
        const base = getTemplatePrefix();
        timeImgs = [];
        const checkedTimes = document.querySelectorAll('#playtimeOptions input:checked');
        let hasWeekday = false;
        let hasHoliday = false;

        checkedTimes.forEach(input => {
            const key = input.value;
            // weekday_morning, holiday_night のような詳細アイコン
            timeImgs.push(preloadIcon(`./assets/time_icons/${base}_${input.className}_${key}.png`));
            if (input.classList.contains('weekday')) hasWeekday = true;
            if (input.classList.contains('holiday')) hasHoliday = true;
        });
        
        // 平日・休日の総称アイコン
        if (hasWeekday) timeImgs.push(preloadIcon(`./assets/time_icons/${base}_weekday.png`));
        if (hasHoliday) timeImgs.push(preloadIcon(`./assets/time_icons/${base}_holiday.png`));
        
        drawCanvas();
    }
    
    function updateDifficulty() {
        const base = getTemplatePrefix();
        difficultyImgs = [];
        document.querySelectorAll('#difficultyOptions input:checked').forEach(input => {
            difficultyImgs.push(preloadIcon(`./assets/difficulty_icons/${base}_${input.value}.png`));
        });
        drawCanvas();
    }
    
    function updateMainJob() {
        const key = mainJobSelect.value;
        if (!key) { mainJobImg = null; drawCanvas(); return; }
        const base = getTemplatePrefix();
        mainJobImg = preloadIcon(`./assets/mainjob_icons/${base}_main_${key}.png`);
    }

    function updateSubJobs() {
        const base = getTemplatePrefix();
        subJobImgs = [];
        document.querySelectorAll('#subjobSection input:checked').forEach(input => {
            subJobImgs.push(preloadIcon(`./assets/subjob_icons/${base}_sub_${input.value}.png`));
        });
        drawCanvas();
    }


    // --- イベントリスナーの設定 (★不足していたため大幅に追加) ---
    
    // テンプレート切り替えボタン
    templateButtons.forEach(button => {
        button.addEventListener('click', () => {
            const bgPath = button.dataset.bg.replace('/ffxiv-card', '.'); // パスを修正
            const templateClass = button.dataset.class;
            
            switchTemplate(templateClass);
            backgroundImg = preloadIcon(bgPath, updateAllIcons); // 背景読み込み後に全アイコンを更新
        });
    });

    // プレイスタイルボタン
    styleButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            updatePlayStyle();
        });
    });
    
    // 各種チェックボックス
    playtimeCheckboxes.forEach(cb => cb.addEventListener('change', updatePlayTime));
    difficultyCheckboxes.forEach(cb => cb.addEventListener('change', updateDifficulty));
    subJobCheckboxes.forEach(cb => cb.addEventListener('change', updateSubJobs));
    
    // 各種セレクトボックス
    raceSelect.addEventListener('change', () => { updateRace(); drawCanvas(); });
    dcSelect.addEventListener('change', () => { updateDc(); drawCanvas(); });
    progressSelect.addEventListener('change', () => { updateProgress(); drawCanvas(); });
    mainJobSelect.addEventListener('change', () => { updateMainJob(); drawCanvas(); });
    fontSelect.addEventListener('change', () => {
        selectedFont = fontSelect.value;
        document.documentElement.style.setProperty('--selected-font', selectedFont);
        drawCanvas();
    });

    // 名前入力
    nameInput.addEventListener('input', drawCanvas);

    // 画像アップロード
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // キャンバスに合うように画像のサイズと位置を計算
                const canvasAspect = canvas.width / canvas.height;
                const imgAspect = img.width / img.height;
                let sx, sy, sWidth, sHeight;

                if (imgAspect > canvasAspect) { // 画像が横長
                    sHeight = img.height;
                    sWidth = sHeight * canvasAspect;
                    sx = (img.width - sWidth) / 2;
                    sy = 0;
                } else { // 画像が縦長
                    sWidth = img.width;
                    sHeight = sWidth / canvasAspect;
                    sx = 0;
                    sy = (img.height - sHeight) / 2;
                }
                
                // 新しいキャンバスにトリミングして描画
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

                // 描画したものを新しい画像として状態を保存
                const finalImage = new Image();
                finalImage.onload = () => {
                    uploadedImgState = { img: finalImage, x: 0, y: 0, width: canvas.width, height: canvas.height };
                    drawCanvas();
                };
                finalImage.src = tempCanvas.toDataURL();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // ダウンロードボタン
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'ffxiv_character_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // --- 初期化処理 ---
    // 最初に黒背景をデフォルトとして読み込む
    const defaultBgPath = './assets/backgrounds/Gothic_black.png';
    switchTemplate('template-gothic-black');
    backgroundImg = preloadIcon(defaultBgPath, drawCanvas);
});
