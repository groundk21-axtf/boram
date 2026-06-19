/* checkout.js — 결제 페이지 (일반/순환/투어 공용) */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function formatPrice(v) { return '₩ ' + Number(v).toLocaleString('ko-KR'); }

function getRouteType() {
  const t = new URLSearchParams(location.search).get('type');
  return (t === 'circular' || t === 'tour') ? t : 'regular';
}
const ROUTE_TYPE = getRouteType();

/* ============================================================
   MOCK — 라우트 타입별 여정 데이터
   - regular: 왕복 2여정 / 일반노선
   - circular: 1여정 / 순환노선 (출/도착지 동일)
   - tour: 1여정 / 투어노선 (당일 또는 패키지)
   ============================================================ */
let JOURNEYS = (function() {
  if (ROUTE_TYPE === 'circular') {
    return [{
      idx: 1, date: '2026-07-06', time: '09:30',
      routeName: '서울시티투어 - 전통문화코스',
      pickup: '동대문디자인플라자',
      arrival: '동대문디자인플라자',
      vehicle: '*25인승 셔틀',
      seatType: '자유석',
      fares: [
        { type: '대인', price: 27000, qty: 1 },
        { type: '소인', price: 20000, qty: 0 }
      ],
      addons: [
        { id: 'audio',     name: '오디오 가이드 (한국어/영어)', price: 3000,  qty: 1, selected: false },
        { id: 'lunchbox',  name: '도시락 (전통 한식)',          price: 12000, qty: 1, selected: false }
      ]
    }];
  }
  if (ROUTE_TYPE === 'tour') {
    return [{
      idx: 1, date: '2026-07-06', time: '07:00',
      routeName: '순천 구례 봄길여행',
      pickup: '광주 유스퀘어',
      arrival: '광주 유스퀘어',
      vehicle: '*28인승 대형버스',
      seatType: '지정석',
      selectedSeats: [],
      fares: [
        { type: '대인', price: 89000, qty: 1 },
        { type: '소인', price: 65000, qty: 0 }
      ],
      addons: [
        { id: 'guide',     name: '전문 해설사 동반',  price: 15000, qty: 1, selected: false },
        { id: 'insurance', name: '여행자 안전 보험',  price: 5000,  qty: 1, selected: false },
        { id: 'pickup',    name: '호텔 픽업 서비스',  price: 10000, qty: 1, selected: false }
      ]
    }];
  }
  // regular — 왕복 기본 (가는편 + 오는편)
  return [
    {
      idx: 1, date: '2026-07-06', time: '08:00',
      routeName: '사당/종합',
      pickup: '종합운동장역', arrival: '비발디파크',
      vehicle: '*44인승 대형버스',
      seatType: '자유석',
      fares: [
        { type: '대인', price: 10000, qty: 1 },
        { type: '소인', price: 8000, qty: 0 }
      ],
      addons: [
        { id: 'lift_ticket', name: '리프트 1일권',         price: 55000, qty: 1, selected: false },
        { id: 'rental',      name: '스키/스노보드 장비 대여', price: 30000, qty: 1, selected: false }
      ]
    },
    {
      idx: 2, date: '2026-07-06', time: '13:00',
      routeName: '→ 종합운동장',
      pickup: '비발디파크', arrival: '종합운동장역',
      vehicle: '*44인승 대형버스',
      seatType: '지정석',
      selectedSeats: [],
      fares: [
        { type: '대인', price: 10000, qty: 1 },
        { type: '소인', price: 8000, qty: 0 }
      ],
      addons: []
    }
  ];
})();

/* ============================================================
   SVG icons
   ============================================================ */
const pinPickupSvg = `<svg viewBox="0 0 24 24" fill="#16A34A"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`;
const pinArrivalSvg = `<svg viewBox="0 0 24 24" fill="#DC2626"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`;
const arrowSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 6 19 12 13 18"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const busSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><circle cx="8" cy="17" r="1.5" fill="currentColor"/><circle cx="16" cy="17" r="1.5" fill="currentColor"/></svg>`;

/* ============================================================
   RENDER — 인원 선택 (좌측)
   ============================================================ */
