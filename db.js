/* ═══════════════════════════════════════════════════════
   EduPath — Supabase Cloud DB Layer  (v2)
   يستبدل localStorage بقاعدة بيانات مشتركة على السحابة
   كل جهاز/متصفح يشوف نفس البيانات تلقائياً

   v2 fixes:
   • أضيفت المفاتيح الناقصة (ep_hidden_unis, ep_faq, ep_services,
     ep_steps, ep_testimonials, ep_courses) — كانت تعديلات الأدمن
     عليها لا تُرفع للسحابة إطلاقاً
   • بيانات الطلاب/الطلبات تُسحب فقط في admin.html و apply.html
     (خصوصية + سرعة تحميل أعلى للصفحات العامة)
   • dbSubmit(): إضافة عنصر لمصفوفة مع دمج آمن مع السحابة
     بدل الكتابة فوق بيانات الأجهزة الأخرى
═══════════════════════════════════════════════════════ */

const _DB_URL = 'https://mtmgffebrdxqucoiwltx.supabase.co';
const _DB_KEY = 'sb_publishable_NHxyDbGxxUS7rul4Fi3UUg__XnXxgnk';

/* ── محتوى عام: تسحبه كل الصفحات ── */
const DB_PUBLIC_KEYS = [
  'ep_scholarships', 'ep_blog_posts', 'ep_institutes',
  'ep_settings', 'edupath_settings',
  'ep_uni_edits', 'ep_uni_logos', 'ep_uni_videos', 'ep_extra_unis',
  'ep_hidden_unis', 'ep_faq', 'ep_services', 'ep_steps',
  'ep_testimonials', 'ep_courses'
];

/* ── بيانات حساسة/ثقيلة: تُسحب فقط حيث تُستخدم ── */
const DB_PRIVATE_KEYS = ['ep_students', 'ep_applications', 'ep_consultations', 'ep_media'];

/* ── كل المفاتيح التي تُرفع للسحابة عند الحفظ ── */
const DB_SYNC_KEYS = [...DB_PUBLIC_KEYS, ...DB_PRIVATE_KEYS];

/* مفاتيح تبقى محلية فقط (خاصة بالجهاز):
   ep_student_session, ep_session, ep_pw, lang, uniId */

let _client = null;

function _getSB() {
  if (_client) return _client;
  if (!window.supabase) throw new Error('Supabase SDK not loaded');
  _client = window.supabase.createClient(_DB_URL, _DB_KEY);
  return _client;
}

/* ── أي مفاتيح تحتاجها هذه الصفحة؟ ── */
function _keysForPage() {
  const p = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (p === 'admin.html') return DB_SYNC_KEYS;
  if (p === 'apply.html') return [...DB_PUBLIC_KEYS, 'ep_students', 'ep_applications'];
  return DB_PUBLIC_KEYS;
}

/* ── سحب بيانات الصفحة من السحابة إلى localStorage ── */
async function _pullFromCloud() {
  try {
    const sb = _getSB();
    const { data, error } = await sb
      .from('store')
      .select('key, value')
      .in('key', _keysForPage());

    if (error) throw error;

    if (data && data.length > 0) {
      data.forEach(row => {
        if (row.value !== null && row.value !== undefined) {
          localStorage._set(row.key, row.value);
        }
      });
      console.log(`✅ EduPath DB: ${data.length} keys loaded from cloud`);
    } else {
      console.log('ℹ️ EduPath DB: No cloud data yet — using local defaults');
    }
  } catch (err) {
    console.warn('⚠️ EduPath DB: Cloud sync failed, using local data:', err.message);
  }
}

/* ── رفع قيمة واحدة إلى السحابة ── */
async function _pushToCloud(key, value) {
  try {
    const sb = _getSB();
    const { error } = await sb
      .from('store')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
  } catch (err) {
    console.warn(`⚠️ EduPath DB: Failed to save "${key}" to cloud:`, err.message);
  }
}

