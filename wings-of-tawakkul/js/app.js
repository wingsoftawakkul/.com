/* =========================================================
   Wings of Tawakkul — site logic
   Routing, rendering and search. Checkout happens on Payhip. Content lives in data.js.
   ========================================================= */
(async function(){
try { await window.WOT.load(); }
catch(err){
  document.getElementById("app").innerHTML = `<div class="wrap" style="padding:120px 0;text-align:center"><h1>We'll be right back</h1><p class="lede" style="margin:16px auto">The shop couldn't load just now. Please refresh the page.</p></div>`;
  console.error(err); return;
}
const { CONFIG, CATEGORIES, BOOKS, PRINTABLES, PRINTABLE_FILTERS, POSTS, POST_CATEGORIES, SETTINGS, PAGES } = window.WOT;
/* Markdown → HTML for articles and pages (marked library), with our quote style */
function md(text){
  const raw = window.marked ? window.marked.parse(String(text || ""), { breaks:false }) : `<p>${String(text || "").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])).replace(/\n\n+/g,"</p><p>")}</p>`;
  const box = document.createElement("div"); box.innerHTML = raw;
  box.querySelectorAll("script,iframe,object,embed").forEach(n => n.remove());
  box.querySelectorAll("*").forEach(n => [...n.attributes].forEach(at => { if (/^on/i.test(at.name) || /^javascript:/i.test(at.value)) n.removeAttribute(at.name); }));
  box.querySelectorAll("blockquote p").forEach(pp => {
    const t = pp.textContent.trim();
    if (/[\u0600-\u06FF]/.test(t) && !/[A-Za-z]/.test(t)) { const s = document.createElement("span"); s.className = "arabic"; s.lang = "ar"; s.textContent = t; pp.replaceWith(s); }
    else if (/^[—–-]\s/.test(t)) { const c = document.createElement("cite"); c.textContent = t.replace(/^[—–-]\s*/, ""); pp.replaceWith(c); }
  });
  return box.innerHTML;
}
const paras = t => String(t || "").split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
const app = document.getElementById("app");
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug = s => s.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const money = n => n == null ? "Price on request" : n === 0 ? "Free" : `<small>${CONFIG.currency}</small>${n.toFixed(2)}`;
const moneyText = n => n == null ? "Price on request" : n === 0 ? "Free" : `${CONFIG.currency} ${n.toFixed(2)}`;
const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("en-SG", { day:"numeric", month:"long", year:"numeric" });
const bookById = Object.fromEntries(BOOKS.map(b => [b.id, b]));
const prById = Object.fromEntries(PRINTABLES.map(p => [p.id, p]));
const postBySlug = Object.fromEntries(POSTS.map(p => [p.slug, p]));
const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const igUrl = `https://www.instagram.com/${CONFIG.instagram}/`;
const igDm = `https://ig.me/m/${CONFIG.instagram}`;

const ICON = {
  arch:`<svg viewBox="0 0 16 22" fill="none" stroke="currentColor" stroke-width="1"><path d="M1 21V9a7 7 0 0 1 14 0v12"/><path d="M4.5 21v-9a3.5 3.5 0 0 1 7 0v9"/></svg>`,
  dl:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>`,
  sun:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>`,
};

/* ---------- Availability ---------- */
function availability(b){
  if (b.status === "coming_soon") return { cls:"soon", text:"Coming soon", canBuy:false };
  if (b.status === "sold_out") return { cls:"out", text:"Sold out", canBuy:false };
  if (!b.payhip) return { cls:"soon", text:"Ask us", canBuy:false };
  return { cls:"", text:"Available", canBuy:true };
}
const buyLink = (item, label="Buy now", cls="btn btn-primary btn-sm") =>
  `<a class="${cls}" href="${esc(item.payhip)}" rel="noopener">${label}</a>`;

/* ---------- Generated visuals ---------- */
function cover(b){
  if (b.image) return `<div class="cover has-img"><img src="${esc(b.image)}" alt="Cover of ${esc(b.title)}" loading="lazy"></div>`;
  const isQT = b.series === "Quranic Tarbiyah";
  return `<div class="cover" style="--c:var(${b.tone})" role="img" aria-label="Cover of ${esc(b.title)}${b.subtitle ? " " + esc(b.subtitle) : ""}">
    <span class="c-series">${esc(isQT ? "Quranic Tarbiyah" : b.series === "Abdullah Hakeem series" ? "Abdullah Hakeem" : "Umm Assad")}</span>
    <span class="c-arch">${esc(isQT ? b.mark : b.mark)}</span>
    <span><span class="c-title" style="display:block">${esc(isQT ? b.title : (b.subtitle && b.title === "Abdullah Hakeem" ? b.subtitle : b.title))}</span>${isQT ? `<span class="c-sub" style="display:block">${esc(b.subtitle)}</span>` : (b.subtitle && b.title !== "Abdullah Hakeem" ? `<span class="c-sub" style="display:block">${esc(b.subtitle)}</span>` : "")}</span>
    <span class="c-pub">${esc(isQT ? "Wings of Tawakkul" : "Umm Assad Publications")}</span>
  </div>`;
}

function rng(seedStr){ let h = 2166136261; for (const ch of seedStr) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }
function wordsearch(p){
  const N = 10, g = Array.from({length:N}, () => Array(N).fill("")), hit = new Set(), r = rng(p.id);
  (p.words || []).slice(0, 6).forEach(w => {
    for (let tries = 0; tries < 60; tries++){
      const dir = r() < .5 ? [0,1] : [1,0];
      const row = Math.floor(r() * (N - (dir[0] ? w.length : 0)));
      const col = Math.floor(r() * (N - (dir[1] ? w.length : 0)));
      let ok = true;
      for (let i=0;i<w.length;i++){ const c = g[row+dir[0]*i][col+dir[1]*i]; if (c && c !== w[i]) { ok = false; break; } }
      if (!ok) continue;
      for (let i=0;i<w.length;i++){ g[row+dir[0]*i][col+dir[1]*i] = w[i]; if (i===0 || hit.size < 14) hit.add((row+dir[0]*i)*N + col+dir[1]*i); }
      break;
    }
  });
  const A = "ABDEFHIKLMNRSTUWY";
  return `<div class="s-ws">${g.flat().map((c,i) => `<span class="${hit.has(i) && i % 3 ? "hit" : ""}">${c || A[Math.floor(r()*A.length)]}</span>`).join("")}</div>`;
}
function sheetBody(p, page=1){
  if (page > 1){
    const lines = Array(7).fill("<i></i>").join("");
    return `<div class="s-body"><div class="s-kicker">Page ${page}</div><div class="s-lines">${lines}</div></div>`;
  }
  switch(p.kind){
    case "adhkaar": return `<div class="s-body"><div class="s-sunmoon"><div>${ICON.sun}Morning</div><div>${ICON.moon}Evening</div></div>${["After Fajr","Before sleep","Tick each day"].map(t => `<div class="s-check">${t}</div>`).join("")}</div>`;
    case "tracker": return `<div class="s-body"><div class="s-grid" style="grid-template-columns:repeat(7,1fr)">${Array.from({length:35},(_,i)=>`<b>${78+i}</b>`).join("")}</div></div>`;
    case "wordsearch": return `<div class="s-body">${wordsearch(p)}</div>`;
    case "worksheet": return `<div class="s-body">${["Shahadah","Salah","Zakah","Sawm","Hajj"].map(t => `<div class="s-check">${t}</div>`).join("")}<div class="s-lines"><i></i><i></i></div></div>`;
    case "dua": return `<div class="s-body"><div class="s-lines"><i></i><i></i><i></i></div><div class="s-check">Read it together</div><div class="s-check">Learn it by heart</div></div>`;
    case "cards": return `<div class="s-body"><div class="s-steps">${[1,2,3,4].map(n=>`<div>${n}</div>`).join("")}</div></div>`;
    case "activity": return `<div class="s-body"><div class="arabic" style="font-size:clamp(.6rem,7cqi,1.1rem);text-align:center;line-height:1.6">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div><div class="s-lines"><i></i><i></i><i></i><i></i></div></div>`;
  }
  return `<div class="s-body"></div>`;
}
function sheet(p, page=1, style=""){
  return `<div class="sheet" style="--tint:${p.tint};${style}" role="img" aria-label="${page===1 ? "Cover" : "Page " + page} preview of ${esc(p.title)}">
    <div class="s-band"><div class="s-kicker">${esc(p.ages)}</div><div class="s-title">${esc(shortTitle(p.title))}</div></div>
    ${sheetBody(p, page)}
    <div class="s-foot">Wings of Tawakkul</div></div>`;
}
const shortTitle = t => t.replace(/^Islamic Word Search: /,"").replace(/^Qur'an Learning Pack: /,"").replace(/ for Children$/,"");

function postImg(post){
  if (post.image) return `<div class="post-img"><img src="${esc(post.image)}" alt="" loading="lazy"></div>`;
  const word = post.word || "";
  return `<div class="post-img" style="--pc:var(${post.tone})"><div class="post-art"><div class="arch"><span>${esc(word)}</span></div></div></div>`;
}

/* ---------- Cards ---------- */
function bookCard(b){
  const a = availability(b);
  return `<article class="card">
    <a class="card-media" href="#book-${b.id}" tabindex="-1" aria-hidden="true">${cover(b)}</a>
    <div class="card-body">
      <span class="card-kicker">${esc(b.ages)}</span>
      <h3><a href="#book-${b.id}">${esc(b.title)}${b.subtitle ? `: ${esc(b.subtitle)}` : ""}</a></h3>
      <span class="author">${esc(b.author)}</span>
      <div class="meta-row"><span class="price">${money(b.price)}</span><span class="avail ${a.cls}">${a.text}</span></div>
      <div class="actions">
        <a class="btn btn-outline btn-sm" href="#book-${b.id}">View</a>
        ${a.canBuy ? buyLink(b) : `<a class="btn btn-secondary btn-sm" href="${igDm}" rel="noopener">Ask us</a>`}
      </div>
    </div></article>`;
}
function printableCard(p){
  return `<article class="card p-card" style="--tint-bg:${p.tintBg}">
    <a class="card-media" href="#printable-${p.id}" tabindex="-1" aria-hidden="true">${sheet(p)}</a>
    <div class="card-body">
      <span class="badge-dl">${ICON.dl} Digital download · ${esc(p.size)}</span>
      <h3><a href="#printable-${p.id}">${esc(p.title)}</a></h3>
      <span class="author">${esc(p.ages)}</span>
      <div class="meta-row"><span class="price">${money(p.price)}</span><span class="avail">Digital download</span></div>
      <div class="actions">
        <a class="btn btn-outline btn-sm" href="#printable-${p.id}">Preview</a>
        ${buyLink(p, p.price === 0 ? "Get it free" : "Buy now")}
      </div>
    </div></article>`;
}
function postCard(p){
  return `<a class="post-card" href="#article-${p.slug}">${postImg(p)}
    <div class="post-meta"><span>${esc(p.category)}</span><span>${p.readTime} min read</span></div>
    <h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><span class="link" style="justify-self:start">Read more</span></a>`;
}
const divider = `<div class="arch-divider" aria-hidden="true">${ICON.arch}</div>`;

/* ---------- Views ---------- */
function viewHome(){
  const featured = BOOKS.filter(b => b.featured).slice(0, 8);
  /* Pictures on the homepage come from your own products, so they stay right as you edit */
  const pickBooks = (n, test=()=>true) => { const f = BOOKS.filter(b => b.featured && test(b)), r = BOOKS.filter(b => !b.featured && test(b)); return [...f, ...r].slice(0, n); };
  const heroBooks = pickBooks(3);
  const pr = i => PRINTABLES.length ? PRINTABLES[i % PRINTABLES.length] : null;
  const sheetOr = (p, style) => p ? sheet(p, 1, style) : "";
  const fan = c => {
    if (c.id === "printables") return [pr(1),pr(0),pr(2)].filter(Boolean).map(p => `<div>${sheet(p)}</div>`).join("");
    const items = pickBooks(3, b => b.categories.includes(c.id)).map(b => cover(b));
    while (items.length < 3 && PRINTABLES.length) items.push(sheet(pr(items.length)));
    return items.map(h => `<div>${h}</div>`).join("");
  };
  return `
  <section class="hero"><div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">Islamic books &amp; learning resources</span>
      <h1>${esc(SETTINGS.hero_line_1 || "")}${SETTINGS.hero_line_2 ? `<br><em>${esc(SETTINGS.hero_line_2)}</em>` : ""}</h1>
      <p class="lede">${esc(SETTINGS.hero_text || "")}</p>
      <div class="actions"><a class="btn btn-primary" href="#books">Shop books</a><a class="btn btn-outline" href="#printables">Explore printables</a></div>
      <div class="hero-verse"><span class="arabic" lang="ar">وَقُل رَّبِّ زِدْنِي عِلْمًا</span><p>"And say: My Lord, increase me in knowledge."<br>Surah Ta-Ha, 20:114</p></div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="arch-bg"></div>
      <div class="slot" style="left:3%;width:26%">${heroBooks[0] ? cover(heroBooks[0]) : ""}</div>
      <div class="slot" style="left:25%;width:31%;z-index:2">${heroBooks[1] ? cover(heroBooks[1]) : ""}</div>
      <div class="slot" style="left:53%;width:25%;transform:rotate(4deg);transform-origin:bottom left">${heroBooks[2] ? cover(heroBooks[2]) : ""}</div>
      <div class="lying" style="right:1%;width:22%;display:grid;gap:0">
        <div style="height:26px;background:var(--c-slate);border-radius:2px;box-shadow:var(--shadow-book);color:#F7F4ED;font:600 .55rem/26px var(--sans);letter-spacing:.2em;text-transform:uppercase;padding-left:12px;width:94%;margin-left:4%">Iman &amp; Tazkiyah</div>
        <div style="height:30px;background:var(--c-plum);border-radius:2px;box-shadow:var(--shadow-book);color:#F7F4ED;font:600 .55rem/30px var(--sans);letter-spacing:.2em;text-transform:uppercase;padding-left:12px">Adab &amp; Akhlaq</div>
      </div>
      <div class="shelf"></div>
      <div class="window"></div>
    </div>
  </div></section>

  <section class="section-tight"><div class="wrap">
    <div class="section-head"><div class="titles"><span class="eyebrow">Shop by category</span><h2>Find the right book for your home</h2></div><a class="link" href="#books">View all books</a></div>
    <div class="cats">${CATEGORIES.map(c => `<a class="cat" href="#${c.href || "books-" + c.id}"><div class="cat-img"><div class="fan">${fan(c)}</div></div><h3>${esc(c.name)}</h3><span class="more">${esc(c.blurb)}</span></a>`).join("")}</div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="section-head"><div class="titles"><span class="eyebrow">Featured books</span><h2>On our reading table</h2></div><a class="link" href="#books">Shop all books</a></div>
    <div class="grid">${featured.map(bookCard).join("")}</div>
  </div></section>

  <section class="section printables-band"><div class="wrap band-grid">
    <div style="display:grid;gap:22px">
      <span class="eyebrow">Shop printables</span>
      <h2>Learning you can print at home</h2>
      <p class="lede">Downloadable PDFs for adhkaar, du'a and gentle Islamic activities. Print as many copies as your family needs.</p>
      <ul class="band-list">${PRINTABLES.slice(0,5).map(p => `<li><a href="#printable-${p.id}" style="color:inherit;text-decoration:none">${esc(p.title)}</a><span>${moneyText(p.price)}</span></li>`).join("")}</ul>
      <div><a class="btn btn-primary" href="#printables">Explore printables</a></div>
    </div>
    <div class="band-sheets" aria-hidden="true">
      ${sheetOr(pr(1), "position:absolute;left:4%;top:10%;width:44%;transform:rotate(-6deg)")}
      ${sheetOr(pr(0), "position:absolute;left:30%;top:2%;width:44%;z-index:2")}
      ${sheetOr(pr(2), "position:absolute;right:2%;top:14%;width:42%;transform:rotate(6deg)")}
    </div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="section-head"><div class="titles"><span class="eyebrow">From the journal</span><h2>Read. Reflect. Nurture.</h2></div><a class="link" href="#journal">Visit the journal</a></div>
    <div class="posts">${POSTS.slice(0,3).map(postCard).join("")}</div>
  </div></section>

  <section class="section" style="padding-top:24px"><div class="wrap story">
    <div class="story-art" aria-hidden="true"><div class="big-arch"><span class="arabic" lang="ar">تَوَكُّل</span><span class="eyebrow" style="justify-content:center">Trust in Allah</span></div></div>
    <div style="display:grid;gap:28px">
      <span class="eyebrow">Our story</span>
      <blockquote>${paras(SETTINGS.story).map(x => `<p>${esc(x)}</p>`).join("")}</blockquote>
      <div><a class="btn btn-outline" href="#about">Our story</a></div>
    </div>
  </div></section>

  ${newsletter()}`;
}

function newsletter(){
  return `<section class="section newsletter"><div class="wrap inner">
    ${divider}
    <h2>${esc(SETTINGS.newsletter_heading || "")}</h2>
    <p class="lede" style="text-align:center">${esc(SETTINGS.newsletter_text || "")}</p>
    <form class="nl-form" data-form="newsletter" novalidate>
      <label class="sr-only" for="nl-email">Email address</label>
      <input id="nl-email" type="email" name="email" placeholder="Your email address" autocomplete="email" required>
      <button class="btn btn-primary" type="submit">Subscribe</button>
    </form>
    <p class="form-msg" id="nl-msg" role="status"></p>
  </div></section>`;
}

/* Books shop */
const bookState = { q:"", cat:"all", sort:"featured" };
function viewBooks(cat){
  bookState.cat = (cat && catById[cat]) ? cat : "all";
  const chips = [{id:"all",name:"All books"}, ...CATEGORIES.filter(c => c.id !== "printables")];
  return `
  <header class="page-head wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>/</span><span>Shop books</span></nav>
    <h1>The Bookshop</h1>
    <p class="lede">Islamic books for children and families, chosen with care. Every Quranic Tarbiyah level is matched to your child's age.</p>
  </header>
  <section class="wrap" style="padding-bottom:96px">
    <div class="toolbar">
      <div class="search-field">${ICON.search}<label class="sr-only" for="book-q">Search books</label><input id="book-q" type="search" placeholder="Search by title, series or age" value="${esc(bookState.q)}"></div>
      <div class="chips" role="group" aria-label="Filter by category">${chips.map(c => `<button class="chip" data-bookcat="${c.id}" aria-pressed="${bookState.cat===c.id}">${esc(c.name)}</button>`).join("")}</div>
      <div class="chips">
        <label class="sr-only" for="book-sort">Sort</label>
        <select id="book-sort" class="chip" style="appearance:auto">
          ${[["featured","Sort: Featured"],["title","Sort: Title A–Z"],["price-asc","Sort: Price, low to high"],["price-desc","Sort: Price, high to low"]].map(([v,l]) => `<option value="${v}" ${bookState.sort===v?"selected":""}>${l}</option>`).join("")}
        </select>
      </div>
      <p class="result-count" id="book-count" role="status"></p>
    </div>
    <div class="grid" id="book-grid"></div>
  </section>`;
}
function renderBookGrid(){
  const q = bookState.q.trim().toLowerCase();
  let list = BOOKS.filter(b =>
    (bookState.cat === "all" || b.categories.includes(bookState.cat)) &&
    (!q || [b.title, b.subtitle, b.series, b.author, b.ages, b.description].join(" ").toLowerCase().includes(q)));
  if (bookState.sort === "title") list.sort((a,b) => (a.title + a.subtitle).localeCompare(b.title + b.subtitle));
  if (bookState.sort.startsWith("price")) list.sort((a,b) => ((a.price ?? 9999) - (b.price ?? 9999)) * (bookState.sort === "price-desc" ? -1 : 1));
  if (bookState.sort === "featured") list.sort((a,b) => (b.featured|0) - (a.featured|0));
  $("#book-grid").innerHTML = list.length ? list.map(bookCard).join("") : `<div class="empty-state" style="grid-column:1/-1"><h3>No books match that search</h3><p>Try another word, or <a href="${igDm}">ask us on Instagram</a>.</p></div>`;
  $("#book-count").textContent = `${list.length} ${list.length === 1 ? "book" : "books"}`;
}

function viewBook(id){
  const b = bookById[id];
  if (!b) return notFound();
  const a = availability(b);
  const related = BOOKS.filter(x => x.id !== b.id && x.categories.some(c => b.categories.includes(c)))
    .sort((x,y) => (y.series === b.series) - (x.series === b.series)).slice(0,4);
  const full = b.title + (b.subtitle ? `: ${b.subtitle}` : "");
  setMeta(full, b.description);
  return `
  <div class="wrap"><nav class="crumbs" aria-label="Breadcrumb" style="padding-top:32px"><a href="#home">Home</a><span>/</span><a href="#books">Shop books</a><span>/</span><span>${esc(full)}</span></nav>
  <article class="pdp" itemscope itemtype="https://schema.org/Book">
    <div class="pdp-media">${cover(b)}</div>
    <div class="pdp-info">
      <span class="eyebrow">${esc(b.series)}</span>
      <h1 itemprop="name">${esc(b.title)}${b.subtitle ? `<br><em style="font-weight:400;color:var(--slate)">${esc(b.subtitle)}</em>` : ""}</h1>
      <p class="author">by <span itemprop="author">${esc(b.author)}</span></p>
      <div class="pdp-price">
        <span class="price">${money(b.price)}</span>
        <span class="avail ${a.cls}">${a.text}</span>
      </div>
      ${a.canBuy ? `<div class="buy-row">${buyLink(b, "Buy now", "btn btn-primary")}<span class="small muted">Secure checkout on Payhip</span></div>`
        : `<div class="note-box"><strong>${a.text}.</strong> Message us on Instagram at <a href="${igDm}">@${esc(CONFIG.instagram)}</a> to reserve a copy.</div>`}
      <div class="prose" itemprop="description"><p>${esc(b.description)}</p></div>
      <ul class="highlights">${b.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>
      <dl class="specs"><dt>Publisher</dt><dd>${esc(b.author)}</dd><dt>Series</dt><dd>${esc(b.series)}</dd><dt>Suitable for</dt><dd>${esc(b.ages)}</dd><dt>Format</dt><dd>${esc(b.format)}</dd><dt>Shipping</dt><dd>Local mail within ${esc(CONFIG.country)}</dd></dl>
      <div class="note-box"><strong>About the publisher.</strong> ${esc(b.authorNote)}</div>
    </div>
  </article></div>
  <section class="section-tight" style="border-top:1px solid var(--line)"><div class="wrap">
    <div class="section-head"><div class="titles"><span class="eyebrow">You may also like</span><h2>Related books</h2></div></div>
    <div class="grid">${related.map(bookCard).join("")}</div>
  </div></section>`;
}

/* Printables */
const prState = { filter:"all" };
function viewPrintables(){
  return `
  <header class="page-head wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>/</span><span>Shop printables</span></nav>
    <h1>Printables for <em style="color:var(--slate);font-weight:400">little learners</em></h1>
    <p class="lede">Downloadable PDFs for adhkaar, du'a and gentle Islamic activities. Print at home, as many times as your family needs.</p>
  </header>
  <section class="wrap" style="padding-bottom:40px">
    <div class="toolbar" style="margin-bottom:40px"><div class="chips" role="group" aria-label="Filter printables">${PRINTABLE_FILTERS.map(f => `<button class="chip" data-prfilter="${f.id}" aria-pressed="${prState.filter===f.id}">${esc(f.name)}</button>`).join("")}</div></div>
    <div class="grid" id="pr-grid"></div>
  </section>
  <section class="section-tight"><div class="wrap">${downloadSteps()}</div></section>`;
}
function renderPrGrid(){
  const f = PRINTABLE_FILTERS.find(x => x.id === prState.filter);
  const list = PRINTABLES.filter(p => f.id === "all" || (f.test ? f.test(p) : p.kind === f.id));
  $("#pr-grid").innerHTML = list.map(printableCard).join("");
}
function downloadSteps(){
  return `<div style="background:var(--paper);border:1px solid var(--line);padding:40px;display:grid;gap:28px">
    <div style="display:grid;gap:10px"><span class="eyebrow">How downloads work</span><h2 style="font-size:2rem">From our shop to your printer</h2></div>
    <div class="values" style="background:none;border:0;gap:28px">
      <div style="padding:0;background:none"><h3>1. Choose</h3><p>Pick a printable and tap Buy now. You check out securely on Payhip.</p></div>
      <div style="padding:0;background:none"><h3>2. Pay</h3><p>Pay by card or PayPal. Free printables need only your email address.</p></div>
      <div style="padding:0;background:none"><h3>3. Download</h3><p>Download your PDF straight away. The link is also emailed to you. Print on A4 at 100% scale.</p></div>
    </div>
    <p class="small muted">Printables are for personal and family use. Please do not share or resell the files.</p>
  </div>`;
}
function viewPrintable(id){
  const p = prById[id];
  if (!p) return notFound();
  setMeta(p.title, p.description);
  const related = PRINTABLES.filter(x => x.id !== p.id).slice(0,4);
  return `
  <div class="wrap"><nav class="crumbs" aria-label="Breadcrumb" style="padding-top:32px"><a href="#home">Home</a><span>/</span><a href="#printables">Shop printables</a><span>/</span><span>${esc(p.title)}</span></nav>
  <article class="pdp">
    <div class="pdp-media sheets" style="background:${p.tintBg}">${sheet(p,1)}${sheet(p,2)}${sheet(p,3)}</div>
    <div class="pdp-info">
      <span class="badge-dl">${ICON.dl} Digital download · ${esc(p.size)}</span>
      <h1>${esc(p.title)}</h1>
      <p class="author">${esc(p.ages)}</p>
      <div class="pdp-price"><span class="price">${money(p.price)}</span><span class="avail">Instant download</span></div>
      <div class="buy-row">${buyLink(p, p.price === 0 ? "Get it free" : "Buy now", "btn btn-primary")}<span class="small muted">Secure checkout on Payhip</span></div>
      <div class="prose"><p>${esc(p.description)}</p></div>
      <div><h4 style="margin-bottom:10px">What's inside</h4><ul class="highlights">${p.includes.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>
      <div class="note-box"><strong>How you receive it.</strong> As soon as your payment goes through on Payhip, you can download the PDF straight away, and a download link is emailed to you too. For personal and family use.</div>
    </div>
  </article></div>
  <section class="section-tight" style="border-top:1px solid var(--line)"><div class="wrap">
    <div class="section-head"><div class="titles"><span class="eyebrow">More printables</span><h2>You may also like</h2></div></div>
    <div class="grid">${related.map(printableCard).join("")}</div>
  </div></section>`;
}

/* Journal */
const jState = { cat:"all", q:"" };
function viewJournal(catSlug){
  if (catSlug){ const c = POST_CATEGORIES.find(c => slug(c) === catSlug); if (c) jState.cat = c; }
  const feat = POSTS.find(p => p.featured) || POSTS[0];
  return `
  <header class="page-head wrap">
    <span class="eyebrow">Wings of Tawakkul Journal</span>
    <h1>Read. Reflect. Nurture.</h1>
    <p class="lede">Notes on tarbiyah, the Qur'an and Sunnah, and the quiet work of raising children who love to learn.</p>
  </header>
  <section class="wrap">
    <a class="featured-post" href="#article-${feat.slug}">${postImg(feat)}
      <div style="display:grid;gap:18px"><div class="post-meta"><span>Featured</span><span>${esc(feat.category)}</span></div><h2>${esc(feat.title)}</h2><p class="lede">${esc(feat.standfirst)}</p><span class="link" style="justify-self:start">Read the article</span></div></a>
    <hr class="rule">
    <div class="toolbar" style="margin-top:44px">
      <div class="search-field">${ICON.search}<label class="sr-only" for="post-q">Search the journal</label><input id="post-q" type="search" placeholder="Search articles" value="${esc(jState.q)}"></div>
      <div class="chips" role="group" aria-label="Filter by topic">${["all", ...POST_CATEGORIES].map(c => `<button class="chip" data-postcat="${esc(c)}" aria-pressed="${jState.cat===c}">${c==="all" ? "All topics" : esc(c)}</button>`).join("")}</div>
    </div>
    <div class="posts" id="post-grid" style="padding-bottom:96px"></div>
  </section>`;
}
function renderPostGrid(){
  const q = jState.q.trim().toLowerCase();
  const list = POSTS.filter(p => (jState.cat === "all" || p.category === jState.cat) && (!q || (p.title + p.excerpt + p.body + p.category).toLowerCase().includes(q)));
  $("#post-grid").innerHTML = list.length ? list.map(postCard).join("") : `<div class="empty-state" style="grid-column:1/-1"><h3>No articles yet in this topic</h3><p>New articles are added regularly, in sha Allah.</p></div>`;
}
function viewArticle(s){
  const p = postBySlug[s];
  if (!p) return notFound();
  setMeta(p.title, p.excerpt);
  const related = [...POSTS.filter(x => x.slug !== p.slug && x.category === p.category), ...POSTS.filter(x => x.slug !== p.slug && x.category !== p.category)].slice(0,3);
  const url = shareUrl(`article-${p.slug}`);
  const text = `${p.title} | Wings of Tawakkul Journal`;
  return `
  <article itemscope itemtype="https://schema.org/Article">
    <header class="article-head">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#journal">Journal</a><span>/</span><a href="#journal-${slug(p.category)}">${esc(p.category)}</a></nav>
      <h1 itemprop="headline">${esc(p.title)}</h1>
      <p class="standfirst">${esc(p.standfirst)}</p>
      <div class="post-meta"><time itemprop="datePublished" datetime="${p.date}">${fmtDate(p.date)}</time><span>${p.readTime} min read</span></div>
    </header>
    <div class="article-hero">${postImg(p)}</div>
    <div class="article-body" itemprop="articleBody">${md(p.body)}</div>
    <div class="share">
      <span>Share</span>
      <a href="https://wa.me/?text=${encodeURIComponent(text + " " + url)}" rel="noopener">WhatsApp</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" rel="noopener">Facebook</a>
      <a href="https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" rel="noopener">X</a>
      <a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}" rel="noopener">Telegram</a>
      <button type="button" data-copy="${esc(url)}">Copy link</button>
    </div>
  </article>
  <section class="section"><div class="wrap">
    <div class="section-head"><div class="titles"><span class="eyebrow">Keep reading</span><h2>Related articles</h2></div><a class="link" href="#journal">All articles</a></div>
    <div class="posts">${related.map(postCard).join("")}</div>
  </div></section>`;
}

/* About / Contact / Info */
function viewAbout(){
  const P = PAGES;
  return `
  <div class="wrap about-hero">
    <div style="display:grid;gap:24px">
      <span class="eyebrow">About us</span>
      <h1>${esc(P.about_title)}</h1>
      <p class="lede">${esc(P.about_intro)}</p>
    </div>
    <div class="story-art" aria-hidden="true"><div class="big-arch"><span class="arabic" lang="ar">وَعَلَى اللَّهِ فَتَوَكَّلُوا</span><span class="small muted">"And upon Allah rely." Surah Al-Ma'idah, 5:23</span></div></div>
  </div>
  <section class="info">${md(P.about_body)}${(P.about_values || []).length ? `<h2>What we look for in a book</h2>` : ""}</section>
  ${(P.about_values || []).length ? `<div class="wrap" style="padding-bottom:64px"><div class="values">${P.about_values.map(v => `<div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join("")}</div></div>` : ""}
  <section class="info">${md(P.about_closing)}
    <p style="margin-top:32px"><a class="btn btn-primary" href="#books">Browse the bookshop</a> &nbsp; <a class="btn btn-outline" href="#contact">Contact us</a></p>
  </section>`;
}
function viewContact(){
  return `
  <header class="page-head wrap"><span class="eyebrow">Contact</span><h1>We'd love to hear from you</h1><p class="lede">Questions about a book, a level or an order? Write to us and we will reply, in sha Allah, as soon as we can.</p></header>
  <div class="wrap contact-grid">
    <div class="contact-card">
      <span class="eyebrow" style="color:#D9CBB3">Instagram</span>
      <span class="handle">@${esc(CONFIG.instagram)}</span>
      <p>Our fastest way to reply. Send us a message for orders, stock and recommendations.</p>
      <div><a class="btn btn-primary" href="${igDm}" rel="noopener">Message us</a></div>
      <hr class="rule" style="background:rgba(247,244,237,.16);margin:8px 0">
      <p><strong style="color:var(--ivory)">Based in ${esc(CONFIG.country)}.</strong> Orders are posted with local mailing services.</p>
    </div>
    <form class="form-grid" data-form="contact" novalidate>
      <div><label for="c-name">Your name</label><input class="field" id="c-name" name="name" autocomplete="name" required></div>
      <div><label for="c-topic">Topic</label><select class="field" id="c-topic" name="topic"><option>A question about a book</option><option>Help choosing a level</option><option>An existing order</option><option>Something else</option></select></div>
      <div><label for="c-msg">Message</label><textarea class="field" id="c-msg" name="message" required></textarea></div>
      <div class="buy-row"><button class="btn btn-primary" type="submit">Prepare message</button><span class="small muted">We'll copy it for you to send on Instagram.</span></div>
      <p class="form-msg" id="c-status" role="status"></p>
    </form>
  </div>`;
}
function viewFaq(){
  return `<header class="page-head wrap"><span class="eyebrow">Help</span><h1>Frequently asked questions</h1></header>
  <section class="info"><div class="faq-list">${(PAGES.faq || []).map(f => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join("")}</div>
  <p style="margin-top:32px" class="muted">Still have a question? <a href="#contact">Contact us</a>.</p></section>`;
}
function viewShipping(){
  return `<header class="page-head wrap"><span class="eyebrow">Help</span><h1>Shipping &amp; returns</h1></header><section class="info">${md(PAGES.shipping)}</section>`;
}
function viewPrivacy(){
  return `<header class="page-head wrap"><span class="eyebrow">Legal</span><h1>Privacy policy</h1></header><section class="info">${md(PAGES.privacy)}</section>`;
}
function notFound(){
  setMeta("Page not found");
  return `<header class="page-head wrap" style="padding-bottom:120px"><span class="eyebrow">Not found</span><h1>We couldn't find that page</h1><p class="lede">It may have moved. Try the bookshop or the journal.</p><div class="buy-row" style="justify-content:center"><a class="btn btn-primary" href="#books">Shop books</a><a class="btn btn-outline" href="#journal">Read the journal</a></div></header>`;
}

/* ---------- Search overlay ---------- */
function openSearch(){
  const ov = $("#search-overlay"); ov.classList.add("open"); ov.setAttribute("aria-hidden","false");
  const inp = $("#search-input"); inp.value = ""; runSearch(""); setTimeout(() => inp.focus(), 30);
}
function closeSearch(){ const ov = $("#search-overlay"); ov.classList.remove("open"); ov.setAttribute("aria-hidden","true"); }
function runSearch(q){
  q = q.trim().toLowerCase();
  const out = $("#search-results");
  if (!q){ out.innerHTML = `<h4>Popular</h4>${BOOKS.filter(b => b.featured).slice(0,3).map(resultBook).join("")}${PRINTABLES.slice(0,1).map(resultPr).join("")}`; return; }
  const b = BOOKS.filter(x => [x.title,x.subtitle,x.series,x.ages,x.author].join(" ").toLowerCase().includes(q)).slice(0,6);
  const p = PRINTABLES.filter(x => (x.title + x.description + x.ages).toLowerCase().includes(q)).slice(0,4);
  const a = POSTS.filter(x => (x.title + x.excerpt + x.category).toLowerCase().includes(q)).slice(0,4);
  out.innerHTML = (b.length ? `<h4>Books</h4>${b.map(resultBook).join("")}` : "") + (p.length ? `<h4>Printables</h4>${p.map(resultPr).join("")}` : "") + (a.length ? `<h4>Journal</h4>${a.map(x => `<a href="#article-${x.slug}"><div><strong>${esc(x.title)}</strong><small>${esc(x.category)}</small></div></a>`).join("")}` : "")
    || `<p class="muted" style="padding:24px 0">Nothing found for "${esc(q)}". Try a series name, a level or a topic.</p>`;
}
const resultBook = x => `<a href="#book-${x.id}"><div class="mini">${cover(x)}</div><div><strong>${esc(x.title)}${x.subtitle ? `: ${esc(x.subtitle)}` : ""}</strong><small>${esc(x.ages)} · ${x.price != null ? moneyText(x.price) : "Price on request"}</small></div></a>`;
const resultPr = x => `<a href="#printable-${x.id}"><div class="mini">${sheet(x)}</div><div><strong>${esc(x.title)}</strong><small>PDF · ${moneyText(x.price)}</small></div></a>`;

/* ---------- Helpers ---------- */
function toast(msg){
  const t = $("#toast"); t.innerHTML = `<span>${esc(msg)}</span>`;
  t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3200);
}
async function copyText(text, fallbackEl){
  try { await navigator.clipboard.writeText(text); toast("Copied"); return true; }
  catch(e){ if (fallbackEl){ fallbackEl.removeAttribute("readonly"); fallbackEl.focus(); fallbackEl.select(); } toast("Select the text and copy it"); return false; }
}
function shareUrl(hash){ const base = CONFIG.siteUrl || location.href.split("#")[0]; return `${base}#${hash}`; }
const BASE_TITLE = "Wings of Tawakkul | Islamic Books & Learning Resources";
function setMeta(title, desc){
  document.title = title ? `${title} | Wings of Tawakkul` : BASE_TITLE;
  if (desc) $('meta[name="description"]').setAttribute("content", desc);
}

/* ---------- Router ---------- */
const ROUTES = [
  [/^$|^home$/, () => { setMeta(); return viewHome(); }, "home"],
  [/^books(?:-([a-z]+))?$/, m => { setMeta("Shop books", "Islamic children's books and learning resources in Singapore."); return viewBooks(m[1] || (m[0]==="books" ? "all" : undefined)); }, "books"],
  [/^book-(.+)$/, m => viewBook(m[1]), "books"],
  [/^printables$/, () => { setMeta("Shop printables", "Downloadable Islamic printables and worksheets for children."); return viewPrintables(); }, "printables"],
  [/^printable-(.+)$/, m => viewPrintable(m[1]), "printables"],
  [/^journal(?:-(.+))?$/, m => { setMeta("Journal", "The Wings of Tawakkul Journal: tarbiyah, Qur'an and beneficial reading."); if (!m[1]) jState.cat = "all"; return viewJournal(m[1]); }, "journal"],
  [/^article-(.+)$/, m => viewArticle(m[1]), "journal"],
  [/^about$/, () => { setMeta("About us"); return viewAbout(); }, "about"],
  [/^contact$/, () => { setMeta("Contact"); return viewContact(); }, "contact"],
  [/^faq$/, () => { setMeta("FAQ"); return viewFaq(); }, ""],
  [/^shipping$/, () => { setMeta("Shipping & returns"); return viewShipping(); }, ""],
  [/^privacy$/, () => { setMeta("Privacy policy"); return viewPrivacy(); }, ""],
  [/^cart$/, () => { location.replace("#books"); return ""; }, ""],
];
let lastHash = null;
function route(){
  if (/_token=/.test(location.hash)) return;  /* admin login links are handled by Netlify Identity */
  const h = decodeURIComponent(location.hash.slice(1));
  if (h === lastHash) return; lastHash = h;
  let html = null, nav = "";
  for (const [re, fn, n] of ROUTES){ const m = h.match(re); if (m){ html = fn(m); nav = n; break; } }
  if (html == null) html = notFound();
  app.innerHTML = `<div class="view active">${html}</div>`;
  if ($("#book-grid")) renderBookGrid();
  if ($("#pr-grid")) renderPrGrid();
  if ($("#post-grid")) renderPostGrid();
  $$(".nav-links a, .mobile-menu a").forEach(a => a.getAttribute("data-nav") === nav ? a.setAttribute("aria-current","page") : a.removeAttribute("aria-current"));
  closeMenu(); closeSearch();
  window.scrollTo(0, 0);
}
function closeMenu(){ const m = $("#mobile-menu"); m.classList.remove("open"); $("#menu-open").setAttribute("aria-expanded","false"); }

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-bookcat],[data-prfilter],[data-postcat],[data-copy],[data-open-search],[data-close-search],#menu-open,#menu-close");
  if (!t) { if (e.target.id === "search-overlay") closeSearch(); return; }
  if (t.dataset.bookcat){ bookState.cat = t.dataset.bookcat; $$("[data-bookcat]").forEach(c => c.setAttribute("aria-pressed", c === t)); renderBookGrid(); return; }
  if (t.dataset.prfilter){ prState.filter = t.dataset.prfilter; $$("[data-prfilter]").forEach(c => c.setAttribute("aria-pressed", c === t)); renderPrGrid(); return; }
  if (t.dataset.postcat){ jState.cat = t.dataset.postcat; $$("[data-postcat]").forEach(c => c.setAttribute("aria-pressed", c === t)); renderPostGrid(); return; }
  if (t.dataset.copy){ copyText(t.dataset.copy); return; }
  if (t.hasAttribute("data-open-search")){ openSearch(); return; }
  if (t.hasAttribute("data-close-search")){ closeSearch(); return; }
  if (t.id === "menu-open"){ $("#mobile-menu").classList.add("open"); t.setAttribute("aria-expanded","true"); $("#menu-close").focus(); return; }
  if (t.id === "menu-close"){ closeMenu(); return; }
});
document.addEventListener("input", e => {
  if (e.target.id === "book-q"){ bookState.q = e.target.value; renderBookGrid(); }
  if (e.target.id === "post-q"){ jState.q = e.target.value; renderPostGrid(); }
  if (e.target.id === "search-input") runSearch(e.target.value);
});
document.addEventListener("change", e => { if (e.target.id === "book-sort"){ bookState.sort = e.target.value; renderBookGrid(); } });
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-form]"); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === "newsletter"){
    const v = f.email.value.trim(), msg = $("#nl-msg");
    if (!/^\S+@\S+\.\S+$/.test(v)){ msg.textContent = "Please enter a valid email address."; f.email.focus(); return; }
    /* No mailing service is connected yet, so nothing is stored. See README for MailerLite setup. */
    msg.innerHTML = `JazakAllahu khayran. Our newsletter is launching soon and signups aren't saved yet. For new arrivals now, follow <a href="${igUrl}">@${esc(CONFIG.instagram)}</a> on Instagram.`;
    f.reset();
  }
  if (f.dataset.form === "contact"){
    const name = f.name.value.trim(), m = f.message.value.trim(), st = $("#c-status");
    if (!name || !m){ st.textContent = "Please add your name and a message."; return; }
    const text = `Assalamu'alaikum, this is ${name}.\nTopic: ${f.topic.value}\n\n${m}`;
    copyText(text).then(ok => { st.innerHTML = ok ? `Your message is copied. <a href="${igDm}">Open Instagram</a> and paste it to send.` : `Copy your message above, then <a href="${igDm}">open Instagram</a> to send it.`; });
  }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape"){ closeSearch(); closeMenu(); }
  if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)){ e.preventDefault(); openSearch(); }
});
window.addEventListener("hashchange", route);

/* Static bits */
if (SETTINGS.announcement) { const an = $(".announce"); if (an) an.textContent = SETTINGS.announcement; }
$$("[data-ig]").forEach(a => a.href = igUrl);
$("#yr").textContent = new Date().getFullYear();
route();
})();
