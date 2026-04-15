/* ==========================================================
   RUN IT UP! DALLAS — PROPOSAL v2
   Interactive showcase — vanilla JS, no dependencies
   ========================================================== */
(function(){
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          var parent = entry.target.parentElement;
          var siblings = parent ? parent.querySelectorAll(':scope > .reveal') : [entry.target];
          var idx = Array.prototype.indexOf.call(siblings, entry.target);
          entry.target.style.transitionDelay = Math.min(Math.max(idx,0), 6) * 80 + 'ms';
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- 2. Nav hide-on-scroll-down ---------- */
  var nav = document.querySelector('.nav');
  var lastY = window.scrollY;
  if (nav){
    window.addEventListener('scroll', function(){
      var y = window.scrollY;
      nav.style.transition = 'transform .3s ease';
      nav.style.transform = (y > 80 && y > lastY) ? 'translateY(-100%)' : 'translateY(0)';
      lastY = y;
    }, { passive: true });
  }

  /* ---------- 3. Smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id && id.length > 1 && id.charAt(0) === '#'){
        var t = document.querySelector(id);
        if (t){
          e.preventDefault();
          t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', id);
        }
      }
    });
  });

  /* ==========================================================
     FEATURE 1 — LIVE PHONE (cycling screens + live data)
     ========================================================== */
  (function livePhone(){
    var screens = document.querySelectorAll('.lp-screen');
    var dots = document.querySelectorAll('.lp-dot');
    if (!screens.length) return;

    var active = 0;
    var timer = null;

    function show(idx){
      if (idx === active) return;
      screens.forEach(function(s, i){
        s.classList.remove('is-active','is-leaving');
        if (i === active) s.classList.add('is-leaving');
        if (i === idx) s.classList.add('is-active');
      });
      dots.forEach(function(d,i){ d.classList.toggle('is-active', i === idx); });
      active = idx;
      onScreenChange(idx);
    }

    function next(){ show((active + 1) % screens.length); }
    function startCycle(){ stopCycle(); timer = setInterval(next, 4500); }
    function stopCycle(){ if (timer) clearInterval(timer); timer = null; }

    dots.forEach(function(d){
      d.addEventListener('click', function(){
        var idx = parseInt(d.getAttribute('data-idx'),10);
        show(idx); startCycle();
      });
    });

    // Swipe support
    var viewport = document.getElementById('lpViewport');
    if (viewport){
      var sx = 0;
      viewport.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive:true});
      viewport.addEventListener('touchend', function(e){
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40){
          show(dx < 0 ? (active + 1) % screens.length : (active - 1 + screens.length) % screens.length);
          startCycle();
        }
      });
    }

    /* --- Live data per screen --- */

    // Weather (Open-Meteo, Dallas)
    var weatherLoaded = false;
    function loadWeather(){
      if (weatherLoaded) return;
      weatherLoaded = true;
      fetch('https://api.open-meteo.com/v1/forecast?latitude=32.78&longitude=-96.80&current=temperature_2m,weather_code&temperature_unit=fahrenheit')
        .then(function(r){ return r.json(); })
        .then(function(d){
          var temp = Math.round(d.current.temperature_2m);
          var code = d.current.weather_code;
          var map = {0:['☀','Clear'],1:['🌤','Mostly clear'],2:['⛅','Partly cloudy'],3:['☁','Overcast'],
                     45:['🌫','Fog'],48:['🌫','Fog'],51:['🌦','Drizzle'],61:['🌧','Rain'],
                     63:['🌧','Rain'],65:['🌧','Heavy rain'],71:['🌨','Snow'],
                     80:['🌦','Showers'],95:['⛈','Storm']};
            var m = map[code] || ['☀','Fair'];
          var t = document.getElementById('lpTemp');
          var c = document.getElementById('lpCond');
          var i = document.getElementById('lpIcon');
          if (t) t.textContent = temp + '°';
          if (c) c.textContent = m[1] + ' · perfect run';
          if (i) i.textContent = m[0];
        })
        .catch(function(){
          var t = document.getElementById('lpTemp'); if (t) t.textContent = '72°';
          var c = document.getElementById('lpCond'); if (c) c.textContent = 'Clear · perfect run';
        });
    }
    loadWeather();

    // Tracker animation
    var trackRAF = null, trackStart = 0;
    function startTracker(){
      stopTracker();
      trackStart = performance.now();
      var path = document.getElementById('lpTrackPath');
      var dot = document.getElementById('lpTrackDot');
      var pathLen = path ? path.getTotalLength() : 400;
      if (path){ path.setAttribute('stroke-dasharray', pathLen); path.setAttribute('stroke-dashoffset', pathLen); }
      function tick(now){
        var t = (now - trackStart) / 1000; // seconds elapsed
        var duration = 10; // full animation 10s
        var p = Math.min(t / duration, 1);
        var miles = (p * 3.24).toFixed(2);
        var totalSec = Math.floor(p * (28*60 + 11));
        var mins = Math.floor(totalSec / 60);
        var secs = totalSec % 60;
        var paceSec = p > 0.02 ? Math.floor(totalSec / Math.max(parseFloat(miles), 0.01)) : 0;
        var pm = Math.floor(paceSec/60), ps = paceSec%60;
        var mEl = document.getElementById('lpMiles');
        var tEl = document.getElementById('lpTime');
        var pEl = document.getElementById('lpPace');
        if (mEl) mEl.textContent = miles;
        if (tEl) tEl.textContent = mins + ':' + (secs<10?'0':'') + secs;
        if (pEl) pEl.textContent = p > 0.02 ? (pm + ':' + (ps<10?'0':'') + ps) : '0:00';
        if (path) path.setAttribute('stroke-dashoffset', pathLen * (1 - p));
        if (dot){
          var pt = path ? path.getPointAtLength(pathLen * p) : {x:30,y:220};
          dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        }
        if (p < 1) trackRAF = requestAnimationFrame(tick);
      }
      trackRAF = requestAnimationFrame(tick);
    }
    function stopTracker(){ if (trackRAF) cancelAnimationFrame(trackRAF); trackRAF = null; }

    // Chat typing + new message
    var chatTimer = null;
    var chatMsgs = ["I got you 🏃🏾","Pulling up too","Parking at the lot","Who's leading warmups?"];
    var chatIdx = 0;
    function startChat(){
      stopChat();
      var body = document.getElementById('lpChatBody');
      var typing = document.getElementById('lpTyping');
      if (!body || !typing) return;
      typing.style.display = 'flex';
      chatTimer = setTimeout(function addMsg(){
        typing.style.display = 'none';
        var b = document.createElement('div');
        b.className = 'lp-bubble lp-bubble--me';
        b.textContent = chatMsgs[chatIdx % chatMsgs.length];
        chatIdx++;
        body.appendChild(b);
        // cap message count
        while (body.children.length > 5) body.removeChild(body.firstChild);
        chatTimer = setTimeout(function(){
          typing.style.display = 'flex';
          chatTimer = setTimeout(addMsg, 1500);
        }, 2000);
      }, 1400);
    }
    function stopChat(){ if (chatTimer) clearTimeout(chatTimer); chatTimer = null; }

    // Stats rolling counter + badge unlock
    var statsRAF = null;
    function startStats(){
      stopStats();
      var el = document.getElementById('lpRollStreak');
      var badge = document.getElementById('lpBadgePop');
      if (!el) return;
      var start = performance.now(), from = 0, to = 22, dur = 1800;
      function tick(now){
        var p = Math.min((now - start)/dur, 1);
        var eased = 1 - Math.pow(1-p, 3);
        el.textContent = Math.round(from + (to-from)*eased);
        if (p < 1) statsRAF = requestAnimationFrame(tick);
        else if (badge){
          badge.classList.remove('is-unlocked');
          void badge.offsetWidth;
          badge.classList.add('is-unlocked');
        }
      }
      statsRAF = requestAnimationFrame(tick);
    }
    function stopStats(){ if (statsRAF) cancelAnimationFrame(statsRAF); statsRAF = null; }

    function onScreenChange(idx){
      stopTracker(); stopChat(); stopStats();
      var name = screens[idx].getAttribute('data-screen');
      if (name === 'track') startTracker();
      else if (name === 'chat') startChat();
      else if (name === 'stats') startStats();
      else if (name === 'home') loadWeather();
    }

    // kick off first state
    onScreenChange(0);

    // Only cycle when in view
    if ('IntersectionObserver' in window){
      var phoneObs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting) startCycle();
          else stopCycle();
        });
      }, { threshold: 0.2 });
      phoneObs.observe(document.getElementById('livePhone'));
    } else {
      startCycle();
    }
  })();

  /* ==========================================================
     FEATURE 2 — TOOL CONSOLIDATION CALCULATOR
     ========================================================== */
  (function toolCalc(){
    var calc = document.getElementById('toolCalc');
    if (!calc) return;

    var state = {linktree:12, forms:8, eventbrite:150, dms:200, groupme:12, merch:0, reports:4};

    function money(n){ return Math.round(n).toLocaleString(); }

    function compute(){
      // Monthly SaaS spend:
      // Linktree = state.linktree
      // Eventbrite fee % on (tickets * $25): 3.7% + $1.79/ticket
      var ebFees = state.eventbrite * 1.79 + (state.eventbrite * 25 * 0.037);
      var spend = state.linktree + ebFees;

      // Hours/month lost:
      // Forms: 0.75 hr per event managing + exports
      // DMs: 1 min average each => state.dms / 60
      // Groupme: 0.3 hr per channel/month moderation
      // Reports: 6 hr each quarterly report => (state.reports * 6) / 3 (per month)
      var hours = (state.forms * 0.75) + (state.dms / 60) + (state.groupme * 0.3) + (state.reports * 6 / 3);

      // Revenue left on table:
      // Ticketing fees forfeited in-app (same ebFees)
      // Offline merch lost: members * 0.08 purchase rate * $35 AOV (not-served online)
      var lostMerch = state.merch * 0.08 * 35;
      var lost = ebFees + lostMerch;

      var mEl = document.getElementById('tcMoneyOut');
      var hEl = document.getElementById('tcHoursOut');
      var lEl = document.getElementById('tcLostOut');
      if (mEl) mEl.textContent = money(spend);
      if (hEl) hEl.textContent = Math.round(hours);
      if (lEl) lEl.textContent = money(lost);

      // Update per-card cost readouts
      var map = {
        linktree: '$' + state.linktree + '/mo',
        forms: Math.round(state.forms * 0.75) + ' hrs/mo',
        eventbrite: '$' + money(ebFees) + '/mo',
        dms: Math.round(state.dms/60) + ' hrs/mo',
        groupme: state.groupme + ' channels',
        merch: '$' + money(lostMerch) + '/mo',
        reports: Math.round(state.reports * 6) + ' hrs/qtr'
      };
      calc.querySelectorAll('.tc-card').forEach(function(card){
        var k = card.getAttribute('data-tool');
        var cost = card.querySelector('[data-cost]');
        if (cost && map[k]) cost.textContent = map[k];
      });
    }

    calc.querySelectorAll('.tc-slider').forEach(function(sl){
      var key = sl.getAttribute('data-key');
      var val = sl.parentElement.querySelector('[data-val]');
      function update(){
        state[key] = parseFloat(sl.value);
        var unit = sl.getAttribute('data-unit');
        var disp = sl.value;
        if (unit === '$/mo') disp = '$' + sl.value;
        if (val) val.textContent = disp;
        // Fill gradient track
        var min = parseFloat(sl.min), max = parseFloat(sl.max);
        var pct = ((parseFloat(sl.value) - min) / (max - min)) * 100;
        sl.style.background = 'linear-gradient(90deg, var(--lime) 0%, var(--lime) '+pct+'%, rgba(255,255,255,0.12) '+pct+'%)';
        compute();
      }
      sl.addEventListener('input', update);
      update();
    });
    compute();
  })();

  /* ==========================================================
     FEATURE 3 — ROI / REVENUE CALCULATOR
     ========================================================== */
  (function roi(){
    var root = document.getElementById('roi');
    if (!root) return;

    var els = {
      members: document.getElementById('rMembers'),
      merch: document.getElementById('rMerch'),
      aov: document.getElementById('rAov'),
      sp: document.getElementById('rSP'),
      sprice: document.getElementById('rSPrice')
    };
    var vals = {
      members: document.getElementById('rvMembers'),
      merch: document.getElementById('rvMerch'),
      aov: document.getElementById('rvAov'),
      sp: document.getElementById('rvSP'),
      sprice: document.getElementById('rvSPrice')
    };
    var out = {
      merch: document.getElementById('oMerch'),
      sponsor: document.getElementById('oSponsor'),
      total: document.getElementById('oTotal'),
      barMerch: document.getElementById('barMerch'),
      barSponsor: document.getElementById('barSponsor')
    };

    var animated = {merch:0, sponsor:0, total:0};
    var targets = {merch:0, sponsor:0, total:0};
    var raf = null;

    function fmt(n){ return Math.round(n).toLocaleString(); }
    function fillSlider(sl){
      var min = parseFloat(sl.min), max = parseFloat(sl.max);
      var pct = ((parseFloat(sl.value) - min) / (max - min)) * 100;
      sl.style.background = 'linear-gradient(90deg, var(--lime) 0%, var(--lime) '+pct+'%, rgba(255,255,255,0.12) '+pct+'%)';
    }

    function compute(){
      var m = +els.members.value;
      var r = (+els.merch.value) / 100;
      var a = +els.aov.value;
      var sp = +els.sp.value;
      var sprice = +els.sprice.value;

      // Annual merch revenue: members buying at rate, 4 drops/year avg = members*rate*aov*4
      var merchRev = m * r * a * 4;
      var sponsorRev = sp * 4 * sprice;
      var total = merchRev + sponsorRev;

      targets.merch = merchRev;
      targets.sponsor = sponsorRev;
      targets.total = total;

      vals.members.textContent = m.toLocaleString();
      vals.merch.textContent = Math.round(r*100) + '%';
      vals.aov.textContent = '$' + a;
      vals.sp.textContent = sp;
      vals.sprice.textContent = '$' + sprice.toLocaleString();

      // Bars — scale to max of (merch, sponsor)
      var max = Math.max(merchRev, sponsorRev, 1);
      out.barMerch.style.width = (merchRev / max * 100) + '%';
      out.barSponsor.style.width = (sponsorRev / max * 100) + '%';

      if (!raf) raf = requestAnimationFrame(animate);
    }

    function animate(){
      var done = true;
      ['merch','sponsor','total'].forEach(function(k){
        var diff = targets[k] - animated[k];
        if (Math.abs(diff) > 1){
          animated[k] += diff * 0.18;
          done = false;
        } else { animated[k] = targets[k]; }
        out[k].textContent = fmt(animated[k]);
      });
      if (done){ raf = null; } else { raf = requestAnimationFrame(animate); }
    }

    Object.keys(els).forEach(function(k){
      els[k].addEventListener('input', function(){ fillSlider(els[k]); compute(); });
      fillSlider(els[k]);
    });
    compute();
  })();

  /* ==========================================================
     FEATURE 4 — COMMUNITY PULSE CANVAS
     ========================================================== */
  (function pulse(){
    var canvas = document.getElementById('pulseCanvas');
    if (!canvas || reduced) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function resize(){
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
      initNodes();
    }

    var nodes = [];
    var edges = [];
    var isMobile = window.innerWidth < 720;

    function initNodes(){
      var count = isMobile ? 90 : 220;
      nodes = [];
      for (var i = 0; i < count; i++){
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.8 + 1,
          hot: 0
        });
      }
      edges = [];
    }
    resize();
    window.addEventListener('resize', resize);

    var running = true;
    if ('IntersectionObserver' in window){
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ running = e.isIntersecting; if (running) frame(); });
      }, {threshold:0.05});
      obs.observe(canvas);
    }

    var lastEdge = 0;
    function frame(){
      if (!running) return;
      ctx.clearRect(0,0,W,H);

      // edges
      var now = performance.now();
      if (now - lastEdge > 180 && edges.length < 30){
        var a = nodes[(Math.random()*nodes.length)|0];
        var b = nodes[(Math.random()*nodes.length)|0];
        if (a !== b){
          var dx = a.x - b.x, dy = a.y - b.y;
          if (dx*dx + dy*dy < 40000){
            edges.push({a:a,b:b,life:1});
            a.hot = 1; b.hot = 1;
          }
        }
        lastEdge = now;
      }

      for (var i = edges.length - 1; i >= 0; i--){
        var e = edges[i];
        e.life -= 0.012;
        if (e.life <= 0){ edges.splice(i,1); continue; }
        ctx.strokeStyle = 'rgba(191,255,0,' + (e.life * 0.5) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.stroke();
      }

      // nodes
      for (var j = 0; j < nodes.length; j++){
        var n = nodes[j];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.hot *= 0.97;

        var glow = n.hot;
        if (glow > 0.1){
          ctx.fillStyle = 'rgba(191,255,0,' + (glow * 0.3) + ')';
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.fillStyle = glow > 0.2 ? '#BFFF00' : 'rgba(191,255,0,0.55)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }
    frame();
  })();

  /* ==========================================================
     FEATURE 5 — SCROLL-DRIVEN BEFORE/AFTER
     ========================================================== */
  (function scrollBA(){
    var rows = document.querySelectorAll('#baGrid .ba-row');
    if (!rows.length) return;

    function update(){
      var vh = window.innerHeight;
      rows.forEach(function(row){
        var r = row.getBoundingClientRect();
        // progress 0 when entering from below, 1 when centered
        var center = r.top + r.height/2;
        var p = 1 - Math.min(Math.max((center - vh*0.2) / (vh*0.6), 0), 1);
        row.style.setProperty('--ba-progress', p.toFixed(3));
      });
    }
    update();
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
  })();

  /* ==========================================================
     FEATURE 6 — SPONSOR INVENTORY SWITCHER
     ========================================================== */
  (function sponsorInv(){
    var root = document.getElementById('si');
    if (!root) return;
    var tabs = root.querySelectorAll('.si__tab');
    var demos = root.querySelectorAll('.si__demo');
    tabs.forEach(function(t){
      t.addEventListener('click', function(){
        var key = t.getAttribute('data-si');
        tabs.forEach(function(x){
          var active = x === t;
          x.classList.toggle('is-active', active);
          x.setAttribute('aria-selected', active ? 'true' : 'false');
          if (active) { x.removeAttribute('tabindex'); } else { x.setAttribute('tabindex','-1'); }
        });
        demos.forEach(function(d){ d.classList.toggle('is-active', d.getAttribute('data-demo') === key); });
      });
    });
  })();

  /* ==========================================================
     FEATURE 7 — CUSTOM CURSOR + MAGNETIC ELEMENTS (desktop)
     ========================================================== */
  (function cursor(){
    if (matchMedia('(hover:none),(pointer:coarse)').matches) return;
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;
    document.body.classList.add('cursor-on');

    var mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', function(e){ mx = e.clientX; my = e.clientY; });
    window.addEventListener('mouseleave', function(){ document.body.classList.remove('cursor-on'); });
    window.addEventListener('mouseenter', function(){ document.body.classList.add('cursor-on'); });

    function tick(){
      dot.style.transform = 'translate('+mx+'px,'+my+'px) translate(-50%,-50%)';
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';
      requestAnimationFrame(tick);
    }
    tick();

    document.querySelectorAll('.magnetic, .btn, .nav__cta, button, a').forEach(function(el){
      el.addEventListener('mouseenter', function(){ document.body.classList.add('cursor-magnet'); });
      el.addEventListener('mouseleave', function(){ document.body.classList.remove('cursor-magnet'); el.style.transform=''; });
      if (el.classList.contains('magnetic')){
        el.addEventListener('mousemove', function(e){
          var r = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width/2)) * 0.25;
          var dy = (e.clientY - (r.top + r.height/2)) * 0.25;
          el.style.transform = 'translate('+dx+'px,'+dy+'px)';
        });
      }
    });
  })();

  /* ==========================================================
     FEATURE 8 — ANIMATED COUNT-UP METRICS (admin tiles)
     ========================================================== */
  (function countUp(){
    var els = document.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in window) || !els.length){
      els.forEach(function(el){ el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix')||''); });
      return;
    }
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var isFloat = String(target).indexOf('.') > -1;
        var start = performance.now(), dur = 1400;
        function tick(now){
          var p = Math.min((now-start)/dur, 1);
          var eased = 1 - Math.pow(1-p, 3);
          var val = target * eased;
          el.textContent = (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, {threshold:0.3});
    els.forEach(function(el){ obs.observe(el); });
  })();

  /* ==========================================================
     FEATURE 9 — ADMIN DASHBOARD (tabs + push + CSV)
     ========================================================== */
  (function admin(){
    var tabs = document.querySelectorAll('.admin__tab');
    var panels = document.querySelectorAll('.admin__panel');
    tabs.forEach(function(t){
      t.addEventListener('click', function(){
        var key = t.getAttribute('data-tab');
        tabs.forEach(function(x){
          var active = x === t;
          x.classList.toggle('is-active', active);
          x.setAttribute('aria-selected', active ? 'true' : 'false');
          if (active) { x.removeAttribute('tabindex'); } else { x.setAttribute('tabindex','-1'); }
        });
        panels.forEach(function(p){ p.classList.toggle('is-active', p.getAttribute('data-panel') === key); });
      });
    });

    // Push modal
    var modal = document.getElementById('pushModal');
    var pushBtn = document.getElementById('pushBtn');
    var body = document.getElementById('pushBody');
    var title = document.getElementById('pushTitle');
    var count = document.getElementById('pushCount');
    var mpTitle = document.getElementById('mpTitle');
    var mpBody = document.getElementById('mpBody');
    var sendBtn = document.getElementById('pushSend');

    var lastFocus = null;
    function getFocusable(){
      return modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    }
    function openModal(){
      lastFocus = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
      setTimeout(function(){ title.focus(); }, 100);
    }
    function closeModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    if (pushBtn) pushBtn.addEventListener('click', openModal);
    modal.querySelectorAll('[data-close]').forEach(function(el){ el.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function(e){
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape'){ closeModal(); return; }
      if (e.key === 'Tab'){
        var f = getFocusable();
        if (!f.length) return;
        var first = f[0], last = f[f.length-1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });

    function sync(){
      mpTitle.textContent = title.value || 'Katy Trail run — Saturday 6AM';
      mpBody.textContent = body.value || 'Pulling up? Tap to RSVP. Weather looks perfect.';
      count.textContent = body.value.length;
    }
    title.addEventListener('input', sync);
    body.addEventListener('input', sync);
    sync();

    if (sendBtn) sendBtn.addEventListener('click', function(){
      closeModal();
      toast('Push queued · 317 members');
    });

    // CSV download
    var csvBtn = document.getElementById('csvBtn');
    if (csvBtn) csvBtn.addEventListener('click', function(){
      var rows = [
        ['name','neighborhood','streak_weeks','last_run_date','miles_last','total_runs'],
        ['Jordan B.','South Dallas','14','2026-04-11','3.2','58'],
        ['Tee W.','Oak Cliff','22','2026-04-11','4.1','89'],
        ['Mia G.','Deep Ellum','6','2026-04-08','2.8','21'],
        ['Kendrick L.','Pleasant Grove','11','2026-04-11','3.2','44'],
        ['Rasheed A.','South Dallas','9','2026-04-11','5.0','36'],
        ['Dani O.','Bishop Arts','18','2026-04-11','3.2','67'],
        ['Marcus T.','South Dallas','4','2026-04-11','2.8','12'],
        ['Imani S.','Oak Cliff','15','2026-04-11','3.2','55']
      ];
      var csv = rows.map(function(r){ return r.join(','); }).join('\n');
      var blob = new Blob([csv], {type:'text/csv'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'runitup-members-sample.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      toast('members.csv downloaded');
    });
  })();

  /* ==========================================================
     TOAST
     ========================================================== */
  var toastTimer = null;
  function toast(msg){
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove('is-visible'); }, 2800);
  }

  /* ==========================================================
     FEATURE 8b — TYPING ANIMATION (why section)
     ========================================================== */
  (function typed(){
    var el = document.querySelector('.typed');
    if (!el || reduced) { if (el){ el.textContent = el.getAttribute('data-typed'); el.classList.add('is-done'); } return; }
    var text = el.getAttribute('data-typed') || '';
    var i = 0;
    var started = false;
    function step(){
      if (i <= text.length){
        el.textContent = text.slice(0, i++);
        setTimeout(step, 28);
      } else {
        el.classList.add('is-done');
      }
    }
    if ('IntersectionObserver' in window){
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting && !started){ started = true; step(); obs.unobserve(el); }
        });
      }, {threshold:0.4});
      obs.observe(el);
    } else { step(); }
  })();

})();
