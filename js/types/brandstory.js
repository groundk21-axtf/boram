/* types/brandstory.js */

TYPES.brandstory = {
  name: '소개', category: 'content', icon: ICN.book,
  fields: [
    { key: 'title', label: '제목', type: 'textarea', enableable: true, help: '줄바꿈 사용 가능' },
    { key: 'titleColor', label: '제목 컬러', type: 'color', default: '#1A1A1A',
      showWhen: (cfg) => cfg.titleEnabled !== false && !!cfg.title
    },
    { key: 'body', label: '본문', type: 'textarea', enableable: true, help: '엔터 두 번으로 문단 구분' },
    { key: 'bodyColor', label: '본문 컬러', type: 'color', default: '#4B5563',
      showWhen: (cfg) => cfg.bodyEnabled !== false && !!cfg.body
    },
    { key: 'image', label: '이미지', type: 'imagepack', maxCount: 1, affectsForm: true,
      help: '소개 영역에 노출할 이미지입니다. 비우면 텍스트가 전체 폭으로 표시됩니다.'
    },
    { key: 'imagePosition', label: '이미지 위치', type: 'segmented', options: [
      { value: 'left',  label: '왼쪽' },
      { value: 'right', label: '오른쪽' }
    ],
      showWhen: (cfg) => Array.isArray(cfg.image) && cfg.image.length > 0
    },
    { key: 'textAlign', label: '텍스트·버튼 정렬', type: 'segmented', options: [
      { value: 'left',   label: '왼쪽' },
      { value: 'center', label: '가운데' },
      { value: 'right',  label: '오른쪽' }
    ]},
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#FFFFFF',
      help: '비워두면 색상 적용을 건너뜁니다.'
    },
    { key: 'ctaText', label: 'CTA 버튼 텍스트', type: 'text', enableable: true },
    { key: 'ctaUrl', label: 'CTA 링크', type: 'urltarget',
      targetKey: 'ctaTarget',
      placeholder: 'https:// 등 전체 URL 또는 내부 경로(/path)를 입력하세요.',
      showWhen: (cfg) => cfg.ctaTextEnabled !== false && !!cfg.ctaText
    },
    { key: 'ctaBgColor', label: 'CTA 배경 컬러', type: 'color', default: '#1A1A1A',
      showWhen: (cfg) => cfg.ctaTextEnabled !== false && !!cfg.ctaText
    },
    { key: 'ctaTextColor', label: 'CTA 텍스트 컬러', type: 'color', default: '#FFFFFF',
      showWhen: (cfg) => cfg.ctaTextEnabled !== false && !!cfg.ctaText
    }
  ],
  render: (cfg) => {
    const en = (k) => cfg[k + 'Enabled'] !== false;
    const showTitle = en('title') && cfg.title;
    const showBody = en('body') && cfg.body;
    const showCta = en('ctaText') && cfg.ctaText;
    const reverse = cfg.imagePosition === 'left' ? 'reverse' : '';
    // Backward compat: legacy `heading` key on older seed data.
    const titleText = cfg.title || cfg.heading || '';
    const imageBg = (Array.isArray(cfg.image) && cfg.image[0]) ? cfg.image[0].bg : '';
    const hasImage = !!imageBg;
    const align = ['left', 'center', 'right'].includes(cfg.textAlign) ? cfg.textAlign : 'left';

    const sectionStyles = [];
    if (typeof cfg.bgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.bgColor)) {
      sectionStyles.push(`background-color:${cfg.bgColor}`);
    }
    if (typeof cfg.titleColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.titleColor)) {
      sectionStyles.push(`--intro-title:${cfg.titleColor}`);
    }
    if (typeof cfg.bodyColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.bodyColor)) {
      sectionStyles.push(`--intro-body:${cfg.bodyColor}`);
    }
    if (typeof cfg.ctaBgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.ctaBgColor)) {
      sectionStyles.push(`--intro-cta-bg:${cfg.ctaBgColor}`);
    }
    if (typeof cfg.ctaTextColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.ctaTextColor)) {
      sectionStyles.push(`--intro-cta-text:${cfg.ctaTextColor}`);
    }
    const sectionStyle = sectionStyles.length ? ` style="${sectionStyles.join('; ')};"` : '';

    const paragraphs = showBody
      ? (cfg.body || '').split('\n\n').map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`).join('')
      : '';

    const ctaHref = cfg.ctaUrl || '#';
    const ctaTarget = cfg.ctaTarget === '_blank' ? '_blank' : '_self';
    const ctaRel = ctaTarget === '_blank' ? ' rel="noopener noreferrer"' : '';
    const ctaHtml = showCta
      ? `<a class="brand-story-cta" href="${escapeHtml(ctaHref)}" target="${ctaTarget}"${ctaRel} data-section-cta>${escapeHtml(cfg.ctaText)} <span class="brand-story-cta-arrow">→</span></a>`
      : '';

    return `<section class="brand-story ${reverse}${hasImage ? '' : ' no-image'} align-${align}"${sectionStyle}>
      <div class="brand-story-text">
        ${showTitle ? `<h3>${escapeHtml(titleText).replace(/\n/g, '<br/>')}</h3>` : ''}
        ${paragraphs}
        ${ctaHtml}
      </div>
      ${hasImage ? `<div class="brand-story-img" style="background-image: ${imageBg};"></div>` : ''}
    </section>`;
  }
};
