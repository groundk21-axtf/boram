/* utils.js — escapeHtml, uid, parseNavList, generatePlaceholderImage, fontFamilyOf, korToEng, sanitizePagePath */

function escapeHtml(s){
  if (s==null) return '';
  return String(s).replace(/[&<>"']/g, ch=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}
const uid = () => 'sec_' + Math.random().toString(36).slice(2,8);

function parseNavList(str) {
  return (str || '').split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => {
      const [label, url] = line.split('|').map(s => (s || '').trim());
      return { label: label || '', url: url || '#' };
    });
}

function generatePlaceholderImage() {
  const n = Math.floor(Math.random() * 1000);
  const g = PLACEHOLDER_GRADIENTS[Math.floor(Math.random() * PLACEHOLDER_GRADIENTS.length)];
  return {
    id: 'img_' + Math.random().toString(36).slice(2, 8),
    name: `hero-image-${n}.jpg`,
    bg: g,
    size: '2400×1200'
  };
}

// FONT_OPTIONS lookup → returns the font-family string for the live preview.
function fontFamilyOf(v) {
  return (FONT_OPTIONS.find(o => o.value === v) || FONT_OPTIONS[0]).family;
}

// 한글 → 영문 변환 (두벌식 키보드 매핑) — needs JAMO_TO_QWERTY, INITIAL_JAMO, MEDIAL_JAMO, FINAL_JAMO
function korToEng(text) {
  let out = '';
  for (const ch of String(text || '')) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      // 완성된 한글 음절 → 초/중/종성 분해 후 각각 키보드 매핑
      const syl = code - 0xAC00;
      const i = Math.floor(syl / (21 * 28));
      const m = Math.floor((syl % (21 * 28)) / 28);
      const f = syl % 28;
      out += (JAMO_TO_QWERTY[INITIAL_JAMO[i]] || '');
      out += (JAMO_TO_QWERTY[MEDIAL_JAMO[m]]  || '');
      if (f > 0) out += (JAMO_TO_QWERTY[FINAL_JAMO[f]] || '');
    } else if (JAMO_TO_QWERTY[ch]) {
      out += JAMO_TO_QWERTY[ch];
    } else {
      out += ch;
    }
  }
  return out;
}
function sanitizePagePath(s) {
  // 1) 한글이면 두벌식 키보드 매핑으로 영문 변환  2) 영문 소문자·숫자·하이픈만 유지, 그 외 삭제
  return korToEng(s).toLowerCase().trim()
    .replace(/^\/+/, '')                       // 선행 슬래시 제거
    .replace(/[^a-z0-9-]+/g, '')               // 허용 외 문자 삭제
    .replace(/-+/g, '-')                        // 연속 '-' 압축
    .replace(/^-+|-+$/g, '')                    // 양 끝 '-' 정리
    .slice(0, 40);
}
