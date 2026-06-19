/* search-results.js — 검색결과 페이지 (일반/순환/투어 노선) */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function formatPrice(v) {
  return '₩ ' + Number(v).toLocaleString('ko-KR');
}

/* ============================================================
   MOCK DATA — 3 종류 노선 결과
   ============================================================ */
// 운영사 로고 — 사이트 헤더의 GroundK 로고와 동일 이미지 사용
const OPERATOR_LOGO_URL = 'https://cdn.rideus.net/uploads/0012/12399/2025/11/13/785fd861c01d93a5e00985b0dba945f9.png';
const VIVALDI_LOGO = `<img src="${OPERATOR_LOGO_URL}" alt="운영사 로고">`;

// 정류장 정보 mock — 메인페이지와 동일 데이터 패턴
const STOP_INFO_MOCK = {
  image: 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAFx-9LsSY11UKvGhKgktfeE7MOm1YjC7yYdGH-FdBGRwHuVBO3rPpsbUEBftEhVhAcyNwctg1CSycn_OWaTd1zwPfozZT7ZFftx7gVOePs-c2hc7X8iLiS4SKVreDJkDi6JMcIJtQ=w408-h306-k-no',
  address: '서울특별시 마포구 양화로 178',
  subtitle: '비발디파크 전용 승하차장',
  detail: '출발 5분 전까지 도착해 주세요. 정확한 위치는 주소 옆 [지도 보기]를 통해 확인하실 수 있습니다.'
};

const SEARCH_QUERY = {
  tripType: 'oneway',   // 'oneway' (편도, 기본) | 'roundtrip' (왕복)
  dateGo: '2026-06-30',
  dateBack: '2026-06-30',
  from: '노원역',
  to: '비발디파크',
  passengers: 1
};