function renderJourneys() {
  const host = document.getElementById('coJourneys');
  host.innerHTML = JOURNEYS.map((j, idx) => `
    <div class="co-journey-card" data-idx="${idx}">
      <div class="co-journey-head">
        <span class="co-journey-chip">여정 ${String(j.idx).padStart(2, '0')}</span>
        <span class="co-journey-date">${escapeHtml(j.date)} ${escapeHtml(j.time)}</span>
      </div>
      <h3 class="co-journey-route-name">${escapeHtml(j.routeName)}</h3>
      <div class="co-route-pill">
        <div class="co-route-od">
          <span class="co-route-od-label">출발</span>
          <span class="co-route-od-station">${escapeHtml(j.pickup)}</span>
        </div>
        <span class="co-route-od-arrow">${arrowSvg}</span>
        <div class="co-route-od">
          <span class="co-route-od-label">도착</span>
          <span class="co-route-od-station">${escapeHtml(j.arrival)}</span>
        </div>
      </div>
      <div class="co-fares">
        ${j.fares.map((f, fi) => `
          <div class="bk-qty-row">
            <div class="bk-qty-info">
              <span class="bk-qty-name">${escapeHtml(f.type)}</span>
              <span class="bk-qty-price">${formatPrice(f.price)} / 1인</span>
            </div>
            <div class="bk-qty-stepper">
              <button type="button" class="bk-qty-btn" data-jidx="${idx}" data-fidx="${fi}" data-delta="-1" aria-label="감소" ${f.qty <= 0 ? 'disabled' : ''}>−</button>
              <span class="bk-qty-count">${f.qty}</span>
              <button type="button" class="bk-qty-btn" data-jidx="${idx}" data-fidx="${fi}" data-delta="1" aria-label="증가">+</button>
            </div>
          </div>
        `).join('')}
      </div>
      ${renderAddons(j, idx)}
      ${renderFareNote(j, idx)}
    </div>
  `).join('');

  host.querySelectorAll('[data-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const j = parseInt(btn.dataset.jidx, 10);
      const f = parseInt(btn.dataset.fidx, 10);
      const d = parseInt(btn.dataset.delta, 10);
      JOURNEYS[j].fares[f].qty = Math.max(0, JOURNEYS[j].fares[f].qty + d);
      // 인원 변경 → 기존 선택 좌석 초기화 (인원 수와 일치하지 않을 수 있음)
      if (JOURNEYS[j].seatType === '지정석') JOURNEYS[j].selectedSeats = [];
      renderJourneys();
      renderSummary();
    });
  });

  host.querySelectorAll('[data-seat-select]').forEach(btn => {
    btn.addEventListener('click', () => {
      const j = parseInt(btn.dataset.seatSelect, 10);
      openSeatModal(j);
    });
  });

  // 추가 상품 커스텀 dropdown — 트리거 클릭으로 열기
  host.querySelectorAll('[data-addon-trigger]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = btn.dataset.addonTrigger;
      const menu = host.querySelector(`[data-addon-menu="${idx}"]`);
      if (!menu) return;
      const willOpen = menu.hidden;
      // 다른 드롭다운 모두 닫기
      host.querySelectorAll('.co-addon-select-menu').forEach(m => { m.hidden = true; });
      host.querySelectorAll('[data-addon-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
      if (willOpen) {
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // 옵션 클릭 → 선택 추가
  host.querySelectorAll('[data-addon-pick]').forEach(opt => {
    opt.addEventListener('click', () => {
      const j = parseInt(opt.dataset.jidx, 10);
      const aid = opt.dataset.addonPick;
      const addon = (JOURNEYS[j].addons || []).find(a => a.id === aid);
      if (addon) {
        addon.selected = true;
        if (!addon.qty || addon.qty < 1) addon.qty = 1;
      }
      renderJourneys();
      renderSummary();
    });
  });

  // 선택된 추가 상품 수량 ± (min 1, 0 이하로는 ×버튼으로 삭제)
  host.querySelectorAll('[data-addon-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const j = parseInt(btn.dataset.jidx, 10);
      const aid = btn.dataset.aid;
      const d = parseInt(btn.dataset.delta, 10);
      const addon = (JOURNEYS[j].addons || []).find(a => a.id === aid);
      if (!addon) return;
      addon.qty = Math.max(1, (addon.qty || 1) + d);
      renderJourneys();
      renderSummary();
    });
  });

  // 선택된 추가 상품 삭제
  host.querySelectorAll('[data-addon-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const j = parseInt(btn.dataset.jidx, 10);
      const aid = btn.dataset.addonRemove;
      const addon = (JOURNEYS[j].addons || []).find(a => a.id === aid);
      if (addon) addon.selected = false;
      renderJourneys();
      renderSummary();
    });
  });
}

