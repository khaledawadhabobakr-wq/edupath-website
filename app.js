/* ═══════════════ I18N ENGINE ═══════════════ */
const LANG_META = {
  en: { flag: "🇬🇧", label: "EN", dir: "ltr" },
  ar: { flag: "🇸🇦", label: "AR", dir: "rtl" },
  ja: { flag: "🇯🇵", label: "JA", dir: "ltr" },
  ko: { flag: "🇰🇷", label: "KO", dir: "ltr" },
  ru: { flag: "🇷🇺", label: "RU", dir: "ltr" }
};
let currentLang = localStorage.getItem("lang") || "en";

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function applyLang() {
  const meta = LANG_META[currentLang];
  document.documentElement.lang = currentLang;
  document.documentElement.dir = meta.dir;
  document.getElementById("curFlag").textContent = meta.flag;
  document.getElementById("curLang").textContent = meta.label;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });

  document.querySelectorAll(".lang-option").forEach(o => {
    o.classList.toggle("active", o.getAttribute("onclick").includes("'" + currentLang + "'"));
  });

  buildTopUnis();
  renderUnis();
  runCalc();
  buildFAQ();
  updateDuration(calcState.duration);
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.getElementById("langMenu").classList.remove("open");
  applyLang();
}

function toggleLangMenu(e) {
  e.stopPropagation();
  document.getElementById("langMenu").classList.toggle("open");
}
document.addEventListener("click", () => document.getElementById("langMenu").classList.remove("open"));

/* ═══════════════ NAV / MOBILE MENU ═══════════════ */
function toggleMenu() { document.getElementById("mobileMenu").classList.toggle("open"); }

/* ═══════════════ UNIVERSITIES DIRECTORY ═══════════════ */
function uniLogo(u, size) {
  // Admin logo override (URL or base64)
  try {
    const logos = JSON.parse(localStorage.getItem('ep_uni_logos') || '{}');
    if (logos[u.id]) return `<img src="${logos[u.id]}" width="${size}" height="${size}" alt="" style="object-fit:contain;border-radius:8px">`;
  } catch {}
  if (!u.website) return `<span style="font-size:${Math.round(size*0.55)}px">${u.icon}</span>`;
  try {
    const domain = new URL(u.website).hostname.replace(/^www\./, '');
    const fallback = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
    return `<img src="https://logo.clearbit.com/${domain}" width="${size}" height="${size}" alt="" style="object-fit:contain;border-radius:8px" onerror="this.onerror=null;this.src='${fallback}'">`;
  } catch { return `<span style="font-size:${Math.round(size*0.55)}px">${u.icon}</span>`; }
}

let activeFilter = "all";
const SHOW_LIMIT = 12;
let showAll = false;