const SEARCH_RESULTS = {
  regular: [
    {
      id: 'r_reg_1',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '의정부/노원/구리 (6월7월)',
      vehicle: '44인승 대형버스',
      remainingSeats: 12,
      pickup: { time: '07:30', name: '노원역' },
      stops: [{ time: '07:50', name: '구리역' }],
      arrival: { time: '09:30', name: '비발디파크' },
      price: 20000,
      priceNote: '성인 1인 기준 왕복 요금'
    },
    {
      id: 'r_reg_2',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '강남/잠실/송파',
      vehicle: '28인승 우등버스',
      remainingSeats: 5,
      pickup: { time: '08:30', name: '강남역' },
      stops: [{ time: '08:45', name: '잠실역' }, { time: '09:00', name: '송파역' }],
      arrival: { time: '10:40', name: '비발디파크' },
      price: 25000,
      priceNote: '성인 1인 기준 왕복 요금'
    },
    {
      id: 'r_reg_3',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '인천/부평/김포',
      vehicle: '44인승 대형버스',
      remainingSeats: 0,
      pickup: { time: '06:50', name: '인천터미널' },
      stops: [{ time: '07:10', name: '부평역' }, { time: '07:35', name: '김포공항' }],
      arrival: { time: '09:30', name: '비발디파크' },
      price: 28000,
      priceNote: '성인 1인 기준 왕복 요금'
    }
  ],
  circular: [
    {
      id: 'r_cir_1',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '서울시티투어 - 전통문화코스',
      region: '서울',
      vehicle: '25인승 셔틀',
      layoutMode: 'uchart',
      intervalStartTime: '09:30',
      intervalEndTime: '17:30',
      intervalMinutes: 30,
      pickup: { time: '09:30', name: '동대문디자인플라자' },
      stops: [
        { time: '09:50', name: '방산,중부시장' },
        { time: '10:00', name: '을지로3가' },
        { time: '10:10', name: '을지로입구' },
        { time: '10:20', name: '청와대' },
        { time: '10:30', name: '통인시장' },
        { time: '10:40', name: '광화문광장' },
        { time: '10:50', name: '서울역' },
        { time: '11:00', name: '남대문시장' },
        { time: '11:10', name: '남산오르미' },
        { time: '11:20', name: '명동' },
        { time: '11:30', name: '종각' },
        { time: '11:40', name: '인사동' },
        { time: '11:50', name: '종묘' },
        { time: '12:00', name: '광장시장' }
      ],
      arrival: { time: '12:10', name: '동대문디자인플라자' },
      price: 27000,
      priceNote: '성인 1인 기준'
    },
    {
      id: 'r_cir_2',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '서울시티투어 - 한강/남산코스',
      region: '서울',
      vehicle: '25인승 셔틀',
      layoutMode: 'uchart',
      intervalStartTime: '09:30',
      intervalEndTime: '17:30',
      intervalMinutes: 30,
      pickup: { time: '09:30', name: '광화문역' },
      stops: [
        { time: '09:40', name: '강변북로' },
        { time: '09:50', name: '반포대교' },
        { time: '10:00', name: '성수대교' },
        { time: '10:10', name: '한남대교' },
        { time: '10:20', name: 'N서울타워' },
        { time: '10:30', name: '남대문시장' },
        { time: '10:40', name: '청계광장' }
      ],
      arrival: { time: '12:10', name: '광화문역' },
      price: 27000,
      priceNote: '성인 1인 기준'
    },
    {
      id: 'r_cir_3',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '부산시티투어 - 해운대코스',
      region: '부산',
      vehicle: '25인승 셔틀',
      layoutMode: 'uchart',
      intervalStartTime: '09:30',
      intervalEndTime: '17:30',
      intervalMinutes: 30,
      pickup: { time: '09:30', name: '광화문역' },
      stops: [
        { time: '09:40', name: '강변북로' },
        { time: '09:50', name: '반포대교' },
        { time: '10:00', name: '성수대교' },
        { time: '10:10', name: '한남대교' },
        { time: '10:20', name: 'N서울타워' },
        { time: '10:30', name: '남대문시장' },
        { time: '10:40', name: '청계광장' },
        { time: '09:50', name: '방산,중부시장' },
        { time: '10:00', name: '을지로3가' },
        { time: '10:10', name: '을지로입구' },
        { time: '10:20', name: '청와대' },
        { time: '10:30', name: '통인시장' },
        { time: '10:40', name: '광화문광장' },
        { time: '10:50', name: '서울역' },
        { time: '11:00', name: '남대문시장' },
        { time: '11:10', name: '남산오르미' },
        { time: '11:20', name: '명동' },
        { time: '11:30', name: '종각' },
        { time: '11:40', name: '인사동' },
        { time: '11:50', name: '종묘' },
        { time: '12:00', name: '광장시장' }
      ],
      arrival: { time: '12:10', name: '광화문역' },
      price: 27000,
      priceNote: '성인 1인 기준'
    },
    {
      id: 'r_cir_4',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '경주 야간 시티투어',
      region: '경상',
      vehicle: '25인승 셔틀',
      layoutMode: 'uchart',
      intervalStartTime: '09:30',
      intervalEndTime: '17:30',
      intervalMinutes: 30,
      pickup: { time: '09:30', name: 'Dongdaemun Design Plaza' },
      stops: [
        { time: '09:40', name: 'Bangsan, Jungbu Market' },
        { time: '09:50', name: 'Euljiro 3-ga' },
        { time: '10:00', name: 'Euljiro 1-ga' },
        { time: '10:10', name: 'Cheongwadae' },
        { time: '10:20', name: 'Tong-in Market' },
        { time: '10:30', name: 'Gwanghwamun Square' },
        { time: '10:40', name: 'Seoul Station' },
        { time: '09:50', name: 'Namdaemun Market' },
        { time: '10:00', name: 'Namsan Ormi' },
        { time: '10:10', name: 'Myeongdong' },
        { time: '10:20', name: 'Jonggak' },
        { time: '10:30', name: 'Insadong' },
        { time: '10:40', name: 'Jongmyo' },
        { time: '10:50', name: 'Gwangjang Market' }
      ],
      arrival: { time: '12:10', name: 'Dongdaemun Design Plaza' },
      price: 27000,
      priceNote: '성인 1인 기준'
    }
  ],
  tour: [
    {
      id: 'r_tour_1',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '순천 구례 봄길여행',
      region: '전라',
      vehicle: '28인승 대형버스',
      pickup: { time: '07:00', name: '광주 유스퀘어' },
      stops: [
        { stopType: '승차', time: '09:40', name: '광주 송정역' },
        { stopType: '정차', time: '09:50', name: '순천 낙안읍성', dwellTimeMinutes: 90 },
        { stopType: '정차', time: '10:00', name: '구례 사성암', dwellTimeMinutes: 90 },
        { stopType: '정차', time: '10:10', name: '섬진강 대나무숲', dwellTimeMinutes: 90 },
        { stopType: '하차', time: '10:20', name: '광주 송정역' },
      ],
      arrival: { time: '09:30', name: '광주 유스퀘어' },
      saleDays: ['sat', 'sun'],
      price: 89000,
      priceNote: '성인 1인 기준'
    },
    {
      id: 'r_tour_2',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '강원 동해바다 일출투어',
      region: '강원',
      vehicle: '28인승 대형버스',
      pickup: { time: '05:30', name: '서울 잠실역' },
      stops: [
        { stopType: '승차', time: '06:00', name: '서울 강변역' },
        { stopType: '정차', time: '09:00', name: '정동진 해변', dwellTimeMinutes: 60 },
        { stopType: '정차', time: '10:30', name: '강릉 안목해변', dwellTimeMinutes: 90 },
        { stopType: '정차', time: '13:00', name: '오죽헌', dwellTimeMinutes: 60 },
        { stopType: '하차', time: '18:30', name: '서울 잠실역' }
      ],
      arrival: { time: '18:30', name: '서울 잠실역' },
      saleDays: ['fri', 'sat', 'sun'],
      price: 75000,
      priceNote: '성인 1인 기준'
    },
    {
      id: 'r_tour_3',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '경주 천년고도 역사문화 투어',
      region: '경상',
      vehicle: '28인승 대형버스',
      pickup: { time: '07:30', name: '대구 동대구역' },
      stops: [
        { stopType: '승차', time: '08:00', name: '대구 서대구역' },
        { stopType: '정차', time: '09:30', name: '불국사', dwellTimeMinutes: 120 },
        { stopType: '정차', time: '12:30', name: '석굴암', dwellTimeMinutes: 60 },
        { stopType: '정차', time: '14:30', name: '첨성대 & 동궁과 월지', dwellTimeMinutes: 90 },
        { stopType: '하차', time: '18:00', name: '대구 동대구역' }
      ],
      arrival: { time: '18:00', name: '대구 동대구역' },
      saleDays: ['wed', 'thu', 'fri', 'sat', 'sun'],
      price: 65000,
      priceNote: '성인 1인 기준'
    },
    {
      id: 'r_tour_4',
      operator: { logoHtml: VIVALDI_LOGO },
      name: '제주 동부 해안절경 투어',
      region: '제주',
      vehicle: '28인승 대형버스',
      pickup: { time: '08:30', name: '제주공항' },
      stops: [
        { stopType: '정차', time: '09:30', name: '함덕해수욕장', dwellTimeMinutes: 60 },
        { stopType: '정차', time: '11:00', name: '성산일출봉', dwellTimeMinutes: 90 },
        { stopType: '정차', time: '13:30', name: '섭지코지', dwellTimeMinutes: 60 },
        { stopType: '정차', time: '15:00', name: '우도', dwellTimeMinutes: 120 },
        { stopType: '하차', time: '18:30', name: '제주공항' }
      ],
      arrival: { time: '18:30', name: '제주공항' },
      saleDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      price: 95000,
      priceNote: '성인 1인 기준'
    }
  ],
  // 여행 상품 — 상세 페이지 product-detail.html과 동일한 유형의 데이터
  travel: [
    {
      id: 'tr_1',
      productId: 10,
      operator: { logoHtml: VIVALDI_LOGO },
      thumbnail: 'http://192.168.219.170:3000/api/images/images/b1990342-7704-4e60-9121-0a67aaab0171.jpg',
      thumbnailSeed: 'tr-gangneung',
      name: '강릉/동해 당일 #해안선열차 #안목해변 #묵호해변',
      oneliner: '낭만적인 해안선 기차와 커피향 가득 아름다운 바다, 추억의 바다까지 즐기는 당일 여행',
      keywords: ['강릉', '동해', '안목해변', '묵호해변', '당일여행'],
      region: '강원',
      operatorName: '그라운드케이',
      departureCount: 8,
      nextDeparture: '2026.06.06',
      saleDays: ['sat', 'sun'],   // 토·일 출발
      priceFrom: 37900,
      priceNote: '성인 1인 기준'
    },
    {
      id: 'tr_2',
      productId: 11,
      operator: { logoHtml: VIVALDI_LOGO },
      thumbnail: '',
      thumbnailSeed: 'tr-gyeongju',
      name: '경주 #첨성대 #불국사 #석굴암 #양동마을',
      oneliner: '천년 고도 경주의 유적지를 하루에 둘러보는 알찬 패키지',
      keywords: ['경주', '불국사', '석굴암', '양동마을'],
      region: '경상',
      operatorName: '그라운드케이',
      departureCount: 5,
      nextDeparture: '2026.07.04',
      saleDays: ['fri', 'sat', 'sun'],   // 금·토·일 출발
      priceFrom: 45000,
      priceNote: '성인 1인'
    },
    {
      id: 'tr_3',
      productId: 12,
      operator: { logoHtml: VIVALDI_LOGO },
      thumbnail: '',
      thumbnailSeed: 'tr-jeju',
      name: '제주도 1박2일 #올레길 #한라산 #성산일출봉',
      oneliner: '자연과 휴식이 어우러진 제주도 1박2일 패키지',
      keywords: ['제주', '한라산', '올레길', '성산일출봉'],
      region: '제주',
      operatorName: '그라운드케이',
      departureCount: 12,
      nextDeparture: '2026.06.13',
      saleDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],   // 매일 출발
      priceFrom: 189000,
      priceNote: '2인 1실 1인'
    }
  ]
};

