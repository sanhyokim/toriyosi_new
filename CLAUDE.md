# CLAUDE.md — 鶏好（toriyoshi.love）公式サイト

このリポジトリで作業する AI エージェント向けの要点です。経緯・決定事項・本番サーバーの状態の詳細は **[docs/HANDOFF.md](docs/HANDOFF.md)** にあります。作業を始める前に必ず読んでください。

## これは何か

- 福岡のからあげテイクアウト専門店「鶏好（とりよし）」（運営: 株式会社 free idea.）の公式サイト https://toriyoshi.love/
- 2026-10-11 に WordPress から、このリポジトリの**依存なしの静的サイト**に置き換えて本番公開済み
- オーナー（GitHub: `sanhyokim`、プロジェクト上の表示名 Boss）は非エンジニア。日本語でやり取りし、サーバーや管理画面の操作を頼むときは**画面に出る名前を使ったクリック単位の手順**で説明すること

## 編集・ビルド・確認

Node 20 以上。npm パッケージのインストールは不要です。

```bash
npm run check             # ビルド（dist/）＋品質チェック。変更したら必ず実行し errors: 0 を確認
node build.mjs            # 本番用 → dist/（.htaccess を含む）
node build.mjs --staging  # 確認用（全ページ noindex、robots.txt で全拒否）→ dist/
node build.mjs --preview  # claude.ai Artifact プレビュー用 → preview/
npm run fonts             # 文言を変えたら実行（フォントのサブセットを作り直す。Google Fonts への通信が必要）
npm run images            # OGP 画像の再生成（Playwright が必要）
```

| どこを触るか | ファイル |
| --- | --- |
| 店舗・メニュー・お知らせ・採用・FAQ など**文言と情報** | `src/data.mjs`（ほぼすべてここ。全ページと構造化データに反映） |
| `<head>`・ヘッダー・フッター | `src/layout.mjs` |
| ページの組み立て、sitemap / robots / llms.txt の出力 | `build.mjs` |
| 見た目 | `src/assets/css/main.css`（ビルド時に各ページへインライン化） |
| 動き（トップのタップ演出、7つの味、地図切替、フォーム） | `src/assets/js/main.js` |
| 写真 | `src/assets/photos/*.webp`（長辺 800px 程度の WebP。`data.mjs` の `photo` と同名にすると自動で使われる） |
| サーバー設定 | `src/static/.htaccess`（本番ビルドだけ dist/ にコピーされる） |

## 本番への反映

本番は**さくらのレンタルサーバ**。公開フォルダは `~/www/wp`。この環境からサーバーへ直接アップロードする手段（FTP 認証情報など）は**ない**ので、オーナーがコントロールパネルのファイルマネージャーでアップロードします。

1. `npm run check` が通ることを確認
2. `node build.mjs` で本番用 `dist/` を作り、`cd dist && zip -r ../toriyoshi-dist.zip .`（`.htaccess` を含めること）
3. zip をオーナーに渡し、[docs/DEPLOY-sakura.md](docs/DEPLOY-sakura.md) の「更新のしかた」の手順で上書きしてもらう

確認用サイト（GitHub Pages、`gh-pages` ブランチ）の更新手順は docs/HANDOFF.md の「確認用サイト」を参照。

## 絶対に守ること

- `~/www/wp` の中の **`wp-content/`、`_wp_old/`、`google*.html`（Search Console の所有確認ファイル）を消さない・上書きしない**
- 同じサーバーにある**別サイト radiant-me.love とそのデータベースには触らない**
- 旧サイトの URL（`/menu/` `/shop/` `/news/…` `/recruit/` `/franchise/` `/corporation/` `/privacy-policy/` など）を変えない。変えるなら `.htaccess` に 301 を追加する
- このリポジトリは公開されています。パスワード・DB 名やユーザー名・アカウント ID などを**コミットしない**
- 未確定の情報（営業時間・価格など）を推測で埋めない。オーナーに確認する
- 店舗地図は **Google マップの埋め込み**。手描き・自作の地図はオーナーが 2 回却下済みなので作らない
- 色の基本はコーポレートカラーの臙脂 `#4C1A2C`（`--en`）。ロゴはお店支給の筆文字ロゴ（`src/assets/img/logo*`）を使う