/* ============================================================
   추가 상품 (옵션) — select 박스로 선택 / 선택된 항목은 삭제 가능
   ============================================================ */
function renderAddons(j, idx) {
  const addons = j.addons || [];
  if (!addons.length) return '';
  const available = addons.filter(a => !a.selected);
  const selected = addons.filter(a => a.selected);

  const caretSvg = `<svg class="co-addon-select-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;
  const selectHtml = available.length > 0 ? `
    <div class="co-addon-select-wrap">
      <button type="button" class="co-addon-select" data-addon-trigger="${idx}" aria-haspopup="listbox" aria-expanded="false">
        <span class="co-addon-select-placeholder">추가 상품을 선택하세요</span>
        ${caretSvg}
      </button>
      <ul class="co-addon-select-menu" data-addon-menu="${idx}" role="listbox" hidden>
        ${available.map(a => `
          <li role="option" class="co-addon-select-option" data-addon-pick="${escapeHtml(a.id)}" data-jidx="${idx}">
            <span class="co-addon-select-option-name">${escapeHtml(a.name)}</span>
            <span class="co-addon-select-option-price">${formatPrice(a.price)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : `<div class="co-addon-select-empty">선택 가능한 추가 상품이 없습니다.</div>`;

  const selectedHtml = selected.length > 0 ? `
    <ul class="co-addon-selected-list">
      ${selected.map(a => {
        const qty = a.qty || 1;
        return `
          <li class="co-addon-selected-item">
            <div class="co-addon-selected-info">
              <span class="co-addon-selected-name">${escapeHtml(a.name)}</span>
              <span class="co-addon-selected-price">${formatPrice(a.price)}</span>
            </div>
            <div class="bk-qty-stepper">
              <button type="button" class="bk-qty-btn" data-addon-qty data-jidx="${idx}" data-aid="${escapeHtml(a.id)}" data-delta="-1" aria-label="감소" ${qty <= 1 ? 'disabled' : ''}>−</button>
              <span class="bk-qty-count">${qty}</span>
              <button type="button" class="bk-qty-btn" data-addon-qty data-jidx="${idx}" data-aid="${escapeHtml(a.id)}" data-delta="1" aria-label="증가">+</button>
            </div>
            <button type="button" class="co-addon-remove" data-jidx="${idx}" data-addon-remove="${escapeHtml(a.id)}" aria-label="${escapeHtml(a.name)} 삭제">×</button>
          </li>
        `;
      }).join('')}
    </ul>
  ` : '';

  return `
    <div class="co-addons">
      <div class="co-addons-head">
        <span class="co-addons-title">추가 상품</span>
      </div>
      ${selectHtml}
      ${selectedHtml}
    </div>
  `;
}

/* ============================================================
   좌석 선택 case — 자유석/지정석 분기
   ============================================================ */
function totalQty(j) {
  return (j.fares || []).reduce((sum, f) => sum + (f.qty || 0), 0);
}
function renderFareNote(j, idx) {
  if (j.seatType !== '지정석') {
    return '';   // 자유석은 별도 안내 없음
  }
  const total = totalQty(j);
  const picked = (j.selectedSeats || []).length;
  const ready = picked === total && total > 0;
  const summary = picked > 0
    ? `<span class="co-seat-summary">${(j.selectedSeats || []).join(', ')}</span>`
    : `<span class="co-seat-summary co-seat-summary-empty">미선택</span>`;
  const seatSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3"/><rect x="6" y="3" width="12" height="10" rx="2"/></svg>`;
  return `
    <div class="co-fare-note co-seat-pick">
      <span class="co-seat-pick-label">좌석</span>
      ${summary}
      <button type="button" class="co-seat-btn ${ready ? 'ready' : ''}" data-seat-select="${idx}" ${total <= 0 ? 'disabled' : ''}>
        ${seatSvg}<span>${picked > 0 ? '좌석 변경' : '좌석 선택'}</span>
      </button>
    </div>
  `;
}

/* ============================================================
   RENDER — 우측 사이드바 (나의 예약)
   ============================================================ */
function renderSummary() {
  const host = document.getElementById('coSummaryJourneys');
  host.innerHTML = JOURNEYS.map(j => {
    const fareRows = j.fares.filter(f => f.qty > 0).map(f =>
      `<div><span>${escapeHtml(f.type)} × ${f.qty}</span><strong>${formatPrice(f.price * f.qty)}</strong></div>`
    ).join('');
    const selectedAddons = (j.addons || []).filter(a => a.selected);
    const addonRows = selectedAddons.length > 0 ? `
      <div class="co-sum-addons">
        <div class="co-sum-addons-label">추가 상품</div>
        ${selectedAddons.map(a => {
          const qty = a.qty || 1;
          const subtotal = a.price * qty;
          return `<div class="co-sum-addon-row">
            <span class="co-sum-addon-name">${escapeHtml(a.name)} × ${qty}</span>
            <strong>${formatPrice(subtotal)}</strong>
          </div>`;
        }).join('')}
      </div>
    ` : '';
    return `
      <div class="co-sum-journey">
        <div class="co-sum-head">
          <span class="co-journey-chip">여정 ${String(j.idx).padStart(2, '0')}</span>
          <span class="co-sum-date">${escapeHtml(j.date)} ${escapeHtml(j.time)}</span>
        </div>
        <div class="co-sum-route-name">${escapeHtml(j.routeName)}</div>
        <div class="co-sum-spec">
          ${fareRows}
          <div><span>선택 좌석</span><strong>${escapeHtml(j.seatType)}</strong></div>
        </div>
        ${addonRows}
      </div>
    `;
  }).join('');

  const grandTotal = JOURNEYS.reduce((sum, j) => {
    const fareSum  = (j.fares  || []).reduce((s, f) => s + f.price * f.qty, 0);
    // 추가 상품: 단가 × 수량 합산 (카드에는 단가만 표시, 합계는 수량 반영)
    const addonSum = (j.addons || []).reduce((s, a) => s + (a.selected ? a.price * (a.qty || 1) : 0), 0);
    return sum + fareSum + addonSum;
  }, 0);
  document.getElementById('coTotal').textContent = formatPrice(grandTotal);

  const btn = document.getElementById('coPayBtn');
  if (btn) btn.disabled = grandTotal <= 0;
}

/* ============================================================
   국가 코드 — 전화번호 prefix
   ============================================================ */
const COUNTRY_CODES = [
  { flag: '🇰🇷', code: '+82',  name: '대한민국' },
  { flag: '🇯🇵', code: '+81',  name: '일본' },
  { flag: '🇨🇳', code: '+86',  name: '중국' },
  { flag: '🇹🇼', code: '+886', name: '대만' },
  { flag: '🇭🇰', code: '+852', name: '홍콩' },
  { flag: '🇻🇳', code: '+84',  name: '베트남' },
  { flag: '🇹🇭', code: '+66',  name: '태국' },
  { flag: '🇸🇬', code: '+65',  name: '싱가포르' },
  { flag: '🇺🇸', code: '+1',   name: '미국' },
  { flag: '🇬🇧', code: '+44',  name: '영국' },
  { flag: '🇫🇷', code: '+33',  name: '프랑스' },
  { flag: '🇩🇪', code: '+49',  name: '독일' }
];
let SELECTED_CC = COUNTRY_CODES[0];

function renderCountryMenu() {
  const menu = document.getElementById('coPhoneCcMenu');
  if (!menu) return;
  menu.innerHTML = COUNTRY_CODES.map((c, i) => `
    <li class="co-phone-cc-item${c.code === SELECTED_CC.code ? ' active' : ''}" role="option" data-cc="${i}">
      <span class="co-phone-cc-flag">${c.flag}</span>
      <span class="co-phone-cc-name">${escapeHtml(c.name)}</span>
      <span class="co-phone-cc-code">${escapeHtml(c.code)}</span>
    </li>
  `).join('');
  menu.querySelectorAll('[data-cc]').forEach(li => {
    li.addEventListener('click', () => {
      SELECTED_CC = COUNTRY_CODES[parseInt(li.dataset.cc, 10)];
      document.getElementById('coPhoneCcFlag').textContent = SELECTED_CC.flag;
      document.getElementById('coPhoneCcCode').textContent = SELECTED_CC.code;
      closeCountryMenu();
      renderCountryMenu();
    });
  });
}

function openCountryMenu() {
  const menu = document.getElementById('coPhoneCcMenu');
  const btn = document.getElementById('coPhoneCcBtn');
  if (menu) menu.hidden = false;
  if (btn) btn.setAttribute('aria-expanded', 'true');
}
function closeCountryMenu() {
  const menu = document.getElementById('coPhoneCcMenu');
  const btn = document.getElementById('coPhoneCcBtn');
  if (menu) menu.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

/* ============================================================
   결제 수단 — 카드 / Paypal / 페이스 등 10종
   ============================================================ */
const PAYMENT_METHODS = [
  { id: 'card',     label: '신용/체크카드',  brand: '카드', color: '#0F172A' },
  { id: 'foreign',  label: '해외 신용카드',  brand: 'VISA', color: '#1A1F71' },
  { id: 'paypal',   label: 'PayPal',         brand: 'P',    color: '#003087' },
  { id: 'bank',     label: '실시간 계좌이체', brand: '계좌', color: '#64748B' },
  { id: 'kakaopay', label: '카카오페이',     brand: 'K',    color: '#FEE500', text: '#3C1E1E' },
  { id: 'naverpay', label: '네이버페이',     brand: 'N',    color: '#03C75A' },
  { id: 'payco',    label: '페이코',         brand: 'P',    color: '#FF1414' },
  { id: 'tosspay',  label: '토스페이',       brand: 'T',    color: '#0064FF' },
  { id: 'applepay', label: 'Apple Pay',      brand: '',     color: '#000000', icon: 'apple' },
  { id: 'samsungpay', label: 'Samsung Pay',  brand: 'S',    color: '#1428A0' }
];
let SELECTED_PM = 'card';

const APPLE_LOGO_SVG = `<svg viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`;

function renderPaymentMethods() {
  const host = document.getElementById('coPaymentMethods');
  if (!host) return;
  host.innerHTML = PAYMENT_METHODS.map(pm => `
      <label class="co-radio co-pm">
        <input type="radio" name="copm" value="${pm.id}" ${pm.id === SELECTED_PM ? 'checked' : ''}>
        <span class="co-radio-dot"></span>
        <span class="co-radio-label">${escapeHtml(pm.label)}</span>
      </label>`).join('');
  host.querySelectorAll('input[name="copm"]').forEach(r => {
    r.addEventListener('change', () => { SELECTED_PM = r.value; });
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderJourneys();
  renderSummary();
  renderCountryMenu();
  renderPaymentMethods();

  // 국가코드 드롭다운 토글
  const ccBtn = document.getElementById('coPhoneCcBtn');
  if (ccBtn) {
    ccBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('coPhoneCcMenu');
      if (menu.hidden) openCountryMenu(); else closeCountryMenu();
    });
  }
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('coPhoneWrap');
    if (wrap && !wrap.contains(e.target)) closeCountryMenu();
  });

  // 추가 상품 dropdown — 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (e.target.closest('.co-addon-select-wrap')) return;
    document.querySelectorAll('.co-addon-select-menu').forEach(m => { m.hidden = true; });
    document.querySelectorAll('[data-addon-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
  });
  // Esc 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.co-addon-select-menu').forEach(m => { m.hidden = true; });
    document.querySelectorAll('[data-addon-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
  });

  const btn = document.getElementById('coPayBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const selected = PAYMENT_METHODS.find(p => p.id === SELECTED_PM);
      alert(`결제 진행 — ${selected ? selected.label : SELECTED_PM} (mockup)`);
    });
  }

  // 모바일 — 하단 [결제하기] 버튼 클릭 시 '나의 예약' 바텀시트 오픈
  const sidebar     = document.getElementById('coSidebar');
  const sheetBackdrop = document.getElementById('coSheetBackdrop');
  const mobilePayBtn  = document.getElementById('coMobilePayBtn');
  const sheetCloseBtn = document.getElementById('coSheetClose');
  const openSheet = () => {
    sidebar?.classList.add('open');
    sheetBackdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeSheet = () => {
    sidebar?.classList.remove('open');
    sheetBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
  };
  mobilePayBtn?.addEventListener('click', openSheet);
  sheetCloseBtn?.addEventListener('click', closeSheet);
  sheetBackdrop?.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar?.classList.contains('open')) closeSheet();
  });
});

