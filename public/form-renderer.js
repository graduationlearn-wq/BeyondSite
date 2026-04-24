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
    ctx: { templateId: '', getBusinessName: () => '', getDescription: () => '', getTone: () => 'professional' }
  };

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

  function uploadLabelFor(field, replaced) {
    const base = field.uploadLabel || (field.label ? `Upload ${field.label.toLowerCase()}` : 'Upload image');
    return replaced ? base.replace(/^Upload/i, 'Replace') : base;
  }

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

  function renderSection(section) {
    const card = el('section', { class: 'schema-section', 'data-section': section.id });
    card.appendChild(el('div', { class: 'schema-section-head' }, [
      el('h3', {}, section.title),
      section.aiable ? el('button', {
        type: 'button', class: 'btn-ai',
        onclick: () => runAiForSection(section.id)
      }, '✨ AI') : null
    ].filter(Boolean)));

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
    return card;
  }

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
      // AI often returns repeater arrays — only overwrite keys the response supplied.
      Object.assign(state.data, data);
      render(state.schema, state.mount);
    } catch (e) {
      alert('AI error: ' + e.message);
    } finally {
      const b2 = state.mount?.querySelector(`[data-section="${sectionId}"] .btn-ai`);
      if (b2) { b2.disabled = false; b2.textContent = '✨ AI'; }
    }
  }

  function render(schema, mount) {
    state.schema = schema;
    state.mount = mount;
    mount.innerHTML = '';
    (schema.sections || []).forEach(s => mount.appendChild(renderSection(s)));
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

  // Keep only values whose ids exist in the new schema. Repeaters keep items,
  // but each item is filtered to only the sub-ids the new schema defines.
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

  window.FormRenderer = { render, collect, setData, replaceData, mergeForSchema, setContext };
})();
