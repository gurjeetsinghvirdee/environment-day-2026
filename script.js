// ── RATES ─────────────────────────────
const CO2_RATE    = 1197.6;
const FOREST_RATE = 1490;
const DEATH_RATE  = 0.2852;
const PLASTIC_RATE= 14587;

const YEAR_START = new Date('2026-01-01T00:00:00Z').getTime();
const PAGE_START = Date.now();

const fmt = (n, d=0) => n.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const fmtT = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;

// DOM refs
const heroEl    = document.getElementById('hero-co2');
const bTime     = document.getElementById('b-time');
const bCO2      = document.getElementById('b-co2');
const bForest   = document.getElementById('b-forest');
const bDeaths   = document.getElementById('b-deaths');
const dTimer    = document.getElementById('d-timer');
const dCO2      = document.getElementById('d-co2');
const dForest   = document.getElementById('d-forest');
const dDeaths   = document.getElementById('d-deaths');
const dPlastic  = document.getElementById('d-plastic');
const bar       = document.getElementById('bar');
const damageSection = document.getElementById('damage');

// ── PERSONAL IMPACT LOGIC ─────────────────────────
let personalData = {
  commute: 'none',
  ac: 2,
  diet: 'veg',
  electric: 'medium',
  lang: 'en'
};

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

  document.getElementById('yearly-co2').textContent = fmt(yearly);
  document.getElementById('eq-km').textContent = fmt(yearly / 0.12); // 120g/km
  document.getElementById('eq-fuel').textContent = fmt(yearly / 2.3); // 2.3kg/L
}

// Event Listeners
document.querySelectorAll('.toggle-group button').forEach(btn => {
  btn.addEventListener('click', function() {
    const group = this.parentElement;
    group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const key = group.id.split('-')[0];
    personalData[key] = this.dataset.val;
    updateImpact();
  });
});

const acSlider = document.getElementById('ac-slider');
const acVal = document.getElementById('ac-val');
acSlider.addEventListener('input', function() {
  personalData.ac = parseInt(this.value);
  acVal.textContent = this.value + 'h';
  updateImpact();
});

// Language Toggle
function toggleLang() {
  personalData.lang = personalData.lang === 'en' ? 'hi' : 'en';
  document.body.dataset.lang = personalData.lang; // Global attribute for CSS
  const btn = document.getElementById('lang-toggle-top');
  if(btn) btn.textContent = personalData.lang === 'en' ? 'HINDI' : 'ENGLISH';

  document.querySelectorAll('.t-lang').forEach(el => {
    // We use innerHTML if there's a tag like <br> or <span> inside
    if (el.dataset[personalData.lang].includes('<')) {
      el.innerHTML = el.dataset[personalData.lang];
    } else {
      el.textContent = el.dataset[personalData.lang];
    }
  });

  // Re-map timer refs because innerHTML might have destroyed them
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
  const forestPg= elapsed * FOREST_RATE;
  const deathPg = elapsed * DEATH_RATE;
  const plasticPg= elapsed * PLASTIC_RATE;

  heroEl.textContent   = fmt(co2year);
  bTime.textContent    = fmtT(elapsed);
  bCO2.textContent     = fmt(co2page);
  bForest.textContent  = fmt(forestPg);

  if (window.activeDTimer) window.activeDTimer.textContent = fmtT(elapsed);
  
  dCO2.textContent     = fmt(co2page);
  dForest.textContent  = fmt(forestPg);
  dDeaths.textContent  = deathPg.toFixed(2);
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
}, {threshold:0.1}).observe(damageSection);

// ── SCROLL REVEAL ───────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting) e.target.classList.add('up')
  });
}, {threshold:0.1});

document.querySelectorAll('.r,.r-left').forEach(el => io.observe(el));

// ── CHARTS ────────────────────────────────────────
const gridC  = 'rgba(255,255,255,0.04)';
const tickC  = 'rgba(240,237,232,0.25)';
const ttBase = {
  backgroundColor:'#080808', titleColor:'#F0EDE8',
  bodyColor:'#666', borderColor:'#1a1a1a', borderWidth:1,
  padding:12,
  titleFont:{family:'Bebas Neue',size:18},
  bodyFont:{family:'Space Mono',size:10}
};
const axBase = {
  x:{grid:{color:gridC},ticks:{color:tickC,maxTicksLimit:7}},
  y:{grid:{color:gridC},ticks:{color:tickC}}
};
const base = (extra={}) => ({
  responsive:true, maintainAspectRatio:true, aspectRatio:1.75,
  plugins:{legend:{display:false},tooltip:ttBase},
  scales:axBase, ...extra
});

