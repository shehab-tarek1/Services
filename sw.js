const CACHE_NAME = 'dalil-sharkia-v3.3';
const DYNAMIC_CACHE = 'dalil-sharkia-dynamic-v3.3';

// مسارات الملفات الأساسية المعتمدة للتخزين المسبق
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192x192.png'
];

// التثبيت والتخزين الأولي (مع معالجة الأخطاء لكل ملف على حدة)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => 
          cache.add(asset).catch(err => console.warn('تنبيه: تعذر تخزين الملف في الكاش:', asset, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// التفعيل ومسح الكاش القديم تلقائياً فور توفر الإصدار الجديد
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('جاري مسح الكاش القديم لتطبيق التحديث الجديد:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// اعتراض الطلبات والتأكد من العمل بكفاءة أوفلاين
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // تجاهل أي بروتوكولات غير http و https (مثل إضافات المتصفح)
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    return;
  }

  // تجاهل طلبات قواعد البيانات (فايربيز) ورفع الصور (Cloudinary) والطلبات غير التابعة لـ GET
  if (
    requestUrl.hostname.includes('firestore.googleapis.com') || 
    requestUrl.hostname.includes('identitytoolkit.googleapis.com') ||
    requestUrl.hostname.includes('firebaseio.com') ||
    requestUrl.hostname.includes('firebaseapp.com') ||
    requestUrl.hostname.includes('cloudinary.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 1. طلبات تصفح الصفحات (HTML Navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // التطبيق هو SPA (صفحة واحدة)، فالصفحة الرئيسية هي نفسها صفحة الأوفلاين
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // 2. طلبات الملفات الثابتة والصور والخطوط (Cache First مع التحديث بالخلفية)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // الاستجابة من الكاش فوراً، وتحديث النسخة في الخلفية
        fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, networkResponse));
            }
        }).catch(() => {});

        return cachedResponse;
      }

      // إذا لم يكن في الكاش، يتم جلبه من الشبكة وحفظه
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || (!networkResponse.ok && networkResponse.type !== 'opaque')) {
            return networkResponse;
        }

        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
         // في حالة فشل الاتصال وعدم توفر الملف في الكاش
      });
    })
  );
});