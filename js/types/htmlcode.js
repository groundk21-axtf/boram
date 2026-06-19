/* types/htmlcode.js */

TYPES.htmlcode = {
  name: 'HTML 코드', category: 'content', icon: ICN.code,
  fields: [
    { key: 'code', label: 'HTML 코드', type: 'textarea',
      help: '직접 HTML/CSS를 입력해 렌더링합니다. 신뢰할 수 있는 코드만 입력해 주세요. (스크립트 태그는 차단됩니다.)'
    },
    { key: 'maxWidth', label: '최대 너비', type: 'segmented', options: [
      { value: 'full',      label: '풀폭' },
      { value: 'container', label: '컨테이너' }
    ]},
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '' }
  ],
  render: (cfg) => {
    // Strip script blocks for safety. RegExp is built dynamically so the closing
    // script literal does not appear in source (which would terminate this inline script).
    const SCRIPT_RE = new RegExp('<script' + '[\\s\\S]*?<\\/' + 'script>', 'gi');
    const raw = String(cfg.code || '').replace(SCRIPT_RE, '');
    const styles = [];
    if (typeof cfg.bgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.bgColor)) {
      styles.push(`background-color:${cfg.bgColor}`);
    }
    const blockClass = cfg.maxWidth === 'container' ? 'ps-block ps-htmlcode' : 'ps-htmlcode ps-htmlcode-full';
    const styleAttr = styles.length ? ` style="${styles.join('; ')};"` : '';
    const empty = !raw.trim()
      ? `<div class="ps-htmlcode-empty">우측 패널에서 HTML 코드를 입력해주세요.</div>`
      : '';
    return `<section class="${blockClass}"${styleAttr}>${empty || raw}</section>`;
  }
};
