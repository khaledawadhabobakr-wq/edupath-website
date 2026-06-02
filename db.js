/* ═══════════════════════════════════════════════════════
   EduPath — Supabase Cloud DB Layer
   يستبدل localStorage بقاعدة بيانات مشتركة على السحابة
   كل جهاز/متصفح يشوف نفس البيانات تلقائياً
═══════════════════════════════════════════════════════ */

const _DB_URL = 'https://mtmgffebrdxqucoiwltx.supabase.co';
const _DB_KEY = 'sb_publishable_NHxyDbGxxUS7rul4Fi3UUg__XnXxgnk';

// المفاتيح التي تُزامَن مع السحابة (مشتركة بين كل الأجهزة)
const DB_SYNC_KEYS = [
  'ep_scholarships', 'ep_blog_posts', 'ep_students', 'ep_applications',
  'ep_consultations', 'ep_institutes', 'ep_settings', 'edupath_settings',
  'ep_uni_edits', 'ep_uni_logos', 'ep_uni_videos', 'ep_extra_unis', 'ep_media'
];

// مفاتيح تبقى محلية فقط (خاصة بالجهاز)
// ep_student_session, lang, uniId

let _client = null;

function _getSB() {
  if (_client) return _client;
  _client = window.supabase.createClient(_DB_URL, _DB_KEY);
  return _client;
}

/* ── سحب كل البيانات من السحابة إلى localStorage ── */
async function _pullFromCloud() {
  try {
    const sb = _getSB();
    const { data, error } = await sb
      .from('store')
      .select('key, value')
      .in('key', DB_SYNC_KEYS);

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

/* ── التهيئة: اسحب من السحابة ثم أطلق حدث "db-ready" ── */
window.DB_READY = false;
window.dbReady = (async function _init() {
  await _pullFromCloud();
  window.DB_READY = true;
  window.dispatchEvent(new CustomEvent('db-ready'));
})();

/* ── دالة مساعدة: رفع كل localStorage إلى السحابة دفعة واحدة ── */
window.dbMigrateAll = async function() {
  const sb = _getSB();
  const rows = [];
  DB_SYNC_KEYS.forEach(key => {
    const val = localStorage._set ? localStorage.getItem(key) : null;
    if (val) rows.push({ key, value: val, updated_at: new Date().toISOString() });
  });
  if (!rows.length) { console.log('Nothing to migrate'); return; }
  const { error } = await sb.from('store').upsert(rows, { onConflict: 'key' });
  if (error) console.error('Migration failed:', error);
  else console.log(`✅ Migrated ${rows.length} keys to cloud`);
};
