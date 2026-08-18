import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, onSnapshot, query, addDoc, where, updateDoc, orderBy, deleteDoc, arrayUnion, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD7XMCaPTY73bfs8On_woRiFC7dmw2pwP4",
    authDomain: "services-cef84.firebaseapp.com",
    databaseURL: "https://services-cef84-default-rtdb.firebaseio.com",
    projectId: "services-cef84",
    storageBucket: "services-cef84.firebasestorage.app",
    messagingSenderId: "902396219187",
    appId: "1:902396219187:web:1d2ae6eb91215b148bb846"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'services-cef84';

// تفعيل ذاكرة الفايربيز أوفلاين (Firestore Offline Persistence)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('مفتوح في أكثر من تبويب، الكاش يعمل في تبويب واحد فقط');
    } else if (err.code == 'unimplemented') {
        console.log('المتصفح لا يدعم تخزين الفايربيز أوفلاين');
    }
});

// دالة حماية النصوص (XSS Protection)
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const sharkiaData = {
    "الزقازيق":["هرية رزنة","شيبة","العصلوجي","بنايوس","الزنكلون","كفر الحصر","كفر عبد العزيز","كفر الحمام","النكارية","الشبانات","شوبك بسطة","بيشة قايد","الطاهرة","الزهراء","طوخ","ميت أبو علي","كفر السواقي","كفر منلا","كفر أبو حسين","عزبة البكري","كفر محفوظ","كفر الشرفا","عزبة العرب","عزبة الجندي","كفر المزارقة","بيشة نوي","كفر داوود","برازيل","المسلمية","الطيبة","القومية","الجامعة","الزراعة","الغشام","المنتزه","حي الزهور","حي الحسينية","حي النحال","حي عمر بن الخطاب","ميدان عرابي","شارع فاروق","شارع الجلاء"],
    "منيا القمح":["المدينة","السعديين","كفر السعديين","كفر الشيخ سفر","شرشرة","ميت سهيل","التلين","سنهوا","كفر سلامة","شلشلمون","بني هلال","عزبة الطباخ","صهرجت الكبرى","صهرجت الصغرى","العزيزية","كفر الشيخ إبراهيم","البناتية","ملّيوس","كفر العرب"],
    "بلبيس":["المدينة","أنشاص الرمل","تل روزن","العلاقمة","غيتة","كفر أيوب سليمان","ميت ربيعة","سلمنت","الكتيبة","كفر أبودقن","العدلية","كفر أيوب","كفر إبراهيم العايدي","أولاد سيف","كفر أبو شحاتة","السعادات"],
    "أبو حماد":["المدينة","كفر أبو نجم","الأسدية","عزبة أبو عامر","الصوة","الطحاوية","الدويانية","القطاوية","أبو خروع","كفر البلاسي","عزبة جودة"],
    "فاقوس":["المدينة","الصوالح","الكيلانية","الملاحات","الديدامون","قنتير","السماعنة","سماكين الغرب","سماكين الشرق","أبو شلبي","النمروط","الغزالي","قهبونة","أبو ياسين","المنشأة الجديدة","جلفيا"],
    "الحسينية":["المدينة","سعود","منشأة أبو عامر","العبودي","الجمالية","بحر البقر","الأخيوة","الروضة","المناجاة","القصبي شرق","القصبي غرب","العائط"],
    "أبو كبير":["المدينة","الرحمانية","المشاعلة","طوخ القراموص","هربيط","أبو شحاتة","كفر الشيخ عيسى","بني عياض","كفر بني عياض","كفر أبو حطب"],
    "ديرب نجم":["المدينة","صفط زريق","جميزة بني عمرو","ديرب البلد","الهوابر","عزبة يوسف","إكوه","المناصافور","طحا المرج"],
    "كفر صقر":["المدينة","أبو الشقوق","حانوت","الهجارسة","القُرين القديمة","كفر السويركي"],
    "أولاد صقر":["المدينة","تلراك","منشأة ناصف","بني حسن","الهجارسة","القطيع"],
    "الإبراهيمية":["المدينة","كفور نجم","العدوة","السدس","كفر أبو شريعة","شلش"],
    "مشتول السوق":["المدينة","سنهوا","الصحافة","المنير","العقدة","العريشية"],
    "ههيا":["المدينة","العلاقمة","السكاكرة","المهدية","كفر أبو كبير","شرشيمة"],
    "العاشر من رمضان":["المجاورة 1-10", "المجاورة 11-30", "المجاورة 31-50", "المنطقة الصناعية", "الأردنية"]
};

const professions =["محاسب","مهندس مدني","مهندس معماري","طبيب بشري","طبيب أسنان","صيدلي","ممرض","محامي","مدرس","جرافيك ديزاينر","مبرمج","كاتب محتوى","مسوق إلكتروني","مترجم","مدخل بيانات","موظف استقبال","سكرتير","شيف","ويتر","باريستا","سباك","كهربائي","نجار","نقاش","حداد","لحام","ميكانيكي سيارات","عفشجي","سمكري","كهربائي سيارات","سروجي سيارات","فني تكييف","فني دش","فني غسالات","فني ثلاجات","فني فلاتر","مبلط سيراميك","مبيض محارة","عامل بناء","مقاول","فني الوميتال","استورجي","منجد","ترزي","صنيعي احذية","مكوجي","حلاق","كوافير","ميكب ارتيست","فوتوغرافي","فني طباعة","فني كمبيوتر","فني موبايل","سائق خاص","سائق تاكسي","سائق نقل","دليفري","عامل نظافة","عامل بوفيه","عامل زراعي","جنايني","حارس عقار","فني كاميرات","فني شبكات","فني مصاعد","فني زجاج","فني رخام","فني جبس بورد","فني باركيه","خطاط","رسام","نحات","صائغ","ساعاتي","فني مفاتيح","فني اليكترونيات","فني تحاليل","فني أشعة","أخصائي علاج طبيعي","أخصائي تخاطب","محفظ قرآن","مأذون","طباخ منزلي","بيبي سيتر","جليس مسنين","مدرب جيم","مدرب سباحة","مدرب سواقة","سمسار عقارات","تاجر ملابس","تاجر أغذية","مندوب مبيعات","كاشير","مدير محل","فني بصريات","فني أسنان","مدرب كرة قدم","حكم","يوتيوبر","صانع محتوى","خدمات أخرى"];

const validImages =[
"7654426/pexels-photo-16695382.jpeg", "15063590/pexels-photo-15063590.jpeg", "23496713/pexels-photo-23496713.jpeg", "32213424/pexels-photo-32213424.jpeg", "18524124/pexels-photo-18524124.jpeg", "19471013/pexels-photo-19471013.jpeg", "7468920/pexels-photo-7469477.jpeg", "5669619/pexels-photo-5669619.jpeg", "35745620/pexels-photo-35745620.jpeg", "17078688/pexels-photo-17078688.jpeg", "9553909/pexels-photo-9553909.jpeg", "261662/pexels-photo-261662.jpeg", "7621355/pexels-photo-7621355.jpeg", "7681135/pexels-photo-7681135.jpeg", "34639577/pexels-photo-34639577.jpeg", "3184465/pexels-photo-3184465.jpeg", "3760072/pexels-photo-3760072.jpeg", "3338537/pexels-photo-3338537.jpeg", "11566309/pexels-photo-11566309.jpeg", "302899/pexels-photo-302899.jpeg", "20065002/pexels-photo-20065002.jpeg", "257736/pexels-photo-257736.jpeg", "5974296/pexels-photo-5974296.jpeg", "5691639/pexels-photo-5691639.jpeg", "17702198/pexels-photo-17702198.jpeg", "19926190/pexels-photo-19926190.jpeg", "8478268/pexels-photo-8478268.jpeg", "5933476/pexels-photo-5933476.jpeg", "8985963/pexels-photo-8985963.jpeg", "32391502/pexels-photo-32391502.jpeg", "8985461/pexels-photo-8985461.jpeg", "33671149/pexels-photo-33671149.jpeg", "15483316/pexels-photo-15483316.jpeg", "34734504/pexels-photo-34734504.jpeg", "17842832/pexels-photo-17842832.jpeg", "31287022/pexels-photo-31287022.jpeg", "569154/pexels-photo-569154.jpeg", "5691613/pexels-photo-5691613.jpeg", "11429199/pexels-photo-11429199.jpeg", "19386931/pexels-photo-19386931.jpeg", "7533923/pexels-photo-7533923.jpeg", "5691612/pexels-photo-5691612.jpeg", "15016524/pexels-photo-15016524.jpeg", "6461159/pexels-photo-6461159.jpeg", "34510831/pexels-photo-34510831.jpeg", "28576623/pexels-photo-28576623.jpeg", "5970246/pexels-photo-5970246.jpeg", "3993304/pexels-photo-3993304.jpeg", "33271603/pexels-photo-33271603.jpeg", "17057198/pexels-photo-17057198.jpeg", "9574453/pexels-photo-9574453.jpeg", "36861987/pexels-photo-36861987.jpeg", "6755050/pexels-photo-6755050.jpeg", "10358853/pexels-photo-10358853.jpeg", "5721492/pexels-photo-5721492.jpeg", "10963705/pexels-photo-10963705.jpeg", "36764333/pexels-photo-36764333.jpeg", "14642832/pexels-photo-14642832.jpeg", "11508780/pexels-photo-11508780.jpeg", "32415692/pexels-photo-32415692.jpeg", "18774870/pexels-photo-18774870.jpeg", "31282369/pexels-photo-31282369.jpeg", "27765780/pexels-photo-27765780.jpeg", "7918920/pexels-photo-7918920.jpeg", "8453052/pexels-photo-8453052.jpeg", "11626073/pexels-photo-11626073.jpeg", "30112371/pexels-photo-30112371.jpeg", "5538715/pexels-photo-5538715.jpeg", "4263067/pexels-photo-4263067.jpeg", "11135525/pexels-photo-11135525.jpeg", "16037006/pexels-photo-16037006.jpeg", "35549798/pexels-photo-35549798.jpeg", "8442326/pexels-photo-8442326.jpeg", "8327590/pexels-photo-8327590.jpeg", "114741/pexels-photo-114741.jpeg", "10699352/pexels-photo-10699352.jpeg", "8460346/pexels-photo-8460346.jpeg", "6501854/pexels-photo-6501854.jpeg", "20860582/pexels-photo-20860582.jpeg", "8560049/pexels-photo-8560049.jpeg", "20597768/pexels-photo-20597768.jpeg", "35253989/pexels-photo-35253989.jpeg", "6248797/pexels-photo-6248797.jpeg", "8770586/pexels-photo-8770586.jpeg", "18459193/pexels-photo-18459193.jpeg", "13451897/pexels-photo-13451897.jpeg", "30468227/pexels-photo-30468227.jpeg", "17108182/pexels-photo-17108182.jpeg", "34365475/pexels-photo-34365475.jpeg", "14235412/pexels-photo-14235412.jpeg", "35770688/pexels-photo-35770688.jpeg", "36123358/pexels-photo-36123358.jpeg", "26904218/pexels-photo-26904218.jpeg", "5874519/pexels-photo-5874519.jpeg", "6749753/pexels-photo-6749753.jpeg", "18662954/pexels-photo-18662954.jpeg", "32101180/pexels-photo-32101180.jpeg", "32108803/pexels-photo-32108803.jpeg", "24286930/pexels-photo-24286930.jpeg", "15846543/pexels-photo-15846543.jpeg", "5123456/pexels-photo-5123456.jpeg"
];