/* ============================================================
   좌석 선택 모달 — TMS Admin SeatLayout schema 기반
   실제 운영 시 transport.seatLayoutByGrade 를 API에서 조회 (mock).
   ============================================================ */
/**
 * SeatCell   = { row, col, grade: string|null, spec: 'aisle'|'exit'|'disabled'|null }
 * SeatLayout = { rows, cols, aislesAfterCol: number[], numberFormat: 'numeric'|'alpha-row'|'alpha-col', cells: SeatCell[], backRowAisles?: boolean }
 */
function gridCells(rows, cols, grade = 'standard') {
  const out = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      out.push({ row: r, col: c, grade, spec: null });
    }
  }
  return out;
}

/* 차량별 mock layout — 실제론 admin 설정에서 가져옴 */
const SEAT_LAYOUTS = {
  '25인승 셔틀':   { rows: 7,  cols: 3, aislesAfterCol: [1], numberFormat: 'numeric',  cells: gridCells(7, 3) },
  '28인승 대형버스': { rows: 7,  cols: 4, aislesAfterCol: [2], numberFormat: 'alpha-col', cells: gridCells(7, 4) },
  '44인승 대형버스': { rows: 11, cols: 4, aislesAfterCol: [2], numberFormat: 'alpha-col', cells: gridCells(11, 4), backRowAisles: true }
};
const SEAT_LAYOUT_DEFAULT = SEAT_LAYOUTS['28인승 대형버스'];

