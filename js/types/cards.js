/* types/cards.js */

TYPES.cards = {
  name: '카드', category: 'content', icon: ICN.grid,
  fields: [
    { key: 'title', label: '제목', type: 'text', enableable: true },
    { key: 'titleColor', label: '제목 컬러', type: 'color', default: '#1A1A1A',
      showWhen: (cfg) => cfg.titleEnabled !== false && !!cfg.title
    },
    { key: 'sub', label: '부제', type: 'text', enableable: true },
    { key: 'subColor', label: '부제 컬러', type: 'color', default: '#6B7280',
      showWhen: (cfg) => cfg.subEnabled !== false && !!cfg.sub
    },
    { key: 'cards', label: '카드 목록', type: 'cardlist',
      help: '카드 클릭으로 콘텐츠 편집, 드래그로 순서 변경, "카드 추가"로 신규 등록.'
    },
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#FFFFFF',
      help: '비워두면 색상 적용을 건너뜁니다.'
    },
    { key: 'bgImage', label: '배경 이미지', type: 'imagepack', maxCount: 1,
      help: '배경 색상과 함께 사용 가능.'
    },
    { key: 'assets', label: '이미지 에셋', type: 'assetpack', maxCount: 8,
      help: '데코레이션 이미지를 섹션의 8개 위치에 배치합니다.'
    }
  ],
  render: (cfg, ctx) => {
    const en = (k) => cfg[k + 'Enabled'] !== false;
    const cards = Array.isArray(cfg.cards) ? cfg.cards : [];

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

    const cardHtml = (c) => `<article class="ps-cards-card">
      <div class="ps-cards-thumb" style="${c.image && c.image.bg ? `background-image: ${c.image.bg};` : ''}"></div>
      <div class="ps-cards-info">
        ${c.title ? `<h3 class="ps-cards-title">${escapeHtml(c.title)}</h3>` : ''}
        ${c.body ? `<p class="ps-cards-body">${escapeHtml(c.body)}</p>` : ''}
      </div>
    </article>`;

    const listHtml = cards.length
      ? `<div class="ps-cards ps-cards-grid">${cards.map(cardHtml).join('')}</div>`
      : `<div class="ps-cards-empty"><div class="ps-cards-empty-icon">${ICN.image}</div><div>등록된 카드가 없습니다. 우측 패널의 [카드 추가] 버튼으로 등록하세요.</div></div>`;

    // 섹션 배경 / 컬러 토큰 / 에셋
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

    return `<section class="ps-block"${sectionStyle}>
      ${headHtml}
      ${listHtml}
      ${assetsHtml}
    </section>`;
  }
};
