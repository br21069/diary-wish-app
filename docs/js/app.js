(function () {
  const dateInput = document.getElementById("diary-date");
  const titleInput = document.getElementById("diary-title");
  const bodyInput = document.getElementById("diary-body");
  const moodInput = document.getElementById("diary-mood");
  const tagsInput = document.getElementById("diary-tags");
  const diaryForm = document.getElementById("diary-form");
  const diaryMessage = document.getElementById("diary-message");
  const handwritingMessage = document.getElementById("handwriting-message");
  const diaryImageMessage = document.getElementById("diary-image-message");
  const heading = document.getElementById("page-heading");
  const savedImage = document.getElementById("saved-handwriting");
  const noHandwriting = document.getElementById("no-handwriting");
  const diaryImagePreview = document.getElementById("diary-image-preview");
  const downloadDiaryImage = document.getElementById("download-diary-image");
  const canvas = document.getElementById("handwriting-canvas");
  const pad = window.HandwritingPad.create(canvas);

  function todayString() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function dateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("date") || todayString();
  }

  function showMessage(element, text) {
    element.textContent = text;
    window.setTimeout(() => {
      if (element.textContent === text) element.textContent = "";
    }, 3200);
  }

  function updateUrl(date) {
    const nextUrl = date === todayString() ? "./index.html" : `./index.html?date=${encodeURIComponent(date)}`;
    history.replaceState(null, "", nextUrl);
  }

  function collectDiaryForm() {
    return {
      date: dateInput.value,
      title: titleInput.value.trim(),
      body: bodyInput.value.trim(),
      mood: moodInput.value,
      tags: tagsInput.value.trim()
    };
  }

  function showSavedImage(imageData) {
    if (imageData) {
      savedImage.src = imageData;
      savedImage.classList.remove("hidden");
      noHandwriting.classList.add("hidden");
    } else {
      savedImage.removeAttribute("src");
      savedImage.classList.add("hidden");
      noHandwriting.classList.remove("hidden");
    }
  }

  function showDiaryCardImage(imageData, date) {
    if (!imageData) {
      diaryImagePreview.classList.add("hidden");
      downloadDiaryImage.classList.add("hidden");
      return;
    }

    diaryImagePreview.src = imageData;
    diaryImagePreview.classList.remove("hidden");
    downloadDiaryImage.href = imageData;
    downloadDiaryImage.download = `diary-${date}.png`;
    downloadDiaryImage.classList.remove("hidden");
  }

  async function loadDiary(date) {
    dateInput.value = date;
    heading.textContent = date === todayString() ? "今日の日記" : `${date} の日記`;

    const diary = await window.DiaryWishDB.getDiary(date);
    titleInput.value = diary?.title || "";
    bodyInput.value = diary?.body || "";
    moodInput.value = diary?.mood || "";
    tagsInput.value = diary?.tags || "";
    pad.loadImage(diary?.handwriting_image || "");
    showSavedImage(diary?.handwriting_image || "");
    showDiaryCardImage(diary?.diary_image || "", date);
    updateUrl(date);
  }

  async function saveDiary() {
    if (!dateInput.value) {
      showMessage(diaryMessage, "日付を選んでください。");
      return null;
    }

    const saved = await window.DiaryWishDB.saveDiary(collectDiaryForm());
    showMessage(diaryMessage, "日記を保存しました。");
    updateUrl(saved.date);
    return saved;
  }

  async function saveHandwriting() {
    if (!dateInput.value) {
      showMessage(handwritingMessage, "日付を選んでください。");
      return;
    }

    await window.DiaryWishDB.saveDiary(collectDiaryForm());
    const imageData = pad.toImageData();
    await window.DiaryWishDB.saveDiaryImage(dateInput.value, imageData);
    showSavedImage(imageData);
    showMessage(handwritingMessage, "手書きを保存しました。");
  }

  function loadImage(imageData) {
    return new Promise(resolve => {
      if (!imageData) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = imageData;
    });
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    const source = text || "";
    const paragraphs = source.split(/\n+/);
    const lines = [];

    for (const paragraph of paragraphs) {
      let line = "";
      for (const char of paragraph) {
        const testLine = line + char;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = char;
          if (maxLines && lines.length >= maxLines) return lines;
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      if (maxLines && lines.length >= maxLines) return lines;
    }

    return lines;
  }

  function drawTextBlock(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const lines = wrapLines(ctx, text, maxWidth, maxLines);
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });
    return y + lines.length * lineHeight;
  }

  function drawPill(ctx, text, x, y) {
    if (!text) return 0;
    ctx.font = "700 28px sans-serif";
    const width = ctx.measureText(text).width + 44;
    ctx.fillStyle = "#eef1ea";
    roundRect(ctx, x, y, width, 48, 24);
    ctx.fill();
    ctx.fillStyle = "#586b4b";
    ctx.fillText(text, x + 22, y + 32);
    return width;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  async function createDiaryCardImage() {
    if (!dateInput.value) {
      showMessage(diaryImageMessage, "日付を選んでください。");
      return;
    }

    await window.DiaryWishDB.saveDiary(collectDiaryForm());
    const diary = await window.DiaryWishDB.getDiary(dateInput.value);
    const handwriting = await loadImage(diary?.handwriting_image || "");
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1080;
    exportCanvas.height = 1350;
    const ctx = exportCanvas.getContext("2d");

    ctx.fillStyle = "#f8f7f4";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 60, 60, 960, 1230, 28);
    ctx.fill();

    ctx.fillStyle = "#7a8f69";
    ctx.font = "800 34px sans-serif";
    ctx.fillText("Diary", 110, 150);

    ctx.fillStyle = "#252525";
    ctx.font = "800 72px sans-serif";
    ctx.fillText(diary.date, 110, 245);

    ctx.font = "800 52px sans-serif";
    const title = diary.title || "無題の日記";
    let nextY = drawTextBlock(ctx, title, 110, 340, 860, 66, 2) + 35;

    let pillX = 110;
    const moodWidth = drawPill(ctx, diary.mood ? `気分: ${diary.mood}` : "気分なし", pillX, nextY);
    pillX += moodWidth + 14;
    if (diary.tags) drawPill(ctx, `# ${diary.tags}`, pillX, nextY);
    nextY += 90;

    ctx.fillStyle = "#34312d";
    ctx.font = "400 34px sans-serif";
    nextY = drawTextBlock(ctx, diary.body || "本文なし", 110, nextY, 860, 52, handwriting ? 9 : 15) + 42;

    if (handwriting) {
      ctx.fillStyle = "#75706a";
      ctx.font = "700 28px sans-serif";
      ctx.fillText("手書きメモ", 110, nextY);
      nextY += 24;

      const boxX = 110;
      const boxY = nextY;
      const boxW = 860;
      const boxH = 330;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e7e1d8";
      ctx.lineWidth = 3;
      roundRect(ctx, boxX, boxY, boxW, boxH, 18);
      ctx.fill();
      ctx.stroke();

      const scale = Math.min(boxW / handwriting.width, boxH / handwriting.height);
      const drawW = handwriting.width * scale;
      const drawH = handwriting.height * scale;
      ctx.drawImage(handwriting, boxX + (boxW - drawW) / 2, boxY + (boxH - drawH) / 2, drawW, drawH);
    }

    const imageData = exportCanvas.toDataURL("image/png");
    await window.DiaryWishDB.saveDiaryCardImage(diary.date, imageData);
    showDiaryCardImage(imageData, diary.date);
    showMessage(diaryImageMessage, "今日の1枚を作成して保存しました。PNG保存もできます。");
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // GitHub PagesやHTTPSでは登録できます。file://で開いた場合は失敗します。
    });
  }

  diaryForm.addEventListener("submit", event => {
    event.preventDefault();
    saveDiary().catch(error => {
      showMessage(diaryMessage, `保存に失敗しました: ${error.message}`);
    });
  });

  dateInput.addEventListener("change", () => {
    if (dateInput.value) {
      loadDiary(dateInput.value).catch(error => {
        showMessage(diaryMessage, `読み込みに失敗しました: ${error.message}`);
      });
    }
  });

  document.getElementById("load-today").addEventListener("click", () => {
    loadDiary(todayString());
  });

  document.getElementById("pen-size").addEventListener("input", event => {
    pad.setSize(event.target.value);
  });

  document.getElementById("pen-mode").addEventListener("click", () => {
    pad.setTool("pen");
    showMessage(handwritingMessage, "ペンに切り替えました。");
  });

  document.getElementById("eraser-mode").addEventListener("click", () => {
    pad.setTool("eraser");
    showMessage(handwritingMessage, "消しゴムに切り替えました。");
  });

  document.getElementById("clear-canvas").addEventListener("click", () => {
    if (confirm("手書きキャンバスを全消去しますか？")) {
      pad.clear();
      showMessage(handwritingMessage, "キャンバスを消去しました。保存すると反映されます。");
    }
  });

  document.getElementById("save-handwriting").addEventListener("click", () => {
    saveHandwriting().catch(error => {
      showMessage(handwritingMessage, `手書き保存に失敗しました: ${error.message}`);
    });
  });

  document.getElementById("create-diary-image").addEventListener("click", () => {
    createDiaryCardImage().catch(error => {
      showMessage(diaryImageMessage, `日記画像の作成に失敗しました: ${error.message}`);
    });
  });

  registerServiceWorker();
  loadDiary(dateFromUrl()).catch(error => {
    showMessage(diaryMessage, `読み込みに失敗しました: ${error.message}`);
  });
})();
