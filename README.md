# からあげ専門店 鶏好 — toriyoshi.love リニューアル

福岡のからあげテイクアウト専門店「鶏好（とりよし）」の公式サイトを、WordPress から依存なしの静的サイトへ作り直したものです。

## 使い方

```bash
npm run build      # dist/ に本番用サイトを出力
npm run check      # ビルド＋品質チェック（h1・title・description・canonical・JSON-LD・リンク切れ・alt）
npm run serve      # ビルドしてローカルで確認
npm run fonts      # 文言を変えたあとに実行（フォントのサブセットを作り直す）
npm run images     # OGP画像・アイコンを再生成（Playwright が必要）
```

`dist/` をそのまま今のサーバー（Apache）に置けば公開できます。手順は [DEPLOY.md](DEPLOY.md) を参照してください。`.htaccess`（HTTPS統一・圧縮・キャッシュ・旧URLのリダイレクト）も `dist/` に含まれます。

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

旧サイトの写真は今回の作業環境から取得できなかったため、各メニュー・店舗のビジュアルは `karaage.js` で描画しています。写真を使う場合は次のどちらかで `src/assets/photos/` に置けば、ビルド時に自動で写真に切り替わります。

```bash
node scripts/fetch-legacy-photos.mjs   # 旧サイトの写真を取得
```

ファイル名は `src/data.mjs` の `photo` を参照してください。

## 未確定の情報（要確認）

旧サイトに記載がなかったため、ページ上では「店舗へお電話でご確認ください」と表示しています。

- 各店舗の営業時間・定休日（`shops[].hours` / `closed`）
- 価格（`menu[].price`）
- アレルギー表示の内容（旧サイトでは動画のみ）
- お問い合わせフォームの送信先（`contact` ページの `data-endpoint`。未設定の場合はメールアプリで下書きを開きます）
- 採用の応募先（旧サイトの郵送先が閉店済みの井尻駅前店だったため、メールのみ掲載）
