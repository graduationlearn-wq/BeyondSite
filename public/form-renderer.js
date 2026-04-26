// Builds a form dynamically from a template schema.
// Public API:
//   FormRenderer.render(schema, mountEl)        — render fresh
//   FormRenderer.collect()                       — get current values
//   FormRenderer.setData(obj, {silent: false})   — merge values (re-renders by default)
//   FormRenderer.replaceData(obj)                — wipe and set
//   FormRenderer.mergeForSchema(oldData, schema) — keep only values whose ids exist in schema
//   FormRenderer.setContext({templateId, getBusinessName, getDescription, getTone})
//                                                — wire up context for AI calls

(function () {
  const state = {
    schema: null,
    mount: null,
    data: {},
    ctx: { templateId: '', getBusinessName: () => '', getDescription: () => '', getTone: () => 'professional' },
    observer: null,
    activeSection: null,
    mockupEl: null
  };

  // ── Small DOM helper ────────────────────────────────────────────
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function svg(markup) {
    const div = document.createElement('div');
    div.innerHTML = markup.trim();
    return div.firstChild;
  }

  function uploadLabelFor(field, replaced) {
    const base = field.uploadLabel || (field.label ? `Upload ${field.label.toLowerCase()}` : 'Upload image');
    return replaced ? base.replace(/^Upload/i, 'Replace') : base;
  }

  // ── Field inputs ────────────────────────────────────────────────
  function fieldInput(field, value, onChange) {
    const common = { id: `f-${field.id}`, name: field.id, placeholder: field.placeholder || '', maxlength: field.max };
    let input;
    if (field.type === 'textarea') {
      input = el('textarea', { ...common, rows: field.rows || 3 });
      input.value = value || '';
    } else if (field.type === 'select') {
      input = el('select', common, (field.options || []).map(o => {
        const opt = el('option', { value: o }, o);
        if ((value || field.default) === o) opt.selected = true;
        return opt;
      }));
    } else if (field.type === 'color') {
      input = el('input', { ...common, type: 'color', value: value || field.default || '#000000' });
    } else if (field.type === 'image') {
      return imageField(field, value, onChange);
    } else {
      input = el('input', { ...common, type: 'text', value: value || '' });
    }
    input.addEventListener('input', () => onChange(input.value));
    input.addEventListener('change', () => onChange(input.value));
    return input;
  }

  function imageField(field, value, onChange) {
    const wrap = el('div', { class: 'image-field' });
    const preview = el('div', { class: 'image-preview' });
    if (value) preview.appendChild(el('img', { src: value }));

    const inputId = `f-${field.id}-input-${Math.random().toString(36).slice(2, 7)}`;
    const labelText = el('span', {}, uploadLabelFor(field, !!value));
    const label = el('label', { for: inputId, class: 'file-upload-btn' }, [
      el('span', { class: 'file-upload-icon' }, '⬆'),
      labelText
    ]);
    const input = el('input', { type: 'file', id: inputId, accept: field.accept || 'image/*', hidden: true });
    const status = el('small', { class: 'file-status' }, field.maxSizeMB ? `PNG, JPG, SVG, or WebP · max ${field.maxSizeMB}MB` : '');
    const removeBtn = el('button', {
      type: 'button', class: 'link-remove', style: value ? '' : 'display:none;margin-top:4px',
      onclick: () => {
        preview.innerHTML = '';
        status.textContent = 'Removed';
        removeBtn.style.display = 'none';
        labelText.textContent = uploadLabelFor(field, false);
        onChange(null);
      }
    }, 'Remove');

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      if (field.maxSizeMB && file.size > field.maxSizeMB * 1024 * 1024) {
        status.textContent = `Too large (max ${field.maxSizeMB}MB)`;
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      status.textContent = 'Uploading…';
      try {
        const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) { status.textContent = data.error || 'Upload failed'; return; }
        preview.innerHTML = '';
        preview.appendChild(el('img', { src: data.url }));
        status.textContent = '✓ Uploaded';
        labelText.textContent = uploadLabelFor(field, true);
        removeBtn.style.display = '';
        onChange(data.url);
      } catch (e) {
        status.textContent = 'Upload failed: ' + e.message;
      }
    });

    wrap.append(preview, label, input, status, removeBtn);
    return wrap;
  }

  // ── Repeater ────────────────────────────────────────────────────
  function renderRepeater(field, list, onChange) {
    const wrap = el('div', { class: 'repeater' });
    const items = Array.isArray(list) ? [...list] : [];
    while (items.length < (field.min || 0)) items.push({});

    function rerender() {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const row = el('div', { class: 'repeater-item' });
        row.appendChild(el('div', { class: 'repeater-head' }, [
          el('strong', {}, `${field.itemLabel || 'Item'} ${idx + 1}`),
          items.length > (field.min || 0) ? el('button', {
            type: 'button', class: 'link-remove',
            onclick: () => { items.splice(idx, 1); onChange([...items]); rerender(); }
          }, 'Remove') : null
        ].filter(Boolean)));
        field.item.forEach(sub => {
          const group = el('div', { class: 'form-group' });
          if (sub.label) group.appendChild(el('label', { for: `f-${field.id}-${idx}-${sub.id}` }, sub.label));
          let inp;
          if (sub.type === 'repeater') {
            inp = renderRepeater(sub, item[sub.id], v => { items[idx][sub.id] = v; onChange([...items]); });
          } else {
            inp = fieldInput(sub, item[sub.id], v => { items[idx][sub.id] = v; onChange([...items]); });
          }
          if (inp.nodeName === 'INPUT' || inp.nodeName === 'TEXTAREA' || inp.nodeName === 'SELECT') {
            inp.id = `f-${field.id}-${idx}-${sub.id}`;
          }
          group.appendChild(inp);
          row.appendChild(group);
        });
        wrap.appendChild(row);
      });
      if (items.length < (field.max || 99)) {
        wrap.appendChild(el('button', {
          type: 'button', class: 'btn-add',
          onclick: () => { items.push({}); onChange([...items]); rerender(); }
        }, `+ Add ${field.itemLabel || 'Item'}`));
      }
    }
    rerender();
    return wrap;
  }

  // ── Arrow SVGs (clean curved, different angle per side) ─────────
  const ARROW_RIGHT = `<svg class="hint-arrow" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4 44 C 40 44, 60 30, 110 22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M110 22 L 100 18 M 110 22 L 102 30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;

  const ARROW_LEFT = `<svg class="hint-arrow" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M116 44 C 80 44, 60 30, 10 22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M10 22 L 20 18 M 10 22 L 18 30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;

  const INFO_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`;

  // ── Section rendering ───────────────────────────────────────────
  function renderSection(section) {
    const hint = section.hint || {};
    const row = el('div', { class: 'schema-section-row', 'data-section-row': section.id });

    // LEFT gutter — short label + arrow pointing right into form
    const leftGutter = el('div', { class: 'hint-gutter hint-left' }, hint.label ? [
      el('div', { class: 'hint-label-text' }, hint.label),
      svg(ARROW_RIGHT)
    ] : []);

    // CENTER — the actual form card
    const card = el('section', { class: 'schema-section', 'data-section': section.id });
    const head = el('div', { class: 'schema-section-head' }, [
      el('h3', {}, section.title),
      hint.label ? el('button', {
        type: 'button', class: 'hint-info-toggle', 'aria-label': 'Show section help',
        onclick: (e) => {
          const btn = e.currentTarget;
          const panel = btn.closest('.schema-section').querySelector('.hint-inline');
          if (panel) panel.classList.toggle('open');
        }
      }, svg(INFO_ICON)) : null,
      section.aiable ? el('button', {
        type: 'button', class: 'btn-ai',
        onclick: () => runAiForSection(section.id)
      }, '✨ AI') : null
    ].filter(Boolean));
    card.appendChild(head);

    // Mobile-only inline hint panel (hidden by default, tap ⓘ to open)
    if (hint.label) {
      card.appendChild(el('div', { class: 'hint-inline' }, [
        el('strong', {}, hint.label),
        el('p', {}, hint.description || '')
      ]));
    }

    section.fields.forEach(f => {
      const group = el('div', { class: 'form-group' });
      if (f.label && f.type !== 'repeater') group.appendChild(el('label', { for: `f-${f.id}` }, f.label));
      else if (f.label && f.type === 'repeater') group.appendChild(el('label', {}, f.label));
      let control;
      if (f.type === 'repeater') {
        control = renderRepeater(f, state.data[f.id], v => state.data[f.id] = v);
      } else {
        control = fieldInput(f, state.data[f.id], v => state.data[f.id] = v);
      }
      group.appendChild(control);
      card.appendChild(group);
    });

    // RIGHT gutter — longer description + arrow pointing left
    const rightGutter = el('div', { class: 'hint-gutter hint-right' }, hint.description ? [
      svg(ARROW_LEFT),
      el('div', { class: 'hint-description-text' }, hint.description)
    ] : []);

    row.append(leftGutter, card, rightGutter);
    return row;
  }

  // ── Mockup (floating fixed minimap) ─────────────────────────────
  function mockupTargetFor(section) {
    if (section.hint && section.hint.mockupTarget) return section.hint.mockupTarget;
    if (section.id === 'brand') return 'header';
    if (section.id === 'contact') return 'footer';
    if (section.id === 'theme') return 'page';
    if (section.id === 'hero') return 'hero-block';
    return section.id; // body block
  }

  function buildMockup(schema) {
    // Preserve expanded/collapsed state across re-renders
    const previouslyExpanded = state.mockupEl && !state.mockupEl.classList.contains('collapsed');
    document.querySelectorAll('.section-mockup').forEach(n => n.remove());

    const wrap = el('aside', {
      class: previouslyExpanded ? 'section-mockup' : 'section-mockup collapsed',
      'aria-label': 'Site section map'
    });
    const toggle = el('button', {
      type: 'button', class: 'mockup-toggle',
      onclick: () => wrap.classList.toggle('collapsed')
    });
    toggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
      <span>Site map</span>`;
    wrap.appendChild(toggle);

    const panel = el('div', { class: 'mockup-panel' });
    panel.appendChild(el('div', { class: 'mockup-title' }, 'How your site will look'));

    // Build the wireframe
    const wireframe = el('div', { class: 'mockup-wireframe', 'data-mockup-page': '' });

    // Header block
    wireframe.appendChild(el('div', { class: 'mockup-block mockup-header', 'data-mockup-target': 'header' }, [
      el('div', { class: 'mockup-logo' }),
      el('div', { class: 'mockup-nav' })
    ]));

    // Body blocks — one per section (excluding brand, contact, theme which map to header/footer/page)
    const bodyBlocks = (schema.sections || []).filter(s => {
      const t = mockupTargetFor(s);
      return t !== 'header' && t !== 'footer' && t !== 'page';
    });

    bodyBlocks.forEach((s, i) => {
      const target = mockupTargetFor(s);
      const classes = ['mockup-block', 'mockup-body-block'];
      if (target === 'hero-block') classes.push('mockup-hero');
      wireframe.appendChild(el('div', {
        class: classes.join(' '),
        'data-mockup-target': target
      }, [
        el('span', { class: 'mockup-block-label' }, s.title)
      ]));
    });

    // Footer block
    wireframe.appendChild(el('div', { class: 'mockup-block mockup-footer', 'data-mockup-target': 'footer' }, [
      el('span', { class: 'mockup-block-label' }, 'Contact')
    ]));

    panel.appendChild(wireframe);
    panel.appendChild(el('div', { class: 'mockup-hint' }, 'Scroll the form — the matching part of your site will glow here.'));

    wrap.appendChild(panel);
    document.body.appendChild(wrap);
    state.mockupEl = wrap;
  }

  function highlightMockup(sectionId) {
    if (!state.mockupEl) return;
    const section = (state.schema?.sections || []).find(s => s.id === sectionId);
    if (!section) return;
    const target = mockupTargetFor(section);
    const wf = state.mockupEl.querySelector('.mockup-wireframe');
    if (!wf) return;
    wf.classList.toggle('page-glow', target === 'page');
    wf.querySelectorAll('[data-mockup-target]').forEach(n => {
      n.classList.toggle('active', target !== 'page' && n.getAttribute('data-mockup-target') === target);
    });
  }

  // ── IntersectionObserver: highlight active section in mockup ────
  function setupObserver(mount) {
    if (state.observer) state.observer.disconnect();
    const rows = mount.querySelectorAll('.schema-section-row');
    if (!rows.length) return;

    let latestEntries = new Map();
    state.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => latestEntries.set(e.target, e));
      // Pick the most-visible section (highest intersectionRatio, closest to center)
      let best = null;
      latestEntries.forEach(e => {
        if (!e.isIntersecting) return;
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      });
      if (best) {
        const id = best.target.getAttribute('data-section-row');
        if (id && id !== state.activeSection) {
          state.activeSection = id;
          highlightMockup(id);
        }
      }
    }, {
      root: null,
      rootMargin: '-30% 0px -45% 0px',  // treat middle-ish of viewport as active
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });
    rows.forEach(r => state.observer.observe(r));
  }

  // ── AI ──────────────────────────────────────────────────────────
  async function runAiForSection(sectionId) {
    const btn = state.mount.querySelector(`[data-section="${sectionId}"] .btn-ai`);
    if (btn) { btn.disabled = true; btn.textContent = '✨ Thinking…'; }
    try {
      const body = {
        templateId: state.ctx.templateId || state.schema?.id || '',
        sectionId,
        businessName: state.ctx.getBusinessName() || state.data.businessName || '',
        description: state.ctx.getDescription() || state.data._description || '',
        tone: state.ctx.getTone() || state.data.tone || 'professional'
      };
      const res = await fetch('/api/ai-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI failed');
      Object.assign(state.data, data);
      render(state.schema, state.mount);
    } catch (e) {
      alert('AI error: ' + e.message);
    } finally {
      const b2 = state.mount?.querySelector(`[data-section="${sectionId}"] .btn-ai`);
      if (b2) { b2.disabled = false; b2.textContent = '✨ AI'; }
    }
  }

  // ── Render ──────────────────────────────────────────────────────
  function renderComplianceBanner(cr) {
    return el('div', { class: 'compliance-banner', role: 'note' }, [
      el('div', { class: 'cb-icon' }, '⚠'),
      el('div', { class: 'cb-text' }, [
        el('div', { class: 'cb-title' }, cr.title || 'Regulatory content — review before publishing.'),
        el('div', { class: 'cb-body'  }, cr.body  || '')
      ])
    ]);
  }

  function render(schema, mount) {
    state.schema = schema;
    state.mount = mount;
    mount.innerHTML = '';
    mount.classList.add('schema-form-grid');
    if (schema && schema.complianceReview) {
      mount.appendChild(renderComplianceBanner(schema.complianceReview));
    }
    (schema.sections || []).forEach(s => mount.appendChild(renderSection(s)));
    buildMockup(schema);
    // Defer observer setup so browser can finish layout first
    requestAnimationFrame(() => setupObserver(mount));
  }

  function collect() { return JSON.parse(JSON.stringify(state.data)); }

  function setData(obj, { silent = false } = {}) {
    state.data = { ...state.data, ...(obj || {}) };
    if (!silent && state.schema && state.mount) render(state.schema, state.mount);
  }

  function replaceData(obj) {
    state.data = { ...(obj || {}) };
  }

  function setContext(ctx = {}) {
    state.ctx = { ...state.ctx, ...ctx };
  }

  function mergeForSchema(oldData, schema) {
    const merged = {};
    (schema.sections || []).forEach(sec => {
      (sec.fields || []).forEach(f => {
        if (f.type === 'repeater') {
          const list = Array.isArray(oldData[f.id]) ? oldData[f.id] : [];
          const subIds = (f.item || []).map(s => s.id);
          merged[f.id] = list.map(item => {
            const clean = {};
            subIds.forEach(k => { if (item && item[k] !== undefined) clean[k] = item[k]; });
            return clean;
          });
        } else if (oldData[f.id] !== undefined) {
          merged[f.id] = oldData[f.id];
        }
      });
    });
    ['_description','businessName','tagline'].forEach(k => {
      if (oldData[k] !== undefined) merged[k] = oldData[k];
    });
    return merged;
  }

  function getActiveSection() { return state.activeSection || null; }

  window.FormRenderer = { render, collect, setData, replaceData, mergeForSchema, setContext, getActiveSection };
})();