function setFilter(f) {
  activeFilter = f;
  showAll = false;
  document.querySelectorAll(".filter-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.filter === f));
  renderUnis();
}

function toggleShowAll() {
  showAll = !showAll;
  renderUnis();
  if (!showAll) document.getElementById("universities").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderUnis() {
  const grid = document.getElementById("unisGrid");
  const countEl = document.getElementById("uniCount");
  const moreWrap = document.getElementById("uniMoreWrap");
  if (!grid) return;

  // ── Admin: merge extra unis + filter hidden ones ──
  let _hidden = [], _extra = [];
  try { _hidden = JSON.parse(localStorage.getItem('ep_hidden_unis') || '[]'); } catch {}
  try { _extra  = JSON.parse(localStorage.getItem('ep_extra_unis')  || '[]'); } catch {}
  const allUnis = [...UNIVERSITIES];
  _extra.forEach(u => { if (!allUnis.find(x => x.id === u.id)) allUnis.push(u); });

  const searchEl = document.getElementById("uniSearch");
  const q = (searchEl ? searchEl.value : "").toLowerCase().trim();

  const filtered = allUnis.filter(u => {
    if (_hidden.includes(u.id)) return false;
    if (activeFilter !== "all" && u.type !== activeFilter) return false;
    if (!q) return true;
    const hay = (u.name + " " + u.city + " " + u.state + " " + u.fields.join(" ")).toLowerCase();
    return hay.includes(q);
  });

  if (filtered.length === 0) {
    countEl.textContent = t("uni.noResults");
    grid.innerHTML = `<div class="uni-empty">${t("uni.noResults")}</div>`;
    if (moreWrap) moreWrap.style.display = "none";
    return;
  }

  const visible = (showAll || q) ? filtered : filtered.slice(0, SHOW_LIMIT);
  const totalVisible = allUnis.filter(u => !_hidden.includes(u.id)).length;

  countEl.textContent = t("uni.results")
    .replace("{n}", visible.length)
    .replace("{total}", totalVisible);

  grid.innerHTML = visible.map(u => {
    const badgeClass = "badge-" + u.type;
    const qsBadge = u.qs ? `<span class="uni-badge badge-qs">${t("uni.ranked").replace("{rank}", "#" + u.qs)}</span>` : "";
    const fields = u.fields.map(f => `<span class="field-chip">${f}</span>`).join("");
    return `
      <a href="university.html" onclick="localStorage.setItem('uniId','${u.id}')" class="uni-card" style="text-decoration:none;color:inherit">
        <div class="uni-card-top">
          <div class="uni-logo">${uniLogo(u, 46)}</div>
          <div class="uni-head">
            <div class="uni-name">${u.name}</div>
            <div class="uni-loc">📍 ${u.city}, ${u.state}</div>
          </div>
        </div>
        <div class="uni-badges">
          <span class="uni-badge ${badgeClass}">${t("type." + u.type)}</span>
          ${qsBadge}
        </div>
        <div class="uni-fields">${fields}</div>
        <div class="uni-meta">
          <div><span class="label">${t("uni.established")}</span><span class="val">${u.est}</span></div>
          <div style="text-align:end"><span class="label">${t("uni.tuition")}</span><span class="val">${u.tuition}</span></div>
        </div>
      </a>`;
  }).join("");

  if (moreWrap) {
    const hasMore = !q && filtered.length > SHOW_LIMIT;
    moreWrap.style.display = hasMore ? "flex" : "none";
    if (hasMore) {
      const btn = moreWrap.querySelector("button");
      const remaining = filtered.length - SHOW_LIMIT;
      btn.textContent = showAll
        ? t("uni.showLess")
        : t("uni.showMore").replace("{n}", remaining);
    }
  }
}

/* ═══════════════ CONSULTATION FORM ═══════════════ */
function goFormStep2() {
  const name = document.getElementById("cfName").value.trim();
  const nat  = document.getElementById("cfNationality").value;
  if (!name) { document.getElementById("cfName").focus(); return; }
  document.getElementById("formStep1").style.display = "none";
  document.getElementById("formStep2").style.display = "block";
}
function goFormStep1() {
  document.getElementById("formStep2").style.display = "none";
  document.getElementById("formStep1").style.display = "block";
}
function submitConsultForm() {
  const name   = document.getElementById("cfName").value.trim();
  const nat    = document.getElementById("cfNationality").value;
  const level  = document.getElementById("cfLevel").value;
  const field  = document.getElementById("cfField").value;
  const email  = document.getElementById("cfEmail").value.trim();
  const phone  = document.getElementById("cfPhone").value.trim();
  const msg    = document.getElementById("cfMsg").value.trim();
  if (!email && !phone) { document.getElementById("cfPhone").focus(); return; }
  const body = [
    `Hello EduPath! I'd like to book a free consultation.`,
    ``,
    `Name: ${name}`,
    `Nationality: ${nat || "—"}`,
    `Education Level: ${level || "—"}`,
    `Intended Field: ${field || "—"}`,
    `Email: ${email || "—"}`,
    msg ? `Message: ${msg}` : ""
  ].filter(Boolean).join("\n");
  window.open("https://wa.me/60123456789?text=" + encodeURIComponent(body), "_blank");

  // ── Save consultation to admin panel ──
  try {
    const consult = {
      id: 'CON-' + new Date().getFullYear().toString().slice(-2) + String(new Date().getMonth()+1).padStart(2,'0') + '-' + Math.random().toString(36).slice(2,6).toUpperCase(),
      name, nationality: nat, level, field, email, phone, message: msg,
      status: 'new',
      adminNotes: '',
      createdAt: new Date().toISOString()
    };
    const list = JSON.parse(localStorage.getItem('ep_consultations') || '[]');
    list.push(consult);
    localStorage.setItem('ep_consultations', JSON.stringify(list));
  } catch(e) { /* silent — localStorage might be full */ }

  document.getElementById("formStep2").style.display = "none";
  document.getElementById("formStep3").style.display = "block";
}
function resetForm() {
  ["cfName","cfEmail","cfPhone","cfMsg"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
  ["cfNationality","cfLevel","cfField"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
  document.getElementById("formStep3").style.display = "none";
  document.getElementById("formStep1").style.display = "block";
}

/* ═══════════════ TOP RANKED STRIP ═══════════════ */
function buildTopUnis() {
  const strip = document.getElementById("topUnisScroll");
  if (!strip) return;
  let _hidden = [], _extra = [];
  try { _hidden = JSON.parse(localStorage.getItem('ep_hidden_unis') || '[]'); } catch {}
  try { _extra  = JSON.parse(localStorage.getItem('ep_extra_unis')  || '[]'); } catch {}
  const allUnis = [...UNIVERSITIES];
  _extra.forEach(u => { if (!allUnis.find(x => x.id === u.id)) allUnis.push(u); });
  const ranked = allUnis.filter(u => u.qs && !_hidden.includes(u.id)).sort((a,b) => a.qs - b.qs).slice(0, 10);
  strip.innerHTML = ranked.map(u => {
    const logo = uniLogo(u, 52);
    const shortName = u.name.replace(/\s*\(.*\)/, "").replace("Universiti ", "").replace("University ", "").replace("Malaysia", "M'sia");
    return `<a href="university.html" onclick="localStorage.setItem('uniId','${u.id}')" class="top-uni-chip">
      <div class="top-uni-logo">${logo}</div>
      <div class="top-uni-name">${shortName}</div>
      <div class="top-uni-qs">QS #${u.qs}</div>
    </a>`;
  }).join("");
}

/* ═══════════════ COST CALCULATOR ═══════════════ */
const CALC_DATA = {
  tuition: { public: 18000, private: 35000, branch: 52000 },
  accommodation: { kl: { budget: 5400, moderate: 8400, comfortable: 13200 }, penang: { budget: 4800, moderate: 7200, comfortable: 10800 }, johor: { budget: 4200, moderate: 6600, comfortable: 9600 }, other: { budget: 3600, moderate: 6000, comfortable: 8400 } },
  food: { budget: 4800, moderate: 7200, comfortable: 10800 },
  transport: { kl: { budget: 1500, moderate: 2400, comfortable: 4800 }, penang: { budget: 1200, moderate: 2000, comfortable: 3600 }, johor: { budget: 1200, moderate: 1800, comfortable: 3000 }, other: { budget: 900, moderate: 1500, comfortable: 2400 } },
  visa: 2500,
  misc: { budget: 2400, moderate: 4200, comfortable: 7200 }
};
let calcState = { type: "public", city: "kl", duration: 3, lifestyle: "budget" };

function setCalcOpt(group, btn) {
  const parent = btn.parentElement;
  parent.querySelectorAll(".calc-opt").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  calcState[group] = btn.dataset.val;
  runCalc();
}

function updateDuration(v) {
  calcState.duration = parseInt(v);
  const yr = calcState.duration === 1 ? t("calc.yr") : t("calc.yrs");
  document.getElementById("durationVal").textContent = `${v} ${yr}`;
}

function runCalc() {
  const { type, city, duration, lifestyle } = calcState;
  const tuition = CALC_DATA.tuition[type];
  const accommodation = CALC_DATA.accommodation[city][lifestyle];
  const food = CALC_DATA.food[lifestyle];
  const transport = CALC_DATA.transport[city][lifestyle];
  const visa = CALC_DATA.visa;
  const misc = CALC_DATA.misc[lifestyle];
  const yearlyTotal = tuition + accommodation + food + transport + visa + misc;
  const grandTotal = yearlyTotal * duration;

  const items = [
    { key: "calc.c.tuition",       val: tuition,       color: "#0a5c8a" },
    { key: "calc.c.accommodation", val: accommodation, color: "#1a7eb5" },
    { key: "calc.c.food",          val: food,          color: "#f59e0b" },
    { key: "calc.c.transport",     val: transport,     color: "#10b981" },
    { key: "calc.c.visa",          val: visa,          color: "#8b5cf6" },
    { key: "calc.c.misc",          val: misc,          color: "#ef4444" },
  ];

  const barsEl = document.getElementById("calcBars");
  if (!barsEl) return;
  barsEl.innerHTML = items.map(item => {
    const pct = Math.round((item.val / yearlyTotal) * 100);
    return `<div class="calc-bar-row">
      <div class="calc-bar-head">
        <span class="calc-bar-name">${t(item.key)}</span>
        <span class="calc-bar-amt">RM ${item.val.toLocaleString()}</span>
      </div>
      <div class="calc-bar-track"><div class="calc-bar-fill" style="width:${pct}%;background:${item.color}"></div></div>
    </div>`;
  }).join("");

  document.getElementById("calcPerYear").textContent = "RM " + yearlyTotal.toLocaleString();
  document.getElementById("calcTotal").textContent = "RM " + grandTotal.toLocaleString();
}

/* ═══════════════ FAQ ═══════════════ */
function buildFAQ() {
  const grid = document.getElementById("faqGrid");
  if (!grid) return;
  const ICONS = ["🎓","💰","💼","🛂","🕌","📅","🎁","✅"];

  // Admin-defined FAQ (ep_faq) takes priority
  try {
    const raw = localStorage.getItem('ep_faq');
    if (raw) {
      const adminFAQ = JSON.parse(raw);
      if (adminFAQ && adminFAQ.length) {
        grid.innerHTML = adminFAQ.map((item, i) => `
          <div class="faq-item" id="faqItem${i+1}">
            <div class="faq-q" onclick="toggleFAQ(${i+1})">
              <div class="faq-icon">${ICONS[i % 8]}</div>
              <div class="faq-q-text">${item.q}</div>
              <span class="faq-arrow">▼</span>
            </div>
            <div class="faq-a"><div class="faq-a-inner">${item.a}</div></div>
          </div>`).join("");
        return;
      }
    }
  } catch {}

  // Default: i18n-based FAQ
  const items = Array.from({length:8}, (_,i) => i+1);
  grid.innerHTML = items.map((n, i) => `
    <div class="faq-item" id="faqItem${n}">
      <div class="faq-q" onclick="toggleFAQ(${n})">
        <div class="faq-icon">${ICONS[i]}</div>
        <div class="faq-q-text">${t("faq.q"+n)}</div>
        <span class="faq-arrow">▼</span>
      </div>
      <div class="faq-a"><div class="faq-a-inner">${t("faq.a"+n)}</div></div>
    </div>`).join("");
}

function toggleFAQ(n) {
  const item = document.getElementById("faqItem"+n);
  if (!item) return;
  const isOpen = item.classList.contains("open");
  document.querySelectorAll(".faq-item.open").forEach(el => el.classList.remove("open"));
  if (!isOpen) item.classList.add("open");
}

/* ═══════════════ STAT COUNTERS ═══════════════ */
const counters = document.querySelectorAll(".stat-num");
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = +el.dataset.target;
      const suffix = target >= 1000 ? "+" : "";
      let current = 0;
      const step = Math.ceil(target / 60);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString() + suffix;
        if (current >= target) clearInterval(timer);
      }, 20);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => statObserver.observe(c));

/* ═══════════════ AI CHATBOT ENGINE ═══════════════ */

function botT(obj) { return obj[currentLang] || obj.en; }

// Abbreviations / nicknames → university ID
const UNI_ALIASES = {
  'um': 'um', 'malaya': 'um', 'university of malaya': 'um',
  'ukm': 'ukm', 'kebangsaan': 'ukm',
  'upm': 'upm', 'putra': 'upm',
  'usm': 'usm', 'sains malaysia': 'usm',
  'utm': 'utm', 'teknologi malaysia': 'utm',
  'uitm': 'uitm', 'mara': 'uitm',
  'iium': 'iium', 'uia': 'iium', 'international islamic': 'iium',
  'uum': 'uum', 'utara': 'uum',
  'taylor': 'taylor', "taylor's": 'taylor', 'taylors': 'taylor',
  'sunway': 'sunway',
  'ucsi': 'ucsi',
  'utp': 'utp', 'petronas': 'utp',
  'mmu': 'mmu', 'multimedia': 'mmu',
  'apu': 'apu', 'asia pacific': 'apu',
  'mahsa': 'mahsa',
  'monash': 'monash',
  'nottingham': 'nottingham',
  'msu': 'msu', 'management science': 'msu',
  'inti': 'inti',
  'heriot': 'heriotwatt', 'heriot-watt': 'heriotwatt', 'heriotwatt': 'heriotwatt',
  'xiamen': 'xiamen',
  'curtin': 'curtin',
  'swinburne': 'swinburne',
  'ums': 'ums', 'sabah': 'ums',
  'unimas': 'unimas', 'sarawak': 'unimas',
  'upsi': 'upsi',
  'usim': 'usim',
  'uthm': 'uthm',
  'utem': 'utem',
  'umpsa': 'umpsa', 'pahang': 'umpsa',
  'unimap': 'unimap', 'perlis': 'unimap',
  'umt': 'umt', 'terengganu': 'umt',
  'umk': 'umk', 'kelantan': 'umk',
  'unisza': 'uniszа',
  'upnm': 'upnm',
  'uniten': 'uniten'
};

function norm(s) {
  return s.toLowerCase()
    .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[ًٌٍَُِّْ]/g,'').replace(/[-_]/g,' ').trim();
}

function lookupUni(text) {
  const tx = norm(text);
  // Sort aliases longest-first to prefer more specific matches
  const sorted = Object.keys(UNI_ALIASES).sort((a,b) => b.length - a.length);
  for (const alias of sorted) {
    if (tx.includes(norm(alias))) {
      const id = UNI_ALIASES[alias];
      return UNIVERSITIES.find(u => u.id === id) || null;
    }
  }
  return null;
}

function buildUniAnswer(u) {
  const qsPart = u.qs ? ` · QS #${u.qs}` : '';
  const topFields = u.fields.slice(0,4).join(', ');
  const samplePrograms = u.programs.slice(0,4).map(p => `${p.name} (${p.level})`).join('<br>  • ');
  const minFee = Math.min(...u.programs.map(p=>p.fee));
  const maxFee = Math.max(...u.programs.map(p=>p.fee));
  const feeRange = minFee === maxFee ? `RM ${minFee.toLocaleString()}` : `RM ${minFee.toLocaleString()}–${maxFee.toLocaleString()}`;
  const L = {
    programs: { en:'programs', ar:'برامج', ja:'プログラム', ko:'프로그램', ru:'программ' },
    fees:     { en:'Fees', ar:'الرسوم', ja:'授業料', ko:'학비', ru:'Стоимость' },
    intakes:  { en:'Intakes', ar:'مواعيد القبول', ja:'入学時期', ko:'입학 시기', ru:'Наборы' },
    ielts:    { en:'IELTS', ar:'IELTS', ja:'IELTS', ko:'IELTS', ru:'IELTS' },
    sample:   { en:'Sample programs', ar:'نماذج برامج', ja:'プログラム例', ko:'프로그램 예시', ru:'Примеры программ' },
    view:     { en:'View full details & all courses →', ar:'عرض التفاصيل الكاملة والتخصصات ←', ja:'全コースを見る →', ko:'전체 과정 보기 →', ru:'Все программы →' }
  };
  return `${u.icon} <strong>${u.name}</strong>${qsPart}<br>
📍 ${u.city}, ${u.state}<br>
📚 <strong>${u.programs.length} ${botT(L.programs)}</strong> — ${topFields}<br>
💰 ${botT(L.fees)}: <strong>${feeRange}/yr</strong><br>
📅 ${botT(L.intakes)}: ${u.intakes}<br>
🗣️ ${botT(L.ielts)}: ${u.ielts}<br>
<br>${botT(L.sample)}:<br>  • ${samplePrograms}<br>
<br><a href="university.html" onclick="localStorage.setItem('uniId','${u.id}')" style="color:var(--primary,#0a5c8a);font-weight:700">${botT(L.view)}</a>`;
}

