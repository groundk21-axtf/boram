/* site-chrome.js — 고객 사이트 공통 헤더 + 푸터 + 인터랙션
   미리보기(tms2-builder.html 안)의 .ps-* 마크업과 동일한 구조로 모달/드로어 제공.
   사용 페이지는 css/preview.css 를 함께 로드해야 함. */

const SITE_CONFIG = {
  // 헤더
  logoUrl: 'images/logo-boram.svg',
  homeUrl: 'index.html',
  // GNB — 빌더의 페이지 키와 매핑 (tms2-builder.html?page=KEY로 이동 → 빌더가 해당 페이지 표시)
  gnbPages: [  ],
  // 미리보기 STATE.site 와 동일한 필드를 갖는 mock site
  site: {
    supportedLanguages: ['ko', 'en', 'ja'],   // state.js 기본값과 동일
    defaultLanguage: 'ko',
    memberBooking: true,
    guestBooking:  true,
    guestFields: ['name', 'email', 'phone'],
    socialLogins: {
      kakao:  { enabled: true },
      naver:  { enabled: true },
      google: { enabled: true },
      apple:  { enabled: true }
    },
    terms: [
      { name: '이용약관',          type: 'url', required: true,  value: 'https://groundk.notion.site/RIDEUS-20da594d587b4bf18dc09720b9997027?pvs=4' },
      { name: '개인정보처리방침',  type: 'url', required: true,  value: 'https://groundk.notion.site/RIDEUS-e659d6ede5a040a88c6126ed50deec98' }
    ]
  },

  // 푸터
  tagline:     '교통 X 여행 No.1 플랫폼\n그라운드케이',
  taglineDesc: '어디를 가든, 누구와 가든, 그라운드케이가 있다면 가볍게 떠날 수 있습니다.\n쉽고, 빠르고, 편안한 이동을 경험하세요.',
  companyName: '(주)그라운드케이',
  bizInfo: [
    { label: '대표이사',    value: '장동원' },
    { label: '주소',        value: '부산광역시 해운대구 센텀동로 45, 405호' },
    { label: '사업자번호',  value: '238-81-00429' },
    { label: 'Tel',         value: '+82-2-863-3540' },
    { label: 'Fax',         value: '+82-70-8275-3540' },
    { label: 'Email',       value: 'ops@rideus.co.kr' }
  ],
  termsLinks: [
    { name: '이용약관',          url: 'https://groundk.notion.site/RIDEUS-20da594d587b4bf18dc09720b9997027?pvs=4' },
    { name: '개인정보처리방침',  url: 'https://groundk.notion.site/RIDEUS-e659d6ede5a040a88c6126ed50deec98' }
  ]
};

// 미리보기와 동일한 언어 매핑
const SC_LANG_LABELS = {
  ko: '한국어', en: 'English', ja: '日本語',
  'zh-tw': '繁體中文', 'zh-cn': '简体中文',
  fr: 'Français', es: 'Español', de: 'Deutsch'
};
const SC_LANG_FLAGS = {
  ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵',
  'zh-tw': '🇹🇼', 'zh-cn': '🇨🇳',
  fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪'
};

let _scCurrentLang = SITE_CONFIG.site.defaultLanguage;

function _scEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============================================================
   헤더 렌더
   ============================================================ */
