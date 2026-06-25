(function () {
  const form = document.getElementById("wish-form");
  const idInput = document.getElementById("wish-id");
  const categoryInput = document.getElementById("wish-category");
  const titleInput = document.getElementById("wish-title");
  const memoInput = document.getElementById("wish-memo");
  const wishPhotoInput = document.getElementById("wish-photo");
  const wishPhotoPreview = document.getElementById("wish-photo-preview");
  const noWishPhoto = document.getElementById("no-wish-photo");
  const removeWishPhotoButton = document.getElementById("remove-wish-photo");
  const statusInput = document.getElementById("wish-status");
  const completedAtInput = document.getElementById("wish-completed-at");
  const completionPhotoInput = document.getElementById("wish-completion-photo");
  const completionNoteInput = document.getElementById("wish-completion-note");
  const completionPhotoPreview = document.getElementById("wish-completion-photo-preview");
  const completionFields = document.getElementById("wish-completion-fields");
  const removeWishCompletionPhotoButton = document.getElementById("remove-wish-completion-photo");
  const filterInput = document.getElementById("wish-filter");
  const resetButton = document.getElementById("reset-wish-form");
  const list = document.getElementById("wish-list");
  const message = document.getElementById("wish-message");

  const completionPanel = document.getElementById("completion-panel");
  const completionForm = document.getElementById("completion-form");
  const completionWishIdInput = document.getElementById("completion-wish-id");
  const completionTargetTitle = document.getElementById("completion-target-title");
  const completionDateInput = document.getElementById("completion-date");
  const completionPhotoPicker = document.getElementById("completion-photo");
  const completionNotePanelInput = document.getElementById("completion-note");
  const completionPanelPhotoPreview = document.getElementById("completion-photo-preview");
  const cancelCompletionButton = document.getElementById("cancel-completion");
  const removeCompletionPhotoButton = document.getElementById("remove-completion-photo");

  let formPhotoData = "";
  let panelPhotoData = "";
  let wishPhotoData = "";

  const categoryLabels = {
    work: "仕事",
    play: "遊び",
    book: "本"
  };

  const legacyCategoryMap = {
    place: "play",
    movie: "play",
    todo: "play"
  };

  const statusLabels = {
    want: "これからやりたい",
    done: "達成済み"
  };

  function todayString() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function showMessage(text) {
    message.textContent = text;
    window.setTimeout(() => {
      if (message.textContent === text) message.textContent = "";
    }, 2600);
  }

  function normalizeCategory(category) {
    return categoryLabels[category] ? category : legacyCategoryMap[category] || "play";
  }

  function showPhotoPreview(imageData, imageElement) {
    if (!imageData) {
      imageElement.classList.add("hidden");
      imageElement.removeAttribute("src");
      return;
    }

    imageElement.src = imageData;
    imageElement.classList.remove("hidden");
  }

  function showWishPhoto(imageData) {
    wishPhotoData = imageData || "";
    if (wishPhotoData) {
      wishPhotoPreview.src = wishPhotoData;
      wishPhotoPreview.classList.remove("hidden");
      noWishPhoto.classList.add("hidden");
    } else {
      wishPhotoPreview.removeAttribute("src");
      wishPhotoPreview.classList.add("hidden");
      noWishPhoto.classList.remove("hidden");
    }
  }

  function toggleCompletionFields() {
    const isDone = statusInput.value === "done";
    completionFields.classList.toggle("hidden", !isDone);
    if (isDone && !completedAtInput.value) {
      completedAtInput.value = todayString();
    }
  }

  function collectForm() {
    const status = statusInput.value;
    return {
      id: idInput.value,
      category: categoryInput.value,
      title: titleInput.value.trim(),
      memo: memoInput.value.trim(),
      wish_photo: wishPhotoData,
      status,
      completed_at: status === "done" ? completedAtInput.value : "",
      completion_photo: status === "done" ? formPhotoData : "",
      completion_note: status === "done" ? completionNoteInput.value.trim() : ""
    };
  }

  function resetForm() {
    idInput.value = "";
    form.reset();
    formPhotoData = "";
    wishPhotoData = "";
    categoryInput.value = "work";
    statusInput.value = "want";
    form.querySelector(".primary-btn").textContent = "保存";
    showWishPhoto("");
    showPhotoPreview("", completionPhotoPreview);
    toggleCompletionFields();
  }

  function fillForm(wish) {
    idInput.value = wish.id;
    categoryInput.value = normalizeCategory(wish.category);
    titleInput.value = wish.title;
    memoInput.value = wish.memo || "";
    statusInput.value = wish.status || "want";
    showWishPhoto(wish.wish_photo || "");
    completedAtInput.value = wish.completed_at || wish.date_done || "";
    completionNoteInput.value = wish.completion_note || "";
    formPhotoData = wish.completion_photo || "";
    showPhotoPreview(formPhotoData, completionPhotoPreview);
    form.querySelector(".primary-btn").textContent = "更新";
    toggleCompletionFields();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function filterWishes(wishes) {
    const filter = filterInput.value;
    if (filter === "all") return wishes;
    return wishes.filter(wish => normalizeCategory(wish.category) === filter);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  function createSectionTitle(text) {
    const title = document.createElement("h3");
    title.className = "status-section-title";
    title.textContent = text;
    return title;
  }

  function createWishCard(wish) {
    const normalizedCategory = normalizeCategory(wish.category);
    const status = wish.status || "want";
    const item = document.createElement("article");
    item.className = "list-item";

    const doneDetails = status === "done" ? `
      ${wish.completed_at ? `<div class="hint">達成日: ${escapeHtml(wish.completed_at)}</div>` : ""}
      ${wish.completion_photo ? `<img class="completion-photo" src="${escapeAttribute(wish.completion_photo)}" alt="達成写真">` : ""}
      ${wish.completion_note ? `<div class="hint">${escapeHtml(wish.completion_note)}</div>` : ""}
    ` : "";

    const wantPhoto = status === "want" && wish.wish_photo
      ? `<img class="completion-photo" src="${escapeAttribute(wish.wish_photo)}" alt="Wish添付写真">`
      : "";

    const wantActions = status === "want"
      ? `<button class="primary-btn" type="button" data-action="complete" data-id="${wish.id}">達成した</button>`
      : `<button class="secondary-btn" type="button" data-action="reopen" data-id="${wish.id}">未達成に戻す</button>`;

    item.innerHTML = `
      <div class="list-title">${escapeHtml(wish.title)}</div>
      <div class="list-meta">
        <span class="pill">${escapeHtml(categoryLabels[normalizedCategory])}</span>
        <span class="pill">${escapeHtml(statusLabels[status] || statusLabels.want)}</span>
      </div>
      ${wish.memo ? `<div class="hint">${escapeHtml(wish.memo)}</div>` : ""}
      ${wantPhoto}
      ${doneDetails}
      <div class="item-actions">
        ${wantActions}
        <button class="secondary-btn" type="button" data-action="edit" data-id="${wish.id}">編集</button>
        <button class="danger-btn" type="button" data-action="delete" data-id="${wish.id}">削除</button>
      </div>
    `;
    return item;
  }

  function renderWishes(wishes) {
    const filtered = filterWishes(wishes);
    const wantItems = filtered.filter(wish => (wish.status || "want") !== "done");
    const doneItems = filtered.filter(wish => (wish.status || "want") === "done");
    list.innerHTML = "";

    list.appendChild(createSectionTitle("これからやりたい"));
    if (wantItems.length === 0) {
      list.insertAdjacentHTML("beforeend", '<p class="hint">これからやりたいWishはまだありません。</p>');
    } else {
      wantItems.forEach(wish => list.appendChild(createWishCard(wish)));
    }

    list.appendChild(createSectionTitle("達成済み"));
    if (doneItems.length === 0) {
      list.insertAdjacentHTML("beforeend", '<p class="hint">達成済みWishはまだありません。</p>');
    } else {
      doneItems.forEach(wish => list.appendChild(createWishCard(wish)));
    }
  }

  function resizeImageFile(file, maxWidth = 1200) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("写真を読み込めませんでした。"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("写真を読み込めませんでした。"));
      reader.readAsDataURL(file);
    });
  }

  async function refresh() {
    const wishes = await window.DiaryWishDB.getAllWishes();
    renderWishes(wishes);
  }

  function openCompletionPanel(wish) {
    completionWishIdInput.value = wish.id;
    completionTargetTitle.textContent = `${wish.title} の達成記録`;
    completionDateInput.value = wish.completed_at || todayString();
    completionNotePanelInput.value = wish.completion_note || "";
    panelPhotoData = wish.completion_photo || "";
    showPhotoPreview(panelPhotoData, completionPanelPhotoPreview);
    completionPanel.classList.remove("hidden");
    completionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeCompletionPanel() {
    completionPanel.classList.add("hidden");
    completionForm.reset();
    panelPhotoData = "";
    showPhotoPreview("", completionPanelPhotoPreview);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const wish = collectForm();

    if (!wish.title) {
      showMessage("タイトルを入力してください。");
      return;
    }

    window.DiaryWishDB.saveWish(wish)
      .then(() => {
        showMessage(idInput.value ? "Wishを更新しました。" : "Wishを保存しました。");
        resetForm();
        return refresh();
      })
      .catch(error => showMessage(`保存に失敗しました: ${error.message}`));
  });

  completionForm.addEventListener("submit", event => {
    event.preventDefault();
    const id = Number(completionWishIdInput.value);
    window.DiaryWishDB.getWish(id)
      .then(wish => {
        if (!wish) throw new Error("Wishが見つかりませんでした。");
        return window.DiaryWishDB.saveWish({
          id: wish.id,
          category: normalizeCategory(wish.category),
          title: wish.title,
          memo: wish.memo || "",
          wish_photo: wish.wish_photo || "",
          status: "done",
          completed_at: completionDateInput.value || todayString(),
          completion_photo: panelPhotoData,
          completion_note: completionNotePanelInput.value.trim()
        });
      })
      .then(() => {
        showMessage("達成済みに移動しました。");
        closeCompletionPanel();
        return refresh();
      })
      .catch(error => showMessage(`達成保存に失敗しました: ${error.message}`));
  });

  completionPhotoInput.addEventListener("change", event => {
    resizeImageFile(event.target.files[0])
      .then(imageData => {
        formPhotoData = imageData || formPhotoData;
        showPhotoPreview(formPhotoData, completionPhotoPreview);
      })
      .catch(error => showMessage(error.message));
  });

  wishPhotoInput.addEventListener("change", event => {
    resizeImageFile(event.target.files[0])
      .then(imageData => {
        wishPhotoData = imageData || wishPhotoData;
        showWishPhoto(wishPhotoData);
      })
      .catch(error => showMessage(error.message));
  });

  completionPhotoPicker.addEventListener("change", event => {
    resizeImageFile(event.target.files[0])
      .then(imageData => {
        panelPhotoData = imageData || panelPhotoData;
        showPhotoPreview(panelPhotoData, completionPanelPhotoPreview);
      })
      .catch(error => showMessage(error.message));
  });

  removeWishCompletionPhotoButton.addEventListener("click", () => {
    formPhotoData = "";
    completionPhotoInput.value = "";
    showPhotoPreview("", completionPhotoPreview);
    showMessage("写真を削除しました。保存すると反映されます。");
  });

  removeWishPhotoButton.addEventListener("click", () => {
    showWishPhoto("");
    wishPhotoInput.value = "";
    showMessage("Wish写真を削除しました。保存すると反映されます。");
  });

  removeCompletionPhotoButton.addEventListener("click", () => {
    panelPhotoData = "";
    completionPhotoPicker.value = "";
    showPhotoPreview("", completionPanelPhotoPreview);
    showMessage("写真を削除しました。達成保存すると反映されます。");
  });

  statusInput.addEventListener("change", toggleCompletionFields);
  resetButton.addEventListener("click", resetForm);
  filterInput.addEventListener("change", refresh);
  cancelCompletionButton.addEventListener("click", closeCompletionPanel);

  list.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
      window.DiaryWishDB.getWish(id)
        .then(fillForm)
        .catch(error => showMessage(`読み込みに失敗しました: ${error.message}`));
      return;
    }

    if (action === "complete") {
      window.DiaryWishDB.getWish(id)
        .then(openCompletionPanel)
        .catch(error => showMessage(`読み込みに失敗しました: ${error.message}`));
      return;
    }

    if (action === "reopen" && confirm("このWishを未達成に戻しますか？")) {
      window.DiaryWishDB.getWish(id)
        .then(wish => window.DiaryWishDB.saveWish({
          id: wish.id,
          category: normalizeCategory(wish.category),
          title: wish.title,
          memo: wish.memo || "",
          wish_photo: wish.wish_photo || "",
          status: "want",
          completed_at: "",
          completion_photo: "",
          completion_note: ""
        }))
        .then(() => {
          showMessage("未達成に戻しました。");
          return refresh();
        })
        .catch(error => showMessage(`更新に失敗しました: ${error.message}`));
      return;
    }

    if (action === "delete" && confirm("このWishを削除しますか？")) {
      window.DiaryWishDB.deleteWish(id)
        .then(() => {
          showMessage("削除しました。");
          return refresh();
        })
        .catch(error => showMessage(`削除に失敗しました: ${error.message}`));
    }
  });

  resetForm();
  refresh().catch(error => showMessage(`Wish一覧の読み込みに失敗しました: ${error.message}`));
})();
