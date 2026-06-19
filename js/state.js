/* state.js — central STATE object + getPage() accessor */

const STATE = {
  // 'website-list': 빌더로 생성한 웹사이트들의 목록 화면
  // 'page-builder' (default): 단일 웹사이트의 페이지 미리보기 + 섹션 트리 빌더
  // 'site-settings': 사이트 전역 설정 화면
  view: 'page-builder',
  // 사용자가 빌더로 생성한 웹사이트 목록 (mockup — 메타데이터만)
  websites: [
    { id: 'site_vivapark',  name: '비발디파크 셔틀', domain: 'vivapark',   defaultLang: 'ko', operator: '그라운드케이', vendor: '대명관광',     memberBooking: true,  guestBooking: true,  pg: 'integrated', status: 'live',  createdAt: '2026-03-15 13:59', updatedAt: '2026-05-22 01:19', thumbBg: "linear-gradient(135deg, #0E5F4A 0%, #4FC3F7 100%)", isCurrent: true },
    { id: 'site_groundk',   name: '그라운드케이 투어', domain: 'groundk',   defaultLang: 'ko', operator: '그라운드케이', vendor: '그라운드케이', memberBooking: true,  guestBooking: false, pg: 'self',       status: 'draft', createdAt: '2026-04-22 09:12', updatedAt: '2026-05-25 18:04', thumbBg: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)" },
    { id: 'site_oceanworld', name: '오션월드 예약',    domain: 'oceanworld', defaultLang: 'ko', operator: '그라운드케이', vendor: '대명관광',     memberBooking: false, guestBooking: true,  pg: 'integrated', status: 'live',  createdAt: '2026-05-10 11:30', updatedAt: '2026-05-26 23:48', thumbBg: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)" }
  ],
  currentWebsiteId: 'site_vivapark',
  currentPage: 'home',
  currentDevice: 'desktop',
  currentLang: 'ko',
  selectedSectionId: null,
  rightTab: 'props',
  pageStatus: 'draft',

  theme: {
    primary: '#2563EB',
    primaryStrong: '#1D4ED8',
    text: '#0F172A',
    bg: '#F8FAFC',
    radius: 6
  },

  // Site-wide settings (basic info, design tokens, login policy, payment).
  site: {
    title: '비발디파크 셔틀버스',
    domainPrefix: 'vivapark',                 // → vivapark.rideus.net
    defaultLanguage: 'ko',
    supportedLanguages: ['ko', 'en', 'ja','zh-cn', 'zh-tw', 'fr', 'de', 'es'],
    // SEO meta — title comes from `title` field above.
    seoDescription: '',
    seoKeywords: '',
    ogImage: null,                            // { id, name, bg } or null
    favicon: {
      id: 'fav_default',
      name: 'favicon.png',
      bg: "url('https://cdn.rideus.net/uploads/0003/3016/2023/07/07/favicon.png')"
    },
    memberBooking: true,
    guestBooking: true,
    guestFields: ['name', 'email', 'phone'],   // collected fields when guestBooking is ON
    // Agreement documents shown at signup/booking.
    // type: 'url' (link) | 'text' (직접입력). required: 필수 동의(true) | 선택 동의(false)
    terms: [
      { name: '이용약관',          type: 'url', required: true,  value: 'https://groundk.notion.site/RIDEUS-20da594d587b4bf18dc09720b9997027?pvs=4' },
      { name: '개인정보처리방침', type: 'url', required: true,  value: 'https://groundk.notion.site/RIDEUS-e659d6ede5a040a88c6126ed50deec98' }
    ],
    socialLogins: {
      kakao:  { enabled: true },
      naver:  { enabled: true },
      google: { enabled: true },
      apple:  { enabled: true }
    },
    payment: {
      pgType: 'integrated',                   // integrated (TMS 통합PG) / self (자체 PG)
      // Credit card processing PG (only used when pgType === 'self')
      pgProvider: 'TOSS',                     // TOSS / INICIS / NICEPAY / KCP / KICC / SETTLEBANK
      pgCredentials: {
        TOSS:       { clientKey: '', secretKey: '' },
        INICIS:     { mid: '', signKey: '', merchantKey: '' },
        NICEPAY:    { mid: '', merchantKey: '' },
        KCP:        { siteCode: '', siteKey: '' },
        KICC:       { mallId: '', authKey: '' },
        SETTLEBANK: { mid: '', licenseKey: '' }
      },
      // Real-time account transfer PG (only used when pgType === 'self' & account enabled)
      accountProvider: 'INICIS',              // INICIS / TOSS / NICEPAY
      accountCredentials: {
        INICIS:  { mid: '', signKey: '', iniliteKey: '', aesKey: '', aesIv: '', apiKey: '' },
        TOSS:    { clientKey: '', secretKey: '', apiVersion: '' },
        NICEPAY: { clientId: '', secretKey: '' }
      },
      methods: {
        creditCard: { enabled: true,  required: true },
        paypal:     { enabled: false, credentials: { merchantId: '', key: '' } },
        eximbay:    { enabled: false, credentials: { merchantId: '', key: '' } },
        account:    { enabled: false }
      },
      // Simple pay providers (각자 다른 credential 스키마)
      simplePay: {
        KAKAOPAY:   { enabled: false, cid: '', secretKey: '' },
        NAVERPAY:   { enabled: false, clientId: '', clientSecret: '', chainId: '' },
        PAYCO:      { enabled: false, clientId: '', secretKey: '' },
        TOSSPAY:    { enabled: false, clientKey: '', secretKey: '' },
        APPLEPAY:   { enabled: false, merchantId: '' },
        SAMSUNGPAY: { enabled: false, serviceId: '' }
      }
    }
  },

  languages: [
    { code: 'KO', label: 'KO', status: 'complete' },
    { code: 'EN', label: 'EN', status: 'complete' },
    { code: 'JA', label: 'JA', status: 'partial' },
    { code: 'ZH', label: 'ZH-TW', status: 'empty' }
  ],

  // 자주 묻는 질문 — 구분값 (어드민에서 추가/삭제 가능)
  faqCategories: ['예약', '취소/환불', '이용방법', '기타'],

  // 자주 묻는 질문 페이지 콘텐츠 (구분/질문/답변). 홈 FAQ 섹션이 여기서 질문을 읽어옴.
  faqPage: [
    { category: '예약', question: '편도만 예약 가능한가요?', answer: '네, 편도만 예약 가능합니다.' },
    { category: '예약', question: '동행자의 티켓도 같이 구매할 수 있나요?', answer: '예약 시 인원을 추가하면 동행자 티켓을 함께 구매할 수 있습니다.' },
    { category: '취소/환불', question: '예약 인원을 부분 취소할 수 있나요?', answer: '출발 전날 16시 이전까지 인원 단위 부분 취소가 가능합니다.' },
    { category: '취소/환불', question: '왕복 예약 후 편도만 취소할 수 있나요?', answer: '왕복 예약 건은 가는 편/오는 편을 개별 취소할 수 있습니다.' },
    { category: '취소/환불', question: '출발 전 취소 시 환불 정책이 어떻게 되나요?', answer: '출발 전날 16시 이전 취소 시 전액 환불됩니다. 이후에는 환불이 불가합니다.' },
    { category: '이용방법', question: '탑승 장소는 어떻게 확인하나요?', answer: '예약 완료 후 발송되는 안내 메시지 또는 노선 상세에서 확인할 수 있습니다.' },
    { category: '이용방법', question: '셔틀 출발 시간에 늦으면 어떻게 되나요?', answer: '셔틀은 정시 출발하며 지연 탑승은 불가합니다. 출발 5분 전 탑승을 완료해주세요.' },
    { category: '기타', question: '반려동물과 함께 탑승할 수 있나요?', answer: '케이지 동반 소형 반려동물에 한해 탑승 가능합니다.' }
  ],

  pageMeta: {
    home:           { name: '메인',         icon: 'home',   locked: false, ready: true, enabled: true, path: '/' },
    'static-faq':   { name: '자주 묻는 질문', icon: 'help',   locked: false, ready: true, enabled: true, path: '/faq' },
    'custom-oceanworld': { name: '오션월드 안내', icon: 'doc', locked: false, ready: true, enabled: true, custom: true, path: '/oceanworld' },
  },

  // Only home page is fully implemented in Phase 1
  pages: {
    home: {
      sections: [
        { id: uid(), type: 'header', locked: true,
          config: {
            logoImage: [],
            showGnb: true,
            gnbPages: ['home', 'static-faq','custom-oceanworld'],
            previewLoggedIn: false
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'hero', locked: false,
          config: {
            images: [
              { id: 'img_oceanworld', name: 'ocean-world-hero.webp', bg: "url('https://k.rideus.net/assets/theme_ocean-world_hero.webp')", size: '2400×1200' },
              { id: 'img_sono', name: 'sono-resort-hero.jpg', bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/GKDcADyluG6pU3cKgmz5sQ==/1')", size: '2400×1200' }
            ],
            eyebrow: 'New World, Ocean World!',
            title: '비발디파크 셔틀버스 예약',
            sub: 'SONO WATER PARK 26 시즌',
            ctaText: '오션월드 홈페이지',
            ctaUrl: 'https://www.sonohotelsresorts.com/oceanWorld',
            ctaTarget: '_blank',
            ctaBgColor: '#2563EB',
            ctaTextColor: '#FFFFFF',
            alignment: 'left'
          },
          visibility: { desktop: true, tablet: true, mobile: true },
          overrides: { mobile: { title: '비발디파크 셔틀버스 예약' } }
        },
        { id: uid(), type: 'searchbar', locked: false,
          config: {
            searchCondition: 'route',
            destination: 'vivaldi',
            tripType: 'both',
            locationDepth1: 'region',
            locationDepth2: 'stop',
            keyPointsEnabled: true,
            keyPointType: 'destination',
            searchOrder: 'placeFirst'
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'divider', locked: false,
          config: { lineStyle: 'solid', lineColor: '#E8E8E8', opacity: 100 },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'routegrid', locked: false,
          config: {
            title: '내 출발지 찾기',
            sub: '가장 가까운 탑승장을 확인하세요.',
            titleColor: '#FFFFFF',
            subColor: '#FFFFFF',
            routes: ['r_viva_01', 'r_viva_02', 'r_viva_04'],
            routeOrder: ['r_viva_01', 'r_viva_02', 'r_viva_04'],
            collapseMode: 'default',
            layoutType: 'list',
            bgColor: '#3664c9',
            bgImage: [
              { id: 'img_routegrid_bg', name: 'routegrid-bg.png', bg: "url('https://cdn.rideus.net/uploads/0007/7651/2026/03/12/28a77c45110783de27e786b8519bfa12_2.png')", size: '2400×1200' }
            ],
            assets: [
              { id: 'asset_routegrid_br', name: 'routegrid-asset-br.png', bg: "url('https://cdn.rideus.net/uploads/0007/7651/2026/03/12/4b1bda7b774570d3ff0f9e73d3bc620c.png')", size: '240×160', position: 'bottom-right', width: 220 }
            ]
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'routegrid', locked: false,
          config: {
            title: '귀가행',
            sub: '비발디파크에서 돌아가는 셔틀 시간을 확인하세요.',
            titleColor: '#000000',
            subColor: '#000000',
            routes: ['r_viva_09', 'r_viva_07', 'r_viva_08'],
            routeOrder: ['r_viva_09', 'r_viva_07', 'r_viva_08'],
            collapseMode: 'default',
            layoutType: 'map',
            bgColor: '#ffffff',
            bgImage: [],
            assets: [
              { id: 'asset_routegrid_br', name: 'routegrid-asset-br.png', bg: "url('https://cdn.rideus.net/uploads/0007/7651/2026/03/12/6376c3642f9750c288de062c37453ae2.png')", size: '240×160', position: 'bottom-left', width: 220 }
            ]
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'routegrid', locked: false,
          config: {
            title: '서울 시티투어',
            sub: '노랑풍선시티버스 투어 코스와 함께하기',
            titleColor: '#1A1A1A',
            subColor: '#6B7280',
            routes: ['r_viva_10', 'r_viva_11', 'r_viva_12', 'r_viva_13', 'r_viva_14'],
            routeOrder: ['r_viva_10', 'r_viva_11', 'r_viva_12', 'r_viva_13', 'r_viva_14'],
            collapseMode: 'default',
            layoutType: 'slider',
            bgColor: '#ffffff',
            bgImage: [],
            assets: []
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'featured', locked: false,
          config: {
            selectionMode: 'auto',
            layoutType: 'slider',
            title: '남도한바퀴',
            titleColor: '#1A1A1A',
            sub: '요일마다 즐기는 각양각색의 여행을 즐기세요!',
            subColor: '#6B7280',
            displayCriteria: 'day',
            products: [],
            productOrder: [],
            bgColor: '#fafafa',
            bgImage: [],
            assets: []
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },        
        { id: uid(), type: 'featured', locked: false,
          config: {
            selectionMode: 'manual',
            layoutType: 'slider',
            title: '올 봄, 여행은 유행, 지역은 흥행',
            sub: '봄바람 따라 떠나는 힐링 여행, 꽃과 자연이 반기는 순간',
            products: ['p_01', 'p_02', 'p_03', 'p_05', 'p_06'],
            productOrder: ['p_01', 'p_02', 'p_03', 'p_06', 'p_05'],
            bgColor: '',
            bgImage: [
              { id: 'img_featured_bg', name: 'slidebg2.png', bg: "url('https://cdn.rideus.net/uploads/0003/3016/2025/04/08/slidebg2.png')", size: '' }
            ],
            assets: [
              { id: 'asset_featured_br', name: 'featured-asset-br.png', bg: "url('https://cdn.rideus.net/uploads/0007/7651/2026/03/12/a538978d649ee231fcec8b2e0e872fc1_1.png')", size: '484×680', position: 'bottom-right', width: 200 }
            ]
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'featured', locked: false,
          config: {
            selectionMode: 'manual',
            layoutType: 'grid',
            title: '어디로 떠날지 고민되는 순간',
            sub: '검증된 코스로 당신의 여행지도를 빈틈없이 채워드려요.',
            products: ['p_01', 'p_02', 'p_03', 'p_05', 'p_06', 'p_07', 'p_08', 'p_09'],
            productOrder: ['p_01', 'p_02', 'p_03', 'p_06', 'p_05', 'p_07', 'p_08', 'p_09'],
            bgColor: '#fafafa',
            bgImage: [ ],
            assets: [ ]
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'brandstory', locked: false,
          config: {
            title: '오션월드 빌리지 온라인예약',
            body: '세상에 처음 선보이는 하이엔드 워터 플레이 시그니처. 오션월드의 무한한 즐거움을 담은 오션월드 빌리지로 초대합니다. \n 오션월드 입장권은 물론 물놀이 용품 무료 대여, F&B 할인쿠폰, 전용 라운지와 주차장까지! 오직 8팀만 이용하실 수 있는 특별한 스테이 경험을 선사합니다.',
            image: [
              { id: 'img_brandstory_main', name: 'slide-img2.jpg', bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/kLhzBYiY7hpcCdAfTa-rZg==/1')", size: '' }
            ],
            imagePosition: 'right',
            bgColor: '#ffffff',
            bgImage: [],
            ctaText: '예약하기',
            ctaUrl: 'https://www.sonohotelsresorts.com/complex_vp/roomsviewall/detail/RM00069611',
            ctaTarget: '_blank',
            ctaBgColor: '#2563EB',
            ctaTextColor: '#FFFFFF',
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'banner', locked: false,
          config: {
            images: [
              {
                id: 'img_banner_01',
                name: 'bnr_1c.jpg',
                bg: "url('https://image.hanatour.com/usr/manual/event/2026/EV1000000546/04/bnr/bnr_1c.jpg')",
                size: '',
                url: 'https://vivabus.co.kr/sono',
                target: '_blank'
              },
              {
                id: 'img_banner_02',
                name: 'bnr_1c_080.jpg',
                bg: "url('https://image.hanatour.com/usr/manual/update/pc/air/1c/bnr_1c_080.jpg')",
                size: '',
                url: 'https://vivabus.co.kr/sono',
                target: '_blank'
              }
            ],
            bgColor: '#FFFFFF'
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'guide', locked: false,
          config: {
            title: '이용안내',
            titleColor: '#1A1A1A',
            sub: '셔틀 예약부터 탑승까지 꼭 확인하세요.',
            subColor: '#6B7280',
            cardCount: 3,
            card1Icon: 'bus',
            card1Title: '출발 5분 전 탑승 완료',
            card1Body: '모든 셔틀은 정시 출발하며,\n지연 탑승은 불가합니다.',
            card2Icon: 'calendar',
            card2Title: '전날 16시까지 예약 가능',
            card2Body: '선착순 마감이며, 사전 안내없이\n조기 마감될 수 있습니다.',
            card3Icon: 'calendarX',
            card3Title: '전날 16시 전까지 취소 가능',
            card3Body: '이후에는 이용하지 않더라도\n취소가 불가합니다.',
            bgColor: '#F8FAFC',
            bgImage: []
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'faq', locked: false,
          config: {
            title: '자주 묻는 질문',
            sub: '예약 전 가장 많이 궁금해하는 질문들',
            count: 5,
            showMore: true,
            bgColor: '',
            bgImage: []
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'customercenter', locked: true,
          config: {
            enabled: true,
            syncWithVendor: true,
            phone: '1544-1544',
            email: 'cs@kumho.com',
            website: 'https://www.kumhoaround.com/',
            hours: '평일 09:00 - 18:00 (KST)',
            languages: ['ko', 'en', 'ja'],
            bgColor: '#F8FAFC',
            titleColor: '#1A1A1A',
            textColor: '#4B5563'
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        { id: uid(), type: 'footer', locked: true,
          config: {
            showTerms: true,
            tagline: '교통 X 여행 No.1 플랫폼\n그라운드케이',
            taglineDesc: '어디를 가든, 누구와 가든, 그라운드케이가 있다면 가볍게 떠날 수 있습니다.\n쉽고, 빠르고, 편안한 이동을 경험하세요.',
            companyName: '(주)그라운드케이',
            ceo: '장동원',
            address: '부산광역시 해운대구 센텀동로 45, 405호',
            bizNumber: '238-81-00429',
            mailOrderNumber: '제2018-서울강서-1293호',
            tel: '+82-2-863-3540',
            fax: '+82-70-8275-3540',
            email: 'ops@rideus.co.kr',
            termsColor: '#D0D0D0',
            taglineColor: '#FFFFFF',
            taglineDescColor: '#BBBBBB',
            companyColor: '#FFFFFF',
            bizInfoColor: '#999999',
            bgColor: '#1A1A1A',
            bgImage: [],
            assets: []
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        }
      ]
    },
    'custom-oceanworld': {
      sections: [
        // ── 1. Hero ──
        { id: uid(), type: 'hero', locked: false,
          config: {
            eyebrow: 'OCEAN WORLD',
            title: '여름엔 역시 오션월드',
            sub: '국내 최대 워터파크, 비발디파크 오션월드에서 만나는 짜릿한 여름.',
            ctaTextEnabled: false,
            ctaText: '',
            ctaUrl: '',
            ctaTarget: '',
            ctaBgColor: '',
            ctaTextColor: '',
            alignment: 'left',
            overlayEnabled: false,
            eyebrowColor: '#262626',
            titleColor: '#262626',
            subColor: '#262626',
            images: [
              { id: 'img_oceanworld', name: 'ocean-world-hero.webp', bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/nWUBSrVI5l1-K1Y4lV4JOg==/1')", size: '2400×1200' }
            ]
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        // ── 2. Cards (인기 어트랙션) ──
        { id: uid(), type: 'cards', locked: false,
          config: {
            title: '아쿠아존 어트랙션',
            sub: '오션월드에서 가장 사랑받는 즐길거리',
            titleColor: '#1A1A1A',
            subColor: '#6B7280',
            cards: [
              {
                id: 'card_ow_1',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/r8lgnGMZrxC7iVJ4y1IUUw==/1')" },
                title: '파도풀',
                body: '다양한 모양과 높이의 파도를 즐기세요! 시원하게 부서지는 파도를 보고, 듣고, 느끼는 즐거움을 선사합니다.'
              },
              {
                id: 'card_ow_2',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/vuYCDmI4yhnPLOt4r75jzA==/1')" },
                title: '파라오스파',
                body: '수온 38~42℃, 2개의 스파[수심  64m / 66cm],  사우나 도크 시설 휴식 및 체온유지를 위한 공간으로 물놀이 및 수영은 금지 합니다.'
              },
              {
                id: 'card_ow_3',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/rIephg2alBwTIgbQg1uAXw==/1')" },
                title: '텀블 웨이브 슬라이드',
                body: '최고 높이  2.78m, 수심  0.5m, 전체길이  17.4m, 폭  3m \n 신장 110cm 이상  150cm 미만 어린이 전용 어트랙션 입니다.'
              },
              {
                id: 'card_ow_4',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/OLVVlKwFBcVRqScWl9KXrw==/1')" },
                title: '워터플렉스',
                body: '놀이터의 미끄럼틀, 정글짐만큼이나 재미있는 갖가지 놀이시설들이 마치 미지의 세계를 탐험하는 듯한 흥분을 전합니다. 특히 꼭대기의 바스켓이 1.5t의 물이 다 채워져 아래로 폭포처럼 쏟아질 때 그 시원한 물줄기는 여름철 무더위도 날릴만큼 가슴 속까지 후련하게 만듭니다.'
              },
              {
                id: 'card_ow_5',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/RUokH0C4UIiJa1UoFOYq7w==/1')" },
                title: '실내 슬라이드',
                body: '이음새가 거의 느껴지지 않도록 매끄럽게 제작된 특수 재질의 슬라이드로 짜릿한 속도감을 즐길 수 있습니다.'
              },
              {
                id: 'card_ow_6',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/TcDBBJuFj869nemBn5CwxA==/1')" },
                title: '실내 유수풀',
                body: '야외존과 연결되어 있는 유수풀로 실내와 야외를 편안하고 여유롭게 즐길 수 있습니다.'
              },
              {
                id: 'card_ow_7',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/SRdiS32zbywYaWip-6luWw==/1')" },
                title: '타워풀',
                body: '수온 38~42℃, 2개의 온탕[수심  60m / 65.5m] / 휴식 및 체온유지를 위한 공간으로 물놀이 및 수영은 금지 합니다.'
              },
              {
                id: 'card_ow_8',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/RrODFow9VrTRvy7ea8bmXg==/1')" },
                title: '키즈풀',
                body: '소형 슬라이드, 상상력을 자극하는 각종 조형물들은 안전은 물론 어린이들의 감각을 자극시키기 위해 세심하게 설계되었습니다.'
              },
              {
                id: 'card_ow_9',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/LHQu6QOjtZSbhPj40557yA==/1')" },
                title: '아쿠아풀',
                body: '4계절 즐길 수 있는 다양한 아쿠아 마사지 시설과 넓은 메인 풀'
              },
              {
                id: 'card_ow_10',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/NAWaKp6TkUlnj3z_SF04AA==/1')" },
                title: '실외 유수풀',
                body: '실내존과 연결되어 있는 유수풀로 실내와 야외를 편안하고 여유롭게 즐길 수 있습니다.'
              },
              {
                id: 'card_ow_11',
                image: { bg: "url('https://www.sonohotelsresorts.com/api/hms/user/management/file/image/ZSmXNjW-I5ROqrZ8iZKQ4w==/1')" },
                title: '야외 노천탕&이벤트탕',
                body: '수온 38~42℃, 4개의 이벤트탕 [수심  67cm / 63cm / 66cm / 66.5cm] 휴식 및 체온유지를 위한 공간으로 물놀이 및 수영은 금지 합니다.'
              }
            ],
            bgColor: '#fafafa',
            bgImage: [], assets: []
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },
        // ── 3. Brand story ──
        { id: uid(), type: 'brandstory', locked: false,
          config: {
            title: 'New World, Ocean World!',
            body: '사막처럼 뜨거운 여름날의 무더위를 식혀 주는 오션월드\n자연 환경을 최대한 보존하며 지어진 오션월드는 고대 이집트와 사막 속 오아시스를 모티브로 만들어졌습니다.\n사막의 오아시스처럼 일상의 갈증을 오션월드에서 풀어보세요!\n사계절 내내 다양한 어트렉션을 즐기며 짜릿한 즐거움을 선사합니다.',
            image: [],
            imagePosition: 'left',
            textAlign: 'center',
            ctaText: '운영상황 보기',
            ctaUrl: 'https://www.sonohotelsresorts.com/oceanWorld/stauts',
            ctaTarget: '_blank',
            ctaBgColor: '#0A6EB4',
            ctaTextColor: '#FFFFFF',
            bgColor: '#FFFFFF'
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        },        
        // ── 4. Guide (3 cards) ──
        { id: uid(), type: 'guide', locked: false,
          config: {
            title: '이용 안내',
            sub: '방문 전 꼭 확인해 주세요',
            titleColor: '#1A1A1A',
            subColor: '#6B7280',
            cardCount: 3,
            card1Icon: 'calendar', card1Title: '운영 시간',   card1Body: '09:00 – 18:00 (성수기 09:00 – 22:00)\n매주 화요일 정기 휴무 (시즌별 상이)',
            card2Icon: 'ticket',   card2Title: '입장 요금',   card2Body: '종일권 / 오후권 / 야간권 구분\n청소년·경로 할인, 단체 패키지 제공',
            card3Icon: 'info',     card3Title: '시설 안내',   card3Body: '7개 테마 존, 라커룸 / 푸드코트 완비\n수영복·튜브 대여 가능',
            bgColor: '#F8FAFC',
            bgImage: []
          },
          visibility: { desktop: true, tablet: true, mobile: true }, overrides: {}
        }
      ]
    }
  }
};

/* GETTERS */
function getPage() { return STATE.pages[STATE.currentPage]; }
