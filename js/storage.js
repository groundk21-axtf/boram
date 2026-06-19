/* storage.js — localStorage 영속화 (웹사이트 목록 양쪽 페이지에서 공유) */

const TMS_STORAGE_KEY = 'TMS_WEBSITES_V1';

// 기본 시드 — localStorage가 비어 있을 때 사용
const DEFAULT_WEBSITES = [
  { id: 'site_vivapark',   name: '비발디파크 셔틀',   domain: 'vivapark',   defaultLang: 'ko', operator: '그라운드케이', vendor: '대명관광',     memberBooking: true,  guestBooking: true,  pg: 'integrated', status: 'live',  createdAt: '2026-03-15 13:59', updatedAt: '2026-05-22 01:19', thumbBg: "linear-gradient(135deg, #0E5F4A 0%, #4FC3F7 100%)" },
  { id: 'site_groundk',    name: '그라운드케이 투어', domain: 'groundk',    defaultLang: 'ko', operator: '그라운드케이', vendor: '그라운드케이', memberBooking: true,  guestBooking: false, pg: 'self',       status: 'draft', createdAt: '2026-04-22 09:12', updatedAt: '2026-05-25 18:04', thumbBg: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)" },
  { id: 'site_oceanworld', name: '오션월드 예약',     domain: 'oceanworld', defaultLang: 'ko', operator: '그라운드케이', vendor: '대명관광',     memberBooking: false, guestBooking: true,  pg: 'integrated', status: 'live',  createdAt: '2026-05-10 11:30', updatedAt: '2026-05-26 23:48', thumbBg: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)" }
];

function loadWebsites() {
  try {
    const raw = localStorage.getItem(TMS_STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_WEBSITES));
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : JSON.parse(JSON.stringify(DEFAULT_WEBSITES));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_WEBSITES));
  }
}

function saveWebsites(list) {
  try {
    localStorage.setItem(TMS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) { /* ignore quota */ }
}

function getWebsiteById(id) {
  return loadWebsites().find(w => w.id === id);
}
