'use strict';
(() => {
  const KEY = 'classroom-21-theme';
  const ASSIGNMENTS_KEY = 'classroom-21-shinchan-profiles-v1';
  const validThemes = new Set(['default', 'chiikawa', 'shinchan']);
  const selector = document.querySelector('#theme-select');
  const studentList = document.querySelector('#students');
  const chiikawa = {
    src: 'assets/chiikawa-characters.png', width: 1126, height: 660,
    viewBoxes: ['35 235 335 330', '385 190 355 365', '755 35 370 440']
  };
  const shinchan = {"width": 2172, "height": 724, "viewBoxes": ["77 197 356 433", "493 199 334 429", "923 152 329 480", "1334 196 332 432", "1778 135 316 497"], "src": "assets/shinchan-characters.png"};
  const assignments = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const [id, value] of Object.entries(saved)) {
        if (Number.isInteger(value) && value >= 0 && value < shinchan.viewBoxes.length) assignments.set(id, value);
      }
    }
  } catch { /* 저장된 배정표가 없거나 손상되면 새로 배정 */ }
  function decorateAvatars() {
    const theme = document.documentElement.dataset.theme;
    if (!studentList || theme === 'default') return;
    const atlas = theme === 'shinchan' ? shinchan : chiikawa;
    let assignmentsChanged = false;
    studentList.querySelectorAll('.avatar-character').forEach(slot => {
      if (slot.dataset.renderedTheme === theme && slot.firstElementChild) return;
      let index;
      if (theme === 'shinchan') {
        const id = slot.closest('.student')?.dataset.id;
        if (!id) return;
        if (!assignments.has(id)) {
          assignments.set(id, Math.floor(Math.random() * atlas.viewBoxes.length));
          assignmentsChanged = true;
        }
        index = assignments.get(id);
      } else index = Number(slot.dataset.character) % atlas.viewBoxes.length;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', atlas.viewBoxes[index]);
      svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
      svg.setAttribute('aria-hidden', 'true');
      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttribute('href', atlas.src);
      img.setAttribute('width', String(atlas.width));
      img.setAttribute('height', String(atlas.height));
      svg.append(img);
      slot.replaceChildren(svg);
      slot.dataset.renderedTheme = theme;
    });
    if (assignmentsChanged) {
      try { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(Object.fromEntries(assignments))); } catch { /* 현재 페이지 배정은 유지 */ }
    }
  }
  function applyTheme(value, save = false) {
    const theme = validThemes.has(value) ? value : 'default';
    document.documentElement.dataset.theme = theme;
    if (selector) selector.value = theme;
    decorateAvatars();
    if (save) {
      try { localStorage.setItem(KEY, theme); } catch { /* 저장이 막혀도 현재 화면에는 적용 */ }
    }
  }
  let initial = 'default';
  try { initial = localStorage.getItem(KEY) || initial; } catch { /* 기본 테마 사용 */ }
  applyTheme(initial);
  selector?.addEventListener('change', () => applyTheme(selector.value, true));
  if (studentList) new MutationObserver(decorateAvatars).observe(studentList, {childList: true});
  window.addEventListener('storage', event => {
    if (event.key === KEY) applyTheme(event.newValue);
    if (event.key === ASSIGNMENTS_KEY) {
      try {
        const saved = JSON.parse(event.newValue || '{}');
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
        assignments.clear();
        for (const [id, value] of Object.entries(saved)) if (Number.isInteger(value) && value >= 0 && value < shinchan.viewBoxes.length) assignments.set(id, value);
        studentList?.querySelectorAll('.avatar-character').forEach(slot => {delete slot.dataset.renderedTheme;});
        decorateAvatars();
      } catch { /* 다른 탭의 손상된 배정표 무시 */ }
    }
  });
})();