function populateProfessionsGlobally() {
    const opts = professions.map(p => `<option value="${p}">${p}</option>`).join('');
    const optsWithOther = opts + '<option value="أخرى">أخرى...</option>';
    if(document.getElementById('signup-prof')) document.getElementById('signup-prof').innerHTML = '<option value="">اختر المهنة...</option>'+opts;
    if(document.getElementById('req-prof')) document.getElementById('req-prof').innerHTML = '<option value="">اختر المهنة...</option>'+opts;
    if(document.getElementById('job-title-select')) document.getElementById('job-title-select').innerHTML = '<option value="">اختر المسمى...</option>'+optsWithOther;
    if(document.getElementById('filter-prof')) {
        document.getElementById('filter-prof').innerHTML = '<option value="">كل الوظائف</option>'+opts;
        makeCustomDropdown('filter-prof', 'اختر المهنة...');
    }
}
populateProfessionsGlobally();

function getProfImage(profName) {
    const defaultImg = "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=200";
    if(profName === "خدمات أخرى") return defaultImg;
    const index = professions.indexOf(profName);
    if (index === -1 || index >= validImages.length) return defaultImg;
    const rawPath = validImages[index];
    const match = rawPath.match(/pexels-photo-(\d+)\.jpeg/);
    const photoId = match ? match[1] : rawPath.split('/')[0];
    if (!photoId) return defaultImg;
    return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=200`;
}

let isGuest = true;
let currentUser = null, userProfile = null, navStack =['home'], currentChatId = null, allUsersCache =[], myChatsCache =[], chatListener = null, currentModalUserId = null;
let tempSelectedFile = null;
let globalUnsubs =[];
let currentActiveCategory = ""; // لحفظ اسم القسم عند التصفح

let reqNotifs =[];
let reviewNotifs =[];
window.chatNotifsGlobal =[];

function makeCustomDropdown(selectId, placeholder = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    let wrapper = select.nextElementSibling;
    if (wrapper && wrapper.classList.contains('custom-select-wrapper')) wrapper.remove();
    
    select.style.display = 'none';
    wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-select border-2 border-gray-300 dark:border-gray-600 outline-none focus:border-black dark:focus:border-white';
    
    const selectedOpt = select.options[select.selectedIndex];
    const textSpan = document.createElement('span');
    textSpan.innerText = selectedOpt && selectedOpt.value !== '' ? selectedOpt.text : placeholder;
    if (!selectedOpt || selectedOpt.value === '') textSpan.classList.add('text-gray-400');
    
    const icon = document.createElement('span');
    icon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
    
    trigger.appendChild(textSpan);
    trigger.appendChild(icon);
    
    const optionsCont = document.createElement('div');
    optionsCont.className = 'custom-options custom-scrollbar';
    
    Array.from(select.options).forEach(opt => {
        const div = document.createElement('div');
        div.className = 'custom-option text-xs md:text-sm' + (opt.selected && opt.value !== '' ? ' selected' : '');
        div.innerText = opt.text;
        div.dataset.value = opt.value;
        div.onclick = (e) => {
            e.stopPropagation();
            select.value = opt.value;
            select.dispatchEvent(new Event('change'));
            textSpan.innerText = opt.text;
            if (opt.value === '') textSpan.classList.add('text-gray-400');
            else textSpan.classList.remove('text-gray-400');
            optionsCont.classList.remove('open');
            Array.from(optionsCont.children).forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
        };
        optionsCont.appendChild(div);
    });
    
    trigger.onclick = (e) => {
        e.stopPropagation();
        const isOpen = optionsCont.classList.contains('open');
        document.querySelectorAll('.custom-options').forEach(el => el.classList.remove('open'));
        if (!isOpen) optionsCont.classList.add('open');
    };
    
    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsCont);
    select.parentNode.insertBefore(wrapper, select.nextSibling);
}

document.addEventListener('click', () => { document.querySelectorAll('.custom-options').forEach(el => el.classList.remove('open')); });

let dirRenderedCount = 0;
let catRenderedCount = 0;
let filteredDirItems =[];
let filteredCatItems =[];
const ITEMS_PER_PAGE = 20;

const CLOUD_NAME = "db9h7zm1h"; 
const UPLOAD_PRESET = "souq_upload";

window.uploadToCloudinary = async (file) => {
    try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true, initialQuality: 0.7 };
        // استدعاء وهمي للضغط، يُفترض وجود مكتبة imageCompression مستدعاة مسبقاً في المشروع الفعلي
        const compressedFile = typeof imageCompression === 'function' ? await imageCompression(file, options) : file;
        
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const fd = new FormData(); 
        fd.append("file", compressedFile); 
        fd.append("upload_preset", UPLOAD_PRESET);
        
        const res = await fetch(url, { method: "POST", body: fd });
        if (!res.ok) throw new Error("فشل رفع الصورة");
        const data = await res.json(); 
        return data.secure_url; 
    } catch (error) {
        console.error("خطأ في معالجة الصورة:", error);
        throw new Error("فشل رفع الصورة");
    }
};

window.getCloudinaryUrl = (url, size = 'thumb') => {
    if (!url) return 'https://via.placeholder.com/40';
    if (url.startsWith('data:image') && url.length > 50000) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
    if (!url.includes('res.cloudinary.com')) return url; 
    const parts = url.split('/upload/');
    if (parts.length < 2) return url;
    if (size === 'thumb') return `${parts[0]}/upload/w_100,h_100,c_fill,q_auto,f_auto/${parts[1]}`;
    if (size === 'medium') return `${parts[0]}/upload/w_500,c_limit,q_auto,f_auto/${parts[1]}`;
    return `${parts[0]}/upload/q_auto,f_auto/${parts[1]}`;
};

window.showToast = (msg, type='success') => {
    const box = document.getElementById('toast-box');
    const el = document.createElement('div'); el.className = `toast-msg ${type}`; el.innerText = msg;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
};

window.hideLoader = () => document.getElementById('loader').classList.add('hidden');
window.showLoader = () => document.getElementById('loader').classList.remove('hidden');

// إدارة نافذة الفلترة (تغيير السلوك حسب الصفحة)
window.openFilterModal = (source) => {
    document.getElementById('filter-modal-wrap').classList.remove('hidden');
    const profContainer = document.getElementById('filter-prof-container');
    if (source === 'category') {
        profContainer.classList.add('hidden'); // لا تسمح بتغيير المهنة داخل قسم محدد
    } else {
        profContainer.classList.remove('hidden'); // إظهار المهنة في صفحة الدليل العامة
    }
};

window.requireAuth = () => {
    if(isGuest) {
        window.showToast('يرجى تسجيل الدخول للوصول لهذه الميزة', 'error');
        window.navTo('auth');
        return false;
    }
    return true;
};

window.handleImageUpload = (input, previewId) => {
    if (input.files[0]) { tempSelectedFile = input.files[0]; document.getElementById(previewId).src = URL.createObjectURL(input.files[0]); }
};

window.clearForms = () => {
    document.getElementById('form-req').reset();
    document.getElementById('form-job').reset();
    document.getElementById('form-login').reset();
    document.getElementById('form-signup').reset();
    document.getElementById('req-custom-prof').classList.add('hidden');
    document.getElementById('job-custom-title').classList.add('hidden');
};

window.openActivityTab = (tab) => { window.switchActivityTab(tab); window.navTo('activity'); };

window.switchActivityTab = (tab) => {
    window.scrollTo(0,0);
    if (tab === 'my-activity') {
        document.getElementById('view-my-activity').classList.remove('hidden'); document.getElementById('view-matching-reqs').classList.add('hidden');
        document.getElementById('tab-act-mine').classList.add('bg-black', 'text-white'); document.getElementById('tab-act-mine').classList.remove('text-gray-500');
        document.getElementById('tab-act-matching').classList.remove('bg-black', 'text-white'); document.getElementById('tab-act-matching').classList.add('text-gray-500');
    } else {
        document.getElementById('view-my-activity').classList.add('hidden'); document.getElementById('view-matching-reqs').classList.remove('hidden');
        document.getElementById('tab-act-matching').classList.add('bg-black', 'text-white'); document.getElementById('tab-act-matching').classList.remove('text-gray-500');
        document.getElementById('tab-act-mine').classList.remove('bg-black', 'text-white'); document.getElementById('tab-act-mine').classList.add('text-gray-500');
        document.getElementById('act-notif-badge').classList.add('hidden');
    }
};

window.updateBottomNav = (pageId) => {
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(b => {
        b.classList.remove('text-blue-600', 'active');
        b.classList.add('text-gray-400');
    });

    const navMap = {'home':0, 'directory':1, 'chat':2, 'profile':3, 'activity':3, 'add': -1, 'auth': -1}; 
    let activeIdx = navMap[pageId];
    
    if(pageId === 'chat-room') activeIdx = 2;
    if(pageId === 'edit-profile' || pageId === 'settings') activeIdx = 3;
    if(pageId === 'category-details') activeIdx = 0;

    if(activeIdx !== undefined && activeIdx !== -1 && btns[activeIdx]) {
        btns[activeIdx].classList.add('text-blue-600', 'active');
        btns[activeIdx].classList.remove('text-gray-400');
    }
};

history.replaceState({ pageId: 'exit_trap' }, "", window.location.pathname);
history.pushState({ pageId: 'home' }, "", window.location.pathname);

const pageTitles = {
    'home': 'الرئيسية',
    'directory': 'الدليل',
    'add': 'إضافة جديد',
    'profile': 'حسابي',
    'activity': 'النشاط',
    'settings': 'الإعدادات',
    'edit-profile': 'تعديل الحساب',
    'chat': 'المحادثات',
    'user-profile': 'الملف الشخصي',
    'auth': 'تسجيل الدخول'
};

window.navTo = (pageId, skipHistory = false) => {
    if (['add', 'profile', 'chat', 'activity', 'settings', 'edit-profile'].includes(pageId)) {
        if(!window.requireAuth()) return;
    }
    
    if (navStack[navStack.length - 1] === pageId && !skipHistory) return;

    window.scrollTo(0, 0);

    if (navStack[navStack.length - 1] === 'add' && pageId !== 'add') {
        window.clearForms();
    }

    if (pageId !== 'directory') document.getElementById('dir-list').innerHTML = '';
    if (pageId !== 'category-details') document.getElementById('cat-list-container').innerHTML = '';

    if(pageId === 'chat') { localStorage.setItem(`chatTabLastOpened_${currentUser?.uid}`, Date.now().toString()); document.getElementById('chat-nav-dot').classList.add('hidden'); }
    
    if (pageId === 'directory') {
        document.getElementById('filter-prof').value = '';
        document.getElementById('filter-center').value = '';
        document.getElementById('filter-village').innerHTML = '<option value="">القرية...</option>';
        document.getElementById('dir-search').value = '';
        if (allUsersCache.length > 0) window.filterDirectory();
    }

    if (!skipHistory) {
        const bottomNavPages = ['home', 'directory', 'chat', 'profile', 'activity'];
        const index = navStack.indexOf(pageId);
        if (bottomNavPages.includes(pageId) && index !== -1 && index < navStack.length - 1) {
            const steps = index - (navStack.length - 1);
            history.go(steps);
            return; 
        } else {
            if (navStack[navStack.length - 1] !== pageId) {
                navStack.push(pageId);
                history.pushState({ pageId: pageId }, "", window.location.pathname);
            }
        }
    }

    if (pageId === 'chat-room') { document.getElementById('page-chat-room').classList.remove('hidden'); window.updateBottomNav(pageId); return; }
    document.getElementById('page-chat-room').classList.add('hidden');
    if (chatListener) { chatListener(); chatListener = null; }
    
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
   
    const backBtn = document.getElementById('btn-back');
    if (pageId === 'home') { 
        document.getElementById('page-title').innerHTML = isGuest ? `مرحباً بك في <span class="bg-black text-white px-2 py-0.5 rounded-full mx-1 dark:bg-gray-600 text-[9px] md:text-xs">دليل الشرقية</span>` : `مرحباً بك <span class="bg-black text-white px-2 py-0.5 rounded-full mx-1 dark:bg-gray-600 text-[9px] md:text-xs">${escapeHTML(userProfile ? userProfile.name : '')}</span>`; 
        backBtn.classList.add('hidden'); 
    } else { 
        backBtn.classList.remove('hidden'); 
        // استعادة اسم القسم المحفوظ عند التنقل
        if(pageId === 'category-details') {
             document.getElementById('page-title').innerText = currentActiveCategory;
        } else {
             document.getElementById('page-title').innerText = pageTitles[pageId] || 'رجوع'; 
        }
    }
   
    window.updateBottomNav(pageId);
    if(pageId === 'chat' && typeof window.renderChatsUI === 'function') window.renderChatsUI();
};

window.goBack = () => {
    history.back(); 
};

window.addEventListener('popstate', async (e) => {
    // تم إزالة window.logout() لمنع تسجيل الخروج التلقائي عند ضغط زر الرجوع للصفحة الرئيسية
    if (!e.state || e.state.pageId === 'exit_trap') {
        return; // ترك المتصفح يتصرف طبيعياً
    }

    const pageId = e.state.pageId;
    
    const index = navStack.indexOf(pageId);
    if (index !== -1) {
        navStack = navStack.slice(0, index + 1);
    } else {
        navStack.push(pageId);
    }

    if (pageId !== 'directory') document.getElementById('dir-list').innerHTML = '';
    if (pageId !== 'category-details') document.getElementById('cat-list-container').innerHTML = '';

    if (pageId === 'chat-room') {
        document.getElementById('page-chat-room').classList.remove('hidden');
        window.updateBottomNav(pageId);
        return;
    }
    
    document.getElementById('page-chat-room').classList.add('hidden');
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    
    const backBtn = document.getElementById('btn-back');
    if (pageId === 'home') {
        backBtn.classList.add('hidden');
        document.getElementById('page-title').innerHTML = isGuest ? `مرحباً بك في <span class="bg-black text-white px-2 py-0.5 rounded-full mx-1 dark:bg-gray-600 text-[9px] md:text-xs">دليل الشرقية</span>` : `مرحباً بك <span class="bg-black text-white px-2 py-0.5 rounded-full mx-1 dark:bg-gray-600 text-[9px] md:text-xs">${escapeHTML(userProfile ? userProfile.name : '')}</span>`;
    } else {
        backBtn.classList.remove('hidden');
        if(pageId === 'category-details') {
            document.getElementById('page-title').innerText = currentActiveCategory;
        } else {
            document.getElementById('page-title').innerText = pageTitles[pageId] || 'رجوع';
        }
    }
    window.updateBottomNav(pageId);
    window.scrollTo(0, 0);

    if (pageId === 'directory' && allUsersCache.length > 0) window.filterDirectory();
    if (pageId === 'category-details' && allUsersCache.length > 0) window.filterCategory();
    if (pageId === 'chat' && typeof window.renderChatsUI === 'function') window.renderChatsUI();
});

function initApp() {
    renderProfessionsGrid(professions);
    populateCenters('filter');
    
    if(!isGuest && userProfile) {
        document.getElementById('page-title').innerHTML = `مرحباً بك <span class="bg-black text-white px-2 py-0.5 rounded-full mx-1 dark:bg-gray-600 text-[9px] md:text-xs">${escapeHTML(userProfile.name)}</span>`;
        if(userProfile.role === 'provider') {
            document.getElementById('tab-act-matching').classList.remove('hidden');
            document.getElementById('btn-profile-matching').classList.remove('hidden');
        } else {
            document.getElementById('tab-act-matching').classList.add('hidden');
            document.getElementById('btn-profile-matching').classList.add('hidden');
        }
    } else {
        document.getElementById('page-title').innerHTML = `مرحباً بك في <span class="bg-black text-white px-2 py-0.5 rounded-full mx-1 dark:bg-gray-600 text-[9px] md:text-xs">دليل الشرقية</span>`;
    }
}

function renderProfessionsGrid(list) {
    const grid = document.getElementById('professions-grid');
    if (grid.children.length > 0) return; 
    const defaultImg = "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=200";
    const html = list.map(p => `
        <div data-prof="${escapeHTML(p)}" onclick="window.openCategory('${escapeHTML(p)}')" class="provider-card cursor-pointer h-28 md:h-32 rounded-xl overflow-hidden relative group bg-gray-400 dark:bg-gray-800 active:scale-95 transition-transform">
            <img src="${getProfImage(p)}" loading="lazy" onerror="this.onerror=null; this.src='${defaultImg}';" class="w-full h-full object-cover">
            <div class="bg-black/60 absolute inset-0 flex flex-col justify-end p-2">
                <span class="font-bold text-white text-[10px] md:text-xs drop-shadow-md text-center">${escapeHTML(p)}</span>
            </div>
        </div>
    `).join('');
    grid.innerHTML = html;
}

window.updateVillages = (prefix = 'signup') => {
    const centerSelect = document.getElementById(`${prefix}-center`);
    const villageSelect = document.getElementById(`${prefix}-village`);
    const selectedCenter = centerSelect.value;
    villageSelect.innerHTML = '<option value="">القرية...</option>';
    if (selectedCenter && sharkiaData[selectedCenter]) {
        sharkiaData[selectedCenter].forEach(village => {
            const opt = document.createElement('option'); opt.value = village; opt.innerText = village;
            villageSelect.appendChild(opt);
        });
    }
    if (prefix === 'filter') makeCustomDropdown('filter-village', 'القرية...');
};

function populateCenters(prefix = 'signup') {
    const centerSelect = document.getElementById(`${prefix}-center`);
    if(!centerSelect) return;
    centerSelect.innerHTML = '<option value="">المركز...</option>';
    Object.keys(sharkiaData).forEach(center => {
        const opt = document.createElement('option'); opt.value = center; opt.innerText = center;
        centerSelect.appendChild(opt);
    });
    if (prefix === 'filter') makeCustomDropdown('filter-center', 'المركز...');
}

let searchTimeout;
window.debouncedSearch = (type) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if(type === 'prof') window.filterProfessions();
        if(type === 'dir') window.filterDirectory();
        if(type === 'cat') window.filterCategory();
    }, 500);
};

// إصلاح: استخدام JavaScript لإخفاء وإظهار العناصر بدلاً من حقن CSS لتجنب مشاكل الـ Quotes والـ XSS
window.filterProfessions = () => {
    const term = document.getElementById('prof-search').value.trim().toLowerCase();
    const cards = document.querySelectorAll('#professions-grid .provider-card');
    
    cards.forEach(card => {
        const prof = card.getAttribute('data-prof').toLowerCase();
        if (!term || prof.includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
};

window.switchAuthMode = (mode) => {
    const btnLogin = document.getElementById('btn-mode-login'); const btnSignup = document.getElementById('btn-mode-signup');
    const formLogin = document.getElementById('form-login'); const formSignup = document.getElementById('form-signup');
    if(mode === 'login'){
        formLogin.classList.remove('hidden'); formSignup.classList.add('hidden');
        btnLogin.className = "flex-1 rounded-md text-xs md:text-sm font-bold bg-black text-white shadow-sm transition-colors";
        btnSignup.className = "flex-1 rounded-md text-xs md:text-sm font-bold text-gray-500 bg-transparent hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors";
    } else {
        formLogin.classList.add('hidden'); formSignup.classList.remove('hidden');
        populateCenters();
        btnSignup.className = "flex-1 rounded-md text-xs md:text-sm font-bold bg-black text-white shadow-sm transition-colors";
        btnLogin.className = "flex-1 rounded-md text-xs md:text-sm font-bold text-gray-500 bg-transparent hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors";
    }
};

window.toggleProfVisibility = (show) => document.getElementById('prof-container').style.display = show ? 'block' : 'none';

const phoneToEmail = (phone) => `user_${phone}@dalil-sharkia.com`;

document.getElementById('form-login').onsubmit = async (e) => {
    e.preventDefault(); 
    const phoneVal = document.getElementById('login-phone').value;
    if(!/^(10|11|12|15)\d{8}$/.test(phoneVal)) {
        return window.showToast('رقم الهاتف يجب أن يبدأ بـ 10 أو 11 أو 12 أو 15 ويتكون من 10 أرقام', 'error');
    }
    window.showLoader();
    try { await signInWithEmailAndPassword(auth, phoneToEmail(phoneVal), document.getElementById('login-pass').value); }
    catch (err) { window.showToast('رقم الهاتف أو كلمة المرور غير صحيحة', 'error'); window.hideLoader(); }
};

document.getElementById('form-signup').onsubmit = async (e) => {
    e.preventDefault(); 
    const phoneVal = document.getElementById('signup-phone').value;
    if(!/^(10|11|12|15)\d{8}$/.test(phoneVal)) {
        return window.showToast('رقم الهاتف يجب أن يبدأ بـ 10 أو 11 أو 12 أو 15 ويتكون من 10 أرقام', 'error');
    }

    window.showLoader();
    let tempCred = null;
    try {
        const role = document.querySelector('input[name="role"]:checked').value;
        let prof = role === 'provider' ? document.getElementById('signup-prof').value : null;
        if(role === 'provider' && !prof) throw new Error('اختر المهنة');
        if(prof === 'خدمات أخرى') {
            prof = document.getElementById('signup-custom-prof').value.trim();
            if(!prof) throw new Error('يرجى كتابة اسم الخدمة المخصصة');
        }
       
        const center = document.getElementById('signup-center').value;
        const village = document.getElementById('signup-village').value;
        if(!center || !village) throw new Error('يرجى اختيار الموقع');
        
        const addressDetail = document.getElementById('signup-address-detail').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const userName = document.getElementById('signup-name').value;
        
        let finalPhotoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${gender==='male'?'0D8ABC':'E91E63'}&color=fff`;
        if (tempSelectedFile) { finalPhotoURL = await window.uploadToCloudinary(tempSelectedFile); tempSelectedFile = null; }

        tempCred = await createUserWithEmailAndPassword(auth, phoneToEmail(phoneVal), document.getElementById('signup-pass').value);

        // إذا فشل هذا السطر، سيتم تنفيذ أمر الحذف في catch لمنع الحسابات اليتيمة
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', tempCred.user.uid), {
            uid: tempCred.user.uid, name: userName, phone: `+20${phoneVal}`, city: center, area: village, addressDetail: addressDetail,
            role, profession: prof, photoURL: finalPhotoURL, gender, settings: { notifEnabled: true, hidePhone: false, hideProfile: false, pauseRequests: false, darkMode: false },
            createdAt: new Date().toISOString()
        });
        
        window.showToast('تم التسجيل بنجاح');
    } catch (err) { 
        // مسح حساب الـ Auth إذا فشل تخزين البيانات لكي لا يصبح الحساب معلقاً
        if (tempCred && tempCred.user) {
            await tempCred.user.delete().catch(()=>console.log('could not delete temp user'));
        }
        let errorMsg = err.message;
        if (err.code === 'auth/email-already-in-use') errorMsg = 'رقم الهاتف مستخدم مسبقاً لحساب آخر';
        if (err.code === 'auth/weak-password') errorMsg = 'كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل)';
        window.showToast(errorMsg, 'error'); 
        window.hideLoader();
    }
};

