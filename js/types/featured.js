/* types/featured.js */

TYPES.featured = {
  name: '상품', category: 'content', icon: ICN.star,
  fields: [
    { key: 'title', label: '제목', type: 'text', enableable: true },
    { key: 'titleColor', label: '제목 컬러', type: 'color', default: '#1A1A1A',
      showWhen: (cfg) => cfg.titleEnabled !== false && !!cfg.title
    },
    { key: 'sub', label: '부제', type: 'text', enableable: true },
    { key: 'subColor', label: '부제 컬러', type: 'color', default: '#6B7280',
      showWhen: (cfg) => cfg.subEnabled !== false && !!cfg.sub
    },

    { key: 'layoutType', label: '레이아웃', type: 'segmented', options: [
      { value: 'grid',   label: '그리드' },
      { value: 'slider', label: '슬라이더' }
    ]},

    { key: 'selectionMode', label: '상품 선정 방식', type: 'segmented', affectsForm: true, options: [
      { value: 'manual', label: '수동 선택' },
      { value: 'auto',   label: '자동 노출' }
    ], help: '수동: 관리자가 직접 상품을 선택 · 자동: 조건에 맞는 여행 상품을 자동으로 표시 (신규 등록 시 자동 반영, 판매 종료 시 자동 제외)' },
    
    
    // ── Manual mode fields ──
    { key: 'products', label: '상품 선택', type: 'multiselect',
      affectsForm: true,
      options: PRODUCT_CATALOG.filter(p => p.type === '여행').map(p => ({ value: p.id, label: p.name, badge: p.type })),
      showWhen: (cfg) => (cfg.selectionMode || 'manual') === 'manual',
      help: '체크된 상품이 화면에 표시됩니다. 아래 "상품 순서"에서 순서를 변경할 수 있습니다.'
    },
    { key: 'productOrder', label: '상품 순서', type: 'sortable',
      sourceKey: 'products', catalog: PRODUCT_CATALOG,
      showWhen: (cfg) => (cfg.selectionMode || 'manual') === 'manual' && Array.isArray(cfg.products) && cfg.products.length >= 2,
      help: '드래그하여 상품 노출 순서를 변경합니다.'
    },
    // ── Auto mode fields ──
    { key: 'displayCriteria', label: '노출 기준', type: 'segmented', affectsForm: true, options: [
      { value: 'day',    label: '요일별' },
      { value: 'region', label: '지역별' }
    ],
      showWhen: (cfg) => cfg.selectionMode === 'auto',
      help: '선택한 기준으로 상품 목록 상단에 필터 탭이 표시됩니다. 자동 노출은 최대 20개까지, 판매 종료된 상품은 자동으로 제외됩니다.'
    },
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#FFFFFF',
      help: '비워두면 색상 적용을 건너뜁니다. 이미지와 함께 사용할 경우 이미지 뒤 레이어로 깔립니다.'
    },
    { key: 'bgImage', label: '배경 이미지', type: 'imagepack', maxCount: 1,
      help: '배경 색상과 함께 사용 가능. 이미지가 상위 레이어로 표시됩니다.'
    },
    { key: 'assets', label: '이미지 에셋', type: 'assetpack', maxCount: 8,
      help: '데코레이션 이미지를 섹션의 8개 위치에 배치합니다. 에셋이 가장 상위 레이어입니다.'
    }
  ],
  render: (cfg, ctx) => {
    const en = (k) => cfg[k + 'Enabled'] !== false;
    const mode = cfg.selectionMode || 'manual';
    // Auto mode always shows a filter bar; 'none' is no longer offered as a selection
    // but legacy values fall back to 'region'.
    const criteria = mode === 'auto'
      ? (cfg.displayCriteria === 'day' ? 'day' : 'region')
      : 'none';

    // Active filter pill state per section (track which region/day tab is selected).
    STATE.productCriteria = STATE.productCriteria || {};
    STATE.productCriteria[ctx.sectionId] = STATE.productCriteria[ctx.sectionId] || {};
    const criteriaState = STATE.productCriteria[ctx.sectionId];
    let activeFilter = criteriaState[criteria];
    if (criteria === 'region' && !activeFilter) activeFilter = PRODUCT_REGIONS[0];
    if (criteria === 'day' && !activeFilter) activeFilter = PRODUCT_DAYS[0].value;

    // ── Compute products: manual selection vs auto-filter ──
    // Auto mode is hardcoded to travel products only (no category filter UI).
    let products = [];
    if (mode === 'auto') {
      // Sold-out products are always excluded from auto display.
      const AUTO_LIMIT = 20;
      products = PRODUCT_CATALOG
        .filter(p => p.type === '여행')
        .filter(p => (p.status || 'on-sale') === 'on-sale')
        .filter(p => {
          if (criteria === 'region') return Array.isArray(p.regions) && p.regions.includes(activeFilter);
          if (criteria === 'day')    return Array.isArray(p.daysOfWeek) && p.daysOfWeek.includes(activeFilter);
          return true;
        })
        .sort((a, b) => String(b.registeredAt || '').localeCompare(String(a.registeredAt || '')))
        .slice(0, AUTO_LIMIT);
    } else {
      const selected = Array.isArray(cfg.products) ? cfg.products : [];
      const order = Array.isArray(cfg.productOrder) ? cfg.productOrder.filter(id => selected.includes(id)) : [];
      const remaining = selected.filter(id => !order.includes(id));
      const finalOrder = [...order, ...remaining];
      products = finalOrder.map(id => PRODUCT_CATALOG.find(p => p.id === id)).filter(Boolean);
    }

    const showTitle = en('title') && cfg.title;
    const showSub = en('sub') && cfg.sub;
    const layout = cfg.layoutType || 'grid';

    // Filter pill bar (region tabs or day-of-week tabs) at the top of the product list.
    let criteriaBarHtml = '';
    if (criteria === 'region') {
      criteriaBarHtml = `<div class="ps-product-criteria" data-product-criteria="region" data-sid="${ctx.sectionId}">${
        PRODUCT_REGIONS.map(r =>
          `<button type="button" class="ps-product-criteria-tab${r === activeFilter ? ' active' : ''}" data-criteria-value="${escapeHtml(r)}" data-sid="${ctx.sectionId}" data-criteria-key="region">${escapeHtml(r)}</button>`
        ).join('')
      }</div>`;
    } else if (criteria === 'day') {
      criteriaBarHtml = `<div class="ps-product-criteria ps-product-criteria-day" data-product-criteria="day" data-sid="${ctx.sectionId}">${
        PRODUCT_DAYS.map(d =>
          `<button type="button" class="ps-product-criteria-tab ps-day-${d.value}${d.value === activeFilter ? ' active' : ''}${d.accent ? ' accent-' + d.accent : ''}" data-criteria-value="${d.value}" data-sid="${ctx.sectionId}" data-criteria-key="day">${escapeHtml(d.label)}</button>`
        ).join('')
      }</div>`;
    }

    const headHtml = (showTitle || showSub) ? `
      <div class="ps-block-head">
        <div>
          ${showTitle ? `<h2 class="ps-block-title">${escapeHtml(cfg.title)}</h2>` : ''}
          ${showSub ? `<p class="ps-block-sub">${escapeHtml(cfg.sub)}</p>` : ''}
        </div>
      </div>
    ` : '';

    const emptyMsg = mode === 'auto'
      ? '조건에 맞는 상품이 없습니다.<br/>우측 패널에서 필터 조건을 조정해주세요.'
      : '상품이 선택되지 않았습니다.<br/>우측 패널에서 노출할 상품을 선택해주세요.';
    const emptyHtml = products.length === 0 ? `
      <div class="ps-product-empty">
        <div class="ps-product-empty-icon">${ICN.star}</div>
        <div>${emptyMsg}</div>
      </div>
    ` : '';

    const cardHtml = (p, mod = '') => {
      const soldOut = (p.status || 'on-sale') === 'sold-out';
      const soldOutCls = soldOut ? ' ps-product-card--sold-out' : '';
      return `<article class="ps-product-card ${mod}${soldOutCls}">
        <div class="ps-product-thumb" style="background-image: ${p.bg};">
          ${p.tag ? `<span class="ps-product-tag">${escapeHtml(p.tag)}</span>` : ''}
          ${soldOut ? `<div class="ps-product-sold-out-overlay"><span class="ps-product-sold-out-label">품절</span></div>` : ''}
        </div>
        <div class="ps-product-info">
          <h3 class="ps-product-title">${escapeHtml(p.name)}</h3>
          ${p.sub ? `<p class="ps-product-sub">${escapeHtml(p.sub)}</p>` : ''}
          ${(p.price || p.priceOriginal) ? `<div class="ps-product-price-row">
            ${p.priceOriginal ? `<span class="ps-product-price-orig">${escapeHtml(p.priceOriginal)}원</span>` : ''}
            ${p.price ? `<span class="ps-product-price">${escapeHtml(p.price)}원</span>` : ''}
          </div>` : ''}
        </div>
      </article>`;
    };

    // Pagination dots: 3 cards per page on desktop. Active is page 0; scroll listener updates.
    const visiblePerPage = 3;
    const pageCount = Math.max(1, Math.ceil(products.length / visiblePerPage));
    const paginationHtml = pageCount > 1
      ? `<div class="ps-product-pagination" data-product-pagination="${ctx.sectionId}">${
          Array.from({ length: pageCount }, (_, i) =>
            `<button type="button" class="ps-product-page-dot${i === 0 ? ' active' : ''}" data-page-idx="${i}" data-product-section="${ctx.sectionId}" aria-label="${i + 1}페이지"></button>`
          ).join('')
        }</div>`
      : '';

    let listHtml = '';
    if (products.length) {
      if (layout === 'slider') {
        listHtml = `<div class="ps-product ps-product-slider">
          <div class="ps-product-track" data-product-track="${ctx.sectionId}">${products.map(p => cardHtml(p)).join('')}</div>
          ${paginationHtml}
        </div>`;
      } else {
        // 'grid' is the default
        listHtml = `<div class="ps-product ps-product-grid">${products.map(p => cardHtml(p)).join('')}</div>`;
      }
    }

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

    // Image asset overlays — top layer.
    const validPositions = new Set(['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right']);
    const overlaysHtml = (Array.isArray(cfg.assets) ? cfg.assets : []).map(a => {
      const pos = validPositions.has(a.position) ? a.position : 'top-right';
      const style = (typeof a.width === 'number' && a.width > 0) ? ` style="width:${a.width}px;"` : '';
      if (a.bg && a.bg.startsWith('url(')) {
        const m = a.bg.match(/url\((['"]?)(.*?)\1\)/);
        if (m) return `<img class="asset-overlay ${pos}" src="${m[2]}" alt=""${style}>`;
      }
      return `<div class="asset-overlay asset-overlay-placeholder ${pos}" style="background:${a.bg};${(typeof a.width === 'number' && a.width > 0) ? `width:${a.width}px;` : ''}"></div>`;
    }).join('');

    return `<section class="ps-block ps-featured"${sectionStyle}>
      ${overlaysHtml}
      ${headHtml}
      ${criteriaBarHtml}
      ${emptyHtml}
      ${listHtml}
    </section>`;
  }
};
