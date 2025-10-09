/* ========= CONFIG ========= */
const API_BASE = ""; // gleiche Origin
const IMG_FALLBACK = "https://via.placeholder.com/300x200/333/FFFFFF?text=No+Image";

/* ========= MINIMAL COOKIE CONSENT (ohne Auth/Cart) ========= */
function setCookie(name, value, days = 30) {
  const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name) {
  const nameEQ = `${name}=`;
  return document.cookie.split(";").map(s=>s.trim()).reduce((acc,c)=>{
    if (c.startsWith(nameEQ)) acc = decodeURIComponent(c.slice(nameEQ.length));
    return acc;
  }, null);
}
function deleteCookie(name){ document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`; }
function areCookiesEnabled(){ try{ setCookie("_t","1",1); const ok=getCookie("_t")==="1"; deleteCookie("_t"); return ok; }catch{ return false; } }

function showCookieConsent(){
  if (getCookie("cookies_accepted")) return;
  const b = document.createElement("div");
  b.id="cookie-consent-banner";
  b.style.cssText="position:fixed;bottom:0;left:0;right:0;background:#333;color:#fff;padding:1rem;z-index:10000;display:flex;gap:.75rem;align-items:center;justify-content:space-between;flex-wrap:wrap";
  b.innerHTML = `
    <span>Wir verwenden Cookies für Grundfunktionen und Login.</span>
    <div style="display:flex;gap:.5rem">
      <button id="cookie-accept" style="background:#27ae60;color:#fff;border:0;padding:.5rem .75rem;border-radius:.25rem;cursor:pointer">OK</button>
    </div>`;
  document.body.appendChild(b);
  document.getElementById("cookie-accept").onclick = ()=>{ setCookie("cookies_accepted","true",365); b.remove(); };
}

/* ========= UI HELPERS ========= */
function showNotification(msg){
  const old = document.querySelector(".notification"); if (old) old.remove();
  const n = document.createElement("div");
  n.className="notification";
  n.style.cssText="position:fixed;right:1rem;bottom:1rem;background:#333;color:#fff;padding:.75rem 1rem;border-radius:.5rem;z-index:10001";
  n.textContent=msg;
  document.body.appendChild(n);
  setTimeout(()=>n.remove(), 3000);
}

async function loadHTML(id, path){
  try{ const r=await fetch(path); document.getElementById(id).innerHTML = await r.text(); }
  catch(e){ console.error("loadHTML", path, e); }
}

/* ========= AUTH ========= */
const auth = {
  async register(email, password){
    const r = await fetch(`${API_BASE}/api/auth/register`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include",
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) throw new Error(`Register fehlgeschlagen: ${r.status}`);
  },
  async login(email, password){
    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include",
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) throw new Error("Login fehlgeschlagen");
  },
  async logout(){
    await fetch(`${API_BASE}/api/auth/logout`, { method:"POST", credentials:"include" });
  },
  async isLoggedIn(){
    const r = await fetch(`${API_BASE}/api/cart`, { credentials:"include" });
    return r.status !== 401;
  }
};

/* ========= PRODUCTS ========= */
async function loadProductsToShop(){
  const grid = document.querySelector(".shop-grid");
  if (!grid) return;
  grid.innerHTML = `<div class="product-card"><div class="skeleton-thumb"></div><h3 class="skeleton-text">Loading…</h3></div>
                    <div class="product-card"><div class="skeleton-thumb"></div><h3 class="skeleton-text">Loading…</h3></div>
                    <div class="product-card"><div class="skeleton-thumb"></div><h3 class="skeleton-text">Loading…</h3></div>`;
  try{
    const res = await fetch(`${API_BASE}/api/products`, { headers:{ Accept:"application/json" }});
    if (!res.ok) throw new Error(res.status);
    const products = await res.json();
    if (!Array.isArray(products) || products.length===0){
      grid.innerHTML = `<p class="no-products">No products available.</p>`; return;
    }
    grid.innerHTML = products.map(p=>{
      const img = p.imageFileId ? `${API_BASE}/api/images/${p.imageFileId}` : IMG_FALLBACK;
      const price = typeof p.priceCents === "number" ? (p.priceCents/100).toFixed(2) : "0.00";
      return `
        <div class="product-card" data-id="${p._id}">
          <img src="${img}" alt="${p.name}" onerror="this.src='${IMG_FALLBACK}'" />
          <h3>${p.name ?? "Unnamed"}</h3>
          <p class="price">$${price}</p>
          <button class="add-to-cart" data-id="${p._id}">Add to Cart</button>
        </div>`;
    }).join("");
  }catch(e){
    console.error("loadProductsToShop", e);
    grid.innerHTML = `<p class="no-products">Error loading products.</p>`;
  }
}

/* ========= CART ========= */
async function addToCart(productId, qty=1){
  try{
    const r = await fetch(`${API_BASE}/api/cart/items`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include",
      body: JSON.stringify({ productId, qty: Number(qty)||1 })
    });
    if (r.status === 401){ showNotification("Bitte einloggen"); return; }
    if (!r.ok) throw new Error(`AddToCart ${r.status}`);
    showNotification("Zum Warenkorb hinzugefügt");
    await syncCartCountFromServer();
  }catch(e){ console.error("addToCart", e); showNotification("Fehler beim Hinzufügen"); }
}

async function getCart(){
  const r = await fetch(`${API_BASE}/api/cart`, { credentials:"include" });
  if (r.status===401) return null;
  if (!r.ok) throw new Error("Cart Fehler");
  return r.json();
}

async function syncCartCountFromServer(){
  try{
    const c = await getCart();
    const total = (c?.items||[]).reduce((s,it)=> s + (Number(it.qty)||0), 0);
    const el = document.querySelector(".cart-count");
    if (el) el.textContent = String(total || 0);
  }catch{
    const el = document.querySelector(".cart-count");
    if (el) el.textContent = "0";
  }
}

/* ========= NAV / PAGES ========= */
function showPage(pageName){
  const main = document.querySelector("main");
  const hero = main.querySelector(".hero");
  const featured = main.querySelector(".featured-products");
  const sections = main.querySelectorAll(".page-section");

  if (hero) hero.style.display = "none";
  if (featured) featured.style.display = "none";
  sections.forEach(s=> s.style.display="none");

  const t = document.getElementById(`${pageName}-content`);
  if (t){ t.style.display="block"; if (pageName==="shop") loadProductsToShop(); window.scrollTo({top:0,behavior:"smooth"}); }
}

function showHomePage(){
  const main = document.querySelector("main");
  const hero = main.querySelector(".hero");
  const featured = main.querySelector(".featured-products");
  const sections = main.querySelectorAll(".page-section");
  if (hero) hero.style.display="flex";
  if (featured) featured.style.display="block";
  sections.forEach(s=> s.style.display="none");
  setActiveNavLink("home");
  window.location.hash = "home";
  window.scrollTo({ top:0, behavior:"smooth" });
}

function setActiveNavLink(active){
  document.querySelectorAll("nav a").forEach(a=>{
    a.classList.toggle("active", a.getAttribute("href") === `#${active}`);
  });
}

