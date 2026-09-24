
/* Difesa dall'incorniciamento (clickjacking): se la pagina viene aperta dentro
   la cornice di un altro sito, riporta il browser alla pagina vera. Attiva solo
   sui domini reali: artifact-tmc.html gira dentro una cornice su claude.ai e
   deve continuare a funzionare, come l'anteprima locale su localhost.
   La difesa completa sara' l'intestazione HTTP sul dominio finale (Register.it):
   frame-ancestors in un <meta> viene ignorato dai browser, serve l'header. */
(function(){
  if(window.top===window.self){ return; }
  if(!/(^|\.)themediacompany\.it$|(^|\.)github\.io$/.test(location.hostname)){ return; }
  try{ window.top.location.replace(location.href); }
  catch(e){ document.documentElement.style.display='none'; }
})();
