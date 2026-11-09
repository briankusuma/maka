// Cipher mandiri: font dan komposisi asli tetap menjadi ukuran setiap kata.
export function initIntroduction(root, {
  gsap, ScrollTrigger, requestRefresh, preserveMarkup = false, hover = true,
}) {
  if (!root) return () => {};

  const events = new AbortController();
  const originalNodes = [...root.childNodes];
  const text = root.textContent.replace(/\s+/g, ' ').trim();
  const letters = [];
  const words = [];
  const state = { progress: 0 };
  let tween = null;
  let trigger = null;
  let lastFrame = -1;
  let ready = false;
  let revealed = false;
  const originalOpacity = root.style.opacity;
  // Sembunyikan hanya setelah modul motion berhasil dipanggil; cleanup memulihkan.
  root.style.opacity = '0';
  const trail = new Map();
  let trailRunning = false;
  let trailFrame = -1;

  function stopTrail() {
    gsap.ticker.remove(renderTrail);
    trailRunning = false;
    trail.clear();
  }

  function renderTrail() {
    const now = performance.now() / 1000;
    const frame = Math.floor(now * 14);
    if (frame === trailFrame) return;
    trailFrame = frame;
    for (const [letter, started] of trail) {
      const progress = Math.min(1, (now - started) / 0.45);
      letter.element.textContent = progress === 1
        ? letter.character
        : letter.alphabet[Math.floor(Math.random() * letter.alphabet.length)];
      letter.element.style.opacity = String(0.42 + progress * 0.58);
      letter.element.style.color = progress === 1 ? '' : '#EB2E2E';
      if (progress === 1) trail.delete(letter);
    }
    for (const record of words) {
      if (record.letters.some(letter => trail.has(letter))) continue;
      record.source.style.opacity = '';
      record.word.classList.remove('cipher-reveal__word--playing');
    }
    if (!trail.size) stopTrail();
  }

  function hoverTrail(event) {
    if (!ready || !revealed || tween?.isActive() || event.pointerType === 'touch'
      || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const fontSize = parseFloat(getComputedStyle(root).fontSize);
    const radius = fontSize * 0.6;
    // Kumpulkan hit sebelum menulis style agar layout tidak bolak-balik dihitung.
    const hits = [];
    for (const record of words) {
      const rect = record.word.getBoundingClientRect();
      const y = rect.top + rect.height / 2;
      if (Math.abs(event.clientY - y) > radius) continue;
      for (const letter of record.letters) {
        if (!/[a-z]/i.test(letter.character)) continue;
        const x = rect.left + (letter.left + letter.width / 2) * fontSize;
        if (Math.hypot(event.clientX - x, event.clientY - y) <= radius) {
          hits.push({ record, letter });
        }
      }
    }
    const now = performance.now() / 1000;
    for (const { record, letter } of hits) {
      record.source.style.opacity = '0';
      record.word.classList.add('cipher-reveal__word--playing');
      trail.set(letter, now);
    }
    if (trail.size && !trailRunning) {
      trailRunning = true;
      trailFrame = -1;
      gsap.ticker.add(renderTrail);
    }
  }

  function render() {
    const frame = Math.floor(state.progress * 1.4 * 14);
    if (frame === lastFrame && state.progress < 1) return;
    lastFrame = frame;

    for (const [index, letter] of letters.entries()) {
      const start = (index / Math.max(1, letters.length - 1)) * 0.7;
      const progress = Math.min(1, Math.max(0, (state.progress - start) / 0.3));
      const resolved = progress === 1;
      letter.element.textContent = resolved || !/[a-z]/i.test(letter.character)
        ? letter.character
        : letter.alphabet[Math.floor(Math.random() * letter.alphabet.length)];
      // Huruf yang belum mendapat giliran tetap kosong, lalu muncul sambil decode.
      const visible = state.progress > start;
      letter.element.style.opacity = visible
        ? String(Math.min(1, progress / 0.2) * (0.42 + progress * 0.58))
        : '0';
      letter.element.style.color = resolved || !/[a-z]/i.test(letter.character) ? '' : '#EB2E2E';
    }
  }

  function play() {
    if (!ready || tween?.isActive()) return;
    stopTrail();
    state.progress = 0;
    lastFrame = -1;
    for (const { word, source } of words) {
      source.style.opacity = '0';
      word.classList.add('cipher-reveal__word--playing');
    }
    render();
    tween = gsap.to(state, {
      progress: 1,
      duration: 1.4,
      ease: 'none',
      onUpdate: render,
      onComplete: showOriginal,
    });
  }

  function showOriginal() {
    revealed = true;
    for (const letter of letters) {
      letter.element.textContent = letter.character;
      letter.element.style.opacity = '1';
      letter.element.style.color = '';
    }
    for (const { word, source } of words) {
      source.style.opacity = '';
      word.classList.remove('cipher-reveal__word--playing');
    }
  }

  async function prepare() {
    await document.fonts.ready;
    if (events.signal.aborted) return;
    const fragment = document.createDocumentFragment();
    const accessible = document.createElement('span');
    accessible.className = 'u-sr-only';
    accessible.textContent = text;
    fragment.append(accessible);

    function createWord(value) {
      const word = document.createElement('span');
      word.className = 'cipher-reveal__word';
      word.setAttribute('aria-hidden', 'true');
      const source = document.createElement('span');
      source.className = 'cipher-reveal__source';
      source.textContent = value;
      word.append(source);
      words.push({ word, source, letters: [] });
      return word;
    }

    if (preserveMarkup) {
      // Copy statistik memiliki span per baris; pertahankan grid dan jaraknya.
      const visual = document.createDocumentFragment();
      for (const node of originalNodes) visual.append(node.cloneNode(true));
      const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        if (!node.textContent.trim()) continue;
        // Satu text node tetap satu flex item pada baris space-between.
        const replacement = document.createElement('span');
        replacement.className = 'cipher-reveal__text';
        for (const token of node.textContent.split(/(\s+)/).filter(Boolean)) {
          replacement.append(/\S/.test(token) ? createWord(token) : document.createTextNode(token));
        }
        node.replaceWith(replacement);
      }
      for (const child of visual.children) child.setAttribute('aria-hidden', 'true');
      fragment.append(visual);
    } else {
      for (const [index, value] of text.split(' ').entries()) {
        if (index > 0) fragment.append(document.createTextNode(' '));
        fragment.append(createWord(value));
      }
    }
    root.replaceChildren(fragment);

    // Selesaikan seluruh pengukuran sebelum menambahkan overlay karakter.
    const fontSize = parseFloat(getComputedStyle(root).fontSize);
    const geometry = words.map(({ word, source }) => {
      const bounds = word.getBoundingClientRect();
      const range = document.createRange();
      return [...source.textContent].map((character, index) => {
        range.setStart(source.firstChild, index);
        range.setEnd(source.firstChild, index + 1);
        const rect = range.getBoundingClientRect();
        return { character, left: rect.left - bounds.left, width: rect.width };
      });
    });

    for (const [wordIndex, { word }] of words.entries()) {
      for (const { character, left, width } of geometry[wordIndex]) {
        const element = document.createElement('span');
        element.className = 'cipher-reveal__glyph';
        element.textContent = character;
        element.style.left = `${left / fontSize}em`;
        element.style.width = `${width / fontSize}em`;
        word.append(element);
        const lowercase = character === character.toLowerCase();
        const alphabet = /[ilItfjr]/.test(character) ? 'iljtfr' : /[mwMW]/.test(character) ? 'mw' : 'aceosuvxz';
        const letter = {
          element,
          character,
          alphabet: lowercase ? alphabet : alphabet.toUpperCase(),
          left: left / fontSize,
          width: width / fontSize,
        };
        letters.push(letter);
        words[wordIndex].letters.push(letter);
      }
    }
    ready = true;
    for (const { word, source } of words) {
      source.style.opacity = '0';
      word.classList.add('cipher-reveal__word--playing');
    }
    render();
    root.style.opacity = originalOpacity;
    if (hover) root.addEventListener('pointermove', hoverTrail, { signal: events.signal });
    trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top 85%',
      onEnter: play,
      onEnterBack: play,
    });
    requestRefresh();
  }

  void prepare().catch(error => {
    if (events.signal.aborted) return;
    console.error('MAKA introduction: cipher reveal could not initialize.', error);
    tween?.kill();
    stopTrail();
    trigger?.kill();
    events.abort();
    root.replaceChildren(...originalNodes);
    root.style.opacity = originalOpacity;
  });

  return () => {
    events.abort();
    tween?.kill();
    stopTrail();
    trigger?.kill();
    root.replaceChildren(...originalNodes);
    root.style.opacity = originalOpacity;
  };
}