const makeGrad = (ctx, color, alpha=0.25) => {
  const g = ctx.chart.ctx.createLinearGradient(0,0,0,230);
  g.addColorStop(0, color.replace(')',`,${alpha})`).replace('rgb','rgba'));
  g.addColorStop(1, color.replace(')',`,0)`).replace('rgb','rgba'));
  return g;
};

// CO2
new Chart(document.getElementById('co2Chart'),{
  type:'line',
  data:{
    labels:['1960','1965','1970','1975','1980','1985','1990','1995','2000','2005','2010','2015','2020','2024'],
    datasets:[{
      data:[9.4,11.1,14.5,16.5,19.2,19.8,22.7,23.5,25.6,29.2,33.1,35.4,34.8,37.8],
      borderColor:'#FF1500',
      backgroundColor: ctx => { const g=ctx.chart.ctx.createLinearGradient(0,0,0,230);g.addColorStop(0,'rgba(255,21,0,0.3)');g.addColorStop(1,'rgba(255,21,0,0)');return g; },
      borderWidth:2.5, fill:true, tension:0.4,
      pointBackgroundColor:'#FF1500', pointRadius:3, pointHoverRadius:6,
    }]
  },
  options: base()
});

// Temp
new Chart(document.getElementById('tempChart'),{
  type:'line',
  data:{
    labels:['1880','1900','1920','1940','1960','1980','2000','2010','2015','2018','2020','2022','2024'],
    datasets:[{
      data:[-0.16,-0.08,-0.27,-0.02,0.03,0.26,0.42,0.72,0.87,0.83,0.98,1.11,1.35],
      borderColor:'#ffb300',
      backgroundColor: ctx => { const g=ctx.chart.ctx.createLinearGradient(0,0,0,230);g.addColorStop(0,'rgba(255,179,0,0.25)');g.addColorStop(1,'rgba(255,179,0,0)');return g; },
      borderWidth:2.5, fill:true, tension:0.4,
      pointBackgroundColor:'#ffb300', pointRadius:3, pointHoverRadius:6,
    }]
  },
  options: base()
});

// Wildlife
new Chart(document.getElementById('wildChart'),{
  type:'line',
  data:{
    labels:['1970','1975','1980','1985','1990','1995','2000','2005','2010','2015','2018','2020'],
    datasets:[{
      data:[100,92,85,79,72,65,58,51,45,38,32,27],
      borderColor:'#C8FF00',
      backgroundColor: ctx => { const g=ctx.chart.ctx.createLinearGradient(0,0,0,230);g.addColorStop(0,'rgba(200,255,0,0.18)');g.addColorStop(1,'rgba(200,255,0,0)');return g; },
      borderWidth:2.5, fill:true, tension:0.4,
      pointBackgroundColor:'#C8FF00', pointRadius:3, pointHoverRadius:6,
    }]
  },
  options: base()
});

// Sector donut
new Chart(document.getElementById('sectorChart'),{
  type:'doughnut',
  data:{
    labels:['Energy','Transport','Industry','Agriculture','Buildings','Waste','Other'],
    datasets:[{
      data:[30,13.7,12.7,11.7,6.6,3.4,21.9],
      backgroundColor:['#FF1500','#ffb300','#00C8FF','#22c55e','#a855f7','#f97316','#222'],
      borderColor:'#060606', borderWidth:3, hoverOffset:8,
    }]
  },
  options:{
    responsive:true, maintainAspectRatio:true, aspectRatio:1.6,
    plugins:{
      legend:{display:true,position:'right',labels:{color:'rgba(240,237,232,0.4)',font:{family:'Space Mono',size:9},boxWidth:10,padding:14}},
      tooltip:{...ttBase, callbacks:{label:c=>` ${c.parsed}%`}}
    }
  }
});