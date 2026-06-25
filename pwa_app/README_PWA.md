# 日記・Wishリストアプリ PWA版

このフォルダは、Flask/Python/SQLite版とは別に作った静的PWA版です。HTML、CSS、JavaScriptだけで動くため、GitHub Pagesに置けばスマホやiPadのブラウザから開いて使えます。

## できること

- 今日の日記を書いて保存できます。
- 日付ごとに日記を保存できます。
- 手書きメモを保存できます。
- 日記本文と手書きメモから「今日の1枚」PNG画像を自動作成できます。
- Wishリストを「仕事・遊び・本」の3カテゴリで管理できます。
- Wishはまず文字だけで登録し、達成後に写真と感想を追加できます。
- スマホのホーム画面に追加して、アプリのように使えます。

## 保存される場所

- 日記データ、手書きメモ、Wishデータ、達成写真、感想、今日の1枚画像は、スマホやブラウザ内のIndexedDBに保存されます。
- GitHubには日記データやWishデータは保存されません。
- ブラウザデータを削除すると、保存したデータも消える可能性があります。
- スマホを機種変更すると、データ移行が必要です。
- 複数端末間の同期はできません。同期したい場合はFirebaseやSupabaseなどのクラウドDBが必要です。

## Wishリスト

Wishカテゴリは3つです。

- `work`: 仕事
- `play`: 遊び
- `book`: 本

Wishに保存する項目は次の通りです。

- `id`
- `category`
- `title`
- `memo`
- `status`
- `created_at`
- `updated_at`
- `completed_at`
- `completion_photo`
- `completion_note`

ステータスは2つです。

- `want`: これからやりたい
- `done`: 達成済み

## Wishリストの使い方

まずは文字だけでWishを登録します。

1. `Wish` 画面を開きます。
2. カテゴリを `仕事`、`遊び`、`本` から選びます。
3. タイトルを書きます。
4. 必要ならメモを書きます。
5. ステータスは `これから` のまま保存します。

登録したWishは `これからやりたい` 欄に表示されます。

Wishを達成したら、`達成した` ボタンを押します。達成記録フォームが開くので、次の内容を追加できます。

- 達成日
- 写真
- 感想

写真はスマホから選択できます。選んだ写真は保存前にブラウザ内のCanvasで横幅1200px程度に縮小され、IndexedDBに保存されます。達成保存後、そのWishは `達成済み` 欄に移動します。

達成済みWishには、カテゴリ、タイトル、メモ、達成日、写真、感想が表示されます。編集ボタンから内容を直すこともできます。必要なら `未達成に戻す` で `これからやりたい` に戻せます。

写真と感想もスマホのブラウザ内IndexedDBに保存されます。ブラウザデータを削除すると、写真や感想も消える可能性があります。複数端末で同期はできません。同期したい場合はFirebaseやSupabaseなどのクラウドDBが必要です。

## 今日の1枚を作る

1. `今日` 画面で日記を書きます。
2. 必要なら手書きメモを書いて `手書きを保存` を押します。
3. `今日の1枚を作る` を押します。
4. 日付、タイトル、本文、気分、タグ、手書きメモをまとめた縦長PNGカードが作られます。
5. `PNGを保存` を押すとスマホに画像として保存できます。

この機能はAI画像生成ではありません。スマホ内のHTML/CSS/Canvasだけで、日記カード画像を自動生成します。生成した画像は、その日の日記に紐づいてIndexedDBに保存されます。

## PWA版の開き方

ローカルで確認する場合は、`diary_wish_app` フォルダで次を実行します。

```powershell
.\.venv\Scripts\python.exe -m http.server 8000 --directory pwa_app
```

ブラウザで次を開きます。

```text
http://127.0.0.1:8000/
```

GitHub Pagesで公開した場合は、次のようなURLになります。

```text
https://ユーザー名.github.io/リポジトリ名/
```

## GitHub Pagesで公開する方法

初心者には `/docs` 公開がおすすめです。このリポジトリには、`pwa_app` を `docs` にコピーするスクリプトがあります。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish_pwa_to_docs.ps1
```

その後、VSCodeでGitHubにpushします。

```powershell
git add pwa_app docs scripts .gitignore
git commit -m "Update simple PWA app"
git push
```

GitHubのWeb画面でPagesを有効化します。

1. GitHubで対象リポジトリを開きます。
2. `Settings` を開きます。
3. 左メニューの `Pages` を開きます。
4. `Source` で `Deploy from a branch` を選びます。
5. `Branch` で `main` を選びます。
6. フォルダで `/docs` を選びます。
7. `Save` を押します。
8. 数十秒から数分待つと、公開URLが表示されます。

`/docs` を公開フォルダにした場合、URLの末尾に `/docs` は付きません。GitHub Pagesが `docs/index.html` をサイトのトップとして公開します。

## スマホのホーム画面に追加する方法

### iPhone / iPad Safari

1. SafariでGitHub PagesのURLを開きます。
2. 共有ボタンを押します。
3. `ホーム画面に追加` を選びます。
4. 名前を確認して `追加` を押します。

### Android Chrome

1. ChromeでGitHub PagesのURLを開きます。
2. メニューを開きます。
3. `ホーム画面に追加` または `アプリをインストール` を選びます。
4. 画面の案内に従って追加します。

## AI画像生成について

このPWAは、ChatGPTのWeb画面を勝手に操作して画像を作ることはできません。AI画像生成を本当に使う場合は、OpenAI APIなどの画像生成APIが必要です。

APIキーをPWAのJavaScriptに直接書いてはいけません。GitHub PagesだけではAPIキーを安全に隠せないため、サーバーレス関数やバックエンド側の環境変数で管理する必要があります。

将来AI画像生成を追加する場合の考え方は、次のファイルにまとめています。

```text
pwa_app/api/README_AI_IMAGE.md
```

まずはAPIなしで動くCanvasの「今日の1枚」日記カード画像化を使ってください。

## Flask版との違い

- Flask版はPCでPythonサーバーを起動し、SQLiteの `app.db` に保存します。
- PWA版はサーバーを使わず、スマホやブラウザのIndexedDBに保存します。
- PWA版はGitHub Pagesで公開できます。
- PWA版のデータは端末ごとに独立しています。