function getLayoutForJourney(j) {
  const key = (j.vehicle || '').replace(/^\*/, '').trim();
  return SEAT_LAYOUTS[key] || SEAT_LAYOUT_DEFAULT;
}

/* admin 의 getSeatNumber 동등 구현 */
function getSeatNumber(cell, format, allCells) {
  if (format === 'alpha-row') {
    // A1, A2, B1, B2 — 행 = 알파벳, 열 = 숫자
    return `${String.fromCharCode(64 + cell.row)}${cell.col}`;
  }
  if (format === 'alpha-col') {
    // 1A, 1B, 2A, 2B — 행 = 숫자, 열 = 알파벳
    return `${cell.row}${String.fromCharCode(64 + cell.col)}`;
  }
  // numeric — 활성 좌석을 행→열 순으로 카운트
  const actives = allCells
    .filter(c => c.grade && c.spec !== 'aisle' && c.spec !== 'disabled')
    .sort((a, b) => (a.row - b.row) || (a.col - b.col));
  const i = actives.findIndex(c => c.row === cell.row && c.col === cell.col);
  return String(i + 1);
}

function activeSeatIds(layout) {
  return layout.cells
    .filter(c => c.grade && c.spec !== 'aisle' && c.spec !== 'disabled')
    .sort((a, b) => (a.row - b.row) || (a.col - b.col))
    .map(c => getSeatNumber(c, layout.numberFormat, layout.cells));
}

