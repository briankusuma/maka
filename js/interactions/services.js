// Disclosure tunggal: hover mouse, fokus keyboard, atau tap mengaktifkan kategori.
export function initServices(root) {
  const list = root?.querySelector('[data-services]');
  if (!list) return () => {};

  const events = new AbortController();
  const items = [...list.querySelectorAll('[data-service]')];
  const initialItem = items[0];

  // Panel keluar dari alur layout sehingga tidak menggeser judul.
  // CSS menangani transisi; hidden akan memutus animasi fade-out.
  for (const item of items) {
    item.querySelector('.projects__specialties').hidden = false;
  }

  function activate(selected) {
    for (const item of items) {
      const active = item === selected;
      item.classList.toggle('projects__service--active', active);
      item.querySelector('[data-service-trigger]').setAttribute('aria-expanded', String(active));
      const panel = item.querySelector('.projects__specialties');
      panel.setAttribute('aria-hidden', String(!active));
      panel.inert = !active;
    }
  }

  activate(initialItem);

  for (const item of items) {
    item.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') activate(item);
    }, { signal: events.signal });

    item.addEventListener('focusin', () => activate(item), { signal: events.signal });
    item.querySelector('[data-service-trigger]').addEventListener('click', () => {
      activate(item);
    }, { signal: events.signal });
  }

  // Pertahankan kategori terakhir agar kontennya bisa dibaca setelah hover.
  return () => {
    events.abort();
    activate(initialItem);
  };
}
