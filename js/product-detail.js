/* product-detail.js — 상품 상세 페이지 (TRAVEL 카테고리)
   데이터: data/product-detail.js (productApiResponse) */

const PRODUCT = productApiResponse.data;

/* ----------------------------- 헬퍼 ----------------------------- */
function _pdEsc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtKRW(n) {
  return '₩ ' + Number(n).toLocaleString('ko-KR');
}
// 이미지 로드 실패 시(사설 IP 등 접근 불가) picsum placeholder로 자동 교체
function pdFallbackImg(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/700`;
}
// onerror에 안전하게 넣을 수 있도록 HTML 속성용 escape (싱글쿼트 사용)
function _attrEsc(s) {
  return String(s).replace(/'/g, "\\'");
}
// 이미지 경로 해석 — /api/images/images/<파일명> 등은 로컬 images/ 폴더에서 로드
const PD_IMG_BASE = 'images/';
function pdImg(src) {
  if (!src) return '';
  src = String(src);
  if (/^(https?:)?\/\//.test(src)) return src;   // 외부 URL은 그대로
  return PD_IMG_BASE + src.split('/').pop();      // 마지막 파일명만 → asset/<파일명>
}

/* ----------------------------- 상태 ----------------------------- */
const STATE = {
  selectedDate: null,          // 'YYYY-MM-DD'
  qty: {},                     // { '성인': 0, '아동': 0, '유아': 0 }
  textOptions: {},             // { '이름': '', '전화번호': '', '이메일': '' }
  visibleMonth: '2026-06'      // 'YYYY-MM' — 캘린더 표시 월
};
PRODUCT.optionGroups[0].values.forEach(v => { STATE.qty[v] = (v === '성인') ? 1 : 0; });
(PRODUCT.textOptions || []).forEach(g => { STATE.textOptions[g.name] = ''; });

/* ----------------------------- 1) 상품 이미지 (썸네일 1장) ----------------------------- */
function renderGallery() {
  const host = document.getElementById('pdGallery');
  const fb = pdFallbackImg('pd-main');
  host.innerHTML = `<img class="pd-img" src="${_pdEsc(pdImg(PRODUCT.thumbnailUrl))}" alt="${_pdEsc(PRODUCT.name)}" onerror="this.onerror=null;this.src='${_attrEsc(fb)}';">`;
}

/* ----------------------------- 2) 헤더 ----------------------------- */
function renderHeader() {
  const host = document.getElementById('pdHeader');
  const pinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  host.innerHTML = `
    <div class="pd-header-meta">
      <span class="pd-meta-link">${pinSvg}${_pdEsc(PRODUCT.regionName)}</span>
    </div>
    <div class="pd-header-main">
      <h1 class="pd-title">${_pdEsc(PRODUCT.name)}</h1>
      <p class="pd-oneliner">${_pdEsc(PRODUCT.oneliner)}</p>
      <div class="pd-keywords">
        ${PRODUCT.keywords.map(k => `<span class="pd-keyword">${_pdEsc(k)}</span>`).join('')}
      </div>
    </div>
    <div class="pd-meta" id="pdMeta"></div>
  `;
}

/* ----------------------------- 3) 상세 설명 (description HTML + images) / 안내 / 환불 ----------------------------- */
function renderDescription() {
  // 상세 정보 = description HTML + images 갤러리
  const descHtml = PRODUCT.description || '';
  const imagesHtml = (PRODUCT.images && PRODUCT.images.length)
    ? `<div class="pd-desc-images">
        ${PRODUCT.images
          .slice()
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map((img, i) => {
            const fb = pdFallbackImg('pd-desc-' + (img.id || i));
            return `
            <figure class="pd-desc-image">
              <img src="${_pdEsc(pdImg(img.url))}" alt="${_pdEsc(img.caption || ('상세 이미지 ' + (i + 1)))}" loading="lazy" onerror="this.onerror=null;this.src='${_attrEsc(fb)}';">
              ${img.caption ? `<figcaption>${_pdEsc(img.caption)}</figcaption>` : ''}
            </figure>`;
          }).join('')}
      </div>` : '';
  document.getElementById('pdDesc').innerHTML  = descHtml + imagesHtml;
  document.getElementById('pdNotice').innerHTML = PRODUCT.bookingNoticeKo || '';
  document.getElementById('pdRefund').innerHTML = PRODUCT.refundPolicyKo  || '';
}

/* ----------------------------- 4) 여행 일정 (itinerary) ----------------------------- */
function renderItinerary() {
  const host = document.getElementById('pdItinerary');
  const days = PRODUCT.itineraryDays || [];
  const useTabs = days.length > 1;

  const eventsHtml = (day) => day.events.map(ev => {
    const isTransport = ev.eventType === 'TRANSPORT';
    const typeClass = isTransport ? 'transport' : 'activity';
    const typeLabel = isTransport ? '승/하차' : '관광';
    // 이미지 — 최대 4장. 1·2·3·4장에 따라 그리드 분기
    const imgs = Array.isArray(ev.imageUrls) ? ev.imageUrls.slice(0, 4) : [];
    const imagesHtml = imgs.length ? `
      <div class="pd-event-images">
        ${imgs.map((url, i) => {
          const fb = pdFallbackImg('pd-itin-' + ev.id + '-' + i);
          return `<div class="pd-event-image"><img src="${_pdEsc(pdImg(url))}" alt="${_pdEsc(ev.title + ' 이미지 ' + (i + 1))}" loading="lazy" onerror="this.onerror=null;this.src='${_attrEsc(fb)}';"></div>`;
        }).join('')}
      </div>` : '';
    return `
      <div class="pd-event">
        <span class="pd-event-time">${_pdEsc(ev.eventTime || '')}</span>
        <div class="pd-event-marker ${typeClass}">
          <div class="pd-event-marker-dot"></div>
        </div>
        <div class="pd-event-body">
          <span class="pd-event-type ${typeClass}">${typeLabel}</span>
          <div class="pd-event-title">${_pdEsc(ev.title)}</div>
          ${ev.description ? `<div class="pd-event-desc">${_pdEsc(ev.description)}</div>` : ''}
          ${imagesHtml}
        </div>
      </div>`;
  }).join('');

  // 일정이 여러 날이면 탭, 1일이면 단일 .pd-day로 표시
  if (useTabs) {
    const tabs = days.map((d, i) =>
      `<button class="pd-itinerary-tab${i === 0 ? ' active' : ''}" data-day="${d.dayIndex}" type="button">DAY ${d.dayIndex}</button>`
    ).join('');
    const panels = days.map((d, i) => `
      <div class="pd-day" data-day-content="${d.dayIndex}"${i === 0 ? '' : ' hidden'}>
        ${d.title ? `<div class="pd-day-title pd-day-title-text">${_pdEsc(d.title)}</div>` : ''}
        ${eventsHtml(d)}
      </div>`).join('');
    host.innerHTML = `
      <div class="pd-itinerary-tabs" role="tablist">${tabs}</div>
      ${panels}
    `;
    host.querySelectorAll('.pd-itinerary-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        host.querySelectorAll('.pd-itinerary-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.day;
        host.querySelectorAll('[data-day-content]').forEach(panel => {
          panel.hidden = panel.dataset.dayContent !== target;
        });
        pdSetupImagesFade();   // 탭 전환 후 보이는 패널의 페이드 갱신
      });
    });
  } else {
    host.innerHTML = days.map(day => `
      <div class="pd-day">
        <div class="pd-day-title">
          <span class="pd-day-badge">DAY ${day.dayIndex}</span>
          ${day.title ? `<span>${_pdEsc(day.title)}</span>` : ''}
        </div>
        ${eventsHtml(day)}
      </div>`).join('');
  }

  pdSetupImagesFade();
}

/* 일정 이미지 가로 스크롤 — 더 볼 사진이 있으면 우측 페이드 힌트(.pd-has-more) 표시.
   스크롤이 끝에 닿으면 힌트 제거. */
function pdSetupImagesFade() {
  const host = document.getElementById('pdItinerary');
  if (!host) return;
  const update = (el) => {
    const more = el.scrollWidth - el.clientWidth - el.scrollLeft > 4;
    el.classList.toggle('pd-has-more', more);
  };
  host.querySelectorAll('.pd-event-images').forEach(el => {
    update(el);
    if (el.dataset.fadeBound) return;
    el.dataset.fadeBound = '1';
    el.addEventListener('scroll', () => update(el), { passive: true });
  });
  if (!window.__pdImgFadeResize) {
    window.__pdImgFadeResize = true;
    window.addEventListener('resize', pdSetupImagesFade);
  }
}

/* ----------------------------- 5) 포함·불포함 ----------------------------- */
function renderIncludes() {
  const host = document.getElementById('pdIncludes');
  const checkSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const xSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  host.innerHTML = `
    <div class="pd-include-card includes">
      <div class="pd-include-card-title">${checkSvg}포함 사항</div>
      <ul class="pd-include-list">
        ${PRODUCT.includedItems.map(it => `<li>${checkSvg}<span>${_pdEsc(it)}</span></li>`).join('')}
      </ul>
    </div>
    <div class="pd-include-card excludes">
      <div class="pd-include-card-title">${xSvg}불포함 사항</div>
      <ul class="pd-include-list">
        ${PRODUCT.excludedItems.map(it => `<li>${xSvg}<span>${_pdEsc(it)}</span></li>`).join('')}
      </ul>
    </div>
  `;
}

/* ----------------------------- 6) 예약 사이드바 ----------------------------- */
function minPriceText() {
  const min = Math.min(...PRODUCT.priceMatrix.filter(p => p.salePrice > 0).map(p => p.salePrice));
  return fmtKRW(min);
}


/* 캘린더 — visibleMonth 기준 */
function buildScheduleMap() {
  const map = {};
  (PRODUCT.departures || []).forEach(d => {
    map[d.departureDate] = {
      date: d.departureDate,
      capacity: d.capacity,
      booked: d.bookedCount || 0,
      closed: d.manuallyClosed
    };
  });
  return map;
}
const SCHEDULE = buildScheduleMap();

function renderCalendar() {
  const host = document.getElementById('pdCalendar');
  const [yy, mm] = STATE.visibleMonth.split('-').map(Number);
  const firstDay = new Date(yy, mm - 1, 1);
  const lastDay  = new Date(yy, mm, 0);   // 마지막 날
  const startDow = firstDay.getDay();     // 0=일
  const days = lastDay.getDate();

  const dows = ['일','월','화','수','목','금','토'];
  const cells = [];
  // DOW 헤더
  dows.forEach((d, i) => cells.push(`<div class="bk-cal-dow${i === 0 ? ' sun' : ''}">${d}</div>`));
  // 앞쪽 빈칸
  for (let i = 0; i < startDow; i++) cells.push(`<div class="bk-cal-cell empty"></div>`);
  // 날짜
  const minPax = PRODUCT.minDeparturePax || 0;
  for (let d = 1; d <= days; d++) {
    const dateStr = `${yy}-${String(mm).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const sched = SCHEDULE[dateStr];
    let cls = '';
    let seats = '';
    if (sched) {
      const remain = sched.capacity - sched.booked;
      if (sched.closed || remain <= 0) { cls = 'full'; seats = '<span class="bk-cal-cell-seats">마감</span>'; }
      else {
        cls = 'avail';
        seats = `<span class="bk-cal-cell-seats">잔여 ${remain}</span>`;
        // 출발확정 — 잔여 텍스트 primary 블루로 강조
        if (sched.booked >= minPax) cls += ' confirmed';
      }
    } else {
      // 스케줄 없음 → 미운영 (legend의 .off 와 매칭) — 텍스트 없이 회색 비활성화만
      cls = 'off';
    }
    if (STATE.selectedDate === dateStr) cls += ' selected';
    cells.push(`<button type="button" class="bk-cal-cell ${cls}" data-date="${dateStr}" ${cls.includes('full') || cls.includes('off') ? 'disabled' : ''}>
      <span class="bk-cal-cell-num">${d}</span>${seats}
    </button>`);
  }
  host.innerHTML = `
    <div class="bk-cal-month">
      <button class="bk-cal-nav" data-cal-prev type="button" aria-label="이전 달">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="bk-cal-month-title">${yy}년 ${mm}월</div>
      <button class="bk-cal-nav" data-cal-next type="button" aria-label="다음 달">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
    <div class="bk-cal-grid">${cells.join('')}</div>
  `;
  host.querySelectorAll('.bk-cal-cell.avail').forEach(b => {
    b.addEventListener('click', () => {
      STATE.selectedDate = b.dataset.date;
      // 새 날짜의 잔여 좌석이 현재 총 인원보다 적으면 인원을 잔여에 맞춰 축소
      const sched = SCHEDULE[STATE.selectedDate];
      const remain = sched ? (sched.capacity - sched.booked) : null;
      let total = Object.values(STATE.qty).reduce((a, b) => a + b, 0);
      if (remain != null && total > remain) {
        // 큰 수부터(보통 성인) 1씩 감소시켜 잔여에 맞춤
        const keys = Object.keys(STATE.qty);
        let over = total - remain;
        while (over > 0) {
          let reduced = false;
          for (const k of keys) {
            if (over <= 0) break;
            if (STATE.qty[k] > 0) { STATE.qty[k]--; over--; reduced = true; }
          }
          if (!reduced) break;
        }
      }
      renderCalendar();
      revealOptions();
      renderQty();        // 잔여 표시·버튼 상태 갱신
      updateSummary();
    });
  });
  host.querySelector('[data-cal-prev]')?.addEventListener('click', () => { changeMonth(-1); });
  host.querySelector('[data-cal-next]')?.addEventListener('click', () => { changeMonth(+1); });
}

