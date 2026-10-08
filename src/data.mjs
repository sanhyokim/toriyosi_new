// サイト全体のコンテンツ。旧サイト（toriyoshi.love, WordPress）から移行した事実のみを載せる。
// 旧サイトに記載がない情報（営業時間・価格・アレルゲン等）は null にしてあり、
// ページ側では「店舗にお問い合わせください」と表示する。判明したらここを埋めるだけで全ページと構造化データに反映される。

export const site = {
  name: '鶏好',
  nameKana: 'とりよし',
  nameEn: 'Toriyoshi',
  category: 'からあげ専門店',
  url: 'https://toriyoshi.love',
  lang: 'ja',
  locale: 'ja_JP',
  description:
    '福岡のからあげテイクアウト専門店「鶏好（とりよし）」。特製の漬けダレで長時間熟成させた骨なしもも肉のからあげを、7種類の味で。電話予約・宅配にも対応。福岡市東区・福津市に4店舗。',
  tagline: '幸福 × 笑顔 × 愛 = 鶏好のからあげ',
  taglineWords: ['幸福', '笑顔', '愛'],
  since: 2020,
  ogImage: '/assets/img/og.png',
  themeColor: '#F2A900',
  emails: {
    general: 'info@toriyoshi.love',
    recruit: 'info@toriyoshi.love',
    company: 'info@free-idea.jp',
  },
  social: [],
};

export const company = {
  name: '株式会社 free idea.',
  nameKana: 'フリーアイデア',
  postalCode: '812-0023',
  region: '福岡県',
  locality: '福岡市博多区',
  street: '奈良屋町1-1 ヤシマ博多ビル5F',
  fax: '092-571-1047',
  email: 'info@free-idea.jp',
  business: [
    '飲食店フランチャイズ',
    '代理店事業',
    'お持ち帰り専門 からあげ鶏好',
    '博多名物からあげ八ちゃん',
    'からあげ鶏好 Uber Eats（現在福岡市のみ）',
  ],
};

// 地図座標は旧サイトの Google マップ埋め込みに含まれる中心座標。
export const shops = [
  {
    slug: 'miwadai',
    name: '美和台本店',
    short: '美和台',
    flagship: true,
    postalCode: '811-0212',
    region: '福岡県',
    locality: '福岡市東区',
    street: '美和台3丁目4-7',
    tel: '092-607-5803',
    geo: { lat: 33.7020615, lng: 130.421479 },
    hours: null,
    closed: null,
    delivery: [],
    photo: 'shop-miwadai.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/4ce62eed8967055a3102964b62ce54aa.jpg',
  },
  {
    slug: 'yoshizuka',
    name: '吉塚店',
    short: '吉塚',
    postalCode: '812-0054',
    region: '福岡県',
    locality: '福岡市東区',
    street: '馬出2丁目2-2',
    tel: '092-641-1044',
    geo: { lat: 33.6091584, lng: 130.418864 },
    hours: null,
    closed: null,
    note: '2025年12月に移転しました。新しい住所は上記のとおりです。',
    delivery: [
      { name: 'Uber Eats', url: 'https://www.ubereats.com/jp/fukuoka/food-delivery/%E3%81%8B%E3%82%89%E3%81%82%E3%81%91%E9%B7%84%E5%A5%BD-fried-chicken-toriyoshi/mJOuT7OLQYmHB9-5517nCg' },
      { name: 'Wolt', url: 'https://wolt.com/ja/jpn/fukuoka/restaurant/karaage-toriyoshi-yoshizuka' },
      { name: '出前館', url: 'https://demae-can.com/shop/menu/3094573' },
    ],
    photo: 'shop-yoshizuka.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2026/10/yoshizuka-shop-2026.jpg',
  },
  {
    slug: 'maimatsubara',
    name: '舞松原店',
    short: '舞松原',
    postalCode: '813-0042',
    region: '福岡県',
    locality: '福岡市東区',
    street: '舞松原2丁目6-14',
    tel: '092-681-6689',
    geo: { lat: 33.6425052, lng: 130.4446911 },
    hours: null,
    closed: null,
    delivery: [],
    photo: 'shop-maimatsubara.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/8cc2d3943d390f1f30b67d3f464886b1.jpg',
  },
  {
    slug: 'fukutsu',
    name: '福津店',
    short: '福津',
    postalCode: '811-3218',
    region: '福岡県',
    locality: '福津市',
    street: '手光南1丁目6-10 山田ビル1階',
    tel: '0940-42-1034',
    geo: { lat: 33.7693287, lng: 130.4869102 },
    hours: null,
    closed: null,
    delivery: [{ name: 'Uber Eats', url: 'https://ubereats.app.link/AsmQn87Cqtb' }],
    photo: 'shop-fukutsu.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/1530f2f07792d7b3c16e4c89b5c86566.jpg',
  },
];

