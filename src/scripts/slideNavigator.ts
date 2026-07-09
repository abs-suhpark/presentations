/**
 * Shared slide-deck navigator.
 *
 * Extracted from the markdown SlideDeck layout so any "slides" layout (markdown or MDX) can
 * drive the same present-mode UX without re-implementing it. This module owns only the
 * GENERIC part — hash routing, controls, keyboard, focus, aria-live, and the TOC sidebar. Slide
 * collection/synthesis (e.g. partitioning markdown by `<h2>` and building a cover) is layout-
 * specific and stays in the layout.
 *
 * CONTRACT — a layout that wants this navigator MUST emit this exact DOM before calling init:
 *  - Slides: `<section class="slide" data-slide="N" data-title="...">`, one per index, 0-based,
 *    in document order, where index 0 is the cover/first slide. `data-title` is the SINGLE
 *    SOURCE OF TRUTH for labels (the aria-live announcement and the TOC entries) — the navigator
 *    never reads `<h2>`/cover markup directly.
 *  - Controls: `#slide-prev`, `#slide-next` (buttons), `#slide-counter` (text host),
 *    `#slide-live` (an `aria-live="polite"` status element).
 *  - Sidebar: a `.toc-sidebar` element — the navigator (re)builds an
 *    `<ol class="toc-list" id="toc-list">` inside it, one `<li><a href="#i">title</a></li>` per
 *    slide index 1..N (the cover, index 0, is excluded from the TOC).
 *
 * Usage: after a layout has built/collected its `.slide` sections in the DOM, call:
 *
 *   initSlideNavigator(slides, { homeHref: '/markdown/my-slug' });
 *
 * `slides` is the ordered array (or NodeList) of `.slide` elements already in the document.
 * `homeHref` is the URL Escape navigates to via `location.assign(homeHref)`.
 *
 * Behavior: hash router (`''`/`#0`/`#cover` = slide 0, `#k` = slide k, clamped to [0, N]),
 * show-only-the-active-slide via `.hidden`, prev/next disabled at the ends, keyboard
 * (→/Space/PageDown next, ←/PageUp prev, Home → first, End → last, Esc → homeHref), a
 * `hashchange` listener so deep links and back/forward stay in sync, focus moved to the active
 * slide, and an aria-live announcement on every slide change.
 */

export interface SlideNavigatorOptions {
  /** Where Escape navigates via `location.assign(homeHref)`. */
  homeHref: string;
}

export function initSlideNavigator(
  slides: HTMLElement[] | NodeListOf<HTMLElement>,
  options: SlideNavigatorOptions
): void {
  const list = Array.from(slides);
  const total = list.length;
  if (total === 0) return;
  const N = total - 1;
  const { homeHref } = options;

  const sidebar = document.querySelector<HTMLElement>('.toc-sidebar');
  const prevBtn = document.getElementById('slide-prev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('slide-next') as HTMLButtonElement | null;
  const counterEl = document.getElementById('slide-counter');
  const liveRegion = document.getElementById('slide-live');

  // TOC is always rebuilt client-side from `.slide[data-title]` — the single source of truth,
  // so it can never drift from the DOM partition (and works for layouts with no SSR TOC at all).
  function rebuildToc(): HTMLAnchorElement[] {
    if (!sidebar) return [];
    let tocList = document.getElementById('toc-list');
    if (!tocList) {
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Slides');
      tocList = document.createElement('ol');
      tocList.className = 'toc-list';
      tocList.id = 'toc-list';
      nav.appendChild(tocList);
      sidebar.appendChild(nav);
    } else {
      tocList.innerHTML = '';
    }
    const items: HTMLAnchorElement[] = [];
    for (let i = 1; i < list.length; i++) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + i;
      a.textContent = list[i].dataset.title || 'Slide ' + i;
      li.appendChild(a);
      tocList.appendChild(li);
      items.push(a);
    }
    return items;
  }

  const tocItems = rebuildToc();

  // Hash router: single source of truth for the active slide.
  function parseHash(): number {
    const raw = location.hash.replace(/^#/, '');
    if (raw === '' || raw === '0' || raw === 'cover') return 0;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return 0;
    return Math.min(Math.max(n, 0), N);
  }

  let activeIndex = 0;

  function render(index: number): void {
    activeIndex = index;
    list.forEach((sec, i) => {
      sec.hidden = i !== index;
    });
    if (counterEl) counterEl.textContent = (index + 1) + ' / ' + total;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === N;
    tocItems.forEach((a, i) => {
      const active = i === index - 1;
      a.parentElement?.classList.toggle('active', active);
      a.setAttribute('aria-current', active ? 'true' : 'false');
    });

    const active = list[index];
    active.focus();
    const title = active.dataset.title || '';
    if (liveRegion) {
      liveRegion.textContent = 'Slide ' + (index + 1) + ' of ' + total + (title ? ': ' + title : '');
    }
  }

  function applyHash(): void {
    render(parseHash());
  }

  // Controls set the hash; they never mutate the DOM directly.
  function goTo(index: number): void {
    const clamped = Math.min(Math.max(index, 0), N);
    location.hash = clamped === 0 ? '0' : String(clamped);
  }

  // hashchange keeps deep-links and browser back/forward in sync.
  window.addEventListener('hashchange', applyHash);

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(activeIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(activeIndex + 1));

  document.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        goTo(activeIndex + 1);
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        goTo(activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(N);
        break;
      case 'Escape':
        e.preventDefault();
        location.assign(homeHref);
        break;
      default:
        break;
    }
  });

  // Honor an incoming hash (e.g. a direct /present#3 deep link).
  applyHash();
}
