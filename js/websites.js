/* websites.js — websites.html 전용 진입점 */

let WEBSITES = loadWebsites();

/* 검색·필터 상태 */
const FILTER = {
  query: '',
  status: 'all'   // 'all' | 'live' | 'draft'
};

/* 선택된 행 ID 집합 */
const SELECTED = new Set();

function getFilteredWebsites() {
  const q = FILTER.query.trim().toLowerCase();
  return WEBSITES.filter(w => {
    if (FILTER.status !== 'all' && w.status !== FILTER.status) return false;
    if (!q) return true;
    return [w.name, w.domain, w.operator, w.vendor]
      .some(v => (v || '').toLowerCase().includes(q));
  });
}

function toast(msg, type) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (type || 'success');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 200); }, 3000);
}

/* ============================================================
   RENDER
   ============================================================ */
function renderWebsiteList() {
  const rows = document.getElementById('wlRows');
  if (!rows) return;
  const fmtDateTime = (s) => {
    if (!s) return '—';
    const [date, time] = s.split(' ');
    const [y, m, d] = (date || '').split('-');
    return `${y}.${m}.${d}${time ? ' ' + time : ''}`;
  };
  const langLabel = (code) => (LANG_LABELS && LANG_LABELS[code]) || code || '—';
  const pgLabel = (v) => v === 'self' ? '자체 PG' : '통합 PG';

  const filtered = getFilteredWebsites();
  document.getElementById('wlResultCount').textContent = `${filtered.length}건`;

  // 선택 집합 정리 — 필터 결과에 없는 ID 제거
  const filteredIds = new Set(filtered.map(w => w.id));
  Array.from(SELECTED).forEach(id => { if (!filteredIds.has(id)) SELECTED.delete(id); });

  if (WEBSITES.length === 0) {
    rows.innerHTML = `<tr><td colspan="13"><div class="wl-empty">아직 생성된 웹사이트가 없습니다. [+ 신규 생성] 버튼을 눌러 시작하세요.</div></td></tr>`;
    syncSelectionUI(filtered);
    return;
  }
  if (filtered.length === 0) {
    rows.innerHTML = `<tr><td colspan="13"><div class="wl-empty">검색 조건에 맞는 웹사이트가 없습니다.</div></td></tr>`;
    syncSelectionUI(filtered);
    return;
  }
  rows.innerHTML = filtered.map(w => `
    <tr data-website-id="${escapeHtml(w.id)}" class="${SELECTED.has(w.id) ? 'selected' : ''}">
      <td class="wl-col-check"><input type="checkbox" data-wl-row-check="${escapeHtml(w.id)}" ${SELECTED.has(w.id) ? 'checked' : ''} aria-label="${escapeHtml(w.name)} 선택"></td>
      <td><span class="wl-name">${escapeHtml(w.name)}</span></td>
      <td><span class="wl-url">${escapeHtml(w.domain)}.rideus.net</span></td>
      <td>${escapeHtml(langLabel(w.defaultLang))}</td>
      <td>${escapeHtml(w.operator || '—')}</td>
      <td>${escapeHtml(w.vendor || '—')}</td>
      <td><span class="wl-yn ${w.memberBooking ? 'y' : 'n'}">${w.memberBooking ? 'Y' : 'N'}</span></td>
      <td><span class="wl-yn ${w.guestBooking ? 'y' : 'n'}">${w.guestBooking ? 'Y' : 'N'}</span></td>
      <td>${escapeHtml(pgLabel(w.pg))}</td>
      <td><span class="wl-date">${fmtDateTime(w.createdAt)}</span></td>
      <td><span class="wl-date">${fmtDateTime(w.updatedAt)}</span></td>
      <td><span class="wl-status ${w.status === 'live' ? 'live' : 'draft'}">${w.status === 'live' ? 'LIVE' : 'DRAFT'}</span></td>
      <td class="wl-action-cell">
        <button type="button" class="wl-action-btn" data-wl-duplicate="${escapeHtml(w.id)}" title="복제" aria-label="복제">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  // 행 클릭 → 빌더 페이지로 이동 (체크박스 셀·액션 셀 제외)
  rows.querySelectorAll('[data-website-id]').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.wl-col-check') || e.target.closest('.wl-action-cell')) return;
      const id = row.dataset.websiteId;
      location.href = `tms2-builder.html?site=${encodeURIComponent(id)}`;
    });
  });
  // 행 체크박스
  rows.querySelectorAll('[data-wl-row-check]').forEach(cb => {
    cb.addEventListener('change', e => {
      e.stopPropagation();
      const id = cb.dataset.wlRowCheck;
      if (cb.checked) SELECTED.add(id); else SELECTED.delete(id);
      cb.closest('tr').classList.toggle('selected', cb.checked);
      syncSelectionUI(filtered);
    });
    cb.addEventListener('click', e => e.stopPropagation());
  });
  // 복제 버튼
  rows.querySelectorAll('[data-wl-duplicate]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); duplicateWebsite(btn.dataset.wlDuplicate); });
  });

  syncSelectionUI(filtered);
}

/* 선택 UI 동기화 — 전체선택 체크박스 상태 + bulk-delete 버튼 활성/카운트 */
function syncSelectionUI(filtered) {
  const all = document.getElementById('wlSelectAll');
  const bulkBtn = document.getElementById('wlBulkDeleteBtn');
  const bulkCount = document.getElementById('wlBulkDeleteCount');
  const visibleIds = (filtered || getFilteredWebsites()).map(w => w.id);
  const allChecked = visibleIds.length > 0 && visibleIds.every(id => SELECTED.has(id));
  const someChecked = visibleIds.some(id => SELECTED.has(id));
  if (all) {
    all.checked = allChecked;
    all.indeterminate = !allChecked && someChecked;
  }
  if (bulkBtn) {
    bulkBtn.disabled = SELECTED.size === 0;
    bulkCount.textContent = SELECTED.size;
  }
}

/* 일괄 삭제 */
function bulkDeleteSelected() {
  if (SELECTED.size === 0) return;
  if (!window.confirm(`선택한 ${SELECTED.size}개 웹사이트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
  WEBSITES = WEBSITES.filter(w => !SELECTED.has(w.id));
  const n = SELECTED.size;
  SELECTED.clear();
  saveWebsites(WEBSITES);
  renderWebsiteList();
  toast(`${n}개 웹사이트를 삭제했습니다`, 'success');
}

/* ============================================================
   ACTIONS
   ============================================================ */
function duplicateWebsite(id) {
  const src = WEBSITES.find(w => w.id === id);
  if (!src) return;
  const newId = 'site_' + Math.random().toString(36).slice(2, 8);
  let newDomain = src.domain + '-copy';
  let n = 2;
  while (WEBSITES.some(w => w.domain === newDomain)) newDomain = src.domain + '-copy' + n++;
  let newName = src.name + ' (복제본)';
  let m = 2;
  while (WEBSITES.some(w => w.name === newName)) newName = src.name + ' (복제본 ' + m++ + ')';
  const stamp = nowStamp();
  WEBSITES.unshift({
    ...src,
    id: newId, name: newName, domain: newDomain,
    status: 'draft', createdAt: stamp, updatedAt: stamp
  });
  saveWebsites(WEBSITES);
  renderWebsiteList();
  toast(`'${src.name}'을(를) 목록 맨 위로 복제했습니다`, 'success');
}

function deleteWebsite(id) {
  const w = WEBSITES.find(x => x.id === id);
  if (!w) return;
  if (!window.confirm(`'${w.name}' 웹사이트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
  WEBSITES = WEBSITES.filter(x => x.id !== id);
  saveWebsites(WEBSITES);
  renderWebsiteList();
  toast(`'${w.name}'을(를) 삭제했습니다`, 'success');
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ============================================================
   NEW SITE MODAL
   ============================================================ */
function openNewSiteModal() {
  document.getElementById('newSiteName').value = '';
  document.getElementById('newSiteDomain').value = '';
  document.getElementById('newSiteLang').value = 'ko';
  document.getElementById('newSiteOperator').value = '그라운드케이';
  document.getElementById('newSiteVendor').value = '대명관광';
  document.getElementById('newSiteModal').classList.add('show');
  setTimeout(() => document.getElementById('newSiteName').focus(), 0);
}
function closeNewSiteModal() {
  document.getElementById('newSiteModal').classList.remove('show');
}
function submitNewSite() {
  const nameInput = document.getElementById('newSiteName');
  const domainInput = document.getElementById('newSiteDomain');
  const langSel = document.getElementById('newSiteLang');
  const operatorSel = document.getElementById('newSiteOperator');
  const vendorSel = document.getElementById('newSiteVendor');
  const name = (nameInput.value || '').trim();
  const domain = (domainInput.value || '').trim().toLowerCase();
  const lang = langSel.value;
  const operator = operatorSel.value;
  const vendor = vendorSel.value;
  if (!name) { toast('웹사이트 이름을 입력해 주세요', 'error'); nameInput.focus(); return; }
  if (!domain) { toast('도메인을 입력해 주세요', 'error'); domainInput.focus(); return; }
  if (!/^[a-z0-9-]+$/.test(domain)) { toast('도메인은 영문 소문자·숫자·하이픈만 사용할 수 있습니다', 'error'); domainInput.focus(); return; }
  if (WEBSITES.some(w => w.domain === domain)) { toast('이미 사용 중인 도메인입니다', 'warn'); domainInput.focus(); return; }
  if (WEBSITES.some(w => w.name === name)) { toast('이미 존재하는 웹사이트 이름입니다', 'warn'); nameInput.focus(); return; }

  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)'
  ];
  const id = 'site_' + Math.random().toString(36).slice(2, 8);
  const stamp = nowStamp();
  WEBSITES.unshift({
    id, name, domain, defaultLang: lang,
    operator, vendor,
    memberBooking: true, guestBooking: true,
    pg: 'integrated', status: 'draft',
    createdAt: stamp, updatedAt: stamp,
    thumbBg: gradients[Math.floor(Math.random() * gradients.length)]
  });
  saveWebsites(WEBSITES);
  closeNewSiteModal();
  toast(`'${name}' 웹사이트가 생성되었습니다 — 빌더로 이동합니다`, 'success');
  setTimeout(() => { location.href = `tms2-builder.html?site=${encodeURIComponent(id)}`; }, 500);
}

/* ============================================================
   EVENTS
   ============================================================ */
document.getElementById('wlNewBtn').addEventListener('click', openNewSiteModal);
document.getElementById('wlBulkDeleteBtn').addEventListener('click', bulkDeleteSelected);

/* 전체 선택 체크박스 */
document.getElementById('wlSelectAll').addEventListener('change', e => {
  const filtered = getFilteredWebsites();
  if (e.target.checked) filtered.forEach(w => SELECTED.add(w.id));
  else filtered.forEach(w => SELECTED.delete(w.id));
  renderWebsiteList();
});

/* 검색 + 필터 칩 */
const searchInput = document.getElementById('wlSearchInput');
const searchClear = document.getElementById('wlSearchClear');
searchInput.addEventListener('input', e => {
  FILTER.query = e.target.value || '';
  searchClear.hidden = !FILTER.query;
  renderWebsiteList();
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  FILTER.query = '';
  searchClear.hidden = true;
  searchInput.focus();
  renderWebsiteList();
});
document.querySelectorAll('[data-status-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('[data-status-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    FILTER.status = chip.dataset.statusFilter;
    renderWebsiteList();
  });
});

document.getElementById('newSiteCancel').addEventListener('click', closeNewSiteModal);
document.getElementById('newSiteSubmit').addEventListener('click', submitNewSite);
document.getElementById('newSiteModal').addEventListener('click', e => {
  if (e.target.id === 'newSiteModal') closeNewSiteModal();
});
['newSiteName', 'newSiteDomain'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitNewSite(); }
  });
});
document.getElementById('newSiteDomain').addEventListener('input', e => {
  const cleaned = (e.target.value || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (cleaned !== e.target.value) {
    e.target.value = cleaned;
    e.target.setSelectionRange(cleaned.length, cleaned.length);
  }
});

// ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('newSiteModal').classList.contains('show')) {
    closeNewSiteModal();
  }
  if (e.key === 'Escape' && !document.getElementById('wlProfileMenu').hidden) {
    closeProfileMenu();
  }
});

/* 프로필 팝업 — 우측 헤더 클릭 시 토글 */
function openProfileMenu() {
  document.getElementById('wlProfileMenu').hidden = false;
  document.getElementById('wlProfileBtn').setAttribute('aria-expanded', 'true');
}
function closeProfileMenu() {
  document.getElementById('wlProfileMenu').hidden = true;
  document.getElementById('wlProfileBtn').setAttribute('aria-expanded', 'false');
}
document.getElementById('wlProfileBtn').addEventListener('click', e => {
  e.stopPropagation();
  const menu = document.getElementById('wlProfileMenu');
  if (menu.hidden) openProfileMenu(); else closeProfileMenu();
});
document.addEventListener('click', e => {
  const menu = document.getElementById('wlProfileMenu');
  if (menu.hidden) return;
  if (e.target.closest('#wlProfileBtn') || e.target.closest('#wlProfileMenu')) return;
  closeProfileMenu();
});
document.getElementById('wlLogoutBtn').addEventListener('click', () => {
  closeProfileMenu();
  toast('로그아웃되었습니다', 'success');
  setTimeout(() => { location.href = 'login.html'; }, 400);
});

/* INIT */
renderWebsiteList();