function changeMonth(delta) {
  const [yy, mm] = STATE.visibleMonth.split('-').map(Number);
  let nm = mm + delta, ny = yy;
  if (nm < 1) { nm = 12; ny--; }
  if (nm > 12) { nm = 1; ny++; }
  STATE.visibleMonth = `${ny}-${String(nm).padStart(2,'0')}`;
  renderCalendar();
}

/* 선택한 날짜의 잔여 좌석 (날짜 미선택 → null) */
function remainingSeats() {
  if (!STATE.selectedDate) return null;
  const s = SCHEDULE[STATE.selectedDate];
  return s ? (s.capacity - s.booked) : null;
}

/* 요금 정보만 표시 — 인원 선택은 checkout 페이지에서 진행 */
function renderQty() {
  const host = document.getElementById('pdQty');
  const rows = PRODUCT.priceMatrix
    .filter(p => p.combinationKey !== 'default')
    .map(p => `
    <div class="bk-fare-row">
      <span class="bk-fare-name">${_pdEsc(p.combinationLabel || p.combinationKey)}</span>
      <span class="bk-fare-price">${p.salePrice > 0 ? fmtKRW(p.salePrice) : '무료'}</span>
    </div>`).join('');
  host.innerHTML = `<div class="bk-fare-table">${rows}</div>`;
}