function initializeNavigation(){
  if (window.__navHandlerInstalled) return;
  window.__navHandlerInstalled = true;

  document.addEventListener("click", async (e)=>{
    // Hash-Navigation
    if (e.target.matches('nav a[href^="#"]') || e.target.closest('nav a[href^="#"]')){
      e.preventDefault();
      const link = e.target.matches("nav a") ? e.target : e.target.closest("nav a");
      const target = link.getAttribute("href").replace("#","");
      if (target==="home"){ showHomePage(); }
      else if (["shop","about","contact"].includes(target)){ showPage(target); setActiveNavLink(target); }
      window.location.hash = target;
    }

    // Add-to-cart
    const btn = e.target.closest(".add-to-cart");
    if (btn){
      const pid = btn.getAttribute("data-id") || btn.closest(".product-card")?.dataset.id;
      if (pid) addToCart(pid);
    }

    // Kontakt-Form
    if (e.target.type==="submit" && e.target.closest(".contact-form")){ e.preventDefault(); handleContactForm(); }

    // Logout
    if (e.target.id==="logout-link"){
      e.preventDefault();
      await auth.logout();
      await syncCartCountFromServer();
      updateAuthNav(); 
      showNotification("Logout erfolgreich");
      setTimeout(()=> window.location.href="index.html", 800);
    }
  });
}

/* ========= AUTH NAV ========= */
async function updateAuthNav(){
  const nav = document.querySelector("nav ul");
  if (!nav) return;

  // alte dynamische Links löschen
  nav.querySelectorAll(".auth-link, .admin-link, .cart-link").forEach(n=>n.remove());

  // Cart Link
  const cartLi = document.createElement("li");
  cartLi.className="cart-link";
  cartLi.innerHTML = `<a href="content/cart.html" class="external-link">Cart (<span class="cart-count">0</span>)</a>`;
  nav.appendChild(cartLi);

  const logged = await auth.isLoggedIn();
  if (logged){
    const userLi = document.createElement("li");
    userLi.className="auth-link";
    userLi.innerHTML = `<a href="auth/user.html" class="external-link">My Account</a>`;
    nav.appendChild(userLi);

    const logoutLi = document.createElement("li");
    logoutLi.className="auth-link";
    logoutLi.innerHTML = `<a href="#" id="logout-link" class="external-link">Logout</a>`;
    nav.appendChild(logoutLi);
  }else{
    const loginLi = document.createElement("li");
    loginLi.className="auth-link";
    loginLi.innerHTML = `<a href="auth/login.html" class="external-link">Login</a>`;
    nav.appendChild(loginLi);
  }
}

/* ========= CONTACT ========= */
function handleContactForm(){
  const form = document.querySelector(".contact-form");
  const required = form?.querySelectorAll("[required]")||[];
  let ok = true;
  required.forEach(f=>{
    if (!f.value.trim()){ ok=false; f.style.borderColor="#e74c3c"; } else { f.style.borderColor="#ddd"; }
  });
  showNotification(ok ? "Thank you for your message!" : "Please fill in all required fields.");
  if (ok) form.reset();
}

/* ========= BOOTSTRAP ========= */
document.addEventListener("DOMContentLoaded", async ()=>{
  if (!areCookiesEnabled()) console.warn("Cookies disabled");
  setTimeout(showCookieConsent, 800);

  await loadHTML("header", "content/header.html");
  await loadHTML("footer", "content/footer.html");
  await loadHTML("shop-content", "content/shop.html");
  await loadHTML("about-content", "content/about.html");
  await loadHTML("contact-content", "content/contact.html");

  // Initial UI
  initializeNavigation();
  showHomePage();
  const hash = window.location.hash.replace("#","");
  if (hash && hash!=="home"){ showPage(hash); setActiveNavLink(hash); }

  await updateAuthNav();
  await syncCartCountFromServer();
});