function detectIntent(tx) {
  if (/^(hi|hello|hey|سلام|مرحب|هلا|اهلا|こんにちは|안녕|привет|добр)/i.test(tx)) return 'greeting';
  if (/(thank|شكر|شكرا|مشكور|تسلم|ありがとう|감사|спасибо)/i.test(tx)) return 'thanks';
  if (/(how are you|كيفك|كيف حالك|كيف الحال)/i.test(tx)) return 'howAreYou';
  return null;
}

const KB = [
  {
    keywords: ['visa','student pass','permit','emgs','immigration','فيزا','تأشيرة','تاشيرة','اقامة','إقامة','ビザ','비자','виза'],
    answers: {
      en: `🛂 <strong>Student Visa (Student Pass)</strong><br>Processed via <strong>EMGS</strong>:<br>1. Get a university offer letter<br>2. We submit your EMGS application (free)<br>3. eVAL approval in ~4–6 weeks<br>4. Enter Malaysia → medical check → Student Pass<br><br>✅ We handle the full visa process <strong>free of charge</strong>.`,
      ar: `🛂 <strong>التأشيرة الطلابية (Student Pass)</strong><br>تُصدر عبر <strong>EMGS</strong>:<br>1. احصل على خطاب القبول من الجامعة<br>2. نتقدم بطلب EMGS نيابةً عنك (مجاناً)<br>3. الموافقة (eVAL) خلال 4–6 أسابيع<br>4. تصل ماليزيا ← فحص طبي ← تستلم التأشيرة<br><br>✅ نتولى إجراءات التأشيرة كاملةً <strong>مجاناً</strong>.`,
      ja: `🛂 <strong>学生ビザ（スチューデントパス）</strong><br>EMGS経由で発行:<br>1. 大学からオファーレターを取得<br>2. EMGS申請を無料で代行<br>3. eVAL承認まで約4〜6週間<br>4. マレーシア入国 → 健康診断 → スチューデントパス受取<br><br>✅ ビザ手続き全体を<strong>無料</strong>でサポートします。`,
      ko: `🛂 <strong>학생 비자 (스튜던트 패스)</strong><br>EMGS를 통해 발급:<br>1. 대학 입학 허가서 받기<br>2. EMGS 신청 무료 대행<br>3. eVAL 승인까지 약 4~6주<br>4. 말레이시아 입국 → 건강검진 → 스튜던트 패스 수령<br><br>✅ 전체 비자 절차를 <strong>무료</strong>로 처리합니다.`,
      ru: `🛂 <strong>Студенческая виза (Student Pass)</strong><br>Оформляется через EMGS:<br>1. Получить оффер-письмо от университета<br>2. Мы подаём заявку в EMGS (бесплатно)<br>3. Одобрение (eVAL) за 4–6 недель<br>4. Въезд в Малайзию → медосмотр → Student Pass<br><br>✅ Весь визовый процесс ведём <strong>бесплатно</strong>.`
    }
  },
  {
    keywords: ['cost','tuition','fee','fees','price','budget','ringgit','rm','afford','cheap','تكلفة','تكاليف','رسوم','سعر','فلوس','ميزانية','学費','費用','학비','비용','стоимость','цена'],
    answers: {
      en: `💰 <strong>Study Costs in Malaysia</strong><br>• Public university: <strong>RM 12,000–25,000/yr</strong><br>• Private university: <strong>RM 18,000–50,000/yr</strong><br>• International branch: <strong>RM 35,000–70,000/yr</strong><br>• Living: <strong>RM 1,200–2,000/month</strong><br>• Total: ~<strong>RM 25,000–55,000/year</strong><br><br>Malaysia is one of Asia's most affordable study destinations.`,
      ar: `💰 <strong>تكاليف الدراسة في ماليزيا</strong><br>• جامعات حكومية: <strong>12,000–25,000 رنجت/سنة</strong><br>• جامعات خاصة: <strong>18,000–50,000 رنجت/سنة</strong><br>• فروع دولية: <strong>35,000–70,000 رنجت/سنة</strong><br>• المعيشة: <strong>1,200–2,000 رنجت/شهر</strong><br>• الإجمالي: ~<strong>25,000–55,000 رنجت/سنة</strong><br><br>ماليزيا من أرخص وجهات الدراسة في آسيا.`,
      ja: `💰 <strong>マレーシアの留学費用</strong><br>• 公立大学: <strong>RM 12,000–25,000/年</strong><br>• 私立大学: <strong>RM 18,000–50,000/年</strong><br>• 海外分校: <strong>RM 35,000–70,000/年</strong><br>• 生活費: <strong>RM 1,200–2,000/月</strong><br>• 合計: ~<strong>RM 25,000–55,000/年</strong><br><br>マレーシアはアジアで最も費用対効果の高い留学先の一つです。`,
      ko: `💰 <strong>말레이시아 유학 비용</strong><br>• 국립대학: <strong>RM 12,000–25,000/년</strong><br>• 사립대학: <strong>RM 18,000–50,000/년</strong><br>• 해외 분교: <strong>RM 35,000–70,000/년</strong><br>• 생활비: <strong>RM 1,200–2,000/월</strong><br>• 합계: ~<strong>RM 25,000–55,000/년</strong><br><br>말레이시아는 아시아에서 가장 저렴한 유학 목적지 중 하나입니다.`,
      ru: `💰 <strong>Стоимость обучения в Малайзии</strong><br>• Гос. университеты: <strong>RM 12 000–25 000/год</strong><br>• Частные: <strong>RM 18 000–50 000/год</strong><br>• Зарубежные филиалы: <strong>RM 35 000–70 000/год</strong><br>• Проживание: <strong>RM 1 200–2 000/мес</strong><br>• Итого: ~<strong>RM 25 000–55 000/год</strong><br><br>Малайзия — одно из самых доступных мест для учёбы в Азии.`
    }
  },
  {
    keywords: ['best','top','rank','ranking','qs','world rank','popular','جامعة','جامعات','افضل','أفضل','ترتيب','تصنيف','大学','ランキング','대학','순위','рейтинг','университет'],
    answers: {
      en: `🏛️ <strong>Top Universities by QS Rank</strong><br>🥇 University of Malaya (UM) — <strong>QS #58</strong><br>🥈 UKM — <strong>#126</strong> · UPM — <strong>#134</strong> · USM — <strong>#134</strong><br>🥉 UTM — <strong>#153</strong> · UTP — <strong>#251</strong><br>🏅 Taylor's — <strong>#253</strong> · UCSI — <strong>#265</strong><br>🌐 Branches: Monash (#36), Nottingham (#97)<br><br>We partner with <strong>36 institutions</strong>. Explore them above!`,
      ar: `🏛️ <strong>أفضل الجامعات حسب تصنيف QS</strong><br>🥇 جامعة مالايا (UM) — <strong>QS #58</strong><br>🥈 UKM — <strong>#126</strong> · UPM — <strong>#134</strong> · USM — <strong>#134</strong><br>🥉 UTM — <strong>#153</strong> · UTP — <strong>#251</strong><br>🏅 Taylor's — <strong>#253</strong> · UCSI — <strong>#265</strong><br>🌐 فروع دولية: Monash (#36)، Nottingham (#97)<br><br>نتعاون مع <strong>36 مؤسسة</strong>. استكشفها أعلاه!`,
      ja: `🏛️ <strong>QSランキング上位大学</strong><br>🥇 マラヤ大学 (UM) — <strong>QS #58</strong><br>🥈 UKM — <strong>#126</strong> · UPM — <strong>#134</strong> · USM — <strong>#134</strong><br>🥉 UTM — <strong>#153</strong> · UTP — <strong>#251</strong><br>🏅 Taylor's — <strong>#253</strong> · UCSI — <strong>#265</strong><br>🌐 分校: Monash (#36)、Nottingham (#97)<br><br>提携機関は<strong>36校</strong>。上のリストで探せます！`,
      ko: `🏛️ <strong>QS 순위 기준 상위 대학</strong><br>🥇 말라야 대학교 (UM) — <strong>QS #58</strong><br>🥈 UKM — <strong>#126</strong> · UPM — <strong>#134</strong> · USM — <strong>#134</strong><br>🥉 UTM — <strong>#153</strong> · UTP — <strong>#251</strong><br>🏅 Taylor's — <strong>#253</strong> · UCSI — <strong>#265</strong><br>🌐 분교: Monash (#36), Nottingham (#97)<br><br>총 <strong>36개 기관</strong>과 협력 중. 위에서 탐색하세요!`,
      ru: `🏛️ <strong>Топ университетов по рейтингу QS</strong><br>🥇 Университет Малайи (UM) — <strong>QS #58</strong><br>🥈 UKM — <strong>#126</strong> · UPM — <strong>#134</strong> · USM — <strong>#134</strong><br>🥉 UTM — <strong>#153</strong> · UTP — <strong>#251</strong><br>🏅 Taylor's — <strong>#253</strong> · UCSI — <strong>#265</strong><br>🌐 Филиалы: Monash (#36), Nottingham (#97)<br><br>Мы работаем с <strong>36 учебными заведениями</strong>!`
    }
  },
  {
    keywords: ['accommodation','housing','dorm','hostel','apartment','rent','room','stay','live','سكن','شقة','غرفة','ايجار','إيجار','宿','寮','숙소','기숙사','жильё','квартира'],
    answers: {
      en: `🏠 <strong>Accommodation Options</strong><br>• On-campus dorms: <strong>RM 300–600/month</strong><br>• Shared apartment: <strong>RM 500–900/month</strong><br>• Private studio: <strong>RM 1,000+/month</strong><br><br>📌 <strong>Accommodation arrangement service:</strong> We help you find & book housing before arrival for a one-time fee of <strong>RM 100–150</strong>.`,
      ar: `🏠 <strong>خيارات السكن</strong><br>• سكن داخلي في الحرم الجامعي: <strong>300–600 رنجت/شهر</strong><br>• شقة مشتركة: <strong>500–900 رنجت/شهر</strong><br>• استوديو خاص: <strong>+1,000 رنجت/شهر</strong><br><br>📌 <strong>خدمة ترتيب السكن:</strong> نساعدك في إيجاد وحجز السكن قبل وصولك مقابل رسم رمزي <strong>100–150 رنجت</strong> (مرة واحدة).`,
      ja: `🏠 <strong>宿泊オプション</strong><br>• 学内寮: <strong>RM 300–600/月</strong><br>• シェアアパート: <strong>RM 500–900/月</strong><br>• プライベートスタジオ: <strong>RM 1,000+/月</strong><br><br>📌 <strong>住居手配サービス:</strong> 到着前に住居を見つけてご予約。手数料は<strong>RM 100–150</strong>（一回限り）。`,
      ko: `🏠 <strong>숙소 옵션</strong><br>• 캠퍼스 기숙사: <strong>RM 300–600/월</strong><br>• 공유 아파트: <strong>RM 500–900/월</strong><br>• 개인 스튜디오: <strong>RM 1,000+/월</strong><br><br>📌 <strong>숙소 알선 서비스:</strong> 도착 전에 숙소를 찾고 예약해 드립니다. 수수료 <strong>RM 100–150</strong> (1회).`,
      ru: `🏠 <strong>Варианты жилья</strong><br>• Кампусное общежитие: <strong>RM 300–600/мес</strong><br>• Совместная квартира: <strong>RM 500–900/мес</strong><br>• Частная студия: <strong>RM 1 000+/мес</strong><br><br>📌 <strong>Услуга подбора жилья:</strong> Помогаем найти и забронировать жильё до приезда. Разовый сбор <strong>RM 100–150</strong>.`
    }
  },
  {
    keywords: ['airport','pickup','pick up','arrive','arrival','land','مطار','استقبال','وصول','وصلت','空港','送迎','공항','픽업','аэропорт','встреча','прибытие'],
    answers: {
      en: `✈️ <strong>Airport Pickup</strong><br>Yes! We arrange pickup and on-ground orientation. Our rep meets you at KLIA/KLIA2 and takes you to your accommodation.<br><br>📌 <strong>Fee: RM 50–100</strong> (symbolic, depends on distance). Contact us to book.`,
      ar: `✈️ <strong>الاستقبال من المطار</strong><br>نعم! نرتب خدمة الاستقبال والتوجيه الأرضي. مندوبنا يستقبلك في KLIA/KLIA2 ويوصلك إلى سكنك.<br><br>📌 <strong>الرسوم: 50–100 رنجت</strong> (رمزية، حسب المسافة). تواصل معنا للحجز.`,
      ja: `✈️ <strong>空港送迎</strong><br>はい！空港での出迎えとオリエンテーションを手配します。担当者がKLIA/KLIA2でお迎えし、宿泊先までご案内します。<br><br>📌 <strong>料金: RM 50–100</strong>（距離によって異なります）。ご予約はお問い合わせください。`,
      ko: `✈️ <strong>공항 픽업</strong><br>네! 공항 픽업과 현지 안내를 주선합니다. 담당자가 KLIA/KLIA2에서 마중 나가 숙소까지 안내합니다.<br><br>📌 <strong>수수료: RM 50–100</strong> (거리에 따라 다름). 예약은 문의해 주세요.`,
      ru: `✈️ <strong>Встреча в аэропорту</strong><br>Да! Мы организуем встречу и первичную ориентацию. Наш представитель встретит вас в KLIA/KLIA2 и отвезёт до жилья.<br><br>📌 <strong>Стоимость: RM 50–100</strong> (символический сбор, зависит от расстояния). Свяжитесь с нами для бронирования.`
    }
  },
  {
    keywords: ['work','job','part time','part-time','earn','employment','internship','عمل','شغل','وظيفة','اشتغل','働く','アルバイト','일','아르바이트','работа','подработка'],
    answers: {
      en: `💼 <strong>Working While Studying</strong><br>Students can work up to <strong>20 hours/week</strong> during semester breaks & public holidays in approved sectors:<br>• Restaurants & food service<br>• Hotels & hospitality<br>• Mini-markets & retail<br><br>⚠️ Full-time work is not allowed on a Student Pass.`,
      ar: `💼 <strong>العمل أثناء الدراسة</strong><br>يُسمح بالعمل حتى <strong>20 ساعة/أسبوع</strong> خلال إجازات الفصل والأعياد الرسمية في القطاعات المعتمدة:<br>• المطاعم والطعام<br>• الفنادق والضيافة<br>• محلات التجزئة<br><br>⚠️ العمل بدوام كامل غير مسموح بتأشيرة الطالب.`,
      ja: `💼 <strong>就労について</strong><br>学期休みと祝日は週<strong>20時間まで</strong>働けます（認可分野のみ）:<br>• レストラン・飲食業<br>• ホテル・ホスピタリティ<br>• コンビニ・小売業<br><br>⚠️ スチューデントパスでのフルタイム就労は禁止です。`,
      ko: `💼 <strong>유학 중 취업</strong><br>방학 및 공휴일에 주 <strong>20시간까지</strong> 아르바이트 가능 (허가 업종):<br>• 식당 및 식음료<br>• 호텔 및 서비스업<br>• 편의점 및 소매업<br><br>⚠️ 학생 비자로 정규직 취업은 불가합니다.`,
      ru: `💼 <strong>Работа во время учёбы</strong><br>Студентам разрешено работать до <strong>20 часов/неделю</strong> в период каникул и праздников в разрешённых сферах:<br>• Рестораны и общепит<br>• Отели и гостиничный бизнес<br>• Магазины и ретейл<br><br>⚠️ Работа на полную ставку по Student Pass запрещена.`
    }
  },
  {
    keywords: ['apply','application','admission','enroll','register','how to','requirements','documents','تقديم','تسجيل','قبول','مستندات','وثائق','اوراق','متطلبات','出願','入学','지원','입학','서류','подать','поступление','документы'],
    answers: {
      en: `📋 <strong>How to Apply — 4 Steps</strong><br>1️⃣ Free consultation — we assess your profile<br>2️⃣ University & program matching<br>3️⃣ Application + offer letter (we handle it, free)<br>4️⃣ Visa → arrive → start studying 🎓<br><br><strong>Documents needed:</strong> Passport, school certificates, transcripts, photos, bank statement.`,
      ar: `📋 <strong>كيفية التقديم — 4 خطوات</strong><br>1️⃣ استشارة مجانية — نقيّم ملفك<br>2️⃣ اختيار الجامعة والتخصص المناسب<br>3️⃣ تقديم الطلب + خطاب القبول (نتولاه مجاناً)<br>4️⃣ التأشيرة ← الوصول ← ابدأ الدراسة 🎓<br><br><strong>الوثائق المطلوبة:</strong> جواز سفر، شهادات دراسية، كشوف درجات، صور، كشف حساب بنكي.`,
      ja: `📋 <strong>出願方法 — 4ステップ</strong><br>1️⃣ 無料カウンセリング — プロフィール評価<br>2️⃣ 大学・コースのマッチング<br>3️⃣ 出願 + オファーレター取得（無料代行）<br>4️⃣ ビザ取得 → 渡航 → 学習開始 🎓<br><br><strong>必要書類:</strong> パスポート、成績証明書、卒業証明書、写真、銀行残高証明。`,
      ko: `📋 <strong>지원 방법 — 4단계</strong><br>1️⃣ 무료 상담 — 프로필 평가<br>2️⃣ 대학 & 전공 매칭<br>3️⃣ 지원서 + 입학 허가서 (무료 대행)<br>4️⃣ 비자 → 출국 → 학업 시작 🎓<br><br><strong>필요 서류:</strong> 여권, 성적증명서, 졸업증명서, 사진, 잔고증명서.`,
      ru: `📋 <strong>Как подать заявку — 4 шага</strong><br>1️⃣ Бесплатная консультация — оцениваем ваш профиль<br>2️⃣ Подбор университета и программы<br>3️⃣ Подача документов + оффер-письмо (бесплатно)<br>4️⃣ Виза → приезд → начало учёбы 🎓<br><br><strong>Нужные документы:</strong> Паспорт, аттестат, оценки, фото, выписка из банка.`
    }
  },
  {
    keywords: ['english','ielts','toefl','language','muet','test','لغة','انجليزي','إنجليزي','ايلتس','توفل','英語','영어','английский','язык'],
    answers: {
      en: `🗣️ <strong>English Requirements</strong><br>Most programs require <strong>IELTS 5.5–6.5</strong> (or TOEFL/MUET equivalent).<br><br>📌 No IELTS yet? Many universities accept conditional admission with a pre-sessional English program first.`,
      ar: `🗣️ <strong>متطلبات اللغة الإنجليزية</strong><br>تشترط معظم البرامج <strong>IELTS 5.5–6.5</strong> (أو ما يعادله من TOEFL/MUET).<br><br>📌 لا تملك IELTS؟ كثير من الجامعات تقبل القبول المشروط مع برنامج تحضيري أولاً.`,
      ja: `🗣️ <strong>英語要件</strong><br>ほとんどのプログラムは <strong>IELTS 5.5–6.5</strong>（またはTOEFL/MUET相当）が必要です。<br><br>📌 IELTSがなくても大丈夫！英語準備コースと条件付き合格を受け入れる大学も多数あります。`,
      ko: `🗣️ <strong>영어 요건</strong><br>대부분의 프로그램에서 <strong>IELTS 5.5–6.5</strong> (또는 TOEFL/MUET 동등) 요구합니다.<br><br>📌 IELTS가 없어도 괜찮습니다! 많은 대학에서 조건부 입학 후 영어 준비 과정을 먼저 이수할 수 있습니다.`,
      ru: `🗣️ <strong>Требования по английскому</strong><br>Большинство программ требуют <strong>IELTS 5.5–6.5</strong> (или эквивалент TOEFL/MUET).<br><br>📌 Нет IELTS? Многие университеты принимают с условным зачислением — сначала языковой курс.`
    }
  },
  {
    keywords: ['duration','how long','years','bachelor','master','phd','diploma','foundation','مدة','سنوات','بكالوريوس','ماجستير','دكتوراه','期間','기간','длительность','степень'],
    answers: {
      en: `🎓 <strong>Program Duration</strong><br>• Foundation: <strong>1 year</strong><br>• Diploma: <strong>2–3 years</strong><br>• Bachelor's: <strong>3–4 years</strong><br>• Master's: <strong>1–2 years</strong><br>• PhD: <strong>3–5 years</strong>`,
      ar: `🎓 <strong>مدة البرامج الدراسية</strong><br>• تأهيلي: <strong>سنة واحدة</strong><br>• دبلوم: <strong>2–3 سنوات</strong><br>• بكالوريوس: <strong>3–4 سنوات</strong><br>• ماجستير: <strong>1–2 سنوات</strong><br>• دكتوراه: <strong>3–5 سنوات</strong>`,
      ja: `🎓 <strong>プログラム期間</strong><br>• 基礎課程: <strong>1年</strong><br>• ディプロマ: <strong>2〜3年</strong><br>• 学士: <strong>3〜4年</strong><br>• 修士: <strong>1〜2年</strong><br>• 博士: <strong>3〜5年</strong>`,
      ko: `🎓 <strong>과정 기간</strong><br>• 파운데이션: <strong>1년</strong><br>• 디플로마: <strong>2~3년</strong><br>• 학사: <strong>3~4년</strong><br>• 석사: <strong>1~2년</strong><br>• 박사: <strong>3~5년</strong>`,
      ru: `🎓 <strong>Сроки обучения</strong><br>• Фундамент (Foundation): <strong>1 год</strong><br>• Диплом: <strong>2–3 года</strong><br>• Бакалавриат: <strong>3–4 года</strong><br>• Магистратура: <strong>1–2 года</strong><br>• Аспирантура (PhD): <strong>3–5 лет</strong>`
    }
  },
  {
    keywords: ['safe','safety','crime','danger','secure','آمن','امان','أمان','خطر','安全','안전','безопасно','опасно'],
    answers: {
      en: `🛡️ <strong>Is Malaysia Safe?</strong><br>Yes — Malaysia is one of Asia's safest countries for international students. Politically stable, very welcoming, with student communities from 150+ nations.`,
      ar: `🛡️ <strong>هل ماليزيا آمنة؟</strong><br>نعم — ماليزيا من أكثر دول آسيا أماناً للطلاب الدوليين. مستقرة سياسياً، ترحيبية جداً، وفيها مجتمعات طلابية من أكثر من 150 دولة.`,
      ja: `🛡️ <strong>マレーシアは安全ですか？</strong><br>はい — マレーシアはアジアで最も留学生にとって安全な国の一つです。政治的に安定しており、150ヵ国以上の留学生コミュニティがあります。`,
      ko: `🛡️ <strong>말레이시아는 안전한가요?</strong><br>네 — 말레이시아는 아시아에서 유학생에게 가장 안전한 나라 중 하나입니다. 정치적으로 안정적이며 150개국 이상의 유학생 커뮤니티가 있습니다.`,
      ru: `🛡️ <strong>Безопасна ли Малайзия?</strong><br>Да — Малайзия одна из самых безопасных стран Азии для иностранных студентов. Политически стабильна, гостеприимна, есть сообщества студентов из 150+ стран.`
    }
  },
  {
    keywords: ['food','halal','eat','muslim','mosque','prayer','اكل','أكل','طعام','حلال','مسلم','مسجد','食べ物','ハラル','음식','할랄','еда','халяль','мечеть'],
    answers: {
      en: `🍽️ <strong>Food & Muslim Life</strong><br>Malaysia is Muslim-majority — <strong>halal food is everywhere</strong>: campus cafeterias, malls, streets.<br>🕌 Mosques & prayer rooms (surau) on every campus, mall, and airport.<br>🍜 Malay, Chinese, Indian cuisine at very affordable prices.`,
      ar: `🍽️ <strong>الطعام والحياة الإسلامية</strong><br>ماليزيا أغلبيتها مسلمة — <strong>الحلال في كل مكان</strong>: كافتيريات جامعية، مراكز تجارية، شوارع.<br>🕌 مساجد ومصليات في كل حرم جامعي ومركز تجاري ومطار.<br>🍜 مطبخ ملايوي وصيني وهندي بأسعار منخفضة جداً.`,
      ja: `🍽️ <strong>食事とイスラム生活</strong><br>マレーシアはイスラム教徒が多数派 — <strong>ハラール食品はどこでも</strong>入手可能です：食堂、ショッピングモール、路上。<br>🕌 キャンパス、モール、空港すべてにモスクと礼拝室があります。<br>🍜 マレー料理、中華、インド料理が格安で楽しめます。`,
      ko: `🍽️ <strong>음식 & 이슬람 생활</strong><br>말레이시아는 무슬림이 다수 — <strong>할랄 음식이 어디에나</strong> 있습니다: 학식, 쇼핑몰, 거리.<br>🕌 모스크와 기도실이 모든 캠퍼스, 몰, 공항에 있습니다.<br>🍜 말레이, 중국, 인도 음식을 매우 저렴하게 즐길 수 있습니다.`,
      ru: `🍽️ <strong>Еда и жизнь мусульман</strong><br>Малайзия — мусульманская страна большинства. <strong>Халяльная еда везде</strong>: столовые, торговые центры, улицы.<br>🕌 Мечети и молельные комнаты (сурау) на каждом кампусе, в каждом ТЦ и аэропорту.<br>🍜 Малайская, китайская, индийская кухня по очень низким ценам.`
    }
  },
  {
    keywords: ['weather','climate','hot','cold','rain','tropical','جو','طقس','مناخ','حر','مطر','天気','날씨','погода','климат'],
    answers: {
      en: `🌤️ <strong>Malaysia Weather</strong><br>Tropical year-round — <strong>25–33°C</strong>, humid with short rains. No winter, no snow. Pack light clothes and a small umbrella. ☂️`,
      ar: `🌤️ <strong>طقس ماليزيا</strong><br>استوائي طوال العام — <strong>25–33°C</strong>، رطب مع أمطار قصيرة متكررة. لا شتاء، لا ثلج. خفف من ملابسك وخذ مظلة صغيرة. ☂️`,
      ja: `🌤️ <strong>マレーシアの気候</strong><br>年中熱帯性気候 — <strong>25〜33°C</strong>、湿度が高く短い雨が多い。冬も雪もなし。薄手の服と折り畳み傘を持参して。☂️`,
      ko: `🌤️ <strong>말레이시아 날씨</strong><br>연중 열대 기후 — <strong>25~33°C</strong>, 습하고 짧은 소나기가 자주 옵니다. 겨울도 눈도 없습니다. 가벼운 옷과 우산을 챙기세요. ☂️`,
      ru: `🌤️ <strong>Погода в Малайзии</strong><br>Тропический климат круглый год — <strong>25–33°C</strong>, влажно, частые короткие дожди. Зимы и снега нет. Лёгкая одежда и зонтик — must have. ☂️`
    }
  },
  {
    keywords: ['transport','bus','train','mrt','lrt','grab','car','مواصلات','نقل','باص','قطار','سيارة','交通','교통','транспорт','автобус'],
    answers: {
      en: `🚆 <strong>Getting Around Malaysia</strong><br>• MRT/LRT/KTM — fast & cheap in KL<br>• Grab app — very affordable<br>• Campus shuttles & public buses<br>• Monthly budget: ~<strong>RM 100–200</strong>`,
      ar: `🚆 <strong>التنقل في ماليزيا</strong><br>• قطارات MRT/LRT/KTM — سريعة ورخيصة في كوالالمبور<br>• تطبيق Grab — أسعار ممتازة<br>• مكوكات جامعية وباصات عامة<br>• ميزانية النقل الشهرية: ~<strong>100–200 رنجت</strong>`,
      ja: `🚆 <strong>マレーシアの交通</strong><br>• MRT/LRT/KTM — KL市内は速くて安い<br>• Grabアプリ — 非常に手頃<br>• キャンパスシャトル・路線バス<br>• 月間交通費: ~<strong>RM 100–200</strong>`,
      ko: `🚆 <strong>말레이시아 교통</strong><br>• MRT/LRT/KTM — KL에서 빠르고 저렴<br>• Grab 앱 — 매우 저렴한 택시<br>• 캠퍼스 셔틀 & 시내버스<br>• 월 교통비: ~<strong>RM 100–200</strong>`,
      ru: `🚆 <strong>Транспорт в Малайзии</strong><br>• MRT/LRT/KTM — быстро и дёшево в KL<br>• Приложение Grab — очень доступно<br>• Кампусные шаттлы и автобусы<br>• Месячный бюджет: ~<strong>RM 100–200</strong>`
    }
  },
  {
    keywords: ['scholarship','financial aid','funding','discount','منحة','منح','مساعدة مالية','خصم','奨学金','장학금','стипендия','скидка'],
    answers: {
      en: `🎁 <strong>Scholarships & Discounts</strong><br>• <strong>Taylor's</strong> — up to 50% tuition discount<br>• <strong>Sunway</strong> — merit scholarships<br>• <strong>UCSI</strong> — 10–30% discounts<br>• <strong>Public universities</strong> — very low fees by default<br><br>Share your GPA and we'll find the best options for you!`,
      ar: `🎁 <strong>المنح الدراسية والخصومات</strong><br>• <strong>Taylor's</strong> — خصم حتى 50% على الرسوم<br>• <strong>Sunway</strong> — منح الجدارة<br>• <strong>UCSI</strong> — خصومات 10–30%<br>• <strong>الجامعات الحكومية</strong> — رسوم منخفضة أصلاً<br><br>أخبرنا بمعدلاتك وسنجد أفضل الخيارات لك!`,
      ja: `🎁 <strong>奨学金と割引</strong><br>• <strong>Taylor's</strong> — 最大50%の学費割引<br>• <strong>Sunway</strong> — 成績優秀者奨学金<br>• <strong>UCSI</strong> — 10〜30%割引<br>• <strong>公立大学</strong> — もともと低い学費<br><br>成績を教えていただければ、最適な選択肢をご提案します！`,
      ko: `🎁 <strong>장학금 & 할인</strong><br>• <strong>Taylor's</strong> — 등록금 최대 50% 할인<br>• <strong>Sunway</strong> — 성적 우수 장학금<br>• <strong>UCSI</strong> — 10~30% 할인<br>• <strong>국립대학</strong> — 기본적으로 매우 저렴<br><br>성적을 알려주시면 최적의 옵션을 찾아드리겠습니다!`,
      ru: `🎁 <strong>Стипендии и скидки</strong><br>• <strong>Taylor's</strong> — скидка до 50% на обучение<br>• <strong>Sunway</strong> — стипендии за успеваемость<br>• <strong>UCSI</strong> — скидки 10–30%<br>• <strong>Государственные вузы</strong> — изначально низкие цены<br><br>Сообщите нам свой средний балл — найдём лучшие варианты!`
    }
  },
  {
    keywords: ['service','services','offer','help','خدمة','خدمات','تساعد','مساعدة','サービス','서비스','услуги','помогать'],
    answers: {
      en: `🌟 <strong>Our Services</strong><br>✅ <strong>Free:</strong> Consultation, university matching, application, visa support, course selection<br>💳 <strong>Paid (symbolic):</strong><br>  • Airport pickup: <strong>RM 50–100</strong><br>  • Accommodation arrangement: <strong>RM 100–150</strong>`,
      ar: `🌟 <strong>خدماتنا</strong><br>✅ <strong>مجاناً:</strong> استشارة، اختيار الجامعة، تقديم الطلب، دعم التأشيرة، اختيار التخصص<br>💳 <strong>برسم رمزي:</strong><br>  • استقبال من المطار: <strong>50–100 رنجت</strong><br>  • ترتيب السكن: <strong>100–150 رنجت</strong>`,
      ja: `🌟 <strong>サービス一覧</strong><br>✅ <strong>無料:</strong> カウンセリング、大学マッチング、出願、ビザサポート、コース選択<br>💳 <strong>有料（象徴的な費用）:</strong><br>  • 空港送迎: <strong>RM 50–100</strong><br>  • 住居手配: <strong>RM 100–150</strong>`,
      ko: `🌟 <strong>서비스 안내</strong><br>✅ <strong>무료:</strong> 상담, 대학 매칭, 지원, 비자 지원, 전공 선택<br>💳 <strong>유료 (소액):</strong><br>  • 공항 픽업: <strong>RM 50–100</strong><br>  • 숙소 알선: <strong>RM 100–150</strong>`,
      ru: `🌟 <strong>Наши услуги</strong><br>✅ <strong>Бесплатно:</strong> Консультация, подбор вуза, подача документов, визовая поддержка, выбор курса<br>💳 <strong>Платно (символически):</strong><br>  • Встреча в аэропорту: <strong>RM 50–100</strong><br>  • Подбор жилья: <strong>RM 100–150</strong>`
    }
  },
  {
    keywords: ['fields','programs','courses','study','major','faculty','specialization','تخصص','مجال','برنامج','دراسة','分野','전공','специальность','направление'],
    answers: {
      en: `📚 <strong>Available Study Fields</strong><br>• Engineering & Technology<br>• Business & Management<br>• Medicine & Health Sciences<br>• IT & Computer Science<br>• Law & Social Sciences<br>• Arts, Design & Architecture<br>• Pharmacy & Dentistry<br>• Education & Hospitality<br><br>Ask me any university name for its exact programs & fees!`,
      ar: `📚 <strong>مجالات الدراسة المتاحة</strong><br>• الهندسة والتكنولوجيا<br>• إدارة الأعمال والتجارة<br>• الطب والعلوم الصحية<br>• تقنية المعلومات وعلوم الحاسوب<br>• القانون والعلوم الاجتماعية<br>• الفنون والتصميم والعمارة<br>• الصيدلة وطب الأسنان<br>• التربية والضيافة<br><br>اكتب اسم أي جامعة لمعرفة برامجها وأسعارها!`,
      ja: `📚 <strong>学習分野</strong><br>• 工学・テクノロジー<br>• ビジネス・経営学<br>• 医学・健康科学<br>• IT・コンピュータサイエンス<br>• 法学・社会科学<br>• アート・デザイン・建築<br>• 薬学・歯学<br>• 教育・ホスピタリティ<br><br>大学名を入力すれば詳しいプログラムと費用をご案内します！`,
      ko: `📚 <strong>전공 분야</strong><br>• 공학 및 기술<br>• 경영 및 비즈니스<br>• 의학 및 건강과학<br>• IT 및 컴퓨터공학<br>• 법학 및 사회과학<br>• 예술, 디자인 및 건축<br>• 약학 및 치의학<br>• 교육 및 호텔경영<br><br>대학 이름을 입력하면 정확한 프로그램과 비용을 알려드립니다!`,
      ru: `📚 <strong>Доступные направления</strong><br>• Инженерия и технологии<br>• Бизнес и менеджмент<br>• Медицина и здравоохранение<br>• ИТ и компьютерные науки<br>• Право и социальные науки<br>• Искусство, дизайн и архитектура<br>• Фармация и стоматология<br>• Педагогика и гостиничный бизнес<br><br>Введите название университета, чтобы узнать его программы и стоимость!`
    }
  },
  {
    keywords: ['public','government','حكومي','عام','حكوميه','官立','공립','государственный','государственные'],
    answers: {
      en: `🏛️ <strong>Public Universities</strong><br>• <strong>UM</strong> (QS #58) — Kuala Lumpur<br>• <strong>UKM</strong> (#126) — Bangi<br>• <strong>UPM</strong> (#134) — Serdang<br>• <strong>USM</strong> (#134) — Penang<br>• <strong>UTM</strong> (#153) — Johor Bahru<br><br>Fees: <strong>RM 12,000–25,000/yr</strong>. Ask me about any!`,
      ar: `🏛️ <strong>الجامعات الحكومية</strong><br>• <strong>UM</strong> (QS #58) — كوالالمبور<br>• <strong>UKM</strong> (#126) — بانجي<br>• <strong>UPM</strong> (#134) — سيردانج<br>• <strong>USM</strong> (#134) — بينانج<br>• <strong>UTM</strong> (#153) — جوهور باهرو<br><br>الرسوم: <strong>12,000–25,000 رنجت/سنة</strong>. اسألني عن أي منها!`,
      ja: `🏛️ <strong>公立大学</strong><br>• <strong>UM</strong> (QS #58) — クアラルンプール<br>• <strong>UKM</strong> (#126) — バンギ<br>• <strong>UPM</strong> (#134) — セルダン<br>• <strong>USM</strong> (#134) — ペナン<br>• <strong>UTM</strong> (#153) — ジョホールバル<br><br>学費: <strong>RM 12,000–25,000/年</strong>。詳細は大学名で聞いてください！`,
      ko: `🏛️ <strong>국립대학교</strong><br>• <strong>UM</strong> (QS #58) — 쿠알라룸푸르<br>• <strong>UKM</strong> (#126) — 방이<br>• <strong>UPM</strong> (#134) — 세르당<br>• <strong>USM</strong> (#134) — 페낭<br>• <strong>UTM</strong> (#153) — 조호르바루<br><br>학비: <strong>RM 12,000–25,000/년</strong>. 원하는 대학을 물어보세요!`,
      ru: `🏛️ <strong>Государственные университеты</strong><br>• <strong>UM</strong> (QS #58) — Куала-Лумпур<br>• <strong>UKM</strong> (#126) — Банги<br>• <strong>UPM</strong> (#134) — Сердан<br>• <strong>USM</strong> (#134) — Пенанг<br>• <strong>UTM</strong> (#153) — Джохор-Бару<br><br>Стоимость: <strong>RM 12 000–25 000/год</strong>. Спрашивайте о любом!`
    }
  },
  {
    keywords: ['private','خاص','خصوصي','私立','사립','частный','частные'],
    answers: {
      en: `🏢 <strong>Private Universities</strong><br>• <strong>Taylor's</strong> (QS #253) — Subang Jaya<br>• <strong>UCSI</strong> (#265) — KL & Sarawak<br>• <strong>UTP</strong> (#251) — Perak<br>• <strong>MMU</strong> — Cyberjaya & Melaka<br>• <strong>APU</strong> — KL · <strong>Sunway</strong> (#410) — Subang Jaya<br><br>Ask me about any for full details!`,
      ar: `🏢 <strong>الجامعات الخاصة</strong><br>• <strong>Taylor's</strong> (QS #253) — صوبانج جايا<br>• <strong>UCSI</strong> (#265) — كوالالمبور وسراواك<br>• <strong>UTP</strong> (#251) — بيراك<br>• <strong>MMU</strong> — سايبرجايا وملاكا<br>• <strong>APU</strong> — كوالالمبور · <strong>Sunway</strong> (#410)<br><br>اسألني عن أي منها للتفاصيل الكاملة!`,
      ja: `🏢 <strong>私立大学</strong><br>• <strong>Taylor's</strong> (QS #253) — スバンジャヤ<br>• <strong>UCSI</strong> (#265) — KL・サラワク<br>• <strong>UTP</strong> (#251) — ペラ<br>• <strong>MMU</strong> — サイバージャヤ・マラッカ<br>• <strong>APU</strong> — KL · <strong>Sunway</strong> (#410)<br><br>詳細は大学名でお聞きください！`,
      ko: `🏢 <strong>사립대학교</strong><br>• <strong>Taylor's</strong> (QS #253) — 수방 자야<br>• <strong>UCSI</strong> (#265) — KL & 사라왁<br>• <strong>UTP</strong> (#251) — 페락<br>• <strong>MMU</strong> — 사이버자야 & 말라카<br>• <strong>APU</strong> — KL · <strong>Sunway</strong> (#410)<br><br>자세한 내용은 대학 이름으로 물어보세요!`,
      ru: `🏢 <strong>Частные университеты</strong><br>• <strong>Taylor's</strong> (QS #253) — Субанг-Джая<br>• <strong>UCSI</strong> (#265) — KL и Саравак<br>• <strong>UTP</strong> (#251) — Перак<br>• <strong>MMU</strong> — Сайберджая и Малакка<br>• <strong>APU</strong> — KL · <strong>Sunway</strong> (#410)<br><br>Спрашивайте о любом для полной информации!`
    }
  },
  {
    keywords: ['branch','international branch','foreign university','فرع','جامعات دولية','海外分校','해외분교','зарубежный','филиал'],
    answers: {
      en: `🌐 <strong>International Branch Campuses</strong><br>Study at a world-ranked university in Malaysia at lower cost:<br>• 🇦🇺 <strong>Monash</strong> (QS #36) — Subang Jaya<br>• 🇬🇧 <strong>Nottingham</strong> (QS #97) — Semenyih<br>• 🇬🇧 <strong>Heriot-Watt</strong> — Putrajaya<br>• 🇦🇺 <strong>Curtin</strong> — Sarawak<br>• 🇨🇳 <strong>Xiamen University</strong> Malaysia`,
      ar: `🌐 <strong>الفروع الدولية</strong><br>ادرس في جامعة مصنفة عالمياً بماليزيا بتكلفة أقل:<br>• 🇦🇺 <strong>Monash</strong> (QS #36) — صوبانج جايا<br>• 🇬🇧 <strong>Nottingham</strong> (QS #97) — سيمينيه<br>• 🇬🇧 <strong>Heriot-Watt</strong> — بوتراجايا<br>• 🇦🇺 <strong>Curtin</strong> — سراواك<br>• 🇨🇳 <strong>جامعة شيامن</strong> ماليزيا`,
      ja: `🌐 <strong>海外大学の分校</strong><br>世界ランキング大学にマレーシアで低コストで進学:<br>• 🇦🇺 <strong>Monash</strong> (QS #36) — スバンジャヤ<br>• 🇬🇧 <strong>Nottingham</strong> (QS #97) — スメニ<br>• 🇬🇧 <strong>Heriot-Watt</strong> — プトラジャヤ<br>• 🇦🇺 <strong>Curtin</strong> — サラワク<br>• 🇨🇳 <strong>厦門大学</strong>マレーシア`,
      ko: `🌐 <strong>해외 분교 캠퍼스</strong><br>세계 명문대 학위를 말레이시아에서 저렴하게:<br>• 🇦🇺 <strong>Monash</strong> (QS #36) — 수방 자야<br>• 🇬🇧 <strong>Nottingham</strong> (QS #97) — 세메니<br>• 🇬🇧 <strong>Heriot-Watt</strong> — 푸트라자야<br>• 🇦🇺 <strong>Curtin</strong> — 사라왁<br>• 🇨🇳 <strong>샤먼 대학교</strong> 말레이시아`,
      ru: `🌐 <strong>Зарубежные филиалы</strong><br>Учёба в мировых вузах в Малайзии по доступным ценам:<br>• 🇦🇺 <strong>Monash</strong> (QS #36) — Субанг-Джая<br>• 🇬🇧 <strong>Nottingham</strong> (QS #97) — Семеньих<br>• 🇬🇧 <strong>Heriot-Watt</strong> — Путраджая<br>• 🇦🇺 <strong>Curtin</strong> — Саравак<br>• 🇨🇳 <strong>Сямэньский университет</strong> Малайзия`
    }
  }
];

