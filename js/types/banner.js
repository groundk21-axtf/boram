/* types/banner.js */

TYPES.banner = {
  name: '배너', category: 'content', icon: ICN.image,
  fields: [
    { key: 'images', label: '배너 이미지', type: 'imagepack', maxCount: 3, withLinks: true,
      help: '최대 3장까지 등록 가능. 권장 사이즈 1280×160 (8:1). 각 이미지별 링크 URL과 새창/현재창 여부를 지정할 수 있습니다.'
    },
    { key: 'imagesOrder', label: '배너 순서', type: 'sortable',
      sourceKey: 'images', reorderSource: true,
      showWhen: (cfg) => Array.isArray(cfg.images) && cfg.images.length >= 2,
      help: '드래그하여 배너 노출 순서를 변경합니다.'
    },
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#FFFFFF',
      help: '배너 영역의 외부 배경 색상입니다.'
    }
  ],
  render: (cfg, ctx) => {
    const images = Array.isArray(cfg.images) ? cfg.images : [];
    STATE.bannerCarousel = STATE.bannerCarousel || {};
    let idx = STATE.bannerCarousel[ctx.sectionId] || 0;
    if (idx >= images.length) idx = 0;

    const sectionStyles = [];
    if (typeof cfg.bgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.bgColor)) {
      sectionStyles.push(`background-color:${cfg.bgColor}`);
    }
    const sectionStyle = sectionStyles.length ? ` style="${sectionStyles.join('; ')};"` : '';

    if (images.length === 0) {
      return `<section class="ps-banner ps-banner-empty"${sectionStyle}>
        <div class="ps-banner-placeholder">우측 패널에서 배너 이미지를 추가해주세요.</div>
      </section>`;
    }

    const current = images[idx] || images[0];
    const href = current.url || '#';
    const target = current.target === '_blank' ? '_blank' : '_self';
    const rel = target === '_blank' ? ' rel="noopener noreferrer"' : '';

    const dotsHtml = images.length >= 2
      ? `<div class="ps-banner-dots">${
          images.map((_, i) => `<button type="button" class="ps-banner-dot${i === idx ? ' active' : ''}" data-banner-dot="${i}" data-sid="${ctx.sectionId}" aria-label="${i + 1}번 슬라이드"></button>`).join('')
        }</div>`
      : '';

    return `<section class="ps-banner"${sectionStyle}>
      <a class="ps-banner-slide" href="${escapeHtml(href)}" target="${target}"${rel} style="background-image:${current.bg};" onclick="event.preventDefault();" aria-label="배너"></a>
      ${dotsHtml}
    </section>`;
  }
};
