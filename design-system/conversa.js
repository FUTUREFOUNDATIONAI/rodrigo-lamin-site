/* Cultivo.conversa — primeira conversa em formato de chat, em formato de chat.
   Uma pergunta por vez, respostas em botões, identificação no fim e saída para o WhatsApp com as respostas no texto.
   Nada é armazenado: as respostas vivem só na memória da página até a pessoa clicar em "Continuar no WhatsApp".

   Uso:
     <div data-conversa></div>                       conversa dentro do bloco
     <button data-conversa-open>Conversar</button>   abre em modal (cria um único modal na página)
     Cultivo.conversa.open() / .mount(el)            via script
   Opções (atributos no elemento ou objeto em mount): data-whatsapp, data-avatar. */
(function () {
  'use strict';
  var W = window.Cultivo = window.Cultivo || {};

  var WHATSAPP = '5548991469196'; // número dos links wa.me de rodrigolamin.com.br (16/10/2026)
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TYPING = REDUCED ? 0 : 650;

  var STEPS = [
    { key: 'momento', bot: ['Oi, aqui é o **Rodrigo Lamin**.', 'Antes de conversarmos, me conta: em que momento está o seu negócio?'],
      options: ['Começando', 'Crescendo e sobrecarregado', 'Estável, buscando o próximo ciclo', 'Em transição'] },
    { key: 'atencao', bot: ['Obrigado por contar.', 'O que mais pede a sua atenção agora?'],
      options: ['Direção: tudo parece urgente', 'Recursos: faço cada vez mais', 'Relações: quero crescer com os bons clientes', 'Outro'],
      other: 'Outro', otherPrompt: 'Me conta com as suas palavras:' },
    { key: 'busca', bot: ['Entendi. E o que você busca neste momento?'],
      options: ['Mentoria', 'ALTITUDE', 'Comunidade', 'Ainda não sei'] },
    { key: 'pessoa', bot: ['Pra eu já chegar preparado: como você se chama e qual é a sua empresa?'], form: true }
  ];

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function rich(node, text) { // **negrito** sem HTML vindo de fora
    text.split('**').forEach(function (part, i) { node.appendChild(i % 2 ? el('strong', null, part) : document.createTextNode(part)); });
    return node;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function seed() {
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 22 22'); s.setAttribute('class', 'cv-seed'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<path d="M11 19 C11 14 11 11 11 8 M11 12 C8 11 6.5 9 6 6.5 C8.5 7 10.5 8.5 11 11 M11 10 C13.5 9 15 7.5 16 5 C13.5 5.2 11.6 6.6 11 9"/><circle cx="11" cy="19" r="2.2"/>';
    return s;
  }

  function build(opts) {
    opts = opts || {};
    var number = opts.whatsapp || WHATSAPP;
    var root = el('div', 'cv'); root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Primeira conversa com Rodrigo Lamin');

    var head = el('div', 'cv-head');
    if (opts.avatar) { var img = el('img', 'cv-avatar'); img.src = opts.avatar; img.alt = ''; head.appendChild(img); }
    var who = el('div', 'cv-who'); who.appendChild(el('b', null, 'Rodrigo Lamin')); who.appendChild(el('span', null, 'Primeira conversa · sem compromisso'));
    head.appendChild(who);
    if (opts.onClose) { var x = el('button', 'cv-close', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Fechar conversa'); x.onclick = opts.onClose; head.appendChild(x); }

    var log = el('div', 'cv-log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-relevant', 'additions');
    var input = el('div', 'cv-input');
    var foot = el('div', 'cv-foot');
    foot.appendChild(el('span', null, 'Suas respostas não ficam salvas nesta página.'));
    root.appendChild(head); root.appendChild(log); root.appendChild(input); root.appendChild(foot);

    var answers = {};

    function scroll() { log.scrollTop = log.scrollHeight; }
    function say(text, who) { var m = rich(el('div', 'cv-msg ' + who), text); log.appendChild(m); scroll(); return m; }
    async function bot(lines) {
      for (var i = 0; i < lines.length; i++) {
        if (TYPING) { var t = el('div', 'cv-typing'); t.setAttribute('aria-hidden', 'true'); t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); scroll(); await wait(TYPING); t.remove(); }
        say(lines[i], 'bot');
      }
    }
    function reply(text) { say(text, 'me'); log.appendChild(seed()); scroll(); }
    function clear() { input.innerHTML = ''; }
    function focusFirst() { var f = input.querySelector('button,input'); if (f) f.focus({ preventScroll: true }); }

    function textField(label, onSubmit, placeholder) {
      clear();
      var f = el('form', 'cv-form'); var id = 'cv-' + Math.random().toString(36).slice(2, 8);
      var lab = el('label', null, label); lab.htmlFor = id;
      var row = el('div', 'cv-row'); var t = el('input', 'cv-text'); t.id = id; t.type = 'text'; t.placeholder = placeholder || ''; t.autocomplete = 'off';
      var b = el('button', 'cv-send', 'Enviar'); b.type = 'submit'; b.disabled = true;
      t.oninput = function () { b.disabled = !t.value.trim(); };
      f.onsubmit = function (e) { e.preventDefault(); var v = t.value.trim(); if (v) onSubmit(v); };
      row.appendChild(t); row.appendChild(b); f.appendChild(lab); f.appendChild(row); input.appendChild(f); t.focus({ preventScroll: true }); requestAnimationFrame(scroll);
    }

    function personForm(onSubmit) {
      clear();
      var f = el('form', 'cv-form');
      function field(label, name, ac) {
        var id = 'cv-' + name + '-' + Math.random().toString(36).slice(2, 6);
        var lab = el('label', null, label); lab.htmlFor = id;
        var t = el('input', 'cv-text'); t.id = id; t.name = name; t.type = 'text'; t.autocomplete = ac;
        f.appendChild(lab); f.appendChild(t); return t;
      }
      var n = field('Seu nome', 'nome', 'name'), c = field('Sua empresa', 'empresa', 'organization');
      var b = el('button', 'cv-send', 'Enviar'); b.type = 'submit'; b.disabled = true; b.style.alignSelf = 'flex-start'; b.style.marginTop = '6px';
      n.oninput = function () { b.disabled = !n.value.trim(); };
      f.onsubmit = function (e) { e.preventDefault(); if (n.value.trim()) onSubmit(n.value.trim(), c.value.trim()); };
      f.appendChild(b); input.appendChild(f); n.focus({ preventScroll: true }); requestAnimationFrame(scroll);
    }

    function options(step, resolve) {
      clear();
      var g = el('div', null); g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Opções de resposta'); g.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
      step.options.forEach(function (o) {
        var b = el('button', 'cv-opt', o); b.type = 'button';
        b.onclick = function () { resolve(o); };
        g.appendChild(b);
      });
      input.appendChild(g); focusFirst(); requestAnimationFrame(scroll);
    }

    function waLink() {
      var first = (answers.nome || '').split(/\s+/)[0];
      var lines = ['Oi, Rodrigo! Aqui é ' + (answers.nome || '') + (answers.empresa ? ', da ' + answers.empresa : '') + '.',
        'Momento do negócio: ' + answers.momento + '.',
        'O que mais pede atenção: ' + answers.atencao + '.',
        'O que busco: ' + answers.busca + '.',
        'Vim pela conversa do seu site.'];
      return { url: 'https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n')), first: first };
    }

    async function finish() {
      clear();
      var w = waLink();
      await bot(['Obrigado, **' + w.first + '**. Já tenho o essencial pra nossa primeira conversa.',
        'Ela é sem compromisso de contratação. Te espero no WhatsApp.']);
      var a = el('a', 'cv-wa'); a.href = w.url; a.target = '_blank'; a.rel = 'noopener';
      a.appendChild(document.createTextNode('Continuar no WhatsApp')); a.appendChild(el('span', null, '↗')).setAttribute('aria-hidden', 'true');
      var r = el('button', 'cv-restart', 'Recomeçar'); r.type = 'button'; r.onclick = start;
      input.appendChild(a); input.appendChild(r); a.focus({ preventScroll: true }); requestAnimationFrame(scroll);
    }

    async function run(i) {
      if (i >= STEPS.length) return finish();
      var step = STEPS[i];
      clear(); await bot(step.bot);
      if (step.form) {
        personForm(function (nome, empresa) { answers.nome = nome; answers.empresa = empresa; reply(nome + (empresa ? ' · ' + empresa : '')); run(i + 1); });
        return;
      }
      options(step, async function (o) {
        if (step.other && o === step.other) {
          reply(o); clear(); await bot([step.otherPrompt]);
          textField('Sua resposta', function (v) { answers[step.key] = v; reply(v); run(i + 1); }, 'Ex.: preciso organizar o comercial');
          return;
        }
        answers[step.key] = o.split(':')[0]; reply(o); run(i + 1);
      });
    }

    function start() { answers = {}; log.innerHTML = ''; run(0); }
    root.start = start;
    start();
    return root;
  }

  function mount(target, opts) {
    var o = opts || {};
    if (target.dataset.whatsapp) o.whatsapp = target.dataset.whatsapp;
    if (target.dataset.avatar) o.avatar = target.dataset.avatar;
    var c = build(o); target.innerHTML = ''; target.appendChild(c); return c;
  }

  var modal, lastFocus;
  function open(opts) {
    lastFocus = document.activeElement;
    if (!modal) {
      modal = el('div', 'cv-modal'); modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Primeira conversa com Rodrigo Lamin');
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      document.addEventListener('keydown', function (e) {
        if (!modal || modal.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'Tab') { // mantém o foco dentro do modal
          var f = modal.querySelectorAll('button,a[href],input'); if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
      document.body.appendChild(modal);
    }
    var o = Object.assign({}, opts || {}, { onClose: close });
    var th = o.theme || (lastFocus && lastFocus.closest && (lastFocus.closest('[data-theme]') || {}).getAttribute && lastFocus.closest('[data-theme]').getAttribute('data-theme'));
    if (th) modal.setAttribute('data-theme', th); else modal.removeAttribute('data-theme');
    modal.innerHTML = ''; modal.appendChild(build(o)); modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
  }
  function close() {
    if (!modal) return; modal.hidden = true; modal.innerHTML = ''; document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function init() {
    document.querySelectorAll('[data-conversa]').forEach(function (n) { mount(n); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-conversa-open]'); if (!t) return;
      e.preventDefault(); open({ whatsapp: t.dataset.whatsapp, avatar: t.dataset.avatar, theme: t.dataset.theme });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  W.conversa = { mount: mount, open: open, close: close, steps: STEPS };
})();
