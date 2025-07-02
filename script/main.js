/**
 * FFXIV Character Card Generator Script (On-demand Loading Architecture)
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- DOM要素の取得 ---
    const appElement = document.getElementById('app');
    const loaderElement = document.getElementById('loader');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const miniLoader = document.getElementById('mini-loader');
    const miniProgressText = document.getElementById('mini-progress-text');

    // Canvasレイヤー
    const bgCanvas = document.getElementById('background-layer');
    const bgCtx = bgCanvas.getContext('2d');
    const charCanvas = document.getElementById('character-layer');
    const charCtx = charCanvas.getContext('2d');
    const uiCanvas = document.getElementById('ui-layer');
    const uiCtx = uiCanvas.getContext('2d');

    // (UIコントロールの取得は変更なしのため省略)
    
    // --- 定数定義 ---
    const EDIT_WIDTH = 1250;
    const EDIT_HEIGHT = 703;
    const DOWNLOAD_WIDTH = 2500;
    const DOWNLOAD_HEIGHT = 1406;

    // --- アセット定義 ---
    const templates = [ 'Gothic_black', 'Gothic_white', 'Gothic_pink', 'Neon_mono', 'Neon_duotone', 'Neon_meltdown', 'Water', 'Wafu', 'Wood', 'China' ];
    const races = ['au_ra', 'viera', 'roegadyn', 'miqote', 'hyur', 'elezen', 'lalafell', 'hrothgar'];
    const dcs = ['mana', 'gaia', 'elemental', 'meteor'];
    const progresses = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon', 'all_clear'];
    const styles = Array.from(document.querySelectorAll('#styleButtons button')).map(b => b.dataset.value);
    const playtimes = ['weekday', 'weekday_morning', 'weekday_daytime', 'weekday_night', 'weekday_midnight', 'holiday', 'holiday_morning', 'holiday_daytime', 'holiday_night', 'holiday_midnight', 'random', 'fulltime'];
    const difficulties = ['extreme', 'unreal', 'savage', 'ultimate'];
    const mainJobs = Array.from(document.getElementById('mainjobSelect').options).filter(o => o.value).map(o => o.value);
    const allSubJobs = Array.from(document.querySelectorAll('#subjobSection .button-grid button')).map(btn => btn.dataset.value);
    
    // --- 状態管理 ---
    const imageCache = {};
    const loadedTemplates = new Set();
    let currentTemplatePrefix = 'Gothic_black';
    let imageTransform = {
        img: null, x: EDIT_WIDTH / 2, y: EDIT_HEIGHT / 2, scale: 1.0,
        isDragging: false, lastX: 0, lastY: 0, lastTouchDistance: 0
    };
    let isDownloading = false;

    // --- アセット読み込み処理 ---
    async function loadAssetsForTemplate(templateName, isInitialLoad = false) {
        const assetExt = '.webp';
        const pathsToLoad = new Set();

        // 必須アセット
        pathsToLoad.add(`./assets/backgrounds/${templateName}${assetExt}`);
        pathsToLoad.add(`./assets/backgrounds/${templateName}_cp${assetExt}`);
        
        // 各種アイコン
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
                pathsToLoad.add(`./assets/${iconPaths[type]}/${templateName}${prefix}${item}${assetExt}`);
            }
        }
        
        // 既にキャッシュにあるものは除外
        const finalPaths = [...pathsToLoad].filter(p => !imageCache[p]);
        if (finalPaths.length === 0) return Promise.resolve();
        
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

    // --- 描画関数 (内容は変更なし) ---
    function drawBackgroundLayer() {
        // (省略)
    }
    function drawCharacterLayer() {
        // (省略)
    }
    async function drawUiLayer() {
        // (省略)
    }
    
    // --- イベントリスナー ---
    const templateSelect = document.getElementById('templateSelect');
    templateSelect.addEventListener('change', async (e) => {
        const newTemplate = e.target.value;
        if (newTemplate === currentTemplatePrefix) return;

        // 既に読み込み済みの場合は即時反映
        if (loadedTemplates.has(newTemplate)) {
            currentTemplatePrefix = newTemplate;
            drawBackgroundLayer();
            await drawUiLayer();
            return;
        }

        // 未読込の場合はローダーを出して読み込み
        miniLoader.classList.remove('hidden');
        updateProgress({ bar: null, text: miniProgressText }, 0, 1); // 0%表示

        await loadAssetsForTemplate(newTemplate);
        
        loadedTemplates.add(newTemplate);
        currentTemplatePrefix = newTemplate;
        drawBackgroundLayer();
        await drawUiLayer();

        miniLoader.classList.add('hidden');
    });

    // (その他のUIコントロール、画像操作、ダウンロード処理のリスナーは変更なしのため省略)
    
    // --- 初期化処理 ---
    async function initialize() {
        console.log("初期化処理を開始します。");
        await document.fonts.ready;
        console.log("✓ フォントの準備が完了しました。");

        // デフォルトテンプレートのアセットのみを読み込む
        await loadAssetsForTemplate('Gothic_black', true);
        loadedTemplates.add('Gothic_black');
        console.log("✓ デフォルトアセットのプリロードが完了しました。");
        
        drawBackgroundLayer();
        drawCharacterLayer();
        await drawUiLayer();
        
        loaderElement.classList.add('hidden');
        setTimeout(() => {
            appElement.classList.remove('hidden');
        }, 300);
    }

    initialize();

    // --- 省略した関数たち (内容は前回から変更なし) ---
    // drawBackgroundLayer, drawCharacterLayer, drawUiLayer, drawIcons, drawNameText,
    // パフォーマンス最適化関数, 各種イベントハンドラ, ダウンロード処理, etc.
    // (これらの関数の内部ロジックは前回提出したものと同一です)
});
