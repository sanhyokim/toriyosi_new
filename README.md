# からあげ専門店 鶏好 — toriyoshi.love リニューアル

福岡のからあげテイクアウト専門店「鶏好（とりよし）」の公式サイトを、WordPress から依存なしの静的サイトへ作り直したものです。2026-10-11 から https://toriyoshi.love/ で公開中です。

- 経緯・決定事項・本番サーバーの状態・未確定事項: [docs/HANDOFF.md](docs/HANDOFF.md)
- 本番サーバー（さくらのレンタルサーバ）の更新・巻き戻し手順: [docs/DEPLOY-sakura.md](docs/DEPLOY-sakura.md)
- AI エージェント向けの要点: [CLAUDE.md](CLAUDE.md)

## 使い方

```bash
npm run build      # dist/ に本番用サイトを出力
npm run check      # ビルド＋品質チェック（h1・title・description・canonical・JSON-LD・リンク切れ・alt）
npm run serve      # ビルドしてローカルで確認
npm run fonts      # 文言を変えたあとに実行（フォントのサブセットを作り直す）
npm run images     # OGP画像・アイコンを再生成（Playwright が必要）
```

`dist/` の中身を本番サーバー（Apache）の公開フォルダに置けば公開できます。手順は [docs/DEPLOY-sakura.md](docs/DEPLOY-sakura.md) を参照してください。`.htaccess`（HTTPS統一・圧縮・キャッシュ・旧URLのリダイレクト）も `dist/` に含まれます。

## 構成

| パス | 内容 |
| --- | --- |
| `src/data.mjs` | **コンテンツはすべてここ**。店舗・メニュー・お知らせ・採用・FC。営業時間や価格が決まったらここを埋めるだけで、全ページと構造化データに反映されます |
| `src/layout.mjs` | `<head>`（メタ・OGP・JSON-LD）、ヘッダー、フッター |
| `build.mjs` | ページ生成、`sitemap.xml`・`robots.txt`・`llms.txt`・`llms-full.txt`・`manifest.webmanifest` の出力 |
| `src/assets/js/karaage.js` | からあげの手続き生成レンダラー（高さマップ＋ライティング）。Web Worker で計算 |
| `src/assets/js/main.js` | ヒーローの演出、フレーバーラボ、メニュー描画、地図連動、フォーム |
| `src/assets/css/main.css` | デザイントークンとスタイル（ビルド時に各ページへインライン化） |
| `scripts/` | 品質チェック、フォントのサブセット化、OGP画像生成、旧サイト写真の取得 |

## SEO / AI SEO

- 旧サイトの URL（`/menu/` `/shop/` `/news/…` `/recruit/` `/franchise/` `/corporation/` `/privacy-policy/` など）を**そのまま維持**し、検索評価を引き継ぎます。店舗ごとの詳細ページ `/shop/{slug}/` を新設
- 構造化データ（JSON-LD）: `Organization` / `WebSite` / 店舗ごとの `Restaurant`（住所・緯度経度・電話・予約・宅配の `OrderAction`）/ `Menu` / `FAQPage` / `NewsArticle` / `JobPosting` / `HowTo` / `BreadcrumbList`
- `llms.txt`・`llms-full.txt`（AI アシスタント向けの要約と全文）、AI クローラーを許可した `robots.txt`、`sitemap.xml`
- セマンティック HTML（1ページ1つの h1、ランドマーク、パンくず）、canonical、OGP、theme-color
- Lighthouse（ローカル・gzip 配信）: モバイル Performance 95 / Accessibility 100 / Best Practices 100 / SEO 100

## 写真について

メニュー・店舗・トップの写真は `src/assets/photos/` に WebP で同梱しています（旧サイトから取り込んだもの＋お店支給のからあげ弁当）。`src/data.mjs` の `photo` と同じ名前のファイルがあれば写真、無ければ `karaage.js` の描画が使われます。「もも、7つの味」は写真を使わない演出です。

## 未確定の情報（要確認）

旧サイトに記載がなかったため、ページ上では「店舗へお電話でご確認ください」と表示しています。

- 各店舗の営業時間・定休日（`shops[].hours` / `closed`）
- 価格（`menu[].price`）
- アレルギー表示の内容（旧サイトでは動画のみ）
- お問い合わせフォームの送信先（`contact` ページの `data-endpoint`。未設定の場合はメールアプリで下書きを開きます）
- 採用の応募先（旧サイトの郵送先が閉店済みの井尻駅前店だったため、メールのみ掲載）

最新の状況は [docs/HANDOFF.md](docs/HANDOFF.md) の「未確定・オーナー確認待ち」を見てください。
