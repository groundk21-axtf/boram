/* types/hero.js */

TYPES.hero = {
  name: '히어로 배너', category: 'content', icon: ICN.image,
  fields: [
    { key: 'images', label: '배경 이미지', type: 'imagepack', maxCount: 4,
      help: '최대 4개. 2개 이상 등록 시 좌/우 스와이프 캐러셀이 자동으로 활성화됩니다.' },
    { key: 'overlayEnabled', label: '배경 음영', type: 'toggle',
      help: 'ON 시 배경 이미지 위에 어두운 그라데이션 음영이 적용됩니다. (이미지가 있을 때만 동작)'
    },
    { key: 'eyebrow', label: '상단 라벨', type: 'text', enableable: true },
    { key: 'eyebrowColor', label: '상단 라벨 컬러', type: 'color', default: '#FFFFFF',
      showWhen: (cfg) => cfg.eyebrowEnabled !== false && !!cfg.eyebrow
    },
    { key: 'title', label: '메인 타이틀', type: 'textarea', overridable: true, enableable: true,
      help: '줄바꿈 그대로 표시됩니다.' },
    { key: 'titleColor', label: '메인 타이틀 컬러', type: 'color', default: '#FFFFFF',
      showWhen: (cfg) => cfg.titleEnabled !== false && !!cfg.title
    },
    { key: 'sub', label: '서브 카피', type: 'textarea', enableable: true },
    { key: 'subColor', label: '서브 카피 컬러', type: 'color', default: '#FFFFFF',
      showWhen: (cfg) => cfg.subEnabled !== false && !!cfg.sub
    },
    { key: 'ctaText', label: 'CTA 버튼 텍스트', type: 'text', enableable: true },
    { key: 'ctaUrl', label: 'CTA 링크', type: 'urltarget',
      targetKey: 'ctaTarget',
      placeholder: 'https:// 등 전체 URL 또는 내부 경로(/path)를 입력하세요.',
      showWhen: (cfg) => cfg.ctaTextEnabled !== false
    },
    { key: 'ctaBgColor', label: 'CTA 배경 컬러', type: 'color', default: '#FFFFFF',
      showWhen: (cfg) => cfg.ctaTextEnabled !== false
    },
    { key: 'ctaTextColor', label: 'CTA 텍스트 컬러', type: 'color', default: '#0E5F4A',
      showWhen: (cfg) => cfg.ctaTextEnabled !== false,
      help: 'hover 시 배경과 텍스트가 자동 반전됩니다.'
    },
    { key: 'alignment', label: '정렬', type: 'segmented', options: [
      { value: 'left', label: 'LEFT' }, { value: 'center', label: 'CENTER' }, { value: 'right', label: 'RIGHT' }
    ]}
  ],
  render: (cfg, ctx) => {
    const align = cfg.alignment || 'left';
    const en = (k) => cfg[k + 'Enabled'] !== false; // default enabled
    const title = (ctx.deviceOverride && 'title' in ctx.deviceOverride) ? ctx.deviceOverride.title : (cfg.title || '');

    // Auto-height: based on count of enabled & non-empty content fields
    const showEyebrow = en('eyebrow') && cfg.eyebrow;
    const showTitle = en('title') && title;
    const showSub = en('sub') && cfg.sub;
    const showCta = en('ctaText') && cfg.ctaText;
    const enabledCount = [showEyebrow, showTitle, showSub, showCta].filter(Boolean).length;
    const heightClass = `hero-h-${enabledCount}`;

    const images = Array.isArray(cfg.images) ? cfg.images : [];
    STATE.heroCarousel = STATE.heroCarousel || {};
    let idx = STATE.heroCarousel[ctx.sectionId] || 0;
    if (idx >= images.length) idx = 0;

    const sectionStyles = [];
    if (images.length > 0 && images[idx]) {
      sectionStyles.push(`background-image: ${images[idx].bg}`, 'background-size: cover', 'background-position: center');
    } else {
      sectionStyles.push('background: linear-gradient(135deg, var(--t-primary) 0%, var(--t-primary-strong) 100%)');
    }
    if (typeof cfg.eyebrowColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.eyebrowColor)) {
      sectionStyles.push(`--hero-eyebrow:${cfg.eyebrowColor}`);
    }
    if (typeof cfg.titleColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.titleColor)) {
      sectionStyles.push(`--hero-title:${cfg.titleColor}`);
    }
    if (typeof cfg.subColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.subColor)) {
      sectionStyles.push(`--hero-sub:${cfg.subColor}`);
    }
    const bgStyle = sectionStyles.join('; ');

    const carouselHtml = images.length >= 2 ? `
      <button class="ps-hero-arrow ps-hero-prev" data-hero-arrow="prev" data-sid="${ctx.sectionId}" aria-label="이전">‹</button>
      <button class="ps-hero-arrow ps-hero-next" data-hero-arrow="next" data-sid="${ctx.sectionId}" aria-label="다음">›</button>
      <div class="ps-hero-dots">
        ${images.map((_, i) => `<span class="ps-hero-dot ${i === idx ? 'active' : ''}" data-hero-dot="${i}" data-sid="${ctx.sectionId}"></span>`).join('')}
      </div>
    ` : '';

    const overlay = (images.length > 0 && cfg.overlayEnabled !== false) ? '<div class="ps-hero-overlay"></div>' : '';

    const resolvedHref = cfg.ctaUrl || '#';
    const target = cfg.ctaTarget === '_blank' ? '_blank' : '_self';
    const relAttr = target === '_blank' ? ' rel="noopener noreferrer"' : '';
    const ctaStyles = [];
    if (typeof cfg.ctaBgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.ctaBgColor)) {
      ctaStyles.push(`--cta-bg:${cfg.ctaBgColor}`);
    }
    if (typeof cfg.ctaTextColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.ctaTextColor)) {
      ctaStyles.push(`--cta-text:${cfg.ctaTextColor}`);
    }
    const ctaStyleAttr = ctaStyles.length ? ` style="${ctaStyles.join(';')};"` : '';
    const ctaAttrs = `href="${escapeHtml(resolvedHref)}" target="${target}"${relAttr}${ctaStyleAttr}`;

    return `<section class="ps-hero ${align} ${heightClass}" style="${bgStyle}">
      ${overlay}
      ${enabledCount > 0 ? `<div class="ps-hero-content">
        ${showEyebrow ? `<div class="ps-hero-eyebrow">${escapeHtml(cfg.eyebrow)}</div>` : ''}
        ${showTitle ? `<h1 class="ps-hero-title">${escapeHtml(title)}</h1>` : ''}
        ${showSub ? `<p class="ps-hero-sub">${escapeHtml(cfg.sub)}</p>` : ''}
        ${showCta ? `<a class="ps-hero-cta" ${ctaAttrs}>${escapeHtml(cfg.ctaText)} →</a>` : ''}
      </div>` : ''}
      ${carouselHtml}
    </section>`;
  }
};
