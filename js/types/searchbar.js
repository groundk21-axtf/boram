/* types/searchbar.js */

TYPES.searchbar = {
  name: '검색바', category: 'content', icon: ICN.search,
  fields: [
    { key: 'searchCondition', label: '검색 조건', type: 'segmented', affectsForm: true,
      options: [
        { value: 'route',      label: '일반노선' },
        { value: 'route-loop', label: '순환노선' },
        { value: 'route-tour', label: '투어노선' },
        { value: 'travel',     label: '여행상품' }
      ],
      help: '검색바에서 제공할 검색 유형입니다. (중복 선택 불가)'
    },
    { key: 'destination', label: '목적지 선택', type: 'select',
      options: SEARCH_DESTINATION_OPTIONS,
      showWhen: (cfg) => ['route', 'route-loop', 'route-tour'].includes(cfg.searchCondition || 'route'),
      help: '노선 검색의 기준 목적지입니다.'
    },
    { key: 'tripType', label: '여정 검색', type: 'segmented',
      options: [
        { value: 'oneway', label: '편도' },
        { value: 'roundtrip', label: '왕복' },
        { value: 'both', label: '편도+왕복' }
      ],
      showWhen: (cfg) => (cfg.searchCondition || 'route') === 'route',
      help: "'노선' 검색 조건에서만 사용됩니다. 순환·투어·여행 상품은 편도 형식으로 노출됩니다."
    },
    { key: 'locationDepth1',
      label: (cfg) => (cfg.searchCondition || 'route') === 'route'
        ? '출/도착지 — 1Depth (필수)'
        : '출발지 — 1Depth (필수)',
      type: 'select',
      options: [
        { value: 'region', label: '지역' },
        { value: 'zone',   label: '구역' },
        { value: 'route',  label: '노선' },
        { value: 'stop',   label: '정거장' }
      ],
      affectsForm: true,
      showWhen: (cfg) => ['route', 'route-loop', 'route-tour'].includes(cfg.searchCondition || 'route'),
      help: '1단계 선택 단위입니다. (선택 필수)'
    },
    { type: 'divider',
      showWhen: (cfg) => ['route', 'route-loop', 'route-tour'].includes(cfg.searchCondition || 'route')
    },
    { key: 'locationDepth2',
      label: (cfg) => (cfg.searchCondition || 'route') === 'route'
        ? '출/도착지 — 2Depth'
        : '출발지 — 2Depth',
      type: 'select',
      options: [
        { value: 'none',   label: '사용안함' },
        { value: 'region', label: '지역' },
        { value: 'zone',   label: '구역' },
        { value: 'route',  label: '노선' },
        { value: 'stop',   label: '정거장' }
      ],
      showWhen: (cfg) => ['route', 'route-loop', 'route-tour'].includes(cfg.searchCondition || 'route'),
      help: "'사용안함' 선택 시 1Depth만 사용됩니다."
    },
    { key: 'keyPointsEnabled', label: '주요지점 노출', type: 'toggle', affectsForm: true,
      showWhen: (cfg) => ['route', 'route-loop', 'route-tour'].includes(cfg.searchCondition || 'route'),
      help: '검색바 하단에 주요지점 빠른 선택 칩을 노출합니다.'
    },
    { key: 'keyPointType', label: '주요지점 설정', type: 'segmented',
      options: [
        { value: 'destination', label: '목적지' },
        { value: 'stop',        label: '정거장' }
      ],
      showWhen: (cfg) => ['route', 'route-loop', 'route-tour'].includes(cfg.searchCondition || 'route') && cfg.keyPointsEnabled === true,
      help: '주요지점으로 노출할 단위를 선택합니다.'
    },
    { key: 'searchOrder', label: '검색 순서', type: 'segmented',
      options: [
        { value: 'placeFirst', label: '장소 → 날짜' },
        { value: 'dateFirst', label: '날짜 → 장소' }
      ],
      help: '검색바 필드 노출 순서를 선택합니다. (공통)'
    }
  ],
  render: (cfg, ctx) => {
    const sid = (ctx && ctx.sectionId) || '';
    const sel = (STATE.searchSelected && STATE.searchSelected[sid]) || {};
    const cond = cfg.searchCondition || 'route';
    const isRoute = cond === 'route';
    const isTravel = cond === 'travel';
    const isTour = cond === 'route-tour';
    // 투어노선은 여행상품과 동일한 검색바 UI 사용 (여행지 + 가는날 + 인원)
    const isTravelStyle = isTravel || isTour;

    // 'both' 모드일 때 현재 활성 탭은 STATE에서. 'oneway'/'roundtrip' 고정 모드는 그대로.
    const tripType = isRoute ? (cfg.tripType || 'both') : 'oneway';
    let activeTrip = 'oneway';
    if (isRoute) {
      if (tripType === 'oneway' || tripType === 'roundtrip') activeTrip = tripType;
      else activeTrip = (STATE.searchTripActive && STATE.searchTripActive[sid]) || 'oneway';
    }

    let tabsHtml = '';
    if (isRoute) {
      if (tripType === 'oneway') {
        tabsHtml = `<div class="ps-search-tabs"><span class="ps-search-tab active">편도</span></div>`;
      } else if (tripType === 'roundtrip') {
        tabsHtml = `<div class="ps-search-tabs"><span class="ps-search-tab active">왕복</span></div>`;
      } else {
        tabsHtml = `<div class="ps-search-tabs">
          <span class="ps-search-tab ${activeTrip === 'oneway' ? 'active' : ''}" data-trip-tab="oneway" data-sid="${sid}">편도</span>
          <span class="ps-search-tab ${activeTrip === 'roundtrip' ? 'active' : ''}" data-trip-tab="roundtrip" data-sid="${sid}">왕복</span>
        </div>`;
      }
    }

    const showReturn = isRoute && activeTrip === 'roundtrip';
    const destOpt = SEARCH_DESTINATION_OPTIONS.find(d => d.value === cfg.destination);
    const toValue = destOpt ? destOpt.label : '어디로 갈까요?';

    const spopOpen = STATE.searchPopover && STATE.searchPopover.sid === sid ? STATE.searchPopover.kind : null;
    const dateOpen = spopOpen === 'date';
    const personOpen = spopOpen === 'person';

    const dateSel = (STATE.searchDate && STATE.searchDate[sid]) || {};
    const fmtDot = (s) => s ? s.replace(/-/g, '.') : '';
    const goText = dateSel.go ? fmtDot(dateSel.go) : '가는 날 선택';
    const backText = dateSel.back ? fmtDot(dateSel.back) : '오는 날 선택';

    const dateFieldHtml = showReturn
      ? `<div class="search-field merged${dateOpen ? ' spop-open' : ''}" data-spop-trigger="date" data-sid="${sid}">
          <span class="search-field-icon search-cal"></span>
          <div><span class="search-field-label">가는 날</span><span class="search-field-value">${escapeHtml(goText)}</span></div>
          <span class="search-field-divider"></span>
          <span class="search-field-icon search-cal"></span>
          <div><span class="search-field-label">오는 날</span><span class="search-field-value">${escapeHtml(backText)}</span></div>
          ${dateOpen ? renderDatePopover(sid, true) : ''}
        </div>`
      : `<div class="search-field${dateOpen ? ' spop-open' : ''}" data-spop-trigger="date" data-sid="${sid}">
          <span class="search-field-icon search-cal"></span>
          <div><span class="search-field-label">가는 날</span><span class="search-field-value">${escapeHtml(goText)}</span></div>
          ${dateOpen ? renderDatePopover(sid, false) : ''}
        </div>`;

    const personCount = (STATE.searchPerson && STATE.searchPerson[sid]) || 1;
    const personFieldHtml = `<div class="search-field${personOpen ? ' spop-open' : ''}" data-spop-trigger="person" data-sid="${sid}">
      <span class="search-field-icon search-person"></span>
      <div><span class="search-field-label">인원</span><span class="search-field-value">${personCount}</span></div>
      ${personOpen ? renderPersonPopover(sid) : ''}
    </div>`;
    const searchBtnHtml = `<button class="search-go">${ICN.search}<span>검색</span></button>`;

    let bodyFields;
    if (isTravelStyle) {
      // 여행상품·투어노선: 여행지 · 가는 날 · 인원
      const regionOpen = spopOpen === 'region';
      const regionVal = sel.region || '여행지를 선택하세요';
      const regionFieldHtml = `<div class="search-field${regionOpen ? ' spop-open' : ''}" data-spop-trigger="region" data-sid="${sid}">
        <span class="search-field-icon search-pin-from"></span>
        <div><span class="search-field-label">여행지</span><span class="search-field-value">${escapeHtml(regionVal)}</span></div>
        ${regionOpen ? renderRegionPopover(sid) : ''}
      </div>`;
      bodyFields = cfg.searchOrder === 'dateFirst'
        ? [dateFieldHtml, regionFieldHtml, personFieldHtml, searchBtnHtml]
        : [regionFieldHtml, dateFieldHtml, personFieldHtml, searchBtnHtml];
    } else {
      // 일반노선: 출발 · 도착 · 가는 날 · 인원
      // 순환·투어: 출발 · 가는 날 · 인원 (도착 없음)
      const fromVal = sel.from || '어디에서 출발하세요?';
      const fromFieldHtml = `<div class="search-field${spopOpen === 'from' ? ' spop-open' : ''}" data-spop-trigger="from" data-sid="${sid}">
        <span class="search-field-icon search-pin-from"></span>
        <div><span class="search-field-label">출발</span><span class="search-field-value">${escapeHtml(fromVal)}</span></div>
        ${spopOpen === 'from' ? renderSearchPopover(sid, 'from', cfg) : ''}
      </div>`;
      const showTo = (cond === 'route');
      const toVal = sel.to || toValue;
      const toFieldHtml = showTo ? `<div class="search-field${spopOpen === 'to' ? ' spop-open' : ''}" data-spop-trigger="to" data-sid="${sid}">
        <span class="search-field-icon search-pin-to"></span>
        <div><span class="search-field-label">도착</span><span class="search-field-value">${escapeHtml(toVal)}</span></div>
        ${spopOpen === 'to' ? renderSearchPopover(sid, 'to', cfg) : ''}
      </div>` : '';
      const placeFields = showTo ? [fromFieldHtml, toFieldHtml] : [fromFieldHtml];
      bodyFields = cfg.searchOrder === 'dateFirst'
        ? [dateFieldHtml, ...placeFields, personFieldHtml, searchBtnHtml]
        : [...placeFields, dateFieldHtml, personFieldHtml, searchBtnHtml];
    }

    return `<div class="ps-search-wrapper">
      ${tabsHtml}
      <div class="ps-search ${showReturn ? 'has-return' : ''} ${cfg.searchOrder === 'dateFirst' ? 'date-first' : ''}">
        ${bodyFields.join('')}
      </div>
    </div>`;
  }
};
