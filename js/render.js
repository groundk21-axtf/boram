/* render.js — render and bind function pool (preview, builder UI, site settings, popovers, modals) */

// --- renderSearchPopover ---

function renderSearchPopover(sid, kind, cfg) {
  const d1 = cfg.locationDepth1 || 'region';
  const d2 = cfg.locationDepth2 || 'none';
  const has2 = d2 !== 'none';
  const keyOn = cfg.keyPointsEnabled === true;
  const keyType = cfg.keyPointType || 'destination';
  const title = kind === 'from' ? '어디에서 출발하세요?' : '어디로 갈까요?';
  const keyTitle = kind === 'from' ? '주요 지점' : '어디로 갈까요?';
  const pinIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.7a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
  const pinIconSmall = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.7a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';

  const d1Items = SEARCH_MOCK[d1] || [];
  const activeKey = `${sid}_${kind}`;
  const active = (STATE.searchDepth1Sel && STATE.searchDepth1Sel[activeKey]) || d1Items[0];

  let depth1Html = '';
  let chipsHtml = '';
  if (has2) {
    depth1Html = `<div class="ps-spop-depth1">
      ${d1Items.map(v => `<button type="button" class="ps-spop-pill${v === active ? ' active' : ''}" data-spop-depth1="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}
    </div>
    <div class="ps-spop-divider"></div>`;
    const d2Pool = (SEARCH_DEPTH2_MOCK[d1] && SEARCH_DEPTH2_MOCK[d1][active]) || (SEARCH_MOCK[d2] || []).slice(0, 8);
    chipsHtml = `<div class="ps-spop-chips">
      ${d2Pool.map(v => `<button type="button" class="ps-spop-chip" data-spop-pick="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}
    </div>`;
  } else {
    chipsHtml = `<div class="ps-spop-chips">
      ${d1Items.map(v => `<button type="button" class="ps-spop-chip" data-spop-pick="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}
    </div>`;
  }

  const keyHtml = keyOn ? `
    <div class="ps-spop-divider"></div>
    <div class="ps-spop-keypoints-head">${pinIconSmall}<span>${keyTitle}</span></div>
    <div class="ps-spop-chips">
      ${(SEARCH_KEY_POINTS[keyType] || []).map(v => `<button type="button" class="ps-spop-chip" data-spop-pick="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}
    </div>` : '';

  return `<div class="ps-spop" data-spop onclick="event.stopPropagation()">
    <div class="ps-spop-head">${pinIcon}<strong>${escapeHtml(title)}</strong></div>
    ${depth1Html}
    ${chipsHtml}
    ${keyHtml}
  </div>`;
}

// --- renderCalMonth ---

function renderCalMonth(year, month, dateSel, sid, isRange) {
  // month: 1~12
  const first = new Date(year, month - 1, 1);
  const startDow = first.getDay();
  const lastDay = new Date(year, month, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i);
    cells.push({ date: d, inMonth: false });
  }
  for (let d = 1; d <= lastDay; d++) {
    cells.push({ date: new Date(year, month - 1, d), inMonth: true });
  }
  while (cells.length < 42) {
    const next = cells.length - (startDow + lastDay) + 1;
    cells.push({ date: new Date(year, month, next), inMonth: false });
  }

  const go = parseISO(dateSel.go);
  const back = parseISO(dateSel.back);

  const cellsHtml = cells.map(c => {
    const dow = c.date.getDay();
    const dateStr = fmtDateISO(c.date);
    const isPast = c.date < today;
    const isOut = !c.inMonth;
    const isGo = go && c.date.getTime() === go.getTime();
    const isBack = back && c.date.getTime() === back.getTime();
    const isInRange = isRange && go && back && c.date > go && c.date < back;
    const classes = ['ps-cal-cell'];
    if (isOut) classes.push('out');
    if (isPast) classes.push('disabled');
    if (dow === 0 && !isPast && !isOut) classes.push('sun');
    if (isInRange && !isOut) classes.push('in-range');
    if ((isGo || isBack) && !isOut) classes.push('selected');
    const disabled = isPast ? 'disabled' : '';
    return `<button type="button" class="${classes.join(' ')}" ${disabled} data-cal-date="${dateStr}" data-sid="${sid}">${c.date.getDate()}</button>`;
  }).join('');

  return `<div class="ps-cal">
    <div class="ps-cal-head">
      <button type="button" class="ps-cal-nav" data-cal-nav="-1" data-sid="${sid}" aria-label="이전 달">‹</button>
      <strong>${month}월 ${year}</strong>
      <button type="button" class="ps-cal-nav" data-cal-nav="+1" data-sid="${sid}" aria-label="다음 달">›</button>
    </div>
    <div class="ps-cal-dow">
      <span class="sun">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
    </div>
    <div class="ps-cal-grid">${cellsHtml}</div>
  </div>`;
}

// --- renderDatePopover ---

function renderDatePopover(sid, isRange) {
  const dateSel = (STATE.searchDate && STATE.searchDate[sid]) || {};
  const monthKey = (STATE.searchCalMonth && STATE.searchCalMonth[sid]) || fmtDateISO(new Date()).slice(0, 7);
  const [y, m] = monthKey.split('-').map(Number);

  if (isRange) {
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    return `<div class="ps-spop ps-spop-date wide" data-spop onclick="event.stopPropagation()">
      <div class="ps-spop-date-head">
        <strong>일정 선택하기</strong>
        <span class="ps-spop-date-hint">* 당일 왕복 시 해당날짜를 '더블클릭' 해주세요.</span>
      </div>
      <div class="ps-cal-two">
        ${renderCalMonth(y, m, dateSel, sid, true)}
        ${renderCalMonth(ny, nm, dateSel, sid, true)}
      </div>
      <div class="ps-spop-date-foot">
        <button type="button" class="ps-spop-confirm" data-cal-confirm data-sid="${sid}">확인</button>
      </div>
    </div>`;
  }
  return `<div class="ps-spop ps-spop-date" data-spop onclick="event.stopPropagation()">
    <div class="ps-spop-date-head"><strong>일정 선택하기</strong></div>
    ${renderCalMonth(y, m, dateSel, sid, false)}
    <div class="ps-spop-date-foot">
      <button type="button" class="ps-spop-confirm" data-cal-confirm data-sid="${sid}">확인</button>
    </div>
  </div>`;
}

// --- renderPersonPopover ---

function renderPersonPopover(sid) {
  const count = (STATE.searchPerson && STATE.searchPerson[sid]) || 1;
  return `<div class="ps-spop ps-spop-person" data-spop onclick="event.stopPropagation()">
    <div class="ps-spop-person-row">
      <span class="ps-spop-person-label">탑승 인원</span>
      <div class="ps-spop-person-counter">
        <button type="button" class="ps-spop-counter-btn" data-person-step="-1" data-sid="${sid}" ${count <= 1 ? 'disabled' : ''}>−</button>
        <span class="ps-spop-person-count">${count}</span>
        <button type="button" class="ps-spop-counter-btn" data-person-step="+1" data-sid="${sid}">+</button>
      </div>
    </div>
    <button type="button" class="ps-spop-confirm wide" data-person-confirm data-sid="${sid}">확인</button>
  </div>`;
}

// --- renderRegionPopover ---

function renderRegionPopover(sid) {
  const pinIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.7a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
  const items = SEARCH_MOCK.region || [];
  const sel = (STATE.searchSelected && STATE.searchSelected[sid] && STATE.searchSelected[sid].region) || '';
  return `<div class="ps-spop" data-spop onclick="event.stopPropagation()">
    <div class="ps-spop-head">${pinIcon}<strong>여행지를 선택하세요</strong></div>
    <div class="ps-spop-chips">
      ${items.map(v => `<button type="button" class="ps-spop-chip${v === sel ? ' active' : ''}" data-spop-pick="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}
    </div>
  </div>`;
}

// --- renderAll ---

function renderAll() {
  renderTopBar();
  renderPageList();
  renderSectionTree();
  renderPreview();
  renderRightPanel();
}

// --- renderTopBar ---

function renderTopBar() {
  const p = STATE.pageMeta[STATE.currentPage];
  document.getElementById('currentPageName').textContent = p.name + (p.ready ? '' : ' (준비중)');
  // 디바이스 URL chrome: 'domain.com / path' 형태이므로 path의 선행 슬래시 제거 (홈은 페이지명 표시)
  document.getElementById('urlPath').textContent = (p.path && p.path !== '/')
    ? p.path.replace(/^\//, '')
    : (p.name || '');
  // Preview URL bar reflects the domain set in 사이트 설정.
  const dom = document.getElementById('urlDomain');
  if (dom) dom.textContent = (STATE.site && STATE.site.domainPrefix ? STATE.site.domainPrefix : 'vivapark') + '.rideus.net';

  const pill = document.getElementById('statusPill');
  const status = STATE.pageStatus || 'draft';
  pill.className = 'status-pill ' + status;
  pill.textContent = status.toUpperCase();

  // 우측 상단 언어 탭 — 사이트 설정의 supportedLanguages 기반
  const langTabs = document.getElementById('langTabs');
  const supported = Array.isArray(STATE.site?.supportedLanguages) ? STATE.site.supportedLanguages : [];
  const defaultLang = STATE.site?.defaultLanguage || supported[0] || 'ko';
  // currentLang 정합성 — 지원 언어 중에 없으면 기본값으로 보정
  if (!supported.includes(STATE.currentLang)) STATE.currentLang = defaultLang;
  langTabs.innerHTML = supported.map(code => {
    const label = code.toUpperCase().replace('ZH-CN', 'ZH-CN').replace('ZH-TW', 'ZH-TW');
    return `<button class="lang-tab ${code === STATE.currentLang ? 'active' : ''}" data-lang="${code}">${escapeHtml(label)}<span class="lang-tab-dot complete"></span></button>`;
  }).join('');
  langTabs.querySelectorAll('.lang-tab').forEach(t => {
    t.addEventListener('click', () => {
      STATE.currentLang = t.dataset.lang;
      renderTopBar();
      toast(`언어 ${t.dataset.lang.toUpperCase()}로 전환 — 자동번역된 콘텐츠는 수동 편집 시까지 유지됩니다`, 'success');
    });
  });

  const widths = { desktop: '1280px ›', tablet: '820px ›', mobile: '390px ›' };
  document.getElementById('deviceMeta').textContent = widths[STATE.currentDevice];
  document.querySelectorAll('.device-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.device === STATE.currentDevice);
  });
}

// --- renderPageList ---

function renderPageList() {
  // 시스템 페이지(고정 키) + 그 외 사용자 추가 페이지를 합쳐서 보여줌
  const fixedCustomer = ['home', 'search', 'detail', 'booking', 'guest', 'auth', 'mypage', 'static-faq'];
  const fixedStat = ['static-about', 'static-tos'];
  const fixedSet = new Set([...fixedCustomer, ...fixedStat]);
  const customer = fixedCustomer.filter(k => STATE.pageMeta[k]);
  const customPages = Object.keys(STATE.pageMeta).filter(k => !fixedSet.has(k));
  const customerAll = [...customer, ...customPages];
  const stat = fixedStat.filter(k => STATE.pageMeta[k]);

  const itemHtml = (key) => {
    const m = STATE.pageMeta[key];
    const active = key === STATE.currentPage;
    const lockIcon = m.locked ? `<svg class="page-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : '';
    const isHome = key === 'home';
    const enabled = m.enabled !== false;
    const isCustom = !!m.custom;
    // 메인은 항상 ON으로 고정 (off 불가)
    const toggleHtml = `<label class="page-toggle${isHome ? ' fixed' : ''}" data-page-toggle="${key}" title="${isHome ? '메인 페이지는 항상 활성화' : (enabled ? '사용 중 — 클릭하여 OFF' : 'OFF — 클릭하여 ON')}">
      <input type="checkbox" ${enabled ? 'checked' : ''} ${isHome ? 'disabled' : ''}>
      <span class="page-toggle-track"><span class="page-toggle-thumb"></span></span>
    </label>`;
    const renameHtml = isCustom ? `<button type="button" class="page-rename-btn" data-page-rename="${key}" title="페이지 이름 변경">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
    </button>` : '';
    const delHtml = isCustom ? `<button type="button" class="page-del-btn" data-page-del="${key}" title="페이지 삭제">${ICN.trash}</button>` : '';
    return `<div class="page-item ${active ? 'active' : ''}${enabled ? '' : ' disabled'}" data-page="${key}">
      <span class="page-icon">${ICN[m.icon]}</span>
      <span class="page-name">${m.name}</span>
      <div class="page-meta">${lockIcon}${renameHtml}${delHtml}${toggleHtml}</div>
    </div>`;
  };

  document.getElementById('pagesSection').innerHTML = `
    <div class="page-group">
      <div class="page-group-label">페이지</div>
      ${customerAll.map(itemHtml).join('')}
      <button type="button" class="add-page-btn" id="addPageBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>페이지 추가</span>
      </button>
    </div>
    ${stat.length ? `<div class="page-group">${stat.map(itemHtml).join('')}</div>` : ''}
  `;

  // 실제 토글 상태 변경은 input의 change에서 1회 처리
  document.querySelectorAll('[data-page-toggle] input').forEach(input => {
    input.addEventListener('change', () => {
      const key = input.closest('[data-page-toggle]').dataset.pageToggle;
      if (key === 'home') return; // disabled라 사실상 불가, 안전망
      STATE.pageMeta[key].enabled = input.checked;
      // OFF로 바뀌었으면 모든 헤더 섹션의 gnbPages 배열에서 해당 키 제거
      if (input.checked === false) {
        Object.values(STATE.pages || {}).forEach(p => {
          (p.sections || []).forEach(sec => {
            if (sec.type === 'header' && Array.isArray(sec.config?.gnbPages)) {
              sec.config.gnbPages = sec.config.gnbPages.filter(k => k !== key);
            }
          });
        });
      }
      renderPageList();
      renderPreview();
      renderRightPanel();
    });
  });

  // .page-item 클릭 시 토글/삭제/이름변경 영역이면 navigate skip, 그 외 영역이면 페이지 전환
  document.querySelectorAll('.page-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-page-del]') || e.target.closest('[data-page-rename]')) return;
      const tEl = e.target.closest('[data-page-toggle]');
      if (tEl) {
        if (tEl.dataset.pageToggle === 'home') toast('메인 페이지는 비활성화할 수 없습니다', 'warn');
        return; // 토글 영역 클릭은 navigate 안 함 (change 이벤트가 상태 갱신)
      }
      switchPage(el.dataset.page);
    });
  });

  // 페이지 추가 버튼
  const addBtn = document.getElementById('addPageBtn');
  if (addBtn) addBtn.addEventListener('click', () => openAddPageModal());

  // 커스텀 페이지 이름 변경
  document.querySelectorAll('[data-page-rename]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openAddPageModal(btn.dataset.pageRename);
    });
  });

  // 커스텀 페이지 삭제
  document.querySelectorAll('[data-page-del]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key = btn.dataset.pageDel;
      const m = STATE.pageMeta[key];
      if (!m) return;
      if (!confirm(`'${m.name}' 페이지를 삭제하시겠습니까?`)) return;
      delete STATE.pageMeta[key];
      delete STATE.pages[key];
      // 헤더 섹션들의 gnbPages에서도 제거
      Object.values(STATE.pages || {}).forEach(p => {
        (p.sections || []).forEach(sec => {
          if (sec.type === 'header' && Array.isArray(sec.config?.gnbPages)) {
            sec.config.gnbPages = sec.config.gnbPages.filter(k => k !== key);
          }
        });
      });
      // 현재 보고 있는 페이지가 삭제 대상이면 home으로 전환
      if (STATE.currentPage === key) {
        switchPage('home');
      } else {
        renderPageList();
        renderPreview();
        renderRightPanel();
      }
    });
  });
}

// --- renderSectionTree ---

