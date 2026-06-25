(function () {
  const dateInput = document.getElementById("calendar-date");
  const openButton = document.getElementById("open-date");
  const list = document.getElementById("diary-list");
  const message = document.getElementById("calendar-message");

  function todayString() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function showMessage(text) {
    message.textContent = text;
  }

  function diaryUrl(date) {
    return `./index.html?date=${encodeURIComponent(date)}`;
  }

  function summary(text) {
    if (!text) return "本文なし";
    return text.length > 70 ? `${text.slice(0, 70)}...` : text;
  }

  function renderDiaries(diaries) {
    list.innerHTML = "";

    if (diaries.length === 0) {
      list.innerHTML = '<p class="hint">まだ日記がありません。</p>';
      return;
    }

    diaries.forEach(diary => {
      const link = document.createElement("a");
      link.className = "list-item";
      link.href = diaryUrl(diary.date);
      link.innerHTML = `
        <div class="list-title">${escapeHtml(diary.date)} ${escapeHtml(diary.title || "無題の日記")}</div>
        <div class="list-meta">
          <span class="pill">${escapeHtml(diary.mood || "気分なし")}</span>
          ${diary.tags ? `<span class="pill">${escapeHtml(diary.tags)}</span>` : ""}
          ${diary.handwriting_image ? '<span class="pill">手書きあり</span>' : ""}
        </div>
        <div class="hint">${escapeHtml(summary(diary.body))}</div>
      `;
      list.appendChild(link);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  openButton.addEventListener("click", () => {
    if (!dateInput.value) {
      showMessage("日付を選んでください。");
      return;
    }
    window.location.href = diaryUrl(dateInput.value);
  });

  dateInput.value = todayString();

  window.DiaryWishDB.getAllDiaries()
    .then(renderDiaries)
    .catch(error => showMessage(`日記一覧の読み込みに失敗しました: ${error.message}`));
})();
