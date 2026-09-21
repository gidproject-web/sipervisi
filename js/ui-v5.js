
const LOGO_URL = new URL("../images/logo-smanpa.png", import.meta.url).href;

function makeBrandLogo(container, compact=false){
  if(!container) return;
  const oldText=(container.textContent||"").trim();
  container.innerHTML="";
  const wrap=document.createElement("div");
  wrap.className="brand-logo-wrap";

  const img=document.createElement("img");
  img.className=compact?"login-brand-logo":"brand-logo-image";
  img.src=LOGO_URL;
  img.alt="Logo SMA Negeri 4 Lubuklinggau";

  const fallback=document.createElement("div");
  fallback.className="brand-logo-fallback";
  fallback.textContent="S";
  fallback.style.display="none";

  img.addEventListener("error",()=>{
    img.style.display="none";
    fallback.style.display="grid";
  });

  if(compact){
    container.appendChild(img);
    container.appendChild(fallback);
    return;
  }

  const text=document.createElement("div");
  text.className="brand-logo-text";
  text.innerHTML="<strong>SIPERVISI</strong><span>SMANPA</span>";

  wrap.append(img,fallback,text);
  container.appendChild(wrap);
  container.title=oldText||"SIPERVISI SMANPA";
}

function setupLogo(){
  document.querySelectorAll(".sidebar .logo").forEach(el=>makeBrandLogo(el,false));
  const badge=document.querySelector(".brand-badge");
  if(badge) makeBrandLogo(badge,true);
}

function setupActiveNav(){
  const current=(location.pathname.split("/").pop()||"").toLowerCase();
  document.querySelectorAll(".nav a[href]").forEach(a=>{
    const href=(a.getAttribute("href")||"").split("?")[0].split("#")[0];
    const file=href.split("/").pop().toLowerCase();
    if(file && file===current) a.classList.add("active");
  });
}

function setupMobileMenu(){
  const sidebar=document.querySelector(".sidebar");
  const topbar=document.querySelector(".topbar");
  if(!sidebar||!topbar) return;

  const btn=document.createElement("button");
  btn.type="button";
  btn.className="mobile-menu-btn";
  btn.setAttribute("aria-label","Buka menu");
  btn.setAttribute("aria-expanded","false");
  btn.innerHTML="☰";

  const backdrop=document.createElement("div");
  backdrop.className="mobile-backdrop";
  document.body.appendChild(backdrop);

  const open=()=>{
    sidebar.classList.add("mobile-open");
    backdrop.classList.add("show");
    btn.setAttribute("aria-expanded","true");
    btn.innerHTML="×";
    document.body.style.overflow="hidden";
  };
  const close=()=>{
    sidebar.classList.remove("mobile-open");
    backdrop.classList.remove("show");
    btn.setAttribute("aria-expanded","false");
    btn.innerHTML="☰";
    document.body.style.overflow="";
  };

  btn.addEventListener("click",()=>sidebar.classList.contains("mobile-open")?close():open());
  backdrop.addEventListener("click",close);
  sidebar.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
  window.addEventListener("resize",()=>{if(innerWidth>900)close();});

  topbar.prepend(btn);
}

function setupTouchTableHint(){
  if(window.innerWidth>640) return;
  document.querySelectorAll(".table-wrap").forEach(w=>{
    if(w.previousElementSibling?.classList?.contains("mobile-table-hint")) return;
    const hint=document.createElement("div");
    hint.className="mobile-table-hint muted";
    hint.style.cssText="font-size:11px;margin:0 0 7px 2px";
    hint.textContent="Geser tabel ke samping untuk melihat kolom lainnya.";
    w.parentNode.insertBefore(hint,w);
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  setupLogo();
  setupActiveNav();
  setupMobileMenu();
  setupTouchTableHint();
});
