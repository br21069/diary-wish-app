const canvas = document.getElementById('handwriting-canvas');
const ctx = canvas.getContext('2d');
const penSizeInput = document.getElementById('pen-size');
const penModeButton = document.getElementById('pen-mode');
const eraserModeButton = document.getElementById('eraser-mode');
const clearButton = document.getElementById('clear-canvas');
const saveButton = document.getElementById('save-canvas');
const message = document.getElementById('canvas-message');
const savedImage = document.getElementById('saved-handwriting');

let drawing = false;
let mode = 'pen';
let lastPoint = null;

function setupCanvas() {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX ?? event.touches?.[0]?.clientX;
  const clientY = event.clientY ?? event.touches?.[0]?.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDrawing(event) {
  event.preventDefault();
  drawing = true;
  lastPoint = getPoint(event);
}

function draw(event) {
  if (!drawing) return;
  event.preventDefault();
  const point = getPoint(event);
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.lineWidth = Number(penSizeInput.value);
  if (mode === 'eraser') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Number(penSizeInput.value) * 3;
  } else {
    ctx.strokeStyle = '#2f2a26';
  }
  ctx.stroke();
  lastPoint = point;
}

function stopDrawing() {
  drawing = false;
  lastPoint = null;
}

function setMode(nextMode) {
  mode = nextMode;
  penModeButton.classList.toggle('primary-btn', mode === 'pen');
  penModeButton.classList.toggle('secondary-btn', mode !== 'pen');
  eraserModeButton.classList.toggle('primary-btn', mode === 'eraser');
  eraserModeButton.classList.toggle('secondary-btn', mode !== 'eraser');
}

canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointerleave', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);

penModeButton.addEventListener('click', () => setMode('pen'));
eraserModeButton.addEventListener('click', () => setMode('eraser'));

clearButton.addEventListener('click', () => {
  if (!confirm('手書きを全消去しますか？')) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  message.textContent = 'キャンバスを消去しました。';
});

saveButton.addEventListener('click', async () => {
  const image = canvas.toDataURL('image/png');
  message.textContent = '保存中です...';
  try {
    const response = await fetch(`/api/diary/${window.DIARY_DATE}/handwriting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || '保存に失敗しました。');
    savedImage.src = result.image_path + `?t=${Date.now()}`;
    savedImage.classList.remove('hidden');
    message.textContent = '手書きを保存しました。';
  } catch (error) {
    message.textContent = error.message;
  }
});

setupCanvas();
setMode('pen');