const FALLBACK = {
  en: `🤔 I'm not sure about that. You can ask me about:<br><em>visas · costs · universities · scholarships · accommodation · airport pickup · working · food · weather · how to apply</em><br><br>Or type a university name (e.g. "MMU", "Taylor's", "UM")!`,
  ar: `🤔 لم أفهم سؤالك جيداً. يمكنك السؤال عن:<br><em>التأشيرة · التكاليف · الجامعات · المنح · السكن · استقبال المطار · العمل · الطعام · الطقس · كيفية التقديم</em><br><br>أو اكتب اسم الجامعة مثل "MMU" أو "Taylor's" أو "UM"!`,
  ja: `🤔 ご質問の意味がよくわかりませんでした。以下についてお聞きください:<br><em>ビザ · 費用 · 大学 · 奨学金 · 宿泊 · 空港送迎 · 就労 · 食事 · 気候 · 出願方法</em><br><br>または大学名（例: "MMU"、"Taylor's"、"UM"）を入力してください！`,
  ko: `🤔 질문을 잘 이해하지 못했습니다. 다음에 대해 질문해 보세요:<br><em>비자 · 비용 · 대학 · 장학금 · 숙소 · 공항 픽업 · 취업 · 음식 · 날씨 · 지원 방법</em><br><br>또는 대학 이름(예: "MMU", "Taylor's", "UM")을 입력하세요!`,
  ru: `🤔 Не совсем понял вопрос. Вы можете спросить о:<br><em>визе · стоимости · университетах · стипендиях · жилье · встрече в аэропорту · работе · еде · погоде · поступлении</em><br><br>Или введите название университета (например, "MMU", "Taylor's", "UM")!`
};

