/* main.js — toast, website actions, preview window, all event bindings, init */

// --- toast ---
function toast(msg, type) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  const icon = type === 'success' ? ICN.check : type === 'error' ? ICN.warn : type === 'warn' ? ICN.warn : ICN.info;
  t.innerHTML = (type === 'success' ? ICN.check : ICN.info) + '<span>' + msg + '</span>';
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 200);
  }, 3000);
}

// --- closeLangMenus ---
function closeLangMenus() {
  document.querySelectorAll('.ps-lang-selector.open').forEach(s => s.classList.remove('open'));
}

// --- closeUserMenus ---
function closeUserMenus() {
  document.querySelectorAll('.ps-user-menu.open').forEach(s => s.classList.remove('open'));
}

// --- previewDeviceTier ---
function previewDeviceTier() {
  const w = window.innerWidth || 1280;
  return w >= 1024 ? 'desktop' : w >= 640 ? 'tablet' : 'mobile';
}

// --- enterPreviewMode ---
function enterPreviewMode(snapshot) {
  PREVIEW_MODE = true;
  Object.keys(snapshot).forEach(k => { STATE[k] = snapshot[k]; });
  STATE.view = 'page-builder';
  STATE.selectedSectionId = null;
  STATE.currentDevice = previewDeviceTier();
  document.body.classList.add('preview-mode');
  document.title = (STATE.site && STATE.site.title ? STATE.site.title : 'TMS 2.0') + ' — 미리보기';
  // Re-render only when the device tier actually changes (throttled via timer).
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const tier = previewDeviceTier();
      if (tier !== STATE.currentDevice) { STATE.currentDevice = tier; renderPreview(); }
    }, 120);
  });
  renderPreview();
}

// --- openPreviewWindow ---
function openPreviewWindow() {
  const win = window.open('', 'tms2_preview',
    'width=' + screen.availWidth + ',height=' + screen.availHeight + ',left=0,top=0');
  if (!win) {
    toast('팝업이 차단되었습니다 — 브라우저에서 팝업 허용 후 다시 시도하세요', 'warn');
    return;
  }
  // Serialize the live builder state; escape '<' so it can't break out of <script>.
  const snapshot = JSON.stringify(STATE).replace(/</g, '\\u003c');
  let doc = '<!DOCTYPE html>' + document.documentElement.outerHTML;
  // Inject the snapshot just before the main script so INIT can pick it up.
  doc = doc.replace('<script>', () =>
    '<script>window.__TMS_PREVIEW__=' + snapshot + ';<\/script>\n<script>');
  win.document.open();
  win.document.write(doc);
  win.document.close();
  win.focus();
  toast('미리보기 새 창을 열었습니다 · 전체 사이트 확인 가능', 'success');
}

let PREVIEW_MODE = false;

/* ============================================================
   GLOBAL EVENTS — all DOM bindings (run on script load, after body DOM is parsed)
   ============================================================ */

// Add section button → switch to catalog tab
document.getElementById('addSectionBtn').addEventListener('click', () => {
  openSectionPicker(defaultInsertIdx());
});

// Left panel header → open site settings in the center area
document.getElementById('siteSettingsEntry').addEventListener('click', () => {
  switchToSiteSettings();
});

// Topbar → 웹사이트 목록 페이지로 이동 (별도 HTML)
document.getElementById('goWebsiteListBtn').addEventListener('click', () => {
  location.href = 'websites.html';
});

// Device switcher
document.querySelectorAll('.device-btn').forEach(b => {
  b.addEventListener('click', () => switchDevice(b.dataset.device));
});

// Save / Preview / Publish
document.getElementById('saveBtn').addEventListener('click', () => {
  toast('임시 저장 완료 · Draft 업데이트됨', 'success');
});
document.getElementById('previewBtn').addEventListener('click', openPreviewWindow);
document.getElementById('publishBtn').addEventListener('click', () => {
  showPublishModal();
});
document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('publishModal').classList.remove('show');
});
document.getElementById('publishModal').addEventListener('click', e => {
  if (e.target.id === 'publishModal') document.getElementById('publishModal').classList.remove('show');
});
document.getElementById('modalPublish').addEventListener('click', () => {
  document.getElementById('publishModal').classList.remove('show');
  STATE.pageStatus = 'live';
  renderTopBar();
  toast('🚀 발행 완료 · 3개 디바이스에 반영됨', 'success');
});

document.getElementById('sectionPickerCancel').addEventListener('click', closeSectionPicker);
document.getElementById('sectionPickerModal').addEventListener('click', e => {
  if (e.target.id === 'sectionPickerModal') closeSectionPicker();
});