let currentType = 'regular';
// 일반노선 + 왕복에서 가는편 선택 결과 (null이면 가는편 검색 화면, 객체면 오는편 검색 화면)
let SELECTED_OUTBOUND = null;

/* ============================================================
   RENDER — 헤더(검색바 채움)
   ============================================================ */
function applyTripType() {
  const isRound = SEARCH_QUERY.tripType === 'roundtrip';
  const card = document.getElementById('srSearchCard');
  card.classList.toggle('has-return', isRound);
  document.getElementById('srFieldDate').classList.toggle('merged', isRound);
  document.getElementById('srFieldDateBack').style.display  = isRound ? '' : 'none';
  document.getElementById('srIconDateBack').style.display   = isRound ? '' : 'none';
  document.querySelector('#srFieldDate > .sr-search-field-divider').style.display = isRound ? '' : 'none';
}

function renderHeader() {
  const fmtDot = (s) => s ? s.replace(/-/g, '.') : '';
  document.getElementById('srValDateGo').textContent   = fmtDot(SEARCH_QUERY.dateGo);
  document.getElementById('srValDateBack').textContent = fmtDot(SEARCH_QUERY.dateBack);
  document.getElementById('srValFrom').textContent     = SEARCH_QUERY.from;
  document.getElementById('srValTo').textContent       = SEARCH_QUERY.to;
  document.getElementById('srValPax').textContent      = SEARCH_QUERY.passengers + '명';
  applyTripType();
}

/* ============================================================
   RENDER — 결과 카드
   ============================================================ */
