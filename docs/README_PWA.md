# 日記・Wishリストアプリ PWA版

このフォルダは、Flask/Python/SQLite版とは別に作った静的PWA版です。HTML、CSS、JavaScriptだけで動くため、GitHub Pagesに置けばスマホやiPadのブラウザから開いて使えます。

## できること

- 日記を本文中心のシンプルな形で保存できます。
- 日記本文から「今日の1枚」PNG画像を自動作成できます。
- Wishリストを「仕事・遊び・本」の3カテゴリで管理できます。
- Wishは、これからやりたい状態でも写真を添付できます。
- Wishを達成したら、達成日、達成写真、感想を追加して達成済みに移動できます。
- スマホのホーム画面に追加して、アプリのように使えます。

## 日記について

日記は、今日あったことや考えたことを文章で残すシンプルな形です。

使わない機能:

- 手書き
- タグ
- 気分
- 日記への写真添付

日記に残している機能:

- 日付
- タイトル（任意）
- 本文
- 保存
- 今日の1枚を作る
- 作成した画像のプレビューとPNG保存

## 今日の1枚を作る

1. `今日` 画面で本文を書きます。
2. 必要ならタイトルを入力します。
3. `日記を保存` を押します。
4. `今日の1枚を作る` を押します。
5. 日付、タイトル、本文をまとめた縦長PNGカードが作られます。
6. `PNGを保存` を押すとスマホに画像として保存できます。

この機能はAI画像生成ではありません。APIキーは使わず、スマホ内のHTML/CSS/Canvasだけで日記カード画像を作ります。OpenAI APIキーなどをフロントエンドJavaScriptに直接書かないでください。

## Wishリスト

Wishカテゴリは3つです。

- `work`: 仕事
- `play`: 遊び
- `book`: 本

ステータスは2つです。

- `want`: これから
- `done`: 達成済み

Wishに保存する項目は次の通りです。

- `id`
- `category`
- `title`
- `memo`
- `status`
- `wish_photo`
- `completed_at`
- `completion_photo`
- `completion_note`
- `created_at`
- `updated_at`

## Wishの使い方

まずはWishを文字で登録します。

1. `Wish` 画面を開きます。
2. カテゴリを `仕事`、`遊び`、`本` から選びます。
3. タイトルを書きます。
4. 必要ならメモを書きます。
5. 必要なら添付写真を選びます。
6. ステータスは `これから` のまま保存します。

添付写真は、行きたい場所の写真、本の表紙、参考画像、メモ画像などに使えます。選んだ写真は保存前にブラウザ内のCanvasで横幅1200px程度に縮小され、IndexedDBに保存されます。

Wishを達成したら、`達成した` ボタンを押します。達成記録フォームが開くので、次の内容を追加できます。

- 達成日
- 達成後の写真
- 感想

保存すると、そのWishは `達成済み` 欄に移動します。達成済みWishは編集でき、達成写真の差し替え・削除、感想の編集もできます。必要なら `未達成に戻す` で `これからやりたい` 欄に戻せます。

## 保存される場所

- 日記本文、今日の1枚画像、Wishデータ、Wish写真、達成写真、感想は、スマホやブラウザ内のIndexedDBに保存されます。
- GitHubには日記本文や写真は保存されません。
- ブラウザデータを削除すると、日記、Wish、写真も消える可能性があります。
- 写真が増えるとブラウザの保存容量を使います。容量が足りなくなると保存できない場合があります。
- スマホを機種変更すると、データ移行が必要です。
- 複数端末間の同期はできません。同期したい場合はFirebaseやSupabaseなどのクラウドDBが必要です。

## PWA版の開き方

GitHub Pagesで公開した場合は、次のURLで開きます。

```text
https://br21069.github.io/diary-wish-app/
```

ローカルで確認する場合は、`diary_wish_app` フォルダで次を実行します。

```powershell
.\.venv\Scripts\python.exe -m http.server 8000 --directory pwa_app
```

ブラウザで次を開きます。

```text
http://127.0.0.1:8000/
```

## GitHub Pagesで公開する方法

`pwa_app` を変更したら、公開用の `docs` にコピーしてからpushします。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish_pwa_to_docs.ps1
git add .
git commit -m "Update PWA"
git push
```

GitHubのWeb画面では、Pagesを次のように設定します。

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`

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

## Flask版との違い

- Flask版はPCでPythonサーバーを起動し、SQLiteの `app.db` に保存します。
- PWA版はサーバーを使わず、スマホやブラウザのIndexedDBに保存します。
- PWA版はGitHub Pagesで公開できます。
- PWA版のデータは端末ごとに独立しています。
