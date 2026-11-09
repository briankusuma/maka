// Scramble bersama untuk link atau kelompok teks, tanpa mengganti elemen anak.
export function initHoverCipher(root, { gsap, itemSelector, textSelector = null }) {
  if (!root) return () => {};
  const media = gsap.matchMedia();
  const records = [];

  for (const item of root.querySelectorAll(itemSelector)) {
    const targets = textSelector ? item.querySelectorAll(textSelector) : [item];
    const nodes = [];
    for (const target of targets) {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim()) nodes.push({ node, text: node.textContent });
      }
    }
    records.push({ item, nodes, tween: null });
  }

  function restore(record) {
    for (const { node, text } of record.nodes) node.textContent = text;
  }

  function play(record) {
    if (record.tween?.isActive()) return;
    const state = { progress: 0 };
    let lastFrame = -1;
    const total = record.nodes.reduce((sum, entry) => sum + entry.text.length, 0);
    record.tween = gsap.to(state, {
      progress: 1,
      duration: 0.8,
      ease: 'none',
      onUpdate: () => {
        const frame = Math.floor(state.progress * 0.8 * 18);
        if (frame === lastFrame) return;
        lastFrame = frame;
        let offset = 0;
        for (const { node, text } of record.nodes) {
          node.textContent = [...text].map((character, index) => {
            const locked = state.progress >= 0.3 + ((offset + index) / total) * 0.7;
            if (locked || !/[a-z0-9]/i.test(character)) return character;
            let alphabet = /\d/.test(character) ? '0123456789'
              : /[iljtfr]/i.test(character) ? 'iljtfr'
                : /[mw]/i.test(character) ? 'mw' : 'aceosuvxz';
            if (/[A-Z]/.test(character)) alphabet = alphabet.toUpperCase();
            return alphabet[Math.floor(Math.random() * alphabet.length)];
          }).join('');
          offset += text.length;
        }
      },
      onComplete: () => restore(record),
    });
  }

  media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const hoverEvents = new AbortController();
    for (const record of records) {
      record.item.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') play(record);
      }, { signal: hoverEvents.signal });
      record.item.addEventListener('focusin', () => play(record), {
        signal: hoverEvents.signal,
      });
    }
    return () => {
      hoverEvents.abort();
      for (const record of records) {
        record.tween?.kill();
        restore(record);
      }
    };
  });

  return () => {
    media.revert();
  };
}