function renderSiteHeader(activePage) {
  const gnb = SITE_CONFIG.gnbPages.map(p =>
    `<a class="sr-site-gnb-link${activePage && p.name === activePage ? ' active' : ''}" href="${_scEsc(p.href)}" data-gnb-name="${_scEsc(p.name)}">${_scEsc(p.name)}</a>`
  ).join('');
  const site = SITE_CONFIG.site;

  const curFlag  = SC_LANG_FLAGS[_scCurrentLang]  || '🌐';
  const curLabel = SC_LANG_LABELS[_scCurrentLang] || _scCurrentLang;

  return `<header class="sr-site-header">
    <div class="sr-site-header-inner">
      <a href="${_scEsc(SITE_CONFIG.homeUrl)}" class="sr-site-home-link" aria-label="홈" style="display:flex;flex-shrink:0;">
        <img class="sr-site-logo" src="${_scEsc(SITE_CONFIG.logoUrl)}" alt="GroundK">
      </a>
      <nav class="sr-site-gnb">${gnb}</nav>
      <div class="sr-site-spacer"></div>
      <div class="sr-site-actions">
        <div class="sr-site-lang-wrap">
          <button class="sr-site-lang" type="button" data-sc-lang-toggle>
            <span class="sr-site-lang-flag">${curFlag}</span>
            <span class="sr-site-lang-label">${_scEsc(curLabel)}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="sr-site-lang-menu" hidden>
            ${site.supportedLanguages.map(code => `
              <button type="button" class="sr-site-lang-option${code === _scCurrentLang ? ' active' : ''}" data-sc-lang-pick="${code}">
                <span class="sr-site-lang-flag">${SC_LANG_FLAGS[code] || '🌐'}</span>
                <span>${_scEsc(SC_LANG_LABELS[code] || code)}</span>
                ${code === _scCurrentLang ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
              </button>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </header>`;
}

/* ============================================================
   푸터 렌더
   
function renderSiteFooter() {
  const termsHtml = SITE_CONFIG.termsLinks.map((t, i) => {
    const link = `<a class="sr-footer-terms-link" href="${_scEsc(t.url)}" target="_blank" rel="noopener noreferrer">${_scEsc(t.name)}</a>`;
    return i === 0 ? link : `<span class="sr-footer-terms-sep">|</span>${link}`;
  }).join('');
  const bizHtml = SITE_CONFIG.bizInfo.map(b =>
    `<div class="sr-footer-bizinfo-row">
      <span class="sr-footer-bizinfo-label">${_scEsc(b.label)}</span>
      <span>${_scEsc(b.value)}</span>
    </div>`).join('');
  return `<footer class="sr-footer">
    <div class="sr-footer-inner">
      <div class="sr-footer-tagline">
        <h3>${_scEsc(SITE_CONFIG.tagline)}</h3>
        <p>${_scEsc(SITE_CONFIG.taglineDesc)}</p>
      </div>
      <div class="sr-footer-info">
        <div class="sr-footer-terms">${termsHtml}</div>
        <div class="sr-footer-company-name">${_scEsc(SITE_CONFIG.companyName)}</div>
        <div class="sr-footer-bizinfo">${bizHtml}</div>
      </div>
      <div class="sr-footer-platform">Powered by GroundK</div>
    </div>
  </footer>`;
}
============================================================ */

/* ============================================================
   비회원 예약조회 모달 (미리보기 renderGuestLookupModal과 동일)
   ============================================================ */
function _scOpenGuestLookupModal() {
  const site = SITE_CONFIG.site;
  const fields = Array.isArray(site.guestFields) ? site.guestFields : [];
  const FIELD_DEF = {
    name:  { label: '이름',     type: 'text',  placeholder: '홍길동' },
    email: { label: '이메일',   type: 'email', placeholder: 'name@example.com' },
    phone: { label: '전화번호', type: 'tel',   placeholder: '010-0000-0000' }
  };
  const fieldRows = fields
    .filter(k => FIELD_DEF[k])
    .map(k => {
      const f = FIELD_DEF[k];
      return `<div class="ps-form-row">
        <label>${f.label}</label>
        <input class="ps-input" type="${f.type}" placeholder="${f.placeholder}" />
      </div>`;
    }).join('');
  const bodyInner = fieldRows || `<div class="ps-modal-empty">예약자 확인 항목이 설정되지 않았습니다.</div>`;
  _scShowModal(`
    <div class="ps-modal-backdrop show" data-guest-modal>
      <div class="ps-modal" role="dialog" aria-modal="true" aria-labelledby="guestLookupTitle">
        <button class="ps-modal-close" data-guest-close aria-label="닫기">×</button>
        <div class="ps-modal-head">
          <h3 id="guestLookupTitle">비회원 예약조회</h3>
          <p>예약 시 입력하신 정보로 조회하세요.</p>
        </div>
        <div class="ps-modal-body">${bodyInner}</div>
        <div class="ps-modal-foot">
          <button class="ps-modal-btn outline" data-guest-close>취소</button>
          <button class="ps-modal-btn primary" data-guest-submit>예약 조회</button>
        </div>
      </div>
    </div>`);

  const root = document.body.lastElementChild;
  const close = () => { root.remove(); document.body.style.overflow = ''; };
  root.querySelectorAll('[data-guest-close]').forEach(b => b.addEventListener('click', close));
  root.addEventListener('click', e => { if (e.target === root) close(); });
  root.querySelector('[data-guest-submit]').addEventListener('click', () => {
    alert('예약 조회 (mockup)'); close();
  });
}

/* ============================================================
   로그인/회원가입 모달 (미리보기 renderAuthModal과 동일)
   ============================================================ */
function _scOpenAuthModal(mode) {
  const site = SITE_CONFIG.site;
  const socials = site.socialLogins || {};
  const SOCIAL_ICON = {
    kakao:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C6.48 4 2 7.5 2 11.8c0 2.78 1.83 5.22 4.58 6.6l-.93 3.43c-.08.3.25.54.51.36l4.1-2.72c.57.07 1.15.1 1.74.1 5.52 0 10-3.5 10-7.77S17.52 4 12 4z"/></svg>',
    naver:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.27 12.78 7.55 0H0v24h7.73V11.22L16.45 24H24V0h-7.73v12.78z"/></svg>',
    google: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    apple:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>'
  };
  const SOCIAL_DEF = [
    { key: 'kakao', label: '카카오' }, { key: 'naver', label: '네이버' },
    { key: 'google', label: '구글' }, { key: 'apple', label: '애플' }
  ];
  const enabledSocials = SOCIAL_DEF.filter(s => socials[s.key]?.enabled);
  const socialHtml = enabledSocials.length ? `
    <div class="ps-modal-divider">또는</div>
    <div class="ps-social-row">
      ${enabledSocials.map(s => `
        <button type="button" class="ps-social-btn ${s.key}" data-social="${s.key}" aria-label="${s.label}로 ${mode === 'login' ? '로그인' : '시작하기'}">
          ${SOCIAL_ICON[s.key]}
        </button>`).join('')}
    </div>` : '';

  if (mode === 'login') {
    _scShowModal(`
      <div class="ps-modal-backdrop show" data-auth-modal>
        <div class="ps-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
          <button class="ps-modal-close" data-auth-close aria-label="닫기">×</button>
          <div class="ps-modal-head"><h3 id="authTitle">로그인</h3></div>
          <div class="ps-modal-body">
            <div class="ps-form-row">
              <label>이메일</label>
              <input class="ps-input" type="email" placeholder="name@example.com" />
            </div>
            <div class="ps-form-row">
              <label>비밀번호</label>
              <input class="ps-input" type="password" placeholder="비밀번호" />
            </div>
            <button type="button" class="ps-modal-link" data-auth-find-pw>비밀번호를 잊으셨나요?</button>
            ${socialHtml}
          </div>
          <div class="ps-modal-foot">
            <button class="ps-modal-btn primary" data-auth-submit>로그인</button>
          </div>
          <div class="ps-modal-foot-note">
            아직 회원이 아니신가요?<button type="button" data-auth-swap="signup">회원가입</button>
          </div>
        </div>
      </div>`);
  } else {
    // signup — phone country code picker + terms list (전체 동의 포함)
    const COUNTRIES = [
      { dial: '+82',  name: '한국',    flag: '🇰🇷' },
      { dial: '+1',   name: '미국',    flag: '🇺🇸' },
      { dial: '+81',  name: '일본',    flag: '🇯🇵' },
      { dial: '+86',  name: '중국',    flag: '🇨🇳' },
      { dial: '+886', name: '대만',    flag: '🇹🇼' },
      { dial: '+852', name: '홍콩',    flag: '🇭🇰' },
      { dial: '+65',  name: '싱가포르', flag: '🇸🇬' },
      { dial: '+84',  name: '베트남',   flag: '🇻🇳' },
      { dial: '+66',  name: '태국',    flag: '🇹🇭' },
      { dial: '+44',  name: '영국',    flag: '🇬🇧' }
    ];
    const def = COUNTRIES[0];
    const phoneCcHtml = `
      <div class="ps-phone-input">
        <button type="button" class="ps-phone-cc" data-phone-cc aria-label="국가번호 선택">
          <span class="ps-phone-cc-flag" data-phone-cc-flag>${def.flag}</span>
          <span data-phone-cc-dial>${def.dial}</span>
          <svg class="ps-phone-cc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <input class="ps-input" type="tel" placeholder="10-1234-5678" />
        <div class="ps-phone-cc-menu" data-phone-cc-menu>
          <div class="ps-phone-cc-search">
            <input type="text" placeholder="국가명·국가코드 검색" data-phone-cc-search />
          </div>
          ${COUNTRIES.map((c, i) => `
            <button type="button" class="ps-phone-cc-item${i === 0 ? ' active' : ''}" data-phone-cc-item data-flag="${c.flag}" data-dial="${c.dial}">
              <span class="ps-phone-cc-flag">${c.flag}</span>
              <span class="ps-phone-cc-name">${c.name}</span>
              <span class="ps-phone-cc-dial">${c.dial}</span>
            </button>`).join('')}
          <div class="ps-phone-cc-empty" data-phone-cc-empty style="display:none">일치하는 국가가 없습니다</div>
        </div>
      </div>`;

    const terms = site.terms || [];
    const termsHtml = terms.length ? `
      <div class="ps-form-row">
        <label>약관 동의</label>
        <div class="ps-check-list">
          <label class="ps-check-row all">
            <input type="checkbox" data-auth-terms-all />
            <span>전체 동의</span>
          </label>
          ${terms.map((t, i) => {
            const required = t.required === true;
            const tagClass = required ? 'ps-check-required' : 'ps-check-optional';
            const tagText  = required ? '[필수]' : '[선택]';
            return `
            <label class="ps-check-row">
              <input type="checkbox" data-auth-term data-auth-term-required="${required ? '1' : '0'}" />
              <span><span class="${tagClass}">${tagText}</span>${_scEsc(t.name || `약관 ${i+1}`)}</span>
              ${t.type === 'url' && t.value ? `<a href="${_scEsc(t.value)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">보기</a>` : ''}
            </label>`;
          }).join('')}
        </div>
      </div>` : '';

    _scShowModal(`
      <div class="ps-modal-backdrop show" data-auth-modal>
        <div class="ps-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
          <button class="ps-modal-close" data-auth-close aria-label="닫기">×</button>
          <div class="ps-modal-head"><h3 id="authTitle">회원가입</h3></div>
          <div class="ps-modal-body">
            <div class="ps-form-row">
              <label>이름</label>
              <input class="ps-input" type="text" placeholder="홍길동" />
            </div>
            <div class="ps-form-row">
              <label>이메일</label>
              <div class="ps-input-action">
                <input class="ps-input" type="email" placeholder="name@example.com" data-auth-email />
                <button type="button" class="ps-input-btn" data-auth-verify>인증요청</button>
              </div>
            </div>
            <div class="ps-form-row">
              <label>비밀번호</label>
              <input class="ps-input" type="password" placeholder="영문·숫자 포함 8자 이상" />
            </div>
            <div class="ps-form-row">
              <label>비밀번호 확인</label>
              <input class="ps-input" type="password" placeholder="비밀번호 다시 입력" />
            </div>
            <div class="ps-form-row">
              <label>휴대폰</label>
              ${phoneCcHtml}
            </div>
            ${termsHtml}
            ${socialHtml}
          </div>
          <div class="ps-modal-foot">
            <button class="ps-modal-btn primary" data-auth-submit>회원가입</button>
          </div>
          <div class="ps-modal-foot-note">
            이미 계정이 있으신가요?<button type="button" data-auth-swap="login">로그인</button>
          </div>
        </div>
      </div>`);
  }
  _scBindAuthModal();
}

/* 모달 공통 표시 + 인터랙션 바인딩 */
function _scShowModal(html) {
  // 기존 모달 제거
  document.querySelectorAll('.ps-modal-backdrop[data-sc-injected]').forEach(m => m.remove());
  const tmp = document.createElement('div');
  tmp.innerHTML = html.trim();
  const node = tmp.firstChild;
  node.setAttribute('data-sc-injected', '1');
  document.body.appendChild(node);
  document.body.style.overflow = 'hidden';
}

function _scBindAuthModal() {
  const root = document.querySelector('.ps-modal-backdrop[data-auth-modal]');
  if (!root) return;
  const close = () => { root.remove(); document.body.style.overflow = ''; };

  // 닫기 / 배경 클릭
  root.querySelectorAll('[data-auth-close]').forEach(b => b.addEventListener('click', close));
  root.addEventListener('click', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  // 제출
  root.querySelector('[data-auth-submit]')?.addEventListener('click', () => {
    const title = root.querySelector('h3')?.textContent?.trim() || '';
    alert(`${title} 완료 (mockup)`);
    close();
  });

  // 로그인 ↔ 회원가입 swap
  root.querySelector('[data-auth-swap]')?.addEventListener('click', e => {
    const next = e.currentTarget.dataset.authSwap;
    close();
    _scOpenAuthModal(next);
  });

  // 비밀번호 찾기
  root.querySelector('[data-auth-find-pw]')?.addEventListener('click', () => {
    alert('비밀번호 찾기 (mockup)');
  });

  // 이메일 인증요청 (mockup)
  root.querySelector('[data-auth-verify]')?.addEventListener('click', () => {
    alert('인증요청 이메일을 보냈습니다 (mockup)');
  });

  // 전체 동의 ↔ 개별 약관
  const allBox = root.querySelector('[data-auth-terms-all]');
  if (allBox) {
    allBox.addEventListener('change', () => {
      root.querySelectorAll('[data-auth-term]').forEach(cb => { cb.checked = allBox.checked; });
    });
    root.querySelectorAll('[data-auth-term]').forEach(cb => {
      cb.addEventListener('change', () => {
        const all = root.querySelectorAll('[data-auth-term]');
        allBox.checked = Array.from(all).every(b => b.checked);
      });
    });
  }

  // 국가코드 picker
  const ccBtn = root.querySelector('[data-phone-cc]');
  const ccMenu = root.querySelector('[data-phone-cc-menu]');
  if (ccBtn && ccMenu) {
    ccBtn.addEventListener('click', e => {
      e.stopPropagation();
      ccMenu.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.ps-phone-input')) ccMenu.classList.remove('open');
    });
    root.querySelectorAll('[data-phone-cc-item]').forEach(it => {
      it.addEventListener('click', () => {
        root.querySelectorAll('[data-phone-cc-item]').forEach(x => x.classList.remove('active'));
        it.classList.add('active');
        root.querySelector('[data-phone-cc-flag]').textContent = it.dataset.flag;
        root.querySelector('[data-phone-cc-dial]').textContent = it.dataset.dial;
        ccMenu.classList.remove('open');
      });
    });
    const ccSearch = root.querySelector('[data-phone-cc-search]');
    if (ccSearch) {
      ccSearch.addEventListener('input', () => {
        const q = ccSearch.value.trim().toLowerCase();
        let visible = 0;
        root.querySelectorAll('[data-phone-cc-item]').forEach(it => {
          const text = it.textContent.toLowerCase();
          const ok = !q || text.includes(q);
          it.style.display = ok ? '' : 'none';
          if (ok) visible++;
        });
        const empty = root.querySelector('[data-phone-cc-empty]');
        if (empty) empty.style.display = visible ? 'none' : '';
      });
    }
  }
}

/* ============================================================
   모바일 햄버거 드로어 (미리보기 renderMobileNav와 동일 구조)
   ============================================================ */
function _scOpenMobileNav() {
  if (document.querySelector('.ps-mnav-backdrop[data-sc-injected]')) return;
  const site = SITE_CONFIG.site;
  const chev = '<svg class="ps-mnav-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

  // 메뉴 섹션
  const gnbLinks = SITE_CONFIG.gnbPages.map(p =>
    `<a class="ps-mnav-link" href="${_scEsc(p.href)}" data-gnb-name="${_scEsc(p.name)}"><span>${_scEsc(p.name)}</span>${chev}</a>`
  ).join('');
  const gnbHtml = `<div class="ps-mnav-section">
    <div class="ps-mnav-section-label">메뉴</div>
    <nav class="ps-mnav-list">${gnbLinks}</nav>
  </div>`;

  // 서비스 섹션 (비회원 예약조회)
  const accountHtml = site.guestBooking ? `<div class="ps-mnav-section">
    <div class="ps-mnav-section-label">서비스</div>
    <nav class="ps-mnav-list">
      <button type="button" class="ps-mnav-link" data-mnav-item="guest-lookup"><span>비회원 예약조회</span>${chev}</button>
    </nav>
  </div>` : '';

  // 언어 선택
  const langs = site.supportedLanguages;
  const checkIcon = '<svg class="ps-mnav-lang-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const langHtml = langs.length >= 2 ? `<div class="ps-mnav-section">
    <div class="ps-mnav-section-label">언어 선택</div>
    <div class="ps-mnav-lang-list">
      ${langs.map(code => `<button type="button" class="ps-mnav-lang-item${code === _scCurrentLang ? ' active' : ''}" data-mnav-lang="${code}">
        <span class="ps-mnav-lang-name">${_scEsc(SC_LANG_LABELS[code] || code)}</span>
        ${code === _scCurrentLang ? checkIcon : ''}
      </button>`).join('')}
    </div>
  </div>` : '';

  // 하단 CTA
  const footerHtml = site.memberBooking !== false ? `<div class="ps-mnav-footer">
    <button type="button" class="ps-mnav-btn outline" data-mnav-item="login">로그인</button>
    <button type="button" class="ps-mnav-btn primary" data-mnav-item="signup">회원가입</button>
  </div>` : '';

  const overlay = document.createElement('div');
  overlay.className = 'ps-mnav-backdrop show';
  overlay.setAttribute('data-sc-injected', '1');
  overlay.innerHTML = `
    <div class="ps-mnav-panel">
      <div class="ps-mnav-top">
        <img class="ps-mnav-logo" src="${_scEsc(SITE_CONFIG.logoUrl)}" alt="logo" />
        <button type="button" class="ps-mnav-close" data-mnav-close aria-label="닫기">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="ps-mnav-body">
        ${gnbHtml}
        ${accountHtml}
        ${langHtml}
      </div>
      ${footerHtml}
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  overlay.querySelector('[data-mnav-close]').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  // GNB 링크 → 페이지 이동
  overlay.querySelectorAll('.ps-mnav-link[href]').forEach(l => {
    l.addEventListener('click', () => close());
  });
  // 액션 (비회원조회 / 로그인 / 회원가입)
  overlay.querySelectorAll('[data-mnav-item]').forEach(b => {
    b.addEventListener('click', () => {
      const key = b.dataset.mnavItem;
      close();
      if (key === 'guest-lookup') _scOpenGuestLookupModal();
      else if (key === 'login')   _scOpenAuthModal('login');
      else if (key === 'signup')  _scOpenAuthModal('signup');
    });
  });
  // 언어 선택
  overlay.querySelectorAll('[data-mnav-lang]').forEach(b => {
    b.addEventListener('click', () => {
      _scCurrentLang = b.dataset.mnavLang;
      close();
      // 헤더 재주입
      const header = document.querySelector('.sr-site-header');
      if (header) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderSiteHeader(header.querySelector('.sr-site-gnb-link.active')?.dataset.gnbName || null);
        header.replaceWith(tmp.firstElementChild);
        _scBindHeaderHandlers();
      }
    });
  });
}