async function fetchProfileWithRetry(uid, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const snap = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', uid));
            if (snap.exists()) return snap.data();
        } catch(e) { console.error("Retry fetch error:", e); }
        await new Promise(r => setTimeout(r, 1000)); 
    }
    return null;
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        isGuest = false;
        currentUser = user;
        if(userProfile && userProfile.uid === user.uid) { window.hideLoader(); return; }
       
        try {
            const profileData = await fetchProfileWithRetry(user.uid);
            if (profileData) {
                userProfile = profileData;
                if(!userProfile.settings) userProfile.settings = { notifEnabled: true, hidePhone: false, hideProfile: false, pauseRequests: false, darkMode: false };
               
                const localIsDark = document.documentElement.classList.contains('dark');
                if (userProfile.settings.darkMode !== localIsDark) {
                    userProfile.settings.darkMode = localIsDark;
                    updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', user.uid), {
                        'settings.darkMode': localIsDark
                    }).catch(e => console.log('Theme sync error', e));
                }
                document.getElementById('theme-toggle').checked = localIsDark;

                document.getElementById('header-avatar').src = window.getCloudinaryUrl(userProfile.photoURL, 'thumb');

                document.getElementById('prof-name-view').innerText = escapeHTML(userProfile.name);
                document.getElementById('prof-role-view').innerText = userProfile.role === 'provider' ? escapeHTML(userProfile.profession) : 'عميل';
                document.getElementById('prof-address-view').innerText = `${escapeHTML(userProfile.area) || ''} - ${escapeHTML(userProfile.city) || ''}`;
                document.getElementById('prof-img-view').src = window.getCloudinaryUrl(userProfile.photoURL, 'medium');

                document.getElementById('edit-name').value = userProfile.name;
                document.getElementById('edit-phone').value = userProfile.phone.replace('+20', '');
                document.getElementById('edit-img-preview').src = window.getCloudinaryUrl(userProfile.photoURL, 'medium');
               
                populateCenters('edit'); 
                document.getElementById('edit-center').value = userProfile.city || '';
                window.updateVillages('edit'); 
                setTimeout(() => { document.getElementById('edit-village').value = userProfile.area || ''; }, 100);
                document.getElementById('edit-address-detail').value = userProfile.addressDetail || '';

                document.getElementById('toggle-notif').checked = userProfile.settings.notifEnabled !== false;
                document.getElementById('toggle-hide-phone').checked = userProfile.settings.hidePhone === true;
                document.getElementById('toggle-hide-profile').checked = userProfile.settings.hideProfile === true;
                
                if (userProfile.role === 'provider') {
                    document.getElementById('setting-pause-reqs').classList.remove('hidden');
                    document.getElementById('toggle-pause-reqs').checked = userProfile.settings.pauseRequests === true;
                } else {
                    document.getElementById('setting-pause-reqs').classList.add('hidden');
                }

                initApp(); startListeners(); 
                if(navStack[navStack.length-1] === 'auth') {
                    window.navTo('home', true);
                }
            } else {
                signOut(auth); window.showToast('بيانات الحساب غير مكتملة، يرجى التسجيل من جديد', 'error');
            }
        } catch (error) { signOut(auth); window.showToast('حدث خطأ أثناء الاتصال', 'error'); } 
        finally { window.hideLoader(); }
    } else {
        isGuest = true;
        window.clearForms();
        navStack = ['home'];
        history.replaceState({ pageId: 'exit_trap' }, "", window.location.pathname);
        history.pushState({ pageId: 'home' }, "", window.location.pathname);

        document.getElementById('header-avatar').src = 'icons/icon-192x192.png';
        
        initApp(); startListeners();
        window.navTo('home', true);
        window.hideLoader();
    }
});