const SEAT_MODAL_STATE = { jidx: null, picks: [] };

/* mock 예약 좌석 — 날짜·여정 hash deterministic (실 구현 시 schedule API) */
function getBookedSeats(j, layout) {
  const ids = activeSeatIds(layout);
  if (!ids.length) return new Set();
  const seed = `${j.date}|${j.idx}|${j.routeName}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const max = Math.min(10, Math.floor(ids.length * 0.4));
  const target = Math.max(2, Math.abs(h) % Math.max(3, max));
  const booked = new Set();
  let cur = Math.abs(h);
  while (booked.size < target) {
    cur = (cur * 1664525 + 1013904223) >>> 0;
    booked.add(ids[cur % ids.length]);
  }
  return booked;
}

function openSeatModal(jidx) {
  const j = JOURNEYS[jidx];
  if (!j || j.seatType !== '지정석') return;
  SEAT_MODAL_STATE.jidx = jidx;
  SEAT_MODAL_STATE.picks = [...(j.selectedSeats || [])];
  renderSeatModal();
  document.getElementById('coSeatModal').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSeatModal() {
  document.getElementById('coSeatModal').hidden = true;
  document.body.style.overflow = '';
  SEAT_MODAL_STATE.jidx = null;
  SEAT_MODAL_STATE.picks = [];
}

function renderSeatModal() {
  const root = document.getElementById('coSeatModal');
  if (!root) return;
  const j = JOURNEYS[SEAT_MODAL_STATE.jidx];
  const layout = getLayoutForJourney(j);
  const need = totalQty(j);
  const booked = getBookedSeats(j, layout);
  const picks = SEAT_MODAL_STATE.picks;

  // 셀 위치 lookup
  const cellAt = new Map();
  layout.cells.forEach(c => cellAt.set(`${c.row}-${c.col}`, c));

  // 통계 (활성 / 비활성 / 비상구)
  const stats = layout.cells.reduce((acc, c) => {
    if (c.spec === 'disabled') acc.disabled++;
    else if (c.spec === 'exit') acc.exits++;
    else if (c.grade && c.spec !== 'aisle') acc.active++;
    return acc;
  }, { active: 0, disabled: 0, exits: 0 });

  // 셀 → 버튼 마크업 (admin chair 스타일)
  const renderCell = (cell) => {
    if (!cell || (!cell.grade && cell.spec !== 'exit' && cell.spec !== 'disabled')) {
      return `<span class="co-seat-slot co-seat-empty" aria-hidden="true"></span>`;
    }
    const cls = ['co-seat-slot', 'co-seat'];
    let content;
    let disabled = '';
    if (cell.spec === 'disabled') {
      cls.push('disabled');
      content = '✕';
      disabled = 'disabled aria-disabled="true"';
    } else if (cell.spec === 'exit') {
      cls.push('exit');
      content = '🚨';
      disabled = 'disabled aria-disabled="true"';
    } else {
      const id = getSeatNumber(cell, layout.numberFormat, layout.cells);
      const isBooked = booked.has(id);
      const isPicked = picks.includes(id);
      if (isBooked) cls.push('booked');
      else if (isPicked) cls.push('picked');
      else cls.push('avail');
      if (cell.grade && cell.grade !== 'standard') cls.push(`grade-${cell.grade}`);
      content = escapeHtml(id);
      disabled = isBooked ? 'disabled' : '';
      return `<button type="button" class="${cls.join(' ')}" data-seat="${escapeHtml(id)}" ${disabled}>${content}</button>`;
    }
    return `<span class="${cls.join(' ')}" ${disabled}>${content}</span>`;
  };

  // 통로 자리 — vertical divider 또는 backRowAisles 좌석
  const renderAisleSlot = (row, col) => {
    if (row === layout.rows && layout.backRowAisles) {
      const aisleCell = cellAt.get(`${row}-${col + 0.5}`) || { row, col: col + 0.5, grade: 'standard', spec: null };
      return renderCell(aisleCell);
    }
    const widthCls = layout.backRowAisles ? 'wide' : '';
    return `<span class="co-seat-slot co-seat-aisle ${widthCls}" aria-hidden="true"><i></i></span>`;
  };

  // 행 단위 렌더 (좌석 + 통로)
  const rowsHtml = [];
  for (let r = 1; r <= layout.rows; r++) {
    const slots = [];
    for (let c = 1; c <= layout.cols; c++) {
      slots.push(renderCell(cellAt.get(`${r}-${c}`)));
      if (layout.aislesAfterCol.includes(c) && c !== layout.cols) {
        slots.push(renderAisleSlot(r, c));
      }
    }
    rowsHtml.push(`<div class="co-seat-row">${slots.join('')}</div>`);
  }

  const ready = picks.length === need && need > 0;

  root.innerHTML = `
    <div class="co-seat-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="coSeatModalTitle">
      <header class="co-seat-modal-head">
        <h2 id="coSeatModalTitle" class="co-seat-modal-title">좌석 선택</h2>
        <span class="co-seat-modal-count">
          <strong class="co-seat-modal-count-picked">${picks.length}</strong>
          <span class="co-seat-modal-count-sep">/</span>
          <span class="co-seat-modal-count-need">${need}</span>
        </span>
        <button type="button" class="co-seat-modal-close" aria-label="닫기" data-seat-close>×</button>
      </header>

      <div class="co-seat-bus">
        <div class="co-seat-bus-cabin">
          <div class="co-seat-modal-legend">
            <span><i class="co-seat-dot avail"></i>선택 가능</span>
            <span><i class="co-seat-dot picked"></i>선택</span>
            <span><i class="co-seat-dot booked"></i>예약 완료</span>
          </div>
          <div class="co-seat-grid">${rowsHtml.join('')}</div>
        </div>
      </div>

      <footer class="co-seat-modal-foot">
        <button type="button" class="co-seat-btn-secondary" data-seat-close>취소</button>
        <button type="button" class="co-seat-btn-primary" data-seat-confirm ${ready ? '' : 'disabled'}>확인</button>
      </footer>
    </div>
  `;

  // 좌석 클릭 — innerHTML 재렌더 없이 surgical update (깜빡임 방지)
  root.querySelectorAll('button.co-seat[data-seat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.seat;
      const arr = SEAT_MODAL_STATE.picks;
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1);
      else {
        if (arr.length >= need) arr.shift(); // FIFO — 가장 오래된 선택 제거
        arr.push(id);
      }
      updateSeatPicks();
    });
  });
  root.querySelectorAll('[data-seat-close]').forEach(b => b.addEventListener('click', closeSeatModal));
  const confirmBtn = root.querySelector('[data-seat-confirm]');
  if (confirmBtn) confirmBtn.addEventListener('click', () => {
    JOURNEYS[SEAT_MODAL_STATE.jidx].selectedSeats = [...SEAT_MODAL_STATE.picks];
    closeSeatModal();
    renderJourneys();
    renderSummary();
  });
}

/* 좌석 선택 상태만 surgical update — 전체 innerHTML 재작성 없이 부분 갱신 */
function updateSeatPicks() {
  const root = document.getElementById('coSeatModal');
  if (!root || root.hidden) return;
  const j = JOURNEYS[SEAT_MODAL_STATE.jidx];
  if (!j) return;
  const need = totalQty(j);
  const picks = SEAT_MODAL_STATE.picks;
  const pickSet = new Set(picks);

  // 1) 각 좌석 버튼의 .picked / .avail 토글
  root.querySelectorAll('button.co-seat[data-seat]').forEach(btn => {
    if (btn.classList.contains('booked') || btn.classList.contains('disabled') || btn.classList.contains('exit')) return;
    const id = btn.dataset.seat;
    if (pickSet.has(id)) {
      btn.classList.add('picked');
      btn.classList.remove('avail');
    } else {
      btn.classList.remove('picked');
      btn.classList.add('avail');
    }
  });

  // 2) 헤더 카운트 (선택 / 필요) — 텍스트만 갱신
  const countPicked = root.querySelector('.co-seat-modal-count-picked');
  if (countPicked) countPicked.textContent = String(picks.length);
  const countEl = root.querySelector('.co-seat-modal-count');
  if (countEl) countEl.classList.toggle('ready', picks.length === need && need > 0);

  // 4) 확인 버튼 활성 상태
  const confirmBtn = root.querySelector('[data-seat-confirm]');
  if (confirmBtn) confirmBtn.disabled = !(picks.length === need && need > 0);
}

// 백드롭 클릭 / Esc로 닫기
document.addEventListener('click', e => {
  const modal = document.getElementById('coSeatModal');
  if (!modal || modal.hidden) return;
  if (e.target === modal) closeSeatModal();
});
document.addEventListener('keydown', e => {
  const modal = document.getElementById('coSeatModal');
  if (e.key === 'Escape' && modal && !modal.hidden) closeSeatModal();
});
