/* checkout-product.js — 상품 주문 결제 페이지 */

function _esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function _fmt(v) { return '₩ ' + Number(v).toLocaleString('ko-KR'); }

/* ============================================================
   주문 생성 — order-service POST /api/orders/guest 연동 (상품 주문)
   - orderData(화면 조립본) → OrderRequest(productType=TICKET) 매핑 후 전송
   - 성공: 서버 발번 reservationNumber / 실패·백엔드 부재: null (클라이언트 번호 폴백)
   ============================================================ */
function buildProductOrderRequest(orderData) {
  const p = orderData.product || {};
  const buyer = orderData.buyer || {};
  const name = `${buyer.lastName || ''}${buyer.firstName || ''}`.trim() || '게스트';
  const phone = `${buyer.phoneCode || ''}${buyer.phone || ''}`.trim() || null;
  const ticketLines = (p.combinations || []).map((c, i) => ({
    passengerType: c.label, quantity: c.qty, unitPrice: c.price, sortOrder: i
  }));
  return {
    reservationStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    customerType: 'GUEST',
    customerName: name,
    customerPhone: phone,
    customerEmail: buyer.email || null,
    productType: 'TICKET',
    productId: (typeof PRODUCT !== 'undefined' && PRODUCT.id) ? PRODUCT.id : null,
    productName: p.name || null,
    paymentAmount: orderData.total,
    paymentCurrency: 'KRW',
    paymentMethod: orderData.payment ? orderData.payment.label : null,
    usageDate: p.visitDate || null,
    ticketLines
  };
}
async function submitProductOrderToBackend(orderData) {
  if (typeof TMS_API_BASE === 'undefined') return null;
  try {
    // 로그인 회원: 인증 경로(POST /api/orders)로 보내 토큰의 customerId 로 본인 주문 연결.
    // 비로그인: 게스트 경로(POST /api/orders/guest). 회원 식별 필드는 백엔드가 토큰에서 강제하므로 본문은 동일.
    const loggedIn = typeof tmsIsLoggedIn === 'function' && tmsIsLoggedIn();
    const body = JSON.stringify(buildProductOrderRequest(orderData));
    const res = (loggedIn && typeof authFetch === 'function')
      ? await authFetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      : await fetch(`${TMS_API_BASE}/api/orders/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
    return (data && data.reservationNumber) ? data.reservationNumber : null;
  } catch (e) {
    return null;
  }
}

/* ============================================================
   MOCK 상품 데이터
   - selectOptions : 선택형 (드롭다운) — 가격 차이 가능
   - inputOptions  : 입력형 (text input)
   ============================================================ */
let PRODUCT = {
  id: 201,
  name: '에버랜드 1Day 자유이용권',
  thumbnail: 'https://search.pstatic.net/common/?autoRotate=true&quality=95&type=w750&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20260515_178%2F1778806505535pGR1C_JPEG%2FIMG_5956.jpg',
  basePrice: 67000,
  brand: '에버랜드',
  category: '테마파크 · 입장권',
  selectOptions: [
    {
      id: 'ticketType',
      name: '권종',
      required: true,
      values: [
        { value: 'adult',  label: '대인 (만 19~64세)' },
        { value: 'youth',  label: '청소년 (만 13~18세)' },
        { value: 'child',  label: '소인 (만 36개월~12세)' },
        { value: 'senior', label: '경로 (만 65세 이상)' }
      ]
    },
    {
      id: 'period',
      name: '이용 시간',
      required: true,
      values: [
        { value: 'allday',    label: '종일권 (10:00 ~ 22:00)' },
        { value: 'afternoon', label: '오후권 (15:00 ~ 22:00)' },
        { value: 'night',     label: '야간권 (17:00 ~ 22:00)' }
      ]
    },
    {
      id: 'addons',
      name: '부가 서비스',
      required: true,
      values: [
        { value: 'none',      label: '선택 없음' },
        { value: 'qpass',     label: 'Q-PASS 프리미엄 (놀이기구 우선 탑승)' },
        { value: 'meal',      label: '식사 쿠폰 1매' },
        { value: 'qpassmeal', label: 'Q-PASS + 식사 쿠폰' }
      ]
    }
  ],
  inputOptions: [
    {
      id: 'note',
      name: '예약 메모',
      required: false,
      maxLength: 50,
      placeholder: '내용을 입력해주세요'
    }
  ]
};

/* 상태
   selectValues : 현재 dropdown 선택 중인 값 (추가 전 임시)
   combinations : 추가된 조합 목록 — [{ id, selectValues, qty }, ...]
   inputValues  : 입력형 옵션 (전 주문 공통)
*/
const STATE = {
  selectValues: {},
  combinations: [],
  inputValues: {},
  visitDate: ''   // 상품상세(?date=) 또는 직행 예약의 날짜 선택에서 채움
};
PRODUCT.selectOptions.forEach(o => { STATE.selectValues[o.id] = ''; });
PRODUCT.inputOptions.forEach(o => { STATE.inputValues[o.id] = ''; });

/* ============================================================
   백엔드 상품 로드 — ?id 의 실 상품(product-service)을 받아 PRODUCT 로 매핑.
   상품상세(product-detail) → checkout-product 의 상품 불일치 해소. 실패/부재 시 mock 유지.
   ============================================================ */
function _cpProductId() {
  const v = parseInt(new URLSearchParams(location.search).get('id'), 10);
  return Number.isFinite(v) && v > 0 ? v : null;
}
function mapBackendProduct(d) {
  const og = d.optionGroups || [];
  const to = (d.textOptions || d.textOptionGroups || []).filter(t => t.visible !== false);
  const prices = (d.priceMatrix || []).map(m => Number(m.salePrice)).filter(n => Number.isFinite(n) && n > 0);
  const basePrice = prices.length ? Math.min(...prices) : 0;
  const img = d.thumbnailUrl
    ? (/^https?:/.test(d.thumbnailUrl)
        ? d.thumbnailUrl
        : (typeof TMS_API_BASE !== 'undefined'
            ? TMS_API_BASE + d.thumbnailUrl
            : 'images/' + d.thumbnailUrl.split('/').pop()))   // 정적 목업: 로컬 images/ 폴더
    : '';
  return {
    id: d.id,
    name: d.name,
    thumbnail: img,
    basePrice,
    brand: d.vendorName || '',
    category: d.regionName || d.category || '',
    selectOptions: og.map(g => ({
      id: 'og_' + g.id,
      name: g.name,
      required: g.groupType === 'REQUIRED',
      values: (g.values || []).map(v => ({ value: v, label: v }))
    })),
    inputOptions: to.map(t => ({ id: 'to_' + t.id, name: t.name, required: false, placeholder: '내용을 입력해주세요' })),
    bookingNoticeKo: d.bookingNoticeKo || '',
    refundPolicyKo: d.refundPolicyKo || ''
  };
}
function _applyProduct(d) {
  PRODUCT = mapBackendProduct(d);
  // 새 옵션 기준으로 STATE 재초기화
  STATE.selectValues = {};
  STATE.inputValues = {};
  STATE.combinations = [];
  PRODUCT.selectOptions.forEach(o => { STATE.selectValues[o.id] = ''; });
  PRODUCT.inputOptions.forEach(o => { STATE.inputValues[o.id] = ''; });
  const date = new URLSearchParams(location.search).get('date');
  if (date) STATE.visitDate = date;
  return true;
}
async function applyBackendProduct() {
  const id = _cpProductId();
  // 1) 백엔드(product-service) 우선 — TMS_API_BASE 설정 시
  if (id != null && typeof TMS_API_BASE !== 'undefined') {
    try {
      const res = await fetch(`${TMS_API_BASE}/api/products/${id}`);
      if (res.ok) {
        const json = await res.json();
        const d = json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
        if (d && d.id) return _applyProduct(d);
      }
    } catch (e) { /* 로컬 폴백으로 진행 */ }
  }
  // 2) 정적 목업 — data/product-detail.js(productApiResponse)의 상품 사용
  if (typeof productApiResponse !== 'undefined' && productApiResponse && productApiResponse.data) {
    return _applyProduct(productApiResponse.data);
  }
  return false;   // 데이터 없음 → mock(에버랜드) 유지
}

let _comboSeq = 0;

/* ============================================================
   결제수단 (재사용 데이터)
   ============================================================ */
const PAYMENT_METHODS = [
  { id: 'card',     label: '신용카드',     brand: '카드', color: '#0F172A' },
  { id: 'kakaopay', label: '카카오페이',   brand: 'K',    color: '#FEE500', text: '#3C1E1E' },
  { id: 'naverpay', label: '네이버페이',   brand: 'N',    color: '#03C75A' }
];
let SELECTED_PM = 'card';

/* ============================================================
   RENDER — 상품 정보 카드
   ============================================================ */
function renderProductInfo() {
  const host = document.getElementById('copProductInfo');
  const fb = `https://picsum.photos/seed/everland-${PRODUCT.id}/800/600`;
  host.innerHTML = `
    <div class="co-product-card">
      <div class="co-product-thumb">
        <img src="${_esc(PRODUCT.thumbnail || fb)}" alt="${_esc(PRODUCT.name)}" onerror="this.onerror=null;this.src='${fb}';">
      </div>
      <div class="co-product-meta">
        <h3 class="co-product-name">${_esc(PRODUCT.name)}</h3>
        <div class="co-product-date-row">
          <span class="co-product-date-label">이용일</span>
          <span class="co-product-date-value">${_esc(STATE.visitDate || '-')}</span>
        </div>
      </div>
    </div>
  `;
  // 이용일은 상품 상세에서 선택되어 넘어온 값을 그대로 표시 (편집 불가)
}

/* ============================================================
   RENDER — 이용안내 / 환불규정 (상품 데이터 기반)
   ============================================================ */
function renderNotices() {
  const n    = document.getElementById('copNotice');
  const r    = document.getElementById('copRefund');
  const nSec = document.getElementById('copNoticeSection');
  const rSec = document.getElementById('copRefundSection');
  const notice = (PRODUCT.bookingNoticeKo || '').trim();
  const refund = (PRODUCT.refundPolicyKo  || '').trim();
  if (n) n.innerHTML = notice;
  if (r) r.innerHTML = refund;
  // 데이터가 없으면 해당 섹션 숨김
  if (nSec) nSec.hidden = !notice;
  if (rSec) rSec.hidden = !refund;
}

/* ============================================================
   RENDER — 선택형 옵션 (dropdown)
   ============================================================ */
function renderOptions() {
  const host = document.getElementById('copOptions');
  const caretSvg = `<svg class="co-addon-select-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

  host.innerHTML = PRODUCT.selectOptions.map(opt => {
    const cur = STATE.selectValues[opt.id];
    const curVal = opt.values.find(v => v.value === cur);
    const placeholder = `${opt.name} 선택`;
    const label = curVal ? curVal.label : placeholder;
    return `
      <div class="co-option-row">
        <label class="co-option-label">
          ${_esc(opt.name)}
        </label>
        <div class="co-addon-select-wrap">
          <button type="button" class="co-addon-select" data-opt-trigger="${_esc(opt.id)}" aria-haspopup="listbox" aria-expanded="false">
            <span class="${curVal ? 'co-option-selected' : 'co-addon-select-placeholder'}">${_esc(label)}</span>
            ${caretSvg}
          </button>
          <ul class="co-addon-select-menu" data-opt-menu="${_esc(opt.id)}" role="listbox" hidden>
            ${opt.values.map(v => `
              <li role="option" class="co-addon-select-option" data-opt-pick="${_esc(opt.id)}" data-opt-value="${_esc(v.value)}">
                <span class="co-addon-select-option-name">${_esc(v.label)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }).join('');

  // dropdown 토글
  host.querySelectorAll('[data-opt-trigger]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.optTrigger;
      const menu = host.querySelector(`[data-opt-menu="${id}"]`);
      if (!menu) return;
      const willOpen = menu.hidden;
      host.querySelectorAll('.co-addon-select-menu').forEach(m => { m.hidden = true; });
      host.querySelectorAll('[data-opt-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
      if (willOpen) {
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // 옵션 선택 — 모든 필수 채워지면 자동 추가 + 초기화
  host.querySelectorAll('[data-opt-pick]').forEach(opt => {
    opt.addEventListener('click', () => {
      const id  = opt.dataset.optPick;
      const val = opt.dataset.optValue;
      STATE.selectValues[id] = val;
      if (isAddable()) {
        addCombination();
        // 다음 조합 입력을 위해 선택값 초기화
        PRODUCT.selectOptions.forEach(o => { STATE.selectValues[o.id] = ''; });
      }
      renderOptions();
    });
  });
}

/* ============================================================
   RENDER — 입력형 옵션 (text input) — 상품 카드 맨 하단
   ============================================================ */
function renderInputs() {
  const host = document.getElementById('copInputs');
  if (!host) return;
  host.innerHTML = PRODUCT.inputOptions.map(opt => {
    const cur = STATE.inputValues[opt.id] || '';
    const help = opt.help ? `<div class="co-option-help">${_esc(opt.help)}</div>` : '';
    return `
      <div class="co-option-row">
        <label class="co-option-label">
          ${_esc(opt.name)}${opt.required ? ' <span class="co-option-req">필수</span>' : ''}
        </label>
        <input type="text" class="co-option-input" data-opt-input="${_esc(opt.id)}" placeholder="${_esc(opt.placeholder || '')}" maxlength="${opt.maxLength}" value="${_esc(cur)}">
        ${help}
      </div>
    `;
  }).join('');

  host.querySelectorAll('[data-opt-input]').forEach(input => {
    input.addEventListener('input', () => {
      const id = input.dataset.optInput;
      STATE.inputValues[id] = input.value;
      updateTotal();
      renderSummary();
    });
  });
}

/* ============================================================
   조합 추가 / 삭제 / 수량 조절 — 모든 선택 옵션이 채워지면 자동 추가
   ============================================================ */
function isAddable() {
  return PRODUCT.selectOptions.every(o => !o.required || STATE.selectValues[o.id]);
}
function comboLabel(combo) {
  return PRODUCT.selectOptions.map(opt => {
    const v = opt.values.find(vv => vv.value === combo.selectValues[opt.id]);
    return v ? v.label : null;
  }).filter(Boolean).join(' · ');
}
function isSameSelection(a, b) {
  return PRODUCT.selectOptions.every(o => a[o.id] === b[o.id]);
}
function addCombination() {
  if (!isAddable()) return;
  // 동일한 옵션 조합이 이미 있으면 수량만 증가
  const existing = STATE.combinations.find(c => isSameSelection(c.selectValues, STATE.selectValues));
  if (existing) {
    existing.qty = Math.min(99, (existing.qty || 1) + 1);
  } else {
    STATE.combinations.push({
      id: `combo_${++_comboSeq}`,
      selectValues: { ...STATE.selectValues },
      qty: 1
    });
  }
  renderCombos();
  updateTotal();
  renderSummary();
}
function renderCombos() {
  const host = document.getElementById('copCombos');
  if (!host) return;
  if (!STATE.combinations.length) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML = STATE.combinations.map(c => `
    <div class="co-combo-row" data-combo-id="${_esc(c.id)}">
      <div class="co-combo-info">
        <span class="co-combo-name">${_esc(comboLabel(c))}</span>
        <span class="co-combo-unit-price">${_fmt(PRODUCT.basePrice)} / 1매</span>
      </div>
      <div class="bk-qty-stepper">
        <button type="button" class="bk-qty-btn" data-combo-delta="-1" data-combo-id="${_esc(c.id)}" aria-label="감소" ${c.qty <= 1 ? 'disabled' : ''}>−</button>
        <span class="bk-qty-count">${c.qty}</span>
        <button type="button" class="bk-qty-btn" data-combo-delta="1" data-combo-id="${_esc(c.id)}" aria-label="증가">+</button>
      </div>
      <button type="button" class="co-combo-remove" data-combo-remove="${_esc(c.id)}" aria-label="삭제">×</button>
    </div>
  `).join('');

  host.querySelectorAll('[data-combo-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.comboId;
      const d  = parseInt(btn.dataset.comboDelta, 10);
      const c  = STATE.combinations.find(x => x.id === id);
      if (!c) return;
      c.qty = Math.max(1, Math.min(99, c.qty + d));
      renderCombos();
      updateTotal();
      renderSummary();
    });
  });
  host.querySelectorAll('[data-combo-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.comboRemove;
      STATE.combinations = STATE.combinations.filter(x => x.id !== id);
      renderCombos();
      updateTotal();
      renderSummary();
    });
  });
}

/* ============================================================
   RENDER — 결제수단
   ============================================================ */
function renderPaymentMethods() {
  const host = document.getElementById('copPaymentMethods');
  if (!host) return;
  host.innerHTML = `<div class="co-pm-list">${PAYMENT_METHODS.map(pm => `
      <label class="co-radio co-pm">
        <input type="radio" name="copm" value="${pm.id}" ${pm.id === SELECTED_PM ? 'checked' : ''}>
        <span class="co-radio-dot"></span>
        <span class="co-radio-label">${_esc(pm.label)}</span>
      </label>`).join('')}</div>`;
  host.querySelectorAll('input[name="copm"]').forEach(r => {
    r.addEventListener('change', () => {
      SELECTED_PM = r.value;
      updatePmLabel();
    });
  });
  updatePmLabel();
}
function updatePmLabel() {
  const el = document.getElementById('copPmLabel');
  if (!el) return;
  const pm = PAYMENT_METHODS.find(p => p.id === SELECTED_PM);
  el.textContent = pm ? pm.label : '';
}

/* ============================================================
   RENDER — 우측 사이드바 (주문 정보)
   ============================================================ */
function renderSummary() {
  const host = document.getElementById('copSummaryProduct');
  const selectedInputs = PRODUCT.inputOptions
    .map(opt => {
      const val = STATE.inputValues[opt.id];
      return val && val.trim() ? { name: opt.name, value: val } : null;
    })
    .filter(Boolean);

  const specRows = STATE.combinations.length > 0
    ? STATE.combinations.map(c => `
        <div>
          <span>${_esc(comboLabel(c))} × ${c.qty}</span>
          <strong>${_fmt(PRODUCT.basePrice * c.qty)}</strong>
        </div>
      `).join('')
    : `<div class="co-sum-empty">옵션을 선택해주세요.</div>`;

  const inputSection = selectedInputs.length > 0 ? `
    <div class="co-sum-addons">
      <div class="co-sum-addons-label">예약 정보</div>
      ${selectedInputs.map(o => `
        <div class="co-sum-addon-row info">
          <span class="co-sum-addon-name">${_esc(o.name)}</span>
          <strong>${_esc(o.value)}</strong>
        </div>
      `).join('')}
    </div>
  ` : '';

  const dateHead = STATE.visitDate ? `
    <div class="co-sum-head">
      <span class="co-journey-chip">이용일</span>
      <span class="co-sum-date">${_esc(STATE.visitDate)}</span>
    </div>
  ` : '';

  host.innerHTML = `
    <div class="co-sum-journey">
      ${dateHead}
      <div class="co-sum-route-name">${_esc(PRODUCT.name)}</div>
      <div class="co-sum-spec">
        ${specRows}
      </div>
      ${inputSection}
    </div>
  `;
}

/* ============================================================
   합계 + 결제 버튼 상태 — 조합 기반
   ============================================================ */
function calcTotal() {
  return STATE.combinations.reduce((sum, c) => sum + PRODUCT.basePrice * c.qty, 0);
}
function updateTotal() {
  const total = calcTotal();
  document.getElementById('copTotal').textContent = _fmt(total);
  const hasCombo = STATE.combinations.length > 0;
  const allInputs = PRODUCT.inputOptions.every(o => !o.required || (STATE.inputValues[o.id] || '').trim().length > 0);
  const ok = hasCombo && allInputs;
  document.querySelectorAll('#copPayBtn, #copMobilePayBtn').forEach(btn => {
    btn.disabled = !ok;
    if (!hasCombo) btn.textContent = '옵션을 선택해주세요.';
    else if (!allInputs) btn.textContent = '필수 입력 정보를 입력하세요';
    else btn.textContent = '결제하기';
  });
}

/* ============================================================
   국가 코드 (전화번호 prefix) — checkout.js 와 동일 데이터
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
  const menu = document.getElementById('copPhoneCcMenu');
  if (!menu) return;
  menu.innerHTML = COUNTRY_CODES.map((c, i) => `
    <li class="co-phone-cc-item${c.code === SELECTED_CC.code ? ' active' : ''}" role="option" data-cc="${i}">
      <span class="co-phone-cc-flag">${c.flag}</span>
      <span class="co-phone-cc-name">${_esc(c.name)}</span>
      <span class="co-phone-cc-code">${_esc(c.code)}</span>
    </li>
  `).join('');
  menu.querySelectorAll('[data-cc]').forEach(li => {
    li.addEventListener('click', () => {
      SELECTED_CC = COUNTRY_CODES[parseInt(li.dataset.cc, 10)];
      document.getElementById('copPhoneCcFlag').textContent = SELECTED_CC.flag;
      document.getElementById('copPhoneCcCode').textContent = SELECTED_CC.code;
      closeCountryMenu();
      renderCountryMenu();
    });
  });
}
function openCountryMenu() {
  const menu = document.getElementById('copPhoneCcMenu');
  const btn  = document.getElementById('copPhoneCcBtn');
  if (menu) menu.hidden = false;
  if (btn)  btn.setAttribute('aria-expanded', 'true');
}
function closeCountryMenu() {
  const menu = document.getElementById('copPhoneCcMenu');
  const btn  = document.getElementById('copPhoneCcBtn');
  if (menu) menu.hidden = true;
  if (btn)  btn.setAttribute('aria-expanded', 'false');
}

/* ============================================================
   외부 클릭 / Esc — dropdown 닫기 + 시트 닫기
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await applyBackendProduct();  // ?id 실 상품 로드 (실패 시 mock 유지)
  renderProductInfo();
  renderNotices();
  renderOptions();
  renderCombos();
  renderInputs();
  renderCountryMenu();
  renderPaymentMethods();
  renderSummary();
  updateTotal();

  // 국가 코드 dropdown
  const ccBtn = document.getElementById('copPhoneCcBtn');
  if (ccBtn) {
    ccBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('copPhoneCcMenu');
      if (menu && menu.hidden) openCountryMenu(); else closeCountryMenu();
    });
  }
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('copPhoneWrap');
    if (wrap && !wrap.contains(e.target)) closeCountryMenu();
  });

  // 옵션 dropdown 외부 클릭 닫기
  document.addEventListener('click', (e) => {
    if (e.target.closest('.co-addon-select-wrap')) return;
    document.querySelectorAll('.co-addon-select-menu').forEach(m => { m.hidden = true; });
    document.querySelectorAll('[data-opt-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.co-addon-select-menu').forEach(m => { m.hidden = true; });
      document.querySelectorAll('[data-opt-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
      closeCountryMenu();
    }
  });

  // 결제 버튼 → 주문 정보 sessionStorage 저장 후 booking-complete.html 로 이동
  const payBtn = document.getElementById('copPayBtn');
  payBtn?.addEventListener('click', async () => {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    let orderNum = `EVL-${ymd}-${rand}`;   // 백엔드 발번 실패 시 폴백
    const pm = PAYMENT_METHODS.find(p => p.id === SELECTED_PM);
    const inputs = PRODUCT.inputOptions
      .map(opt => {
        const val = STATE.inputValues[opt.id];
        return val && val.trim() ? { name: opt.name, value: val } : null;
      })
      .filter(Boolean);
    const orderData = {
      source: 'product',
      orderNum,
      payment: pm ? { id: pm.id, label: pm.label } : null,
      total: calcTotal(),
      product: {
        name: PRODUCT.name,
        visitDate: STATE.visitDate || '',
        combinations: STATE.combinations.map(c => ({
          label: comboLabel(c),
          qty: c.qty,
          price: PRODUCT.basePrice
        })),
        inputs,
        bookingNoticeKo: PRODUCT.bookingNoticeKo || '',
        refundPolicyKo:  PRODUCT.refundPolicyKo  || ''
      },
      buyer: {
        lastName:  document.getElementById('copLast')?.value || '',
        firstName: document.getElementById('copFirst')?.value || '',
        phoneCode: document.getElementById('copPhoneCcCode')?.textContent || '',
        phone:     document.getElementById('copPhone')?.value || '',
        email:     document.getElementById('copEmail')?.value || ''
      }
    };
    // order-service 로 주문 생성 → 서버 발번 reservationNumber 사용 (실패 시 클라이언트 번호 폴백)
    const serverNum = await submitProductOrderToBackend(orderData);
    if (serverNum) {
      orderNum = serverNum;
      orderData.orderNum = serverNum;
    }
    try { sessionStorage.setItem('TMS_ORDER', JSON.stringify(orderData)); } catch (e) {}
    window.location.href = `booking-complete.html?order=${encodeURIComponent(orderNum)}`;
  });

  // === 모바일 바텀시트 ===
  const sidebar       = document.getElementById('copSidebar');
  const sheetBackdrop = document.getElementById('copSheetBackdrop');
  const mobilePayBtn  = document.getElementById('copMobilePayBtn');
  const sheetCloseBtn = document.getElementById('copSheetClose');
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