function renderSectionTree() {
  const m = STATE.pageMeta[STATE.currentPage];
  document.getElementById('sectionTreeTitle').textContent = m.name + ' 섹션';

  if (!m.ready) {
    document.getElementById('sectionTree').innerHTML = `<div style="padding:14px 12px; font-size:11.5px; color:var(--text-3); line-height:1.6; background:var(--surface-2); border-radius:6px; margin: 4px 0;">이 페이지는 다음 단계에서 적용됩니다.<br/><strong style="color:var(--text-2);">메인 페이지</strong>를 클릭해 빌더 기능을 시도해 보세요.</div>`;
    document.getElementById('sectionCount').textContent = '—';
    document.getElementById('addSectionBtn').closest('.panel-l-footer').style.display = 'none';
    return;
  }

  // 자주묻는질문 페이지 — 섹션 트리 대신 안내만 표시 (콘텐츠는 우측 패널에서 편집).
  if (STATE.currentPage === 'static-faq') {
    document.getElementById('sectionTree').innerHTML = `<div style="padding:14px 12px; font-size:11.5px; color:var(--text-3); line-height:1.6; background:var(--surface-2); border-radius:6px; margin: 4px 0;">이 페이지는 <strong style="color:var(--text-2);">자주 묻는 질문</strong> 콘텐츠 페이지입니다.<br/>우측 패널에서 구분·질문·답변을 편집하세요.</div>`;
    document.getElementById('sectionCount').textContent = STATE.faqPage.length;
    document.getElementById('addSectionBtn').closest('.panel-l-footer').style.display = 'none';
    return;
  }

  document.getElementById('addSectionBtn').closest('.panel-l-footer').style.display = '';
  const p = getPage();
  document.getElementById('sectionCount').textContent = p.sections.length;

  const tree = document.getElementById('sectionTree');
  tree.innerHTML = p.sections.map((sec, idx) => {
    const t = TYPES[sec.type];
    const active = sec.id === STATE.selectedSectionId;

    const flags = [];
    if (sec.locked) flags.push(`<svg class="section-flag required tooltip" data-tip="필수 / 고정 섹션" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`);

    const actions = sec.locked ? '' : `<div class="section-actions">
      <button class="section-action-btn duplicate tooltip" data-tip="복제" data-action="duplicate" data-sid="${sec.id}">${ICN.copy}</button>
      <button class="section-action-btn delete tooltip" data-tip="삭제" data-action="delete" data-sid="${sec.id}">${ICN.trash}</button>
    </div>`;

    return `<div class="section-item ${active ? 'active' : ''} ${sec.locked ? 'locked' : ''}" data-sid="${sec.id}" data-idx="${idx}" ${sec.locked ? '' : 'draggable="true"'}>
      <span class="section-handle">${ICN.drag}</span>
      <span class="section-type-icon">${t.icon}</span>
      <span class="section-name">${t.name}</span>
      <div class="section-flags">${flags.join('')}</div>
      ${actions}
    </div>`;
  }).join('');

  // Click handlers
  tree.querySelectorAll('.section-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.section-actions')) return;
      const sid = el.dataset.sid;
      selectSection(sid);
      // Scroll the preview to the selected section (deferred so the DOM is up to date).
      requestAnimationFrame(() => {
        const target = document.querySelector(`#previewContent .ps[data-sid="${sid}"]`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
  tree.querySelectorAll('.section-action-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const sid = btn.dataset.sid;
      if (action === 'delete') deleteSection(sid);
      if (action === 'duplicate') duplicateSection(sid);
    });
  });

  // Drag & drop
  setupDragDrop();
}

// --- bindHeaderFooterHandlers ---

function bindHeaderFooterHandlers(content) {
  // Footer terms: URL → new tab, 직접입력(text) → popup overlay
  content.querySelectorAll('[data-terms-url]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const url = a.dataset.termsUrl;
      if (url) window.open(url, '_blank', 'noopener');
      else toast('약관 URL이 등록되지 않았습니다 — [사이트 설정]에서 입력하세요', 'warn');
    });
  });
  content.querySelectorAll('[data-terms-popup]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.termsPopup, 10);
      const term = (STATE.site && STATE.site.terms) ? STATE.site.terms[idx] : null;
      if (!term) return;
      openTermsPopup(term.name || '약관', term.value || '<p>등록된 약관 내용이 없습니다.</p>');
    });
  });

  // FAQ "더보기" → navigate to the 자주 묻는 질문 page
  content.querySelectorAll('[data-faq-more]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (STATE.pageMeta['static-faq']) switchPage('static-faq');
      else toast('자주 묻는 질문 페이지로 이동합니다', 'success');
    });
  });

  // Header GNB links → navigate to the selected page
  content.querySelectorAll('[data-gnb-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.stopPropagation();
      const key = a.dataset.gnbPage;
      if (STATE.pageMeta[key]) switchPage(key);
    });
  });

  // 미리보기 — 검색바 [검색] 버튼 → search-results.html 로 이동
  content.querySelectorAll('.search-go').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      window.open('search-results.html', PREVIEW_MODE ? '_self' : '_blank');
    });
  });

  // 미리보기 — 상품(추천 상품) 카드 클릭 → product-detail.html 로 이동
  content.querySelectorAll('.ps-product-card').forEach(card => {
    // 품절 카드는 클릭 비활성
    if (card.classList.contains('sold-out')) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', e => {
      // 카드 내부 링크/버튼 클릭은 자체 동작 유지
      if (e.target.closest('a, button')) return;
      window.open('product-detail.html', PREVIEW_MODE ? '_self' : '_blank');
    });
  });

  // Header language selector → toggle dropdown / pick a 제공 언어
  const langSel = content.querySelector('[data-lang-selector]');
  if (langSel) {
    langSel.addEventListener('click', e => {
      e.stopPropagation();
      const pick = e.target.closest('[data-lang-pick]');
      if (pick) {
        const code = pick.dataset.langPick;
        if (STATE.previewLang !== code) { STATE.previewLang = code; renderPreview(); }
        else langSel.classList.remove('open');
        return;
      }
      langSel.classList.toggle('open');
    });
  }

  // Header user menu (로그인 미리보기) → toggle dropdown / pick menu item
  const userMenu = content.querySelector('[data-user-menu]');
  if (userMenu) {
    userMenu.addEventListener('click', e => {
      e.stopPropagation();
      const item = e.target.closest('[data-user-menu-item]');
      if (item) {
        const key = item.dataset.userMenuItem;
        if (key === 'logout') {
          setPreviewLoggedIn(false);
          toast('로그아웃되었습니다', 'success');
          renderPreview();
          renderRightPanel();
          return;
        }
        const label = key === 'profile' ? '내 정보' : '예약내역';
        toast(`${label} 페이지로 이동 (mockup)`, 'success');
        userMenu.classList.remove('open');
        return;
      }
      userMenu.classList.toggle('open');
    });
  }
}

// --- renderPreview ---

