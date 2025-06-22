
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 768;

const BASE_URL = "/ffxiv-card";

let bgImage = null;
let uploadedImage = null;
let uploadedScale = 1;
let uploadedX = 0;
let uploadedY = 0;
let dragging = false;
let lastX, lastY;
let lastTouchDistance = null;
let fontName = "Black Han Sans";

// 背景描画
function drawBackground(bgFile) {
    bgImage = new Image();
    bgImage.onload = drawCanvas;
    bgImage.src = BASE_URL + '/assets/backgrounds/' + bgFile;
}

// Canvas全体描画
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // アップロード画像（最背面）
    if (uploadedImage) {
        const w = uploadedImage.width * uploadedScale;
        const h = uploadedImage.height * uploadedScale;
        const x = (canvas.width - w) / 2 + uploadedX;
        const y = (canvas.height - h) / 2 + uploadedY;
        ctx.drawImage(uploadedImage, x, y, w, h);
    }

    // テンプレ画像（前面）
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    // 名前
    const name = document.getElementById("charName").value;
    ctx.font = `48px '${fontName}'`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(name, canvas.width / 2, 80);
}

// テンプレ選択
document.querySelectorAll('#templateButtons button').forEach(btn => {
    btn.addEventListener('click', () => {
        drawBackground(btn.getAttribute('data-bg'));
    });
});

// フォント変更
document.getElementById('fontSelector').addEventListener('change', (e) => {
    fontName = e.target.value;
    drawCanvas();
});

// 名前入力
document.getElementById('charName').addEventListener('input', drawCanvas);

// アップロード
document.getElementById("uploadImage").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        uploadedImage = new Image();
        uploadedImage.onload = () => {
            uploadedX = 0;
            uploadedY = 0;
            uploadedScale = 1;
            drawCanvas();
        };
        uploadedImage.src = reader.result;
    };
    reader.readAsDataURL(file);
});

// 出力
document.getElementById("downloadBtn").addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "card.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
});

// PC操作
canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});
canvas.addEventListener("mousemove", (e) => {
    if (dragging) {
        uploadedX += e.clientX - lastX;
        uploadedY += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        drawCanvas();
    }
});
canvas.addEventListener("mouseup", () => dragging = false);
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    uploadedScale *= e.deltaY < 0 ? 1.05 : 0.95;
    drawCanvas();
});

// スマホ操作
canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
        dragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        lastTouchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
});
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging) {
        uploadedX += e.touches[0].clientX - lastX;
        uploadedY += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        drawCanvas();
    } else if (e.touches.length === 2) {
        const newDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        uploadedScale *= newDistance / lastTouchDistance;
        lastTouchDistance = newDistance;
        drawCanvas();
    }
}, { passive: false });
canvas.addEventListener("touchend", () => {
    dragging = false;
    lastTouchDistance = null;
});

// 初期テンプレート
drawBackground("Gothic_black.png");