setTimeout(() => { window.hideLoader(); }, 15000);

window.toggleTheme = async () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (!isGuest && currentUser && userProfile) {
        try {
            await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', currentUser.uid), {
                'settings.darkMode': isDark
            });
            userProfile.settings.darkMode = isDark;
        } catch(e) { console.error("فشل حفظ إعداد الوضع الداكن", e); }
    }
};

function renderNotificationsList() {
    if(isGuest) return;
    let allNotifs =[...reqNotifs, ...reviewNotifs, ...(window.chatNotifsGlobal || [])];
    allNotifs.sort((a,b) => b.time - a.time);
    
    let unreadCount = 0;
    const notifKey = `notifSeen_${currentUser.uid}`;
    const lastSeenN = parseInt(localStorage.getItem(notifKey) || '0');
    
    const html = allNotifs.map(n => {
        const isNew = n.time > lastSeenN;
        if(isNew) unreadCount++;
        return `
        <div class="p-3 ${isNew ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'} rounded-lg border mb-2 relative">
            ${isNew ? '<span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>' : ''}
            <p class="text-[10px] font-bold ${isNew ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'} pl-3">${escapeHTML(n.text)}</p>
            <span class="block mt-1 text-[9px] text-gray-400 font-bold">${new Date(n.time).toLocaleString('ar-EG')}</span>
        </div>`;
    }).join('');
    
    document.getElementById('notif-list').innerHTML = html || '<p class="text-center text-[10px] font-bold text-gray-400 py-4">لا توجد إشعارات حالياً</p>';
    
    if(unreadCount > 0 && userProfile?.settings?.notifEnabled) document.getElementById('notif-dot').classList.remove('hidden');
    else document.getElementById('notif-dot').classList.add('hidden');
}

