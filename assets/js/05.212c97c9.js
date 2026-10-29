
(function(){
  if(!window.gsap || !window.ScrollTrigger || !window.Lenis){ return; }
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis: scorrimento morbido su tutto il sito ── */
  var lenis = new Lenis({ lerp:0.1, smoothWheel:true });
  window.tmcLenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  /* finestre, menu e caroselli scorrono per conto loro */
  var perConto = document.querySelectorAll('dialog, .ooh-car-track, .ooh-mini-fila, #menu');
  for(var i=0;i<perConto.length;i++){ perConto[i].setAttribute('data-lenis-prevent',''); }

  /* ── GSAP solo nei Progetti ── */
  var pg = document.getElementById('pg-progetti');
  var cards = pg ? Array.prototype.slice.call(pg.querySelectorAll('.progetto-card')) : [];
  var cta = pg ? pg.querySelector('.prog-cta') : null;
  /* queste le muove GSAP: tolgo la comparsa di sempre */
  cards.concat(cta ? [cta] : []).forEach(function(el){ el.classList.remove('rv'); });

  var avviato = false;
  function avvia(){
    if(avviato || !pg || !pg.classList.contains('on')){ return; }
    avviato = true;
    gsap.set(cards, { opacity:0, y:48 });
    ScrollTrigger.batch(cards, {
      start:'top 90%', once:true,
      onEnter:function(gruppo){
        gsap.to(gruppo, { opacity:1, y:0, duration:.8, ease:'power3.out', stagger:.09,
                          overwrite:true, clearProps:'transform,opacity' });
      }
    });
    if(cta){
      var tl = gsap.timeline({ scrollTrigger:{ trigger:cta, start:'top 82%', once:true } });
      tl.from(cta, { y:40, opacity:0, duration:.7, ease:'power3.out', clearProps:'transform,opacity' })
        .from(cta.querySelectorAll('.prog-cta-fila img'), { x:-28, opacity:0, scale:.85, duration:.5, ease:'power2.out', stagger:.07 }, '-=.35')
        .from(cta.querySelector('.prog-cta-fila span'), { scale:0, rotation:-90, duration:.45, ease:'back.out(2.2)' }, '-=.2')
        .from(cta.querySelectorAll('h2, p'), { y:18, opacity:0, duration:.6, ease:'power3.out', stagger:.08 }, '-=.35')
        .from(cta.querySelector('.prog-cta-bt'), { y:12, opacity:0, duration:.5, ease:'power3.out' }, '-=.35');
    }
    ScrollTrigger.refresh();
  }
  /* il sito cambia pagina senza ricaricare: si riparte dall'alto e si ricalcola */
  document.addEventListener('tmc:page', function(){
    lenis.scrollTo(0, { immediate:true });
    requestAnimationFrame(function(){ avvia(); ScrollTrigger.refresh(); });
  });
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  avvia();
})();
