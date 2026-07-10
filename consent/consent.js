/* ============================================================
   A Desert Story — Cookie consent (vanilla JS, nessuna dipendenza)
   - Blocca lo script Kit finché l'utente non acconsente.
   - Scelta in localStorage: ads_cookie_consent = "granted" | "denied".
   - Banner riapribile da qualsiasi link con data-cc-open o #cc-preferenze.
   ============================================================ */
(function(){
  "use strict";

  var STORAGE_KEY = "ads_cookie_consent";
  var KIT_UID = "6454468437";
  var KIT_SRC = "https://keryxdesign.kit.com/6454468437/index.js";

  function getConsent(){
    try { return localStorage.getItem(STORAGE_KEY); }
    catch(e){ return null; }
  }
  function setConsent(v){
    try { localStorage.setItem(STORAGE_KEY, v); }
    catch(e){ /* storage non disponibile: proseguo senza persistere */ }
  }

  /* ---- Caricamento dinamico dello script Kit (solo dopo consenso) ---- */
  var kitLoaded = false;
  function loadKit(){
    if(kitLoaded) return;
    var host = document.querySelector(".kit-embed");
    if(!host) return; // pagina senza modulo Kit
    kitLoaded = true;
    // rimuovi eventuale placeholder
    var ph = host.querySelector(".cc-kit-placeholder");
    if(ph) ph.parentNode.removeChild(ph);
    var s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-uid", KIT_UID);
    s.src = KIT_SRC;
    host.appendChild(s);
  }

  /* ---- Placeholder nel .kit-embed quando manca il consenso ---- */
  function showKitPlaceholder(){
    var host = document.querySelector(".kit-embed");
    if(!host) return;
    if(host.querySelector(".cc-kit-placeholder")) return;
    if(kitLoaded) return;
    var box = document.createElement("div");
    box.className = "cc-kit-placeholder";
    var p = document.createElement("p");
    p.textContent = "Per iscriverti alla lista d'attesa accetta i cookie del modulo di iscrizione.";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cc-kit-manage";
    btn.textContent = "Gestisci cookie";
    btn.addEventListener("click", openBanner);
    box.appendChild(p);
    box.appendChild(btn);
    host.appendChild(box);
  }

  /* ---- Banner ---- */
  var banner, lastFocused;

  function buildBanner(){
    banner = document.createElement("div");
    banner.className = "cc-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Informativa sui cookie");
    banner.setAttribute("aria-describedby", "cc-desc");
    banner.innerHTML =
      '<div class="cc-inner">' +
        '<p class="cc-text" id="cc-desc">' +
          'Questo sito usa un servizio esterno (<strong>Kit</strong>) per il modulo di iscrizione alla lista d’attesa, ' +
          'che può impostare identificatori sul tuo dispositivo. Li attiviamo solo con il tuo consenso. ' +
          '<a href="/cookie/">Cookie Policy</a>.' +
        '</p>' +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-btn cc-reject" id="ccReject">Rifiuta</button>' +
          '<button type="button" class="cc-btn cc-accept" id="ccAccept">Accetta</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelector("#ccAccept").addEventListener("click", accept);
    banner.querySelector("#ccReject").addEventListener("click", reject);
    banner.addEventListener("keydown", onKeydown);
  }

  function openBanner(){
    if(!banner) buildBanner();
    lastFocused = document.activeElement;
    // forza reflow per far partire la transizione anche a apertura immediata
    void banner.offsetWidth;
    banner.classList.add("cc-open");
    var accept = banner.querySelector("#ccAccept");
    if(accept) accept.focus();
  }

  function closeBanner(){
    if(!banner) return;
    banner.classList.remove("cc-open");
    if(lastFocused && typeof lastFocused.focus === "function"){
      try { lastFocused.focus(); } catch(e){}
    }
  }

  function accept(){
    setConsent("granted");
    closeBanner();
    loadKit();           // se siamo su /estratto/ il form appare subito
  }

  function reject(){
    setConsent("denied");
    closeBanner();
    showKitPlaceholder(); // mantiene il placeholder sul modulo
  }

  /* Focus trap minimale + ESC = rifiuta (nessuna azione = nessun consenso) */
  function onKeydown(e){
    if(e.key === "Escape"){
      // Chiudi senza dare consenso: se non c'è ancora scelta, resta "non scelto".
      if(!getConsent()){ closeBanner(); showKitPlaceholder(); }
      else { closeBanner(); }
      return;
    }
    if(e.key !== "Tab") return;
    var focusables = banner.querySelectorAll("a[href],button:not([disabled])");
    if(!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault(); last.focus();
    } else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault(); first.focus();
    }
  }

  /* ---- Link "Preferenze cookie" (footer) ---- */
  function wireOpeners(){
    var openers = document.querySelectorAll('[data-cc-open], a[href="#cc-preferenze"]');
    for(var i=0;i<openers.length;i++){
      openers[i].addEventListener("click", function(e){
        e.preventDefault();
        openBanner();
      });
    }
  }

  /* ---- Init ---- */
  function init(){
    wireOpeners();
    var consent = getConsent();
    if(consent === "granted"){
      loadKit();
    } else {
      // "denied" oppure non scelto
      showKitPlaceholder();
      if(consent !== "denied"){
        openBanner(); // prima visita: mostra il banner
      }
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