window.toggleNotifPanel = () => {
    if(!window.requireAuth()) return;
    const panel = document.getElementById('notif-panel');
    panel.classList.toggle('hidden');
    if(!panel.classList.contains('hidden')) {
        localStorage.setItem(`notifSeen_${currentUser.uid}`, Date.now().toString());
        renderNotificationsList();
    }
};

window.renderChatsUI = function() {
    if(isGuest) return;
    const list = document.getElementById('chat-history-list');
    if(myChatsCache.length === 0) { 
        list.innerHTML = '<p class="text-center text-gray-400 py-10 text-[10px] font-bold col-span-full">لا توجد محادثات</p>'; 
        document.getElementById('chat-nav-dot').classList.add('hidden'); return; 
    }

    myChatsCache.sort((a,b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
    let hasUnreadChatsForTab = false;
    const chatTabLastOpened = parseInt(localStorage.getItem(`chatTabLastOpened_${currentUser.uid}`) || '0');

    const html = myChatsCache.map(c => {
        const otherId = c.users.find(u => u !== currentUser.uid);
        const otherUser = allUsersCache.find(u => u.uid === otherId) || { name: 'مستخدم...', photoURL: 'https://via.placeholder.com/40' };
        const time = c.lastUpdated ? new Date(c.lastUpdated).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'}) : '';
        const chatSeenKey = `chatSeen_${currentUser.uid}_${c.id}`;
        const lastSeenThisChat = parseInt(localStorage.getItem(chatSeenKey) || '0');
        const isNew = (new Date(c.lastUpdated || 0).getTime() > lastSeenThisChat) && (c.lastSenderId !== currentUser.uid);

        if ((new Date(c.lastUpdated || 0).getTime() > chatTabLastOpened) && (c.lastSenderId !== currentUser.uid)) hasUnreadChatsForTab = true;

        return `
           <div onclick="window.openChat('${otherId}')" class="p-2.5 md:p-3 rounded-2xl border-2 border-black dark:border-gray-500 cursor-pointer bg-white dark:bg-gray-800 flex items-center gap-2.5 md:gap-4 relative hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-transform overflow-hidden">
               <img src="${window.getCloudinaryUrl(otherUser.photoURL, 'thumb')}" loading="lazy" class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-black dark:border-gray-500 shrink-0">
               <div class="flex-1 min-w-0">
                   <div class="flex justify-between items-center mb-1">
                       <h4 class="font-bold text-[11px] md:text-sm dark:text-white truncate">${escapeHTML(otherUser.name)}</h4>
                       <span class="text-[9px] md:text-xs text-gray-500 font-bold bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">${time}</span>
                   </div>
                   <p class="text-[10px] md:text-xs truncate ${isNew?'font-bold text-black dark:text-white':'text-gray-500'}">${escapeHTML(c.lastMessage || '...')}</p>
               </div>
               ${isNew ? '<div class="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>' : ''}
           </div>
        `;
    }).join('');
    
    list.innerHTML = html;
    const chatTabActive = navStack[navStack.length-1] === 'chat';
    if (hasUnreadChatsForTab && !chatTabActive) document.getElementById('chat-nav-dot').classList.remove('hidden');
    else document.getElementById('chat-nav-dot').classList.add('hidden');
};

function startListeners() {
    globalUnsubs.forEach(u => u());
    globalUnsubs =[];

    // --- Public Listeners (For Guests & Users) ---
    const unsubProfiles = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'profiles'), (snap) => {
        allUsersCache =[];
        snap.forEach(d => {
            const u = d.data();
            // تم حجب أصحاب الحسابات المخفية عن الظهور بالدليل للجميع ما عدا صاحب الحساب نفسه
            if((isGuest || d.id !== currentUser?.uid) && !(u.settings?.hideProfile)) allUsersCache.push(u);
        });
        
        const currentPage = navStack[navStack.length-1];
        if (currentPage === 'category-details') window.filterCategory();
        else if (currentPage === 'directory') window.filterDirectory();
        
        if(!isGuest) window.renderChatsUI(); 
    });
    globalUnsubs.push(unsubProfiles);

    const unsubJobs = onSnapshot(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), where('type','==','job')), (snap) => {
        const list = document.getElementById('view-jobs');
        if(snap.empty) { list.innerHTML = '<p class="text-center text-gray-400 py-10 text-[10px] md:text-xs font-bold col-span-full">لا توجد وظائف حالياً</p>'; return; }
        const html =[];
        snap.forEach(d => {
            const j = d.data();
            const hasPhone = j.contactPhone && j.contactPhone.length > 5;
            const isMyPost = !isGuest && j.uid === currentUser?.uid;
            html.push(`
                <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-black dark:border-gray-500 overflow-hidden relative">
                    <div class="p-2.5 md:p-4">
                        <div class="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                            <img src="${window.getCloudinaryUrl(j.posterPhoto||'https://via.placeholder.com/40', 'thumb')}" loading="lazy" class="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-black dark:border-gray-500 shrink-0 mt-1">
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-[10px] md:text-xs"><span class="text-gray-500 font-bold">الناشر:</span> <strong class="text-black dark:text-white">${escapeHTML(j.posterName)}</strong></span>
                                    <span class="text-[9px] md:text-[10px] text-gray-500 font-bold shrink-0">التاريخ: ${new Date(j.createdAt).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div class="text-[10px] md:text-xs mb-1"><span class="text-gray-500 font-bold">الوظيفة:</span> <strong class="text-black dark:text-white">${escapeHTML(j.title)}</strong></div>
                            </div>
                        </div>
                        <div class="flex gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap">
                            <span class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-[10px] font-bold">الدوام: ${j.jobType === 'part' ? 'جزئي' : 'كامل'}</span>
                            <span class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-[10px] font-bold">الراتب: ${j.salary ? escapeHTML(j.salary) + ' ج.م' : 'لا يوجد'}</span>
                            <span class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-[10px] font-bold">الشيفت: ${j.shift ? escapeHTML(j.shift) : 'لا يوجد'}</span>
                            <span class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-[10px] font-bold">الساعات: ${j.hours ? escapeHTML(j.hours) : 'لا يوجد'}</span>
                        </div>
                        <div class="mb-2 md:mb-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 md:p-2 text-[10px] md:text-xs max-h-20 overflow-y-auto custom-scrollbar">
                            <span class="text-gray-500 font-bold">التفاصيل:</span> <span class="text-black dark:text-gray-200 leading-relaxed whitespace-pre-wrap">${escapeHTML(j.desc)}</span>
                        </div>
                        <div class="flex gap-2">
                            ${!isMyPost ? `<button onclick="window.openChat('${j.uid}')" class="flex-1 bg-black text-white py-1.5 md:py-2 rounded text-[10px] md:text-sm font-bold hover:bg-gray-800 flex items-center justify-center shadow-sm active:scale-95 transition-transform">محادثة</button>` : '<span class="flex-1 text-center text-[10px] md:text-sm font-bold text-gray-500 py-1.5 md:py-2 bg-gray-100 border border-gray-200 rounded">إعلانك الخاص</span>'}
                            ${hasPhone && !isMyPost ? `<a href="https://wa.me/20${j.contactPhone}" target="_blank" class="flex-1 bg-green-500 text-white py-1.5 md:py-2 rounded text-[10px] md:text-sm font-bold text-center hover:bg-green-600 flex items-center justify-center shadow-sm active:scale-95 transition-transform">WhatsApp</a>` : ''}
                        </div>
                    </div>
                </div>`);
        });
        list.innerHTML = html.join('');
    });
    globalUnsubs.push(unsubJobs);

    // --- Private Listeners (Only for logged-in users) ---
    if(isGuest) return;

    const chatQuery = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'chats'), where('users', 'array-contains', currentUser.uid));
    const unsubChats = onSnapshot(chatQuery, async (snap) => {
        myChatsCache =[];
        let chatNotifs =[];
        
        const missingUserIds = new Set();
        snap.forEach(d => {
            const c = d.data();
            if (c.deletedBy && c.deletedBy.includes(currentUser.uid)) return; 
            const otherId = c.users.find(u => u !== currentUser.uid);
            if (!allUsersCache.find(u => u.uid === otherId)) missingUserIds.add(otherId);
        });

        for (const uid of missingUserIds) {
            const userSnap = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', uid));
            if (userSnap.exists()) allUsersCache.push(userSnap.data());
        }

        snap.forEach(d => {
            const c = d.data();
            if (c.deletedBy && c.deletedBy.includes(currentUser.uid)) return; 
            myChatsCache.push({id: d.id, ...c});
            
            const otherId = c.users.find(u => u !== currentUser.uid);
            const otherUser = allUsersCache.find(u => u.uid === otherId) || { name: 'مستخدم' };
            
            const chatSeenKey = `chatSeen_${currentUser.uid}_${d.id}`;
            const lastSeenThisChat = parseInt(localStorage.getItem(chatSeenKey) || '0');
            const msgTime = new Date(c.lastUpdated || 0).getTime();
            
            if (msgTime > lastSeenThisChat && c.lastSenderId !== currentUser.uid) {
                chatNotifs.push({ id: d.id, time: msgTime, text: `💬 رسالة جديدة غير مقروءة من: ${otherUser.name}` });
            }
        });
        
        window.chatNotifsGlobal = chatNotifs;
        window.renderChatsUI(); 
        renderNotificationsList();
    });
    globalUnsubs.push(unsubChats);

    if(userProfile?.role === 'provider') {
        const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), where('type','==','service'));
        const unsubReqs = onSnapshot(q, (snap) => {
            const container = document.getElementById('matching-reqs-list'); 
            container.innerHTML = '';
            reqNotifs =[]; 
            const html =[]; 
            let hasNewMatching = false;
           
            if (userProfile.settings?.pauseRequests) {
                container.innerHTML = '<p class="text-[10px] text-gray-400 text-center py-6 font-bold col-span-full">أنت في وضع إيقاف تلقي الطلبات. يمكنك تفعيله من الإعدادات.</p>';
                renderNotificationsList();
                return;
            }

            snap.forEach(d => {
                const req = d.data();
                if(req.uid === currentUser.uid || req.profession !== userProfile.profession) return; 

                reqNotifs.push({ id: d.id, time: new Date(req.createdAt).getTime(), text: `🔔 يوجد طلب جديد لمهنتك (${req.profession}) من ${req.requesterName}` });
                const hasPhone = req.phone && req.phone.length > 5;
                const notifKey = `notifSeen_${currentUser.uid}`;
                const isNew = new Date(req.createdAt).getTime() > parseInt(localStorage.getItem(notifKey) || '0');
                if (isNew) hasNewMatching = true;

                const reqPhoto = req.requesterPhoto || 'https://via.placeholder.com/40';

                html.push(`
                    <div class="bg-white dark:bg-gray-800 p-2.5 md:p-4 rounded-2xl border-2 border-black dark:border-gray-500 relative">
                        ${isNew ? '<div class="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] md:text-[10px] px-2 py-0.5 font-bold rounded-full border border-white shadow-sm">جديد</div>' : ''}
                        <div class="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                            <img src="${window.getCloudinaryUrl(reqPhoto, 'thumb')}" loading="lazy" class="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-black dark:border-gray-500 shrink-0 mt-1">
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-[10px] md:text-xs"><span class="text-gray-500 font-bold">طالب الخدمة:</span> <strong class="text-black dark:text-white">${escapeHTML(req.requesterName)}</strong></span>
                                    <span class="text-[9px] md:text-[10px] text-gray-500 font-bold shrink-0">التاريخ: ${new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div class="text-[10px] md:text-xs mb-1"><span class="text-gray-500 font-bold">الوظيفة المطلوبة:</span> <strong class="text-black dark:text-white">${escapeHTML(req.profession)}</strong></div>
                                <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 md:p-2 text-[10px] md:text-xs max-h-20 overflow-y-auto custom-scrollbar">
                                    <span class="text-gray-500 font-bold">الوصف:</span> <span class="text-black dark:text-gray-200 leading-relaxed whitespace-pre-wrap">${escapeHTML(req.desc)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.openChat('${req.uid}')" class="flex-1 bg-black text-white py-1.5 md:py-2 rounded text-[10px] md:text-sm font-bold hover:bg-gray-800 shadow-sm flex justify-center items-center active:scale-95 transition-transform">محادثة</button>
                            ${hasPhone ? `<a href="https://wa.me/20${req.phone}" target="_blank" class="flex-1 bg-green-500 text-white py-1.5 md:py-2 rounded text-[10px] md:text-sm font-bold text-center hover:bg-green-600 shadow-sm flex items-center justify-center active:scale-95 transition-transform">WhatsApp</a>` : ''}
                        </div>
                    </div>
                `);
            });
           
            if(html.length === 0) container.innerHTML = '<p class="text-[10px] md:text-xs text-gray-400 text-center py-2 font-bold col-span-full">لا توجد طلبات تناسبك حالياً</p>';
            else container.innerHTML = html.join('');

            if (hasNewMatching) {
                const badge = document.getElementById('act-notif-badge');
                if(badge && document.getElementById('view-matching-reqs').classList.contains('hidden')) badge.classList.remove('hidden');
            }
            renderNotificationsList();
        });
        globalUnsubs.push(unsubReqs);
    }

    const qRev = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'reviews'), where('toId', '==', currentUser.uid));
    const unsubRevs = onSnapshot(qRev, (snap) => {
        reviewNotifs =[];
        snap.forEach(d => {
            const rev = d.data();
            reviewNotifs.push({ id: d.id, time: new Date(rev.createdAt).getTime(), text: `⭐ قام ${rev.fromName} بتقييمك بـ ${rev.stars} نجوم: "${rev.comment}"` });
        });
        renderNotificationsList();
    });
    globalUnsubs.push(unsubRevs);

    const unsubActivity = onSnapshot(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), where('uid','==',currentUser.uid)), (snap) => {
        const list = document.getElementById('my-activity'); list.innerHTML = '';
        const docs =[]; snap.forEach(d => docs.push({id:d.id, ...d.data()}));
        if(docs.length === 0) { list.innerHTML = '<div class="text-center py-4 rounded-xl col-span-full"><p class="text-[10px] md:text-xs text-gray-400 font-bold">لا يوجد نشاط مسجل</p></div>'; return; }
        docs.forEach((act) => {
            const el = document.createElement('div');
            const isJob = act.type === 'job';
            el.className = `bg-gray-50 dark:bg-gray-700 p-2 md:p-3 rounded-2xl flex items-start gap-2 border-2 border-black dark:border-gray-500`;
            el.innerHTML = `
                <div class="flex-1 min-w-0 pr-1">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-[10px] md:text-xs"><span class="text-gray-500 font-bold">النوع:</span> <strong class="text-black dark:text-white">${isJob ? 'طلب توظيف' : 'طلب خدمة'}</strong></span>
                        <span class="text-[9px] md:text-[10px] text-gray-500 font-bold shrink-0">التاريخ: ${new Date(act.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div class="text-[10px] md:text-xs mb-1"><span class="text-gray-500 font-bold">العنوان:</span> <strong class="text-black dark:text-white">${isJob ? escapeHTML(act.title) : escapeHTML(act.profession)}</strong></div>
                    <div class="text-[9px] md:text-[10px] text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-600 max-h-16 overflow-y-auto custom-scrollbar">
                        <span class="text-gray-500 font-bold">الوصف:</span> ${escapeHTML(act.desc) || 'لا يوجد'}
                    </div>
                </div>
                <button onclick="window.deleteRequest('${act.id}')" class="shrink-0 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white p-2 md:p-2.5 rounded-full w-10 h-10 md:w-12 md:h-12 shadow-sm mt-1 border border-red-200 hover:border-red-600 active:scale-90 transition-transform">
                    <svg class="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            `;
            list.appendChild(el);
        });
    });
    globalUnsubs.push(unsubActivity);
}

