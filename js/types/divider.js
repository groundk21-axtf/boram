/* types/divider.js */

TYPES.divider = {
  name: '구분선', category: 'utility', icon: ICN.divider,
  fields: [
    { key: 'lineStyle', label: '선 스타일', type: 'segmented',
      options: [
        { value: 'solid', label: '실선' },
        { value: 'dotted', label: '점선' }
      ]
    },
    { key: 'lineColor', label: '구분선 색상', type: 'color', default: '#EAEAEA' },
    { key: 'opacity', label: '투명도', type: 'range', min: 0, max: 100, step: 1, default: 100, suffix: '%' }
  ],
  render: (cfg) => {
    const styleKind = cfg.lineStyle === 'dotted' ? 'dotted' : 'solid';
    const styles = [];
    if (typeof cfg.lineColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.lineColor)) {
      styles.push(`--divider-color:${cfg.lineColor}`);
    }
    if (typeof cfg.opacity === 'number') {
      const op = Math.max(0, Math.min(100, cfg.opacity)) / 100;
      styles.push(`--divider-opacity:${op}`);
    }
    const styleAttr = styles.length ? ` style="${styles.join('; ')};"` : '';
    return `<div class="divider-section"${styleAttr}><hr class="${styleKind}"/></div>`;
  }
};
