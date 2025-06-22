

const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");

const templateWidth = 3750;
const templateHeight = 2250;

canvas.width = templateWidth;
canvas.height = templateHeight;

canvas.style.width = "100%";
canvas.style.maxWidth = "1536px";
canvas.style.height = "auto";

const downloadBtn = document.getElementById("downloadBtn");

let bgImage = new Image();
let uploadedImage = null;
let backgroundType = "black";

const CANVAS_WIDTH = 3750;
const CANVAS_HEIGHT = 2250;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function setBackground(type) {
    backgroundType = type;
    bgImage.src = `assets/backgrounds/Gothic_${type}.png`;
}

bgImage.onload = () => {
    drawCanvas();
};

uploadImage.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        uploadedImage = new Image();
        uploadedImage.onload = drawCanvas;
        uploadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

nameInput.addEventListener("input", drawCanvas);
fontSelect.addEventListener("change", drawCanvas);

downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "ffxiv_card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (uploadedImage) {
        const scale = Math.max(
            canvas.width / uploadedImage.width,
            canvas.height / uploadedImage.height
        );
        const imgWidth = uploadedImage.width * scale;
        const imgHeight = uploadedImage.height * scale;
        const x = (canvas.width - imgWidth) / 2;
        const y = (canvas.height - imgHeight) / 2;
        ctx.drawImage(uploadedImage, x, y, imgWidth, imgHeight);
    }

    if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    const text = nameInput.value;
    if (text) {
        ctx.font = `120px ${fontSelect.value}`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, 220);
    }
}

setBackground("black");