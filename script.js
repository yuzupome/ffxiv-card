const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let userImage = null;

document.getElementById('bgUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      userImage = img;
    };
    img.src = event.target.result;
  };
  if (file) reader.readAsDataURL(file);
});

document.getElementById('generateBtn').addEventListener('click', () => {
  // 背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (userImage) {
    ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);
  }

  // データセンター
  const dc = document.getElementById('dcSelect').value;
  ctx.fillStyle = "#000000";
  ctx.font = "24px sans-serif";
  ctx.fillText("DC: " + (dc || "未選択"), 30, 40);

  // プレイスタイル
  const playstyles = Array.from(document.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
  ctx.fillText("Play Style: " + (playstyles.join(", ") || "なし"), 30, 80);

  // 進行度
  const prog = document.getElementById('progressSelect').value;
  ctx.fillText("進行度: " + (prog || "未選択"), 30, 120);

  // ダウンロードリンク生成
  const dataURL = canvas.toDataURL("image/png");
  const link = document.getElementById("downloadLink");
  link.href = dataURL;
  link.style.display = "inline-block";
  link.textContent = "画像をダウンロード";
});