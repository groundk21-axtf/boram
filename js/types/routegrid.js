/* types/routegrid.js */

TYPES.routegrid = {
  name: '노선', category: 'content', icon: ICN.grid,
  fields: [
    { key: 'title', label: '제목', type: 'text', enableable: true },
    { key: 'titleColor', label: '제목 컬러', type: 'color', default: '#1A1A1A',
      showWhen: (cfg) => cfg.titleEnabled !== false && !!cfg.title
    },
    { key: 'sub', label: '부제', type: 'text', enableable: true },
    { key: 'subColor', label: '부제 컬러', type: 'color', default: '#6B7280',
      showWhen: (cfg) => cfg.subEnabled !== false && !!cfg.sub
    },
    { key: 'layoutType', label: '레이아웃', type: 'segmented', affectsForm: true, options: [
      { value: 'list',   label: '리스트' },
      { value: 'map',    label: '노선도' },
      { value: 'slider', label: '슬라이더' }
    ], help: '리스트: 각 노선의 정류장을 카드로 표시 · 노선도: 정류장을 가로 노선도로 표시 · 슬라이더: 노선 카드를 가로 슬라이드' },
    { key: 'routes', label: '노선 선택', type: 'multiselect',
      affectsForm: true,
      options: ROUTE_CATALOG.map(r => ({ value: r.id, label: r.name, badge: r.type || 'TO' })),
      help: '체크된 노선이 화면에 표시됩니다. 아래 "노선 순서"에서 순서를 변경할 수 있습니다.'
    },
    { key: 'routeOrder', label: '노선 순서', type: 'sortable',
      showWhen: (cfg) => Array.isArray(cfg.routes) && cfg.routes.length >= 2,
      help: '드래그하여 노선이 화면에 표시될 순서를 변경합니다.'
    },
    { key: 'collapseMode', label: '접기/펴기', type: 'segmented', options: [
      { value: 'default',      label: '기본' },
      { value: 'collapse-all', label: '전체접기' },
      { value: 'expand-all',   label: '전체열기' }
    ],
      showWhen: (cfg) => (cfg.layoutType || 'list') === 'list',
      help: '기본: 첫 노선만 펼침 · 전체접기: 모두 접힘 · 전체열기: 모두 펼침' },
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#FFFFFF',
    },
    { key: 'bgImage', label: '배경 이미지', type: 'imagepack', maxCount: 1,
      help: '배경이미지는 배경 색상과 함께 사용 가능.'
    },
    { key: 'assets', label: '이미지 에셋', type: 'assetpack', maxCount: 8,
      help: '이미지 에셋을 지정한 위치에 배치합니다.'
    }
  ],
  render: (cfg, ctx) => {
    const en = (k) => cfg[k + 'Enabled'] !== false;
    const selected = Array.isArray(cfg.routes) ? cfg.routes : [];
    // Apply routeOrder if present, then append any newly-checked routes not yet ordered
    const order = Array.isArray(cfg.routeOrder) ? cfg.routeOrder.filter(id => selected.includes(id)) : [];
    const remaining = selected.filter(id => !order.includes(id));
    const finalOrder = [...order, ...remaining];

    const routes = finalOrder
      .map(id => ROUTE_CATALOG.find(r => r.id === id))
      .filter(Boolean);

    // Collapse state is derived from the configured mode each render:
    //  default      → first route expanded, rest collapsed
    //  collapse-all  → all collapsed
    //  expand-all    → all expanded
    const collapseMode = cfg.collapseMode || 'default';
    STATE.routeCollapse = STATE.routeCollapse || {};
    const collapseKey = ctx.sectionId;
    STATE.routeCollapse[collapseKey] = STATE.routeCollapse[collapseKey] || {};
    const collapseMap = STATE.routeCollapse[collapseKey];
    routes.forEach((r, i) => {
      if (collapseMode === 'collapse-all') collapseMap[r.id] = true;
      else if (collapseMode === 'expand-all') collapseMap[r.id] = false;
      else collapseMap[r.id] = (routes.length >= 2 && i >= 1); // 기본
    });

    const showTitle = en('title') && cfg.title;
    const showSub = en('sub') && cfg.sub;

    const headHtml = (showTitle || showSub) ? `
      <div class="ps-block-head">
        <div>
          ${showTitle ? `<h2 class="ps-block-title">${escapeHtml(cfg.title)}</h2>` : ''}
          ${showSub ? `<p class="ps-block-sub">${escapeHtml(cfg.sub)}</p>` : ''}
        </div>
      </div>
    ` : '';

    const emptyHtml = routes.length === 0 ? `
      <div class="route-list-empty">
        <div class="route-list-empty-icon">${ICN.grid}</div>
        <div>노선이 선택되지 않았습니다.<br/>우측 패널에서 노출할 노선을 선택해주세요.</div>
      </div>
    ` : '';

    // 섹션 배경 / 컬러 토큰 / 에셋 오버레이 — list/map 두 레이아웃 모두에서 사용
    const sectionStyles = [];
    if (typeof cfg.bgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.bgColor)) {
      sectionStyles.push(`background-color:${cfg.bgColor}`);
    }
    if (Array.isArray(cfg.bgImage) && cfg.bgImage[0]) {
      const bg = cfg.bgImage[0].bg || '';
      sectionStyles.push(`background-image:${bg}`, 'background-size:cover', 'background-position:center');
    }
    if (typeof cfg.titleColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.titleColor)) {
      sectionStyles.push(`--block-title:${cfg.titleColor}`);
    }
    if (typeof cfg.subColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.subColor)) {
      sectionStyles.push(`--block-sub:${cfg.subColor}`);
    }
    const sectionStyle = sectionStyles.length ? ` style="${sectionStyles.join('; ')};"` : '';

    const assets = Array.isArray(cfg.assets) ? cfg.assets : [];
    const validPositions = new Set(['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right']);
    const assetsHtml = assets.map(a => {
      const pos = validPositions.has(a.position) ? a.position : 'top-right';
      const bg = a.bg || '';
      const widthStyle = (typeof a.width === 'number' && a.width > 0) ? ` style="width:${a.width}px; height:auto;"` : '';
      const urlMatch = bg.match(/^url\(['"]?([^'")]+)['"]?\)/i);
      if (urlMatch) {
        return `<img class="asset-overlay ${pos}" src="${escapeHtml(urlMatch[1])}"${widthStyle} alt="${escapeHtml(a.name || '')}" />`;
      }
      return `<div class="asset-overlay asset-overlay-placeholder ${pos}" style="background-image:${bg};" title="${escapeHtml(a.name || '에셋')}"></div>`;
    }).join('');

    // 노선도 (map) 레이아웃 — 정류장을 가로 라인 + 회전된 라벨로 표시
    const layout = cfg.layoutType || 'list';
    if (layout === 'map' && routes.length > 0) {
      const sid = ctx.sectionId;
      STATE.routeMapActive = STATE.routeMapActive || {};
      const activeId = (STATE.routeMapActive[sid] && routes.find(r => r.id === STATE.routeMapActive[sid]))
        ? STATE.routeMapActive[sid]
        : routes[0].id;
      const activeRoute = routes.find(r => r.id === activeId) || routes[0];

      const tabsHtml = routes.length > 1 ? `<div class="route-map-tabs">
        ${routes.map(r => `<button type="button" class="route-map-tab${r.id === activeRoute.id ? ' active' : ''}" data-route-map-tab="${r.id}" data-section-id="${sid}">${escapeHtml(r.name)}</button>`).join('')}
      </div>` : '';

      const mapAddr = (activeRoute.sequence[0]?.name || '') + ' 노선';
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddr)}`;

      // 모바일 — 세로 1열 정류장 리스트로 렌더
      if (STATE.currentDevice === 'mobile') {
        const stopsHtml = activeRoute.sequence.map((stop, i) => {
          const isFirst = i === 0;
          const labelText = stop.sub || stop.name;
          return `<div class="route-map-v-stop${isFirst ? ' first' : ''}">
            <div class="route-map-v-dot"></div>
            <div class="route-map-v-label">${escapeHtml(labelText)}</div>
          </div>`;
        }).join('');
        return `<section class="ps-block"${sectionStyle}>
          ${headHtml}
          ${tabsHtml}
          <div class="route-map-wrap">
            <a class="route-map-view-btn full" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">${ICN.pin}<span>지도 보기</span></a>
            <div class="route-map-vertical">${stopsHtml}</div>
          </div>
          ${assetsHtml}
        </section>`;
      }

      const stops = activeRoute.sequence;
      // 컨테이너 폭에 맞춰 자동 줄바꿈 — 모바일/태블릿/데스크탑별 다른 최대 개수
      const MAX_PER_ROW = STATE.currentDevice === 'mobile' ? 4
                       : STATE.currentDevice === 'tablet' ? 7
                       : 10;
      const total = stops.length;
      const rowsCount = Math.max(1, Math.ceil(total / MAX_PER_ROW));
      const perRow = Math.ceil(total / rowsCount);
      const rows = [];
      for (let i = 0; i < rowsCount; i++) {
        const start = i * perRow;
        rows.push({ stops: stops.slice(start, start + perRow), startIdx: start, isReverse: i % 2 === 1 });
      }

      const rowsHtml = rows.map((row, ri) => {
        const visualStops = row.isReverse ? [...row.stops].reverse() : row.stops;
        const stopsHtml = visualStops.map((stop, vi) => {
          const origIdx = row.isReverse
            ? row.startIdx + (row.stops.length - 1 - vi)
            : row.startIdx + vi;
          const isFirst = origIdx === 0;
          const labelText = stop.sub || stop.name;
          return `<div class="route-map-stop${isFirst ? ' first' : ''}">
            <div class="route-map-label">${escapeHtml(labelText)}</div>
            <div class="route-map-dot"></div>
          </div>`;
        }).join('');
        const rowHtml = `<div class="route-map-row${row.isReverse ? ' reverse' : ''}">${stopsHtml}</div>`;
        if (ri < rows.length - 1) {
          const turnSide = row.isReverse ? 'left' : 'right';
          return rowHtml + `<div class="route-map-uturn uturn-${turnSide}"></div>`;
        }
        return rowHtml;
      }).join('');

      const isMultiRow = rows.length > 1;
      return `<section class="ps-block"${sectionStyle}>
        ${headHtml}
        ${tabsHtml}
        <div class="route-map-wrap">
          <div class="route-map-toolbar">
            <a class="route-map-view-btn" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">${ICN.pin}<span>지도 보기</span></a>
          </div>
          <div class="route-map-scroll">
            <div class="route-map-grid${isMultiRow ? ' multi-row' : ''}">${rowsHtml}</div>
          </div>
        </div>
        ${assetsHtml}
      </section>`;
    }

    // 슬라이더 (slider) 레이아웃 — 노선 카드 가로 슬라이드
    if (layout === 'slider' && routes.length > 0) {
      // 정수 시간 차이 계산 — "HH:MM" 두 개를 받아 분 단위 차이 반환
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

      const cardsHtml = routes.map(route => {
        const seq = route.sequence || [];
        const allTimes = seq.flatMap(s => (s.times || [])).filter(Boolean).sort();
        const boardRange = allTimes.length >= 2
          ? `${allTimes[0]}-${allTimes[allTimes.length - 1]}`
          : (allTimes[0] || '-');

        // 배차간격 — 첫 정류장 times 의 첫 두 개 간격
        const firstTimes = (seq[0]?.times) || [];
        let intervalText = '-';
        if (firstTimes.length >= 2) {
          const d = diffMin(firstTimes[0], firstTimes[1]);
          if (d > 0) intervalText = `${d}분`;
        }

        // 소요시간 — 첫 정류장 첫 출발 ~ 마지막 정류장 첫 출발 (없으면 첫 출발의 마지막 시간)
        const lastTimes = (seq[seq.length - 1]?.times) || [];
        let durationText = '-';
        if (firstTimes.length && lastTimes.length) {
          durationText = fmtDuration(diffMin(firstTimes[0], lastTimes[0]));
        } else if (firstTimes.length >= 2) {
          durationText = fmtDuration(diffMin(firstTimes[0], firstTimes[firstTimes.length - 1]));
        }

        const imgSrc = route.image || route.imageUrl
                    || `https://picsum.photos/seed/${encodeURIComponent(route.id)}/480/360`;

        return `
          <div class="route-slider-card" data-route-card="${route.id}" data-section-id="${ctx.sectionId}">
            <div class="route-slider-thumb">
              <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(route.name)}" loading="lazy">
            </div>
            <div class="route-slider-body">
              <h3 class="route-slider-name">${escapeHtml(route.name)}</h3>
              <div class="route-slider-info">
                <div class="route-slider-row">
                  <span class="route-slider-label">운행시간</span>
                  <span class="route-slider-value">${escapeHtml(boardRange)}</span>
                </div>

                <div class="route-slider-row">
                  <span class="route-slider-label">소요시간</span>
                  <span class="route-slider-value">${escapeHtml(durationText)}</span>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');

      return `<section class="ps-block"${sectionStyle}>
        ${headHtml}
        <div class="route-slider-scroll">
          <div class="route-slider-track">${cardsHtml}</div>
        </div>
        ${assetsHtml}
      </section>`;
    }

    const routesHtml = routes.map(route => {
      const collapsed = collapseMap[route.id];
      const stops = route.sequence.map((stop, i) => {
        const isFirst = i === 0;
        const isLast = i === route.sequence.length - 1;
        let dotClass = 'transit';
        if (isFirst) dotClass = 'origin';
        else if (stop.endpoint || isLast) dotClass = 'endpoint';
        const timesHtml = stop.times && stop.times.length
          ? `<div class="route-stop-times">${stop.times.map(t => `<span class="route-stop-time">${escapeHtml(t)}</span>`).join('')}</div>`
          : '';
        return `<div class="route-stop ${isLast ? 'last' : ''}">
          <div class="route-stop-dot ${dotClass}"></div>
          <div class="route-stop-info">
            <div class="route-stop-name">${escapeHtml(stop.name)}</div>
            ${stop.sub ? `<div class="route-stop-sub">${escapeHtml(stop.sub)}</div>` : ''}
            ${timesHtml}
          </div>
          <button class="route-stop-loc" data-stop-info="${escapeHtml(stop.name)}" data-stop-sub="${escapeHtml(stop.sub || '')}">${ICN.pin}<span>정류장 정보</span></button>
        </div>`;
      }).join('');

      // Compact preview shown when collapsed: just origin → destination
      const first = route.sequence[0];
      const last = route.sequence[route.sequence.length - 1];
      const summary = first && last ? `${first.name} → ${last.name} · ${route.sequence.length}개 정류장` : '';

      return `<div class="route-item ${collapsed ? 'collapsed' : ''}" data-route-card="${route.id}" data-section-id="${ctx.sectionId}">
        <div class="route-item-head" data-route-toggle="${route.id}" data-section-id="${ctx.sectionId}">
          <h3 class="route-item-name">${escapeHtml(route.name)}</h3>
          <span class="route-item-summary">${escapeHtml(summary)}</span>
          <span class="route-item-toggle-icon">${ICN.chev}</span>
        </div>
        <div class="route-stops">${stops}</div>
      </div>`;
    }).join('');

    return `<section class="ps-block"${sectionStyle}>
      ${headHtml}
      ${emptyHtml || `<div class="route-list">${routesHtml}</div>`}
      ${assetsHtml}
    </section>`;
  }
};