/* 요금 정보 영역 활성화 (날짜 선택 후) */
function revealOptions() {
  document.getElementById('pdOptionsBlock').hidden = false;
}

/* 메타 정보 — route-detail .rd-info-grid 와 동일 스타일 (라벨 + 값 / 셀 사이 vertical divider) */
function renderMeta() {
  const host = document.getElementById('pdMeta');
  if (!host) return;
  const tripDays = (PRODUCT.itineraryDays || []).length || 1;
  const rows = [
    { label: '여행일정', value: `${tripDays}일` },
    { label: '최소 출발인원', value: `${PRODUCT.minDeparturePax}명` },
    { label: '예약 가능', value: `출발 ${PRODUCT.reservableDays}일 전까지` },
    { label: '취소 가능', value: `출발 ${PRODUCT.cancellableDays}일 전까지` }
  ];
  host.innerHTML = rows.map(r => `
    <div class="pd-meta-cell">
      <span class="pd-meta-label">${_pdEsc(r.label)}</span>
      <span class="pd-meta-value">${_pdEsc(r.value)}</span>
    </div>
  `).join('');
}

/* 예약버튼 상태 — 날짜만 있으면 활성화 (인원/추가정보는 checkout 에서 입력) */
function updateSummary() {
  const btn = document.getElementById('pdBookBtn');
  if (!btn) return;
  if (!STATE.selectedDate) { btn.disabled = true; btn.textContent = '날짜를 선택하세요'; }
  else                      { btn.disabled = false; btn.textContent = '예약하기'; }
}

