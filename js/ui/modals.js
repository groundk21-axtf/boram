/* modals.js — open/close/submit handlers for: section picker, add-page, card edit, new-site, terms popup, publish */

let _pageEditKey = null;
let _cardEditCtx = null; // { sid, key, idx, draft }

// --- openSectionPicker ---
function openSectionPicker(idx) {
  pendingInsertIdx = idx;
  const groups = {};
  Object.entries(TYPES).forEach(([k, t]) => {
    if (t.category === 'system') return;
    groups[t.category] = groups[t.category] || [];
    groups[t.category].push({ key: k, ...t });
  });
  let html = '';
  const entries = Object.entries(groups);
  if (entries.length === 0) {
    html = '<div class="section-picker-empty">사용 가능한 섹션이 없습니다.</div>';
  } else {
    html = '<div class="catalog-list">';
    entries.forEach(([cat, list]) => {
      html += `<div class="catalog-group-label">${CATEGORY_LABEL[cat] || cat}</div>`;
      list.forEach(it => {
        html += `<div class="catalog-item" data-pick="${it.key}">
          <div class="catalog-item-thumb">${it.icon}</div>
          <div class="catalog-item-info">
            <div class="catalog-item-name">${it.name}</div>
            <div class="catalog-item-desc">${TYPE_DESC[it.key] || ''}</div>
          </div>
        </div>`;
      });
    });
    html += '</div>';
  }
  const listEl = document.getElementById('sectionPickerList');
  listEl.innerHTML = html;
  listEl.querySelectorAll('.catalog-item').forEach(it => {
    it.addEventListener('click', () => {
      const type = it.dataset.pick;
      const at = pendingInsertIdx;
      closeSectionPicker();
      insertSectionAt(type, at);
    });
  });
  document.getElementById('sectionPickerModal').classList.add('show');
}

// --- closeSectionPicker ---
function closeSectionPicker() {
  document.getElementById('sectionPickerModal').classList.remove('show');
  pendingInsertIdx = null;
}

