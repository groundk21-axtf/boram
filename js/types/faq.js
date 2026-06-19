/* types/faq.js */

TYPES.faq = {
  name: '자주 묻는 질문', category: 'content', icon: ICN.help,
  fields: [
    { key: 'title', label: '제목', type: 'text', enableable: true },
    { key: 'titleColor', label: '제목 컬러', type: 'color', default: '#1A1A1A',
      showWhen: (cfg) => cfg.titleEnabled !== false && !!cfg.title
    },
    { key: 'sub', label: '부제', type: 'text', enableable: true },
    { key: 'subColor', label: '부제 컬러', type: 'color', default: '#6B7280',
      showWhen: (cfg) => cfg.subEnabled !== false && !!cfg.sub
    },
    { key: 'count', label: '노출 개수', type: 'segmented', options: [
      { value: 3,  label: '3개' },
      { value: 5,  label: '5개' },
      { value: 8,  label: '8개' },
      { value: 0,  label: '전체' }
    ], help: '"자주 묻는 질문" 페이지에 등록된 질문 중 상단 N개를 노출합니다.' },
    { key: 'showMore', label: '더보기 버튼', type: 'toggle',
      help: 'ON 시 목록 하단에 더보기 버튼이 표시되며, 클릭하면 "자주 묻는 질문" 페이지로 이동합니다.'
    },
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#FFFFFF',
      help: '비워두면 색상 적용을 건너뜁니다.'
    },
    { key: 'bgImage', label: '배경 이미지', type: 'imagepack', maxCount: 1,
      help: '배경 색상과 함께 사용 가능. 이미지가 상위 레이어로 표시됩니다.'
    }
  ],
  render: (cfg) => {
    const en = (k) => cfg[k + 'Enabled'] !== false;
    const showTitle = en('title') && cfg.title;
    const showSub = en('sub') && cfg.sub;

    // Questions are sourced from the '자주 묻는 질문' page (STATE.faqPage), not edited here.
    const allQ = (STATE.faqPage || []).map(it => it.question).filter(Boolean);
    const count = parseInt(cfg.count, 10);
    const sliced = (count && count > 0) ? allQ.slice(0, count) : allQ;
    const items = sliced.map(q =>
      `<div class="faq-item"><div class="faq-q"><span><span class="faq-q-mark">Q.</span>${escapeHtml(q)}</span>${ICN.chev}</div></div>`
    ).join('');

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

    const moreBtn = cfg.showMore !== false
      ? `<div class="faq-more-wrap"><button type="button" class="faq-more-btn" data-faq-more="1">더보기 ${ICN.chev}</button></div>`
      : '';

    return `<section class="ps-block"${sectionStyle}>
      ${(showTitle || showSub) ? `<div class="ps-block-head center"><div>${showTitle ? `<h2 class="ps-block-title">${escapeHtml(cfg.title)}</h2>` : ''}${showSub ? `<p class="ps-block-sub">${escapeHtml(cfg.sub)}</p>` : ''}</div></div>` : ''}
      <div class="faq-list">${items}</div>
      ${moreBtn}
    </section>`;
  }
};
