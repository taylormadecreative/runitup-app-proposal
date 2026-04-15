/* Run It UP! Dallas — Proposal
   Lightweight scroll reveal + nav polish */
(function(){
  'use strict';

  // IntersectionObserver for reveal animations
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          // Stagger siblings within same parent for a cleaner cascade
          var parent = entry.target.parentElement;
          var siblings = parent ? parent.querySelectorAll('.reveal') : [entry.target];
          var index = Array.prototype.indexOf.call(siblings, entry.target);
          entry.target.style.transitionDelay = Math.min(index, 6) * 80 + 'ms';
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function(el){ io.observe(el); });
  } else {
    // Fallback
    els.forEach(function(el){ el.classList.add('is-visible'); });
  }

  // Nav hide-on-scroll-down / show-on-scroll-up
  var nav = document.querySelector('.nav');
  var lastY = window.scrollY;
  var ticking = false;
  if (nav){
    window.addEventListener('scroll', function(){
      if (ticking) return;
      window.requestAnimationFrame(function(){
        var y = window.scrollY;
        if (y > 80 && y > lastY){
          nav.style.transform = 'translateY(-100%)';
        } else {
          nav.style.transform = 'translateY(0)';
        }
        nav.style.transition = 'transform .3s ease';
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  // Smooth-scroll for anchor links (beyond CSS for older Safari)
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id.length > 1){
        var t = document.querySelector(id);
        if (t){
          e.preventDefault();
          t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', id);
        }
      }
    });
  });
})();
