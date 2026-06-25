(function () {
  const dateInput = document.getElementById("diary-date");
  const titleInput = document.getElementById("diary-title");
  const bodyInput = document.getElementById("diary-body");
  const diaryForm = document.getElementById("diary-form");
  const diaryMessage = document.getElementById("diary-message");
  const diaryImageMessage = document.getElementById("diary-image-message");
  const heading = document.getElementById("page-heading");
  const diaryImagePreview = document.getElementById("diary-image-preview");
  const downloadDiaryImage = document.getElementById("download-diary-image");

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
    }, 3000);
  }

  function updateUrl(date) {
    const nextUrl = date === todayString() ? "./index.html" : `./index.html?date=${encodeURIComponent(date)}`;
    history.replaceState(null, "", nextUrl);
  }

  function collectDiaryForm() {
    return {
      date: dateInput.value,
      title: titleInput.value.trim(),
      body: bodyInput.value.trim()
    };
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
    showDiaryCardImage(diary?.generated_image || diary?.diary_image || "", date);
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
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1080;
    exportCanvas.height = 1600;
    const ctx = exportCanvas.getContext("2d");

    ctx.fillStyle = "#f8f7f4";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 60, 60, 960, 1480, 28);
    ctx.fill();

    ctx.fillStyle = "#7a8f69";
    ctx.font = "800 34px sans-serif";
    ctx.fillText("Diary", 110, 150);

    ctx.fillStyle = "#252525";
    ctx.font = "800 74px sans-serif";
    ctx.fillText(diary.date, 110, 250);

    let nextY = 350;
    if (diary.title) {
      ctx.font = "800 54px sans-serif";
      nextY = drawTextBlock(ctx, diary.title, 110, nextY, 860, 68, 2) + 46;
    }

    ctx.fillStyle = "#34312d";
    ctx.font = "400 38px sans-serif";
    nextY = drawTextBlock(ctx, diary.body || "今日はまだ日記がありません。", 110, nextY, 860, 58, 19);

    ctx.fillStyle = "#aaa39a";
    ctx.font = "700 24px sans-serif";
    ctx.fillText("日記・Wishリストアプリ", 110, 1500);

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
