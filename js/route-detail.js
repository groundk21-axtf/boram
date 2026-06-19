/* route-detail.js — 순환노선 상세 페이지
 * /json 폴더의 8개 JSON 파일을 fetch 하여 화면 구성.
 * 실 API 연동 시: fetch('json/route.json') → fetch('http://api.tms2.net:9080/route-service/api/...').
 */

/* 이미지 base — API 응답의 imageUrl 은 "/api/images/images/{uuid}.jpg" 형태.
   로컬 mockup 에서는 실 서버에 도달 불가하므로 onerror fallback 으로 picsum 사용. */
const IMAGE_BASE = 'http://192.168.219.170:9080';
function resolveImage(url) {
  if (!url) return '';
  if (/^https?:/.test(url)) return url;
  return IMAGE_BASE + url;
}
function picsumFallback(seed, w = 800, h = 600) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function _attrEsc(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }
function fmtPrice(v) { return '₩ ' + Number(v).toLocaleString('ko-KR'); }
function fmtTime(t) { return t ? t.slice(0, 5) : ''; }  // "09:30:00" → "09:30"

/* ============================================================
   ICONS
   ============================================================ */
const ICN = {
  map:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  external:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  clock:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  distance:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="12" r="2" fill="currentColor"/></svg>`,
  subway:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 5 4 5 8v6a5 5 0 0 0 4 4.9V20l-2 2v.5h10V22l-2-2v-1.1A5 5 0 0 0 19 14V8c0-4-2-6-7-6zm-3.5 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 11H6V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3z"/></svg>`,
  pin:        `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`,
  calendar:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
};

/* ============================================================
   데이터 로딩
   ============================================================ */
const DATA = {};

async function loadAll() {
  const files = ['route', 'transports', 'destination', 'routestop', 'stations', 'fares', 'segments', 'schedules'];
  const results = await Promise.all(files.map(async name => {
    const res = await fetch(`json/${name}.json`);
    if (!res.ok) throw new Error(`json/${name}.json: ${res.status}`);
    return await res.json();
  }));
  results.forEach((r, i) => { DATA[files[i]] = r; });
}

/* ============================================================
   인덱스 정리
   ============================================================ */
function buildIndex() {
  DATA.route = DATA.route.data.content[0];      // 단건
  DATA.transports = DATA.transports.data;
  DATA.destination = DATA.destination.data;
  DATA.routestop = DATA.routestop.data;
  DATA.stations = DATA.stations.data;
  DATA.fares = DATA.fares.data;
  DATA.segments = DATA.segments.data;
  DATA.schedules = DATA.schedules.data;

  // station id → object
  DATA.stationById = {};
  DATA.stations.forEach(st => { DATA.stationById[st.id] = st; });
}

/* ============================================================
   RENDER — 헤더
   ============================================================ */
function renderHeader() {
  const route = DATA.route;
  const dest = DATA.destination;
  const transport = DATA.transports[0] || {};

  document.getElementById('rdTitle').textContent = route.nameKo;
  document.title = route.nameKo;
  document.getElementById('rdIntro').textContent = dest.intro || '';

  // 지역 표시 — 첫 station 의 locationRegionName 사용 (product-detail.pd-meta-link 와 동일 톤)
  const regionEl = document.getElementById('rdRegion');
  if (regionEl) {
    const region = (DATA.stations && DATA.stations[0] && DATA.stations[0].locationRegionName) || '';
    const pinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    regionEl.innerHTML = region ? `${pinSvg}${escapeHtml(region)}` : '';
    regionEl.hidden = !region;
  }

  const imgs = (dest.images || []).slice(0, 5);
  const heroEl = document.getElementById('rdHero');
  heroEl.className = 'rd-hero';
  if (!imgs.length) {
    heroEl.innerHTML = '';
    heroEl.hidden = true;
    return;
  }
  heroEl.hidden = false;
  heroEl.style.setProperty('--hero-idx', 0);

  const slidesHtml = imgs.map((img, i) => {
    const src = resolveImage(img.url);
    const fb = picsumFallback(`route-${route.id}-${i}`, 1200, 900);
    return `
      <div class="rd-hero-slide">
        <img src="${escapeHtml(src || fb)}" alt="${escapeHtml(route.nameKo)} ${i + 1}" loading="lazy"
             onerror="this.onerror=null;this.src='${_attrEsc(fb)}';">
      </div>`;
  }).join('');

  const multi = imgs.length > 1;
  const nextBtnHtml = multi ? `
    <button class="rd-hero-next" type="button" data-hero-next aria-label="다음 이미지">
      <span>NEXT</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>` : '';
  const dotsHtml = multi ? `
    <div class="rd-hero-dots">
      ${imgs.map((_, i) => `<button class="rd-hero-dot${i === 0 ? ' active' : ''}" type="button" data-hero-idx="${i}" aria-label="이미지 ${i + 1}"></button>`).join('')}
    </div>` : '';

  heroEl.innerHTML = `<div class="rd-hero-track">${slidesHtml}</div>${nextBtnHtml}${dotsHtml}`;

  // NEXT / dot 클릭
  heroEl.addEventListener('click', e => {
    if (e.target.closest('[data-hero-next]')) {
      setHeroIdx(HERO_IDX + 1);
      resetHeroTimer();
    } else if (e.target.matches('[data-hero-idx]')) {
      setHeroIdx(parseInt(e.target.dataset.heroIdx, 10));
      resetHeroTimer();
    }
  });
}

/* hero carousel — 인덱스 / 자동 회전 */
let HERO_IDX = 0;
let HERO_TIMER = null;
function setHeroIdx(idx) {
  const heroEl = document.getElementById('rdHero');
  const slides = heroEl.querySelectorAll('.rd-hero-slide');
  if (slides.length <= 1) return;
  HERO_IDX = ((idx % slides.length) + slides.length) % slides.length;
  heroEl.style.setProperty('--hero-idx', HERO_IDX);
  heroEl.querySelectorAll('.rd-hero-dot').forEach((d, i) => d.classList.toggle('active', i === HERO_IDX));
}
function startHeroAutoRotate() {
  if (HERO_TIMER) clearInterval(HERO_TIMER);
  HERO_TIMER = setInterval(() => {
    const heroEl = document.getElementById('rdHero');
    if (!heroEl || heroEl.hidden) return;
    if (heroEl.matches(':hover')) return;
    setHeroIdx(HERO_IDX + 1);
  }, 5000);
}
function resetHeroTimer() {
  if (HERO_TIMER) { clearInterval(HERO_TIMER); startHeroAutoRotate(); }
}