function renderPreview() {
  const frame = document.getElementById('deviceFrame');
  const settingsView = document.getElementById('siteSettingsView');
  const rightAside = document.querySelector('.panel-r');

  // View dispatch: site-settings replaces the device-frame in the center area.
  if (STATE.view === 'site-settings') {
    frame.hidden = true;
    settingsView.hidden = false;
    if (rightAside) rightAside.classList.add('panel-r-collapsed');
    settingsView.innerHTML = renderSiteSettings();
    bindSiteSettings();
    return;
  }
  frame.hidden = false;
  settingsView.hidden = true;
  if (rightAside) rightAside.classList.remove('panel-r-collapsed');

  frame.classList.remove('tablet', 'mobile');
  if (STATE.currentDevice !== 'desktop') frame.classList.add(STATE.currentDevice);

  const content = document.getElementById('previewContent');
  content.style.setProperty('--t-primary', STATE.theme.primary);
  content.style.setProperty('--t-primary-strong', STATE.theme.primaryStrong);
  content.style.setProperty('--t-text', STATE.theme.text);
  content.style.setProperty('--t-bg', STATE.theme.bg);
  content.style.setProperty('--t-radius', STATE.theme.radius + 'px');

  const m = STATE.pageMeta[STATE.currentPage];

  if (!m.ready) {
    content.innerHTML = `${TYPES.header.render({}, {})}
      <div class="coming-soon">
        <div class="coming-soon-mark">${ICN.next}</div>
        <h2>'${m.name}' 페이지는 다음 단계에서 적용됩니다</h2>
        <p>현재 Phase 1에서는 <strong>메인 페이지</strong>의 빌더 기능을 모두 사용하실 수 있습니다.<br/>다른 페이지는 동일한 방식으로 순차적으로 적용됩니다.</p>
        <a class="coming-soon-back" id="backToHome">${ICN.home} 메인 페이지로 돌아가기</a>
      </div>
      ${TYPES.footer.render({}, {})}`;
    document.getElementById('backToHome').addEventListener('click', () => switchPage('home'));
    bindMobileNav(content);
    return;
  }

  // 자주묻는질문 콘텐츠 페이지 — 헤더 + 카테고리 필터 탭 + 아코디언 + 푸터
  if (STATE.currentPage === 'static-faq') {
    STATE.faqView = STATE.faqView || { cat: '전체', open: 0 };
    let activeCat = STATE.faqView.cat || '전체';
    // 구분값 1개 이하면 '전체' 칩 숨김. 현재 active가 전체였다면 그 1개 또는 빈값으로 조정.
    const showAll = STATE.faqCategories.length >= 2;
    if (!showAll && activeCat === '전체') {
      activeCat = STATE.faqCategories[0] || '전체';
      STATE.faqView.cat = activeCat;
    }
    const tabList = showAll ? ['전체', ...STATE.faqCategories] : [...STATE.faqCategories];
    const tabs = tabList.map(c =>
      `<button type="button" class="faqpage-tab${c === activeCat ? ' active' : ''}${c === '전체' ? ' all' : ''}" data-faq-cat="${escapeHtml(c)}">
        ${c === '전체' ? `${ICN.grid}<span>${escapeHtml(c)}</span>` : `<span>${escapeHtml(c)}</span>`}
      </button>`).join('');

    // Filter by active category, keep original index for open-state tracking
    const filtered = STATE.faqPage
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => activeCat === '전체' || it.category === activeCat);

    const itemsHtml = filtered.map(({ it, i }) => {
      const open = STATE.faqView.open === i;
      return `<div class="faqpage-item${open ? ' open' : ''}" data-faq-item="${i}">
        <button type="button" class="faqpage-q" data-faq-toggle="${i}">
          <span class="faqpage-q-badge">Q</span>
          <span class="faqpage-q-text">${escapeHtml(it.question || '')}</span>
          <span class="faqpage-q-chev">${ICN.chev}</span>
        </button>
        <div class="faqpage-a"><span>${escapeHtml(it.answer || '').replace(/\n/g, '<br/>')}</span></div>
      </div>`;
    }).join('');

    const hideTabs = STATE.faqCategories.length <= 1;
    content.innerHTML = `${TYPES.header.render(faqHeaderCfg(), {})}
      <section class="ps-block faqpage-wrap">
        <div class="ps-block-head center"><div>
          <h2 class="ps-block-title">자주 묻는 질문</h2>
          <p class="ps-block-sub">궁금하신 내용을 확인해 보세요.</p>
        </div></div>
        ${hideTabs ? '' : `<div class="faqpage-tabs">${tabs}</div>`}
        <div class="faqpage-list">${itemsHtml || '<div class="faqpage-empty">해당 분류에 등록된 질문이 없습니다.</div>'}</div>
      </section>
      ${TYPES.footer.render(faqFooterCfg(), {})}`;

    // 활성 탭을 가운데로 스크롤
    const tabsEl = content.querySelector('.faqpage-tabs');
    const activeTabEl = tabsEl?.querySelector('.faqpage-tab.active');
    if (tabsEl && activeTabEl) {
      const cRect = tabsEl.getBoundingClientRect();
      const aRect = activeTabEl.getBoundingClientRect();
      const target = tabsEl.scrollLeft + (aRect.left - cRect.left) - (cRect.width - aRect.width) / 2;
      tabsEl.scrollTo({ left: target, behavior: 'smooth' });
    }

    // Category tab → switch filter
    content.querySelectorAll('[data-faq-cat]').forEach(tab => {
      tab.addEventListener('click', () => {
        STATE.faqView.cat = tab.dataset.faqCat;
        STATE.faqView.open = -1;
        renderPreview();
      });
    });
    // Accordion toggle
    content.querySelectorAll('[data-faq-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.faqToggle, 10);
        STATE.faqView.open = (STATE.faqView.open === idx) ? -1 : idx;
        renderPreview();
      });
    });
    // Header GNB + footer terms — same chrome as the home page.
    bindHeaderFooterHandlers(content);
    bindMobileNav(content);
    return;
  }

  const p = getPage();

  // 커스텀 페이지 + 빈 섹션 — 헤더/푸터 래핑된 안내 placeholder
  if (p && Array.isArray(p.sections) && p.sections.length === 0 && STATE.pageMeta[STATE.currentPage]?.custom) {
    content.innerHTML = `${TYPES.header.render(faqHeaderCfg(), {})}
      <div class="coming-soon">
        <div class="coming-soon-mark">${ICN.next}</div>
        <h2>'${m.name}' 페이지는 비어 있습니다</h2>
        <p>좌측 하단의 <strong>섹션 추가</strong> 버튼으로 콘텐츠를 추가하세요.</p>
      </div>
      ${TYPES.footer.render(faqFooterCfg(), {})}`;
    bindHeaderFooterHandlers(content);
    bindMobileNav(content);
    return;
  }

  const plusIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const parts = [];
  p.sections.forEach((sec, idx) => {
    const t = TYPES[sec.type];
    const isSelected = sec.id === STATE.selectedSectionId;
    const deviceOverride = sec.overrides && sec.overrides[STATE.currentDevice];
    const inner = t.render(sec.config || {}, { device: STATE.currentDevice, deviceOverride, sectionId: sec.id });
    // Standalone preview: render sections flush — no insert bars, no section chrome.
    if (PREVIEW_MODE) { parts.push(inner); return; }
    if (idx > 0) {
      parts.push(`<div class="ps-insert" data-insert-at="${idx}"><button class="ps-insert-btn" data-insert-at="${idx}" title="여기에 섹션 추가" aria-label="여기에 섹션 추가">${plusIcon}</button></div>`);
    }
    const stickyCls = (sec.type === 'header' && sec.config?.stickyHeader === true) ? ' sticky-section' : '';
    parts.push(`<div class="ps ${isSelected ? 'selected' : ''} ${sec.locked ? 'locked' : ''}${stickyCls}" data-sid="${sec.id}">
      <div class="ps-tag">${t.name}${sec.locked ? ' · FIXED' : ''}</div>
      ${inner}
    </div>`);
  });
  // 커스텀 페이지 — 사이트 헤더/푸터를 home의 설정 공유로 자동 wrap (편집 가능한 ps 섹션 아님)
  const isCustomPage = !!STATE.pageMeta[STATE.currentPage]?.custom;
  if (isCustomPage) {
    parts.unshift(TYPES.header.render(faqHeaderCfg(), {}));
    parts.push(TYPES.footer.render(faqFooterCfg(), {}));
  }
  content.innerHTML = parts.join('');

  // Section selection (skip clicks on hero carousel controls / CTA links)
  content.querySelectorAll('.ps').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-hero-arrow], [data-hero-dot]')) return;
      if (e.target.closest('[data-section-cta]')) return;
      e.stopPropagation();
      selectSection(el.dataset.sid);
    });
  });

  // 섹션 내부 CTA 링크 — 내부 경로면 switchPage, 외부면 새 탭 또는 기본 동작
  content.querySelectorAll('[data-section-cta]').forEach(a => {
    a.addEventListener('click', e => {
      e.stopPropagation();
      const href = a.getAttribute('href') || '';
      if (!href || href === '#') { e.preventDefault(); return; }
      // 내부 경로(/...): pageMeta에서 일치하는 페이지를 찾아 switchPage
      if (href.startsWith('/')) {
        const found = Object.entries(STATE.pageMeta).find(([k, m]) => m.path === href);
        if (found) {
          e.preventDefault();
          switchPage(found[0]);
          return;
        }
        // 일치하는 페이지 없음 — 외부 경로로 간주하여 새 탭 시도, 또는 토스트
        e.preventDefault();
        toast(`'${href}' 경로를 가진 페이지가 없습니다`, 'warn');
        return;
      }
      // 외부 URL — target에 따라 새 탭 or 토스트 (admin preview에서 같은 창 이동 방지)
      if (a.getAttribute('target') !== '_blank') {
        e.preventDefault();
        toast(`(mockup) ${href} 으로 이동`, 'success');
      }
      // _blank면 그대로 새 탭 오픈
    });
  });

  // Inter-section insert buttons
  content.querySelectorAll('.ps-insert-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openSectionPicker(parseInt(btn.dataset.insertAt, 10));
    });
  });

  // Hero carousel: arrows
  content.querySelectorAll('[data-hero-arrow]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const sid = el.dataset.sid;
      const dir = el.dataset.heroArrow;
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const images = sec.config.images || [];
      if (images.length < 2) return;
      STATE.heroCarousel = STATE.heroCarousel || {};
      let i = STATE.heroCarousel[sid] || 0;
      i = dir === 'next' ? (i + 1) % images.length : (i - 1 + images.length) % images.length;
      STATE.heroCarousel[sid] = i;
      renderPreview();
    });
  });

  // Hero carousel: dots
  content.querySelectorAll('[data-hero-dot]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const sid = el.dataset.sid;
      const i = parseInt(el.dataset.heroDot);
      STATE.heroCarousel = STATE.heroCarousel || {};
      STATE.heroCarousel[sid] = i;
      renderPreview();
    });
  });

  // Banner carousel: dots
  content.querySelectorAll('[data-banner-dot]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const sid = el.dataset.sid;
      const i = parseInt(el.dataset.bannerDot, 10);
      STATE.bannerCarousel = STATE.bannerCarousel || {};
      STATE.bannerCarousel[sid] = i;
      renderPreview();
    });
  });

  // Header GNB + footer terms — chrome shared with content pages.
  bindHeaderFooterHandlers(content);

  // Product criteria tabs (region / day-of-week)
  content.querySelectorAll('[data-criteria-value]').forEach(tab => {
    tab.addEventListener('click', e => {
      e.stopPropagation();
      const sid = tab.dataset.sid;
      const key = tab.dataset.criteriaKey;
      const value = tab.dataset.criteriaValue;
      STATE.productCriteria = STATE.productCriteria || {};
      STATE.productCriteria[sid] = STATE.productCriteria[sid] || {};
      STATE.productCriteria[sid][key] = value;
      renderPreview();
    });
  });

  // Product slider pagination dots: click to scroll, scroll to highlight active dot
  content.querySelectorAll('[data-product-pagination]').forEach(pagination => {
    const sid = pagination.dataset.productPagination;
    const track = content.querySelector(`[data-product-track="${sid}"]`);
    if (!track) return;
    const dots = Array.from(pagination.querySelectorAll('.ps-product-page-dot'));
    const VISIBLE = 3;

    const pageWidth = () => {
      const firstCard = track.querySelector('.ps-product-card');
      const cardW = firstCard ? firstCard.getBoundingClientRect().width : 0;
      return (cardW + 18) * VISIBLE;
    };

    dots.forEach(dot => {
      dot.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(dot.dataset.pageIdx, 10) || 0;
        track.scrollTo({ left: idx * pageWidth(), behavior: 'smooth' });
      });
    });

    // Sync active dot to current scroll position.
    track.addEventListener('scroll', () => {
      const w = pageWidth();
      if (!w) return;
      const idx = Math.round(track.scrollLeft / w);
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }, { passive: true });
  });

  // 검색바 — 편도/왕복 탭
  content.querySelectorAll('[data-trip-tab]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const sid = el.dataset.sid;
      STATE.searchTripActive = STATE.searchTripActive || {};
      STATE.searchTripActive[sid] = el.dataset.tripTab;
      renderPreview();
    });
  });

  // 검색바 트리거(from/to/date/person) 클릭 → 팝오버 토글
  content.querySelectorAll('[data-spop-trigger]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (e.target.closest('[data-spop]')) return;
      const kind = el.dataset.spopTrigger;
      const sid = el.dataset.sid;
      const cur = STATE.searchPopover;
      if (cur && cur.sid === sid && cur.kind === kind) {
        STATE.searchPopover = null;
      } else {
        STATE.searchPopover = { sid, kind };
        if (kind === 'date') {
          STATE.searchCalMonth = STATE.searchCalMonth || {};
          if (!STATE.searchCalMonth[sid]) STATE.searchCalMonth[sid] = fmtDateISO(new Date()).slice(0, 7);
        }
      }
      renderPreview();
    });
  });
  // 출/도착 팝오버 — 1Depth pill / 칩 선택
  content.querySelectorAll('[data-spop-depth1]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cur = STATE.searchPopover;
      if (!cur) return;
      STATE.searchDepth1Sel = STATE.searchDepth1Sel || {};
      STATE.searchDepth1Sel[`${cur.sid}_${cur.kind}`] = btn.dataset.spopDepth1;
      renderPreview();
    });
  });
  content.querySelectorAll('[data-spop-pick]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cur = STATE.searchPopover;
      if (!cur) return;
      STATE.searchSelected = STATE.searchSelected || {};
      STATE.searchSelected[cur.sid] = STATE.searchSelected[cur.sid] || {};
      STATE.searchSelected[cur.sid][cur.kind] = btn.dataset.spopPick;
      STATE.searchPopover = null;
      renderPreview();
    });
  });

  // 캘린더 — 월 이동
  content.querySelectorAll('[data-cal-nav]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const sid = btn.dataset.sid;
      const dir = parseInt(btn.dataset.calNav, 10);
      STATE.searchCalMonth = STATE.searchCalMonth || {};
      const cur = STATE.searchCalMonth[sid] || fmtDateISO(new Date()).slice(0, 7);
      let [y, m] = cur.split('-').map(Number);
      m += dir;
      if (m > 12) { m = 1; y++; }
      if (m < 1)  { m = 12; y--; }
      STATE.searchCalMonth[sid] = `${y}-${String(m).padStart(2, '0')}`;
      renderPreview();
    });
  });
  // 캘린더 — 날짜 단일/범위 선택
  content.querySelectorAll('[data-cal-date]').forEach(btn => {
    let lastClick = 0;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (btn.disabled) return;
      const sid = btn.dataset.sid;
      const dateStr = btn.dataset.calDate;
      const popover = STATE.searchPopover;
      if (!popover || popover.sid !== sid || popover.kind !== 'date') return;
      const isRange = (STATE.searchTripActive && STATE.searchTripActive[sid]) === 'roundtrip'
        || (STATE.pages.home.sections.find(s => s.id === sid)?.config?.tripType === 'roundtrip');
      STATE.searchDate = STATE.searchDate || {};
      const cur = STATE.searchDate[sid] || {};
      // 더블클릭 → 같은 날짜 왕복
      const now = Date.now();
      const isDbl = (now - lastClick < 300);
      lastClick = now;
      if (isRange) {
        if (isDbl) {
          STATE.searchDate[sid] = { go: dateStr, back: dateStr };
        } else if (!cur.go || (cur.go && cur.back) || dateStr < cur.go) {
          STATE.searchDate[sid] = { go: dateStr, back: null };
        } else {
          STATE.searchDate[sid] = { go: cur.go, back: dateStr };
        }
      } else {
        STATE.searchDate[sid] = { go: dateStr, back: null };
      }
      renderPreview();
    });
  });
  // 캘린더 — 확인 버튼
  content.querySelectorAll('[data-cal-confirm]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      STATE.searchPopover = null;
      renderPreview();
    });
  });

  // 인원 — +/− 버튼
  content.querySelectorAll('[data-person-step]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (btn.disabled) return;
      const sid = btn.dataset.sid;
      const step = parseInt(btn.dataset.personStep, 10);
      STATE.searchPerson = STATE.searchPerson || {};
      const next = Math.max(1, ((STATE.searchPerson[sid] || 1) + step));
      STATE.searchPerson[sid] = next;
      renderPreview();
    });
  });
  // 인원 — 확인 버튼
  content.querySelectorAll('[data-person-confirm]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      STATE.searchPopover = null;
      renderPreview();
    });
  });

  // Route card collapse toggle
  content.querySelectorAll('[data-route-toggle]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const routeId = el.dataset.routeToggle;
      const sid = el.dataset.sectionId;
      STATE.routeCollapse = STATE.routeCollapse || {};
      STATE.routeCollapse[sid] = STATE.routeCollapse[sid] || {};
      STATE.routeCollapse[sid][routeId] = !STATE.routeCollapse[sid][routeId];
      // Toggle DOM directly for smooth UX without full re-render
      const card = content.querySelector(`[data-route-card="${routeId}"][data-section-id="${sid}"]`);
      if (card) card.classList.toggle('collapsed');
    });
  });

  // 노선도 — 노선 탭 클릭(active 노선 전환)
  content.querySelectorAll('[data-route-map-tab]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const sid = btn.dataset.sectionId;
      STATE.routeMapActive = STATE.routeMapActive || {};
      STATE.routeMapActive[sid] = btn.dataset.routeMapTab;
      renderPreview();
    });
  });

  // 모바일/태블릿 햄버거 메뉴 드로어
  bindMobileNav(content);

  // 정류장 정보 모달 (customer-site)
  content.insertAdjacentHTML('beforeend', renderStopInfoModal());
  content.querySelectorAll('[data-stop-info]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      STATE.stopInfoModal = {
        name: btn.dataset.stopInfo,
        intro: btn.dataset.stopSub || ''
      };
      renderPreview();
    });
  });
  const stopModal = content.querySelector('[data-stop-modal]');
  if (stopModal) {
    const closeStop = () => { STATE.stopInfoModal = null; renderPreview(); };
    stopModal.addEventListener('click', e => {
      if (e.target === stopModal || e.target.closest('[data-stop-close]')) { closeStop(); return; }
    });
  }

  // 비회원 예약조회 모달 (customer-site)
  content.insertAdjacentHTML('beforeend', renderGuestLookupModal());
  content.querySelectorAll('[data-action="guest-lookup"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      STATE.guestLookupOpen = true;
      renderPreview();
    });
  });
  const guestModal = content.querySelector('[data-guest-modal]');
  if (guestModal) {
    const close = () => { STATE.guestLookupOpen = false; renderPreview(); };
    guestModal.addEventListener('click', e => {
      if (e.target === guestModal || e.target.closest('[data-guest-close]')) close();
    });
    const submit = guestModal.querySelector('[data-guest-submit]');
    if (submit) submit.addEventListener('click', () => {
      toast('예약 조회 요청 (mockup)', 'success');
      close();
    });
  }

  // 로그인 / 회원가입 모달 (customer-site)
  content.insertAdjacentHTML('beforeend', renderAuthModal());
  content.querySelectorAll('[data-action="login"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      STATE.authModal = 'login';
      renderPreview();
    });
  });
  content.querySelectorAll('[data-action="signup"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      STATE.authModal = 'signup';
      renderPreview();
    });
  });
  const authModal = content.querySelector('[data-auth-modal]');
  if (authModal) {
    const close = () => { STATE.authModal = null; renderPreview(); };
    const closeCC = (wrap) => {
      wrap.classList.remove('open');
      const s = wrap.querySelector('[data-phone-cc-search]');
      if (s) s.value = '';
      wrap.querySelectorAll('[data-phone-cc-item]').forEach(it => { it.style.display = ''; });
      const emp = wrap.querySelector('[data-phone-cc-empty]');
      if (emp) emp.style.display = 'none';
    };
    authModal.addEventListener('click', e => {
      // Close any open country-code dropdown when clicking outside it
      const openCC = authModal.querySelector('.ps-phone-input.open');
      if (openCC && !e.target.closest('.ps-phone-input.open')) {
        closeCC(openCC);
      }
      const phoneTrigger = e.target.closest('[data-phone-cc]');
      if (phoneTrigger) {
        const wrap = phoneTrigger.closest('.ps-phone-input');
        if (wrap.classList.contains('open')) {
          closeCC(wrap);
        } else {
          wrap.classList.add('open');
          setTimeout(() => wrap.querySelector('[data-phone-cc-search]')?.focus(), 0);
        }
        return;
      }
      const phoneItem = e.target.closest('[data-phone-cc-item]');
      if (phoneItem) {
        const wrap = phoneItem.closest('.ps-phone-input');
        wrap.querySelector('[data-phone-cc-flag]').textContent = phoneItem.dataset.flag;
        wrap.querySelector('[data-phone-cc-dial]').textContent = phoneItem.dataset.dial;
        wrap.querySelectorAll('[data-phone-cc-item]').forEach(it => it.classList.toggle('active', it === phoneItem));
        closeCC(wrap);
        return;
      }
      if (e.target === authModal || e.target.closest('[data-auth-close]')) { close(); return; }
      const swap = e.target.closest('[data-auth-swap]');
      if (swap) {
        STATE.authModal = swap.dataset.authSwap;
        renderPreview();
        return;
      }
      if (e.target.closest('[data-auth-submit]')) {
        const mode = STATE.authModal;
        setPreviewLoggedIn(true);
        toast(mode === 'login' ? '로그인되었습니다' : '회원가입 완료 — 자동 로그인되었습니다', 'success');
        close();
        renderRightPanel();
        return;
      }
      const verifyBtn = e.target.closest('[data-auth-verify]');
      if (verifyBtn && !verifyBtn.classList.contains('done')) {
        const emailInput = authModal.querySelector('[data-auth-email]');
        const v = (emailInput?.value || '').trim();
        if (!v || !/^\S+@\S+\.\S+$/.test(v)) {
          toast('올바른 이메일 형식을 입력해 주세요', 'error');
          emailInput?.focus();
          return;
        }
        if (emailInput) emailInput.readOnly = true;
        verifyBtn.textContent = '재발송';
        if (!authModal.querySelector('[data-auth-code-row]')) {
          const emailRow = verifyBtn.closest('.ps-form-row');
          emailRow.insertAdjacentHTML('afterend', `
            <div class="ps-form-row" data-auth-code-row>
              <label>인증번호</label>
              <div class="ps-input-action">
                <input class="ps-input" type="text" inputmode="numeric" maxlength="6" placeholder="6자리 인증번호 입력" data-auth-code />
                <button type="button" class="ps-input-btn" data-auth-code-confirm>인증</button>
              </div>
            </div>
          `);
          authModal.querySelector('[data-auth-code]')?.focus();
        }
        toast('인증 메일 발송 (mockup)', 'success');
        return;
      }
      const codeBtn = e.target.closest('[data-auth-code-confirm]');
      if (codeBtn && !codeBtn.classList.contains('done')) {
        const codeInput = authModal.querySelector('[data-auth-code]');
        const code = (codeInput?.value || '').trim();
        if (!code) {
          toast('인증번호를 입력해 주세요', 'error');
          codeInput?.focus();
          return;
        }
        codeBtn.classList.add('done');
        codeBtn.textContent = '인증완료';
        codeBtn.disabled = true;
        if (codeInput) codeInput.readOnly = true;
        const vBtn = authModal.querySelector('[data-auth-verify]');
        if (vBtn) { vBtn.classList.add('done'); vBtn.disabled = true; vBtn.textContent = '인증완료'; }
        toast('이메일 인증 완료', 'success');
        return;
      }
      // "전체 동의" checkbox cascades to per-term checkboxes
      const allBox = e.target.closest('[data-auth-terms-all]');
      if (allBox) {
        const checked = allBox.checked;
        authModal.querySelectorAll('[data-auth-term]').forEach(cb => { cb.checked = checked; });
      }
    });
    // Keep "전체 동의" state in sync with individual terms
    authModal.querySelectorAll('[data-auth-term]').forEach(cb => {
      cb.addEventListener('change', () => {
        const all = authModal.querySelectorAll('[data-auth-term]');
        const allChecked = Array.from(all).every(b => b.checked);
        const allBox = authModal.querySelector('[data-auth-terms-all]');
        if (allBox) allBox.checked = allChecked;
      });
    });
    // Country-code search: filter items live by name or dial
    const ccSearch = authModal.querySelector('[data-phone-cc-search]');
    if (ccSearch) {
      ccSearch.addEventListener('input', () => {
        const q = ccSearch.value.trim().toLowerCase();
        const items = authModal.querySelectorAll('[data-phone-cc-item]');
        let visible = 0;
        items.forEach(it => {
          const name = (it.querySelector('.ps-phone-cc-name')?.textContent || '').toLowerCase();
          const dial = (it.dataset.dial || '').toLowerCase();
          const show = !q || name.includes(q) || dial.includes(q);
          it.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        const empty = authModal.querySelector('[data-phone-cc-empty]');
        if (empty) empty.style.display = visible > 0 ? 'none' : '';
      });
    }
  }
}

// --- bindMobileNav ---

function bindMobileNav(content) {
  content.insertAdjacentHTML('beforeend', renderMobileNav());
  content.querySelectorAll('[data-action="open-mobile-nav"]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      STATE.mobileNavOpen = true;
      renderPreview();
    });
  });
  const mnav = content.querySelector('[data-mnav]');
  if (!mnav) return;
  const closeMnav = () => { STATE.mobileNavOpen = false; renderPreview(); };
  mnav.addEventListener('click', e => {
    if (e.target === mnav || e.target.closest('[data-mnav-close]')) { closeMnav(); return; }
    const pageEl = e.target.closest('[data-mnav-page]');
    if (pageEl) {
      const k = pageEl.dataset.mnavPage;
      STATE.mobileNavOpen = false;
      if (STATE.pageMeta[k]) switchPage(k);
      return;
    }
    const langEl = e.target.closest('[data-mnav-lang]');
    if (langEl) {
      const code = langEl.dataset.mnavLang;
      if (STATE.previewLang !== code) STATE.previewLang = code;
      closeMnav();
      return;
    }
    const itemEl = e.target.closest('[data-mnav-item]');
    if (itemEl) {
      const key = itemEl.dataset.mnavItem;
      closeMnav();
      if (key === 'login') { STATE.authModal = 'login'; renderPreview(); }
      else if (key === 'signup') { STATE.authModal = 'signup'; renderPreview(); }
      else if (key === 'guest-lookup') { STATE.guestLookupOpen = true; renderPreview(); }
      else if (key === 'logout') {
        setPreviewLoggedIn(false);
        toast('로그아웃되었습니다', 'success');
        renderRightPanel();
      } else {
        const label = key === 'profile' ? '내 정보' : '예약내역';
        toast(`${label} 페이지로 이동 (mockup)`, 'success');
      }
    }
  });
}

// --- renderMobileNav ---

