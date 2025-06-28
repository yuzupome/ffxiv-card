/**
 * FFXIV Character Card Generator Script (v3)
 *
 * ユーザーからのフィードバックに基づき、描画位置、画像処理、
 * 各種ロジックを修正した改修版です。
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 【重要】Google FontsをHTML側で読み込んでください ---
    // このスクリプトが正しくフォントを描画するためには、
    // HTMLファイルの<head>タグ内にGoogle Fontsの<link>タグが必要です。
    // 例: <link href="https://fonts.googleapis.com/css2?family=Orbitron&display=swap" rel="stylesheet">

    // --- 必要なHTML要素のチェック ---
    const requiredElementIds = [
        'cardCanvas', 'nameInput', 'fontSelect', 'uploadImage', 'templateButtons',
        'raceSelect', 'dcSelect', 'progressSelect', 'styleButtons', 'playtimeOptions',
        'difficultyOptions', 'mainjobSelect', 'subjobSection', 'downloadBtn'
    ];
    if (requiredElementIds.some(id => !document.getElementById(id))) {
        console.error('必須要素が見つかりません。HTMLのIDを確認してください。');
        alert('ページの初期化に失敗しました。');
        return;
    }

    // --- DOM要素の取得 ---
    const canvas = document.getElementById('cardCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 3750;
    canvas.height = 2250;

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

    // --- 状態管理オブジェクト ---
    let state = {
        background: null,
        uploadedImage: null,
        raceIcon: null,
        dcIcon: null,
        progressIcons: [],
        styleIcons: [],
        timeIcons: [],
        difficultyIcons: [],
        mainJobIcon: null,
        subJobIcons: [],
        font: 'Orbitron, sans-serif',
        nameColor: '#ffffff'
    };
    
    // --- 画像キャッシュ ---
    const imageCache = {};

    function loadImage(path) {
        if (!path) return Promise.resolve(null);
        if (imageCache[path]) return imageCache[path];

        const promise = new Promise((resolve) => {
            const img = new Image();
            // 外部ドメインの画像（アップロードされたData URLなど）を扱えるようにする
            img.crossOrigin = "Anonymous"; 
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`画像の読み込みに失敗: ${path}`);
                resolve(null);
            };
            img.src = path;
        });
        imageCache[path] = promise;
        return promise;
    }

    // --- 描画関連関数 ---

    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 描画順: 1.アップロード画像 -> 2.背景 -> 3.アイコン類 -> 4.名前
        drawUploadedImage(state.uploadedImage);
        drawStretchedImage(state.background);
        
        const allIcons = [
            state.raceIcon, state.dcIcon, ...state.progressIcons,
            ...state.styleIcons, ...state.timeIcons, ...state.difficultyIcons,
            ...state.subJobIcons
        ];
        allIcons.forEach(icon => drawStretchedImage(icon));
        
        drawStretchedImage(state.mainJobIcon);
        drawNameText();
    }
    
    function drawStretchedImage(img) {
        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }

    function drawUploadedImage(img) {
        if (img && img.complete && img.naturalHeight !== 0) {
            const x = (canvas.width - img.width) / 2;
            const y = (canvas.height - img.height) / 2;
            ctx.drawImage(img, x, y);
        }
    }

    function drawNameText() {
        const name = nameInput.value;
        if (!name) return;

        // ★ 名前描画エリアを指定
        const nameArea = { x: 150, y: 150, width: 1000, height: 300 };
        const centerX = nameArea.x + nameArea.width / 2;
        const centerY = nameArea.y + nameArea.height / 2;

        ctx.fillStyle = state.nameColor;
        ctx.font = `200px ${state.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, centerX, centerY);
    }

    // --- 更新処理 ---

    async function updateAndRedraw() {
        const prefix = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
        state.nameColor = (prefix === 'Gothic_white') ? '#000000' : '#ffffff';
        state.font = fontSelect.value;
        
        const promises = [];

        // --- 各要素のロード処理 ---
        
        // 基本情報 (背景、種族、DC、メインジョブ)
        promises.push(loadImage(`./assets/backgrounds/${prefix}.png`).then(img => state.background = img));
        promises.push(raceSelect.value ? loadImage(`./assets/race_icons/${prefix}_${raceSelect.value}.png`).then(img => state.raceIcon = img) : Promise.resolve(state.raceIcon = null));
        promises.push(dcSelect.value ? loadImage(`./assets/dc_icons/${prefix}_${dcSelect.value}.png`).then(img => state.dcIcon = img) : Promise.resolve(state.dcIcon = null));
        promises.push(mainJobSelect.value ? loadImage(`./assets/mainjob_icons/${prefix}_main_${mainJobSelect.value}.png`).then(img => state.mainJobIcon = img) : Promise.resolve(state.mainJobIcon = null));

        // 進行度
        const progressStages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
        let progressToLoad = [];
        if (progressSelect.value) {
            progressToLoad = (progressSelect.value === 'all_clear')
                ? [...progressStages, 'all_clear']
                : progressStages.slice(0, progressStages.indexOf(progressSelect.value) + 1);
        }
        promises.push(Promise.all(progressToLoad.map(p => loadImage(`./assets/progress_icons/${prefix}_${p}.png`))).then(imgs => state.progressIcons = imgs.filter(Boolean)));
        
        // プレイスタイル
        const activeStyles = Array.from(styleButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.dataset.value);
        promises.push(Promise.all(activeStyles.map(s => loadImage(`./assets/style_icons/${prefix}_${s}.png`))).then(imgs => state.styleIcons = imgs.filter(Boolean)));

        // ★プレイ時間 (ロジック修正版)
        const timePaths = new Set();
        const checkedTimes = Array.from(playtimeCheckboxes).filter(cb => cb.checked);
        
        checkedTimes.forEach(cb => {
            // "weekday_morning" などの個別アイコン
            timePaths.add(`./assets/time_icons/${prefix}_${cb.className}_${cb.value}.png`);
        });
        // 「平日」「休日」の統括アイコン
        if (checkedTimes.some(cb => cb.classList.contains('weekday'))) timePaths.add(`./assets/time_icons/${prefix}_weekday.png`);
        if (checkedTimes.some(cb => cb.classList.contains('holiday'))) timePaths.add(`./assets/time_icons/${prefix}_holiday.png`);

        promises.push(Promise.all(Array.from(timePaths).map(path => loadImage(path))).then(imgs => state.timeIcons = imgs.filter(Boolean)));

        // 高難易度
        const activeDifficulties = Array.from(difficultyCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        promises.push(Promise.all(activeDifficulties.map(d => loadImage(`./assets/difficulty_icons/${prefix}_${d}.png`))).then(imgs => state.difficultyIcons = imgs.filter(Boolean)));
        
        // サブジョブ
        const activeSubJobs = Array.from(subJobCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        promises.push(Promise.all(activeSubJobs.map(sj => loadImage(`./assets/subjob_icons/${prefix}_sub_${sj}.png`))).then(imgs => state.subJobIcons = imgs.filter(Boolean)));

        // すべての読み込み完了後に描画
        await Promise.all(promises);
        drawCanvas();
    }

    // --- イベントリスナー ---
    
    [nameInput, fontSelect, raceSelect, dcSelect, progressSelect, mainJobSelect].forEach(el => {
        el.addEventListener('input', updateAndRedraw);
    });

    [...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes, ...subJobCheckboxes].forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.currentTarget.tagName === 'BUTTON') {
                e.currentTarget.classList.toggle('active');
            }
            updateAndRedraw();
        });
    });

    templateButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.body.className = button.dataset.class;
            updateAndRedraw();
        });
    });
    
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            loadImage(event.target.result).then(img => {
                state.uploadedImage = img;
                drawCanvas();
            });
        };
        reader.readAsDataURL(file);
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'ffxiv_character_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // --- 初期化 ---
    updateAndRedraw();
});
