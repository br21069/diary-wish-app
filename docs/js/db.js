(function () {
  const DB_NAME = "diary-wish-pwa";
  const DB_VERSION = 4;
  const DIARY_STORE = "diaries";
  const WISH_STORE = "wishes";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(DIARY_STORE)) {
          const diaryStore = db.createObjectStore(DIARY_STORE, { keyPath: "date" });
          diaryStore.createIndex("updated_at", "updated_at");
        }

        if (!db.objectStoreNames.contains(WISH_STORE)) {
          const wishStore = db.createObjectStore(WISH_STORE, {
            keyPath: "id",
            autoIncrement: true
          });
          wishStore.createIndex("category", "category");
          wishStore.createIndex("status", "status");
          wishStore.createIndex("updated_at", "updated_at");
        }

        // Versions 2-4 add optional fields to existing diary and wish records.
        // IndexedDB records can grow without recreating object stores, so no
        // destructive migration is needed here.
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function withStore(storeName, mode, callback) {
    return openDatabase().then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        let callbackResult;

        transaction.oncomplete = () => {
          db.close();
          resolve(callbackResult);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };

        callbackResult = callback(store);
      });
    });
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  async function getDiary(date) {
    return withStore(DIARY_STORE, "readonly", store => requestToPromise(store.get(date)));
  }

  async function saveDiary(diary) {
    const existing = await getDiary(diary.date);
    const timestamp = nowIso();
    const hasAttachedPhoto = hasOwn(diary, "attached_photo");
    const attachedPhoto = hasAttachedPhoto ? diary.attached_photo || "" : existing?.attached_photo || "";
    const record = {
      date: diary.date,
      title: diary.title || "",
      body: diary.body || "",
      mood: diary.mood || "",
      tags: diary.tags || "",
      handwriting_image: diary.handwriting_image || existing?.handwriting_image || "",
      attached_photo: attachedPhoto,
      attached_photo_created_at:
        hasAttachedPhoto && attachedPhoto && attachedPhoto !== existing?.attached_photo
          ? timestamp
          : existing?.attached_photo_created_at || "",
      diary_image: diary.diary_image || existing?.diary_image || "",
      diary_image_created_at: diary.diary_image_created_at || existing?.diary_image_created_at || "",
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp
    };

    await withStore(DIARY_STORE, "readwrite", store => store.put(record));
    return record;
  }

  async function saveDiaryImage(date, imageData) {
    const existing = await getDiary(date);
    const timestamp = nowIso();
    const record = {
      date,
      title: existing?.title || "",
      body: existing?.body || "",
      mood: existing?.mood || "",
      tags: existing?.tags || "",
      handwriting_image: imageData || "",
      attached_photo: existing?.attached_photo || "",
      attached_photo_created_at: existing?.attached_photo_created_at || "",
      diary_image: existing?.diary_image || "",
      diary_image_created_at: existing?.diary_image_created_at || "",
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp
    };

    await withStore(DIARY_STORE, "readwrite", store => store.put(record));
    return record;
  }

  async function saveDiaryCardImage(date, imageData) {
    const existing = await getDiary(date);
    const timestamp = nowIso();
    const record = {
      date,
      title: existing?.title || "",
      body: existing?.body || "",
      mood: existing?.mood || "",
      tags: existing?.tags || "",
      handwriting_image: existing?.handwriting_image || "",
      attached_photo: existing?.attached_photo || "",
      attached_photo_created_at: existing?.attached_photo_created_at || "",
      diary_image: imageData || "",
      diary_image_created_at: imageData ? timestamp : "",
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp
    };

    await withStore(DIARY_STORE, "readwrite", store => store.put(record));
    return record;
  }

  async function getAllDiaries() {
    const diaries = await withStore(DIARY_STORE, "readonly", store => requestToPromise(store.getAll()));
    return diaries.sort((a, b) => b.date.localeCompare(a.date));
  }

  async function getAllWishes() {
    const wishes = await withStore(WISH_STORE, "readonly", store => requestToPromise(store.getAll()));
    return wishes.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  }

  async function saveWish(wish) {
    const timestamp = nowIso();
    const isEdit = wish.id !== undefined && wish.id !== null && wish.id !== "";
    const existing = isEdit ? await getWish(Number(wish.id)) : null;
    const status = wish.status || existing?.status || "want";
    const completedAt = hasOwn(wish, "completed_at")
      ? wish.completed_at || ""
      : existing?.completed_at || existing?.date_done || "";
    const completionPhoto = hasOwn(wish, "completion_photo")
      ? wish.completion_photo || ""
      : existing?.completion_photo || "";
    const completionNote = hasOwn(wish, "completion_note")
      ? wish.completion_note || ""
      : existing?.completion_note || "";
    const record = {
      category: hasOwn(wish, "category") ? wish.category || "work" : existing?.category || "work",
      title: hasOwn(wish, "title") ? wish.title || "" : existing?.title || "",
      memo: hasOwn(wish, "memo") ? wish.memo || "" : existing?.memo || "",
      status,
      completed_at: status === "done" ? completedAt : "",
      completion_photo: status === "done" ? completionPhoto : "",
      completion_note: status === "done" ? completionNote : "",
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp
    };

    if (isEdit) {
      record.id = Number(wish.id);
    }

    await withStore(WISH_STORE, "readwrite", store => store.put(record));
    return record;
  }

  async function getWish(id) {
    return withStore(WISH_STORE, "readonly", store => requestToPromise(store.get(Number(id))));
  }

  async function deleteWish(id) {
    return withStore(WISH_STORE, "readwrite", store => store.delete(Number(id)));
  }

  window.DiaryWishDB = {
    getDiary,
    saveDiary,
    saveDiaryImage,
    saveDiaryCardImage,
    getAllDiaries,
    getAllWishes,
    saveWish,
    getWish,
    deleteWish
  };
})();