function renderMobileNav() {
  if (!STATE.mobileNavOpen) return '';
  const site = STATE.site || {};
  const headerSec = (STATE.pages.home.sections || []).find(s => s.type === 'header');
  const headerCfg = (headerSec && headerSec.config) || {};
  const previewLoggedIn = headerCfg.previewLoggedIn === true;
  const chev = '<svg class="ps-mnav-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

  // 로고
  const DEFAULT_LOGO_URL = 'https://cdn.rideus.net/uploads/0012/12399/2025/11/13/785fd861c01d93a5e00985b0dba945f9.png';
  const logo = Array.isArray(headerCfg.logoImage) && headerCfg.logoImage[0] ? headerCfg.logoImage[0] : null;
  const logoHtml = logo
    ? `<div class="ps-mnav-logo" style="background-image:${logo.bg};"></div>`
    : `<img class="ps-mnav-logo" src="${DEFAULT_LOGO_URL}" alt="logo" />`;

  // 사용자 카드 (로그인 상태)
  const userCardHtml = previewLoggedIn ? `
    <div class="ps-mnav-user-card">
      <div class="ps-mnav-avatar-lg">홍</div>
      <div class="ps-mnav-user-info">
        <div class="ps-mnav-user-name">홍길동님</div>
        <div class="ps-mnav-user-meta">즐거운 여정 되세요 ✈️</div>
      </div>
    </div>` : '';

  // GNB 페이지 목록
  const gnbKeys = Array.isArray(headerCfg.gnbPages) ? headerCfg.gnbPages : [];
  const gnbLinks = gnbKeys
    .filter(k => STATE.pageMeta[k] && STATE.pageMeta[k].ready && STATE.pageMeta[k].enabled !== false)
    .map(k => `<button type="button" class="ps-mnav-link${k === STATE.currentPage ? ' active' : ''}" data-mnav-page="${k}"><span>${escapeHtml(STATE.pageMeta[k].name)}</span>${chev}</button>`)
    .join('');
  const gnbHtml = gnbLinks ? `<div class="ps-mnav-section">
    <div class="ps-mnav-section-label">메뉴</div>
    <nav class="ps-mnav-list">${gnbLinks}</nav>
  </div>` : '';

  // 계정/서비스 메뉴
  let accountHtml = '';
  if (previewLoggedIn) {
    accountHtml = `<div class="ps-mnav-section">
      <div class="ps-mnav-section-label">내 정보</div>
      <nav class="ps-mnav-list">
        <button type="button" class="ps-mnav-link" data-mnav-item="profile"><span>내 정보</span>${chev}</button>
        <button type="button" class="ps-mnav-link" data-mnav-item="bookings"><span>예약내역</span>${chev}</button>
      </nav>
    </div>`;
  } else if (site.guestBooking === true) {
    accountHtml = `<div class="ps-mnav-section">
      <div class="ps-mnav-section-label">서비스</div>
      <nav class="ps-mnav-list">
        <button type="button" class="ps-mnav-link" data-mnav-item="guest-lookup"><span>비회원 예약조회</span>${chev}</button>
      </nav>
    </div>`;
  }

  // 언어 선택 — 원어 이름(LANG_LABELS), 국기 없음
  const langs = Array.isArray(site.supportedLanguages) ? site.supportedLanguages : [];
  const labelOf = (code) => LANG_LABELS[code] || code;
  const currentLang = STATE.previewLang || site.defaultLanguage || langs[0] || 'ko';
  const checkIcon = '<svg class="ps-mnav-lang-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const langHtml = langs.length >= 2 ? `<div class="ps-mnav-section">
    <div class="ps-mnav-section-label">언어 선택</div>
    <div class="ps-mnav-lang-list">
      ${langs.map(code => `<button type="button" class="ps-mnav-lang-item${code === currentLang ? ' active' : ''}" data-mnav-lang="${code}">
        <span class="ps-mnav-lang-name">${escapeHtml(labelOf(code))}</span>
        ${code === currentLang ? checkIcon : ''}
      </button>`).join('')}
    </div>
  </div>` : '';

  // 하단 고정 CTA
  const footerHtml = previewLoggedIn
    ? `<div class="ps-mnav-footer">
        <button type="button" class="ps-mnav-btn ghost" data-mnav-item="logout">로그아웃</button>
      </div>`
    : (site.memberBooking !== false ? `<div class="ps-mnav-footer">
        <button type="button" class="ps-mnav-btn outline" data-mnav-item="login">로그인</button>
        <button type="button" class="ps-mnav-btn primary" data-mnav-item="signup">회원가입</button>
      </div>` : '');

  return `<div class="ps-mnav-backdrop show" data-mnav>
    <div class="ps-mnav-panel">
      <div class="ps-mnav-top">
        ${logoHtml}
        <button type="button" class="ps-mnav-close" data-mnav-close aria-label="닫기">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="ps-mnav-body">
        ${userCardHtml}
        ${gnbHtml}
        ${accountHtml}
        ${langHtml}
      </div>
      ${footerHtml}
    </div>
  </div>`;
}

// --- renderStopInfoModal ---

function renderStopInfoModal() {
  if (!STATE.stopInfoModal) return '';
  const info = STATE.stopInfoModal;
  const intro = info.intro || '';
  const addr = STOP_INFO_FIXED.address;
  const subtitle = STOP_INFO_FIXED.subtitle;
  const detail = STOP_INFO_FIXED.detail;
  const image = STOP_INFO_FIXED.image;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  return `<div class="ps-modal-backdrop show" data-stop-modal>
    <div class="ps-modal ps-stop-modal" role="dialog" aria-modal="true">
      <button class="ps-modal-close" data-stop-close aria-label="닫기">×</button>
      <div class="ps-stop-head">
        <h3>${escapeHtml(info.name)}</h3>
        ${intro ? `<p class="ps-stop-intro">${escapeHtml(intro)}</p>` : ''}
      </div>
      <div class="ps-stop-scroll">
        <div class="ps-stop-image">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(info.name)}" />
        </div>
        ${subtitle || detail ? `<div class="ps-stop-body">
          ${subtitle ? `<div class="ps-stop-subtitle">${escapeHtml(subtitle)}</div>` : ''}
          ${detail ? `<div class="ps-stop-detail">${escapeHtml(detail)}</div>` : ''}
        </div>` : ''}
      </div>
      <div class="ps-stop-footer">
        <a class="ps-stop-map-btn" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">위치 보기</a>
      </div>
    </div>
  </div>`;
}

// --- renderGuestLookupModal ---

function renderGuestLookupModal() {
  if (!STATE.guestLookupOpen) return '';
  const site = STATE.site || {};
  const fields = Array.isArray(site.guestFields) ? site.guestFields : [];
  const FIELD_DEF = {
    name:  { label: '이름',     type: 'text', placeholder: '홍길동' },
    email: { label: '이메일',   type: 'email', placeholder: 'name@example.com' },
    phone: { label: '전화번호', type: 'tel',  placeholder: '010-0000-0000' }
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
  const bodyInner = fieldRows || `<div class="ps-modal-empty">
    예약자 확인 항목이 설정되지 않았습니다. <br/>
    <strong>사이트 설정 › 로그인 설정 › 비회원 수집 항목</strong>에서 하나 이상의 항목을 선택해 주세요.
  </div>`;
  return `<div class="ps-modal-backdrop show" data-guest-modal>
    <div class="ps-modal" role="dialog" aria-modal="true" aria-labelledby="guestLookupTitle">
      <button class="ps-modal-close" data-guest-close aria-label="닫기">×</button>
      <div class="ps-modal-head">
        <h3 id="guestLookupTitle">비회원 예약조회</h3>
        <p>예약 시 입력하신 정보로 조회하세요.</p>
      </div>
      <div class="ps-modal-body">
        ${bodyInner}
      </div>
      <div class="ps-modal-foot">
        <button class="ps-modal-btn outline" data-guest-close>취소</button>
        <button class="ps-modal-btn primary" data-guest-submit>예약 조회</button>
      </div>
    </div>
  </div>`;
}

// --- renderAuthModal ---

function renderAuthModal() {
  const mode = STATE.authModal;
  if (mode !== 'login' && mode !== 'signup') return '';
  const site = STATE.site || {};
  const socials = site.socialLogins || {};
  const SOCIAL_ICON = {
    kakao:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4C6.48 4 2 7.5 2 11.8c0 2.78 1.83 5.22 4.58 6.6l-.93 3.43c-.08.3.25.54.51.36l4.1-2.72c.57.07 1.15.1 1.74.1 5.52 0 10-3.5 10-7.77S17.52 4 12 4z"/></svg>',
    naver:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.27 12.78 7.55 0H0v24h7.73V11.22L16.45 24H24V0h-7.73v12.78z"/></svg>',
    google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    apple:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>'
  };
  const SOCIAL_DEF = [
    { key: 'kakao',  label: '카카오' },
    { key: 'naver',  label: '네이버' },
    { key: 'google', label: '구글' },
    { key: 'apple',  label: '애플' }
  ];
  const enabledSocials = SOCIAL_DEF.filter(s => socials[s.key]?.enabled);
  const socialHtml = enabledSocials.length ? `
    <div class="ps-modal-divider">또는</div>
    <div class="ps-social-row">
      ${enabledSocials.map(s => `
        <button type="button" class="ps-social-btn ${s.key}" data-social="${s.key}" aria-label="${s.label}로 ${mode === 'login' ? '로그인' : '시작하기'}">
          ${SOCIAL_ICON[s.key]}
        </button>
      `).join('')}
    </div>` : '';

  if (mode === 'login') {
    return `<div class="ps-modal-backdrop show" data-auth-modal>
      <div class="ps-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <button class="ps-modal-close" data-auth-close aria-label="닫기">×</button>
        <div class="ps-modal-head">
          <h3 id="authTitle">로그인</h3>
        </div>
        <div class="ps-modal-body">
          <div class="ps-form-row">
            <label>이메일</label>
            <input class="ps-input" type="email" placeholder="name@example.com" />
          </div>
          <div class="ps-form-row">
            <label>비밀번호</label>
            <input class="ps-input" type="password" placeholder="비밀번호" />
          </div>
          <button type="button" class="ps-modal-link">비밀번호를 잊으셨나요?</button>
          ${socialHtml}
        </div>
        <div class="ps-modal-foot">
          <button class="ps-modal-btn primary" data-auth-submit>로그인</button>
        </div>
        <div class="ps-modal-foot-note">
          아직 회원이 아니신가요?<button type="button" data-auth-swap="signup">회원가입</button>
        </div>
      </div>
    </div>`;
  }

  // signup
  const COUNTRIES = [
    { dial: '+82',  name: '한국',         flag: '🇰🇷' },
    { dial: '+1',   name: '미국',         flag: '🇺🇸' },
    { dial: '+81',  name: '일본',         flag: '🇯🇵' },
    { dial: '+86',  name: '중국',         flag: '🇨🇳' },
    { dial: '+886', name: '대만',         flag: '🇹🇼' },
    { dial: '+852', name: '홍콩',         flag: '🇭🇰' },
    { dial: '+65',  name: '싱가포르',     flag: '🇸🇬' },
    { dial: '+84',  name: '베트남',       flag: '🇻🇳' },
    { dial: '+66',  name: '태국',         flag: '🇹🇭' },
    { dial: '+60',  name: '말레이시아',   flag: '🇲🇾' },
    { dial: '+62',  name: '인도네시아',   flag: '🇮🇩' },
    { dial: '+63',  name: '필리핀',       flag: '🇵🇭' },
    { dial: '+91',  name: '인도',         flag: '🇮🇳' },
    { dial: '+61',  name: '호주',         flag: '🇦🇺' },
    { dial: '+44',  name: '영국',         flag: '🇬🇧' },
    { dial: '+33',  name: '프랑스',       flag: '🇫🇷' },
    { dial: '+49',  name: '독일',         flag: '🇩🇪' }
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
          </button>
        `).join('')}
        <div class="ps-phone-cc-empty" data-phone-cc-empty style="display:none">일치하는 국가가 없습니다</div>
      </div>
    </div>`;
  const terms = Array.isArray(site.terms) ? site.terms : [];
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
            <span><span class="${tagClass}">${tagText}</span>${escapeHtml(t.name || `약관 ${i+1}`)}</span>
            ${t.type === 'url' && t.value ? '<a href="javascript:void(0)" onclick="event.preventDefault();event.stopPropagation();">보기</a>' : ''}
          </label>`;
        }).join('')}
      </div>
    </div>` : '';

  return `<div class="ps-modal-backdrop show" data-auth-modal>
    <div class="ps-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="ps-modal-close" data-auth-close aria-label="닫기">×</button>
      <div class="ps-modal-head">
        <h3 id="authTitle">회원가입</h3>
      </div>
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
  </div>`;
}

// --- renderRightPanel ---

function renderRightPanel() {
  // Right panel only manages the selected section's properties.
  const body = document.getElementById('rightPanelBody');
  body.innerHTML = renderProps();
  bindProps();
}

// --- renderProps ---

function renderProps() {
  const m = STATE.pageMeta[STATE.currentPage];
  if (!m.ready) {
    return `<div class="empty-props">
      ${ICN.next}
      <div class="empty-props-title">다음 단계에서 적용됩니다</div>
      <div class="empty-props-msg">현재 Phase 1은 메인 페이지에 한정됩니다. 다른 페이지로 확장하시려면 알려주세요.</div>
    </div>`;
  }

  // 자주묻는질문 콘텐츠 페이지 — 구분/질문/답변 편집기
  if (STATE.currentPage === 'static-faq') {
    const catOpts = (cur) => STATE.faqCategories.map(c =>
      `<option value="${escapeHtml(c)}" ${cur === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    const rows = STATE.faqPage.map((it, i) => `
      <div class="faq-edit-item" data-faq-idx="${i}">
        <div class="faq-edit-head">
          <span class="faq-edit-no">Q${i + 1}</span>
          <select class="field-select faq-edit-cat" data-faq-field="${i}.category">${catOpts(it.category)}</select>
          <button type="button" class="faq-edit-del" data-faq-del="${i}" title="삭제">${ICN.trash}</button>
        </div>
        <input type="text" class="field-input" placeholder="질문을 입력하세요" value="${escapeHtml(it.question || '')}" data-faq-field="${i}.question">
        <textarea class="field-textarea" rows="3" placeholder="답변을 입력하세요" data-faq-field="${i}.answer">${escapeHtml(it.answer || '')}</textarea>
      </div>`).join('');
    const catChips = STATE.faqCategories.map((c, i) => `
      <div class="faq-cat-chip">
        <span>${escapeHtml(c)}</span>
        <button type="button" class="faq-cat-del" data-faq-cat-del="${i}" title="삭제">×</button>
      </div>`).join('');
    return `<div class="props-section-header">
      <div class="props-section-icon-wrap">
        <div class="props-section-icon" style="background:#E0F2FE; color:#0369A1;">${ICN.help}</div>
        <div>
          <div class="props-section-name">자주 묻는 질문</div>
          <div class="props-section-sub">구분 · 질문 · 답변 관리 (${STATE.faqPage.length}개)</div>
        </div>
      </div>
    </div>
    <div class="form-group">
      <div class="form-group-header"><span class="form-group-title">구분값 관리</span></div>
      <div class="form-group-body">
        <div class="faq-cat-list">${catChips || '<div class="field-help">등록된 구분값이 없습니다.</div>'}</div>
        <div class="faq-cat-add-row">
          <input type="text" class="field-input" placeholder="새 구분값" data-faq-cat-input>
          <button type="button" class="image-add-btn" data-faq-cat-add="1">추가</button>
        </div>
        <div class="field-help">미리보기 페이지의 카테고리 탭 + 질문별 구분 드롭다운에 사용됩니다.</div>
      </div>
    </div>
    <div class="form-group">
      <div class="form-group-header"><span class="form-group-title">질문 · 답변</span></div>
      <div class="form-group-body">
        <div class="faq-edit-list">${rows || '<div class="field-help">등록된 질문이 없습니다. 아래 버튼으로 추가하세요.</div>'}</div>
        <button type="button" class="image-add-btn" data-faq-add="1" style="margin-top:10px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          질문 추가
        </button>
      </div>
    </div>`;
  }

  const sec = getSelectedSec();
  if (!sec) {
    return `<div class="empty-props">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div class="empty-props-title">섹션을 선택하세요</div>
      <div class="empty-props-msg">좌측 트리 또는 가운데 프리뷰에서 섹션을 클릭하면 속성을 편집할 수 있습니다.</div>
    </div>`;
  }

  const t = TYPES[sec.type];

  let html = `<div class="props-section-header">
    <div class="props-section-icon-wrap">
      <div class="props-section-icon ${sec.locked ? 'locked' : ''}">${t.icon}</div>
      <div>
        <div class="props-section-name">${t.name}</div>
      </div>
    </div>
  </div>`;

  if (t.enableable) {
    const enabled = sec.config.sectionEnabled !== false;
    html += `<div class="form-group">
      <div class="form-group-header"><span class="form-group-title">섹션 사용 여부</span>${ICN.chev}</div>
      <div class="form-group-body">
        <div class="field">
          <div class="field-label">
            <span>이 섹션 활성화</span>
            <label class="field-toggle">
              <input type="checkbox" data-sid="${sec.id}" data-key="sectionEnabled" data-toggle="1" data-affects-form="1" ${enabled ? 'checked' : ''}>
              <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
              <span class="field-toggle-text">${enabled ? 'ON' : 'OFF'}</span>
            </label>
          </div>
          <div class="field-help">OFF 시 모든 디바이스에서 이 섹션이 노출되지 않습니다.</div>
        </div>
      </div>
    </div>`;
  }

  if (t.fields && t.fields.length) {
    const visibleFields = t.fields.filter(f => {
      if (!f.showWhen) return true;
      if (typeof f.showWhen === 'function') return f.showWhen(sec.config);
      return !!sec.config[f.showWhen];
    });
    if (visibleFields.length) {
      html += `<div class="form-group">
        <div class="form-group-header"><span class="form-group-title">콘텐츠 & 옵션</span>${ICN.chev}</div>
        <div class="form-group-body">${visibleFields.map(f => renderField(f, sec)).join('')}</div>
      </div>`;
    }
  }

  if (sec.locked) {
    html += `<div class="form-group">
      <div class="form-group-body" style="padding: 16px;">
        <div style="background: var(--status-draft-bg); border: 1px solid rgba(180,83,9,.2); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--status-draft); line-height: 1.6;">
          <strong style="display:block; margin-bottom:4px;">위치 고정 섹션</strong>
          ${t.fields && t.fields.length ? '이 섹션은 페이지 상/하단에 항상 노출되며 이동·삭제할 수 없습니다. 콘텐츠는 위 필드에서 자유롭게 편집 가능합니다.' : '이 섹션은 시스템 표준 UX로 고정되어 있어 콘텐츠를 편집할 수 없습니다. 우측 <strong>테마</strong> 탭에서 컬러·로고 등 글로벌 토큰만 적용됩니다.'}
        </div>
      </div>
    </div>`;
  }

  return html;
}

// --- renderField ---

