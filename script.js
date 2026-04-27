// ── RATES ─────────────────────────────
const CO2_RATE = 1197.6;
const FOREST_RATE = 1490;
const DEATH_RATE = 0.2852;
const PLASTIC_RATE = 14587;

const YEAR_START = new Date('2026-01-01T00:00:00Z').getTime();
const PAGE_START = Date.now();
const rootEl = document.documentElement;

// ── PERFORMANCE: THROTTLE FUNCTION ── 
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Force scroll to top on refresh
if (history.scrollRestoration) {
  // Scroll Reset & Progress
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ── SCROLL LISTENER: THROTTLED FOR PERFORMANCE ──
window.addEventListener('scroll', throttle(() => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  const sp = document.getElementById('scroll-progress');
  if (sp) sp.style.width = scrolled + '%';
  rootEl.style.setProperty('--story-progress', Math.max(0, Math.min(1, scrolled / 100)).toFixed(4));
}, 16), { passive: true });

// ── POINTER LISTENER: THROTTLED FOR PERFORMANCE ──
window.addEventListener('pointermove', throttle(event => {
  const x = event.clientX / window.innerWidth;
  const y = event.clientY / window.innerHeight;
  rootEl.style.setProperty('--pointer-x', Math.max(0, Math.min(1, x)).toFixed(4));
  rootEl.style.setProperty('--pointer-y', Math.max(0, Math.min(1, y)).toFixed(4));
}, 16), { passive: true });

rootEl.style.setProperty('--story-progress', '0');
rootEl.style.setProperty('--pointer-x', '.5');
rootEl.style.setProperty('--pointer-y', '.35');

// ── PARTICLE SYSTEM ─────────────────────
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const COUNT = 60;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.15 - 0.1,
      o: Math.random() * 0.4 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 120, 50, ${p.o})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

const fmt = (n, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtT = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// DOM refs - GUARDED FOR SAFETY
const heroEl = document.getElementById('hero-co2');
const bTime = document.getElementById('b-time');
const bCO2 = document.getElementById('b-co2');
const dTimer = document.getElementById('d-timer');
const dCO2 = document.getElementById('d-co2');
const dForest = document.getElementById('d-forest');
const dDeaths = document.getElementById('d-deaths');
const dPlastic = document.getElementById('d-plastic');
const bar = document.getElementById('bar');
const damageSection = document.getElementById('damage');
const topLinks = document.querySelectorAll('.js-top-link');
const backToTop = document.getElementById('back-to-top');

// ── PERSONAL IMPACT LOGIC ─────────────────────────
let personalData = {
  commute: 'none',
  ac: 2,
  diet: 'veg',
  electric: 'medium',
  lang: localStorage.getItem('earthDying_lang') || 'en'
};

// ── STATE MANAGEMENT: URL BOOKMARKING & LOCAL STORAGE ──
function saveState() {
  localStorage.setItem('earthDying_lang', personalData.lang);
  localStorage.setItem('earthDying_commute', personalData.commute);
  localStorage.setItem('earthDying_ac', personalData.ac);
  localStorage.setItem('earthDying_diet', personalData.diet);
  localStorage.setItem('earthDying_electric', personalData.electric);
  
  // Create shareable URL
  const params = new URLSearchParams({
    lang: personalData.lang,
    commute: personalData.commute,
    ac: personalData.ac,
    diet: personalData.diet,
    electric: personalData.electric
  });
  
  // Update URL without reloading (replace history state)
  window.history.replaceState({}, '', `?${params.toString()}`);
}

function loadState() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('lang')) personalData.lang = params.get('lang');
  if (params.has('commute')) personalData.commute = params.get('commute');
  if (params.has('ac')) personalData.ac = parseInt(params.get('ac'));
  if (params.has('diet')) personalData.diet = params.get('diet');
  if (params.has('electric')) personalData.electric = params.get('electric');
  
  // Load from localStorage if no URL params
  if (!params.has('commute')) personalData.commute = localStorage.getItem('earthDying_commute') || 'none';
  if (!params.has('ac')) personalData.ac = parseInt(localStorage.getItem('earthDying_ac') || 2);
  if (!params.has('diet')) personalData.diet = localStorage.getItem('earthDying_diet') || 'veg';
  if (!params.has('electric')) personalData.electric = localStorage.getItem('earthDying_electric') || 'medium';
}

