
(function(){
  'use strict';
  /* Con le pagine separate questo blocco serve solo dove ci sono le sue
     sezioni: altrove non c'e' niente da far funzionare e uscire subito
     evita errori. Come pagina unica le sezioni ci sono sempre. */
  if(!document.getElementById('pg-travel') && !document.getElementById('pg-richiesta')){ return; }
  var data=JSON.parse(document.getElementById('tmc-data').textContent);
  var categories=data.categories, products=data.products, files=data.files;
  var byId=Object.create(null);products.forEach(function(p){byId[p.id]=p;});
  var dialog=document.getElementById('tmc-detail'),dialogBody=document.getElementById('tmc-detail-body');
  var lastFocus=null, reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function file(n){return typeof n==='number'?files[n]:(n||'');}
  function category(id){return categories.find(function(c){return c.id===id;});}
  function normalize(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function arrow(){return '<span class="tmc-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></span>';}
  function price(p){var n=p.price;return '<div class="tmc-price">'+(n?'<small>Prezzo riservato</small>'+(p.regularPrice?'<del aria-label="Prezzo di listino '+esc(p.regularPrice)+'">'+esc(p.regularPrice)+'</del>':'')+'<strong>'+esc(n)+'</strong>':'<span class="tmc-no-price">'+(p.categories.indexOf('travel')!==-1?'Scopri il soggiorno':'Scopri l’offerta')+'</span>')+'</div>';}
  function amount(p){var m=p.price.match(/\d[\d.]*,\d{2}/);return m?Number(m[0].replace(/\./g,'').replace(',','.')):null;}
  function hydrate(root){root.querySelectorAll('[data-tmc-asset]').forEach(function(img){img.src=file(Number(img.getAttribute('data-tmc-asset')));});}
  function categoryLabel(p){return p.categories.map(function(id){return category(id)?.name||(id==='prenota'?'In prenotazione':id);}).join(' · ');}
  function requestLink(id,classes){return '<a class="'+classes+'" href="#richiesta/'+esc(id)+'" data-tmc-request="'+esc(id)+'">Richiedi informazioni <span aria-hidden="true">→</span></a>';}
  // Temporary, device-local preview access explicitly requested by the owner.
  // This is not server-side membership protection. Replace before real subscriber accounts.
  var member=false,currentProduct=null;
  try{member=sessionStorage.getItem('tmc-travel-demo-access')==='yes';}catch(e){}
  function lock(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>';}
  // Tutta la pagina TMC Travel e' riservata: prima lo era solo la selezione
  // Alpitour, ora il lucchetto vale anche sulle cinque strutture curate.
  // Vale pero' solo per le schede del catalogo: le voci di richiesta
  // ("Viaggio su misura", il volo) restano aperte, altrimenti per iscriversi
  // bisognerebbe essere gia' iscritti.
  function isLocked(p){return !!(p&&byId[p.id])&&!member;}
  function discountLabel(){return 'SCONTO TMC TRAVEL';}
  /* Finche' non si entra lo sconto non si accenna nemmeno: niente
     percentuale mascherata, niente etichetta. Compare solo da iscritti. */
  function discount(p){if(isLocked(p))return '';
    return '<div class="tmc-discount"><span>'+discountLabel(p)+'</span><strong>−'+esc(p.discount)+'%</strong></div>';}
  function operator(p){return '<div class="tmc-operator"><a href="'+esc(p.source)+'" target="_blank" rel="noopener noreferrer" aria-label="Vedi '+esc(p.name)+' sul sito '+esc(p.operator)+' (nuova scheda)"><img src="'+esc(p.operatorLogo)+'" alt="'+esc(p.operator)+'" width="194" height="40" loading="lazy" decoding="async"><span aria-hidden="true">↗</span></a><p>Offerta '+esc(p.operator)+'.<br>TMC Travel opera come agenzia di viaggi.</p></div>';}
  function card(p){var locked=isLocked(p);
    return '<article class="tmc-product tmc-product--travel'+(locked?' is-locked':'')+'"><div class="tmc-product-image"><img src="'+esc(file(p.image))+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async">'+(locked?'<span class="tmc-card-lock" role="button" tabindex="0" aria-label="Riservato agli iscritti: vai all’iscrizione">'+lock()+'<span>Riservato agli iscritti</span></span>':'')+'<span class="tmc-product-tag">'+esc(p.member?'Selezione '+p.operator:p.place.split(' · ').slice(-1)[0])+'</span></div><div class="tmc-product-content"><div class="tmc-product-k">'+esc(p.place)+'</div><h3><button type="button" data-tmc-product="'+esc(p.id)+'" aria-haspopup="dialog" aria-controls="tmc-detail">'+esc(p.name)+'</button></h3><p class="tmc-product-summary">'+esc(p.teaser)+'</p>'+(p.member||locked?'':'<div class="tmc-product-bottom">'+discount(p)+arrow()+'</div>')+(locked?'<button class="tmc-product-request" type="button" data-tmc-product="'+esc(p.id)+'" aria-haspopup="dialog">Richiedi informazioni <span aria-hidden="true">→</span></button>':requestLink(p.id,'tmc-product-request'))+(p.member?operator(p):'')+'</div></article>';
  }
  var collection=document.getElementById('tmc-travel-catalogo');
  var travelQuery=collection&&collection.querySelector('[data-tmc-query]'),travelSort=collection&&collection.querySelector('[data-tmc-sort]');
  /* Una griglia sola: le strutture curate e le proposte Alpitour stanno
     insieme, tanto si distinguono gia' da sole - le seconde portano il
     marchio dell'operatore. Due titoli per lo stesso pubblico erano solo
     pagina in piu' da scorrere. */
  function renderTravel(){
    var q=normalize(travelQuery.value.trim());
    var list=products.filter(function(p){return !q||normalize(p.name+' '+p.place+' '+p.teaser+' '+(p.operator||'')).indexOf(q)!==-1;});
    if(travelSort.value==='name')list.sort(function(a,b){return a.name.localeCompare(b.name,'it');});
    collection.querySelector('.tmc-products').innerHTML=list.map(card).join('');
    collection.querySelector('[data-tmc-count]').textContent=list.length+' '+(list.length===1?'proposta':'proposte');
    collection.querySelector('.tmc-empty').hidden=!!list.length;
  }
  function renderMembers(){
    /* i comandi di accesso sono ripetuti in ogni sezione: chi arriva a meta'
       pagina deve poter entrare senza risalire in cima */
    document.querySelectorAll('[data-member-access]').forEach(function(b){b.hidden=member;});
    document.querySelectorAll('[data-member-status]').forEach(function(b){b.hidden=!member;});
    document.querySelectorAll('[data-member-logout]').forEach(function(b){b.hidden=!member;});
    renderVoli();renderSuMisura();
  }

  /* Il volo e' una scheda come le altre: sta in byId ma non fra i products,
     cosi' non finisce nelle griglie e passa comunque dal dialogo, dal
     lucchetto e dal modulo di richiesta. Sul banner la percentuale non
     compare: si legge dentro, dopo l'accesso. */
  /* I due voli sono schede come le altre: stanno in byId ma non fra i
     products, cosi' non finiscono nelle griglie e passano comunque dal
     dialogo, dal lucchetto e dal modulo di richiesta. Sul banner la
     percentuale non compare: si legge dentro, dopo l'accesso. */
  var VOLI=[
    {id:'voli-turkish',nome:'Turkish Airlines',
     titolo:'Vola con Turkish Airlines.',occhiello:'',
     foto:'img/travel/turkish-aereo.jpg',fotoAlt:'Code di aeromobili Turkish Airlines in aeroporto al tramonto',
     logo:'img/travel/turkish-logo.png',logoW:324,logoH:94,sito:'https://www.turkishairlines.com/it-it/',
     apertura:'La compagnia che tocca più Paesi di qualunque altra: 287 destinazioni, da Istanbul verso Europa, Asia, Africa e Americhe.',
     resto:'Cabine doppie e triple, con la Premium Economy in mezzo.',
     scheda:'<p>Turkish Airlines collega 287 destinazioni nel mondo, 51 delle quali in Turchia, con voli in 113 Paesi fra Europa, Asia, Africa e Americhe. A bordo, cabine doppie (Business ed Economy) e triple, con la Premium Economy in mezzo.</p>'},
    {id:'voli-aeroitalia',nome:'Aeroitalia',
     titolo:'Vola con Aeroitalia.',occhiello:'',
     foto:'img/travel/aeroitalia-aereo.jpg',fotoAlt:'Un Boeing 737 Aeroitalia in decollo al tramonto',
     logo:'img/travel/aeroitalia-logo.png',logoW:312,logoH:78,sito:'https://www.aeroitalia.com/',
     apertura:'La compagnia italiana: collegamenti fra le città del Paese e le isole, con una flotta di Boeing 737.',
     resto:'Dalle rotte nazionali ai voli internazionali, si parte dai principali aeroporti italiani. Il volo si prenota tramite TMC Travel, che segue il preventivo e la prenotazione.',
     scheda:'<p>Aeroitalia è una compagnia italiana con flotta Boeing 737. Collega le città del Paese e le isole, e affianca alle rotte nazionali una serie di collegamenti internazionali.</p>'}
  ];
  VOLI.forEach(function(v){
    byId[v.id]={id:v.id,name:v.titolo.replace(/\.$/,''),place:v.occhiello,
      teaser:v.apertura,image:v.foto,gallery:[v.foto],
      categories:['travel'],subcategories:[],member:false,discount:10,
      summary:v.scheda,
      panels:[{id:'offerta',html:'<h3>La convenzione TMC</h3><p>Sconto TMC Travel del <strong>10%</strong> su tutti i voli {C} la cui <strong>partenza iniziale avviene da un aeroporto italiano</strong>, qualunque sia la destinazione finale.</p><h3>Come si prenota</h3><p>Il volo si prenota tramite TMC Travel. Indica date, aeroporto di partenza, destinazione e numero di passeggeri: il consulente verifica classi disponibili e prepara il preventivo.</p><p>Tariffe, disponibilità e condizioni della compagnia vengono riconfermate nel preventivo.</p>'.replace('{C}',v.nome==='Turkish Airlines'?'Turkish Airlines':'Aeroitalia')}],
      price:'',regularPrice:'',priceText:'',available:true,preorder:false,url:'#richiesta/'+v.id};
  });

  /* Le destinazioni del menu a tendina, con la bandierina davanti. Una sola
     lista, riempie tutte le tendine marcate data-tmc-destinazioni. */
  var DESTINAZIONI=[['🇮🇹','Italia'],['🇬🇷','Grecia'],['🇪🇸','Spagna'],['🇵🇹','Portogallo'],
    ['🇫🇷','Francia'],['🇹🇷','Turchia'],['🇪🇬','Egitto'],['🇲🇦','Marocco'],['🇹🇿','Zanzibar'],
    ['🇨🇻','Capo Verde'],['🇲🇻','Maldive'],['🇦🇪','Emirati Arabi'],['🇹🇭','Thailandia'],
    ['🇮🇩','Indonesia'],['🇯🇵','Giappone'],['🇺🇸','Stati Uniti'],['🇲🇽','Messico'],
    ['🇧🇷','Brasile'],['🇨🇺','Cuba'],['🇩🇴','Repubblica Dominicana']];
  function opzioniDestinazioni(){
    return '<option value="">Scegli una destinazione…</option>'+
      DESTINAZIONI.map(function(d){return '<option value="'+esc(d[1])+'">'+d[0]+'  '+esc(d[1])+'</option>';}).join('')+
      '<option value="Altro">🌍  Altro</option>'+
      '<option value="Non ho ancora deciso">🧭  Non ho ancora deciso</option>';
  }

  /* Riquadro "su misura": chiuso invita a iscriversi, aperto manda al modulo
     di richiesta - quello grande ha gia' destinazione, date, viaggiatori e
     messaggio, quindi un secondo modulo qui sarebbe stato un doppione. */
  function vaiAllaRichiesta(){requestSelected=null;location.hash='#richiesta/travel';}
  function renderSuMisura(){
    var box=document.getElementById('tmc-sumisura');if(!box)return;
    if(!member){
      box.innerHTML='<div class="tmc-sumisura-chiuso"><span class="tmc-gate-icon">'+lock()+'</span>'+
        '<div><strong>Il modulo su misura è per gli iscritti.</strong>'+
        '<p>Iscriviti e raccontaci il viaggio che hai in mente: ti rispondiamo con una proposta.</p></div>'+
        '<button type="button" class="b b--pri" data-sumisura-accesso>Iscriviti <span aria-hidden="true">→</span></button></div>';
      box.querySelector('[data-sumisura-accesso]').addEventListener('click',function(){apriAccesso(this,vaiAllaRichiesta);});
      return;
    }
    box.innerHTML='<a class="b b--pri" href="#richiesta/travel" data-tmc-request="travel">Scrivici dove vuoi andare <span aria-hidden="true">→</span></a>';
  }

  function renderVoli(){
    var box=document.getElementById('tmc-voli-banner');if(!box)return;
    var chiuso=!member;
    box.innerHTML='<div class="tmc-voli-griglia">'+VOLI.map(function(v){
      return '<article class="tmc-voli-banner">'+
        '<div class="tmc-voli-foto'+(chiuso?' is-locked':'')+'">'+
          '<img src="'+esc(v.foto)+'" alt="'+esc(v.fotoAlt)+'" loading="lazy" decoding="async">'+
          (chiuso?'<span class="tmc-card-lock" role="button" tabindex="0" aria-label="Riservato agli iscritti: vai all’iscrizione">'+lock()+'<span>Riservato agli iscritti</span></span>':'')+
        '</div>'+
        '<div class="tmc-voli-testo">'+
          (v.occhiello?'<span class="occhiello">'+esc(v.occhiello)+'</span>':'')+
          '<h3>'+esc(v.titolo)+'</h3>'+
          '<div class="tmc-voli-descrizione"><p>'+esc(v.apertura)+'</p>'+
            (chiuso?'<p class="tmc-voli-velato" aria-hidden="true">'+esc(v.resto)+'</p>'
                   :'<p>'+esc(v.resto)+'</p>')+
          '</div>'+
          (chiuso?'<p class="tmc-voli-chiuso">'+lock()+'Il resto è riservato agli iscritti.</p>'
                 :'<div class="tmc-discount tmc-voli-sconto"><span>'+discountLabel()+'</span><strong>−10%</strong></div>')+
          /* una riga sola in fondo: il bottone a sinistra, il marchio a destra.
             La nota "TMC Travel opera come agenzia di viaggi" sta gia' sotto
             la griglia delle proposte e dentro la scheda, qui era di troppo. */
          '<div class="tmc-voli-azioni">'+
            '<button type="button" class="b b--pri" data-tmc-product="'+esc(v.id)+'" aria-haspopup="dialog" aria-controls="tmc-detail">'+
            (chiuso?'Iscriviti':'Vedi la scheda')+' <span aria-hidden="true">→</span></button>'+
            (v.sito
              ? '<a class="tmc-voli-marchio-targa" href="'+esc(v.sito)+'" target="_blank" rel="noopener noreferrer" aria-label="Vai al sito di '+esc(v.nome)+' (nuova scheda)"><img src="'+esc(v.logo)+'" alt="'+esc(v.nome)+'" width="'+v.logoW+'" height="'+v.logoH+'" loading="lazy" decoding="async"></a>'
              : '<span class="tmc-voli-marchio-targa"><img src="'+esc(v.logo)+'" alt="'+esc(v.nome)+'" width="'+v.logoW+'" height="'+v.logoH+'" loading="lazy" decoding="async"></span>')+'</div>'+
        '</div>'+
      '</article>';
    }).join('')+'</div>';
  }

  /* Un solo punto d'ingresso all'accesso, usato dai bottoni "Accedi" e
     "Iscriviti" sparsi per la pagina. */
  function apriAccesso(btn,dopo){apriIscrizione(btn,dopo);}
  function setup(){
    travelQuery.addEventListener('input',renderTravel);travelSort.addEventListener('change',renderTravel);
    collection.querySelector('[data-tmc-reset]').addEventListener('click',function(){travelQuery.value='';travelSort.value='default';renderTravel();travelQuery.focus();});
    document.querySelectorAll('[data-tmc-kind="travel"]').forEach(function(b){b.addEventListener('click',function(){collection.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});document.getElementById('tmc-travel-heading').focus({preventScroll:true});});});
    document.querySelectorAll('[data-member-access]').forEach(function(b){b.addEventListener('click',function(){
      apriAccesso(this);
      /* chi arriva da "Accedi" vede subito il modulo delle credenziali */
      if(this.hasAttribute('data-member-login')){ showLogin(); }
    });});
    document.querySelectorAll('[data-member-logout]').forEach(function(b){b.addEventListener('click',function(){
      var sezione=this.closest('section');
      member=false;try{sessionStorage.removeItem('tmc-travel-demo-access');}catch(e){}
      renderTravel();renderMembers();
      var torna=sezione&&sezione.querySelector('[data-member-access]');
      (torna||document.querySelector('[data-member-access]')).focus();
      if(currentProduct&&dialog.open)openProduct(currentProduct.id,lastFocus);
    });});

    /* Il lucchetto non e' un disegno: cliccandolo si apre la scheda con la
       finestra di iscrizione. Vale su tutte le schede della pagina, sul
       banner dei voli e sulla foto dentro al dialogo. */
    function daLucchetto(el){
      var scheda=el.closest('article,.tmc-voli-banner');
      var b=scheda&&scheda.querySelector('[data-tmc-product]');
      if(b){openProduct(b.getAttribute('data-tmc-product'),b);return;}
      var g=document.getElementById('tmc-members-gate');
      if(g){g.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
        var iscriviti=g.querySelector('[data-member-enroll]');if(iscriviti)iscriviti.focus({preventScroll:true});}
    }
    document.addEventListener('click',function(ev){
      var l=ev.target.closest&&ev.target.closest('.tmc-card-lock');
      if(l)daLucchetto(l);
    });
    document.addEventListener('keydown',function(ev){
      if(ev.key!=='Enter'&&ev.key!==' ')return;
      var l=ev.target.closest&&ev.target.closest('.tmc-card-lock[role="button"]');
      if(l){ev.preventDefault();daLucchetto(l);}
    });

    document.querySelectorAll('[data-tmc-destinazioni]').forEach(function(s){s.innerHTML=opzioniDestinazioni();});
    renderTravel();renderMembers();
  }
  function gate(solo){return '<div class="tmc-gated-content">'+(solo?'':'<div class="tmc-blurred-preview" aria-hidden="true" inert><h3>La tua prossima vacanza</h3><p>Il piacere di partire, il tempo per rallentare. Un soggiorno da costruire intorno ai tuoi desideri, con spazi da vivere e nuovi luoghi da scoprire.</p><h3>Il soggiorno e i servizi</h3><p>Sistemazioni, esperienze e dettagli del viaggio si incontrano in una proposta pensata per te. Accedi per leggere tutti i particolari del soggiorno.</p></div>')+'<div class="tmc-members-gate" id="tmc-members-gate"><span class="tmc-gate-icon">'+lock()+'</span><span class="occhiello">Il tuo prossimo viaggio ti aspetta</span><h3>Iscriviti alla nostra agenzia viaggi</h3><p>Accedi alle descrizioni complete delle proposte selezionate.</p><button class="b b--pri" type="button" data-member-signup>Iscriviti <span aria-hidden="true">→</span></button><button class="tmc-login-switch" type="button" data-member-enroll>Hai già le credenziali? Accedi</button><form class="tmc-member-form tmc-signup-form" id="tmc-signup-form" method="post" novalidate hidden><p>Richiedi l’iscrizione a TMC Travel. L’agenzia ti contatterà per l’attivazione. I campi con * sono obbligatori.</p><div class="tmc-f2"><div><label for="sg-nome">Nome *</label><input id="sg-nome" name="nome" autocomplete="given-name" maxlength="60" required></div><div><label for="sg-cognome">Cognome *</label><input id="sg-cognome" name="cognome" autocomplete="family-name" maxlength="60" required></div></div><div><label for="sg-email">Email *</label><input id="sg-email" name="email" type="email" autocomplete="username email" maxlength="254" required autocapitalize="none" spellcheck="false"></div><div><label for="sg-tel">Telefono</label><input id="sg-tel" name="telefono" type="tel" autocomplete="tel" maxlength="40"></div><div class="tmc-consensi"><label class="tmc-consenso"><input type="checkbox" id="sg-privacy" name="privacy" required><span>Ho letto l’<a href="#privacy" data-go="privacy" data-chiudi-dialogo>informativa privacy</a> per la gestione della mia richiesta. *</span></label></div><p class="tmc-member-error" id="tmc-signup-error" role="alert" hidden></p><button class="b b--pri" type="submit" id="tmc-signup-invia">Richiedi iscrizione →</button><button class="tmc-login-switch" type="button" data-member-enroll>Hai già un accesso? Entra</button></form><form class="tmc-member-form" id="tmc-member-form" hidden><p>L’accesso personale sarà disponibile dopo l’attivazione del servizio. Le credenziali di prova consentono soltanto di visualizzare l’anteprima delle proposte.</p><div><label for="tmc-member-user">Nome utente</label><input id="tmc-member-user" name="username" autocomplete="username" required autocapitalize="none" spellcheck="false"></div><div><label for="tmc-member-password">Password</label><input id="tmc-member-password" name="password" type="password" autocomplete="current-password" required></div><p class="tmc-member-error" id="tmc-member-error" role="alert" hidden></p><button class="b b--pri" type="submit">Accedi e sblocca l’offerta →</button><button class="tmc-login-switch" type="button" data-member-recupero>Hai bisogno di assistenza per l’accesso?</button></form><form class="tmc-member-form tmc-recupero-form" id="tmc-recupero-form" method="post" novalidate hidden><p>Lascia la tua email: l’agenzia ti contatterà per assisterti con l’accesso. Non viene generato un link automatico per cambiare password.</p><div><label for="rc-email">Email</label><input id="rc-email" name="email" type="email" autocomplete="username email" maxlength="254" required autocapitalize="none" spellcheck="false"></div><p class="tmc-member-error" id="tmc-recupero-error" role="alert" hidden></p><p class="tmc-recupero-ok" id="tmc-recupero-ok" role="status" hidden></p><button class="b b--pri" type="submit" id="tmc-recupero-invia">Richiedi assistenza →</button><button class="tmc-login-switch" type="button" data-member-enroll>Torna all’accesso</button></form></div></div>';}
  /* Il riquadro di iscrizione compare in due posti: dentro la scheda di una
     proposta e da solo, quando si arriva da un bottone "Iscriviti". Il
     cablaggio e' lo stesso, cambia solo cosa succede dopo l'accesso. */
  function collegaGate(dopo){
    dialogBody.querySelectorAll('[data-member-enroll]').forEach(function(b){b.addEventListener('click',showLogin);});
    dialogBody.querySelectorAll('[data-member-signup]').forEach(function(b){b.addEventListener('click',showSignup);});
    dialogBody.querySelectorAll('[data-member-recupero]').forEach(function(b){b.addEventListener('click',showRecupero);});
    collegaRecupero();
    dialogBody.querySelectorAll('[data-chiudi-dialogo]').forEach(function(a){a.addEventListener('click',function(){dialog.close();});});
    collegaIscrizione(dopo);
    var form=document.getElementById('tmc-member-form');if(!form)return;
    form.addEventListener('submit',async function(ev){
      ev.preventDefault();
      var u=form.elements.namedItem('username'),pw=form.elements.namedItem('password');
      if(!signIn(u.value,pw.value)){
        var error=document.getElementById('tmc-member-error');
        error.textContent='Nome utente o password non corretti. Riprova.';error.hidden=false;
        pw.setAttribute('aria-invalid','true');pw.setAttribute('aria-describedby','tmc-member-error');pw.focus();return;
      }
      renderTravel();renderMembers();
      if(dopo)dopo();
    });
  }

  /* "Iscriviti" apre una finestrella con dentro solo l'iscrizione: prima
     apriva la scheda della prima proposta Alpitour, che con la richiesta
     non c'entrava niente. */
  function apriIscrizione(btn,dopo){
    if(!dialog.open)lastFocus=btn||document.activeElement;
    currentProduct=null;
    dialog.querySelector('[data-tmc-detail-category]').textContent='TMC Travel';
    dialogBody.innerHTML=gate(true);
    dialog.classList.add('tmc-dialog--stretto');
    collegaGate(function(){dialog.close();if(dopo)dopo();});
    if(!dialog.open)dialog.showModal();
    document.body.classList.add('tmc-dialog-open');dialog.scrollTop=0;
    dialogBody.querySelector('[data-member-signup]').focus({preventScroll:true});
  }

  /* Nessuna credenziale o anagrafica conservata nel browser. */
  try{localStorage.removeItem('tmc-travel-conto');}catch(e){}
  async function inviaTravel(dati){
    var config=JSON.parse(document.getElementById('tmc-request-config').textContent);
    var endpoint=config.travelEndpoint||config.endpoint;
    if(!/^https:\/\//.test(endpoint))throw new Error('Servizio non configurato');
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},20000);
    try{
      var r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
        credentials:'omit',signal:controller.signal,body:JSON.stringify(dati)});
      var j=await r.json();
      if(!r.ok||(j.success!==true&&j.success!=='true'))throw new Error('Invio non confermato');
    }finally{clearTimeout(timer);}
  }
  function collegaIscrizione(){
    var form=document.getElementById('tmc-signup-form');if(!form)return;
    var errore=document.getElementById('tmc-signup-error'),busy=false;
    form.addEventListener('input',function(){errore.hidden=true;});
    form.addEventListener('submit',async function(ev){
      ev.preventDefault();if(busy||!form.reportValidity())return;
      var c=form.elements,invia=document.getElementById('tmc-signup-invia');
      busy=true;invia.disabled=true;invia.textContent='Invio in corso…';errore.hidden=true;
      try{
        await inviaTravel({_subject:'Richiesta iscrizione TMC Travel',_template:'table',_replyto:c.email.value.trim(),
          nome:c.nome.value.trim(),cognome:c.cognome.value.trim(),email:c.email.value.trim(),telefono:c.telefono.value.trim(),
          informativa_privacy:'Letta · versione 18 settembre 2026',richiesta:'Iscrizione all’agenzia; nessun account creato automaticamente'});
        form.reset();invia.textContent='Richiesta inviata';
        errore.textContent='Richiesta ricevuta. L’agenzia ti contatterà per completare l’iscrizione.';errore.hidden=false;
      }catch(e){
        errore.textContent='Invio non confermato. I dati sono ancora qui: riprova oppure scrivi a info@tmctravel.it.';errore.hidden=false;
        invia.disabled=false;invia.textContent='Richiedi iscrizione →';
      }finally{busy=false;}
    });
  }
  function collegaRecupero(){
    var form=document.getElementById('tmc-recupero-form');if(!form)return;
    var errore=document.getElementById('tmc-recupero-error'),esito=document.getElementById('tmc-recupero-ok'),busy=false;
    form.addEventListener('submit',async function(ev){
      ev.preventDefault();if(busy||!form.reportValidity())return;
      var email=form.elements.email.value.trim(),invia=document.getElementById('tmc-recupero-invia');
      busy=true;invia.disabled=true;invia.textContent='Invio in corso…';errore.hidden=true;esito.hidden=true;
      try{
        await inviaTravel({_subject:'Assistenza accesso TMC Travel',_replyto:email,email:email,richiesta:'Assistenza accesso all’agenzia'});
        esito.textContent='Richiesta ricevuta. L’agenzia ti contatterà per assisterti.';esito.hidden=false;invia.textContent='Richiesta inviata';
      }catch(e){
        errore.textContent='Invio non confermato. Riprova oppure scrivi a info@tmctravel.it.';errore.hidden=false;
        invia.disabled=false;invia.textContent='Richiedi assistenza →';
      }finally{busy=false;}
    });
  }
  function showRecupero(){
    var rec = document.getElementById('tmc-recupero-form');
    if(!rec){ return; }
    var accesso = document.getElementById('tmc-member-form');
    var iscr = document.getElementById('tmc-signup-form');
    if(accesso){ accesso.hidden = true; }
    if(iscr){ iscr.hidden = true; }
    rec.hidden = false;
    var utente = accesso && accesso.elements.username ? (accesso.elements.username.value || '').trim() : '';
    if(utente && !rec.elements.email.value){ rec.elements.email.value = utente; }
    rec.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
    document.getElementById('rc-email').focus({preventScroll:true});
  }
  function showSignup(){
    var form = document.getElementById('tmc-signup-form');
    var accesso = document.getElementById('tmc-member-form');
    if(!form){ return; }
    form.hidden = false;
    if(accesso){ accesso.hidden = true; }
    var rec = document.getElementById('tmc-recupero-form'); if(rec){ rec.hidden = true; }
    dialogBody.querySelectorAll('[data-member-signup]').forEach(function(b){ b.hidden = true; });
    form.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
    document.getElementById('sg-nome').focus({preventScroll:true});
  }
  function showLogin(){var iscr=document.getElementById('tmc-signup-form');if(iscr){iscr.hidden=true;}var rec=document.getElementById('tmc-recupero-form');if(rec){rec.hidden=true;}var form=document.getElementById('tmc-member-form');if(!form)return;form.hidden=false;dialogBody.querySelectorAll('[data-member-enroll]').forEach(function(b){b.hidden=true;});form.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});document.getElementById('tmc-member-user').focus({preventScroll:true});}
  function entra(){ member=true;try{sessionStorage.setItem('tmc-travel-demo-access','yes');}catch(e){}return true; }
  function signIn(username,password){
    if(username.trim().toUpperCase()==='MICHELE'&&password==='0000'){ return entra(); }
    return false;
  }
  /* pulsante verso il sito di chi ospita o dell'operatore: si apre in una
     scheda nuova, cosi' la pagina di TMC resta aperta */
  function sitoLink(p){
    /* per le proposte degli operatori il collegamento e' gia' sul logo:
       un secondo pulsante sarebbe lo stesso invito due volte */
    if(!p.source || p.operator){ return ''; }
    return '<a class="b b--gh" href="'+esc(p.source)+'" target="_blank" rel="noopener noreferrer">Sito ufficiale <span aria-hidden="true">↗</span></a>';
  }
  function openProduct(id,button){var p=byId[id];if(!p)return;if(!dialog.open)lastFocus=button||document.activeElement;currentProduct=p;
    var gallery=p.gallery.length?p.gallery:[p.image],locked=isLocked(p);
    dialog.querySelector('[data-tmc-detail-category]').textContent=p.member?'TMC Travel · Selezione '+p.operator:'TMC Travel';
    dialogBody.innerHTML='<div class="tmc-detail-top"><div class="tmc-detail-gallery"><div class="tmc-detail-visual'+(locked?' is-locked':'')+'"><img class="tmc-detail-image is-travel" id="tmc-detail-image" src="'+esc(file(gallery[0]))+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async">'+(locked?'<span class="tmc-card-lock">'+lock()+'</span>':'')+'</div>'+(!locked&&gallery.length>1?'<div class="tmc-thumbs" aria-label="Fotografie di '+esc(p.name)+'">'+gallery.map(function(im,i){return '<button type="button" data-tmc-photo="'+i+'" aria-label="Mostra foto '+(i+1)+' di '+gallery.length+'" aria-pressed="'+(i===0)+'"><img src="'+esc(file(im))+'" alt="" loading="lazy"></button>';}).join('')+'</div>':'')+'</div><div>'+(p.place?'<span class="occhiello">'+esc(p.place)+'</span>':'')+'<h2 id="tmc-detail-title" tabindex="-1">'+esc(p.name)+'</h2><div class="tmc-rich">'+(locked?'<p>'+esc(p.teaser)+'</p>':p.summary)+'</div>'+(p.member?operator(p):discount(p))+'<div class="tmc-detail-action'+(/^voli-/.test(p.id)?' tmc-detail-action--largo':'')+'">'+(locked?'<button type="button" class="b b--pri" data-member-scroll>Iscriviti e scopri l’offerta ↓</button>':requestLink(p.id,'b b--pri')+sitoLink(p))+'</div></div></div>'+(locked?gate():'<div class="tmc-detail-panels">'+p.panels.map(function(panel){return '<section class="tmc-detail-panel tmc-rich">'+panel.html+'</section>';}).join('')+'</div>');
    hydrate(dialogBody);dialogBody.querySelectorAll('[data-tmc-photo]').forEach(function(b){b.addEventListener('click',function(){var n=Number(b.getAttribute('data-tmc-photo'));dialogBody.querySelector('#tmc-detail-image').src=file(gallery[n]);dialogBody.querySelectorAll('[data-tmc-photo]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});});});
    var scroll=dialogBody.querySelector('[data-member-scroll]');if(scroll)scroll.addEventListener('click',function(){document.getElementById('tmc-members-gate').scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});dialogBody.querySelector('[data-member-enroll]').focus({preventScroll:true});});
    collegaGate(function(){openProduct(p.id,lastFocus);dialogBody.querySelector('#tmc-detail-title').focus({preventScroll:true});});
    dialog.classList.remove('tmc-dialog--stretto');
    if(!dialog.open)dialog.showModal();document.body.classList.add('tmc-dialog-open');dialog.scrollTop=0;dialog.querySelector('.tmc-close').focus({preventScroll:true});
  }
  document.addEventListener('click',function(ev){var button=ev.target.closest('[data-tmc-product]');if(button)openProduct(button.getAttribute('data-tmc-product'),button);});
  dialog.querySelector('.tmc-close').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('click',function(ev){if(ev.target===dialog){var r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',function(){document.body.classList.remove('tmc-dialog-open');if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});});
  /* Richieste Travel: dati personali solo in memoria, invio AJAX
     attivabile dopo la conferma dell'indirizzo destinatario. */
  var requestForm=document.getElementById('tmc-request-form');
  var requestConfig=JSON.parse(document.getElementById('tmc-request-config').textContent);
  var requestEndpoint=String((requestConfig.travelEndpoint||requestConfig.endpoint)||'').trim();
  var requestReady=/^https:\/\//.test(requestEndpoint);
  var requestSelected=null,requestDrafts={},requestBusy=false,requestVersion=0;
  var requestServices=Object.assign(Object.create(null),{
    travel:{id:'travel',name:'Viaggio su misura · Personal Travel Specialist',categories:['travel'],image:'img/tmc-catalogo/viaggi-cat2021-b-30c593a6.jpg'}
  });
  function requestField(name){return requestForm.elements.namedItem(name);}
  function requestValue(name){return requestField(name).value.trim();}
  function requestSave(){
    if(!requestSelected)return;
    var draft={};Array.from(requestForm.elements).forEach(function(el){
      if(el.name&&el.name!=='website')draft[el.name]=el.type==='checkbox'?el.checked:el.value;
    });requestDrafts[requestSelected.id]=draft;
  }
  function requestDate(date){return date?date.split('-').reverse().join('/'):'Da definire';}
  function requestRecap(){
    if(!requestSelected)return;
    var rows=[['Destinazione',requestValue('destinazione')||'Da definire'],['Partenza',requestDate(requestValue('partenza'))],['Rientro',requestDate(requestValue('rientro'))],['Viaggiatori',(function(){var a=Number(requestValue('adulti')||2),b=Number(requestValue('bambini')||0);return a+(a===1?' adulto':' adulti')+' · '+b+(b===1?' bambino':' bambini');})()]];
    document.getElementById('tmc-request-recap').innerHTML='<dl>'+rows.map(function(row){return '<div><dt>'+esc(row[0])+'</dt><dd>'+esc(row[1])+'</dd></div>';}).join('')+'</dl>';
  }
  function requestClearErrors(){
    requestForm.querySelectorAll('[aria-invalid]').forEach(function(el){el.removeAttribute('aria-invalid');});
    requestForm.querySelectorAll('.tmc-field-error').forEach(function(el){el.hidden=true;el.textContent='';});
  }
  function requestValidate(){
    requestClearErrors();var errors=[];
    function check(name,ok,message){
      if(ok)return;
      var field=requestField(name),error=document.getElementById(field.id+'-error');
      field.setAttribute('aria-invalid','true');error.textContent=message;error.hidden=false;errors.push(field);
    }
    check('nome',!!requestValue('nome'),'Inserisci il tuo nome.');
    check('cognome',!!requestValue('cognome'),'Inserisci il tuo cognome.');
    check('email',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestValue('email'))&&requestField('email').validity.valid,'Inserisci un’email valida.');
    check('telefono',requestValue('preferenza')!=='Telefono'||requestValue('telefono').replace(/\D/g,'').length>=6,'Inserisci un numero a cui possiamo chiamarti.');
    ['adulti','bambini'].forEach(function(name){var f=requestField(name),v=Number(f.value);check(name,f.value!==''&&Number.isInteger(v)&&v>=Number(f.min)&&v<=Number(f.max),'Inserisci un numero valido di '+name+'.');});
    var start=requestValue('partenza'),end=requestValue('rientro'),today=new Date(),localToday=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    check('partenza',!start||start>=localToday,'Scegli una data da oggi in poi.');
    check('rientro',!end||(end>=localToday&&(!start||end>=start)),'Il rientro deve essere da oggi in poi e non precedere la partenza.');
    check('privacy',requestField('privacy').checked,'Conferma di aver letto l’informativa privacy.');
    return errors;
  }
  function requestStatus(message,error){
    var box=document.getElementById('tmc-request-status');box.textContent=message;box.classList.toggle('is-error',!!error);box.hidden=!message;
  }
  function requestRender(id){
    var selected=byId[id]||requestServices[id];
    if(selected&&isLocked(selected)){window.tmcVai('travel');openProduct(id);return;}
    if(requestSelected&&requestSelected.id===id){requestRecap();return;}
    requestSave();requestSelected=selected||null;requestVersion++;requestBusy=false;
    document.getElementById('tmc-request-empty').hidden=!!selected;
    document.getElementById('tmc-request-layout').hidden=!selected;
    var tipo=document.getElementById('tmc-request-kind'); if(tipo){ tipo.textContent='TMC Travel'; }
    if(!selected)return;
    var back=document.querySelector('[data-request-back]');
    back.href='#travel';back.textContent='← Torna a TMC Travel';
    document.getElementById('tmc-request-product').innerHTML='<img class="tmc-request-photo is-travel" src="'+esc(file(selected.image))+'" alt="'+esc(selected.name)+'" loading="lazy" decoding="async"><div class="tmc-request-product-copy"><h3>'+esc(selected.name)+'</h3><p>Preventivo e disponibilità su richiesta.</p>'+(!selected.member&&selected.discount?'<p><strong>'+discountLabel(selected)+': '+esc(selected.discount)+'%</strong>Condizioni della proposta da confermare.</p>':'')+(selected.member?'<p>Proposta '+esc(selected.operator)+' · TMC Travel agenzia di viaggi.</p>':'')+'</div>';
    requestForm.reset();if(selected.requestDeparture)requestField('partenza').value=selected.requestDeparture;requestClearErrors();requestStatus('');
    /* sul volo la partenza non e' un dettaglio qualsiasi: dev'essere italiana */
    var notaPartenza=document.getElementById('rq-itinerario-nota');
    if(notaPartenza)notaPartenza.hidden=selected.id!=='voli-turkish';
    requestField('itinerario').placeholder=selected.id==='voli-turkish'?'Roma, Milano, Napoli…':'Aeroporto, città o preferenze…';
    var draft=requestDrafts[id];if(draft){Object.keys(draft).forEach(function(name){var field=requestField(name);if(field){if(field.type==='checkbox')field.checked=draft[name];else field.value=draft[name];}});}
    requestForm.removeAttribute('aria-busy');
    var submit=document.getElementById('tmc-request-submit');submit.disabled=!requestReady;submit.textContent='Invia richiesta →';
    document.getElementById('tmc-request-pending').hidden=requestReady;
    requestRecap();
  }
  function requestRoute(){
    var h=(location.hash||'').slice(1);
    /* con le pagine separate l'offerta sta nell'indirizzo della pagina
       richiesta (/richiesta/#offerta); come pagina unica e' #richiesta/offerta */
    if(window.TMC_PAGINE){ requestRender(h.indexOf('=') === -1 ? h : ''); return; }
    var route=h.split('/');
    if(route[0]==='richiesta')requestRender(route[1]||'');
  }
  function openRequest(id){
    if(!byId[id]&&!requestServices[id])return;
    if(byId[id]&&isLocked(byId[id])){openProduct(id);return;}
    if(dialog.open){lastFocus=null;dialog.close();}
    window.tmcVai('richiesta/'+id);
    document.getElementById('tmc-request-heading').focus({preventScroll:true});
  }
  document.addEventListener('tmc:page',function(event){
    if(dialog.open&&event.detail.page!=='travel'){lastFocus=null;dialog.close();}
    if(requestForm){ if(event.detail.page==='richiesta')requestRoute();else requestSave(); }
  });
  document.addEventListener('click',function(event){
    var link=event.target.closest('[data-tmc-request]');
    if(link){event.preventDefault();openRequest(link.getAttribute('data-tmc-request'));return;}
    var back=event.target.closest('[data-request-back]');
    if(back){event.preventDefault();window.tmcVai(back.getAttribute('href').slice(1));return;}
    if(event.target.closest('[data-request-privacy]')){event.preventDefault();requestSave();window.tmcVai('privacy');}
  });
  if(requestForm) requestForm.addEventListener('input',function(event){
    var field=event.target,error=document.getElementById(field.id+'-error');
    if(error){field.removeAttribute('aria-invalid');error.hidden=true;}
    requestRecap();requestSave();
  });
  if(requestForm) requestForm.addEventListener('change',function(){requestRecap();requestSave();});
  if(requestForm) requestForm.addEventListener('submit',async function(event){
    event.preventDefault();if(requestBusy||!requestSelected)return;
    if(!requestReady){requestStatus('L’invio delle richieste sarà disponibile a breve.',true);return;}
    var errors=requestValidate();if(errors.length){errors[0].focus();return;}
    if(requestValue('website'))return;
    var selected=requestSelected,version=requestVersion;
    var payload={_subject:'Richiesta TMC Travel · '+selected.name,_template:'table',
      offerta:selected.name,riferimento:selected.id,sezione:'TMC Travel',prezzo_indicativo:selected.price||'Su richiesta',sconto_tmc:!selected.member&&selected.discount?selected.discount+'%':'Non previsto',tour_operator:selected.member?selected.operator:'Su richiesta',
      nome:requestValue('nome'),cognome:requestValue('cognome'),email:requestValue('email'),telefono:requestValue('telefono'),azienda:requestValue('azienda'),preferenza_contatto:requestValue('preferenza'),messaggio:requestValue('messaggio'),informativa_privacy:'Letta · versione 18 settembre 2026',
      pagina:location.protocol==='file:'?'#richiesta/'+selected.id:location.origin+location.pathname+'#richiesta/'+selected.id};
    ['partenza','rientro','adulti','bambini','itinerario','destinazione'].forEach(function(name){payload[name]=requestValue(name);});
    requestBusy=true;requestForm.setAttribute('aria-busy','true');if(window.tmcCarica)window.tmcCarica.inizia('richiesta');
    var submit=document.getElementById('tmc-request-submit');submit.disabled=true;submit.textContent='Invio in corso…';requestStatus('');
    var controller=new AbortController(),timeout=setTimeout(function(){controller.abort();},20000);
    try{
      var response=await fetch(requestEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal,credentials:'omit'});
      var result=await response.json();
      if(!response.ok||(result.success!==true&&result.success!=='true'))throw new Error('Invio non confermato');
      delete requestDrafts[selected.id];
      if(version!==requestVersion)return;
      requestForm.reset();requestRecap();requestStatus('Richiesta inviata. Il nostro team ti ricontatterà ai recapiti indicati.');
      document.getElementById('tmc-request-status').focus({preventScroll:true});
    }catch(error){
      if(version===requestVersion)requestStatus('Non è stato possibile confermare l’invio. I dati sono ancora qui: riprova tra poco.',true);
    }finally{
      clearTimeout(timeout);if(window.tmcCarica)window.tmcCarica.finisci('richiesta');
      if(version===requestVersion){requestBusy=false;requestForm.removeAttribute('aria-busy');submit.disabled=!requestReady;submit.textContent='Invia richiesta →';}
    }
  });
  /* Ogni pezzo parte solo se la sua sezione e' in pagina: con le pagine
     separate il modulo di richiesta e il catalogo vivono su pagine diverse. */
  if(requestForm){ requestRoute(); }
  if(document.getElementById('pg-travel')){ setup('travel'); }
})();