/* 예약 버튼 클릭 → checkout 페이지로 이동 (인원/추가정보는 checkout 에서 입력) */
document.getElementById('pdBookBtn').addEventListener('click', () => {
  if (!STATE.selectedDate) return;
  const params = new URLSearchParams({
    type: 'travel',
    id: PRODUCT.id,
    date: STATE.selectedDate
  });
  location.href = `checkout-product.html?${params.toString()}`;
});

/* ----------------------------- 모바일/태블릿 바텀시트 ----------------------------- */
const bookingPanel    = document.getElementById('pdBookingPanel');
const sheetBackdrop   = document.getElementById('pdSheetBackdrop');

function openBookingSheet() {
  bookingPanel.classList.add('open');
  sheetBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeBookingSheet() {
  bookingPanel.classList.remove('open');
  sheetBackdrop.classList.remove('open');
  document.body.style.overflow = '';
}

// 모바일 [예약하기] 버튼 → 바텀시트 열기
document.getElementById('pdMobileBookBtn').addEventListener('click', openBookingSheet);
// 닫기 버튼 / 백드롭 클릭 / ESC
document.getElementById('pdSheetClose').addEventListener('click', closeBookingSheet);
sheetBackdrop.addEventListener('click', closeBookingSheet);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && bookingPanel.classList.contains('open')) closeBookingSheet();
});