// Lazy load();
loadState();
applyLanguage(personalData.lang);

// ── GLOBE INTERACTIVITY ──────────────
// Make continents interactive
const continentLabels = {
  'continent--americas': 'Americas: 24% global emissions',
  'continent--canada': 'Canada: Major climate leader',
  'continent--greenland': 'Greenland: Rapid ice loss',
  'continent--africa': 'Africa: Most vulnerable',
  'continent--europe': 'Europe: Carbon neutral goals',
  'continent--middle-east': 'Middle East: Oil production',
  'continent--india': 'India: Renewable surge',
  'continent--asia': 'Asia: Highest emissions',
  'continent--se-asia': 'SE Asia: Deforestation hotspot',
  'continent--japan': 'Japan: Green tech pioneer',
  'continent--australia': 'Australia: Climate crisis',
  'continent--antarctica': 'Antarctica: Critical data'
};

document.querySelectorAll('.continent').forEach(continent => {
  const className = Array.from(continent.classList).find(c => c.startsWith('continent--'));
  
  continent.addEventListener('mouseenter', function() {
    const label = continentLabels[className];
    if (label) {
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `
        position: fixed;
        background: rgba(0,0,0,0.9);
        color: #00C8FF;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: 'Space Mono', monospace;
        pointer-events: none;
        z-index: 1000;
        border: 1px solid rgba(0, 200, 255, 0.3);
      `;
      tooltip.textContent = label;
      document.body.appendChild(tooltip);
      
      // Position tooltip near continent
      const rect = continent.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      tooltip.style.top = (rect.top - 30) + 'px';
      tooltip.style.transform = 'translate(-50%, 0)';
      
      continent.dataset.tooltip = true;
      continent.dataset.tooltipEl = tooltip;
    }
  });
  
  continent.addEventListener('mouseleave', function() {
    if (continent.dataset.tooltipEl) {
      document.body.removeChild(continent.dataset.tooltipEl);
      delete continent.dataset.tooltip;
      delete continent.dataset.tooltipEl;
    }
  });
});

const MULTIPLIERS = {
  commute: { none: 0, bike: 50, public: 1000, car: 3000 },
  diet: { veg: 1500, mixed: 2500, heavy: 3300 },
  electric: { light: 500, medium: 1500, heavy: 3000 },
  ac: 438 // per hour
};

function updateImpact() {
  const yearly = MULTIPLIERS.commute[personalData.commute] +
    (personalData.ac * MULTIPLIERS.ac) +
    MULTIPLIERS.diet[personalData.diet] +
    MULTIPLIERS.electric[personalData.electric];

  if (document.getElementById('yearly-co2')) document.getElementById('yearly-co2').textContent = fmt(yearly);
  if (document.getElementById('eq-km')) document.getElementById('eq-km').textContent = fmt(yearly / 0.12); // 120g/km
  if (document.getElementById('eq-fuel')) document.getElementById('eq-fuel').textContent = fmt(yearly / 2.3); // 2.3kg/L
  
  saveState();
}

// Event Listeners
document.querySelectorAll('.toggle-group button').forEach(btn => {
  btn.addEventListener('click', function () {
    const group = this.parentElement;
    group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const key = group.id.split('-')[0];
    personalData[key] = this.dataset.val;
    updateImpact();
    
    // Announce to screen readers
    const label = this.parentElement.previousElementSibling?.textContent || '';
    if (label) {
      const announcement = `${label.trim()} ${this.textContent.trim()} selected`;
      announceToScreenReader(announcement);
    }
  });
});

