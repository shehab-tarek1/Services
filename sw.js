const CACHE_NAME = 'dalil-sharkia-v3.1';
const DYNAMIC_CACHE = 'dalil-sharkia-dynamic-v3.1';

// تم استخدام مسارات نسبية (./) لتجنب أخطاء الاستضافة في المجلدات الفرعية
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './tailwind.min.css',
  './manifest.json',
  './icons/icon-192x192.png'
];

// التثبيت والتخزين الأولي (مع منع الفشل الشامل)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // معالجة كل ملف على حدة لتجنب فشل الكاش بالكامل إذا كان ملف واحد مفقوداً
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => 
          cache.add(asset).catch(err => console.warn('لم يتم العثور على الملف ليتم تخزينه:', asset))
        )
      );
    })
  );
  self.skipWaiting();
});

// التفعيل ومسح الكاش القديم عند وجود تحديث
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('جاري مسح الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// اعتراض الطلبات والتأكد من العمل أوفلاين
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // تجاهل طلبات قواعد البيانات (فايربيز) ورفع الصور (Cloudinary)
  if (
    requestUrl.hostname.includes('firestore.googleapis.com') || 
    requestUrl.hostname.includes('identitytoolkit.googleapis.com') ||
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

  // 2. طلبات الملفات الثابتة (صور، خطوط، تنسيقات، JS) -> نمط الاستجابة من الكاش أولاً
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // الاستجابة من الكاش فوراً للسرعة، وتحديث الكاش في الخلفية
        fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, networkResponse));
            }
        }).catch(() => {}); // تجاهل الخطأ في الخلفية
        
        return cachedResponse;
      }

      // إذا لم يكن في الكاش، جربه من الإنترنت واحفظه
      return fetch(event.request).then((networkResponse) => {
        // التحقق من نجاح الاستجابة قبل التخزين (لمنع تخزين 404 أو 500)
        // يُسمح بنوع 'opaque' لأنه يخص طلبات خارجية ناجحة من سيرفرات لا تدعم CORS بالكامل (مثل بعض الصور)
        if (!networkResponse || (!networkResponse.ok && networkResponse.type !== 'opaque')) {
            return networkResponse;
        }
        
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
         // إذا كان الطلب لصورة وفشل الإنترنت، يمكن مستقبلاً إرجاع صورة افتراضية هنا
      });
    })
  );
});