window.deleteRequest = async (id) => { if(confirm('حذف هذا النشاط؟')) await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'requests', id)); };

window.openUserProfilePage = async (userStr) => {
    const user = JSON.parse(decodeURIComponent(userStr));
    currentModalUserId = user.uid;
    
    document.getElementById('user-profile-img').src = window.getCloudinaryUrl(user.photoURL, 'medium');
    document.getElementById('user-profile-img').onclick = () => {
        document.getElementById('lightbox-img').src = window.getCloudinaryUrl(user.photoURL, 'original');
        document.getElementById('lightbox-modal').classList.remove('hidden');
    };

    document.getElementById('user-profile-name').innerText = escapeHTML(user.name);
    document.getElementById('user-profile-role').innerText = user.role === 'provider' ? escapeHTML(user.profession) : 'عميل';
    document.getElementById('user-profile-addr').innerText = `${escapeHTML(user.area) || ''} - ${escapeHTML(user.city) || ''}`;
    document.getElementById('user-profile-addr-detail').innerText = user.addressDetail ? escapeHTML(user.addressDetail) + '،' : 'لا توجد تفاصيل إضافية،';
    document.getElementById('user-profile-phone').innerText = (user.settings?.hidePhone) ? 'مخفي 🔒' : user.phone;
    document.getElementById('user-profile-gender').innerText = user.gender === 'male' ? 'ذكر' : 'أنثى';

    const actionsDiv = document.getElementById('user-profile-actions'); actionsDiv.innerHTML = '';
    if (!user.settings?.hidePhone) {
        const justPhone = user.phone.replace('+20', '');
        actionsDiv.innerHTML = `<a href="https://wa.me/20${justPhone}" target="_blank" class="flex-1 py-2 md:py-3 bg-green-500 text-white rounded-lg font-bold text-xs md:text-sm text-center hover:bg-green-600 flex items-center justify-center gap-1 active:scale-95 transition-transform">WhatsApp</a>`;
    }
    const chatBtn = document.createElement('button');
    chatBtn.className = "flex-1 py-2 md:py-3 bg-black text-white rounded-lg font-bold text-xs md:text-sm hover:bg-gray-800 active:scale-95 transition-transform flex items-center justify-center gap-1";
    chatBtn.innerText = "محادثة";
    chatBtn.onclick = () => { window.openChat(user.uid); };
    actionsDiv.appendChild(chatBtn);
   
    loadReviewsToPage(user.uid);
    window.navTo('user-profile');
    setTimeout(() => window.scrollTo(0, 0), 10);
};