function renderCards() {
  const cardsHost = document.getElementById('srCards');
  const results = SEARCH_RESULTS[currentType] || [];
  document.getElementById('srResultsCount').innerHTML = `검색결과 <strong>${results.length}건</strong>`;

  // 결과 헤더 — 일반노선+왕복+가는편 선택 완료 시 "오는편"으로 전환
  // 순환·투어·여행상품 탭에서는 타이틀(가는편/오는편) 자체를 숨김
  const isRoundRegular = currentType === 'regular' && SEARCH_QUERY.tripType === 'roundtrip';
  const isReturnMode = isRoundRegular && SELECTED_OUTBOUND;
  const showTitle = currentType === 'regular';
  const titleEl = document.querySelector('.sr-results-title');
  if (titleEl) {
    titleEl.style.display = showTitle ? '' : 'none';
    if (showTitle) titleEl.textContent = isReturnMode ? '오는편' : '가는편';
  }

  if (results.length === 0) {
    cardsHost.innerHTML = `<div style="padding: 60px 20px; text-align:center; color: var(--sr-text-3); font-size:13px;">검색 결과가 없습니다.</div>`;
    return;
  }

  // === 여행 상품 결과 — 별도 카드 레이아웃 + product-detail.html로 이동 ===
  if (currentType === 'travel') {
    const calSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>`;
    const pinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    cardsHost.innerHTML = results.map(r => {
      const thumbUrl = r.thumbnail || '';
      const fb = `https://picsum.photos/seed/${encodeURIComponent(r.thumbnailSeed || r.id)}/600/450`;
      const keywordsHtml = (r.keywords || []).slice(0, 4).map(k => `<span class="sr-pcard-keyword">${escapeHtml(k)}</span>`).join('');
      return `
        <article class="sr-pcard" data-travel-id="${escapeHtml(r.id)}" data-product-id="${escapeHtml(String(r.productId || ''))}">
          <div class="sr-pcard-thumb">
            <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='${fb}';">
          </div>
          <div class="sr-pcard-body">
            <div class="sr-pcard-meta">
              <span class="sr-pcard-region">${pinSvg}${escapeHtml(r.region)}</span>
            </div>
            <h3 class="sr-pcard-name">${escapeHtml(r.name)}</h3>
            <p class="sr-pcard-oneliner">${escapeHtml(r.oneliner)}</p>
            ${keywordsHtml ? `<div class="sr-pcard-keywords">${keywordsHtml}</div>` : ''}
            <div class="sr-pcard-foot">
              <div class="sr-pcard-price">
                <span class="sr-pcard-price-value">${formatPrice(r.priceFrom)}</span>
                ${r.priceNote ? `<span class="sr-pcard-price-note">${escapeHtml(r.priceNote)}</span>` : ''}
              </div>
              <button class="sr-pcard-book-btn" type="button" data-book>예약하기</button>
            </div>
          </div>
        </article>`;
    }).join('');

    cardsHost.querySelectorAll('[data-travel-id]').forEach(card => {
      card.querySelector('[data-book]')?.addEventListener('click', e => {
        e.stopPropagation();
        const pid = card.dataset.productId;
        location.href = `checkout.html?type=travel${pid ? '&id=' + encodeURIComponent(pid) : ''}`;
      });
      card.addEventListener('click', () => {
        const pid = card.dataset.productId;
        location.href = `product-detail.html${pid ? '?id=' + encodeURIComponent(pid) : ''}`;
      });
    });
    return;
  }

  // === 순환노선 — route-detail.html 상단 운행정보 카드와 동일 톤의 여행상품 스타일 ===
  if (currentType === 'circular') {
    const diffMin = (a, b) => {
      if (!a || !b) return 0;
      const [ha, ma] = a.split(':').map(Number);
      const [hb, mb] = b.split(':').map(Number);
      return (hb * 60 + mb) - (ha * 60 + ma);
    };
    const fmtDuration = (mins) => {
      if (!Number.isFinite(mins) || mins <= 0) return '-';
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return `${h}시간 ${m}분`;
      if (h > 0) return `${h}시간`;
      return `${m}분`;
    };
    const pinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

    cardsHost.innerHTML = results.map(r => {
      const thumbUrl = r.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(r.id)}/800/600`;
      const fb = `https://picsum.photos/seed/${encodeURIComponent(r.id + '-fallback')}/800/600`;
      const boardTime = `${r.intervalStartTime || ''}-${r.intervalEndTime || ''}`;
      const durationText = fmtDuration(diffMin(r.pickup?.time, r.arrival?.time));

      return `
        <article class="sr-pcard" data-circular-id="${escapeHtml(r.id)}">
          <div class="sr-pcard-thumb">
            <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='${fb}';">
          </div>
          <div class="sr-pcard-body">
            ${r.region ? `<div class="sr-pcard-meta"><span class="sr-pcard-region">${pinSvg}${escapeHtml(r.region)}</span></div>` : ''}
            <h3 class="sr-pcard-name">${escapeHtml(r.name)}</h3>
            <div class="sr-pcard-info">
              <div class="sr-pcard-row"><span class="sr-pcard-label">운행시간</span><span class="sr-pcard-value">${escapeHtml(boardTime)}</span></div>
              <div class="sr-pcard-row"><span class="sr-pcard-label">소요시간</span><span class="sr-pcard-value">${escapeHtml(durationText)}</span></div>
            </div>
            <div class="sr-pcard-foot">
              <div class="sr-pcard-price">
                <span class="sr-pcard-price-value">${formatPrice(r.price)}</span>
                ${r.priceNote ? `<span class="sr-pcard-price-note">${escapeHtml(r.priceNote)}</span>` : ''}
              </div>
              <button class="sr-pcard-book-btn" type="button" data-book>예약하기</button>
            </div>
          </div>
        </article>`;
    }).join('');

    cardsHost.querySelectorAll('[data-circular-id]').forEach(card => {
      card.querySelector('[data-book]')?.addEventListener('click', e => {
        e.stopPropagation();
        location.href = `checkout.html?type=circular&id=${encodeURIComponent(card.dataset.circularId)}`;
      });
      card.addEventListener('click', () => {
        location.href = `route-detail.html?id=${encodeURIComponent(card.dataset.circularId)}`;
      });
    });
    return;
  }

  // === 투어노선 — 여행상품/순환노선과 동일 톤의 가로 카드 ===
  if (currentType === 'tour') {
    const pinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    cardsHost.innerHTML = results.map(r => {
      const thumbUrl = r.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(r.id)}/800/600`;
      const fb = `https://picsum.photos/seed/${encodeURIComponent(r.id + '-fb')}/800/600`;

      // 여행지 경로 — pickup ~ stops 중 '정차' ~ arrival 의 {time, name} 추출 (중복 제거 / 최대 5개)
      const pathStops = [
        r.pickup ? { time: r.pickup.time, name: r.pickup.name } : null,
        ...(r.stops || []).filter(s => s.stopType === '정차').map(s => ({ time: s.time, name: s.name })),
        r.arrival ? { time: r.arrival.time, name: r.arrival.name } : null
      ].filter(Boolean);
      const dedupedPath = pathStops.filter((s, i) => i === 0 || s.name !== pathStops[i - 1].name);
      const MAX = 5;
      const visible = dedupedPath.slice(0, MAX);
      const polylineHtml = visible.map((stop, i) => {
        const cls = i === 0 ? 'start'
                 : i === visible.length - 1 && dedupedPath.length <= MAX ? 'end'
                 : 'mid';
        return `<div class="sr-pcard-polyline-stop ${cls}">
          <span class="sr-pcard-polyline-dot"></span>
          <span class="sr-pcard-polyline-name">${escapeHtml(stop.name)}</span>
        </div>`;
      }).join('') + (dedupedPath.length > MAX ? `<div class="sr-pcard-polyline-stop more">
          <span class="sr-pcard-polyline-dot"></span>
          <span class="sr-pcard-polyline-name">외 ${dedupedPath.length - MAX}개</span>
        </div>` : '');

      return `
        <article class="sr-pcard" data-tour-id="${escapeHtml(r.id)}">
          <div class="sr-pcard-thumb">
            <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='${fb}';">
          </div>
          <div class="sr-pcard-body">
            ${r.region ? `<div class="sr-pcard-meta"><span class="sr-pcard-region">${pinSvg}${escapeHtml(r.region)}</span></div>` : ''}
            <h3 class="sr-pcard-name">${escapeHtml(r.name)}</h3>
            <div class="sr-pcard-info">
              <div class="sr-pcard-polyline">${polylineHtml}</div>
            </div>
            <div class="sr-pcard-foot">
              <div class="sr-pcard-price">
                <span class="sr-pcard-price-value">${formatPrice(r.price)}</span>
                ${r.priceNote ? `<span class="sr-pcard-price-note">${escapeHtml(r.priceNote)}</span>` : ''}
              </div>
              <button class="sr-pcard-book-btn" type="button" data-book>예약하기</button>
            </div>
          </div>
        </article>`;
    }).join('');

    cardsHost.querySelectorAll('[data-tour-id]').forEach(card => {
      card.querySelector('[data-book]')?.addEventListener('click', e => {
        e.stopPropagation();
        location.href = `checkout.html?type=tour&id=${encodeURIComponent(card.dataset.tourId)}`;
      });
      card.addEventListener('click', () => {
        location.href = `route-detail.html?id=${encodeURIComponent(card.dataset.tourId)}`;
      });
    });
    return;
  }

  // === 노선 결과 (일반) — 기존 카드 레이아웃 ===
  const mapPinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  // 가는편 선택 pill — results-title 위쪽 placeholder(#srOutboundPill)에 렌더
  const pillHost = document.getElementById('srOutboundPill');
  if (pillHost) {
    pillHost.innerHTML = isReturnMode ? `
      <div class="sr-outbound-pill">
        <div class="sr-outbound-head">
          <span class="sr-outbound-badge">여정 01</span>
          <span class="sr-outbound-date">${escapeHtml(SEARCH_QUERY.dateGo)}</span>
          <button type="button" class="sr-outbound-close" data-clear-outbound aria-label="가는편 다시 선택">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="sr-outbound-body">
          <div class="sr-outbound-route">
            <div class="sr-outbound-stop">
              <span class="sr-card-stop-marker pickup" aria-hidden="true"></span>
              <span class="sr-outbound-time">${escapeHtml(SELECTED_OUTBOUND.pickupTime)}</span>
              <span class="sr-outbound-name">${escapeHtml(SELECTED_OUTBOUND.pickup)}</span>
            </div>
            <div class="sr-outbound-stop">
              <span class="sr-card-stop-marker arrival" aria-hidden="true"></span>
              <span class="sr-outbound-time">${escapeHtml(SELECTED_OUTBOUND.arrivalTime)}</span>
              <span class="sr-outbound-name">${escapeHtml(SELECTED_OUTBOUND.arrival)}</span>
            </div>
          </div>
          <div class="sr-outbound-price">
            <div class="sr-outbound-price-value">${escapeHtml(SELECTED_OUTBOUND.priceLabel)}</div>
            <div class="sr-outbound-price-note">${escapeHtml(SELECTED_OUTBOUND.priceNote)}</div>
          </div>
        </div>
      </div>` : '';
    // × 버튼 핸들러
    pillHost.querySelector('[data-clear-outbound]')?.addEventListener('click', () => {
      SELECTED_OUTBOUND = null;
      renderCards();
    });
  }

  cardsHost.innerHTML = results.map(r => {
    const stopsCount = r.stops.length;
    const stopBtn = (name) => `<button type="button" class="sr-card-map-btn" data-stop-info="${escapeHtml(name)}" aria-label="${escapeHtml(name)} 정류장 정보">${mapPinSvg}</button>`;

    // U-chart 레이아웃 — 출/도착지가 같은 순환 노선 시각화 (상단=정방향, 하단=역방향 + 점선 루프백)
    const renderUchartRoute = () => {
      const names = [r.pickup.name, ...r.stops.map(s => s.name), r.arrival.name];
      const total = names.length;
      const halfTop = Math.ceil(total / 2);
      const top = names.slice(0, halfTop);
      // 하단 행은 reverse 한 번만 — arrival 이 좌측 앵커(i=0)에 오도록
      // names.slice(halfTop) = [...뒷쪽 정류장, arrival]
      // .reverse()           = [arrival, ...뒷쪽 정류장 역순]  → 시각상 좌→우 정확
      const bottom = names.slice(halfTop).reverse();
      const cell = (name, isAnchor, label) => `
        <div class="sr-uchart-stop${isAnchor ? ' anchor' : ''}" data-stop-info="${escapeHtml(name)}" role="button" tabindex="0" aria-label="${escapeHtml(name)} 정류장 정보">
          ${isAnchor ? `<span class="sr-uchart-badge">${label}</span>` : `<span class="sr-uchart-dot"></span>`}
          <span class="sr-uchart-name">${escapeHtml(name)}</span>
        </div>`;
      const topHtml    = top.map((n, i)    => cell(n, i === 0, '출발')).join('');
      const bottomHtml = bottom.map((n, i) => cell(n, i === 0, '도착')).join('');
      // 각 행의 셀 수는 자신의 길이로 — 홀수일 때 하단 행이 자기 셀 수에 맞춰 분포
      const ucCellsTop = top.length;
      const ucCellsBot = bottom.length;

      // 모바일용 세로 리스트 — pickup(출발 뱃지) → 중간 정류장(dot) → arrival(도착 뱃지)
      const listStopHtml = (name, kind) => {
        const marker = kind === 'pickup'  ? `<span class="sr-uchart-badge">출발</span>`
                     : kind === 'arrival' ? `<span class="sr-uchart-badge">도착</span>`
                     :                       `<span class="sr-uchart-list-dot"></span>`;
        return `
          <div class="sr-uchart-list-stop ${kind}">
            <div class="sr-uchart-list-marker">${marker}</div>
            <span class="sr-card-stop-text">
              <span class="sr-card-stop-name">${escapeHtml(name)}</span>
              ${stopBtn(name)}
            </span>
          </div>`;
      };
      const listHtml = [
        listStopHtml(r.pickup.name, 'pickup'),
        ...r.stops.map(s => listStopHtml(s.name, 'mid')),
        listStopHtml(r.arrival.name, 'arrival')
      ].join('');

      return `
        <div class="sr-card-route sr-card-route-uchart" style="--uc-cells:${ucCellsTop}">
          <div class="sr-uchart-frame" aria-hidden="true"></div>
          <div class="sr-uchart-arrow left" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 7 6 4 9 7"/></svg>
          </div>
          <div class="sr-uchart-arrow right" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 5 6 8 9 5"/></svg>
          </div>
          <div class="sr-uchart-row top" style="--uc-cells:${ucCellsTop}">${topHtml}</div>
          <div class="sr-uchart-row bottom" style="--uc-cells:${ucCellsBot}">${bottomHtml}</div>
        </div>
        <div class="sr-card-route-uchart-list">${listHtml}</div>`;
    };

    // 중간 정류장 — 마커 + 시간 + (관광 뱃지) + 이름 + 지도 아이콘
    const stopsRows = r.stops.map(s => {
      const dwellBadge = (s.stopType === '정차' && s.dwellTimeMinutes)
        ? `<span class="sr-card-stop-dwell">(관광) ${escapeHtml(s.dwellTimeMinutes)}분</span>`
        : '';
      return `
      <div class="sr-card-stop mid">
        <div class="sr-card-stop-marker mid"></div>
        <span class="sr-card-stop-time">${escapeHtml(s.time || '')}</span>
        <span class="sr-card-stop-text">
          <span class="sr-card-stop-name">${dwellBadge}${escapeHtml(s.name)}</span>
          ${stopBtn(s.name)}
        </span>
      </div>`;
    }).join('');

    // 경유지 영역 (chip + 접힘 가능한 정류장 리스트)
    const stopsArea = stopsCount > 0 ? `
      <div class="sr-card-stop chip-row">
        <div class="sr-card-stop-marker chip-anchor"></div>
        
        <button type="button" class="sr-card-stops-chip" data-stops-toggle="${escapeHtml(r.id)}">
          ${stopsCount}회 경유
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <span class="sr-card-stop-time"></span>
      </div>
      <div data-stops-list="${escapeHtml(r.id)}" style="display:none">${stopsRows}</div>
    ` : '';

    const priceDisplay = r.price === 0 ? '무료' : formatPrice(r.price);

    // 순환노선은 vehicle 대신 운행 간격 + 총 정류장 수 표시
    // 예: 09:30~17:30 (30분 간격) · 총 16개 정류장
    const intervalMin = Number(r.intervalMinutes);
    const intervalText = Number.isFinite(intervalMin)
      ? `${escapeHtml(r.intervalStartTime || '')}~${escapeHtml(r.intervalEndTime || '')} (${intervalMin}분 간격)`
      : '';
    const totalStops = (r.stops?.length || 0) + 2;   // pickup + 중간 + arrival
    const stopsText = `총 ${totalStops}개 정류장`;
    // 일반노선은 잔여좌석만 표시 (sr-card-vehicle 미사용)
    // 잔여좌석 0 → "매진" + 카드 [선택] 비활성 / 5석 이하(>0) → urgent(빨강)
    const hasSeats = Number.isFinite(Number(r.remainingSeats));
    const seatCount = Number(r.remainingSeats);
    const isSoldOut = hasSeats && seatCount === 0;
    const isUrgent  = hasSeats && seatCount > 0 && seatCount <= 5;
    const seatsLabel = isSoldOut ? '매진' : `좌석 ${seatCount}개 남음`;
    const seatsCls = isSoldOut ? ' sold-out' : isUrgent ? ' urgent' : '';
    let headRightHtml;
    if (currentType === 'circular') {
      headRightHtml = `<div class="sr-card-circular-info">
        <span class="sr-card-stops-total">${stopsText}</span>  
        ${intervalText ? `<span class="sr-card-interval">${intervalText}</span>` : ''}
      </div>`;
    } else if (currentType === 'regular' && hasSeats) {
      headRightHtml = `<div class="sr-card-seats${seatsCls}">${seatsLabel}</div>`;
    } else {
      headRightHtml = `<div class="sr-card-vehicle">${escapeHtml(r.vehicle)}</div>`;
    }
    return `
      <article class="sr-card" data-card-id="${escapeHtml(r.id)}">
        <div class="sr-card-head">
          <div class="sr-card-name">${escapeHtml(r.name)}</div>
          ${headRightHtml}
        </div>
        <div class="sr-card-body">
          ${(currentType === 'circular' || r.layoutMode === 'uchart') ? renderUchartRoute() : `<div class="sr-card-route">
            <div class="sr-card-stop">
              <div class="sr-card-stop-marker pickup"></div>
              <span class="sr-card-stop-time">${escapeHtml(r.pickup.time || '')}</span>
              <span class="sr-card-stop-text">
                <span class="sr-card-stop-name">${escapeHtml(r.pickup.name)}</span>
                ${stopBtn(r.pickup.name)}
              </span>
            </div>
            ${stopsArea}
            <div class="sr-card-stop">
              <div class="sr-card-stop-marker arrival"></div>
              <span class="sr-card-stop-time">${escapeHtml(r.arrival.time || '')}</span>
              <span class="sr-card-stop-text">
                <span class="sr-card-stop-name">${escapeHtml(r.arrival.name)}</span>
                ${stopBtn(r.arrival.name)}
              </span>
            </div>
          </div>`}
          <aside class="sr-card-price-block">
            <div class="sr-card-price-value">${priceDisplay}</div>
            <div class="sr-card-price-note">${escapeHtml(r.priceNote)}</div>
            ${isSoldOut
              ? `<button class="sr-card-select sold-out" type="button" disabled aria-disabled="true">매진</button>`
              : `<button class="sr-card-select" data-select="${escapeHtml(r.id)}" type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  선택
                </button>`}
          </aside>
        </div>
      </article>`;
  }).join('');

  // 선택 — 일반노선+왕복 + 가는편 미선택 시: 가는편 저장 후 오는편 화면 / 그 외: 최종 선택
  cardsHost.querySelectorAll('[data-select]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = results.find(x => x.id === btn.dataset.select);
      if (!r) return;
      if (isRoundRegular && !SELECTED_OUTBOUND) {
        SELECTED_OUTBOUND = {
          id: r.id,
          name: r.name,
          pickup: r.pickup.name,
          pickupTime: r.pickup.time || '',
          arrival: r.arrival.name,
          arrivalTime: r.arrival.time || '',
          priceLabel: r.price === 0 ? '무료' : formatPrice(r.price),
          priceNote: r.priceNote
        };
        renderCards();
        // 실제 스크롤 컨테이너가 <body> (overflow:auto + height:100%)이므로 수동 계산
        // sticky 사이트 헤더 높이만큼 보정해서 pill이 헤더 바로 아래로 오게 함
        requestAnimationFrame(() => {
          const pill = document.getElementById('srOutboundPill');
          if (!pill) return;
          const header = document.querySelector('.sr-site-header');
          const headerH = header ? header.getBoundingClientRect().height : 0;
          const pillTop = pill.getBoundingClientRect().top;
          const offset = pillTop - headerH - 8;
          // 어느 컨테이너가 실제로 스크롤되는지 환경마다 다르므로 셋 다 호출
          window.scrollBy({ top: offset, behavior: 'smooth' });
          if (document.scrollingElement) {
            document.scrollingElement.scrollBy({ top: offset, behavior: 'smooth' });
          }
          document.body.scrollBy({ top: offset, behavior: 'smooth' });
        });
        return;
      }
      // 오는편 선택 또는 단방향(편도)·다른 타입 → 결제 페이지로 이동
      if (isReturnMode) { SELECTED_OUTBOUND = null; }
      location.href = `checkout.html?type=${encodeURIComponent(currentType)}`;
    });
  });


  // 경유 chip 토글 (중간 정류장 펼치기/접기)
  cardsHost.querySelectorAll('[data-stops-toggle]').forEach(chip => {
    const id = chip.dataset.stopsToggle;
    const list = cardsHost.querySelector(`[data-stops-list="${id}"]`);
    chip.addEventListener('click', () => {
      const open = list.style.display !== 'none';
      list.style.display = open ? 'none' : '';
      chip.classList.toggle('open', !open);
    });
  });

  // 지도 핀 클릭 → 정류장 정보 팝업
  cardsHost.querySelectorAll('[data-stop-info]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openStopInfoModal(btn.dataset.stopInfo);
    });
  });
}

