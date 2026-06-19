/* types/guide.js */

TYPES.guide = {
  name: '가이드', category: 'content', icon: ICN.info,
  fields: [
    { key: 'title', label: '제목', type: 'text', enableable: true },
    { key: 'titleColor', label: '제목 컬러', type: 'color', default: '#1A1A1A',
      showWhen: (cfg) => cfg.titleEnabled !== false && !!cfg.title
    },
    { key: 'sub', label: '부제', type: 'text', enableable: true },
    { key: 'subColor', label: '부제 컬러', type: 'color', default: '#6B7280',
      showWhen: (cfg) => cfg.subEnabled !== false && !!cfg.sub
    },
    { key: 'cardCount', label: '카드 개수', type: 'segmented', affectsForm: true, options: [
      { value: 1, label: '1개' }, { value: 2, label: '2개' }, { value: 3, label: '3개' }
    ]},
    // Card 1
    { key: 'card1Icon', label: '1번 카드 아이콘', type: 'iconpicker', options: GUIDE_ICON_OPTIONS },
    { key: 'card1Title', label: '1번 카드 제목', type: 'text' },
    { key: 'card1Body', label: '1번 카드 내용', type: 'textarea' },
    // Card 2
    { key: 'card2Icon', label: '2번 카드 아이콘', type: 'iconpicker', options: GUIDE_ICON_OPTIONS,
      showWhen: (cfg) => (cfg.cardCount || 3) >= 2 },
    { key: 'card2Title', label: '2번 카드 제목', type: 'text',
      showWhen: (cfg) => (cfg.cardCount || 3) >= 2 },
    { key: 'card2Body', label: '2번 카드 내용', type: 'textarea',
      showWhen: (cfg) => (cfg.cardCount || 3) >= 2 },
    // Card 3
    { key: 'card3Icon', label: '3번 카드 아이콘', type: 'iconpicker', options: GUIDE_ICON_OPTIONS,
      showWhen: (cfg) => (cfg.cardCount || 3) >= 3 },
    { key: 'card3Title', label: '3번 카드 제목', type: 'text',
      showWhen: (cfg) => (cfg.cardCount || 3) >= 3 },
    { key: 'card3Body', label: '3번 카드 내용', type: 'textarea',
      showWhen: (cfg) => (cfg.cardCount || 3) >= 3 },
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#F8FAFC',
      help: '비워두면 색상 적용을 건너뜁니다.'
    },
    { key: 'bgImage', label: '배경 이미지', type: 'imagepack', maxCount: 1 }
  ],
  render: (cfg) => {
    const en = (k) => cfg[k + 'Enabled'] !== false;
    const showTitle = en('title') && cfg.title;
    const showSub = en('sub') && cfg.sub;
    const count = Math.min(3, Math.max(1, parseInt(cfg.cardCount, 10) || 3));

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

    const cards = [];
    for (let i = 1; i <= count; i++) {
      const iconKey = cfg[`card${i}Icon`] || 'info';
      const iconSvg = ICN[iconKey] || ICN.info;
      const title = cfg[`card${i}Title`] || '';
      const body = cfg[`card${i}Body`] || '';
      cards.push(`<div class="ps-guide-card">
        <div class="ps-guide-card-icon">${iconSvg}</div>
        <h3 class="ps-guide-card-title">${escapeHtml(title)}</h3>
        <p class="ps-guide-card-body">${escapeHtml(body).replace(/\n/g, '<br/>')}</p>
      </div>`);
    }

    const headHtml = (showTitle || showSub) ? `
      <div class="ps-block-head">
        <div>
          ${showTitle ? `<h2 class="ps-block-title">${escapeHtml(cfg.title)}</h2>` : ''}
          ${showSub ? `<p class="ps-block-sub">${escapeHtml(cfg.sub)}</p>` : ''}
        </div>
      </div>
    ` : '';

    return `<section class="ps-block ps-guide"${sectionStyle}>
      ${headHtml}
      <div class="ps-guide-cards" data-count="${count}">${cards.join('')}</div>
    </section>`;
  }
};