// 카드 편집 모달 — 취소/배경/제출/이미지 제거/파일 업로드/URL 입력
document.getElementById('cardEditCancel').addEventListener('click', closeCardEditModal);
document.getElementById('cardEditSubmit').addEventListener('click', submitCardEdit);
document.getElementById('cardEditModal').addEventListener('click', e => {
  if (e.target.id === 'cardEditModal') closeCardEditModal();
});
document.getElementById('cardEditImageClear').addEventListener('click', () => {
  if (!_cardEditCtx) return;
  _cardEditCtx.draft.image = null;
  document.getElementById('cardEditImageUrl').value = '';
  document.getElementById('cardEditImageFile').value = '';
  updateCardEditPreview();
});
// URL input 실시간 preview 갱신
document.getElementById('cardEditImageUrl').addEventListener('input', e => {
  if (!_cardEditCtx) return;
  const v = e.target.value.trim();
  _cardEditCtx.draft.image = v ? { bg: `url('${v}')` } : null;
  updateCardEditPreview();
});
// 파일 업로드 — FileReader로 data URL 변환 후 preview/draft에 반영
document.getElementById('cardEditImageFile').addEventListener('change', e => {
  if (!_cardEditCtx) return;
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('이미지 파일만 업로드 가능합니다', 'error'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    _cardEditCtx.draft.image = { bg: `url('${reader.result}')`, name: file.name };
    document.getElementById('cardEditImageUrl').value = '';
    updateCardEditPreview();
  };
  reader.readAsDataURL(file);
});

// 페이지 추가 모달 — 취소/배경/제출
document.getElementById('addPageCancel').addEventListener('click', closeAddPageModal);
document.getElementById('addPageSubmit').addEventListener('click', submitAddPage);
document.getElementById('addPageModal').addEventListener('click', e => {
  if (e.target.id === 'addPageModal') closeAddPageModal();
});
document.getElementById('addPageName').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitAddPage(); }
});
document.getElementById('addPagePath').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitAddPage(); }
});
// 페이지 이름 blur → URL이 비어있으면 이름을 영문 변환해 자동 채움
document.getElementById('addPageName').addEventListener('blur', () => {
  const pathInput = document.getElementById('addPagePath');
  if (pathInput.value.trim()) return; // 사용자가 직접 입력한 URL은 보존
  const name = document.getElementById('addPageName').value.trim();
  if (!name) return;
  const slug = sanitizePagePath(name);
  if (slug) pathInput.value = slug;
});
// URL 필드 — 실시간 한글→영문 변환 + 특수문자 삭제 (IME 조합 중에는 건너뜀)
document.getElementById('addPagePath').addEventListener('input', e => {
  if (e.isComposing) return; // IME 조합 중에는 대기
  const cleaned = sanitizePagePath(e.target.value);
  if (cleaned !== e.target.value) {
    e.target.value = cleaned;
    e.target.setSelectionRange(cleaned.length, cleaned.length);
  }
});
// IME 조합이 끝나는 순간(한 글자 완성)에도 변환 실행
document.getElementById('addPagePath').addEventListener('compositionend', e => {
  const cleaned = sanitizePagePath(e.target.value);
  if (cleaned !== e.target.value) {
    e.target.value = cleaned;
    e.target.setSelectionRange(cleaned.length, cleaned.length);
  }
});
// blur 시에도 한 번 더 정제 (보호장치)
document.getElementById('addPagePath').addEventListener('blur', e => {
  const cleaned = sanitizePagePath(e.target.value);
  if (cleaned !== e.target.value) e.target.value = cleaned;
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('cardEditModal').classList.contains('show')) {
    closeCardEditModal();
  }
  if (e.key === 'Escape' && document.getElementById('addPageModal').classList.contains('show')) {
    closeAddPageModal();
  }
  if (e.key === 'Escape' && document.getElementById('sectionPickerModal').classList.contains('show')) {
    closeSectionPicker();
  }
  if (e.key === 'Escape' && STATE.guestLookupOpen) {
    STATE.guestLookupOpen = false;
    renderPreview();
  }
  if (e.key === 'Escape' && STATE.mobileNavOpen) {
    STATE.mobileNavOpen = false;
    renderPreview();
  }
  if (e.key === 'Escape' && STATE.authModal) {
    STATE.authModal = null;
    renderPreview();
  }
  if (e.key === 'Escape' && STATE.stopInfoModal) {
    STATE.stopInfoModal = null;
    renderPreview();
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('[data-lang-selector]')) closeLangMenus();
  if (!e.target.closest('[data-user-menu]')) closeUserMenus();
  // 검색바 from/to 팝오버 외부 클릭 닫기
  if (STATE.searchPopover && !e.target.closest('[data-spop]') && !e.target.closest('[data-spop-trigger]')) {
    STATE.searchPopover = null;
    renderPreview();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeLangMenus();
    closeUserMenus();
    if (STATE.searchPopover) { STATE.searchPopover = null; renderPreview(); }
  }
});

