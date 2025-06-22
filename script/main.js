document.getElementById('downloadBtn').addEventListener('click', () => {
  const canvas = document.getElementById('cardCanvas');
  const link = document.createElement('a');
  link.download = 'ff14_card.png';
  link.href = canvas.toDataURL();
  link.click();
});
