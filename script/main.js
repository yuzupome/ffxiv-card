/**
 * FFXIV Character Card Generator Script (Performance Optimized Version)
 *
 * 全てのアセットを最初にプリロードすることで、UI操作後の描画を高速化。
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- 必要なHTML要素のチェック ---
    const requiredElementIds = [ 'app', 'loader', 'cardCanvas', 'nameInput', 'fontSelect', 'uploadImage', 'templateButtons', 'raceSelect', 'dcSelect', 'progressSelect', 'styleButtons', 'playtimeOptions', 'difficultyOptions', 'mainjobSelect', 'subjobSection', 'downloadBtn' ];
    if (requiredElementIds.some(id => !document.getElementById(id))) {
        console.error('必須要素が見つかりません。HTMLのIDを確認してください。');
        alert('ページの初期化に失敗しました。');
        return;
    }

    // --- DOM要素の取得 ---
    const appElement = document.getElementById('app');
    const loaderElement = document.getElementById('loader');
    const canvas = document.getElementById('cardCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 3750;
    canvas.height = 2250;
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

    // --- アセットの定義 ---
    const templates = ['Gothic_black', 'Gothic_white'];
    const races = ['au_ra', 'viera', 'roegadyn', 'miqote', 'hyur', 'elezen', 'lalafell', 'hrothgar'];
    const dcs = ['mana', 'gaia', 'elemental', 'meteor'];
    const progresses = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
    const styles = Array.from(styleButtons).map(b => b.dataset.value);
    const playtimes = ['weekday', 'weekday_morning', 'weekday_daytime', 'weekday_night', 'weekday_midnight', 'holiday', 'holiday_morning', 'holiday_daytime', 'holiday_night', 'holiday_midnight', 'random', 'fulltime'];
    const difficulties = ['extreme', 'unreal', 'savage', 'ultimate'];
    const jobs = Array.from(mainJobSelect.options).filter(o => o.value).map(o => o.value);

    // --- 画像キャッシュ ---
    const imageCache = {};

    /**
     * 単一の画像を読み込み、キャッシュに保存する
     * @param {string} path - 画像のパス
     * @returns {Promise<HTMLImageElement>}
     */
    function loadImage(path) {
        if (!path) return Promise.resolve(null);
        if (imageCache[path]) return Promise.resolve(imageCache[path]);
        
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                imageCache[path] = img; // 成功時のみキャッシュ
                resolve(img);
            };
            img.onerror = () => {
                // 失敗した場合はキャッシュせず、nullを返す
                console.warn(`画像の読み込みに失敗: ${path}`);
                resolve(null);
            };
            img.src = path;
        });
    }

    /**
     * 全てのアセットをプリロードする
     */
    async function preloadAllAssets() {
        const allImagePaths = new Set();
        
        templates.forEach(template => {
            allImagePaths.add(`./assets/backgrounds/${template}.png`);
            races.forEach(item => allImagePaths.add(`./assets/race_icons/${template}_${item}.png`));
            dcs.forEach(item => allImagePaths.add(`./assets/dc_icons/${template}_${item}.png`));
            progresses.forEach(item => allImagePaths.add(`./assets/progress_icons/${template}_${item}.png`));
            styles.forEach(item => allImagePaths.add(`./assets/style_icons/${template}_${item}.png`));
            playtimes.forEach(item => allImagePaths.add(`./assets/time_icons/${template}_${item}.png`));
            difficulties.forEach(item => allImagePaths.add(`./assets/difficulty_icons/${template}_${item}.png`));
            jobs.forEach(item => {
                allImagePaths.add(`./assets/mainjob_icons/${template}_main_${item}.png`);
                allImagePaths.add(`./assets/subjob_icons/${template}_sub_${item}.png`);
            });
        });
        
        const promises = Array.from(allImagePaths).map(path => loadImage(path));
        
        // フォントの読み込みもここで行う
        promises.push(document.fonts.ready);

        await Promise.all(promises);
    }

    // --- 状態管理 ---
    let imageTransform = {
        img: null, x: canvas.width / 2, y: canvas.height / 2, scale: 1.0,
        isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0
    };

    // --- 描画関数 ---
    
    /**
     * Canvas全体を再描画する
     */
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. ユーザーアップロード画像
        drawUploadedImage();

        // 2. 背景
        const prefix = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
        drawStretchedImage(imageCache[`./assets/backgrounds/${prefix}.png`]);

        // 3. 各種アイコン
        drawIcons();
        
        // 4. 名前
        drawNameText();
    }
    
    function drawStretchedImage(img) {
        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
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
        const name = nameInput.value;
        if (!name) return;
        
        const MAX_FONT_SIZE = 120;
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
    
    /**
     * 全てのアイコンを描画する
     */
    function drawIcons() {
        const prefix = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';

        // 種族
        if (raceSelect.value) drawStretchedImage(imageCache[`./assets/race_icons/${prefix}_${raceSelect.value}.png`]);
        // DC
        if (dcSelect.value) drawStretchedImage(imageCache[`./assets/dc_icons/${prefix}_${dcSelect.value}.png`]);
        // 進行度
        if (progressSelect.value) {
            const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
            const toLoad = progressSelect.value === 'all_clear' ? [...stages, 'all_clear'] : stages.slice(0, stages.indexOf(progressSelect.value) + 1);
            toLoad.forEach(p => drawStretchedImage(imageCache[`./assets/progress_icons/${prefix}_${p}.png`]));
        }
        // プレイスタイル
        styleButtons.forEach(btn => {
            if (btn.classList.contains('active')) drawStretchedImage(imageCache[`./assets/style_icons/${prefix}_${btn.dataset.value}.png`]);
        });
        // プレイ時間
        const timePaths = new Set();
        const checkedTimes = Array.from(playtimeCheckboxes).filter(cb => cb.checked);
        checkedTimes.forEach(cb => {
            timePaths.add(`./assets/time_icons/${prefix}_${cb.className}_${cb.value}.png`);
        });
        if (checkedTimes.some(cb => cb.classList.contains('weekday'))) timePaths.add(`./assets/time_icons/${prefix}_weekday.png`);
        if (checkedTimes.some(cb => cb.classList.contains('holiday'))) timePaths.add(`./assets/time_icons/${prefix}_holiday.png`);
        timePaths.forEach(path => drawStretchedImage(imageCache[path]));
        // 高難易度
        difficultyCheckboxes.forEach(cb => {
            if (cb.checked) drawStretchedImage(imageCache[`./assets/difficulty_icons/${prefix}_${cb.value}.png`]);
        });
        // サブジョブ
        subJobCheckboxes.forEach(cb => {
            if (cb.checked) drawStretchedImage(imageCache[`./assets/subjob_icons/${prefix}_sub_${cb.value}.png`]);
        });
        // メインジョブ (最後に描画)
        if (mainJobSelect.value) drawStretchedImage(imageCache[`./assets/mainjob_icons/${prefix}_main_${mainJobSelect.value}.png`]);
    }

    // --- イベントリスナー ---
    const allInputs = [nameInput, fontSelect, raceSelect, dcSelect, progressSelect, mainJobSelect, ...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes, ...subJobCheckboxes];
    allInputs.forEach(el => {
        el.addEventListener('input', (e) => {
             // ボタンの場合は active クラスをトグルする
            if (e.currentTarget.tagName === 'BUTTON') {
                e.currentTarget.classList.toggle('active');
            }
            drawCanvas(); // 状態更新は不要、直接再描画
        });
        // クリックイベントも追加（チェックボックスやボタンのため）
        if(el.type === 'checkbox' || el.tagName === 'BUTTON') {
            el.addEventListener('click', (e) => {
                 if (e.currentTarget.tagName === 'BUTTON') {
                    e.currentTarget.classList.toggle('active');
                 }
                drawCanvas();
            });
        }
    });

    templateButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.body.className = button.dataset.class;
            drawCanvas();
        });
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
                drawCanvas();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'ffxiv_character_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // --- 画像操作イベントリスナー (変更なし) ---
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
        imageTransform.isDragging = true; imageTransform.lastX = loc.x; imageTransform.lastY = loc.y;
    }
    function handleDragMove(e) {
        if (!imageTransform.isDragging || !imageTransform.img) return;
        const loc = getEventLocation(e);
        const dx = loc.x - imageTransform.lastX; const dy = loc.y - imageTransform.lastY;
        imageTransform.x += dx; imageTransform.y += dy;
        imageTransform.lastX = loc.x; imageTransform.lastY = loc.y;
        drawCanvas();
    }
    function handleDragEnd() { imageTransform.isDragging = false; }
    canvas.addEventListener('mousedown', handleDragStart, { passive: false });
    canvas.addEventListener('mousemove', handleDragMove, { passive: false });
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('mouseleave', handleDragEnd);
    canvas.addEventListener('wheel', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        const scaleAmount = 1.1;
        const newScale = e.deltaY < 0 ? imageTransform.scale * scaleAmount : imageTransform.scale / scaleAmount;
        imageTransform.scale = Math.max(0.1, Math.min(newScale, 5.0));
        drawCanvas();
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
            drawCanvas();
        }
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) imageTransform.isDragging = false;
        imageTransform.lastTouchDistance = 0;
    });

    // --- 初期化処理 ---
    await preloadAllAssets(); // 全てのアセットをプリロード
    loaderElement.classList.add('hidden'); // ローディング画面を非表示
    appElement.classList.remove('hidden'); // アプリ本体を表示
    drawCanvas(); // 初期描画

});