function renderField(f, sec) {
  // Read-only informational note (no input, no label row).
  if (f.type === 'note') {
    return `<div class="field"><div class="field-note">${escapeHtml(f.text || '')}</div></div>`;
  }
  // Visual separator between field groups.
  if (f.type === 'divider') {
    return `<div class="field-divider-row"></div>`;
  }
  // Site-settings summary: current values pulled from STATE.site + a jump-to-settings button.
  if (f.type === 'siteInfo') {
    const s = STATE.site || {};
    const langs = Array.isArray(s.supportedLanguages) ? s.supportedLanguages : [];
    const labelOf = (code) => {
      const o = (typeof CC_LANGUAGE_OPTIONS !== 'undefined') ? CC_LANGUAGE_OPTIONS.find(x => x.value === code) : null;
      return o ? o.label : code;
    };
    const defLabel = labelOf(s.defaultLanguage);
    const langList = langs.length ? langs.map(labelOf).join(', ') : '미설정';
    const onOff = (v) => v
      ? '<span class="site-info-badge on">ON</span>'
      : '<span class="site-info-badge off">OFF</span>';
    const row = (label, val) => `<div class="site-info-row"><span class="site-info-label">${label}</span><span class="site-info-value">${val}</span></div>`;
    return `<div class="field">
      <div class="site-info-box">
        <div class="site-info-caption">${escapeHtml('헤더에 표시되는 정보는 [사이트 설정]에서 관리됩니다.')}</div>
        ${row('제공 언어', escapeHtml(langList))}
        ${row('기본 언어', escapeHtml(defLabel || '미설정'))}
        ${row('회원 예약', onOff(s.memberBooking !== false))}
        ${row('비회원 예약', onOff(s.guestBooking === true))}
        <button type="button" class="site-info-btn" data-goto-site-settings="1">
          설정 변경하기
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>`;
  }
  const cfg = sec.config || {};
  const value = cfg[f.key];
  const hasOverride = sec.overrides[STATE.currentDevice] && f.key in sec.overrides[STATE.currentDevice];
  const displayValue = hasOverride ? sec.overrides[STATE.currentDevice][f.key] : value;

  // enableable: each field can be toggled ON/OFF independently
  const enabledKey = f.key + 'Enabled';
  const isFieldEnabled = f.enableable ? (cfg[enabledKey] !== false) : true;
  const disabledClass = (f.enableable && !isFieldEnabled) ? ' field-input-disabled' : '';
  const disabledAttr = (f.enableable && !isFieldEnabled) ? ' disabled' : '';

  const overridePill = f.overridable
    ? `<span class="override-pill ${hasOverride ? '' : 'off'}" data-action="toggle-override" data-key="${f.key}" data-sid="${sec.id}">${STATE.currentDevice.toUpperCase()}: ${hasOverride ? 'OVERRIDE' : 'INHERIT'}</span>`
    : '';

  const enableToggle = f.enableable
    ? `<label class="field-mini-toggle">
        <input type="checkbox" data-sid="${sec.id}" data-key="${enabledKey}" data-toggle="1" data-affects-form="1" ${isFieldEnabled ? 'checked' : ''}>
        <span class="field-mini-toggle-track"><span class="field-mini-toggle-thumb"></span></span>
      </label>`
    : '';

  // urltarget: composite field — label row contains a target segmented; input has placeholder text
  if (f.type === 'urltarget') {
    const targetKey = f.targetKey || 'ctaTarget';
    const targetVal = cfg[targetKey] || '_self';
    const placeholder = f.placeholder || '';
    return `<div class="field">
      <div class="field-label">
        <span>${escapeHtml(f.label)}</span>
        <div class="segmented segmented-compact" data-sid="${sec.id}" data-key="${targetKey}">
          <button class="segmented-btn ${targetVal === '_self' ? 'active' : ''}" data-v="_self">현재창</button>
          <button class="segmented-btn ${targetVal === '_blank' ? 'active' : ''}" data-v="_blank">새창</button>
        </div>
      </div>
      <input type="text" class="field-input" data-sid="${sec.id}" data-key="${f.key}" value="${escapeHtml(displayValue || '')}" placeholder="${escapeHtml(placeholder)}">
    </div>`;
  }

  let input = '';
  if (f.type === 'text') {
    input = `<input type="text" class="field-input${disabledClass}" data-sid="${sec.id}" data-key="${f.key}" value="${escapeHtml(displayValue || '')}"${disabledAttr}>`;
  } else if (f.type === 'textarea') {
    input = `<textarea class="field-textarea${disabledClass}" data-sid="${sec.id}" data-key="${f.key}"${disabledAttr}>${escapeHtml(displayValue || '')}</textarea>`;
  } else if (f.type === 'select') {
    let opts = f.options || [];
    if (f.dynamicOptionsFrom) {
      const source = cfg[f.dynamicOptionsFrom] || [];
      opts = source.map(v => ({ value: v, label: LANG_LABELS[v] || v }));
    }
    const selAffects = f.affectsForm ? ' data-affects-form="1"' : '';
    input = `<select class="field-select" data-sid="${sec.id}" data-key="${f.key}"${selAffects}>${
      opts.map(o => `<option value="${o.value}" ${String(displayValue) === String(o.value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')
    }</select>`;
  } else if (f.type === 'iconpicker') {
    const opts = f.options || [];
    input = `<div class="iconpicker" data-sid="${sec.id}" data-key="${f.key}">${
      opts.map(o => {
        const svg = ICN[o.value] || '';
        const active = String(displayValue) === String(o.value);
        return `<button type="button" class="iconpicker-cell${active ? ' active' : ''}" data-icon-value="${escapeHtml(o.value)}" title="${escapeHtml(o.label)}" aria-label="${escapeHtml(o.label)}">${svg}</button>`;
      }).join('')
    }</div>`;
  } else if (f.type === 'segmented') {
    const segAffects = f.affectsForm ? ' data-affects-form="1"' : '';
    input = `<div class="segmented" data-sid="${sec.id}" data-key="${f.key}"${segAffects}>${
      f.options.map(o => `<button class="segmented-btn ${String(displayValue) === String(o.value) ? 'active' : ''}" data-v="${o.value}">${escapeHtml(o.label)}</button>`).join('')
    }</div>`;
  } else if (f.type === 'color') {
    const colorVal = (typeof displayValue === 'string' && /^#[0-9A-Fa-f]{6}$/.test(displayValue)) ? displayValue : (f.default || '#FFFFFF');
    input = `<div class="color-picker field-color-row">
      <label class="color-swatch" style="background:${colorVal};">
        <input type="color" value="${colorVal}" data-sid="${sec.id}" data-key="${f.key}">
      </label>
      <input type="text" class="field-input" value="${escapeHtml(colorVal)}" data-sid="${sec.id}" data-key="${f.key}" style="font-family: var(--font-mono); flex: 1;">
    </div>`;
  } else if (f.type === 'range') {
    const min = (typeof f.min === 'number') ? f.min : 0;
    const max = (typeof f.max === 'number') ? f.max : 100;
    const step = (typeof f.step === 'number') ? f.step : 1;
    const suffix = f.suffix || '';
    const rawVal = (typeof displayValue === 'number') ? displayValue : (typeof f.default === 'number' ? f.default : max);
    const val = Math.max(min, Math.min(max, rawVal));
    input = `<div class="field-range-row">
      <input type="range" class="field-range" min="${min}" max="${max}" step="${step}" value="${val}" data-sid="${sec.id}" data-key="${f.key}" data-number="1">
      <span class="field-range-value">${val}${escapeHtml(suffix)}</span>
    </div>`;
  } else if (f.type === 'list') {
    const items = (displayValue || []).join('\n');
    input = `<textarea class="field-textarea" data-sid="${sec.id}" data-key="${f.key}" data-list="1" style="min-height:120px;">${escapeHtml(items)}</textarea>`;
  } else if (f.type === 'navlist') {
    input = `<textarea class="field-textarea" data-sid="${sec.id}" data-key="${f.key}" style="min-height:100px; font-family: var(--font-mono); font-size: 11.5px;" placeholder="라벨 | URL&#10;예: 회사소개 | /about">${escapeHtml(displayValue || '')}</textarea>`;
  } else if (f.type === 'imagepack') {
    const images = Array.isArray(displayValue) ? displayValue : [];
    const max = f.maxCount || 4;
    const slots = images.map((img, i) => {
      const linkRow = f.withLinks ? `
        <div class="image-slot-link">
          <input type="text" class="field-input image-slot-url" placeholder="https:// 또는 /path"
                 value="${escapeHtml(img.url || '')}"
                 data-image-url="1" data-sid="${sec.id}" data-key="${f.key}" data-idx="${i}">
          <label class="image-slot-target">
            <input type="checkbox" data-image-target="1" data-sid="${sec.id}" data-key="${f.key}" data-idx="${i}" ${img.target === '_blank' ? 'checked' : ''}>
            <span>새창</span>
          </label>
        </div>
      ` : '';
      const rowInner = `
        <div class="image-slot-thumb" style="background-image: ${img.bg}; background-size: cover;"></div>
        <div class="image-slot-info">
          <div class="image-slot-name">${escapeHtml(img.name || '이미지')}</div>
          <div class="image-slot-meta">${escapeHtml(img.size || '2400×1200')} · WebP</div>
        </div>
        <button class="image-slot-action tooltip" data-tip="교체" data-image-replace="1" data-sid="${sec.id}" data-key="${f.key}" data-idx="${i}">${ICN.copy}</button>
        <button class="image-slot-action delete tooltip" data-tip="삭제" data-image-delete="1" data-sid="${sec.id}" data-key="${f.key}" data-idx="${i}">${ICN.trash}</button>
      `;
      // Only wrap in `.image-slot-row` when link inputs are present (vertical stack).
      // Otherwise keep the original layout — `.image-slot` itself is the flex row.
      return f.withLinks
        ? `<div class="image-slot image-slot-with-link">
            <div class="image-slot-row">${rowInner}</div>
            ${linkRow}
          </div>`
        : `<div class="image-slot">${rowInner}</div>`;
    }).join('');
    const addBtn = images.length < max
      ? `<button class="image-add-btn" data-image-add="1" data-sid="${sec.id}" data-key="${f.key}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          이미지 추가 (${images.length}/${max})
        </button>`
      : `<div class="image-pack-max">최대 ${max}개 도달</div>`;
    input = `<div class="image-pack">${slots || ''}${addBtn}</div>`;
  } else if (f.type === 'assetpack') {
    const assets = Array.isArray(displayValue) ? displayValue : [];
    const max = f.maxCount || 8;
    // 3x3 layout grid (center cell is a non-selectable spacer).
    const posCells = [
      'top-left',    'top-center',    'top-right',
      'middle-left', null,            'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ];
    const posLabels = {
      'top-left': '상단 좌측', 'top-center': '상단 중앙', 'top-right': '상단 우측',
      'middle-left': '중앙 좌측', 'middle-right': '중앙 우측',
      'bottom-left': '하단 좌측', 'bottom-center': '하단 중앙', 'bottom-right': '하단 우측'
    };
    const slots = assets.map((a, i) => {
      const widthVal = (typeof a.width === 'number' && a.width > 0) ? a.width : 0;
      const posGrid = `<div class="asset-pos-grid" data-asset-pos-grid="1" data-sid="${sec.id}" data-asset-key="${f.key}" data-idx="${i}">${
        posCells.map(c => c === null
          ? `<div class="asset-pos-cell-spacer"></div>`
          : `<button type="button" class="asset-pos-cell${a.position === c ? ' active' : ''}" data-pos="${c}" title="${posLabels[c]}" aria-label="${posLabels[c]}"></button>`
        ).join('')
      }</div>`;
      return `
      <div class="image-slot">
        <div class="image-slot-thumb" style="background-image: ${a.bg}; background-size: cover;"></div>
        <div class="image-slot-info">
          <div class="image-slot-name">${escapeHtml(a.name || '에셋')}</div>
          ${posGrid}
          <div class="asset-slot-width">
            <input type="range" class="field-range asset-width-slider" min="0" max="500" step="10" value="${widthVal}" data-asset-width="1" data-sid="${sec.id}" data-asset-key="${f.key}" data-idx="${i}">
            <span class="asset-width-label">${widthVal > 0 ? widthVal + 'px' : '원본'}</span>
          </div>
        </div>
        <button class="image-slot-action tooltip" data-tip="교체" data-asset-replace="1" data-sid="${sec.id}" data-key="${f.key}" data-idx="${i}">${ICN.copy}</button>
        <button class="image-slot-action delete tooltip" data-tip="삭제" data-asset-delete="1" data-sid="${sec.id}" data-key="${f.key}" data-idx="${i}">${ICN.trash}</button>
      </div>
    `;
    }).join('');
    const addBtn = assets.length < max
      ? `<button class="image-add-btn" data-asset-add="1" data-sid="${sec.id}" data-key="${f.key}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          에셋 추가 (${assets.length}/${max})
        </button>`
      : `<div class="image-pack-max">최대 ${max}개 도달</div>`;
    input = `<div class="image-pack">${slots || ''}${addBtn}</div>`;
  } else if (f.type === 'multiselect') {
    const selected = Array.isArray(displayValue) ? displayValue : [];
    const affects = f.affectsForm ? ' data-affects-form="1"' : '';
    const msOpts = typeof f.options === 'function' ? f.options() : (f.options || []);
    const countHtml = `<span class="multiselect-count">${selected.length}개 선택됨</span>`;
    input = `<div class="multiselect-wrap">
      ${countHtml}
      <div class="multiselect" data-sid="${sec.id}" data-key="${f.key}"${affects}>${
        msOpts.map(o => `<label class="multiselect-row${o.disabled ? ' disabled' : ''}">
          <input type="checkbox" value="${o.value}" ${selected.includes(o.value) ? 'checked' : ''} ${o.disabled ? 'disabled' : ''}>
          <span class="multiselect-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
          ${o.badge ? `<span class="multiselect-badge" data-badge="${escapeHtml(o.badge)}">${escapeHtml(o.badge)}</span>` : ''}
          <span class="multiselect-label">${escapeHtml(o.label)}</span>
        </label>`).join('')
      }</div>
    </div>`;
  } else if (f.type === 'cardlist') {
    const items = Array.isArray(displayValue) ? displayValue : [];
    const itemsHtml = items.map((item, idx) => {
      const thumb = item.image && item.image.bg
        ? `<span class="cardlist-thumb" style="background-image:${item.image.bg};"></span>`
        : `<span class="cardlist-thumb cardlist-thumb-empty">${ICN.image}</span>`;
      return `<div class="cardlist-item" draggable="true" data-card-idx="${idx}" data-sid="${sec.id}" data-key="${f.key}">
        <span class="cardlist-handle">${ICN.drag}</span>
        ${thumb}
        <span class="cardlist-label">${escapeHtml(item.title || `카드 ${idx + 1}`)}</span>
        <button type="button" class="cardlist-del" data-card-del="${idx}" data-sid="${sec.id}" data-key="${f.key}" title="삭제">${ICN.trash}</button>
      </div>`;
    }).join('');
    input = `<div class="cardlist">
      <div class="cardlist-list" data-cardlist data-sid="${sec.id}" data-key="${f.key}">${itemsHtml || '<div class="cardlist-empty">등록된 카드가 없습니다.</div>'}</div>
      <button type="button" class="image-add-btn" data-card-add="1" data-sid="${sec.id}" data-key="${f.key}" style="margin-top: 8px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        카드 추가
      </button>
    </div>`;
  } else if (f.type === 'sortable') {
    // Two modes:
    // (a) Default — separate id-array stored under f.key; ids are looked up in an external
    //     catalog. Used by routegrid/featured for routes/products.
    // (b) reorderSource — items are objects living inside cfg[f.sourceKey]; reordering
    //     rewrites that same array in place. Used by banner for image order.
    const sourceKey = f.sourceKey || 'routes';
    let items = '';
    let listAttrs = `data-sid="${sec.id}" data-key="${f.key}"`;

    if (f.reorderSource) {
      const source = Array.isArray(cfg[sourceKey]) ? cfg[sourceKey] : [];
      items = source.map((item, idx) => {
        const label = item.name || item.label || `항목 ${idx + 1}`;
        const thumb = item.bg
          ? `<span class="sortable-thumb" style="background-image:${item.bg};"></span>`
          : '';
        return `<div class="sortable-item" draggable="true" data-sortable-id="${escapeHtml(String(item.id ?? idx))}" data-sortable-idx="${idx}" data-sid="${sec.id}" data-key="${sourceKey}" data-sort-mode="reorder-source">
          <span class="sortable-handle">${ICN.drag}</span>
          <span class="sortable-order">${idx + 1}</span>
          ${thumb}
          <span class="sortable-label">${escapeHtml(label)}</span>
        </div>`;
      }).join('');
      listAttrs = `data-sid="${sec.id}" data-key="${sourceKey}" data-sort-mode="reorder-source"`;
    } else {
      const catalog = f.catalog || ROUTE_CATALOG;
      const selected = Array.isArray(cfg[sourceKey]) ? cfg[sourceKey] : [];
      const stored = Array.isArray(displayValue) ? displayValue.filter(id => selected.includes(id)) : [];
      const remaining = selected.filter(id => !stored.includes(id));
      const order = [...stored, ...remaining];
      items = order.map((id, idx) => {
        const item = catalog.find(it => it.id === id);
        if (!item) return '';
        return `<div class="sortable-item" draggable="true" data-sortable-id="${id}" data-sortable-idx="${idx}" data-sid="${sec.id}" data-key="${f.key}">
          <span class="sortable-handle">${ICN.drag}</span>
          <span class="sortable-order">${idx + 1}</span>
          <span class="sortable-label">${escapeHtml(item.name)}</span>
        </div>`;
      }).join('');
    }

    input = `<div class="sortable-list" ${listAttrs}>${items}</div>`;
  } else if (f.type === 'toggle') {
    const checked = displayValue ? 'checked' : '';
    const affects = f.affectsForm ? ' data-affects-form="1"' : '';
    input = `<label class="field-toggle">
      <input type="checkbox" data-sid="${sec.id}" data-key="${f.key}" data-toggle="1"${affects} ${checked}>
      <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
      <span class="field-toggle-text">${displayValue ? 'ON' : 'OFF'}</span>
    </label>`;
  }

  const resolvedLabel = (typeof f.label === 'function') ? f.label(cfg) : f.label;
  return `<div class="field${f.enableable && !isFieldEnabled ? ' field-disabled' : ''}">
    <div class="field-label"><span>${escapeHtml(resolvedLabel)}</span>${enableToggle}${overridePill}</div>
    ${input}
    ${f.help ? `<div class="field-help">${escapeHtml(f.help)}</div>` : ''}
    ${hasOverride ? `<div class="field-help info">현재 <strong>${STATE.currentDevice.toUpperCase()}</strong> 디바이스 전용 값을 편집 중입니다.</div>` : ''}
  </div>`;
}

// --- renderCatalog ---

function renderCatalog() {
  const groups = {};
  Object.entries(TYPES).forEach(([k, t]) => {
    if (t.category === 'system') return;
    groups[t.category] = groups[t.category] || [];
    groups[t.category].push({ key: k, ...t });
  });

  let html = `<div class="catalog-search"><input type="text" class="catalog-search-input" placeholder="섹션 검색..." id="catalogSearchInput"></div><div class="catalog-list">`;
  Object.entries(groups).forEach(([cat, list]) => {
    html += `<div class="catalog-group-label">${CATEGORY_LABEL[cat] || cat}</div>`;
    list.forEach(it => {
      html += `<div class="catalog-item" data-add="${it.key}">
        <div class="catalog-item-thumb">${it.icon}</div>
        <div class="catalog-item-info">
          <div class="catalog-item-name">${it.name}</div>
          <div class="catalog-item-desc">${TYPE_DESC[it.key] || ''}</div>
        </div>
      </div>`;
    });
  });
  html += `</div>`;
  return html;
}

// --- renderSiteSettings ---

function renderSiteSettings() {
  const site = STATE.site;
  const supported = Array.isArray(site.supportedLanguages) ? site.supportedLanguages : [];

  // Each language is a chip with an ON/OFF toggle. The default language (chosen via
  // the 기본언어 dropdown) shows a "(기본)" badge.
  const langGridCells = CC_LANGUAGE_OPTIONS.map(o => {
    const isSupported = supported.includes(o.value);
    const isDefault   = site.defaultLanguage === o.value;
    return `<div class="lang-chip${isSupported ? ' supported' : ''}${isDefault ? ' default' : ''}">
      ${isDefault ? '<span class="lang-chip-badge">기본</span>' : ''}
      <span class="lang-chip-label">${escapeHtml(o.label)}</span>
      <label class="lang-chip-toggle">
        <input type="checkbox" data-site-lang-toggle="${o.value}" ${isSupported ? 'checked' : ''}>
        <span class="lang-chip-toggle-track"><span class="lang-chip-toggle-thumb"></span></span>
      </label>
    </div>`;
  }).join('');

  // 기본언어 dropdown — all 8 languages selectable. Picking an OFF language turns it ON.
  const langDefaultOptions = CC_LANGUAGE_OPTIONS.map(o =>
    `<option value="${o.value}" ${site.defaultLanguage === o.value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`
  ).join('');

  const guestFields = Array.isArray(site.guestFields) ? site.guestFields : [];
  const guestFieldChip = (key, label) => {
    const checked = guestFields.includes(key);
    return `<button type="button" class="guest-field-chip${checked ? ' active' : ''}" data-guest-field="${key}">
      <span class="guest-field-check">${checked ? ICN.check : ''}</span>
      <span>${escapeHtml(label)}</span>
    </button>`;
  };

  // One agreement (약관) row: name + required toggle + type toggle (URL / 직접입력) + value + remove.
  const termsRow = (term, idx) => {
    const isUrl = term.type !== 'text';
    const isRequired = term.required === true;
    return `<div class="terms-row" data-terms-idx="${idx}">
      <div class="terms-row-head">
        <input type="text" class="field-input terms-name" value="${escapeHtml(term.name || '')}"
               placeholder="약관명" data-terms-field="${idx}.name">
        <div class="segmented terms-required-seg" data-terms-required="${idx}">
          <button type="button" class="segmented-btn ${isRequired ? 'active' : ''}" data-v="required">필수</button>
          <button type="button" class="segmented-btn ${!isRequired ? 'active' : ''}" data-v="optional">선택</button>
        </div>
        <div class="segmented terms-type-seg" data-terms-type="${idx}">
          <button type="button" class="segmented-btn ${isUrl ? 'active' : ''}" data-v="url">URL</button>
          <button type="button" class="segmented-btn ${!isUrl ? 'active' : ''}" data-v="text">직접입력</button>
        </div>
        <button type="button" class="terms-remove" data-terms-remove="${idx}" title="삭제">${ICN.trash}</button>
      </div>
      ${isUrl
        ? `<input type="text" class="field-input" value="${escapeHtml(term.value || '')}" placeholder="https://example.com/terms" data-terms-field="${idx}.value">`
        : `<div class="terms-editor">
            <div class="terms-editor-toolbar">
              <button type="button" class="terms-editor-btn" data-terms-cmd="bold" title="굵게"><b>B</b></button>
              <button type="button" class="terms-editor-btn" data-terms-cmd="italic" title="기울임"><i>I</i></button>
              <button type="button" class="terms-editor-btn" data-terms-cmd="underline" title="밑줄"><u>U</u></button>
              <span class="terms-editor-sep"></span>
              <button type="button" class="terms-editor-btn" data-terms-cmd="formatBlock:H3" title="제목">H</button>
              <button type="button" class="terms-editor-btn" data-terms-cmd="insertUnorderedList" title="목록">≣</button>
              <button type="button" class="terms-editor-btn" data-terms-cmd="createLink" title="링크">🔗</button>
              <span class="terms-editor-sep"></span>
              <button type="button" class="terms-editor-btn" data-terms-cmd="removeFormat" title="서식 지우기">✕</button>
            </div>
            <div class="terms-editor-body" contenteditable="true" data-terms-editor="${idx}"
                 data-placeholder="약관 전문을 입력하세요">${term.value || ''}</div>
          </div>`
      }
    </div>`;
  };

  const socialLoginRow = (key, name) => {
    const cfg = site.socialLogins?.[key] || { enabled: false };
    return `<div class="social-login-row${cfg.enabled ? ' enabled' : ''}">
      <div class="social-login-head">
        <span class="social-login-name">${escapeHtml(name)}</span>
        <label class="field-toggle field-toggle-mini">
          <input type="checkbox" data-social-toggle="${key}" ${cfg.enabled ? 'checked' : ''}>
          <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
        </label>
      </div>
    </div>`;
  };

  // Renders a row in the basic payment-methods list. Some methods (paypal/eximbay/account)
  // have simple credential schemas — those fields are nested under `cfg.credentials`.
  const isSelfPg = site.payment?.pgType === 'self';
  const paymentMethodRow = (key, name, fieldSpec) => {
    const cfg = site.payment?.methods?.[key] || { enabled: false };
    const required = !!cfg.required;
    const showDetails = isSelfPg && cfg.enabled && fieldSpec && fieldSpec.length;
    const credentialInputs = showDetails
      ? fieldSpec.map(f => `<div class="payment-row-field">
          <label class="payment-row-field-label">${escapeHtml(f.label)}</label>
          <input type="${f.secret ? 'password' : 'text'}" class="field-input"
                 placeholder="${escapeHtml(f.placeholder || '')}"
                 value="${escapeHtml((cfg.credentials || {})[f.key] || '')}"
                 data-payment-cred="${key}.${f.key}">
        </div>`).join('')
      : '';
    return `<div class="payment-row${cfg.enabled ? ' enabled' : ''}">
      <div class="payment-row-head">
        <span class="payment-row-name">
          ${escapeHtml(name)}
          ${required ? '<span class="payment-row-required">필수</span>' : ''}
        </span>
        <label class="field-toggle field-toggle-mini">
          <input type="checkbox" data-payment-toggle="${key}" ${cfg.enabled ? 'checked' : ''} ${required ? 'disabled' : ''}>
          <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
        </label>
      </div>
      ${credentialInputs ? `<div class="payment-row-body">${credentialInputs}</div>` : ''}
    </div>`;
  };

  // Renders a simple-pay row using its provider-specific fields from SIMPLE_PAY_PROVIDERS.
  const simplePayRow = (provider) => {
    const cfg = site.payment?.simplePay?.[provider.value] || { enabled: false };
    const showDetails = isSelfPg && cfg.enabled;
    const credentialInputs = showDetails
      ? provider.fields.map(f => `<div class="payment-row-field">
          <label class="payment-row-field-label">${escapeHtml(f.label)}</label>
          <input type="${f.secret ? 'password' : 'text'}" class="field-input"
                 value="${escapeHtml(cfg[f.key] || '')}"
                 data-simplepay-input="${provider.value}.${f.key}">
        </div>`).join('')
      : '';
    return `<div class="payment-row${cfg.enabled ? ' enabled' : ''}">
      <div class="payment-row-head">
        <span class="payment-row-name">${escapeHtml(provider.label)}</span>
        <label class="field-toggle field-toggle-mini">
          <input type="checkbox" data-simplepay-toggle="${provider.value}" ${cfg.enabled ? 'checked' : ''}>
          <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
        </label>
      </div>
      ${credentialInputs ? `<div class="payment-row-body">${credentialInputs}</div>` : ''}
    </div>`;
  };

  // Credit-card row inside the 결제수단 list. Always enabled (required).
  // In self-PG mode it expands into a PG provider dropdown + provider-specific credential fields.
  const renderCreditCardRow = () => {
    const provider = PG_PROVIDERS.find(p => p.value === site.payment.pgProvider) || PG_PROVIDERS[0];
    const creds = (site.payment.pgCredentials || {})[provider.value] || {};
    const optionsHtml = PG_PROVIDERS.map(p =>
      `<option value="${p.value}" ${site.payment.pgProvider === p.value ? 'selected' : ''}>${escapeHtml(p.label)}</option>`
    ).join('');
    const fieldsHtml = provider.fields.map(f => `
      <div class="payment-row-field">
        <label class="payment-row-field-label">${escapeHtml(f.label)}</label>
        <input type="${f.secret ? 'password' : 'text'}" class="field-input"
               placeholder="${escapeHtml(f.placeholder || '')}"
               value="${escapeHtml(creds[f.key] || '')}"
               data-pg-cred="${provider.value}.${f.key}">
      </div>`).join('');
    const detailsBody = isSelfPg
      ? `<div class="payment-row-body">
          <div class="payment-row-field payment-row-field-full">
            <label class="payment-row-field-label">PG사 선택</label>
            <select class="field-select" data-site-pg-provider="1">${optionsHtml}</select>
          </div>
          ${fieldsHtml}
        </div>`
      : '';
    return `<div class="payment-row enabled">
      <div class="payment-row-head">
        <span class="payment-row-name">
          신용카드
          <span class="payment-row-required">필수</span>
        </span>
        <label class="field-toggle field-toggle-mini">
          <input type="checkbox" checked disabled>
          <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
        </label>
      </div>
      ${detailsBody}
    </div>`;
  };

  // Real-time account transfer row. Like credit card, in self-PG mode it expands into
  // a PG provider dropdown + provider-specific credential fields (only when enabled).
  const renderAccountTransferRow = () => {
    const cfg = site.payment?.methods?.account || { enabled: false };
    const provider = ACCOUNT_TRANSFER_PROVIDERS.find(p => p.value === site.payment.accountProvider) || ACCOUNT_TRANSFER_PROVIDERS[0];
    const creds = (site.payment.accountCredentials || {})[provider.value] || {};
    const optionsHtml = ACCOUNT_TRANSFER_PROVIDERS.map(p =>
      `<option value="${p.value}" ${site.payment.accountProvider === p.value ? 'selected' : ''}>${escapeHtml(p.label)}</option>`
    ).join('');
    const fieldsHtml = provider.fields.map(f => `
      <div class="payment-row-field">
        <label class="payment-row-field-label">${escapeHtml(f.label)}</label>
        <input type="${f.secret ? 'password' : 'text'}" class="field-input"
               placeholder="${escapeHtml(f.placeholder || '')}"
               value="${escapeHtml(creds[f.key] || '')}"
               data-acct-cred="${provider.value}.${f.key}">
      </div>`).join('');
    const detailsBody = (isSelfPg && cfg.enabled)
      ? `<div class="payment-row-body">
          <div class="payment-row-field payment-row-field-full">
            <label class="payment-row-field-label">PG사 선택</label>
            <select class="field-select" data-site-acct-provider="1">${optionsHtml}</select>
          </div>
          ${fieldsHtml}
        </div>`
      : '';
    return `<div class="payment-row${cfg.enabled ? ' enabled' : ''}">
      <div class="payment-row-head">
        <span class="payment-row-name">실시간 계좌이체</span>
        <label class="field-toggle field-toggle-mini">
          <input type="checkbox" data-payment-toggle="account" ${cfg.enabled ? 'checked' : ''}>
          <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
        </label>
      </div>
      ${detailsBody}
    </div>`;
  };

  const fav = site.favicon || {};
  const favBg = fav.bg || "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)";
  const favName = fav.name || 'favicon-default.svg';

  return `<div class="site-settings-shell">
    <div class="site-settings-card">
      <div class="props-section-header">
        <div class="props-section-icon-wrap">
          <div class="props-section-icon" style="background:#E0F2FE; color:#0369A1;">${ICN.globe}</div>
          <div>
            <div class="props-section-name">사이트 설정</div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <div class="form-group-header"><span class="form-group-title">기본 설정</span>${ICN.chev}</div>
        <div class="form-group-body">
          <div class="field">
            <div class="field-label"><span>웹사이트 이름</span></div>
            <input type="text" class="field-input" value="${escapeHtml(site.title || '')}" data-site-key="title" placeholder="웹사이트 이름을 입력해주세요">
          </div>
          <div class="field">
            <div class="field-label"><span>도메인 URL</span></div>
            <div class="domain-row">
              <input type="text" class="field-input domain-input" value="${escapeHtml(site.domainPrefix || '')}" data-site-key="domainPrefix" placeholder="myweb">
              <span class="domain-suffix">.rideus.net</span>
            </div>
          </div>
          <div class="field">
            <div class="field-label">
              <span>제공 언어</span>
              <span class="field-help-inline">${supported.filter(c => CC_LANGUAGE_OPTIONS.some(o => o.value === c)).length}개 사용중</span>
            </div>
            <div class="lang-default-row">
              <span class="lang-default-label">기본언어</span>
              <select class="field-select" data-site-default-lang="1">${langDefaultOptions}</select>
            </div>
            <div class="lang-grid" data-site-langs-host="1">${langGridCells}</div>
          </div>
          <div class="seo-divider"><span>SEO 메타데이터</span></div>
          <div class="field">
            <div class="field-label">
              <span>사이트 설명</span>
              <span class="field-help-inline">meta description</span>
            </div>
            <textarea class="field-textarea" data-site-key="seoDescription" rows="2" placeholder="검색 결과에 표시될 사이트 요약 (50~160자 권장)">${escapeHtml(site.seoDescription || '')}</textarea>
          </div>
          <div class="field">
            <div class="field-label">
              <span>검색 태그</span>
              <span class="field-help-inline">meta keywords</span>
            </div>
            <input type="text" class="field-input" data-site-key="seoKeywords" value="${escapeHtml(site.seoKeywords || '')}" placeholder="셔틀, 비발디파크, 스키, 리조트 (쉼표로 구분)">
          </div>
          <div class="field">
            <div class="field-label"><span>파비콘 이미지</span></div>
            <div class="image-slot">
              <div class="image-slot-thumb" style="background-image: ${favBg}; background-size: cover;"></div>
              <div class="image-slot-info">
                <div class="image-slot-name">${escapeHtml(favName)}</div>
                <div class="image-slot-meta">기본 파비콘 · PNG</div>
              </div>
              <button class="image-slot-action tooltip" data-tip="교체" data-site-favicon-replace="1">${ICN.copy}</button>
              <button class="image-slot-action delete tooltip" data-tip="기본으로" data-site-favicon-reset="1">${ICN.trash}</button>
            </div>
          </div>
          <div class="field">
            <div class="field-label">
              <span>OG 이미지</span>
              <span class="field-help-inline">1200×630 권장</span>
            </div>
            ${site.ogImage ? `
            <div class="image-slot image-slot-og">
              <div class="image-slot-thumb image-slot-thumb-og" style="background-image: ${site.ogImage.bg}; background-size: cover;"></div>
              <div class="image-slot-info">
                <div class="image-slot-name">${escapeHtml(site.ogImage.name || 'og-image')}</div>
                <div class="image-slot-meta">SNS 공유 시 노출 · 1200×630</div>
              </div>
              <button class="image-slot-action tooltip" data-tip="교체" data-site-og-replace="1">${ICN.copy}</button>
              <button class="image-slot-action delete tooltip" data-tip="삭제" data-site-og-remove="1">${ICN.trash}</button>
            </div>
            ` : `
            <button class="image-add-btn" data-site-og-add="1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              OG 이미지 추가
            </button>
            `}
          </div>
        </div>
      </div>

      <div class="form-group">
        <div class="form-group-header"><span class="form-group-title">로그인 설정</span>${ICN.chev}</div>
        <div class="form-group-body">
          <div class="field-row">
            <div class="field">
              <div class="field-label"><span>회원 예약</span></div>
              <label class="field-toggle">
                <input type="checkbox" data-site-toggle="memberBooking" ${site.memberBooking !== false ? 'checked' : ''}>
                <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
                <span class="field-toggle-text">${site.memberBooking !== false ? 'ON' : 'OFF'}</span>
              </label>
              <div class="field-help">OFF로 변경 시 비회원 예약 허용이 자동으로 ON됩니다.</div>
            </div>
            <div class="field">
              <div class="field-label"><span>비회원 예약 허용</span></div>
              <label class="field-toggle">
                <input type="checkbox" data-site-toggle="guestBooking" ${site.guestBooking === true ? 'checked' : ''} ${site.memberBooking === false ? 'disabled' : ''}>
                <span class="field-toggle-track"><span class="field-toggle-thumb"></span></span>
                <span class="field-toggle-text">${site.guestBooking === true ? 'ON' : 'OFF'}</span>
              </label>
              <div class="field-help">ON일 경우 로그인 없이도 예약이 가능합니다.</div>
            </div>
          </div>
          ${site.memberBooking !== false ? `
          <div class="field">
            <div class="field-label"><span>간편 로그인 사용</span></div>
            <div class="social-login-list social-login-grid">
              ${socialLoginRow('kakao',  '카카오')}
              ${socialLoginRow('naver',  '네이버')}
              ${socialLoginRow('google', '구글')}
              ${socialLoginRow('apple',  '애플')}
            </div>
            <div class="field-help">사용할 간편 로그인 항목을 켜주세요.</div>
          </div>
          ` : ''}
          ${site.guestBooking === true ? `
          <div class="field">
            <div class="field-label"><span>비회원 수집 항목</span></div>
            <div class="guest-fields-grid">
              ${guestFieldChip('name',  '이름')}
              ${guestFieldChip('email', '이메일')}
              ${guestFieldChip('phone', '전화번호')}
            </div>
            <div class="field-help">비회원 예약 시 수집할 정보 항목을 선택하세요.</div>
          </div>
          ` : ''}
          <div class="field">
            <div class="field-label"><span>약관</span></div>
            <div class="terms-list">
              ${(site.terms || []).map(termsRow).join('')}
            </div>
            <button type="button" class="image-add-btn" data-terms-add="1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              약관 추가
            </button>
            <div class="field-help">기본 약관(이용약관·개인정보처리방침) 외 필요한 약관을 추가할 수 있습니다.</div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <div class="form-group-header"><span class="form-group-title">결제 설정</span>${ICN.chev}</div>
        <div class="form-group-body">
          <div class="field">
            <div class="field-label"><span>PG 선택</span></div>
            <div class="segmented" data-site-segmented="pgType">
              <button class="segmented-btn ${site.payment.pgType === 'integrated' ? 'active' : ''}" data-v="integrated" type="button">TMS 통합 PG</button>
              <button class="segmented-btn ${site.payment.pgType === 'self'       ? 'active' : ''}" data-v="self"       type="button">자체 PG</button>
            </div>
            <div class="field-help">자체 PG 선택 시 PG사 및 각 결제수단별 가맹점 정보를 입력해야 합니다.</div>
          </div>
          <div class="field">
            <div class="field-label"><span>결제 수단</span></div>
            <div class="payment-method-list payment-method-grid">
              ${renderCreditCardRow()}
              ${paymentMethodRow('paypal',     '해외결제 (Paypal)',  [
                { key: 'merchantId', label: 'Merchant ID' },
                { key: 'key',        label: 'API Key', secret: true }
              ])}
              ${paymentMethodRow('eximbay',    '해외결제 (Eximbay)', [
                { key: 'merchantId', label: 'Merchant ID' },
                { key: 'key',        label: 'API Key', secret: true }
              ])}
              ${renderAccountTransferRow()}
            </div>
          </div>
          <div class="field">
            <div class="field-label"><span>간편결제</span></div>
            <div class="payment-method-list payment-method-grid">
              ${SIMPLE_PAY_PROVIDERS.map(simplePayRow).join('')}
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="site-settings-footer">
      <button type="button" class="site-settings-list-btn" id="siteSettingsBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        <span>편집으로 돌아가기</span>
      </button>
      <div class="site-settings-footer-actions">
        <button type="button" class="btn btn-primary" id="siteSettingsSave">저장</button>
      </div>
    </div>
  </div>`;
}

// --- bindProps ---

function bindProps() {
  // "설정 변경하기" → jump to the site-settings view
  const gotoSettings = document.querySelector('#rightPanelBody [data-goto-site-settings]');
  if (gotoSettings) {
    gotoSettings.addEventListener('click', () => switchToSiteSettings());
  }

  // 자주묻는질문 — 구분값 추가
  const catAdd = document.querySelector('#rightPanelBody [data-faq-cat-add]');
  if (catAdd) {
    const catInput = document.querySelector('#rightPanelBody [data-faq-cat-input]');
    const doAdd = () => {
      const v = (catInput?.value || '').trim();
      if (!v) return;
      if (STATE.faqCategories.includes(v)) {
        toast('이미 존재하는 구분값입니다', 'warn');
        return;
      }
      STATE.faqCategories.push(v);
      renderPreview();
      renderRightPanel();
    };
    catAdd.addEventListener('click', doAdd);
    if (catInput) {
      catInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); doAdd(); }
      });
    }
  }
  // 자주묻는질문 — 구분값 삭제 (사용 중인 질문은 첫 번째 구분값으로 이동)
  document.querySelectorAll('#rightPanelBody [data-faq-cat-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.faqCatDel, 10);
      const cat = STATE.faqCategories[idx];
      if (cat == null) return;
      const used = STATE.faqPage.filter(it => it.category === cat).length;
      if (used > 0 && !confirm(`'${cat}' 구분값을 사용하는 질문이 ${used}개 있습니다. 삭제 시 해당 질문은 첫 번째 구분값으로 이동됩니다. 계속하시겠습니까?`)) return;
      STATE.faqCategories.splice(idx, 1);
      const fallback = STATE.faqCategories[0] || '';
      STATE.faqPage.forEach(it => { if (it.category === cat) it.category = fallback; });
      renderPreview();
      renderRightPanel();
    });
  });

  // 자주묻는질문 페이지 편집기: 추가 / 삭제 / 필드 입력
  const faqAdd = document.querySelector('#rightPanelBody [data-faq-add]');
  if (faqAdd) {
    faqAdd.addEventListener('click', () => {
      STATE.faqPage.push({ category: STATE.faqCategories[0] || '', question: '', answer: '' });
      renderPreview();
      renderRightPanel();
    });
  }
  document.querySelectorAll('#rightPanelBody [data-faq-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.faqPage.splice(parseInt(btn.dataset.faqDel, 10), 1);
      renderPreview();
      renderRightPanel();
    });
  });
  document.querySelectorAll('#rightPanelBody [data-faq-field]').forEach(el => {
    const apply = () => {
      const [idx, field] = el.dataset.faqField.split('.');
      const item = STATE.faqPage[parseInt(idx, 10)];
      if (!item) return;
      item[field] = el.value;
      renderPreview(); // live-update the FAQ page preview
    };
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });

  // text/textarea/select live binding
  document.querySelectorAll('#rightPanelBody [data-key]').forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      const handler = () => {
        let value;
        if (el.dataset.toggle === '1') {
          value = el.checked;
        } else if (el.dataset.list === '1') {
          value = el.value.split('\n').map(s => s.trim()).filter(Boolean);
        } else if (el.dataset.number === '1') {
          value = parseFloat(el.value);
          if (Number.isNaN(value)) value = 0;
        } else {
          value = el.value;
        }
        updateConfigValue(el.dataset.sid, el.dataset.key, value);

        // Toggles or selects that affect form structure → re-render props panel
        if (el.dataset.affectsForm === '1' && (el.dataset.toggle === '1' || el.tagName === 'SELECT')) {
          renderRightPanel();
          return;
        }
        // Plain toggles → just update the ON/OFF text inline
        if (el.dataset.toggle === '1') {
          const text = el.parentElement.querySelector('.field-toggle-text');
          if (text) text.textContent = el.checked ? 'ON' : 'OFF';
        }
        // Range slider → live-update the displayed value pill
        if (el.type === 'range') {
          const valEl = el.parentElement.querySelector('.field-range-value');
          if (valEl) {
            const suffix = valEl.textContent.replace(/^[\d.\-]+/, '');
            valEl.textContent = el.value + suffix;
          }
        }
      };
      if (el.type === 'checkbox') {
        el.addEventListener('change', handler);
      } else {
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
      }
    }
  });

  // Multi-select (language options, route selection, etc.)
  document.querySelectorAll('#rightPanelBody .multiselect').forEach(ms => {
    const sid = ms.dataset.sid;
    const key = ms.dataset.key;
    const affectsForm = ms.dataset.affectsForm === '1';
    ms.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(ms.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
        updateConfigValue(sid, key, checked);
        if (affectsForm) {
          renderRightPanel();
        } else {
          const wrap = ms.closest('.multiselect-wrap');
          if (wrap) {
            const countEl = wrap.querySelector('.multiselect-count');
            if (countEl) countEl.textContent = `${checked.length}개 선택됨`;
          }
        }
      });
    });
  });

  // === 카드 리스트 (cardlist) ===
  // 추가
  document.querySelectorAll('#rightPanelBody [data-card-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const list = Array.isArray(sec.config[key]) ? [...sec.config[key]] : [];
      const newCard = { id: 'card_' + Math.random().toString(36).slice(2, 8), image: null, title: '', body: '' };
      list.push(newCard);
      updateConfigValue(sid, key, list);
      renderRightPanel();
      openCardEditModal(sid, key, list.length - 1);
    });
  });
  // 삭제
  document.querySelectorAll('#rightPanelBody [data-card-del]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const idx = parseInt(btn.dataset.cardDel, 10);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const list = Array.isArray(sec.config[key]) ? [...sec.config[key]] : [];
      list.splice(idx, 1);
      updateConfigValue(sid, key, list);
      renderRightPanel();
    });
  });
  // 클릭 → 편집 모달
  document.querySelectorAll('#rightPanelBody .cardlist-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('[data-card-del]') || e.target.closest('.cardlist-handle')) return;
      const sid = item.dataset.sid;
      const key = item.dataset.key;
      const idx = parseInt(item.dataset.cardIdx, 10);
      openCardEditModal(sid, key, idx);
    });
  });
  // 드래그-드롭 순서 변경
  document.querySelectorAll('#rightPanelBody [data-cardlist]').forEach(list => {
    let srcEl = null;
    list.querySelectorAll('.cardlist-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        srcEl = item; item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.cardlist-item').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
        srcEl = null;
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        if (!srcEl || srcEl === item) return;
        const rect = item.getBoundingClientRect();
        const isTop = (e.clientY - rect.top) < rect.height / 2;
        list.querySelectorAll('.cardlist-item').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
        item.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (!srcEl || srcEl === item) return;
        const sid = list.dataset.sid;
        const key = list.dataset.key;
        const fromIdx = parseInt(srcEl.dataset.cardIdx, 10);
        let toIdx = parseInt(item.dataset.cardIdx, 10);
        const rect = item.getBoundingClientRect();
        const isTop = (e.clientY - rect.top) < rect.height / 2;
        if (!isTop) toIdx += (fromIdx < toIdx ? 0 : 1);
        else toIdx -= (fromIdx < toIdx ? 1 : 0);
        const sec = getPage().sections.find(s => s.id === sid);
        if (!sec) return;
        const arr = Array.isArray(sec.config[key]) ? [...sec.config[key]] : [];
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        updateConfigValue(sid, key, arr);
        renderRightPanel();
      });
    });
  });

  // Sortable list (route order)
  document.querySelectorAll('#rightPanelBody .sortable-list').forEach(list => {
    let srcEl = null;
    list.querySelectorAll('.sortable-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        srcEl = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.sortable-item').forEach(el => {
          el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
        srcEl = null;
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        if (!srcEl || srcEl === item) return;
        const rect = item.getBoundingClientRect();
        const isTop = (e.clientY - rect.top) < rect.height / 2;
        list.querySelectorAll('.sortable-item').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
        item.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (!srcEl || srcEl === item) return;
        const sid = list.dataset.sid;
        const key = list.dataset.key;
        const ids = Array.from(list.querySelectorAll('.sortable-item')).map(el => el.dataset.sortableId);
        const srcId = srcEl.dataset.sortableId;
        const dstId = item.dataset.sortableId;
        const fromIdx = ids.indexOf(srcId);
        let toIdx = ids.indexOf(dstId);
        const rect = item.getBoundingClientRect();
        const isTop = (e.clientY - rect.top) < rect.height / 2;
        if (!isTop) toIdx += (fromIdx < toIdx ? 0 : 1);
        else toIdx -= (fromIdx < toIdx ? 1 : 0);
        const [moved] = ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, moved);

        if (list.dataset.sortMode === 'reorder-source') {
          // Rebuild the source array (objects) using the new id order.
          const sec = getPage().sections.find(s => s.id === sid);
          if (!sec) return;
          const source = Array.isArray(sec.config[key]) ? sec.config[key] : [];
          const reordered = ids
            .map((id, idx) => source.find((it, i) => String(it.id ?? i) === String(id)))
            .filter(Boolean);
          updateConfigValue(sid, key, reordered);
        } else {
          updateConfigValue(sid, key, ids);
        }
        renderRightPanel();
      });
    });
  });

  // Image pack: add
  document.querySelectorAll('#rightPanelBody [data-image-add="1"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const images = Array.isArray(sec.config[key]) ? [...sec.config[key]] : [];
      // Find the field's maxCount from the section type's field def (fallback 4)
      const fieldDef = (TYPES[sec.type]?.fields || []).find(f => f.key === key);
      const max = (fieldDef && fieldDef.maxCount) || 4;
      if (images.length >= max) return;
      images.push(generatePlaceholderImage());
      updateConfigValue(sid, key, images);
      renderRightPanel();
      toast(`이미지 추가됨 (${images.length}/${max})`, 'success');
    });
  });

  // Image pack: delete
  document.querySelectorAll('#rightPanelBody [data-image-delete="1"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const idx = parseInt(btn.dataset.idx);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const images = [...(sec.config[key] || [])];
      images.splice(idx, 1);
      updateConfigValue(sid, key, images);
      // Reset carousel index for this section since images changed
      if (STATE.heroCarousel && STATE.heroCarousel[sid] !== undefined) {
        STATE.heroCarousel[sid] = 0;
      }
      renderRightPanel();
      toast('이미지 삭제됨', 'success');
    });
  });

  // Image pack: replace
  document.querySelectorAll('#rightPanelBody [data-image-replace="1"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const idx = parseInt(btn.dataset.idx);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const images = [...(sec.config[key] || [])];
      if (idx >= images.length) return;
      const prev = images[idx] || {};
      // Keep link metadata (url / target) when replacing the image only.
      const replacement = generatePlaceholderImage();
      images[idx] = { ...replacement, url: prev.url, target: prev.target };
      updateConfigValue(sid, key, images);
      renderRightPanel();
      toast('이미지 교체됨', 'success');
    });
  });

  // Image pack with links: per-image URL input
  document.querySelectorAll('#rightPanelBody [data-image-url="1"]').forEach(inp => {
    inp.addEventListener('input', () => {
      const sid = inp.dataset.sid;
      const key = inp.dataset.key;
      const idx = parseInt(inp.dataset.idx, 10);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const images = [...(sec.config[key] || [])];
      if (idx >= images.length) return;
      images[idx] = { ...images[idx], url: inp.value };
      updateConfigValue(sid, key, images);
    });
  });

  // Image pack with links: per-image target (new window) toggle
  document.querySelectorAll('#rightPanelBody [data-image-target="1"]').forEach(chk => {
    chk.addEventListener('change', () => {
      const sid = chk.dataset.sid;
      const key = chk.dataset.key;
      const idx = parseInt(chk.dataset.idx, 10);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const images = [...(sec.config[key] || [])];
      if (idx >= images.length) return;
      images[idx] = { ...images[idx], target: chk.checked ? '_blank' : '_self' };
      updateConfigValue(sid, key, images);
    });
  });

  // Asset pack: add
  document.querySelectorAll('#rightPanelBody [data-asset-add="1"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const assets = Array.isArray(sec.config[key]) ? [...sec.config[key]] : [];
      const fieldDef = (TYPES[sec.type]?.fields || []).find(f => f.key === key);
      const max = (fieldDef && fieldDef.maxCount) || 8;
      if (assets.length >= max) return;
      const img = generatePlaceholderImage();
      assets.push({ ...img, position: 'top-right' });
      updateConfigValue(sid, key, assets);
      renderRightPanel();
      toast(`에셋 추가됨 (${assets.length}/${max})`, 'success');
    });
  });

  // Asset pack: delete
  document.querySelectorAll('#rightPanelBody [data-asset-delete="1"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const idx = parseInt(btn.dataset.idx);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const assets = [...(sec.config[key] || [])];
      assets.splice(idx, 1);
      updateConfigValue(sid, key, assets);
      renderRightPanel();
      toast('에셋 삭제됨', 'success');
    });
  });

  // Asset pack: replace image
  document.querySelectorAll('#rightPanelBody [data-asset-replace="1"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const key = btn.dataset.key;
      const idx = parseInt(btn.dataset.idx);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const assets = [...(sec.config[key] || [])];
      if (idx >= assets.length) return;
      const img = generatePlaceholderImage();
      assets[idx] = { ...img, position: assets[idx].position || 'top-right' };
      updateConfigValue(sid, key, assets);
      renderRightPanel();
      toast('에셋 이미지 교체됨', 'success');
    });
  });

  // Asset pack: position change — 3x3 grid cell click
  document.querySelectorAll('#rightPanelBody [data-asset-pos-grid="1"] .asset-pos-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const grid = cell.closest('[data-asset-pos-grid="1"]');
      if (!grid) return;
      const sid = grid.dataset.sid;
      const key = grid.dataset.assetKey;
      const idx = parseInt(grid.dataset.idx);
      const pos = cell.dataset.pos;
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const assets = [...(sec.config[key] || [])];
      if (idx >= assets.length) return;
      assets[idx] = { ...assets[idx], position: pos };
      updateConfigValue(sid, key, assets);
      grid.querySelectorAll('.asset-pos-cell').forEach(c => c.classList.toggle('active', c === cell));
    });
  });

  // Asset pack: width slider (0 = natural size, >0 = pixel width)
  document.querySelectorAll('#rightPanelBody [data-asset-width="1"]').forEach(input => {
    input.addEventListener('input', () => {
      const sid = input.dataset.sid;
      const key = input.dataset.assetKey;
      const idx = parseInt(input.dataset.idx);
      const sec = getPage().sections.find(s => s.id === sid);
      if (!sec) return;
      const assets = [...(sec.config[key] || [])];
      if (idx >= assets.length) return;
      const w = parseInt(input.value, 10) || 0;
      assets[idx] = { ...assets[idx], width: w };
      updateConfigValue(sid, key, assets);
      const label = input.parentElement.querySelector('.asset-width-label');
      if (label) label.textContent = w > 0 ? w + 'px' : '원본';
    });
  });

  // icon picker — grid cell selection
  document.querySelectorAll('#rightPanelBody .iconpicker').forEach(picker => {
    picker.querySelectorAll('.iconpicker-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        picker.querySelectorAll('.iconpicker-cell').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
        updateConfig(picker.dataset.sid, picker.dataset.key, cell.dataset.iconValue);
      });
    });
  });

  // segmented buttons
  document.querySelectorAll('#rightPanelBody .segmented').forEach(seg => {
    seg.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        seg.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        let v = btn.dataset.v;
        if (!isNaN(v) && v !== '') v = parseInt(v);
        updateConfig(seg.dataset.sid, seg.dataset.key, v);
        if (seg.dataset.affectsForm === '1') renderRightPanel();
      });
    });
  });

  // color picker visual sync (paired color input + text input + swatch)
  document.querySelectorAll('#rightPanelBody .field-color-row').forEach(row => {
    const picker = row.querySelector('input[type="color"]');
    const text = row.querySelector('input[type="text"]');
    const swatch = row.querySelector('.color-swatch');
    if (picker) {
      picker.addEventListener('input', () => {
        if (text) text.value = picker.value;
        if (swatch) swatch.style.background = picker.value;
      });
    }
    if (text) {
      text.addEventListener('input', () => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(text.value)) return;
        if (picker) picker.value = text.value;
        if (swatch) swatch.style.background = text.value;
      });
    }
  });

  // override pills
  document.querySelectorAll('#rightPanelBody .override-pill').forEach(p => {
    p.addEventListener('click', () => toggleOverride(p.dataset.sid, p.dataset.key));
  });

  // form group collapse
  document.querySelectorAll('#rightPanelBody .form-group-header').forEach(h => {
    h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
  });
}

// --- bindCatalog ---

function bindCatalog() {
  document.querySelectorAll('#rightPanelBody [data-add]').forEach(it => {
    it.addEventListener('click', () => addSection(it.dataset.add));
  });
  const search = document.getElementById('catalogSearchInput');
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      document.querySelectorAll('.catalog-item').forEach(it => {
        const text = it.textContent.toLowerCase();
        it.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }
}

// --- bindSiteSettings ---

function bindSiteSettings() {
  // Back button: return to page-builder view
  const back = document.getElementById('siteSettingsBack');
  if (back) {
    back.addEventListener('click', () => {
      STATE.view = 'page-builder';
      document.getElementById('siteSettingsEntry')?.classList.remove('active');
      renderTopBar();      // refresh preview URL with the (possibly changed) domain
      renderPageList();
      renderSectionTree();
      renderPreview();
      renderRightPanel();
    });
  }

  // Save button — persists current STATE.site/theme (in-memory builder; real backend wiring TBD)
  const save = document.getElementById('siteSettingsSave');
  if (save) {
    save.addEventListener('click', () => {
      toast('사이트 설정이 저장되었습니다', 'success');
    });
  }


  // site basic text/select inputs
  document.querySelectorAll('#siteSettingsView [data-site-key]').forEach(el => {
    el.addEventListener('input', () => {
      STATE.site[el.dataset.siteKey] = el.value;
    });
    el.addEventListener('change', () => {
      STATE.site[el.dataset.siteKey] = el.value;
    });
  });

  // Per-language ON/OFF toggle. Turning a language off re-picks the default if needed.
  document.querySelectorAll('#siteSettingsView [data-site-lang-toggle]').forEach(cb => {
    cb.addEventListener('change', () => {
      const v = cb.dataset.siteLangToggle;
      const set = new Set(STATE.site.supportedLanguages || []);
      if (cb.checked) set.add(v);
      else set.delete(v);
      STATE.site.supportedLanguages = CC_LANGUAGE_OPTIONS
        .map(o => o.value).filter(code => set.has(code));   // keep canonical order
      if (!STATE.site.supportedLanguages.includes(STATE.site.defaultLanguage)) {
        STATE.site.defaultLanguage = STATE.site.supportedLanguages[0] || '';
      }
      renderTopBar();   // 우측 상단 언어 탭 동기화
      renderPreview();  // 사이트 설정 패널 자체도 재렌더 → 사용중 카운트·기본언어 드롭다운 갱신
    });
  });

  // 기본언어 dropdown — picking an OFF language auto-enables it (turned ON + 기본 badge).
  const defLangSel = document.querySelector('#siteSettingsView [data-site-default-lang]');
  if (defLangSel) {
    defLangSel.addEventListener('change', () => {
      const v = defLangSel.value;
      STATE.site.defaultLanguage = v;
      const set = new Set(STATE.site.supportedLanguages || []);
      if (!set.has(v)) {
        set.add(v);
        STATE.site.supportedLanguages = CC_LANGUAGE_OPTIONS
          .map(o => o.value).filter(code => set.has(code));   // keep canonical order
      }
      renderTopBar();
      renderPreview();
    });
  }

  // site segmented controls (payment.pgType, etc.)
  document.querySelectorAll('#siteSettingsView [data-site-segmented]').forEach(seg => {
    seg.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = seg.dataset.siteSegmented;
        const v = btn.dataset.v;
        if (key === 'pgType') STATE.site.payment.pgType = v;
        else STATE.site[key] = v;
        renderPreview();
      });
    });
  });

  // site toggles (memberBooking, guestBooking) with cascade
  document.querySelectorAll('#siteSettingsView [data-site-toggle]').forEach(cb => {
    cb.addEventListener('change', () => {
      const key = cb.dataset.siteToggle;
      STATE.site[key] = cb.checked;
      // Cascade: turning off memberBooking auto-enables guestBooking (must allow some path to book).
      if (key === 'memberBooking' && !cb.checked) STATE.site.guestBooking = true;
      renderPreview();
    });
  });

  // social login toggles
  document.querySelectorAll('#siteSettingsView [data-social-toggle]').forEach(cb => {
    cb.addEventListener('change', () => {
      const k = cb.dataset.socialToggle;
      STATE.site.socialLogins[k].enabled = cb.checked;
      renderPreview();
    });
  });

  // guest-field chips (collected guest info: name / email / phone)
  document.querySelectorAll('#siteSettingsView [data-guest-field]').forEach(chip => {
    chip.addEventListener('click', () => {
      const v = chip.dataset.guestField;
      const set = new Set(STATE.site.guestFields || []);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      STATE.site.guestFields = Array.from(set);
      renderPreview();
    });
  });

  // Terms (약관): add / remove / type-switch / field input
  const tAdd = document.querySelector('#siteSettingsView [data-terms-add]');
  if (tAdd) {
    tAdd.addEventListener('click', () => {
      STATE.site.terms = STATE.site.terms || [];
      STATE.site.terms.push({ name: '', type: 'url', required: false, value: '' });
      renderPreview();
      renderRightPanel();
    });
  }
  document.querySelectorAll('#siteSettingsView [data-terms-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.termsRemove, 10);
      STATE.site.terms.splice(idx, 1);
      renderPreview();
      renderRightPanel();
    });
  });
  document.querySelectorAll('#siteSettingsView [data-terms-type] .segmented-btn').forEach(b => {
    b.addEventListener('click', () => {
      const idx = parseInt(b.closest('[data-terms-type]').dataset.termsType, 10);
      STATE.site.terms[idx].type = b.dataset.v;
      renderPreview();
      renderRightPanel();
    });
  });
  // 필수/선택 토글
  document.querySelectorAll('#siteSettingsView [data-terms-required] .segmented-btn').forEach(b => {
    b.addEventListener('click', () => {
      const idx = parseInt(b.closest('[data-terms-required]').dataset.termsRequired, 10);
      STATE.site.terms[idx].required = (b.dataset.v === 'required');
      renderPreview();
      renderRightPanel();
    });
  });
  document.querySelectorAll('#siteSettingsView [data-terms-field]').forEach(el => {
    el.addEventListener('input', () => {
      const [idx, field] = el.dataset.termsField.split('.');
      STATE.site.terms[parseInt(idx, 10)][field] = el.value;
    });
  });
  // Rich-text editor for 직접입력 terms: toolbar commands + contenteditable sync
  document.querySelectorAll('#siteSettingsView .terms-editor-btn').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault()); // keep editor selection
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.termsCmd;
      const body = btn.closest('.terms-editor').querySelector('.terms-editor-body');
      body.focus();
      if (cmd === 'createLink') {
        const url = prompt('링크 URL을 입력하세요', 'https://');
        if (url) document.execCommand('createLink', false, url);
      } else if (cmd.startsWith('formatBlock:')) {
        document.execCommand('formatBlock', false, cmd.split(':')[1]);
      } else {
        document.execCommand(cmd, false, null);
      }
      const idx = parseInt(body.dataset.termsEditor, 10);
      STATE.site.terms[idx].value = body.innerHTML;
    });
  });
  document.querySelectorAll('#siteSettingsView [data-terms-editor]').forEach(ed => {
    ed.addEventListener('input', () => {
      const idx = parseInt(ed.dataset.termsEditor, 10);
      STATE.site.terms[idx].value = ed.innerHTML;
    });
  });

  // PG provider select (credit card processor) — re-render to swap dynamic credential fields
  const pgSel = document.querySelector('#siteSettingsView [data-site-pg-provider="1"]');
  if (pgSel) {
    pgSel.addEventListener('change', () => {
      STATE.site.payment.pgProvider = pgSel.value;
      renderPreview();
    });
  }

  // PG credential inputs (nested under payment.pgCredentials[provider][field])
  document.querySelectorAll('#siteSettingsView [data-pg-cred]').forEach(el => {
    el.addEventListener('input', () => {
      const [provider, field] = el.dataset.pgCred.split('.');
      STATE.site.payment.pgCredentials[provider] = STATE.site.payment.pgCredentials[provider] || {};
      STATE.site.payment.pgCredentials[provider][field] = el.value;
    });
  });

  // Account-transfer PG provider select — re-render to swap dynamic credential fields
  const acctSel = document.querySelector('#siteSettingsView [data-site-acct-provider="1"]');
  if (acctSel) {
    acctSel.addEventListener('change', () => {
      STATE.site.payment.accountProvider = acctSel.value;
      renderPreview();
    });
  }

  // Account-transfer credential inputs (nested under payment.accountCredentials[provider][field])
  document.querySelectorAll('#siteSettingsView [data-acct-cred]').forEach(el => {
    el.addEventListener('input', () => {
      const [provider, field] = el.dataset.acctCred.split('.');
      STATE.site.payment.accountCredentials[provider] = STATE.site.payment.accountCredentials[provider] || {};
      STATE.site.payment.accountCredentials[provider][field] = el.value;
    });
  });

  // Payment method toggles (creditCard, paypal, eximbay, account)
  document.querySelectorAll('#siteSettingsView [data-payment-toggle]').forEach(cb => {
    cb.addEventListener('change', () => {
      const k = cb.dataset.paymentToggle;
      STATE.site.payment.methods[k].enabled = cb.checked;
      renderPreview();
    });
  });

  // Payment method credential inputs (nested under methods[key].credentials[field])
  document.querySelectorAll('#siteSettingsView [data-payment-cred]').forEach(el => {
    el.addEventListener('input', () => {
      const [method, field] = el.dataset.paymentCred.split('.');
      const m = STATE.site.payment.methods[method];
      m.credentials = m.credentials || {};
      m.credentials[field] = el.value;
    });
  });

  // Simple-pay provider toggles
  document.querySelectorAll('#siteSettingsView [data-simplepay-toggle]').forEach(cb => {
    cb.addEventListener('change', () => {
      const provider = cb.dataset.simplepayToggle;
      STATE.site.payment.simplePay[provider].enabled = cb.checked;
      renderPreview();
    });
  });

  // Simple-pay credential inputs (provider-specific keys)
  document.querySelectorAll('#siteSettingsView [data-simplepay-input]').forEach(el => {
    el.addEventListener('input', () => {
      const [provider, field] = el.dataset.simplepayInput.split('.');
      STATE.site.payment.simplePay[provider][field] = el.value;
    });
  });

  // favicon replace / reset
  // 파일 업로드 → FileReader로 data URL 변환 후 콜백 호출
  // accept: 'image/*' (favicon은 ICO/PNG/SVG, OG는 PNG/JPG 권장 — 모두 image/*에 포함)
  const pickImageFile = (onPicked) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return;
      if (!file.type.startsWith('image/')) { toast('이미지 파일만 업로드 가능합니다', 'error'); return; }
      const reader = new FileReader();
      reader.onload = () => onPicked({ name: file.name, dataUrl: reader.result });
      reader.readAsDataURL(file);
    });
    document.body.appendChild(input);
    input.click();
  };

  const favReplace = document.querySelector('#siteSettingsView [data-site-favicon-replace]');
  if (favReplace) {
    favReplace.addEventListener('click', () => {
      pickImageFile(({ name, dataUrl }) => {
        STATE.site.favicon = {
          id: 'fav_' + Math.random().toString(36).slice(2, 8),
          name,
          bg: `url('${dataUrl}')`
        };
        renderPreview();
        renderRightPanel();
        toast(`파비콘 교체됨 — ${name}`, 'success');
      });
    });
  }
  const favReset = document.querySelector('#siteSettingsView [data-site-favicon-reset]');
  if (favReset) {
    favReset.addEventListener('click', () => {
      STATE.site.favicon = {
        id: 'fav_default',
        name: 'favicon.png',
        bg: "url('https://cdn.rideus.net/uploads/0003/3016/2023/07/07/favicon.png')"
      };
      renderPreview();
      renderRightPanel();
      toast('기본 파비콘으로 복원됨', 'success');
    });
  }

  // OG image add / replace / remove (add와 replace 모두 파일 업로드)
  const ogAdd = document.querySelector('#siteSettingsView [data-site-og-add]');
  if (ogAdd) {
    ogAdd.addEventListener('click', () => {
      pickImageFile(({ name, dataUrl }) => {
        STATE.site.ogImage = {
          id: 'img_' + Math.random().toString(36).slice(2, 8),
          name,
          bg: `url('${dataUrl}')`
        };
        renderPreview();
        renderRightPanel();
        toast(`OG 이미지 추가됨 — ${name}`, 'success');
      });
    });
  }
  const ogReplace = document.querySelector('#siteSettingsView [data-site-og-replace]');
  if (ogReplace) {
    ogReplace.addEventListener('click', () => {
      pickImageFile(({ name, dataUrl }) => {
        STATE.site.ogImage = {
          id: 'img_' + Math.random().toString(36).slice(2, 8),
          name,
          bg: `url('${dataUrl}')`
        };
        renderPreview();
        renderRightPanel();
        toast(`OG 이미지 교체됨 — ${name}`, 'success');
      });
    });
  }
  const ogRemove = document.querySelector('#siteSettingsView [data-site-og-remove]');
  if (ogRemove) {
    ogRemove.addEventListener('click', () => {
      STATE.site.ogImage = null;
      renderPreview();
      renderRightPanel();
      toast('OG 이미지 삭제됨', 'success');
    });
  }

  // form group collapse
  document.querySelectorAll('#siteSettingsView .form-group-header').forEach(h => {
    h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
  });
}
