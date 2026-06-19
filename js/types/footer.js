/* types/footer.js */

TYPES.footer = {
  name: '사이트 푸터', category: 'system', icon: ICN.layoutBottom,
  fields: [
    { key: 'tagline', label: '상단 태그라인 (제목)', type: 'text', enableable: true },
    { key: 'taglineColor', label: '상단 태그라인 색상', type: 'color', default: '#FFFFFF' },

    { key: 'taglineDesc', label: '태그라인 설명', type: 'textarea', enableable: true },
    { key: 'taglineDescColor', label: '태그라인 설명 색상', type: 'color', default: '#BBBBBB' },

    { key: 'showTerms', label: '약관 목록 노출', type: 'toggle',
      help: 'ON 시 [사이트 설정]에 등록된 약관이 회사명 위에 링크로 표시됩니다. URL은 새창, 직접입력은 팝업으로 열립니다.'
    },
    { key: 'termsColor', label: '약관목록 색상', type: 'color', default: '#D0D0D0' },

    { key: 'companyName', label: '회사명', type: 'text', enableable: true },
    { key: 'companyColor', label: '회사명 색상', type: 'color', default: '#FFFFFF' },

    { key: 'ceo', label: '대표이사', type: 'text', enableable: true },
    { key: 'address', label: '주소', type: 'text', enableable: true },
    { key: 'bizNumber', label: '사업자번호', type: 'text', enableable: true },
    { key: 'tel', label: 'Tel', type: 'text', enableable: true },
    { key: 'fax', label: 'Fax', type: 'text', enableable: true },
    { key: 'email', label: 'Email', type: 'text', enableable: true },
    { key: 'bizInfoColor', label: '세부정보 색상', type: 'color', default: '#999999',
      help: '대표이사·주소·사업자번호·Tel·Fax·Email 등 세부정보 텍스트 색상입니다.'
    },
    
    
    { key: 'bgColor', label: '배경 색상', type: 'color', default: '#1A1A1A',
      help: '비워두면 기본 색상이 적용됩니다.'
    },
    { key: 'bgImage', label: '배경 이미지', type: 'imagepack', maxCount: 1,
      help: '배경 색상과 함께 사용 가능. 이미지가 상위 레이어로 표시됩니다.'
    },
    { key: 'assets', label: '이미지 에셋', type: 'assetpack', maxCount: 8,
      help: '데코레이션 이미지를 푸터의 8개 위치에 배치합니다.'
    }
  ],
  render: (cfg) => {
    const enabled = (k) => cfg[k + 'Enabled'] !== false;
    const has = (k) => enabled(k) && cfg[k] && String(cfg[k]).trim();

    const bizFields = [
      { label: '대표이사', key: 'ceo' },
      { label: '주소', key: 'address' },
      { label: '사업자번호', key: 'bizNumber' },
      { label: 'Tel', key: 'tel' },
      { label: 'Fax', key: 'fax' },
      { label: 'Email', key: 'email' }
    ].filter(b => has(b.key));

    const bizHtml = bizFields.length ? `<div class="ps-footer-bizinfo">${
      bizFields.map(b => `<div class="ps-footer-bizinfo-row">
        <span class="ps-footer-bizinfo-label">${escapeHtml(b.label)}</span>
        <span>${escapeHtml(cfg[b.key])}</span>
      </div>`).join('')
    }</div>` : '';

    const taglineEnabled = enabled('tagline');
    const taglineDescEnabled = enabled('taglineDesc');
    const showTagline = taglineEnabled && cfg.tagline && cfg.tagline.trim();
    const showTaglineDesc = taglineDescEnabled && cfg.taglineDesc && cfg.taglineDesc.trim();
    const taglineHtml = (showTagline || showTaglineDesc) ? `<div class="ps-footer-tagline">
      ${showTagline ? `<h3>${escapeHtml(cfg.tagline)}</h3>` : ''}
      ${showTaglineDesc ? `<p>${escapeHtml(cfg.taglineDesc)}</p>` : ''}
    </div>` : '';

    // Terms list (from 사이트 설정). URL → new tab, 직접입력(text) → popup.
    const siteTerms = (STATE.site && Array.isArray(STATE.site.terms)) ? STATE.site.terms : [];
    const showTerms = cfg.showTerms === true && siteTerms.length > 0;
    const termsHtml = showTerms ? `<div class="ps-footer-terms">${
      siteTerms.map((t, i) => {
        const name = escapeHtml(t.name || `약관 ${i + 1}`);
        return (t.type === 'text')
          ? `<button type="button" class="ps-footer-terms-link" data-terms-popup="${i}">${name}</button>`
          : `<a class="ps-footer-terms-link" href="${escapeHtml(t.value || '#')}" data-terms-url="${escapeHtml(t.value || '')}">${name}</a>`;
      }).join('<span class="ps-footer-terms-sep">|</span>')
    }</div>` : '';

    const showInfo = has('companyName') || bizHtml || showTerms;

    // Background color / image + text color overrides.
    const sectionStyles = [];
    if (typeof cfg.bgColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg.bgColor)) {
      sectionStyles.push(`--footer-bg:${cfg.bgColor}`);
    }
    if (Array.isArray(cfg.bgImage) && cfg.bgImage[0]) {
      const bg = cfg.bgImage[0].bg || '';
      sectionStyles.push(`background-image:${bg}`, 'background-size:cover', 'background-position:center');
    }
    // Per-item text colors → individual CSS vars.
    const colorVar = (key, varName) => {
      if (typeof cfg[key] === 'string' && /^#[0-9A-Fa-f]{6}$/.test(cfg[key])) {
        sectionStyles.push(`${varName}:${cfg[key]}`);
      }
    };
    colorVar('termsColor',       '--footer-terms');
    colorVar('taglineColor',     '--footer-tagline');
    colorVar('taglineDescColor', '--footer-tagline-desc');
    colorVar('companyColor',     '--footer-company');
    colorVar('bizInfoColor',     '--footer-biz');
    const sectionStyle = sectionStyles.length ? ` style="${sectionStyles.join('; ')};"` : '';

    // Decorative image asset overlays (top layer).
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

    return `<footer class="ps-footer"${sectionStyle}>
      ${overlaysHtml}
      <div class="ps-footer-body">
        ${taglineHtml}
        ${showInfo ? `<div class="ps-footer-info">
          <div>
            ${termsHtml}
            ${has('companyName') ? `<div class="ps-footer-company-name">${escapeHtml(cfg.companyName)}</div>` : ''}
            ${bizHtml}
          </div>
        </div>` : ''}
        <div class="ps-footer-platform">Powered by GroundK</div>
      </div>
    </footer>`;
  }
};
