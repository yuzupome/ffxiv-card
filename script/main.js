/**
 * FFXIV Character Card Generator Script (v2)
 *
 * エラー耐性を高め、ロジックを単純化して安定動作を目指した改修版です。
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 必要なHTML要素がすべて存在するか最初に確認 ---
    const requiredElementIds = [
        'cardCanvas', 'nameInput', 'fontSelect', 'uploadImage', 'templateButtons',
        'raceSelect', 'dcSelect', 'progressSelect', 'styleButtons', 'playtimeOptions',
        'difficultyOptions', 'mainjobSelect', 'subjobSection', 'downloadBtn'
    ];

    let allElementsExist = true;
    requiredElementIds.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`必須要素が見つかりません: #${id}`);
            allElementsExist = false;
        }
    });

    if (!allElementsExist) {
        alert('ページの初期化に失敗しました。HTMLの要素が不足しています。');
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

    // --- 状態管理 ---
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

    // --- 画像読み込み管理 ---
    const imageCache = {};

    function loadImage(path) {
        if (imageCache[path]) {
            return imageCache[path];
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                // エラーになった画像は読み込み失敗として扱う
                console.warn(`画像の読み込みに失敗しました: ${path}`);
                resolve(null); 
            };
            img.src = path;
        });
        
        imageCache[path] = promise;
        return promise;
    }


    // --- 描画関連 ---

    /**
     * キャンバス全体を現在のstateに基づいて再描画する
     */
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 描画順: 1.アップロード画像 -> 2.背景 -> 3.アイコン類 -> 4.名前
        
        // 1. アップロード画像
        drawSpecificImage(state.uploadedImage);

        // 2. 背景
        drawSpecificImage(state.background);
        
        // 3. アイコン（メインジョブ以外）
        const allIcons = [
            state.raceIcon,
            state.dcIcon,
            ...state.progressIcons,
            ...state.styleIcons,
            ...state.timeIcons,
            ...state.difficultyIcons,
            ...state.subJobIcons
        ];
        allIcons.forEach(icon => drawSpecificImage(icon));
        
        // 3.5. メインジョブアイコンは最前面に
        drawSpecificImage(state.mainJobIcon);

        // 4. 名前
        drawNameText();
    }

    /**
     * 安全に画像を描画するヘルパー関数
     * @param {HTMLImageElement} img - 描画する画像オブジェクト
     */
    function drawSpecificImage(img) {
        // 画像がnullでなく、正常に読み込み完了している場合のみ描画
        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * 名前を描画する
     */
    function drawNameText() {
        const name = nameInput.value;
        if (!name) return;

        ctx.fillStyle = state.nameColor;
        ctx.font = `200px ${state.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = 1875; // Canvas幅の半分
        const y = 300;  // 固定Y座標
        
        ctx.fillText(name, x, y);
    }


    // --- 更新処理 ---

    /**
     * すべての入力状態を読み取り、stateを更新して再描画する
     */
    async function updateAndRedraw() {
        const prefix = document.body.classList.contains('template-gothic-white') ? 'Gothic_white' : 'Gothic_black';
        state.nameColor = (prefix === 'Gothic_white') ? '#000000' : '#ffffff';
        state.font = fontSelect.value;
        
        // 各アイコンの読み込みを並行して行う
        const promises = [
            // 背景
            loadImage(`./assets/backgrounds/${prefix}.png`).then(img => state.background = img),
            // 種族
            raceSelect.value ? loadImage(`./assets/race_icons/${prefix}_${raceSelect.value}.png`).then(img => state.raceIcon = img) : (state.raceIcon = null),
            // DC
            dcSelect.value ? loadImage(`./assets/dc_icons/${prefix}_${dcSelect.value}.png`).then(img => state.dcIcon = img) : (state.dcIcon = null),
            // メインジョブ
            mainJobSelect.value ? loadImage(`./assets/mainjob_icons/${prefix}_main_${mainJobSelect.value}.png`).then(img => state.mainJobIcon = img) : (state.mainJobIcon = null),
        ];

        // 進行度 (複数の可能性)
        const progressStages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
        const selectedProgress = progressSelect.value;
        let progressToLoad = [];
        if (selectedProgress) {
            if (selectedProgress === 'all_clear') {
                progressToLoad = [...progressStages, 'all_clear'];
            } else {
                progressToLoad = progressStages.slice(0, progressStages.indexOf(selectedProgress) + 1);
            }
        }
        promises.push(Promise.all(progressToLoad.map(p => loadImage(`./assets/progress_icons/${prefix}_${p}.png`))).then(imgs => state.progressIcons = imgs.filter(Boolean)));
        
        // プレイスタイル (複数選択)
        const activeStyles = Array.from(styleButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.dataset.value);
        promises.push(Promise.all(activeStyles.map(s => loadImage(`./assets/style_icons/${prefix}_${s}.png`))).then(imgs => state.styleIcons = imgs.filter(Boolean)));

        // プレイ時間 (ロジックを単純化)
        const timeToLoad = [];
        if (Array.from(playtimeCheckboxes).some(cb => cb.classList.contains('weekday') && cb.checked)) timeToLoad.push('weekday');
        if (Array.from(playtimeCheckboxes).some(cb => cb.classList.contains('holiday') && cb.checked)) timeToLoad.push('holiday');
        if (Array.from(playtimeCheckboxes).some(cb => cb.classList.contains('other') && cb.checked)) {
            Array.from(playtimeCheckboxes).filter(cb => cb.classList.contains('other') && cb.checked).forEach(cb => timeToLoad.push(cb.value));
        }
        promises.push(Promise.all(timeToLoad.map(t => loadImage(`./assets/time_icons/${prefix}_${t}.png`))).then(imgs => state.timeIcons = imgs.filter(Boolean)));

        // 高難易度 (複数選択)
        const activeDifficulties = Array.from(difficultyCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        promises.push(Promise.all(activeDifficulties.map(d => loadImage(`./assets/difficulty_icons/${prefix}_${d}.png`))).then(imgs => state.difficultyIcons = imgs.filter(Boolean)));
        
        // サブジョブ (複数選択)
        const activeSubJobs = Array.from(subJobCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        promises.push(Promise.all(activeSubJobs.map(sj => loadImage(`./assets/subjob_icons/${prefix}_sub_${sj}.png`))).then(imgs => state.subJobIcons = imgs.filter(Boolean)));

        // すべての画像読み込みが終わったら、一度だけ描画する
        await Promise.all(promises);
        drawCanvas();
    }

    // --- イベントリスナーの設定 ---
    
    // テキストやセレクトボックスの変更
    [nameInput, fontSelect, raceSelect, dcSelect, progressSelect, mainJobSelect].forEach(el => {
        el.addEventListener('input', updateAndRedraw);
    });

    // ボタンやチェックボックスのクリック/変更
    [...styleButtons, ...playtimeCheckboxes, ...difficultyCheckboxes, ...subJobCheckboxes].forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.currentTarget.type === 'button') {
                e.currentTarget.classList.toggle('active');
            }
            updateAndRedraw();
        });
    });

    // テンプレートの切り替え
    templateButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.body.className = button.dataset.class;
            updateAndRedraw();
        });
    });
    
    // 画像アップロード
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            loadImage(event.target.result).then(img => {
                if(img) {
                    state.uploadedImage = img;
                    drawCanvas();
                }
            });
        };
        reader.readAsDataURL(file);
    });

    // ダウンロード
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'ffxiv_character_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // --- 初期化 ---
    updateAndRedraw();
});