async function loadReviewsToPage(targetId) {
     const list = document.getElementById('user-profile-reviews-list'); const starsDisplay = document.getElementById('user-profile-stars');
     list.innerHTML = '<p class="text-[10px] md:text-xs text-gray-400 text-center p-2">جاري التحميل...</p>';
     const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'reviews'), where('toId', '==', targetId));
     const snap = await getDocs(q);
     list.innerHTML = ''; let totalStars = 0;
     if(snap.empty) { list.innerHTML = '<p class="text-[10px] md:text-xs text-gray-400 text-center p-2 font-bold">لا توجد تقييمات حتى الآن</p>'; starsDisplay.innerText = '0.0'; }
     else {
         const reviews =[]; snap.forEach(d => reviews.push(d.data()));
         reviews.forEach((r) => {
             totalStars += parseInt(r.stars);
             const el = document.createElement('div');
             el.className = `bg-gray-50 dark:bg-gray-700/50 p-2 md:p-3 rounded mb-1 border border-gray-200 dark:border-gray-600`;
             el.innerHTML = `<div class="flex justify-between items-start"><div class="flex items-center gap-1"><img src="${window.getCloudinaryUrl(r.fromPhoto, 'thumb')}" loading="lazy" class="w-5 h-5 md:w-6 md:h-6 rounded-full border border-black object-cover"><span class="text-[10px] md:text-xs font-bold dark:text-white">${escapeHTML(r.fromName)}</span></div><span class="text-yellow-500 text-[10px] md:text-xs tracking-widest">${'★'.repeat(r.stars)}</span></div><p class="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">${escapeHTML(r.comment)}</p>`;
             list.appendChild(el);
         });
         starsDisplay.innerText = (totalStars / reviews.length).toFixed(1);
     }
}

window.submitReview = async () => {
    if(!window.requireAuth()) return;
    const btn = document.getElementById('btn-submit-rate'); const text = document.getElementById('review-text').value;
    const stars = document.querySelector('input[name="stars"]:checked')?.value;
    if(!stars || !currentChatId) return window.showToast('أدخل التقييم أولاً', 'error');
    btn.innerText = '...'; btn.disabled = true;
    try {
        const otherUserId = currentChatId.replace(currentUser.uid, '').replace('_', '');
        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'reviews'), {
            fromId: currentUser.uid, fromName: userProfile.name, fromPhoto: userProfile.photoURL,
            toId: otherUserId, stars, comment: text || '', createdAt: new Date().toISOString()
        });
        window.showToast('تم إرسال التقييم'); document.getElementById('rate-modal').classList.add('hidden'); document.getElementById('form-review').reset();
    } catch(e) { window.showToast('خطأ', 'error'); } finally { btn.innerText = 'إرسال'; btn.disabled = false; }
};

document.getElementById('form-message').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('msg-input'); const text = input.value.trim();
    if(!text || !currentChatId) return;
    input.value = '';
    try {
        const msgsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'chats', currentChatId, 'messages');
        await addDoc(msgsRef, { text: text, senderId: currentUser.uid, createdAt: new Date().toISOString() });
        
        await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'chats', currentChatId), { 
            lastMessage: text, 
            lastUpdated: new Date().toISOString(), 
            lastSenderId: currentUser.uid,
            deletedBy:[] 
        });
    } catch (err) { window.showToast('فشل إرسال الرسالة', 'error'); }
};

window.openChat = async (uid) => {
    if(!window.requireAuth()) return;
    document.getElementById('messages-container').innerHTML = '';
    
    currentChatId =[currentUser.uid, uid].sort().join('_');
    
    let user = allUsersCache.find(u => u.uid === uid);
    
    const updateChatHeader = (u) => {
        const name = u ? u.name : 'مستخدم';
        const photoURL = u ? u.photoURL : 'https://via.placeholder.com/40';
        const encodedUserStr = u ? encodeURIComponent(JSON.stringify(u)) : null;
        
        document.getElementById('chat-room-name').innerText = escapeHTML(name);
        document.getElementById('chat-room-avatar').src = window.getCloudinaryUrl(photoURL, 'thumb');
        document.getElementById('chat-header-profile').onclick = () => {
            if(encodedUserStr) window.openUserProfilePage(encodedUserStr);
        };
    };

    updateChatHeader(user);
    if (!user) {
        getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', uid)).then(snap => {
            if(snap.exists()) updateChatHeader(snap.data());
        });
    }
    
    const chatSeenKey = `chatSeen_${currentUser.uid}_${currentChatId}`;
    localStorage.setItem(chatSeenKey, Date.now().toString());
    
    window.navTo('chat-room');
    window.renderChatsUI(); 
   
    setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'chats', currentChatId), { users:[currentUser.uid, uid] }, { merge: true });

    const msgsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'chats', currentChatId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));
    
    if (chatListener) chatListener();
    
    const chatDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'chats', currentChatId));
    const chatData = chatDoc.exists() ? chatDoc.data() : {};
    const myDeletedAt = (chatData.deletedAt && chatData.deletedAt[currentUser.uid]) ? chatData.deletedAt[currentUser.uid] : 0;
    
    chatListener = onSnapshot(q, (snap) => {
        const box = document.getElementById('messages-container'); box.innerHTML = '';
        const html =[];
        snap.forEach(d => {
            const m = d.data(); 
            const msgTime = new Date(m.createdAt).getTime();
            
            if (msgTime <= myDeletedAt) return;

            const isMe = m.senderId === currentUser.uid;
            const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}) : '';
            
            html.push(`
                <div class="flex ${isMe?'justify-end':'justify-start'} w-full">
                    <div class="max-w-[85%] p-2 md:p-3 rounded-lg text-xs md:text-sm shadow-[2px_2px_0px_#000] flex flex-col ${isMe?'bg-black text-white':'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-black'}">
                        <span>${escapeHTML(m.text)}</span>
                        <span class="text-[8px] md:text-[10px] mt-1 opacity-70 text-left" dir="ltr">${timeStr}</span>
                    </div>
                </div>
            `);
        });
        box.innerHTML = html.join(''); box.scrollTop = box.scrollHeight;
        if (navStack[navStack.length-1] === 'chat-room') localStorage.setItem(chatSeenKey, Date.now().toString());
    });
};

window.confirmDeleteChat = async () => {
    if(!currentChatId) return;
    window.showLoader();
    try {
        await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'chats', currentChatId), {
            deletedBy: arrayUnion(currentUser.uid),
            [`deletedAt.${currentUser.uid}`]: new Date().getTime()
        });
        
        document.getElementById('delete-chat-modal').classList.add('hidden');
        window.navTo('chat');
        window.showToast('تم حذف المحادثة من قائمتك');
    } catch(e) { window.showToast('خطأ في الحذف', 'error'); }
    window.hideLoader();
};

window.applyFilter = () => {
    document.getElementById('filter-modal-wrap').classList.add('hidden');
    const currentPage = navStack[navStack.length-1];
    if (currentPage === 'category-details') {
        window.filterCategory();
    } else {
        if (currentPage === 'home') window.navTo('directory');
        window.filterDirectory();
    }
};

window.clearFilter = () => {
    document.getElementById('filter-center').value = '';
    makeCustomDropdown('filter-center', 'المركز...');
    
    document.getElementById('filter-village').innerHTML = '<option value="">القرية...</option>';
    makeCustomDropdown('filter-village', 'القرية...');
    
    const currentPage = navStack[navStack.length-1];
    if (currentPage === 'category-details') {
        document.getElementById('filter-prof').value = currentActiveCategory;
        makeCustomDropdown('filter-prof', 'اختر المهنة...');
        document.getElementById('cat-search').value = '';
        window.filterCategory();
    } else {
        document.getElementById('filter-prof').value = '';
        makeCustomDropdown('filter-prof', 'اختر المهنة...');
        document.getElementById('dir-search').value = '';
        window.filterDirectory();
    }
    document.getElementById('filter-modal-wrap').classList.add('hidden');
};

window.filterDirectory = () => {
    const term = document.getElementById('dir-search').value.trim();
    const center = document.getElementById('filter-center')?.value || '';
    const village = document.getElementById('filter-village')?.value || '';
    const prof = document.getElementById('filter-prof')?.value || '';
    
    let filtered = allUsersCache;
    
    if(center) filtered = filtered.filter(u => u.city === center);
    if(village) filtered = filtered.filter(u => u.area === village);
    if(prof) filtered = filtered.filter(u => u.profession === prof);
    
    if(term) {
        filtered = filtered.filter(u => u.name.includes(term) || (u.profession && u.profession.includes(term)));
    }
    
    filteredDirItems = Array.from(new Map(filtered.map(u =>[u.uid, u])).values());
    dirRenderedCount = 0;
    document.getElementById('dir-list').innerHTML = '';
    renderMoreDirectory();
};

function renderMoreDirectory() {
    const cont = document.getElementById('dir-list');
    const nextBatch = filteredDirItems.slice(dirRenderedCount, dirRenderedCount + ITEMS_PER_PAGE);
    if(nextBatch.length === 0) return;
    
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = nextBatch.map(u => createUserCard(u)).join('');
    while (tempDiv.firstChild) { fragment.appendChild(tempDiv.firstChild); }
    
    cont.appendChild(fragment);
    dirRenderedCount += ITEMS_PER_PAGE;
}

window.filterCategory = () => {
    const term = document.getElementById('cat-search').value.trim();
    const center = document.getElementById('filter-center')?.value || '';
    const village = document.getElementById('filter-village')?.value || '';
    const prof = document.getElementById('filter-prof')?.value || '';
    
    const targetProf = prof || currentActiveCategory;
    
    let filtered = allUsersCache.filter(u => u.profession === targetProf);
    
    if(center) filtered = filtered.filter(u => u.city === center);
    if(village) filtered = filtered.filter(u => u.area === village);
    if(term) {
        filtered = filtered.filter(u => u.name.includes(term) || (u.area && u.area.includes(term)) || (u.city && u.city.includes(term)));
    }
    
    filteredCatItems = Array.from(new Map(filtered.map(u =>[u.uid, u])).values());
    catRenderedCount = 0;
    const cont = document.getElementById('cat-list-container');
    cont.innerHTML = '';
    
    if(filteredCatItems.length === 0) { 
        cont.innerHTML = `<div class="text-center py-10 col-span-full"><p class="text-gray-500 font-bold text-[10px] md:text-xs">لا توجد نتائج</p></div>`; 
        return; 
    }
    renderMoreCategory();
};

function renderMoreCategory() {
    const cont = document.getElementById('cat-list-container');
    const nextBatch = filteredCatItems.slice(catRenderedCount, catRenderedCount + ITEMS_PER_PAGE);
    if(nextBatch.length === 0) return;
    
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = nextBatch.map(u => createUserCard(u)).join('');
    while (tempDiv.firstChild) { fragment.appendChild(tempDiv.firstChild); }
    
    cont.appendChild(fragment);
    catRenderedCount += ITEMS_PER_PAGE;
}

