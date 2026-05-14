// ─────────────────────────────────────────────────────────────────
// chatbot.js — Floating help-bot for WebSite Builder
//   • Scope-locked help assistant (server enforces topic restrictions)
//   • Form context aware: passes current template, section, business name, description
//   • Session memory only — conversation clears on page refresh
//   • Routed through /api/chat (Groq backend on the server)
// ─────────────────────────────────────────────────────────────────
(function () {
  const STATE = {
    open: false,
    sending: false,
    history: [],   // [{role, content}]
    welcomeShown: false
  };

  // ── LOCAL INTENT MATCHERS ───────────────────────────────────────
  // These patterns are answered locally without hitting the AI API,
  // saving credits on common social messages. Any message that doesn't
  // match falls through to /api/chat. Replies are still added to history
  // so the AI has full context if a real question follows.
  const LOCAL_INTENTS = [
    {
      name: 'greeting',
      test: /^\s*(hi+|hello+|hey+|hola|namaste|namaskar|sup|yo|howdy|hiya|greetings|good\s*(morning|afternoon|evening|day|night))[!.\s]*$/i,
      reply: () => {
        const h = new Date().getHours();
        const greet = h < 5 ? 'Hi' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Hello';
        return `${greet}! 👋 I'm the help assistant for **WebSite Builder**. Pick a template above and if anything in the form needs explaining, just ask. What can I help you with?`;
      }
    },
    {
      name: 'thanks',
      test: /^\s*(thanks?|thank\s*you|thx+|ty+|tysm|thank\s*u|appreciate\s*it|much\s*appreciated|cheers)[!.\s]*$/i,
      reply: () => `You're welcome! Anything else about the builder I can help with?`
    },
    {
      name: 'bye',
      test: /^\s*(bye+|goodbye|see\s*ya|cya|later|ttyl|gtg|bbye|good\s*night|signing\s*off)[!.\s]*$/i,
      reply: () => `Take care! 👋 Come back anytime if you get stuck on a section.`
    },
    {
      name: 'identity',
      test: /^\s*(who\s*(are|r|is)\s*(you|u)|what\s*(are|r)\s*(you|u)|what'?s?\s*your\s*name|are\s*you\s*(a\s*)?(bot|human|ai|real|robot|gpt|chatgpt|gemini|llama|groq))[?!.\s]*$/i,
      reply: () => `I'm the help assistant for **WebSite Builder** — built specifically to help you pick a template and fill out the form. I can answer about the templates, the fields, the ✨ AI button, and the preview/payment/download flow. For anything else, please use a general assistant like ChatGPT or Gemini.`
    },
    {
      name: 'capabilities',
      test: /^\s*(help|what\s*can\s*(you|u)\s*(do|help\s*(with|me))?|how\s*do\s*(you|u)\s*work|what\s*do\s*you\s*do|menu|options)[?!.\s]*$/i,
      reply: () => `I can help with a few specific things:\n\n• **Templates** — picking the right one for your business\n• **Form fields** — what each one means and what good answers look like\n• **The ✨ AI button** — how to write a description so the AI gives better suggestions\n• **Payment & download** — getting your finished website\n• **Compliance** — for BFSI, Insurance, and NBFC templates\n\nAsk me anything specific!`
    },
    {
      name: 'how_are_you',
      test: /^\s*(how\s*(are|r)\s*(you|u)|hru|how'?s?\s*it\s*going|how\s*do\s*you\s*do|what'?s?\s*up|whats?\s*up|sup|what'?s?\s*new|are\s*you\s*there|you\s*there)[?!.\s]*$/i,
      reply: () => `I'm great, thanks for asking! I'm here whenever you need help with WebSite Builder. What are you working on today?`
    },
    {
      name: 'pleasantry',
      test: /^\s*(ok+|okay|kay|k|cool|nice|alright|fine|got\s*it|got\s*that|sure|sounds\s*good|good|great|awesome|sweet|gotcha|right|true|lol+|lmao+|haha+|hehe+|yeah+|yes+|yep+|yup+|nope|nah|no+|hmm+|oh+)[!.\s]*$/i,
      reply: () => `👍 Anything else about the builder I can help with?`
    },
    {
      name: 'compliments',
      test: /^\s*(you\s*(are|r)\s*(a\s*)?(good|great|nice|cool|amazing|awesome|helpful|smart)|nice\s*(bot|chatbot|work)|love\s*(you|this|it)|i\s*love\s*(you|this|it))[!.\s]*$/i,
      reply: () => `Thank you, that's kind of you! 😊 Let me know if there's anything I can help with on the builder.`
    },
    {
      name: 'tiny',
      // 0-3 chars or just symbols/single letters that aren't real questions
      test: /^[\s\W_]{0,3}$|^[a-z]{1,2}$/i,
      reply: () => `Could you tell me what you'd like help with? I'm here for questions about templates, form fields, payments, or the AI button.`
    }
  ];

  function matchLocalIntent(text) {
    const t = String(text || '').trim();
    if (!t) return null;
    for (const intent of LOCAL_INTENTS) {
      if (intent.test.test(t)) return intent;
    }
    return null;
  }

  // ── Build context payload from page state ──────────────────────
  function gatherContext() {
    const ctx = {};
    try {
      // Template radio
      const tpl = document.querySelector('input[name="template"]:checked');
      if (tpl) ctx.templateId = tpl.value;

      // Active section (form-renderer tracks this via IntersectionObserver)
      if (window.FormRenderer && typeof window.FormRenderer.getActiveSection === 'function') {
        const sec = window.FormRenderer.getActiveSection();
        if (sec) ctx.sectionId = sec;
      }

      // Business name + description (top form fields)
      const bn = document.getElementById('businessName');
      if (bn && bn.value) ctx.businessName = bn.value.trim();
      const desc = document.getElementById('businessDescription') || document.getElementById('_description');
      if (desc && desc.value) ctx.description = desc.value.trim();
    } catch (_) { /* never block chat on context errors */ }
    return ctx;
  }

  // ── DOM helpers ─────────────────────────────────────────────────
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

  // ── Build the widget ───────────────────────────────────────────
  let bubble, panel, msgList, inputEl, sendBtn;

  function buildWidget() {
    bubble = el('button', {
      class: 'cb-bubble',
      'aria-label': 'Open help chat',
      type: 'button',
      onclick: togglePanel
    }, [
      el('span', { class: 'cb-bubble-icon' }, '💬'),
      el('span', { class: 'cb-bubble-pulse' })
    ]);

    msgList = el('div', { class: 'cb-messages', id: 'cbMessages' });

    inputEl = el('textarea', {
      class: 'cb-input',
      placeholder: 'Ask about templates, fields, payments…',
      rows: '1',
      maxlength: '1000'
    });
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    inputEl.addEventListener('input', autoGrow);

    sendBtn = el('button', { class: 'cb-send', type: 'button', 'aria-label': 'Send', onclick: send }, '↑');

    const closeBtn = el('button', {
      class: 'cb-close',
      type: 'button',
      'aria-label': 'Close chat',
      onclick: togglePanel
    }, '×');

    panel = el('div', { class: 'cb-panel', 'aria-hidden': 'true' }, [
      el('div', { class: 'cb-header' }, [
        el('div', { class: 'cb-header-meta' }, [
          el('div', { class: 'cb-avatar' }, '✦'),
          el('div', {}, [
            el('div', { class: 'cb-title' }, 'Builder Helper'),
            el('div', { class: 'cb-status' }, [el('span', { class: 'cb-dot' }), 'Online · Help only'])
          ])
        ]),
        closeBtn
      ]),
      msgList,
      el('div', { class: 'cb-footer' }, [
        el('div', { class: 'cb-input-wrap' }, [inputEl, sendBtn]),
        el('div', { class: 'cb-disclaimer' }, 'Help bot — answers only about WebSite Builder.')
      ])
    ]);

    document.body.appendChild(bubble);
    document.body.appendChild(panel);
  }

  function autoGrow() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  }

  // ── Open / close ────────────────────────────────────────────────
  function togglePanel() {
    STATE.open = !STATE.open;
    panel.classList.toggle('open', STATE.open);
    panel.setAttribute('aria-hidden', STATE.open ? 'false' : 'true');
    bubble.classList.toggle('open', STATE.open);
    if (STATE.open) {
      if (!STATE.welcomeShown) {
        addBotMessage(welcomeMessage(), { silent: true });
        STATE.welcomeShown = true;
      }
      setTimeout(() => inputEl && inputEl.focus(), 220);
    }
  }

  function welcomeMessage() {
    const loginState = checkLogin();
    if (!loginState) {
      return `🔒 Please log in to use the chatbot. Go to the top right to log in. Once logged in, I can help you with WebSite Builder — ask about templates, fields, the ✨ AI button, or the preview/payment flow.`;
    }
    const ctx = gatherContext();
    if (ctx.templateId) {
      return `Hi! I'm here to help you with WebSite Builder. I can see you're on the **${humanTemplateName(ctx.templateId)}** template — feel free to ask about any field, what good copy looks like, or how the ✨ AI button works.`;
    }
    return `Hi! I'm here to help with WebSite Builder. Ask me about picking a template, what a field means, how the ✨ AI button works, or the preview / payment / download flow.`;
  }

  function humanTemplateName(id) {
    return ({
      'template-1': 'Editorial', 'template-2': 'Agency', 'template-3': 'Terminal / Dev Studio',
      'template-4': 'Web3 / Protocol', 'template-5': 'Local Service', 'template-6': 'BFSI / Banking',
      'template-7': 'Startup / SaaS', 'template-8': 'Insurance Advisor', 'template-9': 'NBFC / Lender'
    })[id] || id;
  }

  // ── Render messages ─────────────────────────────────────────────
  function renderMessage(role, content, opts = {}) {
    const isUser = role === 'user';
    const bubbleEl = el('div', { class: 'cb-msg ' + (isUser ? 'cb-msg-user' : 'cb-msg-bot') }, [
      el('div', { class: 'cb-msg-bubble' }, formatContent(content))
    ]);
    if (opts.id) bubbleEl.dataset.id = opts.id;
    msgList.appendChild(bubbleEl);
    msgList.scrollTop = msgList.scrollHeight;
    return bubbleEl;
  }

  function formatContent(text) {
    // Light markdown: **bold**, _italic_, `code`, line breaks. No HTML injection.
    const safe = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = safe
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    const span = document.createElement('span');
    span.innerHTML = html;
    return span;
  }

  function addBotMessage(text, opts = {}) {
    if (!opts.silent) STATE.history.push({ role: 'assistant', content: text });
    renderMessage('assistant', text, opts);
  }

  function addUserMessage(text) {
    STATE.history.push({ role: 'user', content: text });
    renderMessage('user', text);
  }

  function showTyping() {
    const bubbleEl = el('div', { class: 'cb-msg cb-msg-bot cb-typing' }, [
      el('div', { class: 'cb-msg-bubble' }, [
        el('span', { class: 'cb-typing-dot' }),
        el('span', { class: 'cb-typing-dot' }),
        el('span', { class: 'cb-typing-dot' })
      ])
    ]);
    msgList.appendChild(bubbleEl);
    msgList.scrollTop = msgList.scrollHeight;
    return bubbleEl;
  }

  // ── Check if user is logged in ───────────────────────────────────
  function checkLogin() {
    const stored = localStorage.getItem('beyondsite_login');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ── Send (local-intent fast path → API fallback) ────────────────
  async function send() {
    if (STATE.sending) return;
    const text = (inputEl.value || '').trim();
    if (!text) return;

    // Check login - if not logged in, show hardcoded message
    const loginState = checkLogin();
    if (!loginState) {
      addUserMessage(text);
      inputEl.value = '';
      autoGrow();
      addBotMessage('🔒 Please log in to use the chatbot. Go to the top right to log in.');
      return;
    }

    addUserMessage(text);
    inputEl.value = '';
    autoGrow();
    STATE.sending = true;
    sendBtn.disabled = true;
    inputEl.disabled = true;

    const typing = showTyping();

    // ── FAST PATH: local intent matched, no API call ──
    const intent = matchLocalIntent(text);
    if (intent) {
      // Tiny natural-feeling delay so it doesn't feel mechanical
      await new Promise(r => setTimeout(r, 350 + Math.random() * 250));
      typing.remove();
      addBotMessage(intent.reply());
      STATE.sending = false;
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
      return;
    }

    // ── SLOW PATH: send to backend (Groq) ──
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: STATE.history.slice(-10),
          context: gatherContext()
        })
      });
      const data = await resp.json();
      typing.remove();
      if (!resp.ok) {
        addBotMessage(data.error || 'Something went wrong on my end. Please try again in a moment.');
      } else {
        addBotMessage(data.reply || 'I did not catch that. Could you rephrase?');
      }
    } catch (err) {
      typing.remove();
      addBotMessage('Connection issue — could not reach the server. Please check your network and try again.');
    } finally {
      STATE.sending = false;
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  }

  // ── Boot ────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
