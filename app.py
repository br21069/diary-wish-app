from __future__ import annotations

import base64
import os
import sqlite3
import uuid
from datetime import date, datetime
from pathlib import Path

from flask import Flask, g, jsonify, redirect, render_template, request, send_from_directory, url_for

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "app.db"
UPLOAD_DIR = BASE_DIR / "static" / "uploads" / "handwriting"

app = Flask(__name__)
app.config["SECRET_KEY"] = "change-this-secret-key-for-production"
app.config["UPLOAD_DIR"] = UPLOAD_DIR

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception: Exception | None = None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def now_text() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def init_db() -> None:
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS diaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            title TEXT,
            body TEXT,
            mood TEXT,
            tags TEXT,
            handwriting_image_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS wishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            memo TEXT,
            status TEXT NOT NULL DEFAULT 'want',
            date_done TEXT,
            rating INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    db.commit()


@app.before_request
def ensure_db() -> None:
    init_db()


def get_diary_by_date(diary_date: str) -> sqlite3.Row | None:
    db = get_db()
    return db.execute("SELECT * FROM diaries WHERE date = ?", (diary_date,)).fetchone()


def upsert_diary(diary_date: str, title: str, body: str, mood: str, tags: str) -> None:
    db = get_db()
    existing = get_diary_by_date(diary_date)
    current_time = now_text()
    if existing:
        db.execute(
            """
            UPDATE diaries
            SET title = ?, body = ?, mood = ?, tags = ?, updated_at = ?
            WHERE date = ?
            """,
            (title, body, mood, tags, current_time, diary_date),
        )
    else:
        db.execute(
            """
            INSERT INTO diaries (date, title, body, mood, tags, handwriting_image_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
            """,
            (diary_date, title, body, mood, tags, current_time, current_time),
        )
    db.commit()


@app.route("/")
def home():
    return redirect(url_for("today"))


@app.route("/today")
def today():
    today = date.today().isoformat()
    return redirect(url_for("edit_diary", diary_date=today))


@app.route("/calendar")
def calendar_page():
    db = get_db()
    diary_rows = db.execute("SELECT date, title, mood FROM diaries ORDER BY date DESC").fetchall()
    diary_dates = [dict(row) for row in diary_rows]
    return render_template("calendar.html", diary_dates=diary_dates)


@app.route("/diary/<diary_date>", methods=["GET", "POST"])
def edit_diary(diary_date: str):
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        body = request.form.get("body", "").strip()
        mood = request.form.get("mood", "").strip()
        tags = request.form.get("tags", "").strip()
        upsert_diary(diary_date, title, body, mood, tags)
        return redirect(url_for("edit_diary", diary_date=diary_date))

    diary = get_diary_by_date(diary_date)
    return render_template("diary_edit.html", diary=diary, diary_date=diary_date)


@app.route("/api/diaries")
def api_diaries():
    db = get_db()
    rows = db.execute("SELECT date, title, mood FROM diaries ORDER BY date DESC").fetchall()
    return jsonify([dict(row) for row in rows])


@app.route("/api/diary/<diary_date>/handwriting", methods=["POST"])
def save_handwriting(diary_date: str):
    data = request.get_json(silent=True) or {}
    image_data = data.get("image")
    if not image_data or not image_data.startswith("data:image/png;base64,"):
        return jsonify({"ok": False, "error": "PNG画像データがありません。"}), 400

    base64_data = image_data.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(base64_data)
    except Exception:
        return jsonify({"ok": False, "error": "画像データの読み込みに失敗しました。"}), 400

    filename = f"{diary_date}_{uuid.uuid4().hex}.png"
    save_path = app.config["UPLOAD_DIR"] / filename
    save_path.write_bytes(image_bytes)
    relative_path = f"uploads/handwriting/{filename}"

    db = get_db()
    existing = get_diary_by_date(diary_date)
    current_time = now_text()
    if existing:
        db.execute(
            "UPDATE diaries SET handwriting_image_path = ?, updated_at = ? WHERE date = ?",
            (relative_path, current_time, diary_date),
        )
    else:
        db.execute(
            """
            INSERT INTO diaries (date, title, body, mood, tags, handwriting_image_path, created_at, updated_at)
            VALUES (?, '', '', '', '', ?, ?, ?)
            """,
            (diary_date, relative_path, current_time, current_time),
        )
    db.commit()
    return jsonify({"ok": True, "image_path": url_for("static", filename=relative_path)})


@app.route("/wishes")
def wishes_page():
    category = request.args.get("category", "all")
    status = request.args.get("status", "all")

    query = "SELECT * FROM wishes WHERE 1=1"
    params: list[str] = []
    if category != "all":
        query += " AND category = ?"
        params.append(category)
    if status != "all":
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"

    db = get_db()
    wishes = db.execute(query, params).fetchall()
    return render_template("wishes.html", wishes=wishes, category=category, status=status)


@app.route("/wishes/new", methods=["GET", "POST"])
def new_wish():
    if request.method == "POST":
        category = request.form.get("category", "todo")
        title = request.form.get("title", "").strip()
        memo = request.form.get("memo", "").strip()
        status = request.form.get("status", "want")
        date_done = request.form.get("date_done", "").strip() or None
        rating_raw = request.form.get("rating", "").strip()
        rating = int(rating_raw) if rating_raw.isdigit() else None
        current_time = now_text()

        if not title:
            return render_template("wish_form.html", wish=None, error="タイトルを入力してください。")

        db = get_db()
        db.execute(
            """
            INSERT INTO wishes (category, title, memo, status, date_done, rating, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (category, title, memo, status, date_done, rating, current_time, current_time),
        )
        db.commit()
        return redirect(url_for("wishes_page"))

    return render_template("wish_form.html", wish=None, error=None)


@app.route("/wishes/<int:wish_id>/edit", methods=["GET", "POST"])
def edit_wish(wish_id: int):
    db = get_db()
    wish = db.execute("SELECT * FROM wishes WHERE id = ?", (wish_id,)).fetchone()
    if wish is None:
        return redirect(url_for("wishes_page"))

    if request.method == "POST":
        category = request.form.get("category", "todo")
        title = request.form.get("title", "").strip()
        memo = request.form.get("memo", "").strip()
        status = request.form.get("status", "want")
        date_done = request.form.get("date_done", "").strip() or None
        rating_raw = request.form.get("rating", "").strip()
        rating = int(rating_raw) if rating_raw.isdigit() else None
        current_time = now_text()

        if not title:
            return render_template("wish_form.html", wish=wish, error="タイトルを入力してください。")

        db.execute(
            """
            UPDATE wishes
            SET category = ?, title = ?, memo = ?, status = ?, date_done = ?, rating = ?, updated_at = ?
            WHERE id = ?
            """,
            (category, title, memo, status, date_done, rating, current_time, wish_id),
        )
        db.commit()
        return redirect(url_for("wishes_page"))

    return render_template("wish_form.html", wish=wish, error=None)


@app.route("/wishes/<int:wish_id>/delete", methods=["POST"])
def delete_wish(wish_id: int):
    db = get_db()
    db.execute("DELETE FROM wishes WHERE id = ?", (wish_id,))
    db.commit()
    return redirect(url_for("wishes_page"))


@app.route("/manifest.json")
def manifest():
    return send_from_directory(BASE_DIR / "static", "manifest.json")


@app.route("/service-worker.js")
def service_worker():
    return send_from_directory(BASE_DIR / "static", "service-worker.js")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
