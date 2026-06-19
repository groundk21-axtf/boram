/* types/_init.js — TYPES registry root + catalog labels/descriptions + defaultConfigOf */

const TYPES = {};

const CATEGORY_LABEL = { content: '콘텐츠 블록', utility: '유틸리티' };
const TYPE_DESC = {
  hero: '메인 비주얼 + CTA',
  searchbar: '검색 입력바. 출/도착·일정·인원 선택.',
  routegrid: '노선 카드',
  featured: '상품 카드',
  cards: '이미지 + 제목 + 설명 카드 (그리드/슬라이더).',
  brandstory: '텍스트 + 이미지 2-컬럼 블록.',
  banner: '배너 이미지 1~3장. 이미지별 링크 + dot 페이지네이션.',
  guide: '안내 카드 1~3개. 아이콘 + 제목 + 설명.',
  faq: '접이식 질문 리스트.',
  customercenter: '풋터 상단 고객센터 정보 (TMS 벤더 연동).',
  htmlcode: '원하는 HTML/CSS를 직접 입력해 렌더링합니다.',
  divider: '섹션 사이 시각적 분리선.'
};

function defaultConfigOf(type) {
  const map = {
    hero: { eyebrow: 'Premium Mobility', title: '제목을 입력하세요', sub: '서브 카피를 입력하세요', ctaText: 'CTA 버튼', ctaUrl: '/search', ctaTarget: '_self', alignment: 'left', overlayEnabled: true },
    searchbar: { searchCondition: 'route', destination: 'vivaldi', tripType: 'both', locationDepth1: 'region', locationDepth2: 'stop', keyPointsEnabled: true, keyPointType: 'destination', searchOrder: 'placeFirst' },
    routegrid: { title: '내 출발지 찾기', sub: '가장 가까운 탑승장을 확인하세요.', layoutType: 'list', routes: [], routeOrder: [], collapseMode: 'default', bgColor: '', bgImage: [], assets: [] },
    featured: {
      layoutType: 'grid',
      title: '상품', sub: '',
      selectionMode: 'manual',
      products: [], productOrder: [],
      displayCriteria: 'day',
      bgColor: '', bgImage: [], assets: []
    },
    cards: {
      title: '카드 섹션 제목', sub: '',
      cards: [
        { id: 'card_' + Math.random().toString(36).slice(2, 8), image: null, title: '카드 제목 1', body: '카드 설명을 입력하세요.' },
        { id: 'card_' + Math.random().toString(36).slice(2, 8), image: null, title: '카드 제목 2', body: '카드 설명을 입력하세요.' },
        { id: 'card_' + Math.random().toString(36).slice(2, 8), image: null, title: '카드 제목 3', body: '카드 설명을 입력하세요.' }
      ],
      bgColor: '', bgImage: [], assets: []
    },
    brandstory: { title: '제목을 입력하세요', body: '본문을 입력하세요.', image: [], imagePosition: 'right', textAlign: 'left', ctaText: '자세히 보기', ctaUrl: '', ctaTarget: '_self', ctaBgColor: '#1A1A1A', ctaTextColor: '#FFFFFF', bgColor: '' },
    banner: { images: [], bgColor: '#FFFFFF' },
    guide: {
      title: '이용안내', sub: '꼭 확인하세요.',
      cardCount: 3,
      card1Icon: 'bus',      card1Title: '카드 제목 1', card1Body: '카드 내용을 입력하세요.',
      card2Icon: 'calendar', card2Title: '카드 제목 2', card2Body: '카드 내용을 입력하세요.',
      card3Icon: 'calendarX', card3Title: '카드 제목 3', card3Body: '카드 내용을 입력하세요.',
      bgColor: '#F8FAFC', bgImage: []
    },
    faq: { title: '자주 묻는 질문', sub: '', count: 5, showMore: true, bgColor: '', bgImage: [] },
    customercenter: {
      enabled: true,
      syncWithVendor: true,
      phone: '1577-0000',
      email: 'help@groundk.com',
      website: 'https://www.groundk.com',
      hours: '평일 09:00 - 18:00\n주말/공휴일 휴무',
      languages: ['ko', 'en', 'ja'],
      bgColor: '#F8FAFC',
      titleColor: '#1A1A1A',
      textColor: '#4B5563'
    },
    htmlcode: { code: '<div style="padding:48px 24px; text-align:center;">\n  <h2 style="font-size:24px; font-weight:800;">자유 영역</h2>\n  <p style="margin-top:8px; color:#6B7280;">원하는 HTML과 CSS를 자유롭게 작성하세요.</p>\n</div>', maxWidth: 'container', bgColor: '' },
    divider: { lineStyle: 'solid', lineColor: '#EAEAEA', opacity: 100 }
  };
  return JSON.parse(JSON.stringify(map[type] || {}));
}

