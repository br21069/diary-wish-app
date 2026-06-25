# Diary & Wish App

Flask + SQLite + HTML/CSS/JavaScript で作る個人用の日記・Wishリスト管理アプリです。

## 機能

- 日付ごとの日記保存
- カレンダーから過去の日記を表示・編集
- タイトル、本文、気分、タグ保存
- iPad / スマホ / PCで手書きキャンバス入力
- 手書き画像をPNGで保存し、その日の日記に紐づけ
- Wishリストの追加・編集・削除
- カテゴリ、ステータス、達成日、評価の管理
- レスポンシブ対応
- 最小限のPWA設定

## セットアップ

```bash
cd diary_wish_app
python -m venv .venv
```

Windows PowerShell:

```bash
.venv\Scripts\Activate.ps1
```

macOS / Linux:

```bash
source .venv/bin/activate
```

ライブラリをインストールします。

```bash
python -m pip install -r requirements.txt
```

起動します。

```bash
python app.py
```

ブラウザで開きます。

```text
http://127.0.0.1:5000
```

同じWi-Fi内のスマホやiPadから確認したい場合は、PCのIPアドレスを使って以下のように開きます。

```text
http://PCのIPアドレス:5000
```

例:

```text
http://192.168.1.10:5000
```

## ファイル構成

```text
diary_wish_app/
├─ app.py
├─ requirements.txt
├─ README.md
├─ app.db              # 初回起動時に自動作成
├─ templates/
│  ├─ base.html
│  ├─ diary_edit.html
│  ├─ calendar.html
│  ├─ wishes.html
│  └─ wish_form.html
└─ static/
   ├─ css/
   │  └─ style.css
   ├─ js/
   │  └─ handwriting.js
   ├─ uploads/
   │  └─ handwriting/
   ├─ manifest.json
   └─ service-worker.js
```