const INSTANT_REPLIES = {
  greeting: {
    en: `👋 <strong>Hello!</strong> I'm EduBot — your Malaysia study guide. Ask me anything: visas, costs, universities, programs, or just type a university name like <em>"MMU"</em> or <em>"Taylor's"</em>!`,
    ar: `👋 <strong>أهلاً وسهلاً!</strong> أنا EduBot — دليلك للدراسة في ماليزيا. اسألني عن أي شيء: تأشيرة، تكاليف، جامعات، برامج، أو فقط اكتب اسم الجامعة مثل <em>"MMU"</em> أو <em>"Taylor's"</em>!`,
    ja: `👋 <strong>ようこそ！</strong>私はEduBot — マレーシア留学ガイドです。ビザ、費用、大学、プログラムなど何でも聞いてください。大学名（例: "MMU"、"Taylor's"）を入力するだけでもOK！`,
    ko: `👋 <strong>안녕하세요!</strong> 저는 EduBot — 말레이시아 유학 가이드입니다. 비자, 비용, 대학, 프로그램 등 무엇이든 물어보세요. <em>"MMU"</em> 나 <em>"Taylor's"</em> 처럼 대학 이름만 입력해도 됩니다!`,
    ru: `👋 <strong>Привет!</strong> Я EduBot — ваш гид по учёбе в Малайзии. Спрашивайте всё: визы, стоимость, университеты, программы. Или просто введите название вуза, например <em>"MMU"</em> или <em>"Taylor's"</em>!`
  },
  thanks: {
    en: `😊 You're welcome! Feel free to ask anything else.`,
    ar: `😊 العفو! أنا هنا لمساعدتك دائماً. لا تتردد في السؤال.`,
    ja: `😊 どういたしまして！他に何かご質問があればどうぞ。`,
    ko: `😊 천만에요! 다른 궁금한 점이 있으면 언제든지 물어보세요.`,
    ru: `😊 Пожалуйста! Задавайте любые другие вопросы.`
  },
  howAreYou: {
    en: `😄 I'm great, thanks for asking! Ready to help you plan your studies in Malaysia. What would you like to know?`,
    ar: `😄 بخير والحمد لله، شكراً لسؤالك! جاهز لمساعدتك في التخطيط لدراستك في ماليزيا. ماذا تريد أن تعرف؟`,
    ja: `😄 元気です、ありがとう！マレーシア留学のご相談、お気軽にどうぞ！`,
    ko: `😄 잘 있어요, 감사합니다! 말레이시아 유학 계획을 세우는 데 도움을 드릴 준비가 됐습니다. 무엇이 궁금하신가요?`,
    ru: `😄 Отлично, спасибо что спросили! Готов помочь вам спланировать учёбу в Малайзии. Что вас интересует?`
  }
};

