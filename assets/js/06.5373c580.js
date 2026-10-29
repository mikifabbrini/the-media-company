
/* TMC Travel (29/10/2026): menu del club, menu trasparente sopra la foto,
   link interni che scorrono alla sezione senza cambiare pagina. */
(function(){
  var radice=document.documentElement, hero=null;
  function aggiorna(){
    var inTravel=!!document.querySelector('#pg-travel.on');
    radice.classList.toggle('in-travel',inTravel);
    hero=hero||document.querySelector('#pg-travel .tv-hero');
    var alt=document.querySelector('.hdr').offsetHeight;
    if(inTravel)radice.style.setProperty('--tv-hdr',alt+'px');
    radice.classList.toggle('hdr-sopra',!!(inTravel&&hero&&hero.getBoundingClientRect().bottom>alt+8));
  }
  addEventListener('scroll',aggiorna,{passive:true});
  addEventListener('resize',aggiorna);
  document.addEventListener('tmc:page',function(){setTimeout(aggiorna,30);setTimeout(aggiorna,300);});
  aggiorna();setTimeout(aggiorna,400);

  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href="#tv-club"],a[href="#tmc-travel-catalogo"],a[href="#tmc-travel-voli"]');
    if(!a)return;
    e.preventDefault();e.stopImmediatePropagation();
    var menu=document.getElementById('menu');
    if(menu&&menu.getAttribute('aria-hidden')==='false'){var bg=document.getElementById('burger');if(bg)bg.click();}
    var dest=document.querySelector(a.getAttribute('href'));
    if(!dest)return;
    var alt=document.querySelector('.hdr').offsetHeight+8;
    setTimeout(function(){
      if(window.tmcLenis)window.tmcLenis.scrollTo(dest,{offset:-alt});
      else window.scrollTo({top:dest.getBoundingClientRect().top+scrollY-alt,behavior:'smooth'});
    },60);
  },true);
})();