export const addressOf = (s) => `〒${s.postalCode} ${s.region}${s.locality}${s.street}`;
export const telHref = (tel) => `tel:${tel.replace(/[^0-9+]/g, '')}`;
export const telIntl = (tel) => `+81-${tel.replace(/^0/, '')}`;
export const mapUrl = (s) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`からあげ鶏好 ${s.name} ${s.region}${s.locality}${s.street}`)}`;

// 骨なしもも肉の7つの味。glaze は karaage.js の描画パラメータ。
export const flavors = [
  {
    id: 'tare',
    name: 'たれ',
    kana: 'たれ',
    badge: '一番人気',
    copy: '特製の漬けダレがじっくり染みた、鶏好の看板の味。まずはここから。',
    glaze: 'tare',
    photo: 'momo-tare.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/508f8d8807dcc1cca093d4f75398f49c.jpeg',
  },
  {
    id: 'tare-pepper',
    name: 'たれコショー',
    kana: 'たれこしょー',
    copy: 'たれの甘みに、コショーの香りをきりっと重ねて。',
    glaze: 'pepper',
  },
  {
    id: 'tare-ichimi',
    name: 'たれ一味',
    kana: 'たれいちみ',
    copy: 'たれに一味唐辛子をひとふり。あとから辛さが追いかけてくる。',
    glaze: 'ichimi',
  },
  {
    id: 'tare-garlic',
    name: 'たれにんにく',
    kana: 'たれにんにく',
    copy: '甘めのたれとにんにくの組み合わせ。ごはんが止まらない味。',
    glaze: 'garlic',
    photo: 'momo-tare-garlic.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/56e4492280c81dd5fb66e2834c5a6411.jpeg',
  },
  {
    id: 'kara-garlic',
    name: '韓辛にんにく',
    kana: 'からにんにく',
    copy: '韓国唐辛子とにんにくで仕上げた、真っ赤な一皿。',
    glaze: 'kankara',
    photo: 'momo-kankara.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/bf5e9810ca0bb2180d738c535094b0d9.jpeg',
  },
  {
    id: 'shio',
    name: '塩',
    kana: 'しお',
    copy: '特製の漬けダレに漬け込んだもも肉を、素直に揚げて。オリジナルの塩を添えるとさらにおいしい。',
    glaze: 'shio',
    photo: 'momo-shio.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/cf4e58b0c0353aef5a0a66721df55b2b.jpeg',
  },
  {
    id: 'ponzu',
    name: 'ポン酢',
    kana: 'ぽんず',
    copy: 'オリジナルのポン酢でさっぱりと。そのままでおいしく食べられます。',
    glaze: 'ponzu',
    photo: 'momo-ponzu.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/75bb79c5d93592fb734b7eac5dbca5f0.jpeg',
  },
];

// メニュー。価格は旧サイトに記載がないため null。
export const menu = [
  {
    id: 'momo',
    section: 'からあげ',
    name: '骨なしもも肉',
    spec: '6〜7個（250g以上）',
    desc: '特製の漬けダレで長時間熟成させた、鶏好の自慢のからあげ。上の7種類の味から選べます。',
    options: flavors.map((f) => f.name),
    price: null,
    glaze: 'tare',
  },
  {
    id: 'mune',
    section: 'からあげ',
    name: 'むね肉',
    desc: 'やわらかくて食べごたえのある、むね肉のからあげ。',
    price: null,
    glaze: 'mune',
    photo: 'mune.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/dd84f452bb1c7555621739c163d07cf2.jpeg',
  },
  {
    id: 'tebasaki',
    section: 'からあげ',
    name: '手羽先',
    desc: '塩と名古屋風の2種類。',
    options: ['塩', '名古屋風'],
    price: null,
    glaze: 'tebasaki',
    photo: 'tebasaki-shio.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/617e212759e18d88dba1a0d21a37629f.jpeg',
  },
  {
    id: 'nankotsu',
    section: 'からあげ',
    name: '身付き軟骨',
    desc: '身が付いたままの軟骨。コリッとした歯ざわりとうま味を両方楽しめます。',
    price: null,
    glaze: 'nankotsu',
    photo: 'nankotsu.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/a137efb24c8b1d30d87241c86afa2443.jpeg',
  },
  {
    id: 'kushi',
    section: '串・手羽先',
    name: '串・手羽先など',
    spec: '各1本から',
    desc: 'もう一品ほしいときに。',
    options: ['砂ずり', '素揚げ砂ずり', 'ぼんじり', 'はつ', '手羽先'],
    price: null,
    glaze: 'kushi',
  },
  {
    id: 'bento',
    section: 'お弁当',
    name: 'からあげ弁当',
    spec: '小盛（からあげ4個）／大盛／特盛',
    desc: 'もも・むね・手羽先から1つ、さらに味を選べるお弁当。お一人様のお昼にも。',
    options: ['小盛', '大盛', '特盛'],
    price: null,
    glaze: 'tare',
  },
  {
    id: 'moriawase-3',
    section: '盛り合わせ（要予約）',
    name: 'からあげ盛り合わせ 3人前',
    spec: 'もも2種14個・むね1人前・手羽先3本・串3本',
    desc: '家族の夕食やちょっとした集まりに。',
    price: null,
    reservation: true,
    glaze: 'tare',
    photo: 'moriawase.jpg',
    legacyPhoto: 'https://toriyoshi.love/wp-content/uploads/2020/10/27e88bbd088f29e625b1d46117849249.jpeg',
  },
  {
    id: 'moriawase-5',
    section: '盛り合わせ（要予約）',
    name: 'からあげ盛り合わせ 5人前',
    spec: 'もも2種18個・むね1人前・手羽先5本・串2種5本',
    desc: '大人数のパーティーやイベントに。',
    price: null,
    reservation: true,
    glaze: 'tare',
  },
];

export const menuNotes = [
  '単品は乾物袋（紙袋）でのお渡しになります。',
  '盛り合わせはご予約制です。店頭でもご注文いただけますが、お時間をいただきます。',
  'オリジナルの塩は別売りです。',
  '価格・在庫は店舗により異なる場合があります。各店舗へお電話でご確認ください。',
];

// 旧サイトのお知らせ。slug は旧URLをそのまま維持（検索評価を引き継ぐため）。
export const news = [
  {
    slug: '鶏好-吉塚店-移転のお知らせ',
    date: '2025-12-19',
    title: '鶏好 吉塚店 移転のお知らせ',
    body: [
      'いつも鶏好をご利用いただき、ありがとうございます。',
      '吉塚店は下記の住所へ移転いたしました。より過ごしやすいお店で、これまでと変わらない味とサービスをお届けします。',
      '新住所：〒812-0054 福岡県福岡市東区馬出2丁目2-2（電話 092-641-1044）',
      '営業時間・定休日に変更がある場合は、あらためてお知らせいたします。ご不便をおかけしますが、今後とも鶏好をよろしくお願いいたします。',
    ],
  },
  {
    slug: '鶏好-高宮駅前店-閉店のお知らせ',
    date: '2023-01-20',
    title: '鶏好 高宮駅前店 閉店のお知らせ',
    body: ['鶏好 高宮駅前店は閉店いたしました。これまでのご愛顧に心より感謝申し上げます。', 'お近くの店舗は店舗一覧からお探しください。'],
  },
  {
    slug: 'open-takamiya',
    date: '2020-10-16',
    title: '鶏好 高宮駅前店 NewOpenしました！',
    body: ['鶏好 高宮駅前店がオープンしました。', '※高宮駅前店は2023年1月に閉店しています。'],
  },
  {
    slug: 'open-iziri',
    date: '2020-10-16',
    title: '鶏好 井尻駅前店 NewOpenしました！',
    body: ['鶏好 井尻駅前店がオープンしました。', '※現在の営業店舗は店舗一覧をご確認ください。'],
  },
];

export const steps = [
  {
    n: '01',
    title: '漬け込む',
    en: 'Marinate',
    text: '骨なしのもも肉を、特製の漬けダレにじっくり。長い時間をかけて熟成させることで、肉の芯まで味が入ります。',
  },
  {
    n: '02',
    title: '揚げる',
    en: 'Fry',
    text: '油にこだわり、ご注文ごとに揚げたてを。外はカリッと、中はじゅわっと。袋を開けた瞬間の香りまで楽しんでください。',
  },
  {
    n: '03',
    title: '添える',
    en: 'Season',
    text: 'そのままでもおいしいからあげに、オリジナルの塩やポン酢を添えて。一袋で何通りもの味わいに出会えます。',
  },
];

export const faqs = [
  {
    q: '鶏好のからあげは何種類の味がありますか？',
    a: '看板の骨なしもも肉は、たれ・たれコショー・たれ一味・たれにんにく・韓辛にんにく・塩・ポン酢の7種類から選べます。ほかに、むね肉、手羽先（塩・名古屋風）、身付き軟骨、串もあります。',
  },
  {
    q: '電話で予約できますか？',
    a: 'はい。各店舗へのお電話でご予約いただけます。受け取りの時間に合わせて揚げたてをご用意します。盛り合わせ（3人前・5人前）はご予約制です。',
  },
  {
    q: '宅配（デリバリー）はできますか？',
    a: '吉塚店は Uber Eats・Wolt・出前館、福津店は Uber Eats で宅配に対応しています。美和台本店と舞松原店はテイクアウト（店頭・電話予約）のみです。',
  },
  {
    q: 'どこにお店がありますか？',
    a: '福岡市東区の美和台本店・吉塚店・舞松原店と、福津市の福津店の4店舗です。',
  },
  {
    q: '大人数の集まりにも対応できますか？',
    a: '3人前と5人前のからあげ盛り合わせをご用意しています。ご予約制なので、事前にお電話ください。',
  },
  {
    q: '店内で食べられますか？',
    a: '鶏好はお持ち帰り専門のからあげ店です。',
  },
];

export const recruit = {
  title: '正社員（店舗スタッフ・店長候補）',
  description:
    '最初は調理とカウンター業務からスタート。店長、本部マネージャーへとキャリアアップできます。学歴・性別・経験は問いません。',
  eligibility: '35歳以下（長期勤続によるキャリア形成のため）',
  location: '自宅近くの店舗（希望を考慮して決定）',
  salary: { min: 220000, max: 300000, text: '月給22万〜30万円（経験・能力・前職を考慮して決定）' },
  hours: '9:00〜22:00 の間でシフト制（実働8時間）',
  holidays: '月6日以上（相談のうえ決定）、有給休暇、慶弔休暇、年末年始休暇',
  benefits: ['髪型自由', '交通費支給', '社会保険完備', '業績賞与・昇給あり', '結婚・出産などのお祝い金', 'まかないあり'],
  probation: '試用期間3か月',
  apply: '履歴書と職務経歴書（PDF または Word）を下記メールアドレスへお送りください。',
  datePosted: '2026-10-08',
};

export const franchiseSteps = [
  ['お問い合わせ', 'メールまたはお電話でお問い合わせください。'],
  ['店舗見学', '実際の店舗で個別にご説明し、試食していただきます。'],
  ['加盟申込み', '本部から法定開示書面をお渡ししたあと、加盟申込書をご提出いただき、申込金50万円（税別）をお預かりします。申込金は契約時に加盟金へ充当し、審査の結果契約に至らない場合は全額返金します。'],
  ['面談', '役員との面談で、パートナーシップを確認します。'],
  ['立地開発', 'ご提案いただいた物件を、本部の開発担当が調査したうえで決定します。'],
  ['FC加盟契約', '物件の契約完了後に、加盟契約を締結します。'],
  ['研修・店舗工事', '調理オペレーション、接客、QSC・ホスピタリティの研修を行います。'],
  ['オープン準備', 'オープンスタッフが立ち上げを支援。アルバイト・パートの採用もお手伝いします。'],
  ['オープン', 'いよいよ開業。直営店で培ったノウハウで、開業後も継続してサポートします。'],
];