const UNI_PROG_LABELS = {
  en:  { title:'Programs', more:'and {n} more', link:'See all {n} programs →' },
  ar:  { title:'البرامج', more:'و{n} آخرين', link:'عرض كل {n} برامج ←' },
  ja:  { title:'プログラム', more:'他{n}件', link:'全{n}プログラムを見る →' },
  ko:  { title:'프로그램', more:'외 {n}개 더', link:'전체 {n}개 프로그램 보기 →' },
  ru:  { title:'Программы', more:'и ещё {n}', link:'Все {n} программ →' }
};
const UNI_FEE_LABELS = {
  en: { title:'Fees', from:'Tuition from', to:'to', per:'per year', link:'View all programs & exact fees →' },
  ar: { title:'الرسوم', from:'الرسوم من', to:'إلى', per:'في السنة', link:'عرض كل البرامج والأسعار ←' },
  ja: { title:'学費', from:'授業料', to:'〜', per:'年', link:'全プログラムと詳細な費用を見る →' },
  ko: { title:'학비', from:'등록금', to:'~', per:'년', link:'전체 프로그램 & 정확한 학비 보기 →' },
  ru: { title:'Стоимость', from:'Обучение от', to:'до', per:'в год', link:'Все программы и точная стоимость →' }
};

function normalize(s) { return norm(s); }

