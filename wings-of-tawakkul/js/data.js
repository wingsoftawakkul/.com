/* =========================================================
   Wings of Tawakkul — content loader
   Your books, printables, journal articles and page text are
   kept in the content/ folder and edited from the admin page
   (yoursite.com/admin). This file loads them for the website.
   ========================================================= */

window.WOT = {};

WOT.CONFIG = {
  shopName: "Wings of Tawakkul",
  instagram: "wingsoftawakkul",     // replaced by the value in Settings
  currency: "SGD",
  country: "Singapore",
  siteUrl: "",
};

/* Shop categories (homepage cards and shop filters) */
WOT.CATEGORIES = [
  { id:"childrens",  name:"Islamic Children's Books",   blurb:"Stories that plant love for Allah and His Messenger ﷺ." },
  { id:"learning",   name:"Islamic Learning Resources", blurb:"Structured lessons in iman, adab and the Sirah." },
  { id:"quran",      name:"Qur'an & Tadabbur",          blurb:"Reflecting on the words of Allah, level by level." },
  { id:"printables", name:"Islamic Printables",         blurb:"Downloadable PDFs to print at home.", href:"printables" },
  { id:"activities", name:"Educational Activities",     blurb:"Hands-on activity books and worksheets." },
];

WOT.POST_CATEGORIES = ["Islamic Tarbiyah","Raising Muslim Children","Qur'an & Sunnah","Beneficial Reading","Homeschooling & Learning","Reflections"];

WOT.PRINTABLE_FILTERS = [
  { id:"all", name:"All" },
  { id:"duas", name:"Adhkaar & Du'a", test:p => ["adhkaar","dua"].includes(p.kind) },
  { id:"puzzles", name:"Puzzles & Activities", test:p => ["wordsearch","worksheet","activity","cards","tracker"].includes(p.kind) },
];

const PRINTABLE_TINTS = {
  adhkaar:["#E8EDF2","#E5EAEF"], wordsearch:["#E4E9E4","#E3E8E2"], dua:["#EFE7DA","#ECE5D8"],
  tracker:["#EFE7DA","#ECE5D8"], worksheet:["#EDE6EC","#EAE3E9"], cards:["#E6EDF0","#E3EAEE"], activity:["#F0E9DD","#EDE6D9"],
};
const PUBLISHER_NOTES = {
  "Quranic Tarbiyah": "Wings of Tawakkul is an authorised reseller of the Quranic Tarbiyah series.",
  "Umm Assad Publications": "Umm Assad Publications creates Islamic books for children and young readers.",
};
const slugify = s => String(s || "").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const num = v => (v === "" || v == null || isNaN(+v)) ? null : +v;
const img = v => v ? String(v).replace(/^\//, "") : null;

WOT.load = async function(){
  const get = f => fetch(`content/${f}.json`, { cache:"no-cache" }).then(r => { if (!r.ok) throw new Error(f); return r.json(); });
  const [books, printables, journal, settings, pages] = await Promise.all(
    ["books","printables","journal","settings","pages"].map(get));

  WOT.SETTINGS = settings;
  WOT.PAGES = pages;
  if (settings.instagram) WOT.CONFIG.instagram = settings.instagram.replace(/^@/, "").trim();

  WOT.BOOKS = (books.books || []).map((b, i) => ({
    id: b.id || slugify(`${b.title} ${b.subtitle || ""}`) || `book-${i}`,
    title: b.title || "Untitled",
    subtitle: b.subtitle || "",
    series: b.series || b.publisher || "",
    author: b.publisher || "",
    authorNote: PUBLISHER_NOTES[b.publisher] || "",
    price: num(b.price),
    payhip: b.payhip || "",
    status: b.status || "available",
    ages: b.ages || "",
    format: b.format || "Paperback",
    categories: b.categories || [],
    tone: `--c-${b.cover_colour || "navy"}`,
    mark: b.cover_letter || (b.subtitle || b.title || "W").trim().charAt(0),
    image: img(b.image),
    featured: !!b.featured,
    description: b.description || "",
    highlights: b.highlights || [],
  }));

  WOT.PRINTABLES = (printables.printables || []).map((p, i) => {
    const t = PRINTABLE_TINTS[p.kind] || PRINTABLE_TINTS.activity;
    return {
      id: p.id || slugify(p.title) || `printable-${i}`,
      title: p.title || "Untitled",
      kind: p.kind || "activity",
      price: num(p.price) ?? 0,
      size: p.size || "PDF",
      ages: p.ages || "",
      payhip: p.payhip || "",
      image: img(p.image),
      description: p.description || "",
      includes: p.includes || [],
      words: ["ADAM","NUH","MUSA","ISA","YUSUF","YUNUS","DAWUD","HUD"],
      tint: t[0], tintBg: t[1],
    };
  });

  WOT.POSTS = (journal.posts || []).map((p, i) => ({
    slug: p.slug || slugify(p.title) || `article-${i}`,
    title: p.title || "Untitled",
    category: p.category || "Reflections",
    date: String(p.date || "").slice(0, 10),
    readTime: p.readTime || Math.max(2, Math.round(String(p.body || "").split(/\s+/).length / 200)),
    featured: !!p.featured,
    image: img(p.image),
    tone: `--c-${p.cover_colour || "slate"}`,
    word: p.cover_word || "",
    excerpt: p.excerpt || "",
    standfirst: p.standfirst || p.excerpt || "",
    body: p.body || "",
  })).sort((a, b) => b.date.localeCompare(a.date));
};
