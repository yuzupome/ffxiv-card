// main_fixed_timeicons_v2.js - 全機能統合済み・プレイ時間修正対応版 + 改善済み + スマホ操作対応

...（前略：既存コード省略）...

// 追加：スマホ操作（1本指移動 + ピンチズーム）対応
let lastTouchDist = null;
let lastTouchMid = null;

canvas.addEventListener("touchstart", e => {
  if (!uploadedImgState) return;
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    uploadedImgState.dragging = true;
    uploadedImgState.offsetX = touch.clientX - uploadedImgState.x;
    uploadedImgState.offsetY = touch.clientY - uploadedImgState.y;
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    lastTouchMid = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2
    };
  }
});

canvas.addEventListener("touchmove", e => {
  if (!uploadedImgState) return;
  if (e.touches.length === 1 && uploadedImgState.dragging) {
    const touch = e.touches[0];
    uploadedImgState.x = touch.clientX - uploadedImgState.offsetX;
    uploadedImgState.y = touch.clientY - uploadedImgState.offsetY;
    drawCanvas();
  } else if (e.touches.length === 2) {
    const currentDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const delta = currentDist / lastTouchDist;
    uploadedImgState.width *= delta;
    uploadedImgState.height *= delta;
    uploadedImgState.x -= (uploadedImgState.width * (delta - 1)) / 2;
    uploadedImgState.y -= (uploadedImgState.height * (delta - 1)) / 2;
    lastTouchDist = currentDist;
    drawCanvas();
  }
  e.preventDefault();
});

canvas.addEventListener("touchend", () => {
  if (uploadedImgState) uploadedImgState.dragging = false;
  lastTouchDist = null;
  lastTouchMid = null;
});

// 初期描画
drawCanvas();