/* ── Override localStorage.setItem لمزامنة السحابة تلقائياً ── */
(function _patchStorage() {
  const orig = localStorage.setItem.bind(localStorage);
  localStorage._set = orig; // نسخة أصلية للاستخدام الداخلي

  localStorage.setItem = function(key, value) {
    orig(key, value); // دائماً احفظ محلياً أولاً
    if (DB_SYNC_KEYS.includes(key)) {
      _pushToCloud(key, value); // ثم ارفع للسحابة في الخلفية
    }
  };
})();

/* ── إضافة عنصر لمصفوفة مخزّنة، مع دمج آمن مع نسخة السحابة ──
   تستخدمها نماذج الزوار (استشارات، تسجيل طلاب، طلبات تقديم)
   حتى لا يمسح جهازٌ بياناتِ جهازٍ آخر أُرسلت في نفس الوقت. */
window.dbSubmit = async function(key, item) {
  // 1) إضافة محلية فورية (بدون رفع) حتى تبقى الواجهة سريعة
  let local = [];
  try { local = JSON.parse(localStorage.getItem(key) || '[]') || []; } catch {}
  if (item) local.push(item);
  localStorage._set(key, JSON.stringify(local));

  // 2) في الخلفية: اجلب أحدث نسخة من السحابة وادمج بالـ id ثم ارفع
  try {
    const sb = _getSB();
    const { data, error } = await sb.from('store').select('value').eq('key', key).maybeSingle();
    if (error) throw error;

    let merged = [];
    if (data && data.value) {
      try { merged = JSON.parse(data.value) || []; } catch {}
    }
    const ids = new Set(merged.map(x => x && x.id));
    local.forEach(x => { if (x && x.id && !ids.has(x.id)) merged.push(x); });

    const value = JSON.stringify(merged);
    localStorage._set(key, value);
    await sb.from('store').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return true;
  } catch (err) {
    console.warn(`⚠️ EduPath DB: dbSubmit("${key}") cloud merge failed:`, err.message);
    return false; // البيانات محفوظة محلياً على الأقل
  }
};

/* ── مؤشر مزامنة خفيف أعلى الصفحة (يختفي عند الجاهزية) ── */
function _syncBar(show) {
  let bar = document.getElementById('dbSyncBar');
  if (show) {
    if (bar || !document.body) return;
    bar = document.createElement('div');
    bar.id = 'dbSyncBar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:3px;z-index:9999;background:linear-gradient(90deg,transparent,#0a5c8a,#f59e0b,transparent);background-size:200% 100%;animation:dbSync 1s linear infinite;pointer-events:none';
    const st = document.createElement('style');
    st.textContent = '@keyframes dbSync{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    bar.appendChild(st);
    document.body.appendChild(bar);
  } else if (bar) {
    bar.remove();
  }
}

/* ── التهيئة: اسحب من السحابة ثم أطلق حدث "db-ready" ── */
window.DB_READY = false;
window.dbReady = (async function _init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (!window.DB_READY) _syncBar(true); });
  } else if (!window.DB_READY) {
    _syncBar(true);
  }
  await _pullFromCloud();
  window.DB_READY = true;
  _syncBar(false);
  window.dispatchEvent(new CustomEvent('db-ready'));
})();

/* ── دالة مساعدة: رفع كل localStorage إلى السحابة دفعة واحدة ── */
window.dbMigrateAll = async function() {
  const sb = _getSB();
  const rows = [];
  DB_SYNC_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) rows.push({ key, value: val, updated_at: new Date().toISOString() });
  });
  if (!rows.length) { console.log('Nothing to migrate'); return; }
  const { error } = await sb.from('store').upsert(rows, { onConflict: 'key' });
  if (error) console.error('Migration failed:', error);
  else console.log(`✅ Migrated ${rows.length} keys to cloud`);
};
