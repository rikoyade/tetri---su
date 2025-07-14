// キャッシュのバージョン。ファイルを更新した際は、このバージョンを変更します。
const CACHE_NAME = 'tetris-pwa-v1';
// オフラインで動作させるためにキャッシュするファイルのリスト
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'images/icon-192x192.png',
  'images/icon-512x512.png'
];

// --- install イベント ---
// サービスワーカーがインストールされたときに実行される
self.addEventListener('install', (event) => {
  // インストール処理が完了するまで待機する
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        // 指定したファイルをすべてキャッシュに追加する
        return cache.addAll(urlsToCache);
      })
  );
});

// --- activate イベント ---
// サービスワーカーが有効になったときに実行される
// 古いキャッシュを削除するのに使用します
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // ホワイトリストに含まれていないキャッシュを削除する
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// --- fetch イベント ---
// ページがリクエストを送信するたびに実行される
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // まずキャッシュ内にリクエストされたリソースがあるか確認する
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあれば、それを返す。なければネットワークから取得する
        return response || fetch(event.request);
      })
  );
});
