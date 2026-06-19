/* types/customercenter.js */

TYPES.customercenter = {
  name: '고객센터', category: 'system', icon: ICN.headset,
  fields: [
    { key: 'enabled', label: '섹션 노출', type: 'toggle',
      help: '풋터 상단에 고정되는 고객센터 영역의 노출 여부를 설정합니다.'
    },
    { key: 'phone', label: '전화번호', type: 'text', enableable: true },
    { key: 'email', label: '이메일', type: 'text', enableable: true },
    { key: 'website', label: '홈페이지', type: 'text', enableable: true, help: '예: https://example.com' },
    { key: 'hours', label: '운영시간', type: 'textarea', enableable: true, help: '여러 시간대는 엔터로 구분합니다.' },
    { key: 'languages', label: '대응 언어', type: 'multiselect', enableable: true, options: CC_LANGUAGE_OPTIONS,
      help: '체크된 언어가 고객센터 영역에 표시됩니다.'
    },
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#F8FAFC' },
    { key: 'titleColor', label: '제목 컬러', type: 'color', default: '#1A1A1A' },
    { key: 'textColor', label: '본문 컬러', type: 'color', default: '#4B5563' }
  ],
  render: (cfg) => {
    if (cfg.enabled === false) {
      return `<section class="ps-cc ps-cc-hidden">
        <div class="ps-cc-hidden-msg">${ICN.hidden}<span>고객센터 영역이 비활성화되어 있습니다 (실제 페이지에서 노출되지 않음).</span></div>
      </section>`;
    }
    const sectionStyles = [];
    if (typeof cfg.bgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.bgColor)) {
      sectionStyles.push(`background-color:${cfg.bgColor}`);
    }
    if (typeof cfg.titleColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.titleColor)) {
      sectionStyles.push(`--cc-title:${cfg.titleColor}`);
    }
    if (typeof cfg.textColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.textColor)) {
      sectionStyles.push(`--cc-text:${cfg.textColor}`);
    }
    const sectionStyle = sectionStyles.length ? ` style="${sectionStyles.join('; ')};"` : '';

    const row = (icon, value) => value
      ? `<div class="ps-cc-row">
          <div class="ps-cc-row-icon">${ICN[icon] || ICN.info}</div>
          <div class="ps-cc-row-value">${escapeHtml(value).replace(/\n/g, '<br/>')}</div>
        </div>`
      : '';

    // Per-field visibility toggle (enableable). Field shows only when its *Enabled flag isn't false.
    const en = (k) => cfg[k + 'Enabled'] !== false;

    const websiteBtn = (en('website') && cfg.website)
      ? `<a class="ps-cc-website-btn" href="${escapeHtml(cfg.website)}" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault();">
          <span>홈페이지 바로가기</span>
          <span class="ps-cc-website-btn-arrow">→</span>
        </a>`
      : '';

    // Languages: multiselect stores codes (e.g., 'ko', 'en'). Map to Korean labels.
    const langText = en('languages') && Array.isArray(cfg.languages)
      ? cfg.languages
          .map(code => (CC_LANGUAGE_OPTIONS.find(o => o.value === code) || {}).label || code)
          .join(', ')
      : (en('languages') && typeof cfg.languages === 'string' ? cfg.languages : '');

    return `<section class="ps-cc"${sectionStyle}>
      <div class="ps-cc-inner">
        <div class="ps-cc-head">
          <h3 class="ps-cc-title">고객센터</h3>
          ${websiteBtn}
        </div>
        <div class="ps-cc-grid">
          ${row('phone', en('phone') ? cfg.phone : '')}
          ${row('clock', en('hours') ? cfg.hours : '')}
          ${row('message', langText)}
          ${row('mail', en('email') ? cfg.email : '')}
        </div>
      </div>
    </section>`;
  }
};