/* ============================================================
   STOP INFO MODAL — 메인 페이지(renderStopInfoModal)와 동일 구조
   ============================================================ */
function openStopInfoModal(stopName) {
  const info = STOP_INFO_MOCK;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`;
  const modal = document.getElementById('srStopModal');
  modal.innerHTML = `
    <div class="sr-stop-modal" role="dialog" aria-modal="true">
      <button class="sr-stop-close" data-stop-close aria-label="닫기">×</button>
      <div class="sr-stop-head">
        <h3>${escapeHtml(stopName)}</h3>
      </div>
      <div class="sr-stop-scroll">
        <div class="sr-stop-image">
          <img src="${escapeHtml(info.image)}" alt="${escapeHtml(stopName)}">
        </div>
        <div class="sr-stop-body">
          <div class="sr-stop-subtitle">${escapeHtml(info.subtitle)}</div>
          <div class="sr-stop-detail">${escapeHtml(info.detail)}</div>
        </div>
      </div>
      <div class="sr-stop-footer">
        <a class="sr-stop-map-btn" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">위치 보기</a>
      </div>
    </div>`;
  modal.classList.add('open');
  modal.querySelector('[data-stop-close]').addEventListener('click', closeStopInfoModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeStopInfoModal();
  });
}
function closeStopInfoModal() {
  document.getElementById('srStopModal').classList.remove('open');
}

/* ============================================================
   RENDER — 필터 사이드바 (출발/도착 그룹 + 카운트 배지)
   ============================================================ */
function renderFilters() {
  const results = SEARCH_RESULTS[currentType] || [];

  const groupHtml = (label, counts) => {
    const entries = Object.entries(counts);
    if (entries.length === 0) return '';
    return `
      <div class="sr-filter-group">
        <div class="sr-filter-group-head">
          <span class="sr-filter-label">${escapeHtml(label)}</span>
        </div>
        ${entries.map(([name, n]) => `
          <label class="sr-filter-option">
            <input type="checkbox" checked>
            <span class="sr-filter-option-text">${escapeHtml(name)}</span>
          </label>`).join('')}
      </div>`;
  };

  // 요일 chip 그룹 (월/화/수/목/금/토/일 — 토글 칩 형태)
  const dayChipsHtml = (label, activeSet, availableSet) => {
    const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const DAY_LABEL = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };
    return `
      <div class="sr-filter-group">
        <div class="sr-filter-group-head">
          <span class="sr-filter-label">${escapeHtml(label)}</span>
        </div>
        <div class="sr-filter-day-chips">
          ${DAY_ORDER.map(d => {
            const isAvailable = availableSet.has(d);
            const isActive = activeSet.has(d);
            return `<button type="button" class="sr-filter-day-chip${isActive ? ' active' : ''}${!isAvailable ? ' disabled' : ''}"
              data-day-chip="${d}" ${!isAvailable ? 'disabled' : ''}>${DAY_LABEL[d]}</button>`;
          }).join('')}
        </div>
      </div>`;
  };

  let html = '';
  if (currentType === 'travel') {
    // 여행 상품 — 지역 + 요일 필터
    const regionCounts = {};
    results.forEach(r => { regionCounts[r.region] = (regionCounts[r.region] || 0) + 1; });

    // 운영 가능한 요일 set (어떤 상품이라도 출발 가능한 요일)
    const availableDays = new Set();
    results.forEach(r => (r.saleDays || []).forEach(d => availableDays.add(d)));
    // 활성 상태는 전역 STATE에서 관리 (없으면 빈 set)
    if (!window._srDayFilter) window._srDayFilter = new Set();

    html = groupHtml('지역', regionCounts) + dayChipsHtml('출발 요일', window._srDayFilter, availableDays);
  } else if (currentType === 'tour') {
    // 투어노선 — 지역 + 출발 요일 필터 (여행상품과 동일 패턴)
    const regionCounts = {};
    results.forEach(r => {
      const region = r.region || '기타';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    const availableDays = new Set();
    results.forEach(r => (r.saleDays || []).forEach(d => availableDays.add(d)));
    if (!window._srDayFilter) window._srDayFilter = new Set();
    html = groupHtml('지역', regionCounts) + dayChipsHtml('출발 요일', window._srDayFilter, availableDays);
  } else if (currentType === 'circular') {
    // 순환노선 — 지역 필터
    const regionCounts = {};
    results.forEach(r => {
      const region = r.region || '기타';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    html = groupHtml('지역', regionCounts);
  } else {
    // 노선 결과 (일반) — 출발/도착 필터
    const fromCounts = {}, toCounts = {};
    results.forEach(r => {
      fromCounts[r.pickup.name]  = (fromCounts[r.pickup.name]  || 0) + 1;
      toCounts[r.arrival.name]   = (toCounts[r.arrival.name]   || 0) + 1;
    });
    html = groupHtml('출발', fromCounts) + groupHtml('도착', toCounts);
  }

  document.getElementById('srFilterDesktopBody').innerHTML = html;
  document.getElementById('srFilterMobileBody').innerHTML  = html;

  // 요일 chip 토글 핸들러
  document.querySelectorAll('[data-day-chip]').forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      const day = chip.dataset.dayChip;
      if (!window._srDayFilter) window._srDayFilter = new Set();
      if (window._srDayFilter.has(day)) window._srDayFilter.delete(day);
      else window._srDayFilter.add(day);
      renderFilters();   // 양쪽(desktop+mobile) chip 활성 상태 동기화
    });
  });
}

/* ============================================================
   EVENTS
   ============================================================ */
document.querySelectorAll('#srTypeTabs .sr-type-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#srTypeTabs .sr-type-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentType = tab.dataset.type;
    SELECTED_OUTBOUND = null;   // 노선 타입 변경 시 가는편 선택 초기화
    renderCards();
    renderFilters();
  });
});

// 왕복/편도 탭
document.querySelectorAll('.sr-trip-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sr-trip-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    SEARCH_QUERY.tripType = tab.dataset.trip;
    SELECTED_OUTBOUND = null;   // 왕복/편도 전환 시 가는편 선택 초기화
    applyTripType();
    renderCards();              // 헤더 라벨 갱신
  });
});

// 모바일/태블릿 필터 시트
const filterSheet = document.getElementById('srFilterSheet');
function openFilterSheet() { filterSheet.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeFilterSheet() { filterSheet.classList.remove('open'); document.body.style.overflow = ''; }

document.getElementById('srFilterToggle').addEventListener('click', openFilterSheet);
document.getElementById('srFilterSheetClose').addEventListener('click', closeFilterSheet);
document.getElementById('srFilterSheetApply').addEventListener('click', closeFilterSheet);
filterSheet.addEventListener('click', e => {
  if (e.target === filterSheet) closeFilterSheet();
});

// ESC — 정류장 모달 / 필터 시트 닫기
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('srStopModal').classList.contains('open')) closeStopInfoModal();
  if (filterSheet.classList.contains('open')) closeFilterSheet();
});

// 데스크탑 검색 (mockup)
document.querySelector('.sr-search-go')?.addEventListener('click', () => {
  alert('검색 (mockup)');
});

/* INIT */
renderHeader();
renderCards();
renderFilters();