const acSlider = document.getElementById('ac-slider');
const acVal = document.getElementById('ac-val');
if (acSlider) {
  acSlider.addEventListener('input', function () {
    personalData.ac = parseInt(this.value);
    if (acVal) acVal.textContent = this.value + 'h';
    updateImpact();
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

topLinks.forEach(link => link.addEventListener('click', scrollToTop));
if (backToTop) backToTop.addEventListener('click', scrollToTop);

function updateBackToTopVisibility() {
  if (!backToTop) return;
  backToTop.classList.toggle('visible', window.scrollY > 320);
}

updateBackToTopVisibility();
window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });

// ── ACCESSIBILITY: SCREEN READER ANNOUNCEMENTS ──
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

// Language Toggle
function toggleLang() {
  personalData.lang = personalData.lang === 'en' ? 'hi' : 'en';
  applyLanguage(personalData.lang);
  
  // Update button aria-pressed state
  const langBtn = document.getElementById('lang-toggle-top');
  if (langBtn) {
    langBtn.setAttribute('aria-pressed', personalData.lang === 'hi');
  }
  
  saveState();
}

function applyLanguage(lang) {
  document.body.dataset.lang = lang;
  const btn = document.getElementById('lang-toggle-top');
  if (btn) btn.textContent = lang === 'en' ? 'HINDI' : 'ENGLISH';

  document.querySelectorAll('.t-lang').forEach(el => {
    const value = el.dataset[lang];
    if (!value) return;
    if (value.includes('<')) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  reMapRefs();
  updateImpact();
}

function reMapRefs() {
  // Update refs that might be inside t-lang blocks
  const newDTimer = document.getElementById('d-timer') || document.getElementById('d-timer-hi');
  if (newDTimer) {
    // We'll just use a shared variable for dTimer
    window.activeDTimer = newDTimer;
  }
}
reMapRefs();

// Update tick to include personal live co2
const personalLiveEl = document.getElementById('personal-live-co2');
function tick() {
  const now = Date.now();
  const elapsed = (now - PAGE_START) / 1000;
  const yearSec = (now - YEAR_START) / 1000;

  const co2year = yearSec * CO2_RATE;
  const co2page = elapsed * CO2_RATE;
  const forestPg = elapsed * FOREST_RATE;
  const deathPg = elapsed * DEATH_RATE;
  const plasticPg = elapsed * PLASTIC_RATE;

  heroEl.textContent = fmt(co2year);
  bTime.textContent = fmtT(elapsed);
  bCO2.textContent = fmt(co2page);

  if (window.activeDTimer) window.activeDTimer.textContent = fmtT(elapsed);

  dCO2.textContent = fmt(co2page);
  dForest.textContent = fmt(forestPg);
  dDeaths.textContent = deathPg.toFixed(2);
  dPlastic.textContent = fmt(plasticPg);

  // Personal Live Logic
  const yearly = MULTIPLIERS.commute[personalData.commute] +
    (personalData.ac * MULTIPLIERS.ac) +
    MULTIPLIERS.diet[personalData.diet] +
    MULTIPLIERS.electric[personalData.electric];
  const gramsPerSec = (yearly * 1000) / (365 * 24 * 3600);
  personalLiveEl.textContent = fmt(elapsed * gramsPerSec, 2);

  requestAnimationFrame(tick);
}
updateImpact();
tick();

// ── BAR INVERT ───────────────────────
new IntersectionObserver(entries => {
  bar.classList.toggle('inverted', entries[0].isIntersecting);
}, { threshold: 0.1 }).observe(damageSection);

// ── SCROLL REVEAL ───────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('up')
  });
}, { threshold: 0.1 });

document.querySelectorAll('.r,.r-left').forEach(el => io.observe(el));

// ── CHARTS ────────────────────────────────────────
// LAZY LOAD: Charts only initialize when user scrolls to them
let chartsInitialized = false;

const gridC = 'rgba(255,255,255,0.04)';
const tickC = 'rgba(240,237,232,0.25)';
const ttBase = {
  backgroundColor: '#080808', titleColor: '#F0EDE8',
  bodyColor: '#666', borderColor: '#1a1a1a', borderWidth: 1,
  padding: 12,
  titleFont: { family: 'Bebas Neue', size: 18 },
  bodyFont: { family: 'Space Mono', size: 10 }
};
const axBase = {
  x: { grid: { color: gridC }, ticks: { color: tickC, maxTicksLimit: 7 } },
  y: { grid: { color: gridC }, ticks: { color: tickC } }
};
const base = (extra = {}) => ({
  responsive: true, maintainAspectRatio: true, aspectRatio: 1.75,
  plugins: { legend: { display: false }, tooltip: ttBase },
  scales: axBase, ...extra
});

const makeGrad = (ctx, color, alpha = 0.25) => {
  const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 230);
  g.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
  g.addColorStop(1, color.replace(')', `,0)`).replace('rgb', 'rgba'));
  return g;
};

function initCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;
  
  if (!window.Chart) return; // Ensure Chart.js is loaded

  const co2Canvas = document.getElementById('co2Chart');
  const tempCanvas = document.getElementById('tempChart');
  const wildCanvas = document.getElementById('wildChart');
  const sectorCanvas = document.getElementById('sectorChart');

  if (co2Canvas) {
    new Chart(co2Canvas, {
      type: 'line',
      data: {
        labels: ['1960', '1965', '1970', '1975', '1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015', '2020', '2024'],
        datasets: [{
          data: [9.4, 11.1, 14.5, 16.5, 19.2, 19.8, 22.7, 23.5, 25.6, 29.2, 33.1, 35.4, 34.8, 37.8],
          borderColor: '#FF1500',
          backgroundColor: ctx => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, 'rgba(255,21,0,0.3)'); g.addColorStop(1, 'rgba(255,21,0,0)'); return g; },
          borderWidth: 2.5, fill: true, tension: 0.4,
          pointBackgroundColor: '#FF1500', pointRadius: 3, pointHoverRadius: 6,
        }]
      },
      options: base()
    });
  }

  if (tempCanvas) {
    new Chart(tempCanvas, {
      type: 'line',
      data: {
        labels: ['1880', '1900', '1920', '1940', '1960', '1980', '2000', '2010', '2015', '2018', '2020', '2022', '2024'],
        datasets: [{
          data: [-0.16, -0.08, -0.27, -0.02, 0.03, 0.26, 0.42, 0.72, 0.87, 0.83, 0.98, 1.11, 1.35],
          borderColor: '#ffb300',
          backgroundColor: ctx => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, 'rgba(255,179,0,0.25)'); g.addColorStop(1, 'rgba(255,179,0,0)'); return g; },
          borderWidth: 2.5, fill: true, tension: 0.4,
          pointBackgroundColor: '#ffb300', pointRadius: 3, pointHoverRadius: 6,
        }]
      },
      options: base()
    });
  }

  if (wildCanvas) {
    new Chart(wildCanvas, {
      type: 'line',
      data: {
        labels: ['1970', '1975', '1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015', '2018', '2020'],
        datasets: [{
          data: [100, 92, 85, 79, 72, 65, 58, 51, 45, 38, 32, 27],
          borderColor: '#C8FF00',
          backgroundColor: ctx => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, 'rgba(200,255,0,0.18)'); g.addColorStop(1, 'rgba(200,255,0,0)'); return g; },
          borderWidth: 2.5, fill: true, tension: 0.4,
          pointBackgroundColor: '#C8FF00', pointRadius: 3, pointHoverRadius: 6,
        }]
      },
      options: base()
    });
  }

  if (sectorCanvas) {
    new Chart(sectorCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Energy', 'Transport', 'Industry', 'Agriculture', 'Buildings', 'Waste', 'Other'],
        datasets: [{
          data: [30, 13.7, 12.7, 11.7, 6.6, 3.4, 21.9],
          backgroundColor: ['#FF1500', '#ffb300', '#00C8FF', '#22c55e', '#a855f7', '#f97316', '#222'],
          borderColor: '#060606', borderWidth: 3, hoverOffset: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 1.6,
        plugins: {
          legend: { display: true, position: 'right', labels: { color: 'rgba(240,237,232,0.4)', font: { family: 'Space Mono', size: 9 }, boxWidth: 10, padding: 14 } },
          tooltip: { ...ttBase, callbacks: { label: c => ` ${c.parsed}%` } }
        }
      }
    });
  }
}

// ── LAZY LOAD CHARTS: Only initialize when user scrolls to them ──
const chartsSection = document.getElementById('charts');
if (chartsSection) {
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      initCharts();
    }
  }, { threshold: 0.1 }).observe(chartsSection);
}

// ── SOLUTION COUNTER ANIMATION ───────────────────
const solCounterIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.count);
    if (!target || el.dataset.animated) return;
    el.dataset.animated = '1';
    const duration = 2000;
    const start = performance.now();
    function animate(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else el.textContent = target;
    }
    requestAnimationFrame(animate);
  });
}, { threshold: 0.3 });

document.querySelectorAll('.sol-stat-num').forEach(el => solCounterIO.observe(el));