# 今のサーバーへの公開手順

リニューアル版は HTML・CSS・JS・画像だけの静的サイトです。今の WordPress のサーバー（Apache）に置き換える手順です。

## 0. 事前に（必須）

1. **WordPress を丸ごとバックアップ**する（サーバー管理画面のバックアップ機能、または FTP で公開フォルダ全体をダウンロード＋データベースのエクスポート）。
2. **`wp-content/uploads/` フォルダは消さずに残す**。新サイトはメニュー・店舗の写真をこのフォルダから同じURLで読み込みます（見つからない場合はイラスト表示に自動で切り替わります）。

## 1. アップロードするもの

`toriyoshi-dist.zip` を展開した中身（`index.html`、`.htaccess`、`assets/`、`menu/`、`shop/` …）を、公開フォルダ（`public_html` など、今 `wp-config.php` がある場所）の直下に置きます。
`.htaccess` は「.」から始まる隠しファイルです。FTP ソフトで隠しファイルを表示する設定にしてください。

## 2. WordPress 側のファイルを退避

公開フォルダ直下にある WordPress のファイル（`index.php`、`wp-admin/`、`wp-includes/`、`wp-*.php`、既存の `.htaccess`）を、`_wp_old/` などのフォルダにまとめて移動します。**`wp-content/` は移動しません**（写真を使うため）。
`index.php` が残っていると WordPress が表示され続けることがあります。

## 3. 確認

- https://toriyoshi.love/ と各ページ（/menu/、/shop/、/news/ など）が表示される
- 写真が表示される（表示されない商品はイラストのまま。問題はありません）
- https://toriyoshi.love/sitemap.xml と /llms.txt が開ける
- Google Search Console に `https://toriyoshi.love/sitemap.xml` を送信する

## 元に戻すとき

`_wp_old/` の中身を公開フォルダ直下に戻し、新サイトのファイルを削除すれば WordPress に戻ります。

## 更新のしかた

内容を変えるときは `src/data.mjs` を編集して `npm run build`、できた `dist/` の中身を同じように上書きアップロードします。