// --- openAddPageModal ---
function openAddPageModal(renameKey) {
  _pageEditKey = renameKey || null;
  const isRename = !!renameKey;
  document.getElementById('addPageTitle').textContent = isRename ? '페이지 이름 변경' : '페이지 추가';
  document.getElementById('addPageSub').textContent = isRename
    ? '페이지의 표시 이름과 URL을 변경합니다.'
    : '사이트에 새 페이지를 추가합니다. 추가 후 우측 패널에서 섹션을 구성하세요.';
  document.getElementById('addPageSubmit').textContent = isRename ? '변경' : '추가';
  const nameInput = document.getElementById('addPageName');
  const pathInput = document.getElementById('addPagePath');
  nameInput.value = isRename ? (STATE.pageMeta[renameKey]?.name || '') : '';
  pathInput.value = isRename ? ((STATE.pageMeta[renameKey]?.path || '').replace(/^\//, '')) : '';
  document.getElementById('addPageModal').classList.add('show');
  setTimeout(() => { nameInput.focus(); nameInput.select(); }, 0);
}

// --- closeAddPageModal ---
function closeAddPageModal() {
  document.getElementById('addPageModal').classList.remove('show');
  _pageEditKey = null;
}

// --- submitAddPage ---
function submitAddPage() {
  const nameInput = document.getElementById('addPageName');
  const pathInput = document.getElementById('addPagePath');
  const name = (nameInput.value || '').trim();
  if (!name) { toast('페이지 이름을 입력해 주세요', 'error'); nameInput.focus(); return; }
  // 중복 이름 확인 — 자기 자신 제외 (rename 시)
  const normalized = (s) => s.replace(/\s+/g, '');
  const dupName = Object.entries(STATE.pageMeta)
    .some(([k, m]) => k !== _pageEditKey && normalized(m.name) === normalized(name));
  if (dupName) { toast('이미 존재하는 페이지 이름입니다', 'warn'); return; }

  // URL 경로 — 비어있으면 이름에서 자동 생성, 있으면 정제
  let slug = sanitizePagePath(pathInput.value || '');
  if (!slug) {
    slug = sanitizePagePath(name) || 'page-' + Math.random().toString(36).slice(2, 6);
  }
  // 경로 중복 검사 — 자기 자신 제외, 충돌 시 차단
  const fullPath = '/' + slug;
  const dupPath = Object.entries(STATE.pageMeta)
    .some(([k, m]) => k !== _pageEditKey && m.path === fullPath);
  if (dupPath) {
    toast(`이미 사용 중인 URL 경로입니다: /${slug}`, 'error');
    pathInput.focus();
    return;
  }

  if (_pageEditKey) {
    // 이름/경로 변경
    const key = _pageEditKey;
    STATE.pageMeta[key].name = name;
    STATE.pageMeta[key].path = '/' + slug;
    closeAddPageModal();
    toast(`'${name}' (/${slug})로 변경되었습니다`, 'success');
    renderTopBar();
    renderPageList();
    renderSectionTree();
    renderPreview();
    return;
  }
  // 신규 추가
  const key = 'custom-' + Math.random().toString(36).slice(2, 8);
  STATE.pageMeta[key] = { name, icon: 'doc', locked: false, ready: true, enabled: true, custom: true, path: '/' + slug };
  STATE.pages[key] = { sections: [] };
  closeAddPageModal();
  toast(`'${name}' 페이지가 추가되었습니다 (/${slug})`, 'success');
  switchPage(key);
}

// --- openCardEditModal ---
function openCardEditModal(sid, key, idx) {
  const sec = getPage().sections.find(s => s.id === sid);
  if (!sec) return;
  const list = Array.isArray(sec.config[key]) ? sec.config[key] : [];
  const card = list[idx];
  if (!card) return;
  _cardEditCtx = { sid, key, idx, draft: JSON.parse(JSON.stringify(card)) };
  document.getElementById('cardEditTitle').value = card.title || '';
  document.getElementById('cardEditBody').value = card.body || '';
  // URL 형태로 저장된 이미지는 url에 표시. data:URL(파일 업로드)은 빈칸으로 두고 preview만 활용.
  const bg = (card.image && card.image.bg) || '';
  const urlMatch = bg.match(/^url\(['"]?([^'")]+)['"]?\)$/);
  const isFileData = urlMatch && urlMatch[1].startsWith('data:');
  document.getElementById('cardEditImageUrl').value = urlMatch && !isFileData ? urlMatch[1] : '';
  document.getElementById('cardEditImageFile').value = ''; // file input 초기화
  updateCardEditPreview();
  document.getElementById('cardEditModal').classList.add('show');
  setTimeout(() => document.getElementById('cardEditTitle').focus(), 0);
}

// --- updateCardEditPreview ---
function updateCardEditPreview() {
  if (!_cardEditCtx) return;
  const preview = document.getElementById('cardEditPreview');
  const img = _cardEditCtx.draft.image;
  if (img && img.bg) {
    preview.style.backgroundImage = img.bg;
    preview.classList.remove('empty');
  } else {
    preview.style.backgroundImage = '';
    preview.classList.add('empty');
  }
}

// --- closeCardEditModal ---
function closeCardEditModal() {
  document.getElementById('cardEditModal').classList.remove('show');
  _cardEditCtx = null;
}

// --- submitCardEdit ---
function submitCardEdit() {
  if (!_cardEditCtx) return;
  const { sid, key, idx, draft } = _cardEditCtx;
  draft.title = document.getElementById('cardEditTitle').value.trim();
  draft.body = document.getElementById('cardEditBody').value.trim();
  const urlVal = document.getElementById('cardEditImageUrl').value.trim();
  if (urlVal) draft.image = { bg: `url('${urlVal}')` };
  const sec = getPage().sections.find(s => s.id === sid);
  if (!sec) { closeCardEditModal(); return; }
  const list = Array.isArray(sec.config[key]) ? [...sec.config[key]] : [];
  list[idx] = draft;
  updateConfigValue(sid, key, list);
  closeCardEditModal();
  renderRightPanel();
}

// --- openTermsPopup ---
function openTermsPopup(title, htmlContent) {
  document.getElementById('termsPopup')?.remove();
  const wrap = document.createElement('div');
  wrap.id = 'termsPopup';
  wrap.className = 'terms-popup-backdrop';
  wrap.innerHTML = `<div class="terms-popup">
    <div class="terms-popup-head">
      <span class="terms-popup-title">${escapeHtml(title)}</span>
      <button type="button" class="terms-popup-close" aria-label="닫기">✕</button>
    </div>
    <div class="terms-popup-body">${htmlContent}</div>
  </div>`;
  const close = () => wrap.remove();
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  wrap.querySelector('.terms-popup-close').addEventListener('click', close);
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
  document.body.appendChild(wrap);
}

// --- showPublishModal ---
function showPublishModal() {
  document.getElementById('publishModal').classList.add('show');
}

