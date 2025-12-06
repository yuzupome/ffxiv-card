document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 設定データ ---
    const CONFIG = {
        width: 2400,
        height: 1350,
        gridCols: 6,
        gridRows: 2,
        assets: {
            square: './assets/images/memories/template_square.webp',
            jan:    './assets/images/memories/template_jan.webp',
            circle: './assets/images/memories/template_circle.webp',
            moji:   './assets/images/memories/text_overlay.webp'
        }
    };

    const TEMPLATES = {
        square: {
            layout: { startX: 353, startY: 23, width: 316, height: 634, gapX: 27, gapY: 36 },
            shape: 'rect',
            radius: 0
        },
        jan: { 
            layout: { startX: 353, startY: 23, width: 316, height: 634, gapX: 27, gapY: 36 },
            shape: 'cut',
            radius: 55
        },
        circle: {
            layout: { startX: 342, startY: 23, width: 334, height: 630, gapX: 12, gapY: 44 },
            shape: 'rect', 
            radius: 0
        }
    };

    // --- 2. 状態管理 ---
    const state = {
        currentTemplate: 'square',
        userImages: new Array(12).fill(null),
        imageStates: [], 
        assets: {}, 
        bgColor: '#ffffff',
        textColor: '#333333',
        isDragging: false,
        dragTargetIndex: -1,
        lastMouseX: 0,
        lastMouseY: 0,
        targetUploadIndex: -1
    };

    for(let i=0; i<12; i++) state.imageStates.push({ x: 0, y: 0, scale: 1.0 });

    // --- 3. DOM要素 & Canvas Contexts ---
    const layerImages = document.getElementById('layer-images');
    const layerTemplate = document.getElementById('layer-template');
    const layerText = document.getElementById('layer-text');
    
    const ctxImages = layerImages.getContext('2d');
    const ctxTemplate = layerTemplate.getContext('2d');
    const ctxText = layerText.getContext('2d');

    const fileInput = document.getElementById('file-input');
    const singleFileInput = document.getElementById('single-file-input');
    const thumbnailList = document.getElementById('thumbnail-list');
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    
    // ▼ 追加: 背景色連動のためのラッパー要素
    const canvasWrapper = document.querySelector('.canvas-wrapper');

    const textColorInput = document.getElementById('text-color');
    const bgColorInput = document.getElementById('bg-color');
    const saveBtn = document.getElementById('save-btn');
    const saveModal = document.getElementById('saveModal');
    const modalImage = document.getElementById('modalImage');
    const closeModalBtn = document.getElementById('closeModal');

    // --- 4. 初期化処理 ---
    async function init() {
        [layerImages, layerTemplate, layerText].forEach(c => {
            c.width = CONFIG.width;
            c.height = CONFIG.height;
        });
        
        // ▼ 追加: 初期化時も背景色を合わせる
        if(canvasWrapper) {
            canvasWrapper.style.backgroundColor = state.bgColor;
        }

        renderThumbnails();
        setupSortable();

        try {
            await Promise.all([
                loadAsset('square', CONFIG.assets.square),
                loadAsset('jan', CONFIG.assets.jan),
                loadAsset('circle', CONFIG.assets.circle),
                loadAsset('moji', CONFIG.assets.moji)
            ]);
        } catch (e) {
            console.warn('Load Error:', e);
        }
        
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            app.style.visibility = 'visible';
        }, 500);

        redrawAll();
        setupEvents();
    }

    function loadAsset(key, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { state.assets[key] = img; resolve(); };
            img.onerror = () => { state.assets[key] = null; resolve(); };
            img.src = src;
        });
    }

    function setupSortable() {
        if (typeof Sortable !== 'undefined') {
            Sortable.create(thumbnailList, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                delay: 200,
                delayOnTouchOnly: true,
                onEnd: (evt) => {
                    const oldIndex = evt.oldIndex;
                    const newIndex = evt.newIndex;
                    if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;

                    const tempImg = state.userImages[oldIndex];
                    state.userImages[oldIndex] = state.userImages[newIndex];
                    state.userImages[newIndex] = tempImg;

                    const tempState = state.imageStates[oldIndex];
                    state.imageStates[oldIndex] = state.imageStates[newIndex];
                    state.imageStates[newIndex] = tempState;

                    renderThumbnails();
                    drawImagesLayer();
                }
            });
        }
    }

    // --- 5. イベント設定 ---
    function setupEvents() {
        fileInput.addEventListener('change', handleFileUpload);
        singleFileInput.addEventListener('change', handleSingleFileUpload);

        document.querySelectorAll('.temp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.temp-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                state.currentTemplate = e.target.dataset.template;
                
                // テンプレート変更時も再描画 (drawImagesLayerでbleed値が変わるため)
                redrawAll();
            });
        });

        textColorInput.addEventListener('input', (e) => {
            state.textColor = e.target.value;
            drawTextLayer();
        });

        bgColorInput.addEventListener('input', (e) => {
            state.bgColor = e.target.value;
            drawTemplateLayer();
            // ▼ 追加: ここで後ろの壁の色も変える！
            if(canvasWrapper) {
                canvasWrapper.style.backgroundColor = state.bgColor;
            }
        });

        saveBtn.addEventListener('click', saveImage);
        closeModalBtn.addEventListener('click', () => saveModal.classList.add('hidden'));

        layerText.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        layerText.addEventListener('wheel', onWheel, { passive: false });
        layerText.addEventListener('touchstart', onTouchStart, { passive: false });
        layerText.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onMouseUp);
    }

    // --- 6. ファイル処理 ---
    function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.slice(0, 12).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const emptyIdx = state.userImages.findIndex(i => i === null);
                    if (emptyIdx !== -1) {
                        state.userImages[emptyIdx] = img;
                        state.imageStates[emptyIdx] = { x: 0, y: 0, scale: 1.0 }; 
                        renderThumbnails();
                        drawImagesLayer();
                    }
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; 
    }

    function handleSingleFileUpload(e) {
        const file = e.target.files[0];
        if (!file || state.targetUploadIndex === -1) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                const idx = state.targetUploadIndex;
                state.userImages[idx] = img;
                state.imageStates[idx] = { x: 0, y: 0, scale: 1.0 };
                
                renderThumbnails();
                drawImagesLayer();
                state.targetUploadIndex = -1;
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    function renderThumbnails() {
        thumbnailList.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const div = document.createElement('div');
            div.className = 'thumb-slot' + (state.userImages[i] ? '' : ' empty');
            div.dataset.index = i;
            div.dataset.month = i + 1;

            div.onclick = () => {
                state.targetUploadIndex = i;
                singleFileInput.click();
            };

            if (state.userImages[i]) {
                const img = document.createElement('img');
                img.src = state.userImages[i].src;
                div.appendChild(img);
                
                div.ondblclick = (e) => {
                    e.stopPropagation();
                    if(confirm(`Delete image ${i+1}?`)) {
                        state.userImages[i] = null;
                        state.imageStates[i] = { x: 0, y: 0, scale: 1.0 };
                        renderThumbnails();
                        drawImagesLayer();
                    }
                };
            }
            thumbnailList.appendChild(div);
        }
    }

    // --- 7. 描画ロジック ---
    function redrawAll() {
        drawImagesLayer();
        drawTemplateLayer();
        drawTextLayer();
    }

    function drawImagesLayer() {
        ctxImages.clearRect(0, 0, CONFIG.width, CONFIG.height);
        
        const tmpl = TEMPLATES[state.currentTemplate];
        const { startX, startY, width, height, gapX, gapY } = tmpl.layout;
        
        // ★塗り足し設定（維持）
        let bleed = 7;
        if (state.currentTemplate === 'circle') {
            bleed = 9;
        }

        for (let i = 0; i < 12; i++) {
            const col = i % CONFIG.gridCols;
            const row = Math.floor(i / CONFIG.gridCols);
            const cellX = startX + col * (width + gapX);
            const cellY = startY + row * (height + gapY);

            ctxImages.save();
            
            // 塗り足し込みのパスを作成
            createShapePath(
                ctxImages, 
                cellX - bleed,       
                cellY - bleed,       
                width + (bleed * 2), 
                height + (bleed * 2),
                tmpl.shape, 
                tmpl.radius
            );
            ctxImages.clip();

            if (state.userImages[i]) {
                const img = state.userImages[i];
                const s = state.imageStates[i];
                const scaleBase = Math.max(width / img.width, height / img.height);
                const finalScale = scaleBase * s.scale;
                const drawW = img.width * finalScale;
                const drawH = img.height * finalScale;
                const centerX = cellX + width / 2 + s.x;
                const centerY = cellY + height / 2 + s.y;
                
                ctxImages.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
            } else {
                // ここで描かれるのが「うすいグレー」です
                ctxImages.fillStyle = "#eeeeee"; 
                ctxImages.fill();
                
                ctxImages.fillStyle = "rgba(0,0,0,0.2)";
                ctxImages.font = "bold 60px sans-serif";
                ctxImages.textAlign = "center";
                ctxImages.textBaseline = "middle";
                ctxImages.fillText(i + 1, cellX + width / 2, cellY + height / 2);
            }
            ctxImages.restore();
        }
    }

    function drawTemplateLayer() {
        ctxTemplate.clearRect(0, 0, CONFIG.width, CONFIG.height);
        
        // 1. 背景色をベタ塗り
        ctxTemplate.globalCompositeOperation = 'source-over';
        ctxTemplate.fillStyle = state.bgColor;
        ctxTemplate.fillRect(0, 0, CONFIG.width, CONFIG.height);
        
        const asset = state.assets[state.currentTemplate];
        if (asset) {
            // 3. テンプレートの形に合わせて背景色を切り抜く
            ctxTemplate.globalCompositeOperation = 'destination-in';
            ctxTemplate.drawImage(asset, 0, 0, CONFIG.width, CONFIG.height);
            
            // 4. テンプレートの影や枠線の色を乗算で重ねる
            ctxTemplate.globalCompositeOperation = 'multiply';
            ctxTemplate.drawImage(asset, 0, 0, CONFIG.width, CONFIG.height);
        }
        
        ctxTemplate.globalCompositeOperation = 'source-over';
    }

    function drawTextLayer() {
        ctxText.clearRect(0, 0, CONFIG.width, CONFIG.height);
        const asset = state.assets.moji;
        if (!asset) return;
        const osc = document.createElement('canvas');
        osc.width = CONFIG.width;
        osc.height = CONFIG.height;
        const octx = osc.getContext('2d');
        octx.drawImage(asset, 0, 0, CONFIG.width, CONFIG.height);
        octx.globalCompositeOperation = 'source-in';
        octx.fillStyle = state.textColor;
        octx.fillRect(0, 0, CONFIG.width, CONFIG.height);
        ctxText.drawImage(osc, 0, 0);
    }

    // --- ユーティリティ ---
    function createShapePath(ctx, x, y, w, h, shape, r) {
        ctx.beginPath();
        if (shape === 'cut') {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + h - r);
            ctx.lineTo(x + w - r, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
        } else {
            ctx.rect(x, y, w, h);
        }
    }

    // --- 8. 操作ロジック ---
    function getPos(e) {
        const rect = layerText.getBoundingClientRect();
        const scaleX = layerText.width / rect.width;
        const scaleY = layerText.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function getTargetIndex(x, y) {
        const tmpl = TEMPLATES[state.currentTemplate];
        const { startX, startY, width, height, gapX, gapY } = tmpl.layout;
        for (let i = 0; i < 12; i++) {
            const col = i % CONFIG.gridCols;
            const row = Math.floor(i / CONFIG.gridCols);
            const bx = startX + col * (width + gapX);
            const by = startY + row * (height + gapY);
            if (x >= bx && x <= bx + width && y >= by && y <= by + height) return i;
        }
        return -1;
    }

    function onMouseDown(e) {
        const p = getPos(e);
        const idx = getTargetIndex(p.x, p.y);
        if (idx !== -1 && state.userImages[idx]) {
            state.isDragging = true;
            state.dragTargetIndex = idx;
            state.lastMouseX = p.x;
            state.lastMouseY = p.y;
            layerText.style.cursor = 'grabbing';
        }
    }
    function onMouseMove(e) {
        if (!state.isDragging) return;
        const p = getPos(e);
        const dx = p.x - state.lastMouseX;
        const dy = p.y - state.lastMouseY;
        const s = state.imageStates[state.dragTargetIndex];
        s.x += dx; 
        s.y += dy;
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        requestAnimationFrame(drawImagesLayer); 
    }
    function onMouseUp() {
        state.isDragging = false;
        layerText.style.cursor = 'grab';
    }
    function onWheel(e) {
        e.preventDefault();
        const p = getPos(e);
        const idx = getTargetIndex(p.x, p.y);
        if (idx !== -1 && state.userImages[idx]) {
            const s = state.imageStates[idx];
            s.scale += e.deltaY * -0.001;
            s.scale = Math.max(0.1, s.scale); 
            requestAnimationFrame(drawImagesLayer);
        }
    }

    let initialPinchDist = 0;
    let initialScale = 1;
    function onTouchStart(e) {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            onMouseDown({ clientX: t.clientX, clientY: t.clientY });
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const p = getPos({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
            const idx = getTargetIndex(p.x, p.y);
            if (idx !== -1 && state.userImages[idx]) {
                state.dragTargetIndex = idx;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDist = Math.sqrt(dx*dx + dy*dy);
                initialScale = state.imageStates[idx].scale;
            }
        }
    }
    function onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const t = e.touches[0];
            onMouseMove({ clientX: t.clientX, clientY: t.clientY });
        } else if (e.touches.length === 2 && state.dragTargetIndex !== -1) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (initialPinchDist > 0) {
                const scale = (dist / initialPinchDist) * initialScale;
                state.imageStates[state.dragTargetIndex].scale = Math.max(0.1, scale);
                requestAnimationFrame(drawImagesLayer);
            }
        }
    }

    // --- 9. 保存処理 ---
    async function saveImage() {
        const btn = document.getElementById('save-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>Processing...</span>';
        btn.disabled = true;

        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = CONFIG.width;
            finalCanvas.height = CONFIG.height;
            const fctx = finalCanvas.getContext('2d');
            fctx.drawImage(layerImages, 0, 0);   
            fctx.drawImage(layerTemplate, 0, 0); 
            fctx.drawImage(layerText, 0, 0);     

            const imageUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (isIOS) {
                modalImage.src = imageUrl;
                saveModal.classList.remove('hidden');
            } else {
                const link = document.createElement('a');
                link.download = `ffxiv_memories_${Date.now()}.jpg`;
                link.href = imageUrl;
                link.click();
            }
        } catch(e) {
            console.error(e);
            alert('Save Failed');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    init();
});