/* ----------------------------- 운영사 정보 ----------------------------- */
function renderOperatorInfo() {
  const host = document.getElementById('pdOperatorInfo');
  if (!host) return;
  const name  = PRODUCT.operatorName  || PRODUCT.vendorName || '아름여행사';
  const phone = PRODUCT.operatorPhone || '1577-0419';
  const email = PRODUCT.operatorEmail || 'arumtr@naver.com';
  const hours = PRODUCT.operatorHours || '평일 09:00~18:00 (KST)';
  const buildSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01M9 13h.01M9 17h.01"/></svg>`;
  const phoneSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.84.6 2.8.72A2 2 0 0 1 22 16.92z"/></svg>`;
  const mailSvg  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>`;
  const clockSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const phoneHref = phone.replace(/[^0-9+]/g, '');
  host.innerHTML = `
    <div class="pd-operator-title">운영사 정보</div>
    <div class="pd-operator-grid">
      <div class="pd-operator-cell">
        <div class="pd-operator-icon">${buildSvg}</div>
        <div class="pd-operator-body">
          <span class="pd-operator-label">운영사</span>
          <span class="pd-operator-value">${_pdEsc(name)}</span>
        </div>
      </div>
      <div class="pd-operator-cell">
        <div class="pd-operator-icon">${phoneSvg}</div>
        <div class="pd-operator-body">
          <span class="pd-operator-label">고객센터</span>
          <a class="pd-operator-value pd-operator-link" href="tel:${_pdEsc(phoneHref)}">${_pdEsc(phone)}</a>
        </div>
      </div>
      <div class="pd-operator-cell">
        <div class="pd-operator-icon">${mailSvg}</div>
        <div class="pd-operator-body">
          <span class="pd-operator-label">이메일</span>
          <a class="pd-operator-value pd-operator-link" href="mailto:${_pdEsc(email)}">${_pdEsc(email)}</a>
        </div>
      </div>
      <div class="pd-operator-cell">
        <div class="pd-operator-icon">${clockSvg}</div>
        <div class="pd-operator-body">
          <span class="pd-operator-label">운영시간</span>
          <span class="pd-operator-value">${_pdEsc(hours)}</span>
        </div>
      </div>
    </div>
  `;
}

/* ----------------------------- 이미지 라이트박스 ----------------------------- */
function bindImageLightbox() {
  const lb       = document.getElementById('pdLightbox');
  const lbImg    = document.getElementById('pdLightboxImg');
  const lbClose  = document.getElementById('pdLightboxClose');
  const itinHost = document.getElementById('pdItinerary');
  if (!lb || !lbImg || !lbClose || !itinHost) return;

  const open = (src, alt) => {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  };

  // 일정 이미지 클릭 → 라이트박스
  itinHost.addEventListener('click', e => {
    const img = e.target.closest('.pd-event-image img');
    if (!img) return;
    open(img.currentSrc || img.src, img.alt);
  });
  lbClose.addEventListener('click', close);
  lb.addEventListener('click', e => {
    if (e.target === lb) close();   // 백드롭 클릭
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lb.hidden) close();
  });
}

/* ----------------------------- INIT ----------------------------- */
renderGallery();
renderHeader();
renderDescription();
renderItinerary();
renderIncludes();
renderCalendar();
renderQty();
renderMeta();
renderOperatorInfo();
bindImageLightbox();
updateSummary();

// 페이지 타이틀에 상품명 반영
document.title = `${PRODUCT.name} · 상품 상세`;