function findAnswer(text) {
  const tx = norm(text);
  const L = currentLang;

  // Instant intents
  const intent = detectIntent(tx);
  if (intent) return botT(INSTANT_REPLIES[intent]);

  // University lookup
  const uni = lookupUni(tx);
  if (uni) {
    const isProg = /(program|course|major|تخصص|برنامج|コース|전공|специальность)/i.test(tx);
    const isFee  = /(fee|cost|price|tuition|رسوم|سعر|تكلفة|費用|학비|стоимость)/i.test(tx);
    if (isProg) {
      const pl = UNI_PROG_LABELS[L] || UNI_PROG_LABELS.en;
      const progs = uni.programs.slice(0,8).map(p =>
        `• ${p.name} — <strong>RM ${p.fee.toLocaleString()}/yr</strong> (${p.level})`
      ).join('<br>');
      const extra = uni.programs.length > 8 ? `<br>… ${pl.more.replace('{n}', uni.programs.length - 8)}` : '';
      const linkTxt = pl.link.replace('{n}', uni.programs.length);
      return `📚 <strong>${uni.name} — ${pl.title}</strong><br>${progs}${extra}<br><br><a href="university.html" onclick="localStorage.setItem('uniId','${uni.id}')" style="color:var(--primary,#0a5c8a);font-weight:700">${linkTxt}</a>`;
    }
    if (isFee) {
      const fl = UNI_FEE_LABELS[L] || UNI_FEE_LABELS.en;
      const min = Math.min(...uni.programs.map(p=>p.fee));
      const max = Math.max(...uni.programs.map(p=>p.fee));
      return `💰 <strong>${uni.name} — ${fl.title}</strong><br>${fl.from} <strong>RM ${min.toLocaleString()}</strong> ${fl.to} <strong>RM ${max.toLocaleString()}</strong> ${fl.per}.<br><br><a href="university.html" onclick="localStorage.setItem('uniId','${uni.id}')" style="color:var(--primary,#0a5c8a);font-weight:700">${fl.link}</a>`;
    }
    return buildUniAnswer(uni);
  }

  // KB scoring
  let best = null, bestScore = 0;
  for (const item of KB) {
    let score = 0;
    for (const kw of item.keywords) {
      const nkw = norm(kw);
      if (tx.includes(nkw)) score += nkw.length;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }

  return (best && bestScore >= 2) ? botT(best.answers) : botT(FALLBACK);
}

const SUGGESTIONS = [
  { q: 'visa' },
  { q: 'cost tuition fee' },
  { q: 'best universities rank' },
  { q: 'scholarship' },
  { q: 'accommodation housing' },
  { q: 'work job' }
];
const SUGGESTION_LABELS = {
  en: ['🛂 Visa','💰 Costs','🏛️ Universities','🎁 Scholarships','🏠 Housing','💼 Work'],
  ar: ['🛂 الفيزا','💰 التكاليف','🏛️ الجامعات','🎁 المنح','🏠 السكن','💼 العمل'],
  ja: ['🛂 ビザ','💰 費用','🏛️ 大学','🎁 奨学金','🏠 宿泊','💼 就労'],
  ko: ['🛂 비자','💰 비용','🏛️ 대학','🎁 장학금','🏠 숙소','💼 일'],
  ru: ['🛂 Виза','💰 Стоимость','🏛️ Вузы','🎁 Стипендии','🏠 Жильё','💼 Работа']
};

let chatBody, chatInput, chatStarted = false;

function openChat() {
  document.getElementById('chatWindow').classList.add('open');
  document.getElementById('chatLauncher').classList.add('hidden');
  if (!chatStarted) {
    chatStarted = true;
    renderSuggestions();
    setTimeout(() => botReply(botT(INSTANT_REPLIES.greeting)), 400);
  }
  setTimeout(() => chatInput.focus(), 300);
}
function closeChat() {
  document.getElementById('chatWindow').classList.remove('open');
  document.getElementById('chatLauncher').classList.remove('hidden');
}
function renderSuggestions() {
  const box = document.getElementById('chatSuggestions');
  const labels = SUGGESTION_LABELS[currentLang] || SUGGESTION_LABELS.en;
  box.innerHTML = '';
  SUGGESTIONS.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = labels[i];
    b.onclick = () => { addUserMsg(labels[i]); respond(s.q); };
    box.appendChild(b);
  });
}
function addUserMsg(text) {
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = '<div class="msg-avatar">🧑</div><div class="msg-bubble"></div>';
  div.querySelector('.msg-bubble').textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function botReply(html) {
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = '<div class="msg-avatar">🤖</div><div class="msg-bubble">' + html + '</div>';
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg'; div.id = 'typingMsg';
  div.innerHTML = '<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function hideTyping() { const tp = document.getElementById('typingMsg'); if (tp) tp.remove(); }
function respond(text) {
  showTyping();
  const answer = findAnswer(text);
  const delay = 500 + Math.min(answer.length * 2, 900);
  setTimeout(() => { hideTyping(); botReply(answer); }, delay);
}
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addUserMsg(text);
  chatInput.value = '';
  respond(text);
}

/* ═══════════════ COUNTER ANIMATION ═══════════════ */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const step = 16;
  const increment = target / (duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString();
  }, step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        if (el.dataset.animated) return;
        el.dataset.animated = "1";
        animateCounter(el);
      });
    }
  });
}, { threshold: 0.3 });
const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

