/* Rodrigo Lamin · Design System "Cultivo" v1.1 · padrões biomiméticos
   window.Cultivo.{mycelium, heroTree, seedfall, miniTree, growTree, araucaria, rings, mac, forest, cycle, trail, grow, nav, strata, bio, inview, seedrain}
   Cores vêm dos tokens do tema ativo (--filament e --pulse em RGB; --ink e --accent em CSS).
   prefers-reduced-motion: tudo aparece no estado final, parado. */
(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function cssVar(el, name){ return getComputedStyle(el).getPropertyValue(name).trim(); }
  function clamp(v,a,b){ return v < a ? a : v > b ? b : v; }
  function easeGrow(t){ return 1 - Math.pow(1 - t, 3.2); }   // espelha --ease-grow
  function easeIn(t){ return t*t; }
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function el(tag, attrs, parent){ var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function tween(ms, fn, done){
    var t0 = null;
    function f(t){ if (t0 === null) t0 = t; var k = clamp((t - t0)/ms, 0, 1); fn(k); if (k < 1) requestAnimationFrame(f); else if (done) done(); }
    requestAnimationFrame(f);
  }

  /* ---------- crescimento ao entrar na tela ---------- */
  function grow(root){
    var obs = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('is-in'); obs.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.12});
    (root || document).querySelectorAll('.c-grow').forEach(function(x){ obs.observe(x); });
  }

  /* ---------- navegação sólida ao rolar ---------- */
  function nav(n){
    function f(){ n.classList.toggle('is-solid', scrollY > 40); }
    addEventListener('scroll', f, {passive:true}); f();
  }

  /* ---------- rede micorrízica (canvas) ---------- */
  function mycelium(canvas, opts){
    opts = opts || {};
    var ctx = canvas.getContext('2d'), layer = document.createElement('canvas'), lctx = layer.getContext('2d');
    var W, H, DPR, N, tips, pulses, flashes, origin, region = null, dimRect = null, dimMask = null, pointer = null, visible = true, raf = null, last = 0, FIL, PUL;
    var CAP = opts.cap || 5200;
    function add(x,y,p,d){ N.x.push(x); N.y.push(y); N.p.push(p); N.d.push(d); return N.x.length-1; }
    function setup(){
      var r = canvas.getBoundingClientRect();
      DPR = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
      canvas.width = layer.width = Math.round(W*DPR); canvas.height = layer.height = Math.round(H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0); lctx.setTransform(DPR,0,0,DPR,0,0); lctx.clearRect(0,0,W,H);
      FIL = cssVar(canvas, '--filament') || '239,228,207'; PUL = cssVar(canvas, '--pulse') || '240,161,74';
      origin = opts.origin ? opts.origin(r, W, H) : {x:W/2, y:H-8};
      region = opts.region ? opts.region(r, W, H) : null;
      // dim: retângulo (texto) onde a rede fica a ~20% e os pulsos não passam. Máscara suavizada feita uma vez.
      dimRect = opts.dim ? opts.dim(r, W, H) : null; dimMask = null;
      if (dimRect){
        dimMask = document.createElement('canvas'); dimMask.width = canvas.width; dimMask.height = canvas.height;
        var mc = dimMask.getContext('2d'), off = (W + 600) * DPR, fe = dimRect.feather || 48;
        mc.shadowColor = 'rgba(0,0,0,' + (1 - (dimRect.keep || .2)) + ')'; mc.shadowBlur = fe*DPR; mc.shadowOffsetX = off;
        mc.fillStyle = '#000'; mc.fillRect(dimRect.x*DPR - off, dimRect.y*DPR, dimRect.w*DPR, dimRect.h*DPR);
      }
      N = {x:[], y:[], p:[], d:[]}; tips = []; pulses = []; flashes = [];
      add(origin.x, origin.y, -1, 0);
      var seeds = opts.seeds || (W < 900 ? 9 : 13), a0 = opts.spread ? opts.spread[0] : -Math.PI*0.08, a1 = opts.spread ? opts.spread[1] : -Math.PI*1.24;
      for (var i = 0; i < seeds; i++) tips.push({n:0, a: a0 + (a1-a0)*(i/(seeds-1)) + (Math.random()-.5)*.2, life: 160 + Math.random()*180});
    }
    var silent = false;
    function step(){
      var next = [];
      for (var i = 0; i < tips.length; i++){
        var t = tips[i], n = t.n, x = N.x[n], y = N.y[n];
        t.a += (Math.random()-.5)*.42;
        if (pointer && !SC){
          var dx = pointer.x-x, dy = pointer.y-y;
          if (dx*dx + dy*dy < 115600){ var ta = Math.atan2(dy,dx); t.a += Math.atan2(Math.sin(ta-t.a), Math.cos(ta-t.a))*.07; }
        }
        var s = 3.2 + Math.random()*2.2, nx = x + Math.cos(t.a)*s, ny = y + Math.sin(t.a)*s;
        if (nx < -10 || nx > W+10 || ny < -10 || ny > H+4) continue;
        if (region && !region(nx, ny)) continue;
        var d = N.d[n]+1, m = add(nx, ny, n, d);
        if (!silent){
        lctx.strokeStyle = 'rgba(' + FIL + ',' + Math.max(.16, .62 - d*.0012) + ')';
        lctx.lineWidth = Math.max(.35, 2.4 - d*.009); lctx.lineCap = 'round';
        lctx.beginPath(); lctx.moveTo(x,y); lctx.lineTo(nx,ny); lctx.stroke();
        }
        t.n = m; t.life -= 1;
        if (t.life > 0) next.push(t);
        if (Math.random() < .034 && next.length < 240) next.push({n:m, a:t.a + (Math.random()<.5?-1:1)*(.45+Math.random()*.5), life:t.life*.8+40});
      }
      tips = next;
      if (tips.length < 26 && N.x.length < CAP) tips.push({n:(Math.random()*N.x.length)|0, a:Math.random()*6.283, life:60+Math.random()*120});
    }
    function pulseFrom(k){
      var path = [], g = 0;
      while (k >= 0 && g++ < 4000){ path.push(k); k = N.p[k]; }
      if (path.length > 30) pulses.push({path:path, i:0, v:2.6 + Math.random()*1.8});
    }
    function nearest(px,py){
      var b = -1, bd = 1e12, L = N.x.length;
      for (var s = 0; s < 500; s++){ var k = (Math.random()*L)|0, d = (N.x[k]-px)*(N.x[k]-px) + (N.y[k]-py)*(N.y[k]-py); if (d < bd){ bd = d; b = k; } }
      return b;
    }
    function applyDim(){
      if (!dimMask) return;
      ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(dimMask, 0, 0); ctx.restore();
    }
    function inDim(x, y){ var d = dimRect; return d && x > d.x - 24 && x < d.x + d.w + 24 && y > d.y - 24 && y < d.y + d.h + 24; }
    function drawNode(){
      ctx.fillStyle = 'rgba(' + PUL + ',.22)'; ctx.beginPath(); ctx.arc(origin.x, origin.y, 11, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgb(' + PUL + ')'; ctx.beginPath(); ctx.arc(origin.x, origin.y, 5, 0, 6.283); ctx.fill();
    }
    function frame(t){
      if (!visible){ raf = null; return; }
      if (N.x.length < CAP){ var k = N.x.length < 2400 ? 4 : 2; while (k--) step(); }
      ctx.clearRect(0,0,W,H); ctx.drawImage(layer,0,0,W,H); applyDim();
      if (t - last > 520 && N.x.length > 400){ last = t; pulseFrom(Math.min(N.x.length-1, (N.x.length*.5 + Math.random()*N.x.length*.5)|0)); }
      ctx.lineCap = 'round';
      for (var i = pulses.length-1; i >= 0; i--){
        var p = pulses[i]; p.i += p.v;
        var h = Math.min(p.path.length-1, p.i|0), tl = Math.max(0, h-22);
        ctx.beginPath(); ctx.moveTo(N.x[p.path[tl]], N.y[p.path[tl]]);
        for (var j = tl+1; j <= h; j++) ctx.lineTo(N.x[p.path[j]], N.y[p.path[j]]);
        var hx = N.x[p.path[h]], hy = N.y[p.path[h]];
        if (inDim(hx, hy) || inDim(N.x[p.path[tl]], N.y[p.path[tl]])){ if (h >= p.path.length-1){ pulses.splice(i,1); } continue; }
        ctx.strokeStyle = 'rgba(' + PUL + ',.9)'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = 'rgba(' + PUL + ',.25)'; ctx.beginPath(); ctx.arc(hx,hy,6,0,6.283); ctx.fill();
        ctx.fillStyle = 'rgb(' + PUL + ')'; ctx.beginPath(); ctx.arc(hx,hy,2.4,0,6.283); ctx.fill();
        if (h >= p.path.length-1){ pulses.splice(i,1); flashes.push({r:5, a:1}); }
      }
      for (var f = flashes.length-1; f >= 0; f--){
        var fl = flashes[f]; fl.r += 1.4; fl.a -= .022;
        if (fl.a <= 0){ flashes.splice(f,1); continue; }
        ctx.strokeStyle = 'rgba(' + PUL + ',' + fl.a.toFixed(3) + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(origin.x, origin.y, fl.r, 0, 6.283); ctx.stroke();
      }
      drawNode();
      raf = requestAnimationFrame(frame);
    }
    // ---- modo rolagem (opts.scroll): a rede inteira é calculada antes e desenhada até a fração p ----
    var SC = opts.scroll, drawn = 0, prog = 0, target = 0;
    function seg(i){
      var a = N.p[i], d = N.d[i];
      lctx.strokeStyle = 'rgba(' + FIL + ',' + Math.max(.16, .62 - d*.0012) + ')';
      lctx.lineWidth = Math.max(.35, 2.4 - d*.009);
      lctx.beginPath(); lctx.moveTo(N.x[a], N.y[a]); lctx.lineTo(N.x[i], N.y[i]); lctx.stroke();
    }
    function drawTo(n){
      n = Math.max(1, Math.min(N.x.length, n|0));
      if (n < drawn){ lctx.clearRect(0,0,W,H); drawn = 1; }
      lctx.lineCap = 'round';
      for (var i = Math.max(1, drawn); i < n; i++) seg(i);
      drawn = Math.max(drawn, n);
    }
    function readTarget(){
      var k;
      if (SC.progress) k = clamp(SC.progress(), 0, 1);   // progresso fornecido (ex.: hero fixado)
      else { var r = SC.el.getBoundingClientRect(); k = clamp(-r.top / Math.max(1, r.height*.85), 0, 1); }
      return (SC.start || 0) + (1 - (SC.start || 0)) * k;
    }
    function scrollFrame(t){
      if (!visible){ raf = null; return; }
      target = readTarget();
      prog += (target - prog) * .12;
      if (Math.abs(target - prog) < .0008) prog = target;
      drawTo(prog * N.x.length);
      ctx.clearRect(0,0,W,H); ctx.drawImage(layer,0,0,W,H); applyDim();
      var live = prog > .6;
      if (live && t - last > 520){ last = t; pulseFrom(Math.max(1, (drawn*.5 + Math.random()*drawn*.5)|0) - 1); }
      ctx.lineCap = 'round';
      for (var i = pulses.length-1; i >= 0; i--){
        var p = pulses[i]; p.i += p.v;
        var h = Math.min(p.path.length-1, p.i|0), tl = Math.max(0, h-22);
        ctx.beginPath(); ctx.moveTo(N.x[p.path[tl]], N.y[p.path[tl]]);
        for (var j = tl+1; j <= h; j++) ctx.lineTo(N.x[p.path[j]], N.y[p.path[j]]);
        var hx = N.x[p.path[h]], hy = N.y[p.path[h]];
        if (inDim(hx, hy) || inDim(N.x[p.path[tl]], N.y[p.path[tl]])){ if (h >= p.path.length-1){ pulses.splice(i,1); } continue; }
        ctx.strokeStyle = 'rgba(' + PUL + ',.9)'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = 'rgba(' + PUL + ',.25)'; ctx.beginPath(); ctx.arc(hx,hy,6,0,6.283); ctx.fill();
        ctx.fillStyle = 'rgb(' + PUL + ')'; ctx.beginPath(); ctx.arc(hx,hy,2.4,0,6.283); ctx.fill();
        if (h >= p.path.length-1 || !live){ pulses.splice(i,1); if (live) flashes.push({r:5, a:1}); }
      }
      for (var f = flashes.length-1; f >= 0; f--){
        var fl = flashes[f]; fl.r += 1.4; fl.a -= .022;
        if (fl.a <= 0){ flashes.splice(f,1); continue; }
        ctx.strokeStyle = 'rgba(' + PUL + ',' + fl.a.toFixed(3) + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(origin.x, origin.y, fl.r, 0, 6.283); ctx.stroke();
      }
      drawNode();
      raf = requestAnimationFrame(scrollFrame);
    }
    function startScroll(){
      setup();
      if (W < 900) CAP = Math.min(CAP, opts.capMobile || 2400);
      silent = true; var g = 0;
      while (N.x.length < CAP && g++ < 9000){ step(); if (!tips.length) break; }
      silent = false; drawn = 1; lctx.clearRect(0,0,W,H);
      if (reduce){ drawTo(N.x.length); ctx.clearRect(0,0,W,H); ctx.drawImage(layer,0,0,W,H); drawNode(); return; }
      prog = readTarget(); drawTo(prog * N.x.length);
      if (!raf) raf = requestAnimationFrame(scrollFrame);
    }

    function start(){
      if (SC) return startScroll();
      setup();
      if (reduce){ var g = 0; while (N.x.length < CAP*.7 && g++ < 3000) step(); ctx.clearRect(0,0,W,H); ctx.drawImage(layer,0,0,W,H); drawNode(); return; }
      if (!raf) raf = requestAnimationFrame(frame);
    }
    var host = opts.interactive || canvas;
    host.addEventListener('pointermove', function(e){
      var r = canvas.getBoundingClientRect(); pointer = {x:e.clientX-r.left, y:e.clientY-r.top};
      if (SC && prog <= .6) return;
      if (!reduce && Math.random() < .18 && N.x.length > 200){ var k = nearest(pointer.x, pointer.y); if (k > 0 && (!SC || k < drawn)) pulseFrom(k); }
    });
    host.addEventListener('pointerleave', function(){ pointer = null; });
    host.addEventListener('pointerdown', function(e){
      if (reduce || (SC && prog <= .6)) return; var r = canvas.getBoundingClientRect(), k = nearest(e.clientX-r.left, e.clientY-r.top);
      for (var i = 0; i < 4; i++) if (k > 0) pulseFrom(k);
    });
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible && !reduce && !raf) raf = requestAnimationFrame(SC ? scrollFrame : frame); }).observe(canvas);
    var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ if (Math.abs(canvas.getBoundingClientRect().width - W) > 40) start(); }, 200); });
    start();
    return {restart:start};
  }

  /* ---------- árvore que cresce (araucária) ----------
     svg com viewBox 0 0 400 640, solo em y=452. Progresso p de 0 a 6, um inteiro por movimento do MAC:
     0 Leitura (o solo é lido, a semente aparece) · 1 Raízes · 2 Solo (camadas e tronco) · 3 Copa (andares e acículas)
     4 Frutos (pinhas) · 5 Sementes (caem e germinam). opts: seed, crownOnly, highlight */
  function growTree(svg, opts){
    opts = opts || {};
    var R = rng(opts.seed || 11), G = 452, CX = 208, items = [], tips = [];
    svg.setAttribute('viewBox', '0 0 400 640');
    svg.classList.add('c-tree');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var root = el('g', {}, svg);
    function draw(d, w, s, e, stage, cls){
      var p = el('path', {d:d, 'stroke-width':w}, root);
      if (cls) p.setAttribute('class', cls);
      items.push({el:p, type:'draw', s:s, e:e, stage:stage}); return p;
    }
    // trunk x at height y (trunk curve is gentle)
    function trunkX(y){ var t = (G - y)/(G - 64); return CX + Math.sin(t*2.6)*5 - t*2; }

    if (!opts.crownOnly){
      draw('M30 ' + G + ' C 120 ' + (G-12) + ', 270 ' + (G+14) + ', 390 ' + (G-4), 3, 0, .7, 0, 'soil');
      var seed = el('ellipse', {cx:CX, cy:G-6, rx:6, ry:9, transform:'rotate(-18 ' + CX + ' ' + (G-6) + ')', 'stroke-width':2.4, 'class':'seed'}, root);
      items.push({el:seed, type:'scale', s:.25, e:.9, stage:0});
      // raízes: ramificação recursiva para baixo
      function rootBranch(x, y, a, len, depth, t0){
        var ex = clamp(x + Math.cos(a)*len, 24, 384), ey = clamp(y + Math.sin(a)*len, G+8, 628);
        var n = (R() - .5) * len * .5, mx = (x+ex)/2 - Math.sin(a)*n, my = (y+ey)/2 + Math.cos(a)*n;
        draw('M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Q ' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), Math.max(1.3, 4 - depth*1.2), t0, t0 + .42, 1);
        if (depth < 2){
          var kids = depth === 0 ? 2 : 1 + (R() < .6 ? 1 : 0);
          for (var i = 0; i < kids; i++){
            var f = .45 + R()*.4, bx = x + (ex-x)*f, by = y + (ey-y)*f;
            rootBranch(bx, by, a + (i ? 1 : -1)*(.35 + R()*.45), len*(.5 + R()*.2), depth+1, t0 + .22 + R()*.12);
          }
        }
      }
      [-.95, .02, .9].forEach(function(o, i){ rootBranch(CX, G, Math.PI/2 + o + (R()-.5)*.25, 112 + R()*44, 0, 1 + i*.07); });
      draw('M52 ' + (G+26) + ' C 140 ' + (G+16) + ', 262 ' + (G+38) + ', 372 ' + (G+20), 2, 2, 2.45, 2, 'soil');
      draw('M86 ' + (G+50) + ' C 170 ' + (G+42) + ', 268 ' + (G+60) + ', 344 ' + (G+48), 2, 2.1, 2.55, 2, 'soil');
    }
    // tronco e copa: o mesmo desenho orgânico e fractal da árvore do hero (assimétrico, folhagem musgo, frutos fogo).
    // Um só sistema visual de árvore no site inteiro.
    var C = opts.crownOnly, tT0 = C ? 0 : 2.15, tT1 = C ? .6 : 3.0, tL0 = C ? .45 : 3.0, dStep = C ? .13 : .15, tLf = C ? 1.15 : 3.55;
    var lean = -(10 + R()*14), crownY = C ? 250 : 236, baseW = 13, prev = [CX, G], segs = 5;
    draw('M' + (CX - baseW*1.5) + ' ' + (G + 2) + ' Q ' + (CX - baseW*.5) + ' ' + (G - 4) + ' ' + (CX - baseW*.35) + ' ' + (G - 26), 2.4, tT0, tT0 + .2, 2);
    draw('M' + (CX + baseW*1.4) + ' ' + (G + 2) + ' Q ' + (CX + baseW*.5) + ' ' + (G - 4) + ' ' + (CX + baseW*.35) + ' ' + (G - 26), 2.4, tT0, tT0 + .2, 2);
    for (var q = 1; q <= segs; q++){
      var tq = q/segs, ny = G - (G - crownY)*tq, nx = CX + lean*Math.sin(tq*Math.PI*.85), w = baseW - (baseW - 4)*Math.pow(tq, .6);
      draw('M' + prev[0].toFixed(1) + ' ' + prev[1].toFixed(1) + ' Q ' + ((prev[0] + nx)/2 + (q % 2 ? 2.5 : -2.5)).toFixed(1) + ' ' + ((prev[1] + ny)/2).toFixed(1) + ' ' + nx.toFixed(1) + ' ' + ny.toFixed(1), w, tT0 + (tT1 - tT0)*(q-1)/segs, tT0 + (tT1 - tT0)*q/segs + .01, 2);
      prev = [nx, ny];
    }
    var cx0 = prev[0], cy0 = prev[1];
    function limb(x, y, a, l, w, d, st){
      var ex = clamp(x + Math.cos(a)*l, 14, 386), ey = Math.max(36, y + Math.sin(a)*l);
      var bend = (R()-.5)*l*.22, mx = (x + ex)/2 - Math.sin(a)*bend, my = (y + ey)/2 + Math.cos(a)*bend;
      draw('M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Q ' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), Math.max(1.1, w), st, st + .3, 3);
      if (d >= 4){ tips.push({x:ex, y:ey, dir: ex < CX ? -1 : 1, st:st + .3}); return; }
      var kids = d < 2 ? 3 : 2;
      for (var c = 0; c < kids; c++){
        var spread = (kids === 3 ? (c - 1)*.5 : (c ? .42 : -.42)) + (R()-.5)*.2, up = (-Math.PI/2 - (a + spread))*.12;
        limb(ex, ey, a + spread + up, l*(.68 + R()*.1), w*.64, d + 1, st + dStep);
      }
    }
    var mains = 5;
    for (var j = 0; j < mains; j++){
      var fr = j/(mains - 1), ang = -Math.PI*(.9 - .8*fr) + (R()-.5)*.16;   // leque que sobe, assimétrico
      limb(cx0 + (R()-.5)*4, cy0 + 14*Math.abs(fr - .5) + (j === 0 ? 30 : 0), ang, 78*(.8 + R()*.4) * (fr > .3 && fr < .7 ? 1.08 : .92), 4.6, 1, tL0 + j*.02);
    }
    // folhagem: tufos musgo nas pontas
    tips.forEach(function(tp, i){
      var lg = el('g', {'class':'leafy'}, root);
      for (var lf = 0; lf < 8; lf++){ var la = R()*6.283, lr = 2 + R()*12, lx = tp.x + Math.cos(la)*lr, ly = tp.y + Math.sin(la)*lr*.75;
        el('ellipse', {cx:lx.toFixed(1), cy:ly.toFixed(1), rx:(3.5 + R()*3.5).toFixed(1), ry:(2 + R()*1.8).toFixed(1), transform:'rotate(' + (R()*180).toFixed(0) + ' ' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')', 'class': R() < .25 ? 'leaf leaf-ochre' : 'leaf'}, lg); }
      var sl = tLf + (i % 7)*.04;
      items.push({el:lg, type:'scale', s:sl, e:sl + .3, stage:3});
    });
    tips.sort(function(a, b){ return a.y - b.y; });
    tips = tips.filter(function(_, i){ return i % 3 === 1; });
    if (C){
      // fechamento: bons frutos (fogo) na copa
      tips.slice(0, 6).forEach(function(tp, j){
        var fc = el('circle', {cx:tp.x.toFixed(1), cy:(tp.y + 6).toFixed(1), r:7, 'class':'fruitdot'}, root);
        var sf = 1.45 + j*.06; items.push({el:fc, type:'scale', s:sf, e:sf + .2, stage:4});
      });
    }
    if (!opts.crownOnly){
      // frutos: pinhas em pontos irregulares
      var picks = tips.slice(0, 6);
      if (picks.length < 3) picks = tips.slice(0, 3);
      picks.forEach(function(tp, j){
        var fx = tp.x, fy = tp.y + 8, g = el('g', {'class':'fruit'}, root);
        el('circle', {cx:fx, cy:fy, r:7.5, 'class':'fruitdot'}, g);
        var s4 = 4.05 + j*.13;
        items.push({el:g, type:'scale', s:s4, e:s4 + .45, stage:4});
        // semente: cai da pinha e germina no solo
        var gx = clamp(fx + (R()-.5)*60, 40, 372), sd = el('path', {d:'M' + fx + ' ' + (fy+6) + ' q 5 8 0 15 q -5 -7 0 -15z', 'stroke-width':1.8, 'class':'seedfall'}, root);
        var s5 = 5 + j*.09;
        items.push({el:sd, type:'fall', s:s5, e:s5 + .42, stage:5, dx:gx - fx, dy:(G - 16) - (fy + 6)});
        draw('M' + gx.toFixed(1) + ' ' + G + ' v -15 M' + gx.toFixed(1) + ' ' + (G-11) + ' q -9 -7 -14 -3 M' + gx.toFixed(1) + ' ' + (G-14) + ' q 8 -8 13 -5', 1.8, s5 + .4, Math.min(6, s5 + .78), 5, 'sprout');
      });
    }
    items.forEach(function(it){
      if (it.type === 'draw'){ it.len = it.el.getTotalLength() + 1; it.el.style.strokeDasharray = it.len; }
    });
    var lastStage = -1;
    function set(p){
      var cur = Math.min(5, Math.floor(p));
      for (var i = 0; i < items.length; i++){
        var it = items[i], k = clamp((p - it.s)/(it.e - it.s), 0, 1), st = it.el.style;
        if (it.type === 'draw'){ st.strokeDashoffset = (it.len*(1 - easeGrow(k))).toFixed(2); st.visibility = k > 0 ? 'visible' : 'hidden'; }
        else if (it.type === 'scale'){ st.transform = 'scale(' + easeGrow(k).toFixed(3) + ')'; st.visibility = k > 0 ? 'visible' : 'hidden'; }
        else if (it.type === 'fall'){
          var after = clamp((p - it.e)/.3, 0, 1);
          st.transform = 'translate(' + (it.dx*k).toFixed(1) + 'px,' + (it.dy*easeIn(k)).toFixed(1) + 'px)';
          st.visibility = k > 0 && after < 1 ? 'visible' : 'hidden'; st.opacity = (1 - after).toFixed(2);
        }
      }
      if (opts.highlight !== false && cur !== lastStage){
        lastStage = cur;
        items.forEach(function(it){ it.el.classList.toggle('is-now', it.stage === cur); });
      }
    }
    set(0);
    return {set:set, items:items};
  }

  /* ---------- árvore do hero: a metodologia MAC contada durante o pin ----------
     svg absoluto do tamanho do hero. opts: portrait(box), dim(box) (retângulo do texto), open(box) (áreas livres
     para frutos e sementes), simple(W) (mobile). set(p), p de 0 a 1:
     0–.20 Cultivador (semente nos pés e primeiras raízes) · .20–.45 Raízes e solo (rizoma até as duas bordas)
     .45–.70 Tronco e copa (tronco de base larga entre o texto e o retrato; copa viva com folhagem, abaixo da nav)
     .70–.90 Frutos (crescem e amadurecem de musgo para fogo) · .90–1 Sementes (caem em arco e germinam) */
  function heroTree(svg, opts){
    var items = [], W, H, R, NAV = opts.navBottom || 84;
    function P(d, w, s, e, cls){ var p = el('path', {d:d, 'stroke-width':w.toFixed(2)}, svg._g); if (cls) p.setAttribute('class', cls); items.push({el:p, type:'draw', s:s, e:e}); return p; }
    function Q(x0, y0, cx, cy, x1, y1){ return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' Q ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1); }
    function mix(a, b, t){ return 'rgb(' + [0,1,2].map(function(i){ return Math.round(a[i] + (b[i] - a[i])*t); }).join(',') + ')'; }
    var MOSS = [138,154,91], FIRE = [240,161,74];
    function build(){
      R = rng(opts.seed || 21); items = [];
      var box = svg.parentNode.getBoundingClientRect(); W = box.width; H = box.height;
      svg.setAttribute('viewBox', '0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0));
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var pr = opts.portrait(box), dlist = opts.dim ? [].concat(opts.dim(box)) : [], simple = !!(opts.simple && opts.simple(W, H)), dm = null;
      if (dlist.length){ var ux1 = 1e9, uy1 = 1e9, ux2 = -1e9, uy2 = -1e9; dlist.forEach(function(r){ ux1 = Math.min(ux1, r.x); uy1 = Math.min(uy1, r.y); ux2 = Math.max(ux2, r.x + r.w); uy2 = Math.max(uy2, r.y + r.h); }); dm = {x:ux1, y:uy1, w:ux2 - ux1, h:uy2 - uy1, keep:dlist[0].keep}; }
      var defs = el('defs', {}, svg), mid = 'htm' + Math.round(Math.random()*1e6);
      var gl = el('radialGradient', {id:mid + 'g'}, defs); el('stop', {offset:'0', 'stop-color':'#f0a14a', 'stop-opacity':'.45'}, gl); el('stop', {offset:'1', 'stop-color':'#f0a14a', 'stop-opacity':'0'}, gl);
      if (dm){
        var f = el('filter', {id:mid + 'f', x:'-20%', y:'-20%', width:'140%', height:'140%'}, defs); el('feGaussianBlur', {stdDeviation:'9'}, f);
        var m = el('mask', {id:mid, maskUnits:'userSpaceOnUse', x:0, y:0, width:W, height:H}, defs);
        el('rect', {x:0, y:0, width:W, height:H, fill:'#fff'}, m);
        // um retângulo por linha, cada um com o próprio desfoque (filtro em grupo dentro de máscara falha no Chrome)
        dlist.forEach(function(r){ el('rect', {x:r.x, y:r.y, width:r.w, height:r.h, fill:'#000', 'fill-opacity':(1 - (r.keep || .2)).toFixed(2), filter:'url(#' + mid + 'f)'}, m); });
      }
      var g = el('g', dm ? {mask:'url(#' + mid + ')'} : {}, svg); svg._g = g;
      var top = el('g', {}, svg); // frutos, sementes e rótulos ficam fora da máscara: sempre visíveis
      var G = H - Math.max(40, H*.075), CEIL = NAV + 16;
      var face = {l: pr.left - 8, r: pr.right + 8, t: pr.top - 30, b: pr.top + pr.height*.62};
      function blocked(x, y){ return x > face.l && x < face.r && y > face.t && y < face.b; }
      function inText(x, y, pad){ pad = pad || 0; for (var i = 0; i < dlist.length; i++){ var d = dlist[i]; if (x > d.x - pad && x < d.x + d.w + pad && y > d.y - pad && y < d.y + d.h + pad) return true; } return false; }
      function inPortrait(x, y){ return x > pr.left - 4 && x < pr.right + 4 && y > pr.top - 10 && y < pr.top + pr.height*.8; }
      var S = {x: pr.left + pr.width*.46, y: G};
      // ---- 1. Cultivador ----
      var seed = el('ellipse', {cx:S.x, cy:S.y - 4, rx:7, ry:10, 'class':'ht-seed'}, g); items.push({el:seed, type:'scale', s:0, e:.05});
      for (var i = 0; i < 3; i++){ var a = Math.PI/2 + (i-1)*.55, l = 26 + R()*18; P(Q(S.x, S.y, S.x + Math.cos(a)*l*.4, S.y + l*.5, S.x + Math.cos(a)*l, S.y + Math.sin(a)*l), 2.6 - i*.3, .04 + i*.03, .2, 'ht-root'); }
      // ---- 2. Raízes e solo ----
      function rootlet(x, y, a, l, w, depth, s){
        var ex = x + Math.cos(a)*l, ey = Math.min(H - 4, y + Math.sin(a)*l);
        P(Q(x, y, x + Math.cos(a)*l*.5 + (R()-.5)*8, y + Math.sin(a)*l*.5, ex, ey), w, s, s + .05, 'ht-root');
        if (depth > 1) for (var c = 0; c < 2; c++) rootlet(ex, ey, a + (c ? .5 : -.5) + (R()-.5)*.3, l*.6, w*.65, depth - 1, s + .03);
      }
      function rhizome(dir, s0, s1){
        var x = S.x, y = S.y + 4, n = simple ? 6 : 10, end = dir < 0 ? -12 : W + 12, step = (end - x)/n;
        for (var k = 0; k < n; k++){
          var nx = x + step, ny = S.y + 6 + Math.sin(k*1.3 + dir)*8 + R()*6, w = Math.max(1.1, 4.6 - k*(3.4/n));
          var t0 = s0 + (s1 - s0)*k/n, t1 = s0 + (s1 - s0)*(k+1)/n;
          P(Q(x, y, (x+nx)/2, Math.max(y, ny) + 6, nx, ny), w, t0, t1 + .02, 'ht-root');
          if (k % (simple ? 2 : 1) === 0) rootlet(nx, ny, Math.PI/2 + (R()-.5)*1.1, 18 + R()*22, Math.max(.8, w*.55), simple ? 1 : 2, t1);
          x = nx; y = ny;
        }
      }
      rhizome(-1, .2, .43); rhizome(1, .22, .34);
      // ---- 3. Tronco e copa ----
      // o tronco nasce do chão no espaço entre o texto e o retrato, com base larga e sapopemas, e afina para cima
      var gapL = dm ? Math.min(dm.x + dm.w - 10, pr.left - 30) : pr.left - 60, gapR = pr.left - 6;
      var tx = simple ? Math.max(28, pr.left - 18) : Math.max(30, (gapL + gapR)/2), baseW = simple ? 12 : Math.max(10, Math.min(24, (gapR - gapL)*.22));
      var crownY = simple ? Math.max(CEIL + 70, pr.top - 40) : CEIL + (G - CEIL)*.36;
      P('M' + (tx - baseW*1.6).toFixed(1) + ' ' + (G + 2) + ' Q ' + (tx - baseW*.5).toFixed(1) + ' ' + (G - 6) + ' ' + (tx - baseW*.35).toFixed(1) + ' ' + (G - 34), 3, .45, .5, 'ht-wood');
      P('M' + (tx + baseW*1.5).toFixed(1) + ' ' + (G + 2) + ' Q ' + (tx + baseW*.5).toFixed(1) + ' ' + (G - 6) + ' ' + (tx + baseW*.35).toFixed(1) + ' ' + (G - 34), 3, .45, .5, 'ht-wood');
      var segs = 7, lean = -(14 + R()*10), prev = [tx, G];   // inclina para o lado aberto (esquerda)
      for (var q = 1; q <= segs; q++){
        var t = q/segs, ny = G - (G - crownY)*t, nx = tx + lean*Math.sin(t*Math.PI*.9);
        var w = baseW - (baseW - (simple ? 3 : 5))*Math.pow(t, .6);
        P(Q(prev[0], prev[1], (prev[0] + nx)/2 + (q % 2 ? 2.5 : -2.5), (prev[1] + ny)/2, nx, ny), w, .46 + .1*(q-1)/segs, .46 + .1*q/segs + .004, 'ht-wood');
        prev = [nx, ny];
      }
      var crownX = prev[0], tips = [], maxD = simple ? 3 : 5;
      // galhos baixos saindo do tronco antes da copa
      var lowLimbs = simple ? 1 : 3;
      function limb(x, y, a, l, w, d, s){
        var ex = x + Math.cos(a)*l, ey = y + Math.sin(a)*l, tries = 0;
        while ((blocked(ex, ey) || ey < CEIL || ex < 10 || ex > W - 10 || ey > G - 40) && tries++ < 4){ l *= .66; ex = x + Math.cos(a)*l; ey = y + Math.sin(a)*l; }
        if (tries > 4 || l < 10) return;
        var bend = (R()-.5)*l*.22, cx = (x + ex)/2 - Math.sin(a)*bend, cy = (y + ey)/2 + Math.cos(a)*bend;
        P(Q(x, y, cx, cy, ex, ey), Math.max(1.1, w), s, s + .045, 'ht-wood');
        if (d >= maxD){ tips.push({x:ex, y:ey, s:s + .045}); return; }
        if (d >= 2 && R() < .35) tips.push({x:ex, y:ey, s:s + .045, mid:true});
        var kids = d < 2 ? 3 : 2;
        for (var c = 0; c < kids; c++){
          var spread = (kids === 3 ? (c - 1)*.5 : (c ? .4 : -.4)) + (R()-.5)*.2;
          limb(ex, ey, a + spread, l*(.7 + R()*.08), w*.64, d + 1, s + .028);
        }
      }
      // galhos principais: um leque que sobe, mais aberto para a esquerda (o retrato fica à direita)
      var L0 = Math.min(simple ? 70 : 140, (crownY - CEIL)*.62 + 30), mains = simple ? 4 : 7;
      for (var j = 0; j < lowLimbs; j++){
        var ly = crownY + (G - crownY)*(.18 + j*.16), lx = tx + lean*Math.sin((1 - (ly - crownY)/(G - crownY))*Math.PI*.9);
        limb(lx, ly, -Math.PI*(.86 - j*.04) + (R()-.5)*.1, L0*(.55 - j*.08), simple ? 2.6 : 3.6, 2, .53 + j*.008);
      }
      for (var j = 0; j < mains; j++){
        var fr = j/(mains - 1), ang = -Math.PI*(.97 - .62*fr) + (R()-.5)*.1;
        var y0 = crownY + (1 - Math.abs(fr - .5)*2)*(-6) + (fr < .3 ? 14 : 0);
        limb(crownX, y0, ang, L0*(.85 + R()*.25), (simple ? 3 : 4.2), 1, .555 + j*.01);
      }
      // ---- folhagem: tufos nas pontas (a copa precisa ler como árvore viva) ----
      tips.forEach(function(tp){
        var n = tp.mid ? 5 : (simple ? 6 : 11), cl = el('g', {'class':'ht-leaves'}, g);
        for (var k = 0; k < n; k++){
          var ang = R()*6.283, rr = 2 + R()*(tp.mid ? 7 : 13), lx = tp.x + Math.cos(ang)*rr, ly = Math.max(CEIL, tp.y + Math.sin(ang)*rr*.8);
          el('ellipse', {cx:lx.toFixed(1), cy:ly.toFixed(1), rx:(3 + R()*3.5).toFixed(1), ry:(2 + R()*2).toFixed(1), transform:'rotate(' + (R()*180).toFixed(0) + ' ' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')', 'class': R() < .3 ? 'ht-leaf ht-leaf-ochre' : 'ht-leaf'}, cl);
        }
        var s3 = Math.max(.6, Math.min(.69, tp.s + .02));
        items.push({el:cl, type:'scale', s:s3, e:s3 + .05});
      });
      // ---- 4. Frutos: nas áreas abertas, grandes, amadurecem de musgo para fogo ----
      var open = tips.filter(function(tp){ return !inText(tp.x, tp.y, 42) && !inPortrait(tp.x, tp.y) && tp.y > CEIL + 8 && tp.x < pr.left - 24; });
      var closed = tips.filter(function(tp){ return !tp.mid && inText(tp.x, tp.y, 6); });
      open.sort(function(a, b){ return a.y - b.y; });
      var nF = simple ? 4 : 8, chosen = [], stride = Math.max(1, Math.floor(open.length/nF));
      for (var i = 0; i < open.length && chosen.length < nF; i += stride) chosen.push(open[i]);
      var fruits = [];
      chosen.forEach(function(tp, i){
        var fx = tp.x + (R()-.5)*4, fy = Math.max(CEIL + 6, tp.y + 6), r = simple ? 5 : 5 + R()*2;
        var gw = el('circle', {cx:fx.toFixed(1), cy:fy.toFixed(1), r:(r*2.4).toFixed(1), fill:'url(#' + mid + 'g)', 'class':'ht-glow'}, top);
        var fc = el('circle', {cx:fx.toFixed(1), cy:fy.toFixed(1), r:r.toFixed(1), 'class':'ht-fruit'}, top);
        var s4 = .7 + .14*(i/Math.max(1, chosen.length - 1));
        items.push({el:gw, type:'ripenGlow', s:s4, e:.9});
        items.push({el:fc, type:'ripen', s:s4, e:Math.min(.9, s4 + .08)});
        fruits.push({x:fx, y:fy, r:r, el:fc, open:!inText(fx, fy, 4)});
        svg._fruits = fruits;
      });
      // rótulos curtos junto aos elementos (só em área aberta)
      function label(txt, x, y, s){
        var wtxt = txt.length*8.2, cands = [[x + 14, y + 5, 'start'], [x - 14, y + 5, 'end'], [x, y + 26, 'middle'], [x, y - 16, 'middle']];
        for (var c = 0; c < cands.length; c++){
          var cx = cands[c][0], cy = cands[c][1], an = cands[c][2], x1 = an === 'start' ? cx : an === 'end' ? cx - wtxt : cx - wtxt/2, x2 = x1 + wtxt;
          var bad = cy - 14 < CEIL || cy > H - 6 || x1 < 8 || x2 > W - 8 || inPortrait(x1, cy) || inPortrait(x2, cy) || inText(x1, cy - 6, 6) || inText(x2, cy - 6, 6) || (x2 > tx - baseW*2 && x1 < tx + baseW*2);
          if (bad) continue;
          var t = el('text', {x:cx.toFixed(1), y:cy.toFixed(1), 'text-anchor':an, 'class':'ht-label'}, top); t.textContent = txt;
          items.push({el:t, type:'fade', s:s, e:s + .04}); return;
        }
      }
      var lf = fruits.filter(function(f){ return f.open; })[0];

      // ---- 5. Sementes: caem em arco com rastro e germinam em áreas abertas ----
      var landing = [], free = [];
      for (var lx = 20; lx < pr.left - 24; lx += 10){
        var clear = true;
        for (var hy = 4; hy <= 36; hy += 8) if (inText(lx, G - hy, 26)) { clear = false; break; }
        if (clear && Math.abs(lx - tx) > baseW*2.4) free.push(lx);
      }
      var want = simple ? 3 : 5, gapPick = Math.max(1, Math.floor(free.length/want));
      for (var fi = Math.floor(gapPick/2); fi < free.length && landing.length < want; fi += gapPick) landing.push(free[fi]);
      var seedsFrom = fruits.filter(function(f){ return f.open; }).concat(fruits.filter(function(f){ return !f.open; })).slice(0, landing.length);
      seedsFrom.forEach(function(fr, i){
        var gx = landing[i], gy = G - 2, cx = (fr.x + gx)/2 + (gx < fr.x ? -30 : 30), cy = Math.min(fr.y, gy) - 24;
        var s5 = .9 + i*.012, e5 = s5 + .055;
        var sd = el('circle', {cx:fr.x, cy:fr.y, r:3.6, 'class':'ht-seedfly'}, top);
        items.push({el:sd, type:'fly', s:s5, e:e5, x0:fr.x, y0:fr.y, x1:gx, y1:gy, cx:cx, cy:cy});
        var sp = el('g', {'class':'ht-sprout'}, top), h = simple ? 20 : 26;
        el('path', {d:'M' + gx.toFixed(1) + ' ' + gy + ' v -' + h, 'stroke-width':'2'}, sp);
        el('path', {d:'M' + gx.toFixed(1) + ' ' + (gy - h*.55) + ' c -4 -8 -12 -9 -16 -6 c 4 6 11 8 16 6z', 'class':'ht-sleaf'}, sp);
        el('path', {d:'M' + gx.toFixed(1) + ' ' + (gy - h*.8) + ' c 4 -8 12 -9 16 -6 c -4 6 -11 8 -16 6z', 'class':'ht-sleaf'}, sp);
        if (!simple) el('path', {d:'M' + gx.toFixed(1) + ' ' + (gy - h) + ' c -2 -6 0 -10 3 -12 c 2 4 1 9 -3 12z', 'class':'ht-sleaf'}, sp);
        items.push({el:sp, type:'scale', s:e5 - .01, e:Math.min(1, e5 + .045)});
      });
      items.forEach(function(it){ if (it.type === 'draw'){ it.len = it.el.getTotalLength() + 1; it.el.style.strokeDasharray = it.len; } });
    }
    var cur = 0;
    function set(p){
      cur = p;
      for (var i = 0; i < items.length; i++){
        var it = items[i], k = clamp((p - it.s)/(it.e - it.s), 0, 1), st = it.el.style;
        if (it.type === 'draw'){ st.strokeDashoffset = (it.len*(1 - easeGrow(k))).toFixed(2); st.visibility = k > 0 ? 'visible' : 'hidden'; }
        else if (it.type === 'scale'){ st.transform = 'scale(' + easeGrow(k).toFixed(3) + ')'; st.visibility = k > 0 ? 'visible' : 'hidden'; }
        else if (it.type === 'fade'){ st.opacity = k.toFixed(2); st.visibility = k > 0 ? 'visible' : 'hidden'; }
        else if (it.type === 'ripen'){   // cresce primeiro, depois amadurece: musgo → fogo
          var sk = clamp(k/.45, 0, 1), ck = clamp((k - .3)/.7, 0, 1);
          st.transform = 'scale(' + easeGrow(sk).toFixed(3) + ')'; st.fill = mix(MOSS, FIRE, ck); st.visibility = k > 0 ? 'visible' : 'hidden';
        }
        else if (it.type === 'ripenGlow'){ st.opacity = clamp((k - .35)/.65, 0, 1).toFixed(2); st.visibility = k > .35 ? 'visible' : 'hidden'; }
        else if (it.type === 'fly'){
          var t = easeIn(k), u = 1 - t;
          it.el.setAttribute('cx', (u*u*it.x0 + 2*u*t*it.cx + t*t*it.x1).toFixed(1)); it.el.setAttribute('cy', (u*u*it.y0 + 2*u*t*it.cy + t*t*it.y1).toFixed(1));
          st.visibility = k > 0 && k < 1 ? 'visible' : 'hidden';
        }
      }
    }
    build(); set(reduce ? 1 : 0);
    var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ build(); set(reduce ? 1 : cur); }, 200); });
    return {set:set, rebuild:function(){ build(); set(cur); }, fruits:function(){ return (svg._fruits || []).map(function(f){ return {x:f.x, y:f.y}; }); }, face:function(){ return svg._face; }};
  }

  /* ---------- sementes aladas (Cultivo.seedfall) ----------
     Canvas fixo. release(fruits, heroEl): cada fruto solta várias sementes que giram e derivam com o vento.
     Parte pousa no chão do hero (acompanha o hero); a maioria atravessa a borda e pousa no topo da seção seguinte
     (coordenadas da página), onde brota. reset() recolhe tudo. Sem linha de trajetória: só um rastro curtíssimo.
     opts: next (seção onde pousam), avoid() -> retângulos de viewport a não sobrevoar (rosto, texto). */
  function seedfall(opts){
    if (reduce) return {release:function(){}, reset:function(){}};
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d'), DPR, parts = [], raf = null, FIL = '239,228,207', PUL = '240,161,74', MOSS = '138,154,91';
    cv.className = 'c-seedfall'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    function size(){ DPR = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth*DPR; cv.height = innerHeight*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); }
    size(); addEventListener('resize', size);
    function release(fruits, hero){
      var hr = hero.getBoundingClientRect(), mobile = innerWidth < 900, total = mobile ? 18 : 44, nr = opts.next.getBoundingClientRect();
      var groundY = hr.height - Math.max(40, hr.height*.075), now = performance.now();
      for (var i = 0; i < total && fruits.length; i++){
        var f = fruits[i % fruits.length], toHero = i % 4 === 0;
        var x0 = hr.left + f.x + (Math.random()-.5)*10;
        parts.push({
          frame: toHero ? 'hero' : 'page', x: x0, y0: toHero ? f.y : hr.top + scrollY + f.y, y: 0,
          t0: now + i*55 + Math.random()*400, vx: -(14 + Math.random()*40), vy: toHero ? 70 + Math.random()*40 : 150 + Math.random()*90,
          amp: 6 + Math.random()*10, w: 1.6 + Math.random()*1.4, rot: Math.random()*6.28, spin: (Math.random() < .5 ? -1 : 1)*(2 + Math.random()*3),
          target: toHero ? groundY - 2 - Math.random()*6 : nr.top + scrollY + 28 + Math.random()*90,
          tx: null, landed: 0, hist: []
        });
      }
      kick();
    }
    function reset(){ parts = []; ctx.clearRect(0,0,innerWidth,innerHeight); }
    function kick(){ if (!raf) raf = requestAnimationFrame(frame); }
    addEventListener('scroll', kick, {passive:true});
    function frame(now){
      raf = null; ctx.clearRect(0,0,innerWidth,innerHeight);
      var hero = opts.hero.getBoundingClientRect(), avoid = opts.avoid ? opts.avoid() : [], live = false;
      for (var i = 0; i < parts.length; i++){
        var p = parts[i], t = (now - p.t0)/1000;
        if (t < 0){ live = true; continue; }
        var fall = p.vy*t, yPage, baseY = p.frame === 'hero' ? hero.top : -scrollY;
        if (!p.landed){
          var yAbs = p.y0 + fall;
          if (yAbs >= p.target){ p.landed = now; yAbs = p.target; p.tx = p.x + p.vx*t + Math.sin(t*2.4 + p.rot)*p.amp; }
          p.y = yAbs; var x = p.x + p.vx*t + Math.sin(t*2.4 + p.rot)*p.amp;
          var vx = x, vy = baseY + yAbs;
          var hidden = avoid.some(function(r){ return vx > r.x && vx < r.x + r.w && vy > r.y && vy < r.y + r.h; });
          p.hist.push([vx, vy]); if (p.hist.length > 5) p.hist.shift();
          if (!hidden && vy > -20 && vy < innerHeight + 20){
            // rastro curtíssimo
            for (var k = 0; k < p.hist.length - 1; k++){ ctx.fillStyle = 'rgba(' + PUL + ',' + (.08 + k*.05) + ')'; ctx.beginPath(); ctx.arc(p.hist[k][0], p.hist[k][1], 1.2, 0, 6.283); ctx.fill(); }
            // semente alada: corpo + asa, girando
            var a = p.rot + t*p.spin; ctx.save(); ctx.translate(vx, vy); ctx.rotate(a);
            ctx.fillStyle = 'rgb(' + PUL + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 2, 0, 0, 6.283); ctx.fill();
            ctx.fillStyle = 'rgba(' + FIL + ',.55)'; ctx.beginPath(); ctx.ellipse(6, 0, 6, 1.8*p.w, 0, 0, 6.283); ctx.fill();
            ctx.restore();
          }
          live = true;
        } else {
          // pousou: um broto pequeno cresce em 600 ms
          var k2 = Math.min(1, (now - p.landed)/600), gx = p.tx, gy = baseY + p.target;
          if (k2 < 1) live = true;
          if (gy > -30 && gy < innerHeight + 30){
            var hgt = 12*k2;
            ctx.strokeStyle = 'rgba(' + MOSS + ',.9)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - hgt); ctx.stroke();
            if (k2 > .4){ var lk = (k2 - .4)/.6; ctx.fillStyle = 'rgba(' + MOSS + ',.9)';
              ctx.beginPath(); ctx.ellipse(gx - 4*lk, gy - hgt*.7, 4*lk, 1.8*lk, -.5, 0, 6.283); ctx.fill();
              ctx.beginPath(); ctx.ellipse(gx + 4*lk, gy - hgt*.9, 4*lk, 1.8*lk, .5, 0, 6.283); ctx.fill(); }
            ctx.fillStyle = 'rgb(' + PUL + ')'; ctx.beginPath(); ctx.arc(gx, gy, 2, 0, 6.283); ctx.fill();
          }
        }
      }
      if (live) raf = requestAnimationFrame(frame);
    }
    return {release:release, reset:reset};
  }

  /* ---------- árvore pequena estática (Cultivo.miniTree) ----------
     Mesmo desenho orgânico das outras árvores, para ilustrações (ex.: floresta da Rede). Cresce para cima a partir de (0,0). */
  function miniTree(g, seed, o){
    o = o || {}; var R = rng(seed), H = o.height || 170, tips = [];
    g.classList.add('mt'); if (o.accent) g.classList.add('mt-accent');
    function P(d, w){ el('path', {d:d, 'stroke-width':w.toFixed(2)}, g); }
    var lean = (R() - .5)*16, cy = -H*.42, base = o.base || 7;
    P('M' + (-base*1.5) + ' 2 Q ' + (-base*.5) + ' -3 ' + (-base*.3) + ' -18', 2);
    P('M' + (base*1.4) + ' 2 Q ' + (base*.5) + ' -3 ' + (base*.3) + ' -18', 2);
    P('M0 0 C ' + (lean*.3).toFixed(1) + ' ' + (cy*.4).toFixed(1) + ', ' + (lean*.8).toFixed(1) + ' ' + (cy*.75).toFixed(1) + ', ' + lean.toFixed(1) + ' ' + cy.toFixed(1), base);
    function limb(x, y, a, l, w, d){
      var ex = x + Math.cos(a)*l, ey = y + Math.sin(a)*l, bend = (R()-.5)*l*.22;
      P('M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Q ' + ((x + ex)/2 - Math.sin(a)*bend).toFixed(1) + ' ' + ((y + ey)/2 + Math.cos(a)*bend).toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), Math.max(.9, w));
      if (d >= 3){ tips.push([ex, ey]); return; }
      for (var c = 0; c < 2; c++){ var sp = (c ? .45 : -.45) + (R()-.5)*.2; limb(ex, ey, a + sp + (-Math.PI/2 - (a + sp))*.12, l*(.68 + R()*.1), w*.62, d + 1); }
    }
    for (var j = 0; j < 4; j++){ var fr = j/3; limb(lean, cy + 6*Math.abs(fr - .5), -Math.PI*(.88 - .76*fr) + (R()-.5)*.14, H*.24*(.85 + R()*.3), base*.55, 1); }
    tips.forEach(function(t, i){
      for (var k = 0; k < 6; k++){ var a = R()*6.283, r = 2 + R()*9, x = t[0] + Math.cos(a)*r, y = t[1] + Math.sin(a)*r*.75;
        el('ellipse', {cx:x.toFixed(1), cy:y.toFixed(1), rx:(3 + R()*3).toFixed(1), ry:(1.8 + R()*1.5).toFixed(1), transform:'rotate(' + (R()*180).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')', 'class':'mt-leaf'}, g); }
      if (i % 4 === 1) el('circle', {cx:t[0].toFixed(1), cy:(t[1] + 6).toFixed(1), r:5, 'class':'mt-fruit'}, g);
    });
    return g;
  }

  /* ---------- araucária que cresce uma vez (hero) ---------- */
  function araucaria(svg, opts){
    opts = opts || {};
    var t = growTree(svg, {seed:opts.seed || 5, crownOnly:true, highlight:false});
    if (reduce){ t.set(6); return t; }
    var go = function(){ setTimeout(function(){ tween(opts.duration || 2600, function(k){ t.set(k * 1.9); }); }, opts.delay || 250); };
    if (opts.onView === false) go();
    else new IntersectionObserver(function(es, o){ if (es[0].isIntersecting){ o.disconnect(); go(); } }, {threshold:.4}).observe(svg);
    return t;
  }

  /* ---------- timeline em anéis: os anéis se formam um a um ---------- */
  function rings(svg, list, readout, years, rest){
    function wob(r, s){
      var d = '';
      for (var i = 0; i <= 96; i++){ var a = i/96*6.2832, rr = r*(1 + .022*Math.sin(3*a+s) + .013*Math.sin(7*a+s*1.7) + .006*Math.sin(13*a+s*2.3)); d += (i?'L':'M') + (Math.cos(a)*rr).toFixed(2) + ' ' + (Math.sin(a)*rr*.97).toFixed(2); }
      return d + 'Z';
    }
    var radii = [], r = 0; years.forEach(function(Y){ r += Y.w; radii.push(r); });
    var k = 214/r;
    var bark = el('path', {d:wob(r*k+14, .4), fill:'#3a2c20', stroke:'rgba(239,228,207,.22)'}, svg);
    var els = [], subs = [];
    for (var i = years.length-1; i >= 0; i--){
      var Y = years[i], R = radii[i]*k;
      var base = Y.rev ? (i%2 ? '#8a5a2e' : '#a8703a') : (i%2 ? '#2b2118' : '#33271c');
      var g = el('path', {d:wob(R, i*.9+.3), fill:base, stroke:'rgba(239,228,207,.42)', 'class':'ring'}, svg);
      g.dataset.base = base; els[i] = g;
      if (Y.n){ var inner = i ? radii[i-1]*k : 0; for (var q = 1; q < Y.n; q++){ var s = el('path', {d:wob(inner + (R-inner)*q/Y.n, i+q), fill:'none', stroke:'rgba(239,228,207,.2)', 'stroke-width':'.8'}, svg); s.style.pointerEvents = 'none'; subs.push({el:s, i:i}); } }
    }
    var cr = el('path', {d:'M4 -2 L58 -40 M-3 5 L-46 74 M2 3 L92 46', stroke:'rgba(18,14,11,.55)', 'stroke-width':'1.4', fill:'none'}, svg);
    var bs = [], rv = readout.querySelector('b'), rt = readout.querySelector('span');
    years.forEach(function(Y, i){
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.innerHTML = '<span class="y">' + Y.y + '</span><span class="t">' + Y.t + '</span><span class="v">' + (Y.v||'') + '</span>';
      ['mouseenter','focus','click'].forEach(function(ev){ b.addEventListener(ev, function(){ sel(i); }); });
      li.appendChild(b); list.appendChild(li); bs.push(b);
      els[i].addEventListener('mouseenter', function(){ sel(i); });
    });
    function sel(i){
      els.forEach(function(x,j){ x.setAttribute('fill', j===i ? '#f0a14a' : x.dataset.base); x.style.opacity = j===i ? 1 : .82; });
      bs.forEach(function(b,j){ b.classList.toggle('is-on', j===i); });
      rv.textContent = years[i].ro[0]; rt.textContent = years[i].ro[1];
    }
    function reset(){
      els.forEach(function(x){ x.setAttribute('fill', x.dataset.base); x.style.opacity = 1; });
      bs.forEach(function(b){ b.classList.remove('is-on'); });
      rv.textContent = rest[0]; rt.textContent = rest[1];
    }
    svg.parentNode.addEventListener('mouseleave', function(){ if (!api.locked) reset(); }); list.addEventListener('mouseleave', function(){ if (!api.locked) reset(); });
    reset();
    var api = {select:sel, reset:reset, locked:false};
    if (reduce) return api;
    // crescimento anual: cada anel nasce do anterior, de dentro para fora; a casca fecha por último
    var n = years.length, STEP = 150, DUR = 720;
    function pose(i, kk){
      var from = i ? radii[i-1]/radii[i] : .05, sc = from + (1 - from)*easeGrow(kk);
      els[i].setAttribute('transform', 'scale(' + sc.toFixed(4) + ')'); els[i].style.opacity = kk > 0 ? Math.min(1, kk*3) : 0;
    }
    for (var j = 0; j < n; j++) pose(j, 0);
    subs.forEach(function(s){ s.el.style.opacity = 0; });
    bark.style.opacity = 0; cr.style.opacity = 0; readout.style.opacity = 0;
    var started = false;
    new IntersectionObserver(function(es, o){
      if (!es[0].isIntersecting || started) return;
      started = true; o.disconnect();
      var total = (n-1)*STEP + DUR + 500;
      tween(total, function(t){
        var ms = t*total;
        for (var j = 0; j < n; j++) pose(j, clamp((ms - j*STEP)/DUR, 0, 1));
        subs.forEach(function(s){ s.el.style.opacity = clamp((ms - s.i*STEP - DUR*.6)/300, 0, 1); });
        var tail = clamp((ms - (n-1)*STEP - DUR*.5)/500, 0, 1);
        bark.style.opacity = tail; cr.style.opacity = tail; readout.style.opacity = tail;
      });
    }, {threshold:.35}).observe(svg);
    return api;
  }

  /* ---------- árvore MAC: cresce com a leitura ---------- */
  function mac(root, opts){
    var svg = root.querySelector('.c-mac__tree svg'), moves = root.querySelectorAll('.c-mac__move'), list = root.querySelector('.c-mac__moves');
    var tree = growTree(svg, {seed:(opts && opts.seed) || 11});
    function onMove(i){ moves.forEach(function(m, j){ m.classList.toggle('is-on', j === i); }); }
    if (reduce){ tree.set(6); onMove(0); moves.forEach(function(m){ m.classList.add('is-on'); }); return tree; }
    var ticking = false, lastI = -1;
    function update(){
      ticking = false;
      var r = list.getBoundingClientRect(), t = (innerHeight*.55 - r.top) / r.height;
      var p = clamp(t*6 + .35, 0, 6);
      tree.set(p);
      var i = Math.min(5, Math.floor(p)); if (i !== lastI){ lastI = i; onMove(i); }
    }
    addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }, {passive:true});
    addEventListener('resize', update);
    update();
    return tree;
  }

  /* ---------- floresta nascendo ----------
     svg com .sprout[data-sprout=ordem] (árvores), .hyph (filamentos), .flow (pulsos), [data-label=ordem] */
  function forest(svg){
    var trees = [].slice.call(svg.querySelectorAll('.sprout')), hyphs = [].slice.call(svg.querySelectorAll('.hyph')), labels = [].slice.call(svg.querySelectorAll('[data-label]'));
    if (reduce){ svg.classList.add('is-live'); return; }
    svg.classList.add('is-pending');
    hyphs.forEach(function(h){ var L = h.getTotalLength() + 1; h.style.strokeDasharray = L; h.style.strokeDashoffset = L; h._L = L; });
    var started = false;
    new IntersectionObserver(function(es, o){
      if (!es[0].isIntersecting || started) return;
      started = true; o.disconnect();
      trees.forEach(function(t){ var d = +t.dataset.sprout * 260; setTimeout(function(){ t.classList.add('is-up'); }, d); });
      labels.forEach(function(l){ var d = +l.dataset.label * 260 + 380; setTimeout(function(){ l.classList.add('is-up'); }, d); });
      var base = 900;
      hyphs.forEach(function(h, i){ setTimeout(function(){ h.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)'; h.style.strokeDashoffset = 0; }, base + i*110); });
      setTimeout(function(){ svg.classList.add('is-live'); hyphs.forEach(function(h){ h.style.strokeDasharray = 'none'; }); }, base + hyphs.length*110 + 1300);
    }, {threshold:.3}).observe(svg);
  }

  /* ---------- ciclo dos gestos ---------- */
  function cycle(c){
    var gs = c.querySelectorAll('.c-gesture'), dot = c.querySelector('.dot'), i = 0, timer = null;
    function stepC(){
      gs.forEach(function(g,j){ g.classList.toggle('is-on', j===i); });
      var a = -Math.PI/2 + i*Math.PI/2; dot.setAttribute('cx', 50 + Math.cos(a)*41); dot.setAttribute('cy', 50 + Math.sin(a)*41);
      i = (i+1) % gs.length;
    }
    stepC();
    if (reduce) return;
    new IntersectionObserver(function(es){
      if (es[0].isIntersecting && !timer) timer = setInterval(stepC, 1600);
      else if (!es[0].isIntersecting && timer){ clearInterval(timer); timer = null; }
    }).observe(c);
  }

  /* ---------- rastro de micélio do cursor ----------
     curto e discreto; só com mouse; desliga sobre [data-no-trail] (o hero já tem a rede) */
  function trail(){
    if (reduce || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var cv = document.createElement('canvas'); cv.className = 'c-trail'; cv.setAttribute('aria-hidden','true'); document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), DPR, segs = [], last = null, raf = null, color = '239,228,207', lastHost = null, LIFE = 750;
    function size(){ DPR = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth*DPR; cv.height = innerHeight*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); }
    size(); addEventListener('resize', size);
    addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var t = e.target;
      if (t.closest && t.closest('[data-no-trail]')){ last = null; return; }
      var host = t.closest ? t.closest('[data-theme]') : null;
      if (host !== lastHost){ lastHost = host; color = cssVar(host || document.documentElement, '--filament') || color; }
      var x = e.clientX, y = e.clientY, now = performance.now();
      if (!last){ last = {x:x, y:y}; return; }
      var dx = x - last.x, dy = y - last.y, d = Math.hypot(dx, dy);
      if (d < 12) return;
      var a = Math.atan2(dy, dx), mx = (last.x + x)/2 + Math.sin(a)*(Math.random()-.5)*8, my = (last.y + y)/2 - Math.cos(a)*(Math.random()-.5)*8;
      segs.push({x1:last.x, y1:last.y, cx:mx, cy:my, x2:x, y2:y, t:now, w:1.1});
      if (Math.random() < .45){
        var b = a + (Math.random() < .5 ? -1 : 1)*(.7 + Math.random()*.6), l = 6 + Math.random()*10;
        segs.push({x1:mx, y1:my, cx:mx + Math.cos(b)*l*.5, cy:my + Math.sin(b)*l*.5, x2:mx + Math.cos(b)*l, y2:my + Math.sin(b)*l, t:now, w:.7});
      }
      if (segs.length > 70) segs.splice(0, segs.length - 70);
      last = {x:x, y:y};
      if (!raf) raf = requestAnimationFrame(frame);
    }, {passive:true});
    document.addEventListener('pointerleave', function(){ last = null; });
    function frame(now){
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineCap = 'round';
      for (var i = segs.length-1; i >= 0; i--){
        var s = segs[i], age = (now - s.t)/LIFE;
        if (age >= 1){ segs.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(' + color + ',' + (.34*(1 - age)).toFixed(3) + ')'; ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.quadraticCurveTo(s.cx, s.cy, s.x2, s.y2); ctx.stroke();
      }
      raf = segs.length ? requestAnimationFrame(frame) : null;
    }
  }


  /* ---------- três camadas como árvore em corte (Cultivo.strata) ----------
     LÍDER = raízes e núcleo · NEGÓCIO = tronco que transporta valor · COMUNIDADE = copa + rede micorrízica até outras árvores.
     A camada ativa acende (rolagem: de baixo para cima; hover/foco no texto fixa a camada). Linhas guia ligam texto e parte. */
  function strata(root, opts){
    opts = opts || {};
    var svg = root.querySelector('.c-strata__fig svg'), items = [].slice.call(root.querySelectorAll('.c-strata__item'));
    var W = 560, GY = 418, CX = 280, R = rng(opts.seed || 47);
    svg.setAttribute('viewBox', '0 0 ' + W + ' 640');
    var gCom = el('g', {'class':'st-layer st-com', 'data-layer':'2'}, svg),
        gNeg = el('g', {'class':'st-layer st-neg', 'data-layer':'1'}, svg),
        gLid = el('g', {'class':'st-layer st-lid', 'data-layer':'0'}, svg);
    function P(g, d, w, cls){ return el('path', {d:d, 'stroke-width':(w || 1.4).toFixed(2), 'class':cls || ''}, g); }
    el('path', {d:'M18 ' + GY + ' H ' + (W - 18), 'class':'st-ground'}, svg);

    /* raízes + núcleo */
    var rootTips = [];
    function rootLimb(x, y, a, l, w, d){
      var ex = x + Math.cos(a)*l, ey = y + Math.sin(a)*l, bend = (R() - .5)*l*.3;
      P(gLid, 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Q ' + ((x + ex)/2 - Math.sin(a)*bend).toFixed(1) + ' ' + ((y + ey)/2 + Math.cos(a)*bend).toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), Math.max(1, w), 'st-root');
      if (d >= 3){ rootTips.push([ex, ey]); return; }
      for (var c = 0; c < 2; c++){ var sp = (c ? .5 : -.5) + (R() - .5)*.25; rootLimb(ex, ey, a + sp + (Math.PI/2 - (a + sp))*.18, l*(.66 + R()*.12), w*.6, d + 1); }
    }
    for (var j = 0; j < 5; j++){ var fr = j/4; rootLimb(CX + (fr - .5)*30, GY + 4, Math.PI*(.86 - .72*fr) + (R() - .5)*.12, 62 + R()*22, 7, 1); }
    var core = el('g', {'class':'st-core'}, gLid);
    el('circle', {cx:CX, cy:GY + 8, r:11, 'class':'st-core__seed'}, core);
    el('circle', {cx:CX, cy:GY + 8, r:11, 'class':'st-core__ring'}, core);
    el('circle', {cx:CX, cy:GY + 8, r:11, 'class':'st-core__ring b'}, core);

    /* tronco: estrutura que transporta valor (seiva sobe em pulsos) */
    var TT = 226;
    el('path', {d:'M' + (CX - 24) + ' ' + (GY + 2) + ' C ' + (CX - 14) + ' ' + (GY - 60) + ', ' + (CX - 15) + ' ' + (TT + 70) + ', ' + (CX - 9) + ' ' + TT +
      ' L ' + (CX + 9) + ' ' + TT + ' C ' + (CX + 15) + ' ' + (TT + 70) + ', ' + (CX + 14) + ' ' + (GY - 60) + ', ' + (CX + 24) + ' ' + (GY + 2) + ' Z', 'class':'st-trunk'}, gNeg);
    P(gNeg, 'M' + (CX - 24) + ' ' + (GY + 2) + ' C ' + (CX - 14) + ' ' + (GY - 60) + ', ' + (CX - 15) + ' ' + (TT + 70) + ', ' + (CX - 9) + ' ' + TT, 2.2, 'st-bark');
    P(gNeg, 'M' + (CX + 24) + ' ' + (GY + 2) + ' C ' + (CX + 14) + ' ' + (GY - 60) + ', ' + (CX + 15) + ' ' + (TT + 70) + ', ' + (CX + 9) + ' ' + TT, 2.2, 'st-bark');
    [-7, 0, 7].forEach(function(dx, i){
      var d = 'M' + (CX + dx*1.4) + ' ' + (GY - 4) + ' C ' + (CX + dx*1.1) + ' ' + (GY - 90) + ', ' + (CX + dx*.8) + ' ' + (TT + 80) + ', ' + (CX + dx*.5) + ' ' + (TT + 8);
      P(gNeg, d, 1, 'st-sap-line');
      P(gNeg, d, 2.4, 'st-sap st-sap--' + i);
    });

    /* copa + vizinhas + rede micorrízica = comunidade */
    var tips = [];
    function limb(x, y, a, l, w, d){
      var ex = x + Math.cos(a)*l, ey = y + Math.sin(a)*l, bend = (R() - .5)*l*.24;
      P(gCom, 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Q ' + ((x + ex)/2 - Math.sin(a)*bend).toFixed(1) + ' ' + ((y + ey)/2 + Math.cos(a)*bend).toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), Math.max(1, w), 'st-branch');
      if (d >= 4){ tips.push([ex, ey]); return; }
      for (var c = 0; c < 2; c++){ var sp = (c ? .42 : -.42) + (R() - .5)*.22; limb(ex, ey, a + sp + (-Math.PI/2 - (a + sp))*.14, l*(.7 + R()*.1), w*.64, d + 1); }
    }
    for (var k = 0; k < 5; k++){ var f2 = k/4; limb(CX, TT + 6, -Math.PI*(.92 - .84*f2) + (R() - .5)*.12, 66 + R()*18, 9, 1); }
    tips.forEach(function(t, i){
      for (var q = 0; q < 7; q++){ var a = R()*6.283, r = 3 + R()*13, x = t[0] + Math.cos(a)*r, y = t[1] + Math.sin(a)*r*.75;
        el('ellipse', {cx:x.toFixed(1), cy:y.toFixed(1), rx:(4 + R()*4).toFixed(1), ry:(2.4 + R()*2).toFixed(1), transform:'rotate(' + (R()*180).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')', 'class':'st-leaf'}, gCom); }
      if (i % 3 === 1) el('circle', {cx:t[0].toFixed(1), cy:(t[1] + 7).toFixed(1), r:5.5, 'class':'st-fruit'}, gCom);
    });
    var nb = [[70, 132, 61], [492, 118, 67]];
    nb.forEach(function(n){
      var g = el('g', {transform:'translate(' + n[0] + ' ' + GY + ')'}, gCom);
      miniTree(g, n[2], {height:n[1], base:5});
      for (var s = -1; s <= 1; s++) P(gCom, 'M' + n[0] + ' ' + (GY + 3) + ' q ' + (s*14) + ' 18 ' + (s*26) + ' 34', 1, 'st-root st-root--nb');
    });
    var hy = [];
    [[rootTips[0], [70, GY + 30]], [rootTips[2], [70, GY + 36]], [rootTips[rootTips.length - 1], [492, GY + 30]], [rootTips[rootTips.length - 4], [492, GY + 38]]].forEach(function(p, i){
      if (!p[0]) return;
      var a = p[0], b = p[1], my = Math.max(a[1], b[1]) + 30 + i*8;
      var d = 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' C ' + a[0].toFixed(1) + ' ' + my + ', ' + b[0] + ' ' + my + ', ' + b[0] + ' ' + b[1];
      P(gCom, d, 1, 'st-hypha');
      hy.push(P(gCom, d, 2.2, 'st-flow' + (i % 2 ? ' b' : '')));
    });

    /* linhas guia: overlay sobre o componente */
    var ov = el('svg', {'class':'c-strata__guides', 'aria-hidden':'true'}, null); root.appendChild(ov);
    var anchors = [[CX + 40, 520], [CX + 22, 330], [CX + 96, 112]], guides = [], dots = [];
    items.forEach(function(){ guides.push(el('path', {'class':'st-guide'}, ov)); dots.push(el('circle', {r:3.5, 'class':'st-guide-dot'}, ov)); });
    function layout(){
      var rb = root.getBoundingClientRect(), fb = svg.getBoundingClientRect(), sc = fb.width / W;
      ov.setAttribute('width', rb.width); ov.setAttribute('height', rb.height); ov.setAttribute('viewBox', '0 0 ' + rb.width + ' ' + rb.height);
      var side = getComputedStyle(root).getPropertyValue('--guides').trim() !== 'off';
      ov.style.display = side ? '' : 'none';
      if (!side) return;
      items.forEach(function(it, i){
        var L = +it.dataset.layer, a = anchors[L], ax = fb.left - rb.left + a[0]*sc, ay = fb.top - rb.top + a[1]*sc;
        var tb = it.querySelector('b').getBoundingClientRect(), ex = tb.left - rb.left - 18, ey = tb.top - rb.top + tb.height*.55;
        var mx = (ax + ex)/2;
        guides[i].setAttribute('d', 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' C ' + mx.toFixed(1) + ' ' + ay.toFixed(1) + ', ' + mx.toFixed(1) + ' ' + ey.toFixed(1) + ', ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
        guides[i].dataset.layer = L; dots[i].dataset.layer = L;
        dots[i].setAttribute('cx', ax.toFixed(1)); dots[i].setAttribute('cy', ay.toFixed(1));
      });
    }

    /* camada ativa */
    var active = -1, hold = null;
    function set(L){
      if (L === active) return; active = L; root.dataset.active = L;
      items.forEach(function(it){ it.classList.toggle('is-on', +it.dataset.layer === L); });
    }
    function fromScroll(){
      if (hold !== null) return;
      var b = root.getBoundingClientRect(), vh = innerHeight;
      var p = clamp((vh*.72 - b.top) / Math.max(1, b.height*.8), 0, .999);
      set(Math.floor(p*3));
    }
    items.forEach(function(it){
      var L = +it.dataset.layer;
      it.addEventListener('mouseenter', function(){ hold = L; set(L); });
      it.addEventListener('mouseleave', function(){ hold = null; fromScroll(); });
      it.addEventListener('focusin', function(){ hold = L; set(L); });
      it.addEventListener('focusout', function(){ hold = null; fromScroll(); });
    });

    layout(); addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    if (reduce){ root.classList.add('is-in'); set(0); addEventListener('scroll', fromScroll, {passive:true}); fromScroll(); return {set:set, layout:layout}; }
    new IntersectionObserver(function(es, o){ if (es[0].isIntersecting){ root.classList.add('is-in'); o.disconnect(); setTimeout(layout, 50); } }, {threshold:.2}).observe(root);
    var tk = false;
    addEventListener('scroll', function(){ if (!tk){ tk = true; requestAnimationFrame(function(){ tk = false; fromScroll(); }); } }, {passive:true});
    fromScroll();
    return {set:set, layout:layout};
  }

  /* ---------- princípios da biomimética: uma ilustração viva por princípio (Cultivo.bio) ----------
     coop: árvores ligadas por fungos, carbono indo e voltando · grow: a planta se monta em módulos, de baixo para cima
     light: a planta se curva para a luz (cursor sobre a figura ou rolagem move o sol) */
  function bio(root){
    var GY = 150;
    root.querySelectorAll('[data-bio]').forEach(function(fig){
      var svg = fig.querySelector('svg'), kind = fig.dataset.bio, R = rng(kind === 'coop' ? 11 : kind === 'grow' ? 23 : 37);
      svg.setAttribute('viewBox', '0 0 320 220');
      el('path', {d:'M12 ' + GY + ' H 308', 'class':'bi-ground'}, svg);
      if (kind === 'coop'){
        var xs = [62, 160, 258], hs = [84, 104, 78];
        xs.forEach(function(x, i){
          var g = el('g', {transform:'translate(' + x + ' ' + GY + ')', 'class':'bi-tree'}, svg);
          miniTree(g, 70 + i*9, {height:hs[i], base:4});
          [-1, 0, 1].forEach(function(s){ el('path', {d:'M' + x + ' ' + (GY + 2) + ' q ' + (s*9) + ' 12 ' + (s*16) + ' 22', 'class':'bi-root'}, svg); });
        });
        [['M62 172 C 80 205, 142 205, 160 172', ''], ['M160 172 C 178 205, 240 205, 258 172', ' b'], ['M62 174 C 90 214, 230 214, 258 174', ' c']].forEach(function(p){
          el('path', {d:p[0], 'class':'bi-hypha'}, svg);
          el('path', {d:p[0], 'class':'bi-flow' + p[1]}, svg);
          el('path', {d:p[0], 'class':'bi-flow back' + p[1]}, svg);
        });
        return;
      }
      if (kind === 'grow'){
        var X = 160, mods = {
          roots: el('g', {'class':'bi-mod m1'}, svg), soil: el('g', {'class':'bi-mod m2'}, svg),
          trunk: el('g', {'class':'bi-mod m3'}, svg), crown: el('g', {'class':'bi-mod m4'}, svg)
        };
        [[-.7, 38], [-.25, 46], [.2, 44], [.65, 36]].forEach(function(r){
          var a = Math.PI/2 + r[0], ex = X + Math.cos(a)*r[1], ey = GY + 4 + Math.sin(a)*r[1];
          el('path', {d:'M' + X + ' ' + (GY + 2) + ' Q ' + (X + Math.cos(a)*r[1]*.4 + r[0]*6).toFixed(1) + ' ' + (GY + 18) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), 'class':'bi-draw', pathLength:1}, mods.roots);
        });
        for (var s = 0; s < 22; s++){ el('circle', {cx:(40 + R()*240).toFixed(1), cy:(GY + 8 + R()*44).toFixed(1), r:(1 + R()*1.4).toFixed(1), 'class':'bi-soil'}, mods.soil); }
        el('path', {d:'M' + X + ' ' + GY + ' C 158 120, 163 96, 160 70', 'class':'bi-draw bi-stem', pathLength:1}, mods.trunk);
        el('path', {d:'M160 96 Q 140 84 126 64', 'class':'bi-draw', pathLength:1}, mods.trunk);
        el('path', {d:'M161 86 Q 182 74 194 56', 'class':'bi-draw', pathLength:1}, mods.trunk);
        [[126, 60], [194, 52], [160, 62], [142, 46], [178, 40], [160, 32]].forEach(function(t, i){
          for (var q = 0; q < 6; q++){ var a = R()*6.283, r = 2 + R()*12, x = t[0] + Math.cos(a)*r, y = t[1] + Math.sin(a)*r*.7;
            el('ellipse', {cx:x.toFixed(1), cy:y.toFixed(1), rx:(4 + R()*3).toFixed(1), ry:(2.2 + R()*1.6).toFixed(1), transform:'rotate(' + (R()*180).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')', 'class':'bi-leaf'}, mods.crown); }
          if (i === 1 || i === 4) el('circle', {cx:t[0], cy:t[1] + 8, r:4.5, 'class':'bi-fruit'}, mods.crown);
        });
        var run = function(){ fig.classList.remove('is-in'); void fig.getBoundingClientRect(); fig.classList.add('is-in'); };
        if (reduce){ fig.classList.add('is-in'); return; }
        new IntersectionObserver(function(es, o){ if (es[0].isIntersecting){ o.disconnect(); run(); } }, {threshold:.55}).observe(fig);
        var host = fig.closest('li') || fig, last = 0;
        host.addEventListener('mouseenter', function(){ var n = performance.now(); if (n - last > 3200 && fig.classList.contains('is-in')){ last = n; run(); } });
        return;
      }
      /* light: fototropismo */
      var B = [160, GY], L = 92;
      [-1, -.3, .4, 1].forEach(function(s){ el('path', {d:'M160 ' + (GY + 2) + ' q ' + (s*12) + ' 14 ' + (s*20) + ' 28', 'class':'bi-root'}, svg); });
      var sun = el('g', {'class':'bi-sun'}, svg); el('circle', {r:11, 'class':'bi-sun__disc'}, sun);
      for (var rr = 0; rr < 8; rr++){ var an = rr*Math.PI/4; el('path', {d:'M' + (Math.cos(an)*17).toFixed(1) + ' ' + (Math.sin(an)*17).toFixed(1) + ' L ' + (Math.cos(an)*23).toFixed(1) + ' ' + (Math.sin(an)*23).toFixed(1), 'class':'bi-sun__ray'}, sun); }
      var ray = el('path', {'class':'bi-beam'}, svg);
      var stem = el('path', {'class':'bi-stem'}, svg), leaves = [];
      for (var lv = 0; lv < 6; lv++) leaves.push(el('ellipse', {rx:11 - lv*.9, ry:4.2 - lv*.3, 'class':'bi-leaf'}, svg));
      var bud = el('circle', {r:5, 'class':'bi-fruit'}, svg);
      var target = 250, cur = 250, raf = null, visible = false;
      function draw(sx){
        var sy = 34 + Math.pow((sx - 160)/150, 2)*26;
        sun.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ')');
        var ang = clamp(Math.atan2(sy - B[1], sx - B[0]), -Math.PI/2 - .78, -Math.PI/2 + .78);
        var tx = B[0] + Math.cos(ang)*L, ty = B[1] + Math.sin(ang)*L, cx = B[0], cy = B[1] - L*.55;
        stem.setAttribute('d', 'M' + B[0] + ' ' + B[1] + ' Q ' + cx + ' ' + cy.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1));
        ray.setAttribute('d', 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' L ' + tx.toFixed(1) + ' ' + ty.toFixed(1));
        leaves.forEach(function(e, i){
          var t = .3 + i*.12, u = 1 - t, px = u*u*B[0] + 2*u*t*cx + t*t*tx, py = u*u*B[1] + 2*u*t*cy + t*t*ty;
          var dx = 2*u*(cx - B[0]) + 2*t*(tx - cx), dy = 2*u*(cy - B[1]) + 2*t*(ty - cy), tan = Math.atan2(dy, dx)*180/Math.PI;
          var side = i % 2 ? 1 : -1, off = 9 - i*.6, nx = px - Math.sin(Math.atan2(dy, dx))*off*side*-1, ny = py + Math.cos(Math.atan2(dy, dx))*off*side*-1;
          e.setAttribute('cx', nx.toFixed(1)); e.setAttribute('cy', ny.toFixed(1));
          e.setAttribute('transform', 'rotate(' + (tan + side*38).toFixed(1) + ' ' + nx.toFixed(1) + ' ' + ny.toFixed(1) + ')');
        });
        bud.setAttribute('cx', tx.toFixed(1)); bud.setAttribute('cy', ty.toFixed(1));
      }
      if (reduce){ draw(262); return; }
      function loop(){ cur += (target - cur)*.08; draw(cur); raf = (visible && Math.abs(target - cur) > .2) ? requestAnimationFrame(loop) : null; }
      function kick(){ if (!raf) raf = requestAnimationFrame(loop); }
      var pointer = false;
      function fromScroll(){
        if (pointer) return;
        var b = fig.getBoundingClientRect(), p = clamp((innerHeight - b.top) / (innerHeight + b.height), 0, 1);
        target = 52 + p*216; kick();
      }
      fig.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; pointer = true; var b = svg.getBoundingClientRect(); target = clamp((e.clientX - b.left)/b.width*320, 30, 290); kick(); });
      fig.addEventListener('pointerleave', function(){ pointer = false; fromScroll(); });
      new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible) fromScroll(); }, {threshold:0}).observe(fig);
      addEventListener('scroll', function(){ if (visible) fromScroll(); }, {passive:true});
      draw(cur);
    });
  }

  /* ---------- acende ao entrar na tela (Cultivo.inview) ----------
     adiciona .is-in uma vez; com movimento reduzido, na hora (o CSS mostra o estado final) */
  function inview(nodes, o){
    nodes = [].slice.call(nodes); o = o || {};
    if (reduce){ nodes.forEach(function(n){ n.classList.add('is-in'); }); return; }
    var obs = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('is-in'); obs.unobserve(e.target); } });
    }, {threshold: o.threshold || .35});
    nodes.forEach(function(n){ obs.observe(n); });
  }

  /* ---------- chuva de sementes aladas (Cultivo.seedrain) ----------
     .c-seedrain: área própria (nunca sob texto). Sementes giram e derivam; algumas já brotaram no chão.
     Anima só enquanto visível; com movimento reduzido ficam paradas, espalhadas. */
  function seedrain(root, o){
    o = o || {};
    var svg = el('svg', {'aria-hidden':'true'}, null); root.appendChild(svg);
    function seedShape(g){
      el('path', {d:'M0 -2 C 9 -9 15 -25 6 -34 C 0 -26 -3 -14 0 -2Z', fill:'currentColor', 'fill-opacity':'.5'}, g);
      el('ellipse', {cx:0, cy:0, rx:3.4, ry:4.8, fill:'currentColor'}, g);
    }
    function build(){
      svg.textContent = '';
      var R = rng(o.seed || 9), W = root.clientWidth, H = root.clientHeight, n = o.count || 14;
      root.style.setProperty('--h', H + 'px');
      for (var i = 0; i < n; i++){
        var x = W*(.06 + R()*.88);
        var g = el('g', {transform:'translate(' + x.toFixed(1) + ' ' + (reduce ? (H*(.1 + R()*.75)).toFixed(1) : 0) + ')'}, svg);
        if (reduce){ var s0 = el('g', {'class':'sr-seed', transform:'rotate(' + ((R()-.5)*70).toFixed(0) + ')'}, g); seedShape(s0); continue; }
        var fall = el('g', {'class':'sr-fall', style:'--d:' + (6.5 + R()*5).toFixed(2) + 's;--delay:' + (-R()*11).toFixed(2) + 's;--sway:' + ((R()-.5)*70).toFixed(0) + 'px'}, g);
        var spin = el('g', {'class':'sr-spin sr-seed', style:'--s:' + (1.1 + R()*1.3).toFixed(2) + 's;--delay:' + (-R()*3).toFixed(2) + 's'}, fall);
        seedShape(spin);
      }
      for (var j = 0; j < (o.sprouts || 5); j++){
        var sx = W*(.1 + j/(o.sprouts || 5)*.8 + (R()-.5)*.06), sh = 14 + R()*10;
        var sp = el('g', {'class':'sr-sprout', transform:'translate(' + sx.toFixed(1) + ' ' + (H - 4) + ')'}, svg);
        el('path', {d:'M0 0 C 0 -' + (sh*.4).toFixed(1) + ' 1 -' + (sh*.7).toFixed(1) + ' 0 -' + sh.toFixed(1)}, sp);
        var ly = (-sh*.72).toFixed(1);
        el('ellipse', {cx:-4.5, cy:ly, rx:5.2, ry:2.2, transform:'rotate(-48 -4.5 ' + ly + ')'}, sp);
        el('ellipse', {cx:4.5, cy:(-sh*.9).toFixed(1), rx:5.2, ry:2.2, transform:'rotate(48 4.5 ' + (-sh*.9).toFixed(1) + ')'}, sp);
      }
    }
    build();
    // reconstrói quando a área muda de tamanho (o conteúdo ao lado pode crescer depois, ex.: a conversa)
    var t = null, lastH = root.clientHeight, lastW = root.clientWidth;
    function again(){ if (root.clientHeight === lastH && root.clientWidth === lastW) return; lastH = root.clientHeight; lastW = root.clientWidth; clearTimeout(t); t = setTimeout(build, 150); }
    if (window.ResizeObserver) new ResizeObserver(again).observe(root); else addEventListener('resize', again);
    if (!reduce) new IntersectionObserver(function(es){ root.classList.toggle('is-live', es[0].isIntersecting); }).observe(root);
  }

  window.Cultivo = {mycelium:mycelium, heroTree:heroTree, seedfall:seedfall, miniTree:miniTree, growTree:growTree, araucaria:araucaria, rings:rings, mac:mac, forest:forest, cycle:cycle, trail:trail, grow:grow, nav:nav, strata:strata, bio:bio, inview:inview, seedrain:seedrain, reduce:reduce};
})();