let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
                if(!document.getElementById('page-directory').classList.contains('hidden')) renderMoreDirectory();
                if(!document.getElementById('page-category-details').classList.contains('hidden')) renderMoreCategory();
            }
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

window.openCategory = (profName) => {
    currentActiveCategory = profName;
    window.navTo('category-details');
    document.getElementById('page-title').innerText = profName;
    document.getElementById('cat-search').value = '';
    document.getElementById('filter-prof').value = profName;
    makeCustomDropdown('filter-prof', 'اختر المهنة...');
    window.filterCategory();
};

function createUserCard(u) {
    const userStr = encodeURIComponent(JSON.stringify(u));
    const joinDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر';
    const locationStr =[u.area, u.city].filter(Boolean).join(' - ');
    const finalLocation = locationStr ? locationStr : 'غير مكتمل';
    const isClient = u.role === 'client';
    const profStr = (!isClient && u.profession) ? u.profession : (!isClient ? 'غير مكتمل' : 'عميل');
    
    return `
    <div class="fast-render-card">
        <div onclick="window.openUserProfilePage('${userStr}')" class="bg-white dark:bg-gray-800 p-2.5 md:p-4 rounded-2xl border-2 border-black dark:border-gray-500 cursor-pointer flex items-start gap-2.5 md:gap-4 active:scale-[0.98] transition-transform overflow-hidden">
            <img src="${window.getCloudinaryUrl(u.photoURL, 'thumb')}" loading="lazy" class="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border border-black dark:border-gray-400 shrink-0 bg-gray-100 mt-1">
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-[10px] md:text-sm"><span class="text-gray-500 font-bold">${isClient ? 'اسم العميل:' : 'الاسم:'}</span> <strong class="text-black dark:text-white">${escapeHTML(u.name)}</strong></span>
                    <span class="text-[9px] md:text-xs text-gray-500 font-bold shrink-0">انضمام: ${joinDate}</span>
                </div>
                <div class="text-[10px] md:text-xs mb-1"><span class="text-gray-500 font-bold">الوظيفة:</span> <strong class="text-black dark:text-white">${escapeHTML(profStr)}</strong></div>
                <div class="text-[10px] md:text-xs"><span class="text-gray-500 font-bold">العنوان:</span> <strong class="text-gray-800 dark:text-gray-200">${escapeHTML(finalLocation)}</strong></div>
            </div>
        </div>
    </div>`;
}

window.saveProfileChanges = async () => {
    try {
        window.showLoader();
        let finalPhotoURL = userProfile.photoURL;
        if (tempSelectedFile) { 
            finalPhotoURL = await window.uploadToCloudinary(tempSelectedFile); 
            tempSelectedFile = null; 
        }

        const newName = document.getElementById('edit-name').value;
        const newPhone = `+20${document.getElementById('edit-phone').value}`;
        const newCity = document.getElementById('edit-center').value;
        const newArea = document.getElementById('edit-village').value;
        const newAddressDetail = document.getElementById('edit-address-detail').value.trim();

        await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', currentUser.uid), {
            name: newName, phone: newPhone,
            city: newCity, area: newArea, 
            addressDetail: newAddressDetail, photoURL: finalPhotoURL
        });

        userProfile.name = newName;
        userProfile.phone = newPhone;
        userProfile.city = newCity;
        userProfile.area = newArea;
        userProfile.addressDetail = newAddressDetail;
        userProfile.photoURL = finalPhotoURL;

        document.getElementById('prof-name-view').innerText = escapeHTML(newName);
        document.getElementById('prof-address-view').innerText = `${escapeHTML(newArea) || ''} - ${escapeHTML(newCity) || ''}`;
        document.getElementById('prof-img-view').src = window.getCloudinaryUrl(finalPhotoURL, 'medium');
        document.getElementById('header-avatar').src = window.getCloudinaryUrl(finalPhotoURL, 'thumb');
        
        window.showToast('تم الحفظ بنجاح');
        window.hideLoader();
        window.goBack(); 

    } catch (e) { 
        window.showToast('حدث خطأ أثناء الحفظ', 'error'); 
        window.hideLoader(); 
    }
};

window.saveSettings = async () => {
    try {
        const newSettings = {
            notifEnabled: document.getElementById('toggle-notif').checked,
            hidePhone: document.getElementById('toggle-hide-phone').checked,
            hideProfile: document.getElementById('toggle-hide-profile').checked,
            pauseRequests: document.getElementById('toggle-pause-reqs').checked,
            darkMode: document.getElementById('theme-toggle').checked
        };
        
        await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', currentUser.uid), { settings: newSettings });
        
        userProfile.settings = newSettings;
        
        window.showToast('تم الحفظ بنجاح'); window.goBack();
    } catch (e) { window.showToast('خطأ', 'error'); }
};

window.switchAddMode = (mode) => {
    const btnReq = document.getElementById('btn-add-req'); const btnJob = document.getElementById('btn-add-job');
    const formReq = document.getElementById('form-req'); const formJob = document.getElementById('form-job');
    if (mode === 'req') {
        formReq.classList.remove('hidden'); formJob.classList.add('hidden');
        btnReq.className = "flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold border-2 border-black bg-black text-white transition-colors";
        btnJob.className = "flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold border-2 border-gray-300 bg-white text-gray-500 transition-colors";
    } else {
        formReq.classList.add('hidden'); formJob.classList.remove('hidden');
        btnJob.className = "flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold border-2 border-black bg-black text-white transition-colors";
        btnReq.className = "flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold border-2 border-gray-300 bg-white text-gray-500 transition-colors";
    }
};

document.getElementById('form-job').onsubmit = async (e) => {
    e.preventDefault();
    try {
        let title = document.getElementById('job-title-select').value;
        if (title === 'أخرى') title = document.getElementById('job-custom-title').value;
        if(!title) throw new Error('أدخل المسمى الوظيفي');

        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), {
            type: 'job', title: title, salary: document.getElementById('job-salary').value, hours: document.getElementById('job-hours').value,
            shift: document.getElementById('job-shift').value, jobType: document.getElementById('job-type').value, desc: document.getElementById('job-desc').value,
            contactPhone: document.getElementById('job-phone').value, posterName: userProfile.name, posterPhoto: userProfile.photoURL,
            posterPhone: userProfile.phone, uid: currentUser.uid, createdAt: new Date().toISOString()
        });
        window.showToast('تم النشر بنجاح'); window.clearForms(); window.goBack();
    } catch(err) { window.showToast(err.message || 'حدث خطأ', 'error'); }
};

document.getElementById('form-req').onsubmit = async (e) => {
    e.preventDefault();
    try {
        let reqProf = document.getElementById('req-prof').value;
        if(reqProf === 'خدمات أخرى') reqProf = document.getElementById('req-custom-prof').value.trim();
        if(!reqProf) throw new Error('اكتب اسم الخدمة');

        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), {
            type: 'service', profession: reqProf, desc: document.getElementById('req-desc').value,
            phone: document.getElementById('req-phone').value, uid: currentUser.uid, requesterName: userProfile.name, requesterPhoto: userProfile.photoURL,
            createdAt: new Date().toISOString()
        });
        window.showToast('تم النشر بنجاح'); window.clearForms(); window.goBack();
    } catch(err) { window.showToast(err.message || 'خطأ', 'error'); }
};

window.switchHomeTab = (tab) => { 
    window.scrollTo(0,0); 
    if (tab === 'services') { 
        document.getElementById('view-services').classList.remove('hidden'); 
        document.getElementById('view-jobs').classList.add('hidden'); 
        document.getElementById('prof-search-box').classList.remove('hidden'); 
        document.getElementById('tab-home-serv').classList.add('bg-black', 'text-white'); 
        document.getElementById('tab-home-serv').classList.remove('text-gray-500'); 
        document.getElementById('tab-home-jobs').classList.remove('bg-black', 'text-white'); 
        document.getElementById('tab-home-jobs').classList.add('text-gray-500'); 
    } else { 
        document.getElementById('view-services').classList.add('hidden'); 
        document.getElementById('view-jobs').classList.remove('hidden'); 
        document.getElementById('prof-search-box').classList.add('hidden'); 
        document.getElementById('tab-home-jobs').classList.add('bg-black', 'text-white'); 
        document.getElementById('tab-home-jobs').classList.remove('text-gray-500'); 
        document.getElementById('tab-home-serv').classList.remove('bg-black', 'text-white'); 
        document.getElementById('tab-home-serv').classList.add('text-gray-500'); 
    } 
};

window.logout = async () => { 
    window.showLoader();
    
    globalUnsubs.forEach(u => u());
    globalUnsubs =[];
    
    document.getElementById('notif-list').innerHTML = '';
    document.getElementById('chat-history-list').innerHTML = '';
    document.getElementById('my-activity').innerHTML = '';
    document.getElementById('matching-reqs-list').innerHTML = '';
    document.getElementById('dir-list').innerHTML = '';
    document.getElementById('cat-list-container').innerHTML = '';
    document.getElementById('messages-container').innerHTML = '';

    document.getElementById('notif-dot').classList.add('hidden');
    document.getElementById('chat-nav-dot').classList.add('hidden');
    document.getElementById('act-notif-badge').classList.add('hidden');

    userProfile = null; currentUser = null; allUsersCache = []; myChatsCache =[];
    reqNotifs =[]; reviewNotifs =[]; window.chatNotifsGlobal = []; navStack =['home'];
    isGuest = true;
    currentActiveCategory = "";
    
    history.replaceState({ pageId: 'home' }, "", window.location.pathname);
    
    await signOut(auth); 
};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => console.log('تم تفعيل الكاش بنجاح')).catch(err => console.log('فشل تفعيل الكاش:', err));
    });
}