/* ═══════════════ SCROLL REVEAL ═══════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.service-card, .step, .uni-card, .testimonial-card, .blog-card, .hero-card, .top-uni-chip, .faq-item'
).forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 60 + 'ms';
  el.classList.add('reveal-ready');
  revealObserver.observe(el);
});

/* ═══════════════ SITE SETTINGS (admin override) ═══════════════ */
const SETTINGS_KEY = "ep_settings";
const HIDDEN_KEY   = "ep_hidden_unis";
const EXTRA_KEY    = "ep_extra_unis";

function loadSiteSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const cfg = JSON.parse(raw);

    // Business name — patch logo text nodes
    if (cfg.businessName) {
      document.querySelectorAll('.logo-text, .logo').forEach(el => {
        el.childNodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) n.textContent = " " + cfg.businessName; });
      });
    }

    // CSS color theme
    const root = document.documentElement;
    if (cfg.primaryColor)     root.style.setProperty('--primary',      cfg.primaryColor);
    if (cfg.primaryDarkColor) root.style.setProperty('--primary-dark', cfg.primaryDarkColor);
    if (cfg.accentColor)      root.style.setProperty('--accent',       cfg.accentColor);

    // WhatsApp — patch all wa.me links
    if (cfg.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
        a.href = a.href.replace(/wa\.me\/[0-9]+/, 'wa.me/' + cfg.whatsapp);
      });
    }

    // Stats bar data-target override
    if (cfg.stats) {
      const nums = document.querySelectorAll('.stat-num[data-target]');
      const keys = ['unis','courses','centers','students'];
      nums.forEach((el, i) => { if (cfg.stats[keys[i]]) el.dataset.target = cfg.stats[keys[i]]; });
    }

    // Hero text overrides
    if (cfg.heroTitle) {
      const h1 = document.querySelector('.hero h1');
      if (h1) h1.innerHTML = cfg.heroTitle;
    }
    if (cfg.heroDesc) {
      const p = document.querySelector('.hero-content > p, .hero p');
      if (p) p.textContent = cfg.heroDesc;
    }
  } catch(e) { console.warn('Settings load error', e); }
}

// ── University edits (field overrides on base unis) ──
function loadUniEdits() {
  try {
    const raw = localStorage.getItem('ep_uni_edits');
    if (!raw) return;
    const edits = JSON.parse(raw);
    UNIVERSITIES.forEach(u => {
      const e = edits[u.id];
      if (!e) return;
      if (e.name)    u.name    = e.name;
      if (e.type)    u.type    = e.type;
      if (e.city)    u.city    = e.city;
      if (e.state)   u.state   = e.state;
      if (e.tuition) u.tuition = e.tuition;
      if (e.qs  !== undefined) u.qs  = e.qs  || null;
      if (e.est)     u.est     = e.est;
      if (e.website) u.website = e.website;
      if (e.fields && e.fields.length) u.fields = e.fields;
      if (e.icon)    u.icon    = e.icon;
    });
  } catch(e) { console.warn('Uni edits load error', e); }
}

// ── Dynamic homepage sections from admin ──
function renderServicesFromAdmin() {
  const grid = document.querySelector('.services-grid');
  if (!grid) return;
  try {
    const raw = localStorage.getItem('ep_services');
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!items || !items.length) return;
    grid.innerHTML = items.map(s => `
      <div class="service-card reveal-ready">
        <div class="service-num">${s.num}</div>
        <div class="service-icon">${s.icon}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>`).join('');
    grid.querySelectorAll('.service-card').forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      revealObserver.observe(el);
    });
  } catch(e) { console.warn('Services load error', e); }
}

function renderStepsFromAdmin() {
  const stepsEl = document.querySelector('.steps');
  if (!stepsEl) return;
  try {
    const raw = localStorage.getItem('ep_steps');
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!items || !items.length) return;
    stepsEl.innerHTML = items.map((s, i) => `
      <div class="step reveal-ready">
        <div class="step-circle">${i + 1}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>`).join('');
    stepsEl.querySelectorAll('.step').forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      revealObserver.observe(el);
    });
  } catch(e) { console.warn('Steps load error', e); }
}

function renderTestimonialsFromAdmin() {
  const grid = document.querySelector('.testimonials-grid');
  if (!grid) return;
  try {
    const raw = localStorage.getItem('ep_testimonials');
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!items || !items.length) return;
    grid.innerHTML = items.map(t => `
      <div class="testimonial-card reveal-ready">
        <div class="stars">★★★★★</div>
        <blockquote>"${t.quote}"</blockquote>
        <div class="testimonial-author">
          <div class="author-avatar">${t.avatar || '🧑'}</div>
          <div>
            <div class="author-name">${t.name}</div>
            <div class="author-info">${t.info}</div>
          </div>
        </div>
      </div>`).join('');
    grid.querySelectorAll('.testimonial-card').forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      revealObserver.observe(el);
    });
  } catch(e) { console.warn('Testimonials load error', e); }
}

/* ═══════════════ INIT ═══════════════ */
chatBody = document.getElementById('chatBody');
chatInput = document.getElementById('chatInput');
loadUniEdits();        // patch base university fields first
loadSiteSettings();    // apply colors, stats, hero, WhatsApp
renderServicesFromAdmin();
renderStepsFromAdmin();
renderTestimonialsFromAdmin();
applyLang();           // render everything (calls buildFAQ, renderUnis, etc.)
