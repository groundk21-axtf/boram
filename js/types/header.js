/* types/header.js */

TYPES.header = {
  name: '사이트 헤더', category: 'system', icon: ICN.layoutTop,
  fields: [
    { key: 'logoImage', label: '로고 이미지', type: 'imagepack', maxCount: 1,
      help: '비어 있으면 기본(벤더) 로고가 표시됩니다. 삭제하면 기본으로 되돌아갑니다.'
    },
    { key: 'showGnb', label: 'GNB 링크 노출', type: 'toggle', affectsForm: true,
      help: 'ON 시 로고 옆에 페이지 네비게이션(GNB) 링크가 표시됩니다.'
    },
    { key: 'gnbPages', label: 'GNB 노출 페이지', type: 'multiselect',
      options: () => Object.entries(STATE.pageMeta)
        .filter(([, m]) => m.ready)
        .map(([key, m]) => ({
          value: key,
          label: m.name + (m.enabled === false ? ' (미사용)' : ''),
          disabled: m.enabled === false
        })),
      showWhen: (cfg) => cfg.showGnb === true,
      help: '생성된 페이지 중 헤더 GNB에 노출할 페이지를 선택합니다. 미사용 페이지는 선택할 수 없습니다.'
    },
    { key: 'stickyHeader', label: '스크롤 고정', type: 'toggle',
      help: 'ON 시 페이지 스크롤에도 헤더가 화면 상단에 고정됩니다.'
    },
    { key: '_siteInfo', label: '', type: 'siteInfo' },
    { key: 'previewLoggedIn', label: '미리보기: 로그인 상태', type: 'toggle',
      help: '로그인 후 화면을 미리 확인. 실제 발행에는 영향 없음.' }
  ],
  render: (cfg) => {
    // Language / auth / guest-search settings come from 사이트 설정 (STATE.site), not this section.
    const site = STATE.site || {};
    const langs = Array.isArray(site.supportedLanguages) ? site.supportedLanguages : [];
    const showSelector = langs.length >= 2;
    // Selected preview language: an explicit pick (STATE.previewLang) wins,
    // otherwise fall back to the site default, otherwise the first available.
    const picked = STATE.previewLang;
    const currentLang = (picked && langs.includes(picked))
      ? picked
      : (site.defaultLanguage && langs.includes(site.defaultLanguage))
        ? site.defaultLanguage
        : langs[0];
    const flagOf = (c) => LANG_FLAGS[c] || '🌐';
    // 고객 사이트 헤더 — 원어 이름(LANG_LABELS) 우선 사용
    const labelOf = (c) => LANG_LABELS[c] || c || '';

    // Language selector — opens a dropdown of the 제공 언어 list from 사이트 설정.
    const langHtml = showSelector ? `
      <div class="ps-lang-selector" data-lang-selector>
        <span class="ps-lang-code ps-lang-flag">${flagOf(currentLang)}</span>
        <span class="ps-lang-current">${escapeHtml(labelOf(currentLang))}</span>
        ${ICN.chev}
        <div class="ps-lang-menu" role="listbox">
          ${langs.map(c => `<button type="button" class="ps-lang-option${c === currentLang ? ' active' : ''}" data-lang-pick="${escapeHtml(c)}" role="option" aria-selected="${c === currentLang}">
            <span class="ps-lang-option-code ps-lang-flag">${flagOf(c)}</span>
            <span class="ps-lang-option-label">${escapeHtml(labelOf(c))}</span>
            <span class="ps-lang-option-check">${c === currentLang ? ICN.check : ''}</span>
          </button>`).join('')}
        </div>
      </div>
    ` : '';

    let actionsHtml;
    if (cfg.previewLoggedIn) {
      actionsHtml = `<div class="ps-user-menu" data-user-menu>
        <div class="ps-user-avatar">홍</div>
        <span>홍길동님 안녕하세요</span>
        ${ICN.chev}
        <div class="ps-user-menu-list">
          <button type="button" class="ps-user-menu-item" data-user-menu-item="profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
            내 정보
          </button>
          <button type="button" class="ps-user-menu-item" data-user-menu-item="bookings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"/><path d="M9 5v14"/></svg>
            예약내역
          </button>
          <div class="ps-user-menu-divider"></div>
          <button type="button" class="ps-user-menu-item" data-user-menu-item="logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            로그아웃
          </button>
        </div>
      </div>`;
    } else {
      // 회원 예약 ON → 로그인/회원가입, 비회원 예약 ON → 비회원 예약조회
      const guestBtn = site.guestBooking === true ? `<button class="ps-header-btn" data-action="guest-lookup">비회원 예약조회</button>` : '';
      const authHtml = site.memberBooking !== false
        ? `<button class="ps-header-btn outline" data-action="login">로그인</button><button class="ps-header-btn primary" data-action="signup">회원가입</button>`
        : '';
      actionsHtml = `${guestBtn}${authHtml}`;
    }

    // Logo: use uploaded image if present, otherwise default tenant sample logo
    const DEFAULT_LOGO_URL = 'https://cdn.rideus.net/uploads/0012/12399/2025/11/13/785fd861c01d93a5e00985b0dba945f9.png';
    const logo = Array.isArray(cfg.logoImage) && cfg.logoImage[0] ? cfg.logoImage[0] : null;
    const logoHtml = logo
      ? `<div class="tenant-logo-img" style="background-image:${logo.bg};" title="${escapeHtml(logo.name || '로고')}"></div>`
      : `<img class="tenant-logo-img" src="${DEFAULT_LOGO_URL}" alt="GroundK">`;

    // GNB nav links — selected pages from 사이트 페이지 목록
    let gnbHtml = '';
    if (cfg.showGnb === true) {
      const sel = Array.isArray(cfg.gnbPages) ? cfg.gnbPages : [];
      const links = sel
        .filter(k => STATE.pageMeta[k] && STATE.pageMeta[k].ready && STATE.pageMeta[k].enabled !== false)
        .map(k => `<a class="ps-header-gnb-link${k === STATE.currentPage ? ' active' : ''}" data-gnb-page="${k}">${escapeHtml(STATE.pageMeta[k].name)}</a>`)
        .join('');
      if (links) gnbHtml = `<nav class="ps-header-gnb">${links}</nav>`;
    }

    return `<header class="ps-header${cfg.stickyHeader === true ? ' sticky' : ''}">
      ${logoHtml}
      ${gnbHtml}
      <div class="ps-header-spacer"></div>
      <div class="ps-header-actions">${langHtml}${actionsHtml}</div>
      <svg class="tenant-nav-mobile" data-action="open-mobile-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </header>`;
  }
};