/* ============================================================
   RENDER — 코스 설명 (destination.description rich HTML)
   ============================================================ */
function renderDescription() {
  document.getElementById('rdDescription').innerHTML = DATA.destination.description || '';
}

/* ============================================================
   RENDER — 운행 정보 테이블
   ============================================================ */
function renderInfoTable() {
  // 소요시간 — routestop[].travelTimeMinutes 합계 (없으면 90분 fallback)
  const totalMinutes = (DATA.routestop || []).reduce((sum, s) => sum + (Number(s.travelTimeMinutes) || 0), 0) || 90;
  // 경유지 — pickup·arrival 을 제외한 중간 정류장 수 (BOARDING_ALIGHTING)
  const stops = DATA.routestop || [];
  const midCount = stops.filter(s => s.stopType !== 'DEPARTURE' && s.stopType !== 'ARRIVAL').length;
  // 교통수단 — transport.serviceLevelName
  const transport = (DATA.transports && DATA.transports[0]) || {};
  const transportName = transport.serviceLevelName || transport.name || '-';

  const rows = [
    { label: '예상 소요시간', value: `${totalMinutes}분` },
    { label: '경유지',       value: midCount > 0 ? `${midCount}개` : '직행' },
    { label: '교통수단',     value: transportName }
  ];
  document.getElementById('rdInfoTable').innerHTML = `
    <div class="rd-info-grid">
      ${rows.map(r => `
        <div class="rd-info-cell">
          <span class="rd-info-label">${escapeHtml(r.label)}</span>
          <span class="rd-info-value">${escapeHtml(r.value)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ============================================================
   RENDER — 출발/도착 (.rd-title 하단)
   ============================================================ */
function renderRouteOd() {
  const host = document.getElementById('rdRouteOd');
  if (!host) return;
  const stops = DATA.routestop || [];
  if (!stops.length) { host.hidden = true; return; }
  const sorted = stops.slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const dep = sorted.find(s => s.stopType === 'DEPARTURE') || sorted[0];
  const arr = sorted.find(s => s.stopType === 'ARRIVAL') || sorted[sorted.length - 1];
  const fromName = dep?.stationNameKo || '-';
  const toName   = arr?.stationNameKo || '-';
  host.innerHTML = `
    <span class="rd-od-badge">출발</span>
    <span class="rd-od-station">${escapeHtml(fromName)}</span>
    <span class="rd-od-arrow">→</span>
    <span class="rd-od-badge arrival">도착</span>
    <span class="rd-od-station">${escapeHtml(toName)}</span>
  `;
  host.hidden = false;
}

/* ============================================================
   RENDER — 운영사 정보 (rd-main 하단)
   ============================================================ */
function renderOperatorInfo() {
  const host = document.getElementById('rdOperatorInfo');
  if (!host) return;
  const route = DATA.route || {};
  const name  = route.vendor || '그라운드케이';
  const phone = route.vendorPhone || '1588-1588';
  const email = route.vendorEmail || 'cs@groundk.com';
  const hours = route.vendorHours || '평일 09:00~18:00 (KST)';
  const buildSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01M9 13h.01M9 17h.01"/></svg>`;
  const phoneSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.84.6 2.8.72A2 2 0 0 1 22 16.92z"/></svg>`;
  const mailSvg  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>`;
  const clockSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const phoneHref = phone.replace(/[^0-9+]/g, '');
  host.innerHTML = `
    <div class="rd-operator-title">운영사 정보</div>
    <div class="rd-operator-grid">
      <div class="rd-operator-cell">
        <div class="rd-operator-icon">${buildSvg}</div>
        <div class="rd-operator-body">
          <span class="rd-operator-label">운영사</span>
          <span class="rd-operator-value">${escapeHtml(name)}</span>
        </div>
      </div>
      <div class="rd-operator-cell">
        <div class="rd-operator-icon">${phoneSvg}</div>
        <div class="rd-operator-body">
          <span class="rd-operator-label">고객센터</span>
          <a class="rd-operator-value rd-operator-link" href="tel:${escapeHtml(phoneHref)}">${escapeHtml(phone)}</a>
        </div>
      </div>
      <div class="rd-operator-cell">
        <div class="rd-operator-icon">${mailSvg}</div>
        <div class="rd-operator-body">
          <span class="rd-operator-label">이메일</span>
          <a class="rd-operator-value rd-operator-link" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
        </div>
      </div>
      <div class="rd-operator-cell">
        <div class="rd-operator-icon">${clockSvg}</div>
        <div class="rd-operator-body">
          <span class="rd-operator-label">운영시간</span>
          <span class="rd-operator-value">${escapeHtml(hours)}</span>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   RENDER — 요금 정보 요약 (.rd-top-left 안)
   ============================================================ */
function renderFareSummary() {
  const host = document.getElementById('rdFareSummary');
  if (!host) return;
  const fare = (DATA.fares && DATA.fares[0]) || {};
  const types = (fare.passengerTypes || []).filter(t => t.displayed !== false);
  const segments = DATA.segments || [];

  const items = types.map(pt => {
    const seg = segments.find(s => s.passengerTypeId === pt.id);
    const price = seg ? Number(seg.oneWayPrice) : 0;
    return { name: pt.nameKo, price };
  });

  host.innerHTML = `
    <div class="rd-fare-summary-label">요금 안내</div>
    <div class="rd-fare-summary-grid">
      ${items.map(it => `
        <div class="rd-fare-summary-row">
          <span class="rd-fare-summary-name">${escapeHtml(it.name)}</span>
          <span class="rd-fare-summary-price">${fmtMoney(it.price)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ============================================================
   RENDER — U-chart 한눈에 보기
   ============================================================ */
function renderOverview() {
  const stops = DATA.routestop;
  if (!stops.length) return;
  const names = stops.map(s => s.platformName);
  const total = names.length;
  const halfTop = Math.ceil(total / 2);
  const top = names.slice(0, halfTop);
  const bottom = names.slice(halfTop).reverse();

  const cell = (name, isAnchor, label) => `
    <div class="sr-uchart-stop${isAnchor ? ' anchor' : ''}">
      ${isAnchor ? `<span class="sr-uchart-badge">${label}</span>` : `<span class="sr-uchart-dot"></span>`}
      <span class="sr-uchart-name">${escapeHtml(name)}</span>
    </div>`;
  const topHtml    = top.map((n, i)    => cell(n, i === 0, '출발')).join('');
  const bottomHtml = bottom.map((n, i) => cell(n, i === 0, '도착')).join('');

  // 모바일용 세로 리스트 — search-results.html 의 sr-card-route-uchart-list 와 동일 구조
  const listStopHtml = (s, kind) => {
    const marker = kind === 'pickup'  ? `<span class="sr-uchart-badge">출발</span>`
                 : kind === 'arrival' ? `<span class="sr-uchart-badge">도착</span>`
                 :                       `<span class="sr-uchart-list-dot"></span>`;
    return `
      <div class="sr-uchart-list-stop ${kind}">
        <div class="sr-uchart-list-marker">${marker}</div>
        <span class="sr-card-stop-text">
          <span class="sr-card-stop-name">${escapeHtml(s.platformName)}</span>
        </span>
      </div>`;
  };
  const listHtml = stops.map((s, i) => {
    const kind = i === 0 ? 'pickup' : i === stops.length - 1 ? 'arrival' : 'mid';
    return listStopHtml(s, kind);
  }).join('');

  document.getElementById('rdOverview').innerHTML = `
    <div class="sr-card-route sr-card-route-uchart" style="--uc-cells:${top.length}">
      <div class="sr-uchart-frame" aria-hidden="true"></div>
      <div class="sr-uchart-row top"    style="--uc-cells:${top.length}">${topHtml}</div>
      <div class="sr-uchart-row bottom" style="--uc-cells:${bottom.length}">${bottomHtml}</div>
    </div>
    <div class="sr-card-route-uchart-list">${listHtml}</div>
  `;
}

/* ============================================================
   RENDER — 정류장 상세 카드 (실 데이터)
   ============================================================ */
function renderStops() {
  const host = document.getElementById('rdStops');
  // 시작=종착 정류장 중복 제거 — 마지막 stop 이 첫 stop 과 같은 station 이면 한 번만 표시
  const all = DATA.routestop;
  const uniqueStops = all.filter((s, i) => {
    if (i === 0) return true;
    if (i === all.length - 1 && s.stationId === all[0].stationId) return false;
    return true;
  });
  host.innerHTML = uniqueStops.map((stop, idx) => {
    const station = DATA.stationById[stop.stationId] || {};
    const platform = (station.platforms || []).find(p => p.id === stop.platformId) || (station.platforms || [])[0] || {};

    // 배너 이미지 — station.images 우선, 없으면 station.imageUrl / platform.imageUrl
    let images = (station.images || []).map(i => i.url).filter(Boolean);
    if (!images.length && station.imageUrl) images = [station.imageUrl];
    if (!images.length && platform.imageUrl) images = [platform.imageUrl];

    const slidesHtml = (images.length ? images : [null]).map((url, i) => {
      const src = url ? resolveImage(url) : '';
      const fb = picsumFallback(`station-${stop.stationId}-${i}`, 1200, 600);
      return `
        <div class="rd-stop-slide${i === 0 ? ' active' : ''}">
          <img src="${escapeHtml(src || fb)}" alt="${escapeHtml(stop.stationNameKo)} ${i + 1}" loading="lazy"
               onerror="this.onerror=null;this.src='${_attrEsc(fb)}';">
        </div>`;
    }).join('');

    const dotsHtml = images.length > 1 ? `
      <button class="rd-stop-banner-nav prev" type="button" data-banner-prev aria-label="이전 이미지">‹</button>
      <button class="rd-stop-banner-nav next" type="button" data-banner-next aria-label="다음 이미지">›</button>
      <div class="rd-stop-banner-dots">
        ${images.map((_, i) => `<button class="rd-stop-banner-dot${i === 0 ? ' active' : ''}" type="button" data-banner-idx="${i}" aria-label="이미지 ${i + 1}"></button>`).join('')}
      </div>` : '';

    const isDeparture = stop.stopType === 'DEPARTURE';
    const isArrival   = stop.stopType === 'ARRIVAL';
    const typeClass = isDeparture ? 'departure' : isArrival ? 'arrival' : 'mid';

    const accessHtml = platform.intro ? `
      <div class="rd-stop-access">
        ${ICN.pin}<span>${escapeHtml(platform.intro)}</span>
      </div>` : '';

    const descHtml = station.description ? `<div class="rd-rich rd-stop-desc">${station.description}</div>` : '';

    return `
      <article class="rd-stop-card ${typeClass}" id="rd-stop-${stop.sequence}" data-stop-id="${stop.id}" data-station-id="${stop.stationId}">
        <div class="rd-stop-top">
          <div class="rd-stop-banner" data-image-count="${images.length || 1}">
            <div class="rd-stop-banner-track">${slidesHtml}</div>
            ${dotsHtml}
            <div class="rd-stop-fabs">
              <button class="rd-stop-fab yellow" type="button" data-stop-info-id="${stop.stationId}" data-platform-id="${stop.platformId}" aria-label="정류장 보기">
                ${ICN.pin}
                <span>정류장 보기</span>
              </button>
            </div>
          </div>

          <div class="rd-stop-head">
            <div class="rd-stop-head-left">
              <h3 class="rd-stop-name">${escapeHtml(stop.stationNameKo)}</h3>
              ${station.intro ? `<p class="rd-stop-intro">${escapeHtml(station.intro)}</p>` : ''}
            </div>
            ${accessHtml}
          </div>
        </div>

        ${descHtml || `<p class="rd-stop-desc-empty">등록된 정류장 설명이 없습니다.</p>`}
      </article>`;
  }).join('');

  // 배너 carousel — 이벤트 위임
  host.addEventListener('click', handleBannerNav);

  // 정류장 보기 버튼 클릭 → 정류장 안내 모달
  host.addEventListener('click', e => {
    const btn = e.target.closest('[data-stop-info-id]');
    if (!btn) return;
    openStopInfoModal(parseInt(btn.dataset.stopInfoId, 10), parseInt(btn.dataset.platformId, 10));
  });
}

/* ============================================================
   정류장 안내 모달 — search-results.css 의 sr-stop-modal 재사용
   ============================================================ */
function openStopInfoModal(stationId, platformId) {
  const station = DATA.stationById[stationId];
  if (!station) return;
  const platform = (station.platforms || []).find(p => p.id === platformId) || (station.platforms || [])[0] || {};

  // 이미지 우선순위: platform.imageUrl → station.images[0] → station.imageUrl
  const imgRaw = platform.imageUrl
                || (station.images && station.images[0] && station.images[0].url)
                || station.imageUrl
                || '';
  const imgSrc = resolveImage(imgRaw);
  const fb = picsumFallback(`station-${stationId}-modal`, 800, 600);

  // Google Maps — lat/lng 좌표 우선, 없으면 주소·이름으로 검색
  const mapUrl = platform.lat && platform.lng
    ? `https://www.google.com/maps/search/?api=1&query=${platform.lat},${platform.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(platform.address || station.nameKo)}`;

  const modal = document.getElementById('srStopModal');
  modal.innerHTML = `
    <div class="sr-stop-modal" role="dialog" aria-modal="true" aria-labelledby="rdStopModalTitle">
      <button class="sr-stop-close" type="button" data-stop-close aria-label="닫기">×</button>
      <div class="sr-stop-head">
        <h3 id="rdStopModalTitle">${escapeHtml(station.nameKo)}</h3>
        ${platform.address ? `<div class="rd-stop-modal-address">${escapeHtml(platform.address)}</div>` : ''}
      </div>
      <div class="sr-stop-scroll">
        <div class="sr-stop-image">
          <img src="${escapeHtml(imgSrc || fb)}" alt="${escapeHtml(station.nameKo)}"
               onerror="this.onerror=null;this.src='${_attrEsc(fb)}';">
        </div>
        <div class="sr-stop-body">
          ${platform.name ? `<div class="sr-stop-subtitle">${escapeHtml(platform.name)}</div>` : ''}
          ${platform.intro ? `<div class="sr-stop-detail">${escapeHtml(platform.intro)}</div>` : ''}
          ${platform.description ? `<div class="sr-stop-detail">${platform.description}</div>` : ''}
        </div>
      </div>
      <div class="sr-stop-footer">
        <a class="sr-stop-map-btn" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener">지도에서 보기</a>
      </div>
    </div>`;
  modal.classList.add('open');
  modal.querySelectorAll('[data-stop-close]').forEach(b => b.addEventListener('click', closeStopInfoModal));
  modal.addEventListener('click', e => { if (e.target === modal) closeStopInfoModal(); });
  document.addEventListener('keydown', stopEscHandler);
}
function stopEscHandler(e) { if (e.key === 'Escape') closeStopInfoModal(); }
function closeStopInfoModal() {
  const modal = document.getElementById('srStopModal');
  modal.classList.remove('open');
  document.removeEventListener('keydown', stopEscHandler);
}

/* 배너 carousel — slide 인덱스 전환 */
function setBannerSlide(banner, nextIdx) {
  const slides = banner.querySelectorAll('.rd-stop-slide');
  if (!slides.length) return;
  const idx = ((nextIdx % slides.length) + slides.length) % slides.length;
  const dots = banner.querySelectorAll('.rd-stop-banner-dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function handleBannerNav(e) {
  const banner = e.target.closest('.rd-stop-banner');
  if (!banner) return;
  const slides = banner.querySelectorAll('.rd-stop-slide');
  if (slides.length <= 1) return;
  const activeIdx = Array.from(slides).findIndex(s => s.classList.contains('active'));

  if (e.target.closest('[data-banner-prev]')) setBannerSlide(banner, activeIdx - 1);
  else if (e.target.closest('[data-banner-next]')) setBannerSlide(banner, activeIdx + 1);
  else if (e.target.matches('[data-banner-idx]')) setBannerSlide(banner, parseInt(e.target.dataset.bannerIdx, 10));
  else return;

  // 사용자 조작 후 자동 회전 타이머 reset (인터벌은 다음 5초 후부터 다시)
  if (BANNER_TIMER) { clearInterval(BANNER_TIMER); startBannerAutoRotate(); }
}

/* 5초마다 모든 배너 자동 다음 슬라이드 (호버 중인 배너는 일시정지) */
let BANNER_TIMER = null;
function startBannerAutoRotate() {
  if (BANNER_TIMER) clearInterval(BANNER_TIMER);
  BANNER_TIMER = setInterval(() => {
    document.querySelectorAll('.rd-stop-banner').forEach(banner => {
      const slides = banner.querySelectorAll('.rd-stop-slide');
      if (slides.length <= 1) return;
      if (banner.matches(':hover')) return;
      const activeIdx = Array.from(slides).findIndex(s => s.classList.contains('active'));
      setBannerSlide(banner, activeIdx + 1);
    });
  }, 5000);
}

/* ============================================================
   RENDER — 요금 안내
   ============================================================ */
function renderFare() {
  const fare = DATA.fares[0];
  if (!fare) { document.getElementById('rdFareSection').hidden = true; return; }

  // 성인/소인 별 oneWay 가격 — 모든 segment 동일하므로 첫 매치 사용
  const priceFor = (passengerTypeId) => {
    const seg = DATA.segments.find(s => s.passengerTypeId === passengerTypeId);
    return seg ? Number(seg.oneWayPrice) : null;
  };
  const rows = (fare.passengerTypes || []).map(pt => {
    const p = priceFor(pt.id);
    return `
      <div class="rd-fare-row">
        <div class="rd-fare-pt">
          <span class="rd-fare-name">${escapeHtml(pt.nameKo)}</span>
          ${pt.description ? `<span class="rd-fare-desc">${escapeHtml(pt.description)}</span>` : ''}
        </div>
        <div class="rd-fare-price">${p != null ? fmtPrice(p) : '-'}</div>
      </div>`;
  }).join('');

  document.getElementById('rdFare').innerHTML = `
    <div class="rd-fare-card">
      ${rows}
    </div>
  `;
}

/* ============================================================
   RENDER — 이용/취소 안내 (rich HTML)
   ============================================================ */
function renderTerms() {
  const fare = DATA.fares[0];
  if (!fare) {
    document.getElementById('rdTermsSection').hidden = true;
    document.getElementById('rdCancelSection').hidden = true;
    return;
  }
  document.getElementById('rdUsageTerms').innerHTML  = fare.usageTermsKo || fare.termsConditionsKo || '<p class="rd-empty">등록된 이용 안내가 없습니다.</p>';
  document.getElementById('rdCancelTerms').innerHTML = fare.cancellationTermsKo || fare.cancelRefundPolicyKo || '<p class="rd-empty">등록된 취소 안내가 없습니다.</p>';
}

/* ============================================================
   RENDER — 우측 sticky 퀵 네비
   ============================================================ */
/* ============================================================
   정류장 안내 — 상단 운행 코스 pill 네비 (sticky, 좌우 스크롤)
   ============================================================ */
function renderStopsPills() {
  const host = document.getElementById('rdStopsPills');
  if (!host) return;
  const stops = DATA.routestop;
  const uniqueStops = stops.filter((s, i) => {
    if (i === 0) return true;
    if (i === stops.length - 1 && s.stationId === stops[0].stationId) return false;
    return true;
  });

  const pillsHtml = uniqueStops.map((s, i) => {
    const num = i + 1;
    return `<button type="button" class="rd-stops-pill${i === 0 ? ' active' : ''}"
              data-pill-seq="${s.sequence}"
              data-pill-station="${s.stationId}">
              <span class="rd-stops-pill-num">${num}</span>
              <span class="rd-stops-pill-name">${escapeHtml(s.stationNameKo)}</span>
            </button>`;
  }).join('<span class="rd-stops-pill-line" aria-hidden="true"></span>');

  host.innerHTML = pillsHtml;
}

/* pill 클릭 → 해당 정류장 카드로 부드러운 스크롤
   ※ 이 핸들러는 한 번만 document 레벨에 등록 (renderStopsPills 가 여러 번 호출돼도 중복 attach 방지) */
let _PILLS_CLICK_BOUND = false;
function bindStopsPillsClick() {
  if (_PILLS_CLICK_BOUND) return;
  _PILLS_CLICK_BOUND = true;
  document.addEventListener('click', e => {
    const btn = e.target.closest('.rd-stops-pill');
    if (!btn) return;
    const seq = btn.dataset.pillSeq;
    if (seq == null) return;

    // 페이지 스크롤 — scroll-margin-top(140px) 이 CSS 에 적용돼 있어 sticky 영역 자동 보정
    const target = document.getElementById(`rd-stop-${seq}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // active 갱신
    document.querySelectorAll('.rd-stops-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');

    // pill nav 자체를 가로 스크롤해 active pill 이 화면에 보이도록
    const host = document.getElementById('rdStopsPills');
    if (host) {
      const aRect = btn.getBoundingClientRect();
      const hRect = host.getBoundingClientRect();
      const targetLeft = host.scrollLeft + (aRect.left - hRect.left) - (hRect.width / 2 - aRect.width / 2);
      host.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  });
}

/* IntersectionObserver — 보이는 stop card 의 stationId 와 pill active 동기화 */
function setupStopsPillsScrollSync() {
  const host = document.getElementById('rdStopsPills');
  const cards = document.querySelectorAll('.rd-stop-card');
  if (!host || !cards.length || !('IntersectionObserver' in window)) return;

  const visible = new Map();
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.set(e.target, e.intersectionRatio);
      else visible.delete(e.target);
    });
    if (!visible.size) return;
    let best = null, bestRatio = -1;
    visible.forEach((ratio, card) => {
      if (ratio > bestRatio) { bestRatio = ratio; best = card; }
    });
    if (!best) return;
    const stationId = best.dataset.stationId;
    const pills = host.querySelectorAll('.rd-stops-pill');
    let active = null;
    pills.forEach(p => {
      const match = String(p.dataset.pillStation) === String(stationId);
      p.classList.toggle('active', match);
      if (match) active = p;
    });
    // 가로 스크롤로 active pill 이 화면 안에 들어오도록
    if (active) {
      const aRect = active.getBoundingClientRect();
      const hRect = host.getBoundingClientRect();
      if (aRect.left < hRect.left || aRect.right > hRect.right) {
        active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    }
  }, {
    rootMargin: '-30% 0px -50% 0px',
    threshold: [0, 0.25, 0.5, 0.75, 1]
  });

  cards.forEach(c => obs.observe(c));
}

/* ============================================================
   우측 sticky 예약 패널 — 출발일 + 인원 + 총합계 + 예약하기
   ============================================================ */
const BOOKING = {
  selectedDate: null,                          // 'YYYY-MM-DD'
  qty: {},                                     // { passengerTypeId: count }
  calMonth: null,                              // 표시 중인 달의 첫날 (Date)
};

function fmtMoney(n) { return '₩ ' + Number(n).toLocaleString('ko-KR'); }
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function isPastDate(d, today) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return a < b;
}

function renderBookingPanel() {
  // 초기 달은 오늘이 속한 달
  if (!BOOKING.calMonth) {
    const t = new Date();
    BOOKING.calMonth = new Date(t.getFullYear(), t.getMonth(), 1);
  }
  // 인원 초기값 — 성인 1명, 나머지 0
  const fare = (DATA.fares && DATA.fares[0]) || {};
  const types = fare.passengerTypes || [];
  types.forEach((pt, i) => {
    if (BOOKING.qty[pt.id] == null) BOOKING.qty[pt.id] = i === 0 ? 1 : 0;
  });

  renderCalendar();
  renderQty();
  syncQtyBlockVisibility();
  updateTotal();

  // 예약하기 버튼 → checkout (인원은 checkout 에서 선택)
  document.getElementById('rdBookBtn').addEventListener('click', () => {
    if (!BOOKING.selectedDate) return;
    const params = new URLSearchParams({
      type: 'circular',
      id: DATA.route.id,
      date: BOOKING.selectedDate
    });
    location.href = `checkout.html?${params.toString()}`;
  });
}

/* 잔여 좌석 mock — 날짜 + transport.capacity 기반 deterministic 값 (시연용) */
function getDateInventory(ds) {
  const transport = (DATA.transports && DATA.transports[0]) || {};
  const capacity = transport.capacity || 48;
  // 날짜 문자열 → hash → booked (0 ~ capacity+5)
  let h = 0;
  for (let i = 0; i < ds.length; i++) h = ((h << 5) - h + ds.charCodeAt(i)) | 0;
  const booked = Math.abs(h) % (capacity + 6);    // capacity 보다 살짝 더 — 일부 날짜는 마감
  const remain = Math.max(0, capacity - booked);
  return { capacity, booked, remain };
}

function renderCalendar() {
  const host = document.getElementById('rdCalendar');
  if (!host) return;
  const month = BOOKING.calMonth;
  const y = month.getFullYear();
  const m = month.getMonth();
  const today = new Date();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const firstWeekday = new Date(y, m, 1).getDay();

  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  let cellsHtml = '';
  // 빈 칸 (이전 달)
  for (let i = 0; i < firstWeekday; i++) cellsHtml += `<div class="bk-cal-cell empty"></div>`;
  // 날짜 셀
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(y, m, d);
    const ds = ymd(dt);
    const past = isPastDate(dt, today);
    const selected = BOOKING.selectedDate === ds;
    const cls = ['bk-cal-cell'];
    let seatsHtml = '';
    if (past) {
      cls.push('past');
    } else {
      const inv = getDateInventory(ds);
      if (inv.remain <= 0) {
        cls.push('full');
        seatsHtml = `<span class="bk-cal-cell-seats">마감</span>`;
      } else {
        cls.push('avail');
        seatsHtml = `<span class="bk-cal-cell-seats">잔여 ${inv.remain}</span>`;
      }
    }
    if (selected) cls.push('selected');
    const isDisabled = past || cls.includes('full');
    cellsHtml += `<button type="button" class="${cls.join(' ')}" data-cal-date="${ds}" ${isDisabled ? 'disabled' : ''}>
      <span class="bk-cal-cell-num">${d}</span>${seatsHtml}
    </button>`;
  }

  host.innerHTML = `
    <div class="bk-cal-month">
      <button type="button" class="bk-cal-nav" data-cal-nav="prev" aria-label="이전 달">‹</button>
      <span class="bk-cal-month-title">${y}년 ${m + 1}월</span>
      <button type="button" class="bk-cal-nav" data-cal-nav="next" aria-label="다음 달">›</button>
    </div>
    <div class="bk-cal-grid">
      ${DOW.map(d => `<div class="bk-cal-dow">${d}</div>`).join('')}
      ${cellsHtml}
    </div>
  `;

  // 클릭 핸들러
  host.querySelectorAll('[data-cal-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      BOOKING.selectedDate = btn.dataset.calDate;
      renderCalendar();
      renderQty();              // 날짜 기준 요금 정보 갱신
      syncQtyBlockVisibility();
      updateTotal();
    });
  });
  host.querySelectorAll('[data-cal-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.calNav === 'next' ? 1 : -1;
      BOOKING.calMonth = new Date(y, m + dir, 1);
      renderCalendar();
    });
  });
}

/* 출발일 선택 전에는 요금 정보 영역을 숨김 */
function syncQtyBlockVisibility() {
  const block = document.getElementById('rdQtyBlock');
  if (!block) return;
  block.hidden = !BOOKING.selectedDate;
}

/* 요금 정보만 표시 — 인원 선택은 checkout 페이지에서 진행 */
function renderQty() {
  const host = document.getElementById('rdQty');
  if (!host) return;
  const fare = (DATA.fares && DATA.fares[0]) || {};
  const types = fare.passengerTypes || [];
  const segments = DATA.segments || [];

  const rows = types.filter(t => t.displayed !== false).map(pt => {
    const seg = segments.find(s => s.passengerTypeId === pt.id);
    const price = seg ? Number(seg.oneWayPrice) : 0;
    return `
      <div class="bk-fare-row">
        <span class="bk-fare-name">${escapeHtml(pt.nameKo)}</span>
        <span class="bk-fare-price">${fmtMoney(price)}</span>
      </div>
    `;
  }).join('');

  host.innerHTML = `<div class="bk-fare-table">${rows}</div>`;
}

/* 예약 버튼 상태 — 날짜만 있으면 활성화 (인원은 checkout 에서 선택) */
function updateTotal() {
  const btn = document.getElementById('rdBookBtn');
  if (!btn) return;
  if (!BOOKING.selectedDate) {
    btn.disabled = true;
    btn.textContent = '출발일을 선택하세요';
  } else {
    btn.disabled = false;
    btn.textContent = '예약하기';
  }
}

/* ============================================================
   운행시간표 모달 — 캘린더 형태 (행=날짜, 열=시간)
   ============================================================ */
const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function generateDepartureTimes(startTime, endTime, intervalMinutes) {
  if (!startTime || !endTime || !intervalMinutes) return [];
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;
  const times = [];
  for (let m = startMin; m <= endMin; m += intervalMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return times;
}

/* timeSlots → Map<"YYYY-MM-DD", Set<"HH:MM">> 인덱스 */
function buildSlotIndex(timeSlots) {
  const idx = new Map();
  timeSlots.forEach(s => {
    if (!s.specificDate || !s.departureTime) return;
    const time = s.departureTime.slice(0, 5);    // "09:30:00" → "09:30"
    if (!idx.has(s.specificDate)) idx.set(s.specificDate, new Set());
    idx.get(s.specificDate).add(time);
  });
  return idx;
}

function fmtDate(d) {  // Date → "YYYY-MM-DD"
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

// 모달 state
const TT_STATE = { weekStart: null, times: [], slotIdx: null, startDate: null, endDate: null };
const TT_DAYS_PER_PAGE = 7;

function openTimetableModal() {
  const sch = DATA.schedules[0];
  if (!sch) { alert('운행시간표 데이터가 없습니다.'); return; }

  TT_STATE.times = generateDepartureTimes(sch.intervalStartTime, sch.intervalEndTime, sch.intervalMinutes);
  TT_STATE.slotIdx = buildSlotIndex(sch.timeSlots || []);
  TT_STATE.startDate = sch.startDate || null;
  TT_STATE.endDate = sch.endDate || null;

  // 초기 weekStart — 오늘 vs startDate 중 큰 값 / 단 endDate 이내로
  const today = new Date(); today.setHours(0,0,0,0);
  const startD = sch.startDate ? new Date(sch.startDate) : today;
  const endD   = sch.endDate   ? new Date(sch.endDate)   : addDays(today, 365);
  let init = today < startD ? startD : today;
  if (init > endD) init = startD;
  TT_STATE.weekStart = init;

  // 모달 외곽 한 번만 생성
  const modal = document.getElementById('rdTtModal');
  modal.innerHTML = `
    <div class="rd-tt-modal" role="dialog" aria-modal="true" aria-labelledby="rdTtTitle">
      <header class="rd-tt-head">
        <div>
          <h2 class="rd-tt-title" id="rdTtTitle">운행시간표</h2>
          <p class="rd-tt-subtitle">${escapeHtml(DATA.route.nameKo)}</p>
        </div>
        <button class="rd-tt-close" type="button" data-tt-close aria-label="닫기">×</button>
      </header>

      <div class="rd-tt-meta">
        <div class="rd-tt-meta-row">
          <span class="rd-tt-meta-label">운행기간</span>
          <span class="rd-tt-meta-value">${escapeHtml(sch.startDate || '-')} ~ ${escapeHtml(sch.endDate || '-')}</span>
        </div>
        <div class="rd-tt-meta-row">
          <span class="rd-tt-meta-label">배차간격</span>
          <span class="rd-tt-meta-value">${sch.intervalMinutes}분 (1일 최대 ${TT_STATE.times.length}회)</span>
        </div>
      </div>

      <div class="rd-tt-pager">
        <button class="rd-tt-pager-btn" type="button" data-tt-prev aria-label="이전 7일">‹</button>
        <span class="rd-tt-pager-label" id="rdTtRangeLabel"></span>
        <button class="rd-tt-pager-btn" type="button" data-tt-next aria-label="다음 7일">›</button>
        <button class="rd-tt-today-btn" type="button" data-tt-today>오늘</button>
      </div>

      <div class="rd-tt-table-wrap">
        <div id="rdTtTable"></div>
      </div>

      <footer class="rd-tt-foot">
        <button class="rd-btn outline" type="button" data-tt-close>닫기</button>
      </footer>
    </div>
  `;
  renderTimetableGrid();

  modal.hidden = false;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  modal.querySelectorAll('[data-tt-close]').forEach(b => b.addEventListener('click', closeTimetableModal));
  modal.querySelector('[data-tt-prev]').addEventListener('click', () => navigateWeek(-TT_DAYS_PER_PAGE));
  modal.querySelector('[data-tt-next]').addEventListener('click', () => navigateWeek(+TT_DAYS_PER_PAGE));
  modal.querySelector('[data-tt-today]').addEventListener('click', () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startD = TT_STATE.startDate ? new Date(TT_STATE.startDate) : null;
    const endD   = TT_STATE.endDate   ? new Date(TT_STATE.endDate)   : null;
    // 오늘이 운행기간 밖이면 가장 가까운 경계로 이동
    let target = today;
    if (startD && today < startD) target = startD;
    if (endD && today > endD)     target = endD;
    TT_STATE.weekStart = target;
    renderTimetableGrid();
  });
  modal.addEventListener('click', e => { if (e.target === modal) closeTimetableModal(); });
  document.addEventListener('keydown', escCloseHandler);
}

function navigateWeek(delta) {
  const next = addDays(TT_STATE.weekStart, delta);
  const startD = TT_STATE.startDate ? new Date(TT_STATE.startDate) : null;
  const endD   = TT_STATE.endDate   ? new Date(TT_STATE.endDate)   : null;
  // 운행기간 범위 안에서만 이동
  if (startD && next < startD) return;
  if (endD && addDays(next, TT_DAYS_PER_PAGE - 1) > addDays(endD, TT_DAYS_PER_PAGE - 1)) {
    // weekStart 자체가 endD 를 넘기지만 않으면 허용
    if (next > endD) return;
  }
  TT_STATE.weekStart = next;
  renderTimetableGrid();
}

function fmtHourLabel(h) {
  if (h === 0) return '오전 12시';
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return '오후 12시';
  return `오후 ${h - 12}시`;
}

function renderTimetableGrid() {
  const start = TT_STATE.weekStart;
  const dates = Array.from({ length: TT_DAYS_PER_PAGE }, (_, i) => addDays(start, i));
  const todayStr = fmtDate(new Date());

  // 주간 내 실제 timeSlots 의 시각을 모두 수집 → 정렬해 행으로 사용
  // (intervalMinutes 로 생성한 시각만 쓰면 10:10 / 10:20 같은 가변 시간이 누락됨)
  const visibleTimes = new Set();
  dates.forEach(d => {
    const slots = TT_STATE.slotIdx.get(fmtDate(d));
    if (slots) slots.forEach(t => visibleTimes.add(t));
  });
  const sortedTimes = Array.from(visibleTimes).sort();

  // 헤더 (날짜 컬럼)
  const dayHeadsHtml = dates.map(d => {
    const dow = DOW_LABELS[d.getDay()];
    const isSun = d.getDay() === 0;
    const isSat = d.getDay() === 6;
    const isToday = fmtDate(d) === todayStr;
    return `
      <div class="rd-tt-cal-day-head ${isSun ? 'sun' : ''} ${isSat ? 'sat' : ''}">
        <span class="rd-tt-cal-dow">${dow}</span>
        <span class="rd-tt-cal-date ${isToday ? 'today' : ''}">${d.getDate()}</span>
      </div>`;
  }).join('');

  // 본문 — 주간에 실제 등장한 출발 시각마다 1행 (시각 라벨은 chip 자체에 표시)
  let bodyHtml = '';
  if (sortedTimes.length === 0) {
    bodyHtml = `<div class="rd-tt-empty" style="grid-column: 1 / -1">이 주에는 운행되는 시각이 없습니다.</div>`;
  } else {
    bodyHtml = sortedTimes.map(t => {
      return dates.map(d => {
        const dateStr = fmtDate(d);
        const isToday = dateStr === todayStr;
        const slots = TT_STATE.slotIdx.get(dateStr) || new Set();
        const has = slots.has(t);
        return `<div class="rd-tt-cal-cell${has ? ' has' : ''}${isToday ? ' today-col' : ''}" data-date="${dateStr}" data-time="${escapeHtml(t)}">
          ${has ? `<span class="rd-tt-cal-slot">${escapeHtml(t)}</span>` : ''}
        </div>`;
      }).join('');
    }).join('');
  }

  document.getElementById('rdTtTable').innerHTML = `
    <div class="rd-tt-cal">
      ${dayHeadsHtml}
      ${bodyHtml}
    </div>
  `;
  document.getElementById('rdTtRangeLabel').textContent =
    `${fmtDate(dates[0])} ~ ${fmtDate(dates[dates.length - 1])}`;
}
function escCloseHandler(e) { if (e.key === 'Escape') closeTimetableModal(); }
function closeTimetableModal() {
  const modal = document.getElementById('rdTtModal');
  modal.hidden = true;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', escCloseHandler);
}

/* ============================================================
   사이드 BUS STOPS 스크롤 동기화
   현재 viewport 중앙 근처에 보이는 stop card 의 stationId 를
   사이드 .rd-side-stop 의 .active 와 동기화
   ============================================================ */
function setupStopScrollSync() {
  const cards = document.querySelectorAll('.rd-stop-card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  // stationId → 사이드 항목들 (시작·종착이 같은 station 인 경우 1개)
  const sideStops = document.querySelectorAll('.rd-side-stop');
  const setSideActive = (stationId) => {
    sideStops.forEach(s => {
      s.classList.toggle('active', String(s.dataset.stationId) === String(stationId));
    });
    // 사이드 스크롤 — active 항목이 보이도록
    const target = document.querySelector(`.rd-side-stop.active`);
    if (target && target.scrollIntoView) {
      const sideEl = document.getElementById('rdSide');
      const targetRect = target.getBoundingClientRect();
      const sideRect = sideEl.getBoundingClientRect();
      if (targetRect.top < sideRect.top || targetRect.bottom > sideRect.bottom) {
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  // 가장 viewport 중앙에 가까운 카드를 active 로 설정
  const visible = new Map();   // card → ratio
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.set(e.target, e.intersectionRatio);
      else visible.delete(e.target);
    });
    if (!visible.size) return;
    // 가장 큰 ratio (가장 많이 보이는 카드) 선택
    let bestCard = null, bestRatio = -1;
    visible.forEach((ratio, card) => {
      if (ratio > bestRatio) { bestRatio = ratio; bestCard = card; }
    });
    if (bestCard) {
      const stationId = bestCard.dataset.stationId;
      setSideActive(stationId);
    }
  }, {
    rootMargin: '-30% 0px -50% 0px',
    threshold: [0, 0.25, 0.5, 0.75, 1]
  });

  cards.forEach(c => obs.observe(c));
}

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  try {
    await loadAll();
    buildIndex();
  } catch (e) {
    document.getElementById('rdLoading').hidden = true;
    const errEl = document.getElementById('rdError');
    errEl.hidden = false;
    errEl.innerHTML = `
      <strong>데이터 로드 실패</strong><br>
      ${escapeHtml(e.message)}<br>
      <small>로컬 파일(file://) 로 실행 중이면 fetch가 차단됩니다. <code>npx http-server</code> 등으로 HTTP 서버를 띄워서 접속해 주세요.</small>`;
    return;
  }

  // 렌더
  renderHeader();
  renderDescription();
  renderRouteOd();
  renderInfoTable();
  renderOperatorInfo();
  renderOverview();
  renderStops();
  renderStopsPills();
  bindStopsPillsClick();
  renderBookingPanel();

  document.getElementById('rdLoading').hidden = true;
  document.getElementById('rdGrid').hidden = false;

  // 액션 — 운행시간표 버튼은 .rd-info-table 내부에 있음 (renderInfoTable 에서 생성)
  document.getElementById('rdScheduleBtn').addEventListener('click', openTimetableModal);

  // 모바일/태블릿 바텀시트 — [예약하기] 버튼 → bk-booking 슬라이드업
  bindBookingSheet();

  // 정류장 안내 상단 pill nav ↔ 정류장 카드 스크롤 동기화
  setupStopsPillsScrollSync();

  // 배너 자동 회전 시작 (5초 간격)
  startBannerAutoRotate();
  startHeroAutoRotate();

  // Smooth scroll anchor links — sticky 헤더 보정은 CSS scroll-margin-top 으로 처리
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 사이드 active 즉시 갱신 (IntersectionObserver 지연 보완)
      if (el.dataset.stationId) {
        document.querySelectorAll('.rd-side-stop').forEach(s => {
          s.classList.toggle('active', String(s.dataset.stationId) === String(el.dataset.stationId));
        });
      }
    });
  });
}

/* ============================================================
   모바일/태블릿 바텀시트 — [예약하기] 클릭 → bk-booking 슬라이드업
   ============================================================ */
function bindBookingSheet() {
  const panel    = document.getElementById('rdBooking');
  const backdrop = document.getElementById('rdSheetBackdrop');
  const openBtn  = document.getElementById('rdMobileBookBtn');
  const closeBtn = document.getElementById('rdSheetClose');
  if (!panel || !backdrop || !openBtn || !closeBtn) return;

  const open = () => {
    panel.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  // 예약 완료 시 자동 닫힘 (bk-book-btn 클릭 후)
  document.getElementById('rdBookBtn')?.addEventListener('click', () => {
    if (panel.classList.contains('open')) close();
  });
}

document.addEventListener('DOMContentLoaded', init);
