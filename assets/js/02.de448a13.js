
(function(){
  "use strict";

  var riavviaPila = null;
  var PG = ['home','integrate','ooh','maxi-affissioni','taxiadv','campagne-taxi','simulatore','travel','richiesta','progetti','contattaci','privacy','cookie'];

  /* ── pagine separate ──────────────────────────────────────────────────
     Il sito gira in due modi. Come pagina unica (anteprima locale, artifact)
     e come pagine vere: in quel caso il build mette in TMC_PAGINE la pagina
     corrente e l'indirizzo di ognuna, e la navigazione diventa un cambio di
     pagina invece di un cambio di sezione. Senza TMC_PAGINE nulla cambia. */
  var MP = window.TMC_PAGINE || null;
  function urlPagina(id, coda){
    var slug = MP.url[id]; if(slug === undefined){ slug = ''; }
    return new URL(slug + (coda ? '#' + coda : ''), document.baseURI).href;
  }
  function codaRichiesta(id, percorso){
    return (id === 'richiesta' && percorso.indexOf('/') !== -1) ? percorso.slice(percorso.indexOf('/') + 1) : '';
  }
  function percorsoDaIndirizzo(){
    var h = (location.hash || '').replace('#','');
    if(!MP){ return h || 'home'; }
    /* sulla pagina della richiesta l'ancora e' sempre l'offerta scelta,
       anche quando si chiama come una pagina (per esempio "travel") */
    if(h && MP.corrente === 'richiesta' && h.indexOf('=') === -1){ return 'richiesta/' + h; }
    if(h && PG.indexOf(h.split('/')[0]) !== -1){ return h; }            /* vecchi link tipo #ooh */
    return MP.corrente;
  }
  var poco = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── caricamento ─────────────────────────────────────────────
     Un solo indicatore per tutto il sito. Chi aspetta qualcosa chiama
     tmcCarica.inizia(motivo) e poi tmcCarica.finisci(motivo): il marchio
     resta finche' c'e' almeno un motivo aperto. Compare dopo 250 ms, cosi'
     le attese brevi non lampeggiano; una volta comparso resta almeno il
     tempo della sua animazione. Le attese delle pagine sono limitate;
     i moduli terminano anche in caso di errore o timeout. */
  var carica = (function(){
    var box = document.getElementById('carica');
    if(!box){ return { inizia:function(){}, finisci:function(){} }; }
    var video = box.querySelector('video'), logo = box.querySelector('.carica-logo'),
        testo = document.getElementById('carica-testo');
    var aperti = {}, conta = 0, ritardo = null, lento = null, chiusura = null,
        visibileDa = 0, lineaLenta = false;
    /* il marchio si disegna a poco piu' di meta' velocita': a ritmo pieno,
       un secondo, sembrava uno scatto piu' che un'attesa */
    var RITMO = 0.55;
    function fermaSuMarchio(){
      if(!video){ return; }
      var ferma = function(){
        try{ video.pause(); video.currentTime = Math.max(0, (video.duration || 1.05) - 0.04); }catch(e){}
      };
      if(video.readyState >= 1){ ferma(); } else { video.addEventListener('loadedmetadata', ferma, { once:true }); }
    }
    function scrivi(){
      var fuori = navigator.onLine === false;
      box.classList.toggle('offline', fuori);
      box.classList.toggle('problema', fuori || lineaLenta);
      testo.textContent = fuori ? 'Sei offline'
                        : lineaLenta ? 'La connessione è lenta, ancora un momento…'
                        : 'Caricamento…';
    }
    function mostra(){
      clearTimeout(chiusura);
      scrivi();
      if(!box.classList.contains('on')){
        box.hidden = false;
        void box.offsetWidth;
        box.classList.add('on');
        visibileDa = Date.now();
        if(video && !logo.classList.contains('senza-video')){
          if(poco){
            fermaSuMarchio();   /* senza movimento: il marchio gia' disegnato, fermo */
          } else {
            try{ video.currentTime = 0; }catch(e){}
            video.defaultPlaybackRate = RITMO;
            video.playbackRate = RITMO;
            var gioca = video.play();
            /* riproduzione automatica negata: il marchio intero, e l'anello gira */
            if(gioca && gioca.catch){ gioca.catch(fermaSuMarchio); }
          }
        }
      }
      clearTimeout(lento);
      lento = setTimeout(function(){ lineaLenta = true; scrivi(); }, 3000);
    }
    function nascondi(){
      /* almeno 900 ms: il tempo che il cerchio si apra e il marchio si disegni,
         se no l'animazione si vede a meta' e sembra un inciampo */
      var resta = Math.max(0, (poco ? 400 : 900) - (Date.now() - visibileDa));
      chiusura = setTimeout(function(){
        box.classList.remove('on');
        clearTimeout(lento); lineaLenta = false;
        setTimeout(function(){
          if(box.classList.contains('on')){ return; }
          box.hidden = true;
          /* il bianco se ne va solo a cerchio richiuso, se no lampeggia il blu */
          box.classList.remove('problema', 'offline');
          if(video){ video.pause(); }
        }, poco ? 220 : 520);
      }, resta);
    }
    function inizia(motivo){
      if(aperti[motivo]){ return; }
      aperti[motivo] = true; conta++;
      if(box.classList.contains('on')){ clearTimeout(chiusura); scrivi(); return; }
      if(conta === 1){
        clearTimeout(ritardo);
        ritardo = setTimeout(mostra, motivo === 'offline' ? 0 : 250);
      }
    }
    function finisci(motivo){
      if(!aperti[motivo]){ return; }
      delete aperti[motivo]; conta--;
      if(conta > 0){ scrivi(); return; }
      clearTimeout(ritardo);
      if(box.classList.contains('on')){ nascondi(); }
    }
    if(video){ video.addEventListener('error', function(){ logo.classList.add('senza-video'); }); }
    return { inizia:inizia, finisci:finisci };
  })();
  window.tmcCarica = carica;

  /* Il contenuto resta accessibile anche se una risorsa non risponde. */
  if(document.readyState !== 'complete'){
    carica.inizia('pagina');
    setTimeout(function(){ carica.finisci('pagina'); }, 1800);
    window.addEventListener('load', function(){ carica.finisci('pagina'); });
  }

  /* cambio pagina: aspetto solo le foto dentro lo schermo che non hanno
     ancora finito. "Finito" vale anche per quelle andate in errore: il loro
     evento e' gia' passato e non tornerebbe piu', e il marchio restava
     acceso fino al tetto degli 8 secondi. Quelle piu' in basso arrivano
     scorrendo, spesso in lazy: aspettarle vorrebbe dire bloccare per niente. */
  var nCambio = 0, cambioAperto = null;
  document.addEventListener('tmc:page', function(ev){
    if(cambioAperto){ carica.finisci(cambioAperto); cambioAperto = null; }
    var pag = document.getElementById('pg-' + ev.detail.page);
    if(!pag){ return; }
    var limite = window.innerHeight, attese = [];
    var imgs = pag.querySelectorAll('img');
    for(var i=0;i<imgs.length;i++){
      var im = imgs[i];
      if(!im.getAttribute('src') || im.complete || im.loading === 'lazy'){ continue; }
      var r = im.getBoundingClientRect();
      if((!r.width && !r.height) || r.top > limite || r.bottom < 0 ||
         r.left > window.innerWidth || r.right < 0){ continue; }
      attese.push(im);
    }
    if(!attese.length){ return; }
    var motivo = 'cambio' + (++nCambio), restano = attese.length, chiuso = false;
    cambioAperto = motivo;
    carica.inizia(motivo);
    function chiudi(){
      if(chiuso){ return; } chiuso = true;
      carica.finisci(motivo);
      if(cambioAperto === motivo){ cambioAperto = null; }
    }
    function una(){ if(--restano <= 0){ chiudi(); } }
    /* tetto di 2,5 secondi: una foto lenta non deve mai tenere la pagina
       coperta. Scaduto il tempo la pagina si mostra e la foto arriva da sola. */
    setTimeout(chiudi, 2500);
    for(var k=0;k<attese.length;k++){
      attese[k].addEventListener('load', una, { once:true });
      attese[k].addEventListener('error', una, { once:true });
    }
  });

  /* Offline non copriamo contenuti gia' disponibili; i moduli segnalano l'errore. */

  /* Anticipiamo le immagini vicine, senza scaricare le altre pagine.
     Le gallerie aperte ricevono tutte le anteprime insieme. */
  var mediaVicini = new IntersectionObserver(function(voci){
    voci.forEach(function(voce){
      if(!voce.isIntersecting)return;
      var im=voce.target,pg=im.closest('.pg');
      if(pg&&!pg.classList.contains('on'))return;
      im.loading='eager'; mediaVicini.unobserve(im);
    });
  },{rootMargin:'800px 0px'});
  function preparaFoto(radice,tutte){
    radice.querySelectorAll('img').forEach(function(im){
      if(im.closest('dialog')&&!im.closest('dialog').open)return;
      if(tutte){im.loading='eager';}else{mediaVicini.observe(im);}
    });
  }
  document.addEventListener('tmc:page',function(ev){
    var pg=document.getElementById('pg-'+ev.detail.page);if(pg)preparaFoto(pg,false);
    document.querySelectorAll('.caso-dialog video').forEach(function(v){v.pause();});
  });

  document.documentElement.classList.add('js');

  /* ── navigazione ─────────────────────────────────────── */
  function vai(id){
    var percorso = String(id || 'home');
    id = percorso.split('/')[0];
    if(PG.indexOf(id) === -1){ id = 'home'; }
    if(id !== 'richiesta'){ percorso = id; }
    if(MP && id !== MP.corrente){ location.href = urlPagina(id, codaRichiesta(id, percorso)); return null; }
    var i, p;
    for(i=0;i<PG.length;i++){
      p = document.getElementById('pg-' + PG[i]);
      if(p){ p.classList.toggle('on', PG[i] === id); }
    }
    var link = document.querySelectorAll('.nav a[data-go], #menu a[data-go], .tendina a[data-go], .nav-gruppo>button[data-go]');
    for(i=0;i<link.length;i++){
      if(link[i].getAttribute('data-go') === id){ link[i].setAttribute('aria-current','page'); }
      else{ link[i].removeAttribute('aria-current'); }
    }
    /* "I nostri servizi" resta acceso anche dentro le sue tre sotto-pagine */
    var btnSrv = document.getElementById('btn-servizi');
    if(btnSrv && ['ooh','taxiadv','campagne-taxi','integrate','simulatore'].indexOf(id) !== -1){
      btnSrv.setAttribute('aria-current','page');
    }
    chiudiTendina();
    chiudi();
    window.scrollTo(0,0);
    try{
      if(MP){ history.replaceState(null, '', location.pathname + location.search + (codaRichiesta(id, percorso) ? '#' + codaRichiesta(id, percorso) : '')); }
      else { history.replaceState(null,'','#' + percorso); }
    }catch(e){}
    document.dispatchEvent(new CustomEvent('tmc:page', {detail:{page:id,route:percorso}}));
    rivela();
    reteSicurezza();
    if(id === 'integrate' && riavviaPila){ riavviaPila(); }
    if(id === 'simulatore'){
      var pr = document.getElementById('promo');
      if(pr && !pr.hidden){ pr.classList.remove('su');
        setTimeout(function(){ pr.hidden = true; }, 560); }
    }
    return document.getElementById('pg-' + id);
  }
  window.tmcVai = function(percorso){
    if(MP){ return vai(percorso); }
    if(location.hash !== '#' + percorso){
      try{ history.pushState(null,'','#' + percorso); }catch(e){}
    }
    return vai(percorso);
  };
  window.addEventListener('popstate', function(){ vai(percorsoDaIndirizzo()); });
  window.addEventListener('hashchange', function(){ vai(percorsoDaIndirizzo()); });
  /* il pulsante della tendina ha una logica sua: lo escludo da qui,
     altrimenti riceverebbe due gestori di clic in conflitto */
  /* Questi tre gesti servono sia al clic, sia all'arrivo su una pagina
     nuova: in multipagina viaggiano nell'indirizzo dopo il cancelletto. */
  function segnalaCard(mira){
    var card = document.getElementById('srv-' + mira);
    if(!card){ return; }
    card.scrollIntoView({ block:'center', behavior: poco ? 'auto' : 'smooth' });
    card.classList.remove('segnalata');
    void card.offsetWidth;
    card.classList.add('segnalata');
  }
  function applicaMotivo(motivo){
    var sceltaMotivo = document.getElementById('c-i');
    if(!sceltaMotivo){ return; }
    sceltaMotivo.value = motivo;
    sceltaMotivo.dispatchEvent(new Event('change', { bubbles:true }));
    var campoMotivo = sceltaMotivo.closest('.campo');
    if(campoMotivo){
      campoMotivo.classList.remove('precompilato');
      void campoMotivo.offsetWidth;
      campoMotivo.classList.add('precompilato');
      setTimeout(function(){ campoMotivo.classList.remove('precompilato'); }, 1400);
    }
    setTimeout(function(){
      sceltaMotivo.scrollIntoView({ block:'center', behavior:poco ? 'auto' : 'smooth' });
      sceltaMotivo.focus({ preventScroll:true });
    }, poco ? 0 : 180);
  }
  function applicaAppuntamento(){
    var sp = document.getElementById('c-app');
    if(!sp){ return; }
    sp.checked = true;
    if(window.tmcAppuntamento){ window.tmcAppuntamento(true); }
  }

  var nodi = document.querySelectorAll('[data-go]:not(#btn-servizi)');
  for(var v=0; v<nodi.length; v++){
    (function(el){
      el.addEventListener('click', function(ev){
        ev.preventDefault();
        var mira = el.getAttribute('data-vaia');
        var motivo = el.getAttribute('data-motivo');
        var appunt = el.hasAttribute('data-appuntamento');
        /* Pagina diversa: quello che il pulsante voleva fare viaggia
           nell'indirizzo e viene ripreso all'arrivo. */
        if(MP && el.getAttribute('data-go') !== MP.corrente){
          var coda = mira ? 'srv-' + mira : '';
          if(motivo || appunt){
            coda = 'motivo=' + encodeURIComponent(motivo || '') + (appunt ? '&app=1' : '');
          }
          location.href = urlPagina(el.getAttribute('data-go'), coda);
          return;
        }
        var pag = vai(el.getAttribute('data-go'));
        if(mira){ segnalaCard(mira); }
        if(motivo){ applicaMotivo(motivo); }
        if(appunt){ applicaAppuntamento(); }
        /* il focus va sul titolo della nuova pagina: chi naviga da tastiera
           o con lo screen reader sente dove è arrivato, invece di ripartire da capo */
        if(pag && !motivo){
          var h = pag.querySelector('h1');
          if(h){ h.setAttribute('tabindex','-1'); h.focus({ preventScroll:true }); }
        }
      });
    })(nodi[v]);
  }

  /* ── schede dei progetti ────────────────────────────────
     La pagina mostra solo le anteprime. Il case study si apre sopra
     la galleria: il video parte da solo dall'inizio a ogni apertura e,
     quando si chiude, viene fermato e riavvolto. */
  var apriCasi = document.querySelectorAll('[data-caso-apri]');
  var ultimoApriCaso = null;

  /* Riavvolge e ferma: cosi' il clic successivo riparte dall'inizio. */
  function fermaFilm(finestra){
    var film = finestra ? finestra.querySelector('video') : null;
    if(!film){ return; }
    film.pause();
    try{ film.currentTime = 0; }catch(e){}
  }

  /* Parte dentro il gestore del clic, quindi il browser concede l'audio.
     Se lo blocca comunque, riprova senza audio: meglio muto che fermo. */
  function avviaFilm(finestra){
    var film = finestra ? finestra.querySelector('video') : null;
    if(!film){ return; }
    var sorgente=film.querySelector('source[data-video]');
    if(!film.getAttribute('src') && sorgente){ film.src=sorgente.dataset.video; film.load(); }
    try{ film.currentTime = 0; }catch(e){}
    var esito = film.play();
    if(esito && typeof esito.catch === 'function'){
      esito.catch(function(){
        film.muted = true;
        var riprova = film.play();
        if(riprova && typeof riprova.catch === 'function'){ riprova.catch(function(){}); }
      });
    }
  }

  function chiudiCaso(finestra){
    if(!finestra){ return; }
    fermaFilm(finestra);
    if(typeof finestra.close === 'function' && finestra.open){ finestra.close(); }
    else{ finestra.removeAttribute('open'); }
    document.body.classList.remove('caso-aperto');
    if(ultimoApriCaso){ ultimoApriCaso.focus(); }
  }

  /* Aperta anche dalla ricerca ⌘K, non solo dal clic sulla card. */
  function apriCaso(id, pulsante){
    var finestra = document.getElementById(id);
    if(!finestra || finestra.open){ return; }
    ultimoApriCaso = pulsante || null;
    document.body.classList.add('caso-aperto');
    if(typeof finestra.showModal === 'function'){ finestra.showModal(); }
    else{ finestra.setAttribute('open',''); }
    preparaFoto(finestra,true);
    avviaFilm(finestra);
  }

  for(var ca=0; ca<apriCasi.length; ca++){
    (function(pulsante){
      pulsante.addEventListener('click', function(){
        apriCaso(pulsante.getAttribute('data-caso-apri'), pulsante);
      });
    })(apriCasi[ca]);
  }

  var finestreCaso = document.querySelectorAll('.caso-dialog');
  for(var cd=0; cd<finestreCaso.length; cd++){
    (function(finestra){
      var chiudiPulsante = finestra.querySelector('[data-caso-chiudi]');
      if(chiudiPulsante){
        chiudiPulsante.addEventListener('click', function(){ chiudiCaso(finestra); });
      }
      finestra.addEventListener('click', function(ev){
        if(ev.target === finestra){ chiudiCaso(finestra); }
      });
      /* Esc: la chiusura nativa del <dialog> non e' affidabile su tutti i
         browser, quindi la gestiamo noi. preventDefault evita che, dove
         invece funziona, la scheda si chiuda due volte. */
      finestra.addEventListener('keydown', function(ev){
        if(ev.key === 'Escape'){ ev.preventDefault(); chiudiCaso(finestra); }
      });
      finestra.addEventListener('close', function(){
        fermaFilm(finestra);
        document.body.classList.remove('caso-aperto');
      });
    })(finestreCaso[cd]);
  }

  /* ── foto dei progetti a tutto schermo ──────────────────
     Ogni foto in fondo alla scheda si apre grande sopra la scheda stessa.
     Frecce, swipe e tastiera scorrono solo le foto di quel progetto;
     Esc chiude la foto e lascia aperta la scheda. */
  var fotoVista = document.getElementById('foto-vista');
  if(fotoVista){
    var vistaImg = document.getElementById('foto-img');
    var vistaDidas = document.getElementById('foto-didas');
    var vistaConta = document.getElementById('foto-conta');
    var vistaFoto = [], vistaIndice = 0, vistaOrigine = null;

    /* didascalie a piu' pezzi (marchio + formato) lette come "Marchio · Formato" */
    function testoDidas(cap){
      if(!cap){ return ''; }
      return cap.children.length ? Array.prototype.map.call(cap.children, function(c){ return c.textContent.trim(); }).join(' · ')
                                 : cap.textContent.trim();
    }
    function vistaDati(fig){
      var im = fig.querySelector('img'), cap = fig.querySelector('figcaption');
      return { src: im.getAttribute('data-grande') || im.currentSrc || im.src,
               alt: im.getAttribute('alt') || '', didas: testoDidas(cap) };
    }
    function vistaMostra(i){
      var n = vistaFoto.length;
      vistaIndice = (i + n) % n;
      var d = vistaDati(vistaFoto[vistaIndice]);
      vistaImg.classList.add('carica');
      vistaImg.onload = function(){ vistaImg.classList.remove('carica'); };
      vistaImg.onerror = function(){
        vistaImg.classList.remove('carica');
        var anteprima=vistaFoto[vistaIndice].querySelector('img').src;
        if(vistaImg.src!==anteprima){vistaImg.src=anteprima;}
        else{vistaDidas.textContent='Foto non disponibile. Prova un’altra immagine o riapri la galleria.';}
      };
      vistaImg.src = d.src; vistaImg.alt = d.alt;
      vistaDidas.textContent = d.didas;
      vistaConta.textContent = (vistaIndice + 1) + ' / ' + n;
      /* la prossima e la precedente si scaricano in anticipo: niente attese scorrendo */
      [1,-1].forEach(function(k){ if(n > 1){ new Image().src = vistaDati(vistaFoto[(vistaIndice + k + n) % n]).src; } });
    }
    function vistaApri(fig){
      vistaFoto = Array.prototype.slice.call(fig.parentNode.querySelectorAll('figure'));
      vistaOrigine = fig;
      fotoVista.toggleAttribute('data-sola', vistaFoto.length < 2);
      vistaMostra(vistaFoto.indexOf(fig));
      if(typeof fotoVista.showModal === 'function'){ fotoVista.showModal(); } else { fotoVista.setAttribute('open',''); }
      document.getElementById('foto-chiudi').focus({ preventScroll:true });
    }
    function vistaChiudi(){
      if(fotoVista.open){ if(typeof fotoVista.close === 'function'){ fotoVista.close(); } else { fotoVista.removeAttribute('open'); } }
    }
    fotoVista.addEventListener('close', function(){
      vistaImg.removeAttribute('src');
      if(vistaOrigine){ vistaOrigine.focus({ preventScroll:true }); }
    });
    document.getElementById('foto-chiudi').addEventListener('click', vistaChiudi);
    document.getElementById('foto-prec').addEventListener('click', function(){ vistaMostra(vistaIndice - 1); });
    document.getElementById('foto-succ').addEventListener('click', function(){ vistaMostra(vistaIndice + 1); });
    /* clic sullo sfondo scuro (non sulla foto) chiude */
    fotoVista.addEventListener('click', function(ev){
      if(ev.target === fotoVista || ev.target.id === 'foto-palco'){ vistaChiudi(); }
    });
    fotoVista.addEventListener('keydown', function(ev){
      if(ev.key === 'Escape'){ ev.preventDefault(); ev.stopPropagation(); vistaChiudi(); }
      else if(ev.key === 'ArrowLeft' && vistaFoto.length > 1){ ev.preventDefault(); vistaMostra(vistaIndice - 1); }
      else if(ev.key === 'ArrowRight' && vistaFoto.length > 1){ ev.preventDefault(); vistaMostra(vistaIndice + 1); }
    });
    var tocco = null;
    fotoVista.addEventListener('touchstart', function(ev){
      if(ev.touches.length === 1){ tocco = { x: ev.touches[0].clientX, y: ev.touches[0].clientY }; }
    }, { passive:true });
    fotoVista.addEventListener('touchend', function(ev){
      if(!tocco || vistaFoto.length < 2){ tocco = null; return; }
      var dx = ev.changedTouches[0].clientX - tocco.x, dy = ev.changedTouches[0].clientY - tocco.y;
      tocco = null;
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4){ vistaMostra(vistaIndice + (dx < 0 ? 1 : -1)); }
    }, { passive:true });

    var figure = document.querySelectorAll('.caso-scatti figure, .ooh-slide');
    for(var fz=0; fz<figure.length; fz++){
      (function(fig){
        var cap = fig.querySelector('figcaption');
        fig.setAttribute('role','button');
        fig.setAttribute('tabindex','0');
        fig.setAttribute('aria-label','Apri la foto a tutto schermo' + (cap ? ': ' + testoDidas(cap) : ''));
        var icona = document.createElement('span');
        icona.className = 'caso-zoom'; icona.setAttribute('aria-hidden','true');
        icona.innerHTML = '<svg viewBox="0 0 16 16"><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9"/></svg>';
        fig.appendChild(icona);
        fig.addEventListener('click', function(){ vistaApri(fig); });
        fig.addEventListener('keydown', function(ev){
          if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); vistaApri(fig); }
        });
      })(figure[fz]);
    }
  }

  /* ── tendina "I nostri servizi" ─────────────────────────
     Si apre al passaggio del mouse e al clic, si chiude con Esc,
     cliccando fuori o scegliendo una voce. Il pulsante resta un
     pulsante vero: raggiungibile e azionabile da tastiera. */
  var gruppo = document.getElementById('gruppo-servizi');
  var btnServizi = document.getElementById('btn-servizi');
  var tendina = document.getElementById('tendina-servizi');

  function apriTendina(){
    if(!gruppo){ return; }
    gruppo.setAttribute('data-aperto','true');
    btnServizi.setAttribute('aria-expanded','true');
  }
  function chiudiTendina(){
    if(!gruppo){ return; }
    gruppo.setAttribute('data-aperto','false');
    btnServizi.setAttribute('aria-expanded','false');
  }

  if(gruppo){
    var conPuntatore = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if(conPuntatore){
      gruppo.addEventListener('mouseenter', apriTendina);
      gruppo.addEventListener('mouseleave', chiudiTendina);
    }
    btnServizi.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      /* non porta a nessuna pagina: i servizi sono le tre voci qui dentro */
      if(gruppo.getAttribute('data-aperto') === 'true'){ chiudiTendina(); }
      else{ apriTendina(); }
    });
    btnServizi.addEventListener('focus', function(){ if(conPuntatore){ apriTendina(); } });
    gruppo.addEventListener('focusout', function(e){
      if(!gruppo.contains(e.relatedTarget)){ chiudiTendina(); }
    });
    document.addEventListener('click', function(e){
      if(!gruppo.contains(e.target)){ chiudiTendina(); }
    });
    gruppo.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ chiudiTendina(); btnServizi.focus(); }
      else if(e.key === 'ArrowDown'){
        e.preventDefault(); apriTendina();
        var primo = tendina.querySelector('a');
        if(primo){ primo.focus(); }
      }
    });
  }

  /* ── menu ────────────────────────────────────────────── */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function chiudi(){
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded','false');
    burger.setAttribute('aria-label','Apri il menu');
    menu.setAttribute('aria-hidden','true');
  }
  burger.addEventListener('click', function(){
    var apre = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', apre);
    burger.setAttribute('aria-expanded', apre ? 'true' : 'false');
    burger.setAttribute('aria-label', apre ? 'Chiudi il menu' : 'Apri il menu');
    menu.setAttribute('aria-hidden', apre ? 'false' : 'true');
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && document.body.classList.contains('menu-open')){ chiudi(); burger.focus(); }
  });

  /* ── carosello ───────────────────────────────────────── */
  var DID = [
    ["Cuba", "Maxi LED · Shanghai", "dooh"],
    ["Baci Gelato", "Maxi LED · Milano", "dooh"],
    ["Acque Minerali d'Italia", "Campagna taxi · Roma", "taxi"],
    ["Maxibon", "Bus turistici · Roma", "bus"],
    ["Radio Italia", "Tram brandizzato · Milano", "tram"],
    ["Radio Italia", "Murales · Milano", "muro"],
    ["Radio 105", "Maxi LED · Milano Centrale", "dooh"],
    ["Radio Subasio", "Digitotem · Venezia", "dooh"]
  ];
  var sfondo = document.getElementById('sfondo');
  if(sfondo){
    /* Ordine fisso, quello della tabella: niente sorteggio. */
    var slide = sfondo.querySelectorAll('.slide');
    var didas = document.getElementById('didas');
    var roll = document.getElementById('roll');
    var parole = roll ? roll.querySelectorAll('b') : [];
    var attuale = 0, timer = null;

    /* Ogni foto ha src solo quando serve: monto quella attuale e gia'
       che ci sono la prossima, cosi' il cambio non fa aspettare. */
    function caricaSlide(k){
      var im = slide[(k + slide.length) % slide.length];
      if(!im || im.dataset.pronta){ return; }
      im.dataset.pronta = '1';
      if(im.dataset.srcset){ im.srcset = im.dataset.srcset; }
      im.src = im.dataset.src;
    }

    /* Il browser sceglie la misura una volta sola e non torna piu' indietro:
       chi apre la pagina in una finestra piccola e poi va a schermo intero
       si tiene la foto da 900 px ingrandita a 3840, ed e' quella la
       "sgranatura". Se la larghezza cresce in modo sensibile, rimetto il
       srcset e lo obbligo a riscegliere. */
    var largaEra = window.innerWidth, riscelta = null;
    window.addEventListener('resize', function(){
      clearTimeout(riscelta);
      riscelta = setTimeout(function(){
        if(window.innerWidth <= largaEra * 1.15){ largaEra = window.innerWidth; return; }
        largaEra = window.innerWidth;
        for(var k=0;k<slide.length;k++){
          var im = slide[k];
          if(!im.dataset.pronta || !im.dataset.srcset){ continue; }
          im.removeAttribute('srcset');
          im.srcset = im.dataset.srcset;
        }
      }, 250);
    });

    var cambioSlide=0;
    function mostra(i){
      var scelto=(i+slide.length)%slide.length, richiesta=++cambioSlide;
      caricaSlide(scelto);
      var im=slide[scelto];
      function pronta(){
        if(richiesta!==cambioSlide)return;
        if(!im.naturalWidth){caricaSlide(scelto+1);return;}
        applicaSlide(scelto);caricaSlide(scelto+1);
      }
      if(im.complete&&im.naturalWidth){pronta();}
      else if(im.decode){im.decode().then(pronta).catch(function(){if(im.complete)pronta();});}
      else{im.addEventListener('load',pronta,{once:true});}
    }
    function applicaSlide(scelto){
      attuale=scelto;
      for(var k=0;k<slide.length;k++){
        var era = slide[k].classList.contains('att');
        var ora = k === attuale;
        slide[k].classList.toggle('att', ora);
        if(era && !ora){
          /* le lascio "esce" per la durata della dissolvenza, poi torna
             invisibile e smette di pesare */
          slide[k].classList.add('esce');
          (function(el){ setTimeout(function(){ el.classList.remove('esce'); }, 1100); })(slide[k]);
        }
      }
      /* la parola del titolo e' la stessa riga della tabella: cambia
         nello stesso fotogramma della foto, mai una prima dell'altra */
      for(var w = 0; w < parole.length; w++){
        var eraP = parole[w].classList.contains('att');
        var oraP = w === attuale;
        parole[w].classList.toggle('att', oraP);
        parole[w].classList.toggle('esce', eraP && !oraP);
      }

      var d = DID[attuale];
      didas.textContent = d[0];
      var em = document.createElement('em');
      em.appendChild(document.createTextNode(d[1]));
      didas.appendChild(em);
    }
    function parti(){
      clearInterval(timer);
      /* con "riduci movimento" attivo nel sistema le foto restano ferme */
      if(poco || document.hidden || !document.getElementById('pg-home').classList.contains('on')){ return; }
      timer = setInterval(function(){ mostra(attuale + 1); }, 4000);
    }
    function ferma(){ clearInterval(timer); }

    /* Niente pausa al passaggio del mouse: l'hero e alto quanto tutta la
       prima schermata, quindi il cursore ci sta sopra quasi sempre e le foto
       restavano ferme. Restano le due pause che non danno fastidio:
       "riduci movimento" di sistema e scheda in secondo piano. */
    document.addEventListener('visibilitychange', function(){ document.hidden ? ferma() : parti(); });
    /* la prima foto la decide il sorteggio, non l'ordine nel sorgente:
       senza questa chiamata resterebbe accesa la slide 1 e la didascalia
       vuota fino al primo scatto del timer */
    document.addEventListener('tmc:page',function(ev){
      if(ev.detail.page==='home'){mostra(attuale);parti();}else{ferma();}
    });
  }

  /* ── inclinazione 3D delle card ──────────────────────── */
  if(fine && !poco){
    var carte = document.querySelectorAll('.tilt');
    for(var c=0;c<carte.length;c++){
      (function(el){
        var atteso = false, mx = 0, my = 0;
        el.addEventListener('pointermove', function(e){
          var r = el.getBoundingClientRect();
          mx = (e.clientX - r.left) / r.width - 0.5;
          my = (e.clientY - r.top) / r.height - 0.5;
          if(atteso){ return; }
          atteso = true;
          requestAnimationFrame(function(){
            el.style.transform = 'perspective(1000px) rotateY(' + (mx * 11).toFixed(2) + 'deg) rotateX(' +
              (-my * 11).toFixed(2) + 'deg) translateZ(10px)';
            atteso = false;
          });
        }, { passive:true });
        el.addEventListener('pointerleave', function(){ el.style.transform = ''; });
      })(carte[c]);
    }
  }

  /* ── parallasse sulla scena 3D ───────────────────────── */
  var scena = document.querySelector('.scena');
  if(scena && fine && !poco){
    var attesa = false, px = 0, py = 0;
    window.addEventListener('pointermove', function(e){
      px = (e.clientX / window.innerWidth - 0.5);
      py = (e.clientY / window.innerHeight - 0.5);
      if(attesa){ return; }
      attesa = true;
      requestAnimationFrame(function(){
        scena.style.perspectiveOrigin = (50 + px * 16).toFixed(1) + '% ' + (42 + py * 16).toFixed(1) + '%';
        attesa = false;
      });
    }, { passive:true });
  }

  /* ── contatori ───────────────────────────────────────── */
  var contatori = Array.prototype.slice.call(document.querySelectorAll('[data-n]'));
  function fermaContatore(el){
    cancelAnimationFrame(el._contoFrame);
    el._contoFrame = null;
    el._inVista = false;
    el.textContent = (+el.dataset.n).toLocaleString('it-IT') + (el.dataset.s || '');
  }
  function conta(el){
    var fin = parseInt(el.getAttribute('data-n'), 10);
    var suf = el.getAttribute('data-s') || '';
    if(poco){ el.textContent = fin.toLocaleString('it-IT') + suf; return; }
    cancelAnimationFrame(el._contoFrame);
    el.textContent = '0';
    var dur = 1250, t0 = null;
    function passo(ts){
      if(t0 === null){ t0 = ts; }
      var q = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - q, 3);
      el.textContent = Math.round(fin * e).toLocaleString('it-IT') + (q === 1 ? suf : '');
      if(q < 1){ el._contoFrame = requestAnimationFrame(passo); }
      else{ el._contoFrame = null; }
    }
    el._contoFrame = requestAnimationFrame(passo);
  }

  /* Ogni numero si attiva solo quando è leggibile nel viewport.
     La soglia di uscita distinta evita riavvii mentre oscilla sul bordo. */
  function visibilitaContatore(el,visibile,uscito){
    if(visibile && !el._inVista){ el._inVista = true; conta(el); }
    else if(uscito && el._inVista){ fermaContatore(el); }
    var pannello = el.closest('.taxi-impatto');
    if(pannello){
      pannello.classList.toggle('in-vista',contatori.some(function(n){ return pannello.contains(n) && n._inVista; }));
    }
  }
  var numeriObserver = null, verificaContatori = null;
  if('IntersectionObserver' in window){
    numeriObserver = new IntersectionObserver(function(voci){
      voci.forEach(function(voce){
        var aperta = !!voce.target.closest('.pg.on');
        visibilitaContatore(voce.target,aperta && voce.isIntersecting && voce.intersectionRatio >= .65,
          !aperta || !voce.isIntersecting);
      });
    },{threshold:[0,.65],rootMargin:'-110px 0px -24px 0px'});
    contatori.forEach(function(el){ numeriObserver.observe(el); });
  }else{
    var contoAttesa = false;
    verificaContatori = function(){
      if(contoAttesa){ return; }
      contoAttesa = true;
      requestAnimationFrame(function(){
        contoAttesa = false;
        contatori.forEach(function(el){
          var r = el.getBoundingClientRect(),aperta = !!el.closest('.pg.on');
          visibilitaContatore(el,aperta && r.height > 0 && r.top >= 110 && r.bottom <= innerHeight-24,
            !aperta || r.bottom <= 110 || r.top >= innerHeight-24);
        });
      });
    }
    window.addEventListener('scroll',verificaContatori,{passive:true});
    window.addEventListener('resize',verificaContatori);
  }
  document.addEventListener('tmc:page',function(){
    contatori.forEach(function(el){
      fermaContatore(el);
      var pannello = el.closest('.taxi-impatto');
      if(pannello){ pannello.classList.remove('in-vista'); }
      if(numeriObserver){ numeriObserver.unobserve(el); numeriObserver.observe(el); }
    });
    if(!numeriObserver){ verificaContatori(); }
  });

  /* ── reveal allo scroll ──────────────────────────────── */
  var io = null;
  if('IntersectionObserver' in window){
    io = new IntersectionObserver(function(voci){
      for(var i=0;i<voci.length;i++){
        if(!voci[i].isIntersecting){ continue; }
        var t = voci[i].target;
        t.classList.add('in');
        io.unobserve(t);
      }
    }, { rootMargin:'0px 0px -8% 0px', threshold:0.1 });
  }
  function rivela(){
    var pag = document.querySelector('.pg.on');
    if(!pag){ return; }
    var el = pag.querySelectorAll('.rv:not(.in)');
    for(var i=0;i<el.length;i++){
      if(io){ io.observe(el[i]); } else { el[i].classList.add('in'); }
    }
  }
  /* La rete di sicurezza rivela i contenuti senza avviare i contatori. */
  var rete = null;
  function reteSicurezza(){
    clearTimeout(rete);
    rete = setTimeout(function(){
      var pag = document.querySelector('.pg.on');
      if(!pag){ return; }
      var el = pag.querySelectorAll('.rv:not(.in)');
      for(var i=0;i<el.length;i++){ el[i].classList.add('in'); }
    }, 2600);
  }
  reteSicurezza();

  /* ── canali a livelli: costruzione della pila con lo scroll ── */
  var pila = document.getElementById('pila');
  if(pila){
    var tracciaPila=document.getElementById('pila-traccia');
    var scenaPila=document.getElementById('pila-scena');
    var canaliPila=Array.prototype.slice.call(pila.querySelectorAll('.carta'));
    var lastrePila=Array.prototype.slice.call(scenaPila.querySelectorAll('.pila-lastra'));
    var passiPila=Array.prototype.slice.call(pila.querySelectorAll('.pila-passo'));
    var indiciPila=Array.prototype.slice.call(pila.querySelectorAll('.pila-indice'));
    var contatorePila=document.getElementById('pila-n');
    var mobilePila=window.matchMedia('(max-width: 820px)');
    var motionPila=window.matchMedia('(prefers-reduced-motion: reduce)');
    var bassoPila=window.matchMedia('(max-height: 650px)');
    var correntePila=0,progressoPila=0,framePila=0;
    function limitaPila(n,a,b){return Math.max(a,Math.min(b,n));}
    function manualePila(){return motionPila.matches||(mobilePila.matches&&bassoPila.matches);}
    function mostraPila(progresso){
      progressoPila=limitaPila(progresso,0,canaliPila.length-1);
      var scelto=Math.round(progressoPila);
      /* Sul telefono la tappa è intera: il testo cambia insieme alla
         propria lastra, che raggiunge sempre lo stesso punto visivo. */
      if(mobilePila.matches)progressoPila=scelto;
      scenaPila.style.setProperty('--pila-sollevamento',(scelto*27*.76*Math.sin(57*Math.PI/180)).toFixed(2)+'px');
      for(var i=0;i<lastrePila.length;i++){
        var arrivo=limitaPila(progressoPila-i+1,0,1);
        var evidenza=Math.max(0,1-Math.abs(progressoPila-i));
        /* La nuova lastra scende e si posa; quella selezionata resta
           leggermente sollevata, come il livello aperto nel riferimento. */
        var z=i*27+(1-arrivo)*250+evidenza*46;
        lastrePila[i].style.setProperty('--lastra-z',z.toFixed(2)+'px');
        lastrePila[i].style.setProperty('--lastra-opacity',limitaPila(arrivo*1.65,0,1).toFixed(3));
      }
      tracciaPila.style.setProperty('--pila-progresso',((progressoPila+1)/canaliPila.length).toFixed(4));
      if(correntePila!==scelto||!passiPila[scelto].classList.contains('attivo')){
        correntePila=scelto;
        for(var j=0;j<canaliPila.length;j++){
          var attivo=j===scelto;
          passiPila[j].classList.toggle('attivo',attivo);
          canaliPila[j].setAttribute('aria-expanded',String(attivo));
          canaliPila[j].setAttribute('aria-pressed',String(attivo));
          indiciPila[j].setAttribute('aria-pressed',String(attivo));
          document.getElementById('pila-copia-'+j).setAttribute('aria-hidden',String(!attivo));
        }
      }
      contatorePila.textContent=('0'+(scelto+1)).slice(-2)+' di '+canaliPila.length;
    }
    function aggiornaPila(){
      framePila=0;
      if(!document.getElementById('pg-integrate').classList.contains('on'))return;
      if(manualePila()){tracciaPila.classList.add('manuale');return;}
      tracciaPila.classList.remove('manuale');
      var spazio=tracciaPila.offsetHeight-pila.offsetHeight;
      var alto=parseFloat(getComputedStyle(pila).top)||0;
      if(spazio>0){
        var quota=limitaPila((alto-tracciaPila.getBoundingClientRect().top)/spazio,0,1);
        mostraPila(mobilePila.matches?Math.min(canaliPila.length-1,Math.floor(quota*canaliPila.length)):quota*(canaliPila.length-1));
      }
    }
    function richiediPila(){if(!framePila)framePila=requestAnimationFrame(aggiornaPila);}
    function selezionaPila(indice){
      indice=limitaPila(indice,0,canaliPila.length-1);
      if(manualePila()){tracciaPila.classList.add('manuale');mostraPila(indice);return;}
      var alto=parseFloat(getComputedStyle(pila).top)||0;
      var spazio=tracciaPila.offsetHeight-pila.offsetHeight;
      var quota=mobilePila.matches?(indice+.25)/canaliPila.length:indice/(canaliPila.length-1);
      var posizione=window.scrollY+tracciaPila.getBoundingClientRect().top-alto+spazio*quota;
      if(mobilePila.matches)mostraPila(indice);
      window.scrollTo({top:Math.max(0,posizione),behavior:mobilePila.matches?'instant':'smooth'});
    }
    function collegaPila(button,indice){
      button.addEventListener('click',function(){selezionaPila(indice);});
      button.addEventListener('keydown',function(e){
        var prossimo=indice;
        if(e.key==='ArrowDown'||e.key==='ArrowRight')prossimo=(indice+1)%canaliPila.length;
        else if(e.key==='ArrowUp'||e.key==='ArrowLeft')prossimo=(indice+canaliPila.length-1)%canaliPila.length;
        else if(e.key==='Home')prossimo=0;
        else if(e.key==='End')prossimo=canaliPila.length-1;
        else return;
        e.preventDefault();
        (mobilePila.matches?indiciPila:canaliPila)[prossimo].focus({preventScroll:true});selezionaPila(prossimo);
      });
    }
    canaliPila.forEach(collegaPila);
    indiciPila.forEach(collegaPila);
    window.addEventListener('scroll',richiediPila,{passive:true});
    window.addEventListener('resize',richiediPila,{passive:true});
    function cambioModalitaPila(){
      tracciaPila.classList.toggle('manuale',manualePila());
      mostraPila(correntePila);richiediPila();
    }
    if(mobilePila.addEventListener){
      mobilePila.addEventListener('change',cambioModalitaPila);
      motionPila.addEventListener('change',cambioModalitaPila);
      bassoPila.addEventListener('change',cambioModalitaPila);
    }
    riavviaPila=richiediPila;
    tracciaPila.classList.toggle('manuale',manualePila());
    mostraPila(0);
    richiediPila();
  }

  /* ── video OOH ────────────────────────────────────────────
     Tre versioni: 720p, 1080p, 4K HEVC. Si parte da quella che la linea
     regge (720p se la connessione non e' veloce), mai dal 4K alla prima
     visita: il file e' grande e non e' ancora in cache.
     Mentre aspetta dati si vede l'anteprima con un piccolo indicatore
     dentro il riquadro: la pagina resta sempre libera e navigabile.
     Se un'attesa supera i 3 secondi, o si ferma due volte in poco tempo,
     scende di qualita' dallo stesso punto. */
  var film = document.getElementById('ooh-film');
  if(film){
    var filmBox = film.parentNode;
    var filmBtn = document.getElementById('ooh-film-b');
    var filmFermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var filmVisibile = false, filmLivello = null, filmAttese = [], filmTimer = null;

    function filmScegli(){
      var rete = navigator.connection || {};
      var lenta = rete.saveData || /(^|-)(2g|3g)$/.test(rete.effectiveType || '') ||
                  (rete.downlink && rete.downlink < 8);
      if(lenta || window.innerWidth < 700){ return '720'; }
      return '1080';
    }
    function filmAttesa(si){
      filmBox.classList.toggle('attesa', !!si);
      if(!si){ clearTimeout(filmTimer); filmTimer = null; }
    }
    function filmImposta(livello, da){
      if(filmLivello === livello && film.getAttribute('src')){ return; }
      filmLivello = livello;
      film.src = film.getAttribute('data-src-' + livello);
      film.preload = 'auto';
      if(da){ film.addEventListener('loadedmetadata', function(){ try{ film.currentTime = da; }catch(e){} }, { once:true }); }
      film.load();
    }
    function filmScendi(){
      var t = film.currentTime || 0;
      if(filmLivello === '2160'){ filmImposta('1080', t); filmAvvia(); return true; }
      if(filmLivello === '1080'){ filmImposta('720', t); filmAvvia(); return true; }
      return false;
    }
    function filmAvvia(){
      if(!filmVisibile || filmFermo || document.hidden){ return; }
      if(!film.getAttribute('src')){ filmImposta(filmScegli()); }
      var p = film.play(); if(p && p.catch){ p.catch(function(e){
        if(e.name==='NotAllowedError'){filmFermo=true;filmAttesa(false);filmStato();}
      }); }
    }

    film.addEventListener('waiting', function(){
      if(filmFermo || !filmVisibile || document.hidden){ return; }
      filmAttesa(true);
      if(film.currentTime > .5){
        var ora = Date.now();
        filmAttese = filmAttese.filter(function(t){ return ora - t < 15000; });
        filmAttese.push(ora);
        if(filmAttese.length >= 2 && filmScendi()){ filmAttese = []; return; }
      }
      clearTimeout(filmTimer);
      filmTimer = setTimeout(function(){ if(filmBox.classList.contains('attesa')){ filmScendi(); } }, 3000);
    });
    film.addEventListener('loadstart', function(){ if(filmVisibile && !filmFermo){ filmAttesa(true); } });
    film.addEventListener('playing', function(){ filmAttesa(false); filmBox.classList.add('vivo'); });
    film.addEventListener('canplay', function(){ filmAvvia(); });
    film.addEventListener('pause', function(){ filmBox.classList.remove('vivo'); });
    film.addEventListener('error', function(){ if(!filmScendi()){
      filmAttesa(false);filmFermo=true;filmStato();
      filmBtn.setAttribute('aria-label','Riprova a caricare il video');
    } });

    /* vicino: comincia a scaricare prima di arrivarci */
    new IntersectionObserver(function(voci){
      if(voci[0].isIntersecting && !film.getAttribute('src')){ filmImposta(filmScegli()); }
    }, { rootMargin:'600px 0px' }).observe(film);
    new IntersectionObserver(function(voci){
      filmVisibile = voci[0].intersectionRatio >= .35;
      if(filmVisibile){ filmAvvia(); } else { filmAttesa(false); film.pause(); }
    }, { threshold:[0, .35] }).observe(film);
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ filmAttesa(false); film.pause(); } else { filmAvvia(); }
    });
    function filmStato(){
      filmBtn.setAttribute('aria-pressed', filmFermo ? 'true' : 'false');
      filmBtn.setAttribute('aria-label', filmFermo ? 'Riproduci il video' : 'Metti in pausa il video');
    }
    filmBtn.addEventListener('click', function(){
      filmFermo = !filmFermo;
      if(!filmFermo&&film.error){film.load();}
      if(filmFermo){ filmAttesa(false); film.pause(); } else { filmAvvia(); }
      filmStato();
    });
    filmStato();
  }

  /* ── carosello campagne OOH ───────────────────────────────
     Stesso riquadro del video. Va da solo: una foto ogni 3 secondi, con
     una sottile barra in fondo che mostra il tempo. Non c'e' pausa: si
     ferma solo quando non e' sullo schermo o la scheda non e' in vista.
     Frecce, dito e tastiera spostano la foto e fanno ripartire il tempo.
     Il clic sulla foto la apre a tutto schermo. Con "riduci movimento"
     non scorre da solo. */
  var ooh = document.getElementById('ooh-car');
  if(ooh){
    var oohTrack = document.getElementById('ooh-car-track');
    var oohSlide = oohTrack.querySelectorAll('.ooh-slide');
    var oohProg = document.getElementById('ooh-car-prog');
    var oohConta = document.getElementById('ooh-car-conta');
    var OOH_MS = 3000;
    var oohI = 0, oohStatico = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var oohVisto = false, oohScroll = null, oohGuidato = 0;
    ooh.style.setProperty('--durata', (OOH_MS/1000) + 's');

    function oohVai(i, liscio){
      var n = oohSlide.length;
      oohI = (i + n) % n;
      oohGuidato = Date.now();
      oohTrack.scrollTo({ left: oohSlide[oohI].offsetLeft, behavior: liscio === false ? 'auto' : 'smooth' });
      oohSegna();
      oohRiparti();
    }
    var oohFila = document.getElementById('ooh-mini-fila');
    var oohMini = oohFila.querySelectorAll('.ooh-mini');
    function oohSegna(){
      oohConta.textContent = (oohI + 1) + ' / ' + oohSlide.length;
      for(var m=0;m<oohMini.length;m++){
        var su = m === oohI;
        oohMini[m].classList.toggle('attiva', su);
        if(su){ oohMini[m].setAttribute('aria-current','true'); } else { oohMini[m].removeAttribute('aria-current'); }
      }
      /* la miniatura attiva resta al centro della fila, senza muovere la pagina */
      var mm = oohMini[oohI];
      oohFila.scrollTo({ left: mm.offsetLeft - (oohFila.clientWidth - mm.clientWidth) / 2, behavior:'smooth' });
      [oohI + 1, oohI - 1].forEach(function(k){
        var im = oohSlide[(k + oohSlide.length) % oohSlide.length].querySelector('img');
        if(im.loading === 'lazy'){ im.loading = 'eager'; }
      });
    }
    function oohFermo(){ return oohStatico || !oohVisto || document.hidden; }
    function oohRiparti(){
      oohProg.classList.remove('va'); void oohProg.offsetWidth;
      ooh.classList.toggle('ferma', oohFermo());
      if(oohStatico || !oohVisto){ return; }
      oohProg.classList.add('va');
    }
    oohProg.addEventListener('animationend', function(){ if(!oohFermo()){ oohVai(oohI + 1); } });
    document.addEventListener('visibilitychange', function(){ ooh.classList.toggle('ferma', oohFermo()); });

    oohFila.addEventListener('click', function(e){
      var b = e.target.closest('.ooh-mini'); if(b){ oohVai(+b.getAttribute('data-i')); }
    });
    document.getElementById('ooh-car-prec').addEventListener('click', function(){ oohVai(oohI - 1); });
    document.getElementById('ooh-car-succ').addEventListener('click', function(){ oohVai(oohI + 1); });
    oohTrack.addEventListener('scroll', function(){
      clearTimeout(oohScroll);
      oohScroll = setTimeout(function(){
        if(Date.now() - oohGuidato < 900){ return; }
        var k = Math.round(oohTrack.scrollLeft / oohTrack.clientWidth);
        k = Math.max(0, Math.min(oohSlide.length - 1, k));
        if(k !== oohI){ oohI = k; oohSegna(); oohRiparti(); }
      }, 120);
    }, { passive:true });
    oohTrack.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight'){ e.preventDefault(); oohVai(oohI + 1); }
      if(e.key === 'ArrowLeft'){ e.preventDefault(); oohVai(oohI - 1); }
    });
    window.addEventListener('resize', function(){ oohTrack.scrollTo({ left: oohSlide[oohI].offsetLeft, behavior:'auto' }); });

    new IntersectionObserver(function(v){
      var prima = oohVisto; oohVisto = v[0].isIntersecting;
      if(oohVisto && !prima){ oohVai(oohI, false); } else { ooh.classList.toggle('ferma', oohFermo()); }
    }, { threshold:.35 }).observe(ooh);
    oohSegna();
  }

  /* ── modulo contatti: validazione, errori inline, esito ─── */
  var modulo = document.getElementById('modulo');
  if(modulo){
    var invia = document.getElementById('invia');
    var esito = document.getElementById('esito');
    var esitoTxt = document.getElementById('esito-txt');

    /* Calendario facoltativo prima del messaggio, disponibile in entrambe le modalità. */
    var MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
                'luglio','agosto','settembre','ottobre','novembre','dicembre'];
    var cal = document.getElementById('cal');
    var calGriglia = document.getElementById('cal-griglia');
    var calMese = document.getElementById('cal-mese');
    var calScelta = document.getElementById('cal-scelta');
    var campoData = document.getElementById('c-d');
    var areaMsg = document.getElementById('c-m');
    var boxData = document.getElementById('w-d');
    var oggi = new Date(); oggi.setHours(0,0,0,0);
    var vista = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
    var scelto = null;

    function due(n){ return (n < 10 ? '0' : '') + n; }

    function disegnaMese(){
      calMese.textContent = MESI[vista.getMonth()] + ' ' + vista.getFullYear();
      /* lunedi' primo: getDay() mette la domenica a 0, qui la sposto in fondo */
      var primo = (new Date(vista.getFullYear(), vista.getMonth(), 1).getDay() + 6) % 7;
      var quanti = new Date(vista.getFullYear(), vista.getMonth() + 1, 0).getDate();
      calGriglia.textContent = '';
      for(var v=0; v<primo; v++){
        var vuoto = document.createElement('span');
        vuoto.className = 'cal-d vuoto';
        calGriglia.appendChild(vuoto);
      }
      for(var g=1; g<=quanti; g++){
        var d = new Date(vista.getFullYear(), vista.getMonth(), g);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'cal-d'; b.textContent = g;
        b.dataset.iso = d.getFullYear() + '-' + due(d.getMonth()+1) + '-' + due(g);
        if(d < oggi){ b.disabled = true; }                 /* i giorni passati non si prenotano */
        if(+d === +oggi){ b.classList.add('oggi'); }
        if(scelto && b.dataset.iso === scelto){ b.classList.add('scelto'); }
        b.setAttribute('aria-label', g + ' ' + MESI[vista.getMonth()] + ' ' + vista.getFullYear());
        calGriglia.appendChild(b);
      }
      /* non si torna a un mese gia' passato */
      document.getElementById('cal-pre').disabled =
        (vista.getFullYear() === oggi.getFullYear() && vista.getMonth() === oggi.getMonth());
    }

    calGriglia.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.cal-d') : null;
      if(!b || b.disabled || !b.dataset.iso){ return; }
      scelto = b.dataset.iso;
      campoData.value = scelto;
      var p = scelto.split('-');
      calScelta.textContent = 'Appuntamento richiesto per il ' + (+p[2]) + ' ' +
                              MESI[+p[1]-1] + ' ' + p[0];
      boxData.classList.remove('ko');
      calGriglia.setAttribute('aria-invalid','false');
      disegnaMese();
    });
    document.getElementById('cal-pre').addEventListener('click', function(){
      vista.setMonth(vista.getMonth() - 1); disegnaMese();
    });
    document.getElementById('cal-suc').addEventListener('click', function(){
      vista.setMonth(vista.getMonth() + 1); disegnaMese();
    });

    function modoAppuntamento(acceso){
      boxData.hidden = !acceso;
      cal.hidden = !acceso;
      campoData.disabled = !acceso;
      areaMsg.hidden = false;
      areaMsg.disabled = false;
      boxData.classList.remove('ko');
      calGriglia.setAttribute('aria-invalid','false');
      if(acceso){ disegnaMese(); }
    }
    window.tmcAppuntamento = modoAppuntamento;

    var spunta = document.getElementById('c-app');
    if(spunta){
      spunta.addEventListener('change', function(){ modoAppuntamento(spunta.checked); });
      modoAppuntamento(spunta.checked);
    }

    function valida(){
      var problemi = [];
      function segna(idBox, idCampo, ok){
        var box = document.getElementById(idBox);
        box.classList.toggle('ko', !ok);
        document.getElementById(idCampo).setAttribute('aria-invalid', ok ? 'false' : 'true');
        if(!ok){ problemi.push(document.getElementById(idCampo)); }
      }
      var mail = document.getElementById('c-e').value.trim();
      segna('w-n','c-n', document.getElementById('c-n').value.trim().length > 1);
      segna('w-e','c-e', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail));
      segna('w-a','c-a', true);
      if(!cal.hidden){ segna('w-d','cal-griglia', !!campoData.value); }
      segna('w-m','c-m', areaMsg.value.trim().length > 4);
      segna('w-p','c-p', document.getElementById('c-p').checked);
      return problemi;
    }

    modulo.addEventListener('submit', function(ev){
      ev.preventDefault();
      if(invia.disabled)return;
      esito.classList.remove('on');
      var problemi = valida();
      if(problemi.length){
        problemi[0].focus();   /* porto l'utente sul primo campo da correggere */
        return;
      }
      /* un robot compila anche il campo nascosto: fingo un invio e non spedisco nulla */
      if(document.getElementById('c-web').value){ return; }
      var endpoint = '';
      try{ endpoint = String(JSON.parse(document.getElementById('tmc-request-config').textContent).endpoint || '').trim(); }catch(e){}
      function val(id){ return document.getElementById(id).value.trim(); }
      function mostraEsito(testo, ok){
        esitoTxt.textContent = testo;
        esito.classList.toggle('esito--ko', !ok);
        esito.classList.add('on');
      }
      if(!/^https:\/\//.test(endpoint)){
        mostraEsito('In questo momento il modulo non è disponibile: scrivici a segreteria@themediacompany.it.', false);
        return;
      }
      var appuntamento = document.getElementById('c-app').checked;
      var dati = {
        _subject: 'Nuovo contatto dal sito · ' + val('c-i'),
        _template: 'table',
        _replyto: val('c-e'),
        nome: val('c-n'), azienda: val('c-a'), email: val('c-e'), telefono: val('c-t') || '—',
        richiesta: val('c-i'),
        appuntamento_in_sede: appuntamento ? 'Sì · ' + (calScelta.textContent.replace('Appuntamento richiesto per il ','') || campoData.value) : 'No',
        messaggio: val('c-m'),
        informativa_privacy: 'Letta · versione 18 settembre 2026',
        pagina: location.protocol === 'file:' ? '#contattaci' : location.origin + location.pathname + '#contattaci'
      };
      /* stato di attesa: il pulsante dice cosa sta succedendo */
      invia.disabled=true;
      invia.setAttribute('aria-busy','true');
      invia.textContent = 'Invio in corso…';
      carica.inizia('contatti');
      var controllo = new AbortController();
      var scadenza = setTimeout(function(){ controllo.abort(); }, 20000);
      fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
                        body: JSON.stringify(dati), signal: controllo.signal, credentials:'omit' })
        .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
        .then(function(res){
          if(!res.ok || (res.j.success !== true && res.j.success !== 'true')){ throw new Error('non confermato'); }
          mostraEsito('Grazie! Abbiamo ricevuto la tua richiesta: ti rispondiamo entro 48 ore.', true);
          modulo.reset();
          scelto = null; campoData.value = ''; calScelta.textContent = '';
          modoAppuntamento(false);
        })
        .catch(function(){
          mostraEsito('Non siamo riusciti a inviare il messaggio. I dati sono ancora qui: riprova tra poco oppure scrivici a segreteria@themediacompany.it.', false);
        })
        .then(function(){
          clearTimeout(scadenza);
          carica.finisci('contatti');
          invia.disabled=false;
          invia.removeAttribute('aria-busy');
          invia.textContent = 'Invia';
        });
    });

    /* l'errore sparisce appena l'utente corregge, senza aspettare il reinvio */
    ['c-n','c-a','c-e','c-m'].forEach(function(id){
      document.getElementById(id).addEventListener('input', function(){
        var box = this.closest('.campo');
        if(box && box.classList.contains('ko')){ valida(); }
      });
    });
  }

  /* ── barra di avanzamento della lettura ─────────────────── */
  var avanz = document.querySelector('#avanz i');
  if(avanz){
    var inAttesa = false;
    window.addEventListener('scroll', function(){
      if(inAttesa){ return; }
      inAttesa = true;
      requestAnimationFrame(function(){
        var h = document.documentElement.scrollHeight - window.innerHeight;
        avanz.style.width = (h > 0 ? Math.min(window.scrollY / h, 1) * 100 : 0) + '%';
        inAttesa = false;
      });
    }, { passive:true });
  }

  /* ── palette comandi (⌘K) ───────────────────────────────── */
  var VOCI = [
    { t:'Archivio delle campagne taxi', s:'99 campagne e 379 fotografie', go:'campagne-taxi', k:'archivio taxi campagne fotografie clienti raccolta galleria' },
    { t:'OOH & DOOH',       s:'Affissioni, maxi affissioni e spazi digitali',      go:'ooh',      k:'ooh dooh affissioni maxi digitale schermi esterna citta media' },
    { t:'Pubblicità dinamica', s:'Taxi, bus e tram brandizzati',                            go:'taxiadv',  k:'taxi advertising mobilita urbana capillare campagne movimento' },
    { t:'Campagne cross-mediali', s:'OOH/DOOH, digital e social, radio, stampa e one-to-one',  go:'integrate',k:'cross-mediali cross mediale integrate integrata piano media mix digital social web radio stampa one to one planning buying' },
    { t:'Campagne Taxi',    s:'15.000 contatti al giorno per mezzo',              go:'taxiadv',  k:'taxi campagne mezzi contatti copertura' },
    { t:'Prova il simulatore', s:'Stima i contatti del tuo piano, canale per canale', go:'simulatore', k:'simulatore stima contatti calcolo copertura numeri prova' },
    { t:'Maxi Affissioni',  s:'Formati e posizionamento nei punti nevralgici',    go:'ooh',      k:'affissioni maxi manifesti poster impianti' },
    { t:'OOH / DOOH',       s:'Pubblicità esterna statica e digitale',            go:'ooh',      k:'ooh dooh digitale schermi led esterna' },
    { t:'Progetti',         s:'Le campagne portate in strada',                    go:'progetti', k:'progetti lavori portfolio campagne case study foto' },
    { t:'Baci Gelato',      s:'Campagna cross-mediale',                   go:'progetti', caso:'caso-froneri', k:'baci gelato froneri dooh go tv stazioni ferroviarie ledwall milano roma napoli torino genova bologna bari palermo verona venezia bus turistici 2026 lancio' },
    { t:'BANCOMAT',         s:'Campagna cross-mediale',          go:'progetti', caso:'caso-bancomat', k:'bancomat app termini centrale barberini cadorna metro stazioni flash mob dicembre 2025' },
    { t:'Cuba',             s:'Campagna cross-mediale',              go:'progetti', caso:'caso-cuba', k:'cuba unica mintur turismo internazionale madrid barcellona varsavia francoforte pechino shanghai guangzhou ledwall bus due piani 2025' },
    { t:'TAP Air Portugal', s:'Campagna cross-mediale',                      go:'progetti', caso:'caso-tap', k:'tap air portugal taxi advertising roma milano 2025 for biz embrace brazil brasile lisbona compagnia aerea flytap' },
    { t:'Aeroitalia',       s:'Pubblicità dinamica',                                go:'progetti', caso:'caso-aeroitalia', k:'aeroitalia bus linea atac roma fiumicino minibus elettrici full wrap full back maxi side retro fustellato luglio 2024 compagnia aerea' },
    { t:'NUII',             s:'Campagna OOH/DOOH', go:'progetti', caso:'caso-nuii', k:'nuii froneri gelato affissione digitale maxi digital stage jumbo tram milano bologna roma napoli metro bus turistici grandi stazioni 2024' },
    { t:'glo',              s:'Pubblicità dinamica',                               go:'progetti', caso:'caso-glo', k:'glo hyper pro taxi advertising roma 2024 colosseo castel sant angelo campidoglio flotta brandizzata' },
    { t:'+Europa',          s:'Campagna cross-mediale',              go:'progetti', caso:'caso-piueuropa', k:'piu europa bonino emma elezioni politiche 2022 elettorale maxi affissioni bus stazioni torino bologna milano roma navigli' },
    { t:'Cesare Cremonini',  s:'Campagna OOH',                          go:'progetti', caso:'caso-cremonini', k:'cremonini radio italia stadi 2022 milano affissione parete rosk murale festa del perdono' },
    { t:'TMC Travel',       s:'Agenzia viaggi con Personal Travel Specialist',    go:'travel',   k:'travel viaggi vacanze agenzia specialist eventi meeting' },
    { t:'Contattaci',       s:'Parliamo del tuo piano di comunicazione',          go:'contattaci', k:'contatti contattaci email telefono preventivo scrivere piano' },
    { t:'Barter',        s:'Copri parte della spesa con i tuoi prodotti',      go:'home',     k:'barter bartering baratto cambio merce compensazione magazzino' },
    { t:'Privacy Policy', s:'Informativa sul trattamento dei dati personali',     go:'privacy', k:'privacy dati personali gdpr legale informativa' },
    { t:'Cookie Policy',  s:'Informazioni sui cookie utilizzati dal sito',        go:'cookie',  k:'cookie preferenze tecnici analitici informativa' }
  ];
  var cmd = document.getElementById('cmd'), cmdVelo = document.getElementById('cmd-velo');
  var cmdQ = document.getElementById('cmd-q'), cmdLista = document.getElementById('cmd-lista');
  var cmdVuoto = document.getElementById('cmd-vuoto');
  var sel = 0, risultati = [], ultimoFocus = null;

  function disegna(){
    var q = cmdQ.value.trim().toLowerCase();
    risultati = VOCI.filter(function(v){
      return !q || (v.t + ' ' + v.s + ' ' + v.k).toLowerCase().indexOf(q) !== -1;
    });
    sel = 0;
    cmdLista.innerHTML = '';
    cmdVuoto.hidden = risultati.length > 0;
    risultati.forEach(function(v, i){
      var li = document.createElement('li');
      li.className = 'cmd-v';
      li.setAttribute('role','option');
      li.id = 'cmd-v-' + i;
      li.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      li.innerHTML = '<span class="ic"><svg viewBox="0 0 20 20"><path d="M3 10h14M12 5l5 5-5 5"/></svg></span>' +
        '<span><span class="tit"></span><span class="sot"></span></span>';
      li.querySelector('.tit').textContent = v.t;
      li.querySelector('.sot').textContent = v.s;
      li.addEventListener('click', function(){ scegli(i); });
      li.addEventListener('mousemove', function(){ evidenzia(i); });
      cmdLista.appendChild(li);
    });
    aggiornaAttivo();
  }
  function aggiornaAttivo(){
    var v = cmdLista.querySelectorAll('.cmd-v');
    for(var i=0;i<v.length;i++){ v[i].setAttribute('aria-selected', i === sel ? 'true' : 'false'); }
    if(v[sel]){
      cmdQ.setAttribute('aria-activedescendant', v[sel].id);
      v[sel].scrollIntoView({ block:'nearest' });
    }
  }
  function evidenzia(i){ sel = i; aggiornaAttivo(); }
  function scegli(i){
    var v = risultati[i];
    if(!v){ return; }
    chiudiCmd();
    if(MP && v.go !== MP.corrente){ location.href = urlPagina(v.go, v.caso || ''); return; }
    vaiConTransizione(v.go);
    /* Le schede dei progetti si aprono sopra la pagina appena arrivata. */
    if(v.caso){ setTimeout(function(){ apriCaso(v.caso); }, 320); }
  }
  function apriCmd(){
    ultimoFocus = document.activeElement;
    cmd.hidden = false; cmdVelo.hidden = false;
    cmdQ.value = ''; disegna(); cmdQ.focus();
  }
  function chiudiCmd(){
    cmd.hidden = true; cmdVelo.hidden = true;
    if(ultimoFocus && ultimoFocus.focus){ ultimoFocus.focus(); }
  }
  document.getElementById('apri-cmd').addEventListener('click', apriCmd);
  cmdVelo.addEventListener('click', chiudiCmd);
  cmdQ.addEventListener('input', disegna);
  var sugg = document.querySelectorAll('.cmd-sugg');
  for(var g=0; g<sugg.length; g++){
    (function(b){ b.addEventListener('click', function(){ cmdQ.value = b.getAttribute('data-sugg'); disegna(); cmdQ.focus(); }); })(sugg[g]);
  }
  document.addEventListener('keydown', function(e){
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); cmd.hidden ? apriCmd() : chiudiCmd(); return; }
    if(cmd.hidden){ return; }
    if(e.key === 'Escape'){ e.preventDefault(); chiudiCmd(); }
    else if(e.key === 'ArrowDown'){ e.preventDefault(); if(risultati.length){ sel = (sel + 1) % risultati.length; aggiornaAttivo(); } }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); if(risultati.length){ sel = (sel - 1 + risultati.length) % risultati.length; aggiornaAttivo(); } }
    else if(e.key === 'Enter'){ e.preventDefault(); scegli(sel); }
    else if(e.key === 'Tab'){ e.preventDefault(); cmdQ.focus(); }   /* focus confinato nel dialogo */
  });

  /* transizione morbida fra pagine dove il browser la supporta */
  function vaiConTransizione(id){
    if(document.startViewTransition && !poco){ document.startViewTransition(function(){ vai(id); }); }
    else{ vai(id); }
  }

  /* Il duplicato ha la stessa misura dell'originale: nessun salto a fine giro.
     La velocità dipende dai pixel da percorrere, anche dopo un resize. */
  var taxiFila = document.querySelector('.taxi-fila');
  if(taxiFila){
    var taxiGruppo = taxiFila.querySelector('.taxi-fila-gruppo');
    var taxiCopia = taxiGruppo.cloneNode(true);
    taxiCopia.setAttribute('aria-hidden','true');
    taxiCopia.querySelectorAll('img').forEach(function(img){img.alt='';});
    taxiFila.querySelector('.taxi-fila-pista').appendChild(taxiCopia);
    function misuraTaxiFila(){
      var larghezza=taxiGruppo.getBoundingClientRect().width;
      if(larghezza){taxiFila.style.setProperty('--taxi-durata',(larghezza/52)+'s');}
    }
    taxiFila.classList.add('pronta');
    new ResizeObserver(misuraTaxiFila).observe(taxiGruppo);
    var taxiVisibile=false;
    function muoviTaxiFila(){taxiFila.classList.toggle('in-vista',taxiVisibile && !document.hidden);}
    new IntersectionObserver(function(voci){
      taxiVisibile=voci[0].isIntersecting;muoviTaxiFila();
    },{threshold:0}).observe(taxiFila);
    document.addEventListener('visibilitychange',muoviTaxiFila);
  }

  /* ── animazioni continue: accese solo se si vedono ───────
     Le due strisce dei loghi e il prisma giravano sempre, anche a
     schermo lontano: due livelli larghi migliaia di pixel ricomposti
     a ogni fotogramma mentre si scorre. Fermarli fuori campo e' quello
     che restituisce fluidita' allo scorrimento. */
  var continue_ = document.querySelectorAll('.loghi-pista, .prisma');
  if(continue_.length && 'IntersectionObserver' in window){
    var vigile = new IntersectionObserver(function(voci){
      for(var i=0;i<voci.length;i++){
        var el = voci[i].target;
        el.style.animationPlayState = voci[i].isIntersecting ? '' : 'paused';
      }
    }, { rootMargin: '160px 0px' });
    for(var w=0; w<continue_.length; w++){ vigile.observe(continue_[w]); }
  }

  /* ── richiamo al simulatore ───────────────────────────────
     Aspetta che l'avviso cookie sia stato deciso, cosi' non si
     accavallano in basso; e non compare a chi e' gia' sul simulatore.
     Resta 9 secondi (la barra in fondo li conta, e si ferma finche' ci
     sei sopra col mouse o col focus), poi se ne va da solo e per il
     resto della visita non torna. */
  var promo = document.getElementById('promo');
  if(promo){
    var CHIAVE_P = 'tmc-promo';
    function chiusaGia(){ try{ return sessionStorage.getItem(CHIAVE_P); }catch(e){ return null; } }
    function segnaChiusa(){ try{ sessionStorage.setItem(CHIAVE_P, '1'); }catch(e){} }
    function nascondiPromo(){
      promo.classList.remove('su');
      setTimeout(function(){ promo.hidden = true; }, 560);
    }
    function forsePromo(){
      if(chiusaGia() || !promo.hidden){ return; }
      var avvisoCookie = document.getElementById('ck');
      if(avvisoCookie && !avvisoCookie.hidden){ return; }
      if(document.querySelector('.pg.on') &&
         document.querySelector('.pg.on').id === 'pg-simulatore'){ return; }
      promo.hidden = false;
      setTimeout(function(){ promo.classList.add('su'); }, 30);
    }
    window.tmcPromo = forsePromo;
    document.getElementById('promo-x').addEventListener('click', function(){
      segnaChiusa(); nascondiPromo();
    });
    document.getElementById('promo-vai').addEventListener('click', function(){
      segnaChiusa(); nascondiPromo();
    });
    document.getElementById('promo-tempo').addEventListener('animationend', function(){
      segnaChiusa(); nascondiPromo();
    });
  }

  /* ── avviso cookie ───────────────────────────────────────
     La scelta va in localStorage, che in finestra anonima o con i dati
     del sito bloccati puo' lanciare: se non riesco a leggerla mostro
     l'avviso, che e' l'esito prudente. window.tmcConsenso resta a
     disposizione di eventuali script futuri. */
  var ck = document.getElementById('ck');
  if(ck){
    var CHIAVE = 'tmc-cookie';
    function leggiCk(){ try{ return localStorage.getItem(CHIAVE); }catch(e){ return null; } }
    function scriviCk(v){ try{ localStorage.setItem(CHIAVE, v); }catch(e){} }
    function mostraCk(){
      var richiamo = document.getElementById('promo');
      if(richiamo && !richiamo.hidden){
        richiamo.classList.remove('su');
        setTimeout(function(){ richiamo.hidden = true; }, 500);
      }
      ck.hidden = false;
      /* non uso requestAnimationFrame: in una scheda aperta in secondo
         piano il browser lo congela, e l'avviso resterebbe montato ma
         invisibile. Un timer breve parte comunque. */
      setTimeout(function(){ ck.classList.add('su'); }, 30);
    }
    function chiudiCk(scelta){
      scriviCk(scelta);
      window.tmcConsenso = scelta;
      ck.classList.remove('su');
      setTimeout(function(){ ck.hidden = true; }, 500);
      setTimeout(function(){ if(window.tmcPromo){ window.tmcPromo(); } }, 650);
    }
    /* Solo strumenti tecnici: non c'e' un consenso da chiedere, l'avviso
       informa e basta. Se un giorno arrivano statistiche o terze parti
       che lo richiedono, qui torna la scelta Accetta / Rifiuta. */
    document.getElementById('ck-si').addEventListener('click', function(){ chiudiCk('tecnici'); });
    var riapri = document.getElementById('ck-riapri');
    if(riapri){ riapri.addEventListener('click', mostraCk); }
    var giaCk = leggiCk();
    window.tmcConsenso = giaCk || null;
    if(!giaCk){ setTimeout(mostraCk, 900); }
    /* due riquadri in basso nello stesso momento sono uno di troppo:
       il richiamo al simulatore aspetta il suo turno */
    if(giaCk){
      setTimeout(function(){ if(window.tmcPromo){ window.tmcPromo(); } }, 500);
    }
  }

  /* ── strisce dei loghi ────────────────────────────────────
     Ogni fila si clona da sola: il clone entra da un lato mentre
     l'originale esce dall'altro e il giro non ha giunte. Clono qui
     invece che nel sorgente per non incorporare due volte le stesse
     immagini. Il nome sotto al logo lo scrivo da JS partendo dall'alt:
     e' gia' li', e cosi' non c'e' una seconda lista da tenere allineata. */
  var strisce = document.querySelectorAll('.loghi');
  for(var ls=0; ls<strisce.length; ls++){
    (function(box){
      var fila = box.querySelector('.loghi-fila');
      if(!fila){ return; }
      var voci = fila.children;
      for(var i=0;i<voci.length;i++){
        var im = voci[i].querySelector('img');
        if(!im || !im.alt){ continue; }
        var eti = document.createElement('span');
        eti.className = 'loghi-nome';
        eti.textContent = im.alt;
        eti.setAttribute('aria-hidden', 'true');
        voci[i].appendChild(eti);
      }
      /* un clic tiene il logo acceso: sulla striscia in movimento
         l'hover da solo dura quanto il puntatore ci resta sopra */
      box.addEventListener('click', function(e){
        var li = e.target.closest ? e.target.closest('li') : null;
        if(!li || !box.contains(li)){ return; }
        var gia = li.classList.contains('acceso');
        var tutti = box.querySelectorAll('li.acceso');
        for(var a=0;a<tutti.length;a++){ tutti[a].classList.remove('acceso'); }
        li.classList.toggle('acceso', !gia);
      });
      if(poco){ return; }
      var copia = fila.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      var im2 = copia.querySelectorAll('img');
      for(var k=0;k<im2.length;k++){ im2[k].alt = ''; }
      fila.parentNode.appendChild(copia);
      var anticipaLoghi=new IntersectionObserver(function(voci){
        if(!voci[0].isIntersecting)return;
        box.querySelectorAll('img').forEach(function(im){im.loading='eager';});
        anticipaLoghi.disconnect();
      },{rootMargin:'500px 0px'});
      anticipaLoghi.observe(box);
      box.classList.add('gira');
    })(strisce[ls]);
  }

  /* ── barter: il giro ──────────────────────────────────────
     Quattro battute: tappa 1, tappa 2, tappa 3, ritorno. Il ritorno
     e' una battuta a se' perche' e' il pezzo che chiude il cerchio e
     merita di essere visto. Mouse sopra ferma, clic salta. */
  var ciclo = document.getElementById('ciclo');
  if(ciclo){
    var tappe = ciclo.querySelectorAll('.cic-tappe > li:not(.cic-giunto)');
    var giunti = ciclo.querySelectorAll('.cic-giunto');
    var bat = 0, giroC = null;   /* 0,1,2 = tappe · 3 = ritorno */

    function battuta(n){
      bat = (n + 4) % 4;
      var attiva = bat < 3 ? bat : -1;
      for(var i=0;i<tappe.length;i++){
        tappe[i].classList.toggle('qui', i === attiva);
        var b = tappe[i].querySelector('.cic-b');
        if(i === attiva){ b.setAttribute('aria-current','step'); }
        else{ b.removeAttribute('aria-current'); }
      }
      for(var g=0;g<giunti.length;g++){
        giunti[g].classList.toggle('passa', bat > g);
      }
      ciclo.classList.toggle('ritorna', bat === 3);
    }
    function avantiC(){ battuta(bat + 1); }
    function avviaC(){
      clearInterval(giroC);
      if(poco || document.hidden){ return; }
      giroC = setInterval(avantiC, 1900);
    }
    function fermaC(){ clearInterval(giroC); }

    for(var t=0;t<tappe.length;t++){
      (function(i){
        var b = tappe[i].querySelector('.cic-b');
        b.addEventListener('click', function(){ battuta(i); avviaC(); });
        b.addEventListener('focus', function(){ battuta(i); });
      })(t);
    }
    ciclo.addEventListener('mouseenter', fermaC);
    ciclo.addEventListener('mouseleave', avviaC);
    ciclo.addEventListener('focusin', fermaC);
    ciclo.addEventListener('focusout', function(e){
      if(!ciclo.contains(e.relatedTarget)){ avviaC(); }
    });
    document.addEventListener('visibilitychange', function(){
      document.hidden ? fermaC() : avviaC();
    });
    battuta(0);
    avviaC();
  }

  /* ── simulatore di copertura ──────────────────────────────
     Taxi e OOH producono contatti ogni giorno di esposizione e hanno
     ciascuno il proprio calendario: il taxi si vende a mese e lavora
     ~26 giorni su 30, l'affissione parte dai 14 giorni ed e' in strada
     tutti i giorni. Anche la radio ha la propria durata e lavora con una
     pressione da 6 a 12 spot al giorno. Le cifre stanno tutte qui.

     Radio: ascoltatori nel giorno medio, totale Italia, Audiradio 1° trim.
     2026 (locali: semestre 14/10/2025-13/4/2026; nazionali: 27/1-13/4/2026).
     Il dato disponibile e' la media degli ascoltatori nel giorno medio.
     Sei spot sono l'unita' minima giornaliera: per stimare i contatti lordi
     si applica ascoltatori / 6 * spot al giorno * giorni di campagna.
       locali (le nostre, 10): DS Roma 313, DS Soft Roma 439, Ram Power 254,
         Radio Globo 325, Radio Sei Lazio 62, Rete Sport Roma 75, Centro Suono
         Sport 25, Radio Rock 209, Radio Roma Capitale 47, Discoradio 535
         -> 2.284 mila / 10 = 228 mila
       nazionali (le nostre + RadioMediaset senza Radio Norba, 9): RTL 6.492,
         Radio Italia 6.138, RDS 6.011, Radio 105 4.947, Virgin 2.899,
         Radio 24 2.685, R101 2.540, Radio Subasio 2.410, RMC 2.187
         -> 36.309 mila / 9 = 4.034 mila
     Web: utenti unici nel giorno medio delle testate di news online sopra
     i 500 mila, Audicom-Audiweb novembre 2025 (siti + app): Corriere 3.100,
     Repubblica 2.600, Fatto 1.300, Messaggero 1.200, Fanpage 1.071,
     TGCOM24 1.000, QN 965, La Stampa 821, RaiNews 769, ANSA 704,
     Adnkronos 645, Leggo 546, Sole 24 Ore 507, Gazzettino 505
       -> 15.733 mila / 14 = 1.124 mila
     Sono contatti lordi, non persone uniche: le ripetizioni possono quindi
     contare piu' volte la stessa persona. */
  var CANALI = [
    { k:'taxi',  et:'Taxi',  col:'#4864EC', per:15000,   giorni:26, un:['mezzo','mezzi'] },
    { k:'ooh',   et:'OOH',   col:'#7D93F7', per:18000,   giorni:30, un:['impianto','impianti'] },
    { k:'radio', et:'Radio locale', col:'#A9B8F7', per:228000, giorni:7, baseSpot:6, un:['spot al giorno','spot al giorno'] },
    { k:'web',   et:'Web Journalism', col:'#D7DEFB', per:1124000, giorni:0,  un:['articolo','articoli'] }
  ];

  if(document.getElementById('sim-taxi')){
    var simNum = document.getElementById('sim-num');
    var simBarra = document.getElementById('sim-barra');
    var simRighe = document.getElementById('sim-righe');
    /* pieno della barra: ogni canale al massimo, per la sua durata piu' lunga */
    var MAX = 0;
    for(var m=0;m<CANALI.length;m++){
      var box0 = document.querySelector('.sim-can[data-can="' + CANALI[m].k + '"]');
      var ult = box0.querySelectorAll('.sim-dur .chip');
      var tipi0 = box0.querySelectorAll('.sim-tipo .chip'), perMax = CANALI[m].per;
      for(var q0=0;q0<tipi0.length;q0++){ perMax = Math.max(perMax, +tipi0[q0].getAttribute('data-per')); }
      MAX += (+document.getElementById('sim-' + CANALI[m].k).max) * perMax *
             (ult.length ? +ult[ult.length - 1].getAttribute('data-giorni') : 1) /
             (CANALI[m].baseSpot || 1);
    }
    simBarra.innerHTML = CANALI.map(function(c){
      return '<i data-seg="' + c.k + '" style="background:' + c.col + '"></i>';
    }).join('');

    var simArena = document.getElementById('sim-arena');
    var simPage = document.getElementById('pg-simulatore');
    var simDisplay = simPage.querySelector('.sim-display');
    var simCanvas = document.getElementById('sim-particles');
    var simCtx = simCanvas.getContext('2d');
    var simDelta = document.getElementById('sim-delta');
    var simMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var simInView = false, simRunning = false;
    var simRAF = null, simClock = 0, simTick = 0, simW = 0, simH = 0;
    var simSparks = [], simEnergy = {}, simFeedbackTimer = null;
    var simPointer = null;
    var simDest = [[.17,.26],[.83,.26],[.17,.75],[.83,.75]];

    /* La scena e' decorativa: le quantita' arrivano sempre da calcola().
       Nessun punteggio casuale e nessun download aggiuntivo per il logo. */
    function simSize(){
      var r = simArena.getBoundingClientRect();
      simW = r.width; simH = r.height;
      if(!simW || !simH){ return; }
      var ratio = Math.min(window.devicePixelRatio || 1,2);
      simCanvas.width = Math.round(simW * ratio); simCanvas.height = Math.round(simH * ratio);
      if(simCtx){ simCtx.setTransform(ratio,0,0,ratio,0,0); }
    }
    function simBurst(key,full){
      if(!simRunning || !simCtx){ return; }
      var i = CANALI.findIndex(function(c){ return c.k === key; });
      var x = i < 0 ? .5 : simDest[i][0], y = i < 0 ? .48 : simDest[i][1];
      var count = full ? 28 : 8;
      for(var j=0;j<count;j++){
        var angle = Math.random()*Math.PI*2, speed = full ? 32+Math.random()*72 : 18+Math.random()*38;
        simSparks.push({x:x*simW,y:y*simH,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
          age:0,life:.6+Math.random()*.8,size:1+Math.random()*1.4});
      }
      if(simSparks.length > 80){ simSparks.splice(0,simSparks.length-80); }
    }
    function simDraw(t){
      if(!simRunning){ return; }
      var dt = simTick ? Math.min((t-simTick)/1000,.05) : 0;
      simTick = t; simClock += dt;
      if(simCtx && simW && simH){
        simCtx.clearRect(0,0,simW,simH);
        /* Un campo leggero di particelle e quattro flussi legati ai canali. */
        for(var j=0;j<18;j++){
          var sx = ((j*73.31+simClock*(2+j%3))%100)/100*simW;
          var sy = ((j*47.13)%100)/100*simH;
          var light = .04+.09*(.5+.5*Math.sin(simClock+j));
          simCtx.fillStyle='rgba(182,205,255,'+light+')';
          simCtx.beginPath();simCtx.arc(sx,sy,j%5===0?1.5:.7,0,Math.PI*2);simCtx.fill();
        }
        for(var i=0;i<CANALI.length;i++){
          var energy = simEnergy[CANALI[i].k] || 0;
          if(!energy){ continue; }
          for(var k=0;k<4;k++){
            var p = (simClock*(.09+energy*.16)+k/4+i*.06)%1;
            var x0=simW*.5,y0=simH*.48,x1=simW*simDest[i][0],y1=simH*simDest[i][1];
            var cx=simW*(i%2?.67:.33),cy=y0;
            var px=(1-p)*(1-p)*x0+2*(1-p)*p*cx+p*p*x1;
            var py=(1-p)*(1-p)*y0+2*(1-p)*p*cy+p*p*y1;
            simCtx.fillStyle='rgba(212,229,255,'+Math.sin(p*Math.PI)*(.24+energy*.42)+')';
            simCtx.beginPath();simCtx.arc(px,py,1+energy*.7,0,Math.PI*2);simCtx.fill();
          }
        }
        for(var b=simSparks.length-1;b>=0;b--){
          var spark=simSparks[b];spark.age+=dt;
          if(spark.age>=spark.life){simSparks.splice(b,1);continue;}
          spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;
          simCtx.fillStyle='rgba(217,233,255,'+(1-spark.age/spark.life)+')';
          simCtx.beginPath();simCtx.arc(spark.x,spark.y,spark.size,0,Math.PI*2);simCtx.fill();
        }
        if(simPointer){
          var glow=simCtx.createRadialGradient(simPointer.x,simPointer.y,0,simPointer.x,simPointer.y,65);
          glow.addColorStop(0,'rgba(150,179,255,.07)');glow.addColorStop(1,'rgba(150,179,255,0)');
          simCtx.fillStyle=glow;simCtx.fillRect(0,0,simW,simH);
        }
      }
      simRAF=requestAnimationFrame(simDraw);
    }
    function simMotion(){
      var reduced=simMotionQuery.matches;
      var run=simPage.classList.contains('on') && simInView && !document.hidden && !reduced;
      simPage.classList.toggle('sim-motion',run);
      if(run===simRunning){return;}
      simRunning=run;
      if(run){
        simSize();simTick=0;
        simRAF=requestAnimationFrame(simDraw);
      }else{
        cancelAnimationFrame(simRAF);simRAF=null;simTick=0;
        simSparks=[];
        if(simCtx){simCtx.clearRect(0,0,simW,simH);}
      }
    }
    new ResizeObserver(simSize).observe(simArena);
    new IntersectionObserver(function(entries){simInView=entries[0].isIntersecting;simMotion();},
      {threshold:0}).observe(simDisplay);
    document.addEventListener('visibilitychange',simMotion);
    simMotionQuery.addEventListener('change',simMotion);
    simArena.addEventListener('pointermove',function(e){
      if(e.pointerType==='touch' || !simRunning){return;}
      var r=simArena.getBoundingClientRect();simPointer={x:e.clientX-r.left,y:e.clientY-r.top};
    });
    simArena.addEventListener('pointerleave',function(){simPointer=null;});
    var simScrollFrame=null;
    function simCompact(){
      simScrollFrame=null;
      if(!simPage.classList.contains('on')){return;}
      var header=document.querySelector('.hdr').getBoundingClientRect().height;
      var top=simPage.querySelector('.sim-corpo').getBoundingClientRect().top;
      simDisplay.classList.toggle('sim-compact',window.innerWidth<=980 && top<header-12);
    }
    window.addEventListener('scroll',function(){
      if(simPage.classList.contains('on') && simScrollFrame===null){simScrollFrame=requestAnimationFrame(simCompact);}
    },{passive:true});
    window.addEventListener('resize',simCompact);
    function simFeedback(key){
      simPage.querySelectorAll('.sim-selected').forEach(function(el){el.classList.remove('sim-selected');});
      if(key){simPage.querySelector('.sim-can[data-can="'+key+'"]').classList.add('sim-selected');simBurst(key,false);}
    }
    simPage.querySelector('.sim-comandi').addEventListener('input',function(e){
      var box=e.target.closest('.sim-can');if(box){simFeedback(box.dataset.can);}
    });
    simPage.querySelector('.sim-comandi').addEventListener('click',function(e){
      var box=e.target.closest('.sim-can');if(box){simFeedback(box.dataset.can);}
    });
    var simFrame = null, simValore = null, simUltimo = null, simPulse = null;
    function mostraTotale(tot){
      if(tot === simUltimo){ return; }
      if(simUltimo!==null && simPage.classList.contains('on')){
        var delta=tot-simUltimo;
        simDelta.textContent=(delta>0?'+':'−')+Math.abs(delta).toLocaleString('it-IT');
        simDelta.classList.remove('pop');void simDelta.offsetWidth;simDelta.classList.add('pop');
        clearTimeout(simFeedbackTimer);simFeedbackTimer=setTimeout(function(){simDelta.classList.remove('pop');},1500);
      }
      simUltimo = tot;
      cancelAnimationFrame(simFrame);
      if(poco || simValore === null || !document.getElementById('pg-simulatore').classList.contains('on')){
        simValore = tot; simNum.textContent = tot.toLocaleString('it-IT'); return;
      }
      var da = simValore, inizio = null;
      simNum.setAttribute('aria-busy','true');
      simNum.classList.remove('pulse');
      clearTimeout(simPulse);
      function tick(t){
        if(inizio === null){ inizio = t; }
        var q = Math.min(1,(t-inizio)/420);
        simValore = Math.round(da+(tot-da)*(1-Math.pow(1-q,3)));
        simNum.textContent = simValore.toLocaleString('it-IT');
        if(q < 1){ simFrame = requestAnimationFrame(tick); }
        else{ simNum.removeAttribute('aria-busy'); simNum.classList.add('pulse');
          simPulse = setTimeout(function(){simNum.classList.remove('pulse');},450); }
      }
      simFrame = requestAnimationFrame(tick);
    }
    function calcola(){
      var tot = 0, quote = {}, righe = '';
      for(var a=0;a<CANALI.length;a++){
        var c = CANALI[a];
        var box = document.querySelector('.sim-can[data-can="' + c.k + '"]');
        var n = +document.getElementById('sim-' + c.k).value;
        document.getElementById('sim-' + c.k + '-val').textContent =
          n + ' ' + (n === 1 ? c.un[0] : c.un[1]);
        var q = box.classList.contains('on') ?
          Math.round(n * c.per * (c.giorni || 1) / (c.baseSpot || 1)) : 0;
        quote[c.k] = q; tot += q;
        var slider = document.getElementById('sim-' + c.k);
        slider.style.setProperty('--fill',((n-slider.min)/(slider.max-slider.min)*100)+'%');
        var on = box.classList.contains('on');
        box.querySelector('[data-step="-1"]').disabled = !on || n <= +slider.min;
        box.querySelector('[data-step="1"]').disabled = !on || n >= +slider.max;
        var nodo = simArena.querySelector('[data-node="'+c.k+'"]');
        nodo.classList.toggle('on',on); nodo.setAttribute('aria-pressed',String(on));
        nodo.style.setProperty('--level',(n-slider.min)/(slider.max-slider.min));
        simArena.querySelector('[data-path="'+c.k+'"]').classList.toggle('on',on);
        var maxDays=c.k==='taxi'?312:c.k==='ooh'?365:c.k==='radio'?30:1;
        var maxPer=c.k==='radio'?4034000:c.per;
        var channelMax=(+slider.max)*maxPer*maxDays/(c.baseSpot||1);
        simEnergy[c.k]=on?.2+.8*Math.sqrt(q/channelMax):0;
        simArena.querySelector('[data-path="'+c.k+'"]').style.setProperty('--speed',(5-simEnergy[c.k]*3)+'s');

        if(q){
          righe += '<li><span class="pt" style="background:' + c.col + '"></span>' +
                   c.et + (c.k === 'radio' ? ' · ' + n + '/giorno' : '') +
                   '<b>' + q.toLocaleString('it-IT') + '</b></li>';
        }
      }
      mostraTotale(tot);
      simArena.classList.toggle('vuota',tot === 0);
      simRighe.innerHTML = righe ||
        '<li class="sim-vuoto">Accendi almeno un canale per vedere la stima.</li>';
      /* la barra cresce a radice quadrata, se no il web da solo non
         muoverebbe un pixel accanto al taxi; i segmenti dentro
         dividono quella larghezza in proporzione */
      simBarra.style.width = (tot ? Math.max(4, Math.sqrt(tot / MAX) * 100) : 0) + '%';
      for(var b=0;b<CANALI.length;b++){
        simBarra.querySelector('[data-seg="' + CANALI[b].k + '"]').style.width =
          (tot ? quote[CANALI[b].k] / tot * 100 : 0) + '%';
      }
    }

    for(var d=0;d<CANALI.length;d++){
      (function(c){
        var box = document.querySelector('.sim-can[data-can="' + c.k + '"]');
        var rng = document.getElementById('sim-' + c.k);
        rng.addEventListener('input', calcola);
        box.querySelector('.sim-sw').addEventListener('click', function(){
          var acceso = !box.classList.contains('on');
          box.classList.toggle('on', acceso);
          this.setAttribute('aria-pressed', acceso ? 'true' : 'false');
          /* canale spento = comandi fuori dal giro del tab, non solo nascosti */
          rng.disabled = !acceso;
          var ch = box.querySelectorAll('.sim-dur .chip, .sim-tipo .chip');
          for(var z=0;z<ch.length;z++){ ch[z].disabled = !acceso; }
          calcola();
        });
        var tipi = box.querySelectorAll('.sim-tipo .chip');
        var tipoAcceso = box.querySelector('.sim-tipo .chip.att');
        if(tipoAcceso){ c.per = +tipoAcceso.getAttribute('data-per'); c.et = tipoAcceso.getAttribute('data-et'); }
        for(var w=0;w<tipi.length;w++){
          (function(pulsante){
            pulsante.addEventListener('click', function(){
              c.per = +pulsante.getAttribute('data-per');
              c.et = pulsante.getAttribute('data-et');
              for(var k=0;k<tipi.length;k++){
                tipi[k].classList.toggle('att', tipi[k] === pulsante);
                tipi[k].setAttribute('aria-checked', tipi[k] === pulsante ? 'true' : 'false');
              }
              calcola();
            });
          })(tipi[w]);
        }
        var chips = box.querySelectorAll('.sim-dur .chip');
        /* la durata di partenza la leggo dal chip acceso, non da un numero
           scritto due volte: cosi' il totale non puo' smentire quello che
           si vede selezionato */
        var acceso = box.querySelector('.sim-dur .chip.att');
        if(acceso){ c.giorni = +acceso.getAttribute('data-giorni'); }
        for(var y=0;y<chips.length;y++){
          (function(pulsante){
            pulsante.addEventListener('click', function(){
              c.giorni = +pulsante.getAttribute('data-giorni');
              for(var k=0;k<chips.length;k++){
                chips[k].classList.toggle('att', chips[k] === pulsante);
                chips[k].setAttribute('aria-checked', chips[k] === pulsante ? 'true' : 'false');
              }
              calcola();
            });
          })(chips[y]);
        }
        var inizialmenteAcceso = box.classList.contains('on');
        rng.disabled = !inizialmenteAcceso;
        var controlli = box.querySelectorAll('.sim-dur .chip, .sim-tipo .chip');
        for(var z0=0;z0<controlli.length;z0++){ controlli[z0].disabled = !inizialmenteAcceso; }
      })(CANALI[d]);
    }
    document.querySelectorAll('.sim-step').forEach(function(b){
      b.addEventListener('click',function(){
        var range = document.getElementById('sim-'+b.dataset.range);
        if(range.disabled){ return; }
        range.value = Math.max(+range.min,Math.min(+range.max,+range.value+(+b.dataset.step)*(+range.step)));
        range.dispatchEvent(new Event('input',{bubbles:true}));
      });
    });
    simArena.querySelectorAll('.sim-node').forEach(function(b){
      b.addEventListener('click',function(){ document.getElementById('sw-'+b.dataset.node).click(); });
    });
    document.getElementById('sim-reset').addEventListener('click',function(){
      CANALI.forEach(function(c){
        var box=simPage.querySelector('.sim-can[data-can="'+c.k+'"]');
        box.classList.remove('on');
        box.querySelector('.sim-sw').setAttribute('aria-pressed','false');
        var slider=document.getElementById('sim-'+c.k);
        slider.value=slider.min;slider.disabled=true;
        var durate=box.querySelectorAll('.sim-dur .chip');
        for(var i=0;i<durate.length;i++){
          durate[i].classList.toggle('att',i===0);durate[i].setAttribute('aria-checked',i===0?'true':'false');durate[i].disabled=true;
        }
        if(durate[0]){c.giorni=+durate[0].getAttribute('data-giorni');}
        var tipi=box.querySelectorAll('.sim-tipo .chip');
        for(var j=0;j<tipi.length;j++){
          tipi[j].classList.toggle('att',j===0);tipi[j].setAttribute('aria-checked',j===0?'true':'false');tipi[j].disabled=true;
        }
        if(tipi[0]){c.per=+tipi[0].getAttribute('data-per');c.et=tipi[0].getAttribute('data-et');}
      });
      simFeedback(null);calcola();
    });
    document.addEventListener('tmc:page',function(){
      cancelAnimationFrame(simFrame);clearTimeout(simPulse);
      if(simUltimo !== null){ simValore=simUltimo;simNum.textContent=simUltimo.toLocaleString('it-IT'); }
      simNum.removeAttribute('aria-busy');simNum.classList.remove('pulse');
      simMotion();simCompact();
    });
    calcola();
  }

  var iniz = percorsoDaIndirizzo();
  /* l'ancora va letta prima: la navigazione ripulisce l'indirizzo */
  var anc = (location.hash || '').replace('#','');
  vai(PG.indexOf(iniz.split('/')[0]) !== -1 ? iniz : 'home');

  /* Arrivo da un'altra pagina: riprendo quello che il pulsante voleva fare. */
  if(MP){
    if(anc.indexOf('motivo=') === 0){
      var pezzi = anc.slice(7).split('&');
      if(pezzi[0]){ applicaMotivo(decodeURIComponent(pezzi[0])); }
      if(anc.indexOf('app=1') !== -1){ applicaAppuntamento(); }
    } else if(anc.indexOf('srv-') === 0){
      segnalaCard(anc.slice(4));
    } else if(anc){
      var apri = document.getElementById(anc);
      if(apri && apri.tagName === 'DIALOG'){ apriCaso(anc); }
    }
  }
})();
