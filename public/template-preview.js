// ─────────────────────────────────────────────────────────────────
// template-preview.js — Hover/long-press to preview template modal
//
//   • Desktop:    hover ~1.5s on a template card → preview opens (smooth fade-in)
//   • Touch:      press & hold ~600ms → preview opens
//   • Auto-close: once cursor enters the modal, leaving it auto-closes after ~280ms
//   • Modal:      device toggle (Desktop / Tablet / Mobile) live-resizes the iframe
//   • OK button:  closes modal + selects template + scrolls to form
//   • X / Esc / backdrop click: closes without selecting
//   • Direct click on card: still selects immediately (fast path)
// ─────────────────────────────────────────────────────────────────
(function () {
  const HOVER_DELAY_MS     = 1500;   // desktop hover before preview opens
  const LONGPRESS_DELAY_MS = 600;    // touch hold before preview opens
  const AUTOCLOSE_DELAY_MS = 280;    // grace period after cursor leaves modal
  const VP_WIDTHS = { desktop: 1280, tablet: 820, mobile: 420 };
  const VP_LABELS = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };

  const TEMPLATE_NAMES = {
    'template-1':           'Editorial',
    'template-2':           'Agency',
    'template-3':           'Terminal / Dev Studio',
    'template-4':           'Web3 / Protocol',
    'template-5':           'Local Service',
    'template-6':           'BFSI / Banking',
    'template-7':           'Startup / SaaS',
    'template-8':           'Insurance Advisor',
    'template-9':           'NBFC / Lender',
    'template-10':          'Restaurant / Café',
    'template-11':          'Portfolio / Freelancer',
    'template-heph':        'InsurTech SaaS',
    'template-turtlemint':  'Insurance Market'
  };

  let hoverTimer     = null;
  let longPressTimer = null;
  let autoCloseTimer = null;
  let modalEls       = null;     // built lazily on first open
  let activeTemplateId = null;
  let activeDevice   = 'desktop';
  let isOpen         = false;
  let isClosing      = false;    // during exit animation
  let hasEnteredModal = false;   // tracks whether cursor has entered modal in this session

  // ── Tiny DOM helper ─────────────────────────────────────────────
  function el(tag, attrs, kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach(c => {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  // ── Build the modal once on first open ──────────────────────────
  function buildModal() {
    if (modalEls) return modalEls;

    const titleEl  = el('h3', { class: 'tpv-title' }, 'Template Preview');
    const closeBtn = el('button', {
      class: 'tpv-close',
      type: 'button',
      'aria-label': 'Close preview',
      onclick: () => closePreview()
    }, '×');

    const deviceBtns = ['desktop', 'tablet', 'mobile'].map(d =>
      el('button', {
        class: 'tpv-device' + (d === 'desktop' ? ' active' : ''),
        type: 'button',
        'data-device': d,
        onclick: () => setDevice(d)
      }, VP_LABELS[d])
    );

    const frameEl = el('iframe', {
      class: 'tpv-frame',
      title: 'Template preview',
      loading: 'lazy'
    });

    const frameWrap = el('div', { class: 'tpv-frame-wrap' }, frameEl);

    const confirmBtn = el('button', {
      class: 'tpv-confirm',
      type: 'button',
      onclick: () => confirmSelection()
    }, [
      el('span', {}, 'Use This Template'),
      el('span', { class: 'tpv-confirm-arrow' }, ' →')
    ]);

    const modal = el('div', { class: 'tpv-modal', role: 'dialog', 'aria-modal': 'true' }, [
      el('div', { class: 'tpv-header' }, [
        titleEl,
        el('div', { class: 'tpv-toolbar' }, [
          el('span', { class: 'tpv-toolbar-label' }, 'View'),
          ...deviceBtns
        ]),
        closeBtn
      ]),
      frameWrap,
      el('div', { class: 'tpv-footer' }, confirmBtn)
    ]);

    // Auto-close: once cursor has entered the modal, leaving it triggers a
    // close after a small grace period. Re-entering cancels the close.
    modal.addEventListener('mouseenter', () => {
      hasEnteredModal = true;
      clearTimeout(autoCloseTimer);
    });
    modal.addEventListener('mouseleave', () => {
      if (!hasEnteredModal || !isOpen || isClosing) return;
      clearTimeout(autoCloseTimer);
      autoCloseTimer = setTimeout(() => closePreview(), AUTOCLOSE_DELAY_MS);
    });

    const backdrop = el('div', {
      class: 'tpv-backdrop',
      onclick: (e) => { if (e.target === backdrop) closePreview(); }
    }, modal);

    document.body.appendChild(backdrop);

    modalEls = { backdrop, modal, titleEl, frameEl, frameWrap, deviceBtns, confirmBtn };
    return modalEls;
  }

  // ── Open / close ────────────────────────────────────────────────
  function openPreview(templateId) {
    if (isOpen || isClosing) return;
    if (!templateId) return;

    const m = buildModal();
    activeTemplateId = templateId;
    activeDevice    = 'desktop';
    hasEnteredModal = false;

    // Title falls back to the raw ID if not in the map
    m.titleEl.textContent = TEMPLATE_NAMES[templateId] || templateId.replace(/^template-/, '').replace(/\b\w/g, c => c.toUpperCase());

    // URL: strip "template-" prefix → /template-previews/preview-{slug}.html
    const slug = String(templateId).replace(/^template-/, '');
    m.frameEl.src = `/template-previews/preview-${slug}.html`;

    setDevice('desktop');

    // Force reflow so the .open class triggers the entrance transition
    m.backdrop.offsetWidth;
    m.backdrop.classList.add('open');
    document.body.classList.add('tpv-open');
    isOpen = true;

    clearTimeout(hoverTimer);
    clearTimeout(longPressTimer);
    clearTimeout(autoCloseTimer);
  }

  function closePreview() {
    if (!isOpen || !modalEls) return;
    clearTimeout(autoCloseTimer);
    isClosing = true;
    modalEls.backdrop.classList.remove('open');
    document.body.classList.remove('tpv-open');

    // Wait out the exit animation (matches the CSS .32s) then reset
    setTimeout(() => {
      if (modalEls) modalEls.frameEl.src = 'about:blank';
      isClosing = false;
      isOpen = false;
      activeTemplateId = null;
      hasEnteredModal = false;
    }, 320);
  }

  function setDevice(device) {
    if (!modalEls) return;
    activeDevice = device;
    modalEls.deviceBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-device') === device);
    });
    requestAnimationFrame(layoutFrame);
  }

  function layoutFrame() {
    if (!modalEls) return;
    const wrap  = modalEls.frameWrap;
    const frame = modalEls.frameEl;
    const vpW   = VP_WIDTHS[activeDevice];
    const cardW = wrap.clientWidth;
    const cardH = wrap.clientHeight;
    if (!cardW || !cardH) return;

    const scale = Math.min(1, cardW / vpW);
    frame.style.width  = vpW + 'px';
    frame.style.height = (cardH / scale) + 'px';
    frame.style.transform = `scale(${scale})`;
    frame.style.transformOrigin = 'top left';
  }

  function confirmSelection() {
    if (!activeTemplateId) return closePreview();
    const radio = document.querySelector(`input[name="template"][value="${activeTemplateId}"]`);
    if (radio && !radio.checked) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    closePreview();
    const formWrap = document.querySelector('.schema-form-wrap') || document.getElementById('schemaForm');
    if (formWrap) {
      setTimeout(() => formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 340);
    }
  }

  // ── Card handlers (hover + long-press) ──────────────────────────
  function attachCard(box) {
    const radio = box.querySelector('input[type="radio"]');
    if (!radio || !radio.value) return;
    const id = radio.value;

    // Desktop: hover with delay
    box.addEventListener('mouseenter', () => {
      if (isOpen || isClosing) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => openPreview(id), HOVER_DELAY_MS);
      box.classList.add('tpv-pending');
    });
    box.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      box.classList.remove('tpv-pending');
    });

    // Touch: long-press
    box.addEventListener('touchstart', () => {
      if (isOpen || isClosing) return;
      clearTimeout(longPressTimer);
      box.classList.add('tpv-pending');
      longPressTimer = setTimeout(() => {
        box.dataset.tpvSuppressClick = '1';
        openPreview(id);
      }, LONGPRESS_DELAY_MS);
    }, { passive: true });

    const cancelLongPress = () => {
      clearTimeout(longPressTimer);
      box.classList.remove('tpv-pending');
    };
    box.addEventListener('touchend',    cancelLongPress);
    box.addEventListener('touchmove',   cancelLongPress);
    box.addEventListener('touchcancel', cancelLongPress);

    // If the long-press just fired, swallow the trailing click so it
    // doesn't also select the template
    box.addEventListener('click', (e) => {
      if (box.dataset.tpvSuppressClick === '1') {
        e.preventDefault();
        e.stopPropagation();
        delete box.dataset.tpvSuppressClick;
      }
    }, true);
  }

  function init() {
    document.querySelectorAll('.template-box').forEach(attachCard);

    // Esc to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closePreview();
    });

    // Re-layout iframe on window resize while modal is open
    window.addEventListener('resize', () => {
      if (isOpen) layoutFrame();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
