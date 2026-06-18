/* ═══════════════════════════════════════════════════════════════
   shared.js — Unified navigation, footer & admin settings
   Include on every inner page for a consistent EduPath experience
   index.html has its own full system (app.js) — no need there
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Mini i18n for nav/footer ── */
  const NL = {
    en: { home:'Home', unis:'Universities', institutes:'Institutes', courses:'Courses', schols:'Scholarships', blog:'Blog',
          apply:'Apply Now', consult:'Free Consult', quick:'Quick Links', services:'Services', contact:'Contact Us',
          tagline:'Your trusted partner for studying in Malaysia.',
          svc1:'Free Consultation', svc2:'University Matching', svc3:'Visa Assistance',
          svc4:'Accommodation', svc5:'Airport Transfer',
          ctaBook:'Book Consultation', ctaFaq:'FAQ' },
    ar: { home:'الرئيسية', unis:'الجامعات', institutes:'معاهد اللغة', courses:'التخصصات', schols:'المنح', blog:'المدونة',
          apply:'قدّم الآن', consult:'استشارة مجانية', quick:'روابط سريعة', services:'خدماتنا', contact:'تواصل معنا',
          tagline:'شريكك الموثوق للدراسة في ماليزيا.',
          svc1:'استشارة مجانية', svc2:'مطابقة الجامعات', svc3:'مساعدة التأشيرة',
          svc4:'السكن', svc5:'نقل من المطار',
          ctaBook:'احجز استشارة', ctaFaq:'الأسئلة الشائعة' },
    ja: { home:'ホーム', unis:'大学', institutes:'語学院', courses:'コース', schols:'奨学金', blog:'ブログ',
          apply:'今すぐ出願', consult:'無料相談', quick:'クイックリンク', services:'サービス', contact:'お問い合わせ',
          tagline:'マレーシア留学のための信頼できるパートナー。',
          svc1:'無料相談', svc2:'大学マッチング', svc3:'ビザサポート',
          svc4:'宿泊手配', svc5:'空港送迎',
          ctaBook:'相談を予約', ctaFaq:'よくある質問' },
    ko: { home:'홈', unis:'대학교', institutes:'어학원', courses:'과정', schols:'장학금', blog:'블로그',
          apply:'지금 지원', consult:'무료 상담', quick:'빠른 링크', services:'서비스', contact:'연락처',
          tagline:'말레이시아 유학을 위한 신뢰할 수 있는 파트너.',
          svc1:'무료 상담', svc2:'대학교 매칭', svc3:'비자 지원',
          svc4:'숙소 마련', svc5:'공항 픽업',
          ctaBook:'상담 예약', ctaFaq:'자주 묻는 질문' },
    ru: { home:'Главная', unis:'Университеты', institutes:'Языковые центры', courses:'Программы', schols:'Стипендии', blog:'Блог',
          apply:'Подать заявку', consult:'Бесплатная консультация', quick:'Быстрые ссылки', services:'Услуги', contact:'Контакты',
          tagline:'Ваш надёжный партнёр для учёбы в Малайзии.',
          svc1:'Бесплатная консультация', svc2:'Подбор университета', svc3:'Помощь с визой',
          svc4:'Размещение', svc5:'Трансфер из аэропорта',
          ctaBook:'Записаться', ctaFaq:'FAQ' },
  };
  const LM = { en:{f:'🇬🇧',l:'EN',d:'ltr'}, ar:{f:'🇸🇦',l:'AR',d:'rtl'},
                ja:{f:'🇯🇵',l:'JA',d:'ltr'}, ko:{f:'🇰🇷',l:'KO',d:'ltr'}, ru:{f:'🇷🇺',l:'RU',d:'ltr'} };

  let _lang = localStorage.getItem('lang') || 'en';
  function nt(k) { return (NL[_lang] || NL.en)[k] || k; }

  /* ── Admin settings ── */
  function cfg() {
    try { return JSON.parse(localStorage.getItem('ep_settings') || '{}'); } catch { return {}; }
  }
  function wa()   { return cfg().whatsapp || '60123456789'; }
  function biz()  { return cfg().businessName || 'EduPath'; }
  function yr()   { return cfg().year || new Date().getFullYear(); }

  /* ── Apply CSS theme ── */
  function applyTheme() {
    const c = cfg(), r = document.documentElement;
    if (c.primaryColor)     r.style.setProperty('--primary',      c.primaryColor);
    if (c.primaryDarkColor) r.style.setProperty('--primary-dark', c.primaryDarkColor);
    if (c.accentColor)      r.style.setProperty('--accent',       c.accentColor);
    const m = LM[_lang] || LM.en;
    r.lang = _lang; r.dir = m.d;
  }

  /* ── Apply WhatsApp ── */
  function applyWA() {
    const w = cfg().whatsapp; if (!w) return;
    document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
      a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + w);
    });
  }

  /* ── Shared CSS ── */
  function injectCSS() {
    if (document.getElementById('s-css')) return;
    const s = document.createElement('style'); s.id = 's-css';
    s.textContent = `
/* ── Shared Nav ── */
.s-nav{position:sticky;top:0;z-index:300;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 2px 12px rgba(0,0,0,.07)}
.s-nav-in{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:70px;gap:12px}
.s-logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:21px;color:var(--primary,#0a5c8a);text-decoration:none;flex-shrink:0}
.s-logo-ico{width:38px;height:38px;background:var(--primary,#0a5c8a);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.s-logo-ico svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.s-links{display:flex;align-items:center;gap:2px}
.s-links a{padding:8px 11px;border-radius:8px;font-size:13.5px;font-weight:500;color:#64748b;text-decoration:none;transition:.18s;white-space:nowrap}
.s-links a:hover,.s-links a.act{color:var(--primary,#0a5c8a);background:#e8f4fb}
.s-apply{background:#f59e0b!important;color:#fff!important;font-weight:700!important;padding:9px 16px!important;border-radius:8px!important}
.s-apply:hover{background:#d97706!important;color:#fff!important}
.s-cta{background:var(--primary,#0a5c8a)!important;color:#fff!important;font-weight:700!important;padding:9px 16px!important;border-radius:8px!important}
.s-cta:hover{background:var(--primary-dark,#074166)!important;color:#fff!important}
/* lang */
.s-lang{position:relative;flex-shrink:0}
.s-lang-btn{background:none;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;color:#64748b;font-family:inherit;transition:.18s}
.s-lang-btn:hover{border-color:var(--primary,#0a5c8a);color:var(--primary,#0a5c8a)}
.s-lang-drop{position:absolute;top:calc(100% + 8px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.13);min-width:148px;overflow:hidden;z-index:999;display:none;padding:6px}
.s-lang-drop.open{display:block}
.s-lang-opt{display:flex;align-items:center;gap:8px;padding:9px 12px;font-size:13px;font-weight:600;cursor:pointer;border-radius:7px;transition:.15s}
.s-lang-opt:hover{background:#f1f5f9}
.s-lang-opt.sel{color:var(--primary,#0a5c8a);background:#e8f4fb}
/* hamburger */
.s-ham{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:5px;background:none;border:none;flex-shrink:0}
.s-ham span{display:block;width:24px;height:2px;background:#1e293b;border-radius:2px}
/* mobile menu */
.s-mob{display:none;border-top:1px solid #e2e8f0;background:#fff;padding:12px 20px 16px}
.s-mob.open{display:block}
.s-mob a{display:block;padding:11px 14px;border-radius:8px;font-size:15px;font-weight:600;color:#1e293b;text-decoration:none;margin-bottom:2px}
.s-mob a:hover{background:#f1f5f9}
.s-mob .s-cta-m{background:var(--primary,#0a5c8a);color:#fff!important;text-align:center;margin-top:8px;font-weight:700;border-radius:8px}
@media(max-width:900px){.s-links{display:none}.s-ham{display:flex}}
@media(max-width:500px){.s-logo span{display:none}}

/* ── Shared Footer ── */
.s-footer{background:#0f172a;color:rgba(255,255,255,.8);padding:56px 24px 0}
.s-foot-in{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:44px}
@media(max-width:880px){.s-foot-in{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.s-foot-in{grid-template-columns:1fr}}
.sf-logo{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:800;color:#fff;margin-bottom:14px}
.sf-logo .ico{width:36px;height:36px;background:var(--primary,#0a5c8a);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sf-logo .ico svg{width:20px;height:20px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sf-tag{font-size:13px;color:rgba(255,255,255,.45);line-height:1.65;margin-bottom:20px;max-width:220px}
.sf-soc{display:flex;gap:10px}
.sf-soc a{width:36px;height:36px;background:rgba(255,255,255,.08);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;text-decoration:none;transition:.2s}
.sf-soc a:hover{background:rgba(255,255,255,.2)}
.sf-col h4{font-size:11.5px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.07em;margin-bottom:16px}
.sf-col ul{list-style:none}
.sf-col li{margin-bottom:9px}
.sf-col a{color:rgba(255,255,255,.5);font-size:13.5px;text-decoration:none;transition:.15s}
.sf-col a:hover{color:#fff}
.sf-bot{max-width:1200px;margin:40px auto 0;padding:18px 0;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.sf-bot>span{font-size:12.5px;color:rgba(255,255,255,.3)}
.sf-bot>a{font-size:11px;color:rgba(255,255,255,.18);text-decoration:none}
.sf-bot>a:hover{color:rgba(255,255,255,.5)}
    `;
    document.head.insertBefore(s, document.head.firstChild);
  }

  /* ── Nav builder ── */
  function buildNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const act  = p => page === p ? ' class="act"' : '';
    const m    = LM[_lang] || LM.en;
    const W    = wa(), B = biz();

    const opts = Object.entries(LM).map(([k,v]) =>
      `<div class="s-lang-opt${k===_lang?' sel':''}" onclick="window.__sl('${k}')">${v.f} ${v.l}</div>`
    ).join('');

    return `<nav class="s-nav" id="sNavEl">
  <div class="s-nav-in">
    <a href="index.html" class="s-logo">
      <div class="s-logo-ico"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
      <span>${B}</span>
    </a>
    <div class="s-links">
      <a href="index.html"${act('index.html')}>${nt('home')}</a>
      <a href="universities.html"${act('universities.html')}>${nt('unis')}</a>
      <a href="institutes.html"${act('institutes.html')}>${nt('institutes')}</a>
      <a href="courses.html"${act('courses.html')}>${nt('courses')}</a>
      <a href="scholarships.html"${act('scholarships.html')}>${nt('schols')}</a>
      <a href="blog.html"${act('blog.html')}>${nt('blog')}</a>
      <a href="apply.html" class="s-apply${act('apply.html')}">🎓 ${nt('apply')}</a>
      <a href="https://wa.me/${W}" class="s-cta" target="_blank">💬 ${nt('consult')}</a>
      <div class="s-lang">
        <button class="s-lang-btn" onclick="window.__stl(event)">
          <span id="sLF">${m.f}</span> <span id="sLL">${m.l}</span> ▾
        </button>
        <div class="s-lang-drop" id="sLangDrop">${opts}</div>
      </div>
    </div>
    <button class="s-ham" onclick="window.__sm()"><span></span><span></span><span></span></button>
  </div>
  <div class="s-mob" id="sMobMenu">
    <a href="index.html">${nt('home')}</a>
    <a href="universities.html">${nt('unis')}</a>
    <a href="institutes.html">${nt('institutes')}</a>
    <a href="courses.html">${nt('courses')}</a>
    <a href="scholarships.html">${nt('schols')}</a>
    <a href="blog.html">${nt('blog')}</a>
    <a href="apply.html">🎓 ${nt('apply')}</a>
    <a href="https://wa.me/${W}" class="s-cta-m" target="_blank">💬 ${nt('consult')}</a>
  </div>
</nav>`;
  }

  /* ── Footer builder ── */
  function buildFooter() {
    const c  = cfg(), W = wa(), B = biz(), Y = yr();
    return `<footer class="s-footer" id="sFooterEl">
  <div class="s-foot-in">
    <div>
      <div class="sf-logo">
        <div class="ico"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>${B}
      </div>
      <p class="sf-tag">${nt('tagline')}</p>
      <div class="sf-soc">
        <a href="https://wa.me/${W}" target="_blank">💬</a>
        ${c.facebook  ? `<a href="${c.facebook}"  target="_blank">📘</a>` : ''}
        ${c.instagram ? `<a href="${c.instagram}" target="_blank">📸</a>` : ''}
        ${c.youtube   ? `<a href="${c.youtube}"   target="_blank">▶️</a>` : ''}
      </div>
    </div>
    <div class="sf-col">
      <h4>${nt('quick')}</h4>
      <ul>
        <li><a href="index.html">${nt('home')}</a></li>
        <li><a href="universities.html">${nt('unis')}</a></li>
        <li><a href="institutes.html">${nt('institutes')}</a></li>
        <li><a href="courses.html">${nt('courses')}</a></li>
        <li><a href="scholarships.html">${nt('schols')}</a></li>
        <li><a href="blog.html">${nt('blog')}</a></li>
        <li><a href="apply.html" style="color:#f59e0b;font-weight:700">🎓 ${nt('apply')}</a></li>
      </ul>
    </div>
    <div class="sf-col">
      <h4>${nt('services')}</h4>
      <ul>
        <li><a href="index.html#contact">${nt('svc1')}</a></li>
        <li><a href="universities.html">${nt('svc2')}</a></li>
        <li><a href="index.html#contact">${nt('svc3')}</a></li>
        <li><a href="index.html#contact">${nt('svc4')}</a></li>
        <li><a href="index.html#contact">${nt('svc5')}</a></li>
      </ul>
    </div>
    <div class="sf-col">
      <h4>${nt('contact')}</h4>
      <ul>
        <li><a href="https://wa.me/${W}" target="_blank">💬 WhatsApp</a></li>
        ${c.email ? `<li><a href="mailto:${c.email}">✉️ ${c.email}</a></li>` : ''}
        <li><a href="index.html#contact">📞 ${nt('ctaBook')}</a></li>
        <li><a href="index.html#faq">❓ ${nt('ctaFaq')}</a></li>
      </ul>
    </div>
  </div>
  <div class="sf-bot">
    <span>© ${Y} ${B}. All rights reserved.</span>
    <div style="display:flex;gap:20px;align-items:center">
      <a href="privacy.html" style="color:rgba(255,255,255,.6);font-size:13px">Privacy Policy</a>
      <a href="admin.html">⚙ Admin Panel</a>
    </div>
  </div>
</footer>`;
  }

  /* ── Inject into DOM ── */
  function inject() {
    // ── Nav ──
    const el = document.createElement('div');

    let oldNav = document.getElementById('sNavEl') || document.querySelector('.navbar');
    if (oldNav) {
      el.innerHTML = buildNav();
      oldNav.replaceWith(el.firstElementChild);
    } else {
      document.body.insertAdjacentHTML('afterbegin', buildNav());
    }

    // ── Footer ──
    let oldFoot = document.getElementById('sFooterEl') || document.querySelector('footer');
    if (oldFoot) {
      el.innerHTML = buildFooter();
      oldFoot.replaceWith(el.firstElementChild);
    } else {
      // Append before final WA float or before </body>
      const wafloat = document.querySelector('.wa-float');
      if (wafloat) wafloat.insertAdjacentHTML('beforebegin', buildFooter());
      else document.body.insertAdjacentHTML('beforeend', buildFooter());
    }

    // ── Apply WA to all links ──
    applyWA();

    // Close lang on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.s-lang')) {
        const d = document.getElementById('sLangDrop');
        if (d) d.classList.remove('open');
      }
    });
  }

  /* ── Public API ── */
  // Toggle lang dropdown
  window.__stl = function(e) {
    e.stopPropagation();
    const d = document.getElementById('sLangDrop');
    if (d) d.classList.toggle('open');
  };

  // Set language
  window.__sl = function(lang) {
    _lang = lang;
    localStorage.setItem('lang', lang);
    const d = document.getElementById('sLangDrop');
    if (d) d.classList.remove('open');
    const m = LM[lang] || LM.en;
    document.documentElement.lang = lang;
    document.documentElement.dir  = m.d;
    // If page has its own setLang() (e.g. university.html), delegate to it
    if (typeof setLang === 'function') {
      setLang(lang);
    }
    // Re-render shared nav + footer with new lang
    inject();
  };

  // Toggle mobile menu
  window.__sm = function() {
    const m = document.getElementById('sMobMenu');
    if (m) m.classList.toggle('open');
  };

  /* ── Boot ── */
  injectCSS();
  applyTheme();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