/* ============================================================
   헤더 인터랙션 바인딩
   ============================================================ */
function _scBindHeaderHandlers() {
  const header = document.querySelector('.sr-site-header');
  if (!header) return;

  // 로고 / GNB: anchor href 자연 이동 (preventDefault 안 함)

  // 언어 드롭다운
  const langToggle = header.querySelector('[data-sc-lang-toggle]');
  const langMenu   = header.querySelector('.sr-site-lang-menu');
  if (langToggle && langMenu) {
    langToggle.addEventListener('click', e => {
      e.stopPropagation();
      langMenu.hidden = !langMenu.hidden;
    });
    langMenu.querySelectorAll('[data-sc-lang-pick]').forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        _scCurrentLang = opt.dataset.scLangPick;
        const headerEl = document.querySelector('.sr-site-header');
        if (headerEl) {
          const tmp = document.createElement('div');
          tmp.innerHTML = renderSiteHeader(headerEl.querySelector('.sr-site-gnb-link.active')?.dataset.gnbName || null);
          headerEl.replaceWith(tmp.firstElementChild);
          _scBindHeaderHandlers();
        }
      });
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.sr-site-lang-wrap')) {
        document.querySelectorAll('.sr-site-lang-menu').forEach(m => m.hidden = true);
      }
    });
  }

  // 액션 버튼
  header.querySelectorAll('[data-sc-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.scAction;
      if (action === 'guest')       _scOpenGuestLookupModal();
      else if (action === 'login')  _scOpenAuthModal('login');
      else if (action === 'signup') _scOpenAuthModal('signup');
    });
  });

  // 모바일 햄버거
  header.querySelector('.sr-site-burger')?.addEventListener('click', _scOpenMobileNav);
}

/* ============================================================
   Auto-inject
   ============================================================ */
function _scAutoInject() {
  const headerSlot = document.getElementById('srSiteHeader');
  if (headerSlot) {
    headerSlot.outerHTML = renderSiteHeader(headerSlot.dataset.activePage || null);
  }
  const footerSlot = document.getElementById('srSiteFooter');
  if (footerSlot && typeof renderSiteFooter === 'function') {
    footerSlot.outerHTML = renderSiteFooter();
  }
  _scBindHeaderHandlers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _scAutoInject);
} else {
  _scAutoInject();
}
