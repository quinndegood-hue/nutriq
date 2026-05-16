// =============================================
// DATA LAYER
// =============================================
const KEY = 'nutriq_v3';
const TODAY = new Date().toISOString().slice(0,10);

const FRESH = () => ({
  version: 3,
  foods: [],
  water: 0,
  cheat: false,
  mood: '',
  sleep: 0,
  workouts: [],
  goals: { cal: 2000, pro: 140, carb: 220, fat: 65 },
  supplements: [
    { name: 'Multivitamin', time: 'Morning', taken: false },
    { name: 'Protein shake', time: 'Post-workout', taken: false },
  ],
  grocery: [],
  weightLog: [],
  gutLog: [],
  mealPlan: { Mon:{b:'',l:'',d:''}, Tue:{b:'',l:'',d:''}, Wed:{b:'',l:'',d:''}, Thu:{b:'',l:'',d:''}, Fri:{b:'',l:'',d:''}, Sat:{b:'',l:'',d:''}, Sun:{b:'',l:'',d:''} },
  history: {},
  streak: 0,
  bestStreak: 0,
  lastLogged: '',
  profile: { name: '', age: 0, height: 0, weight: 0, sex: 'female', activity: 'moderate', goal: 'eat healthier' },
  body: { weight: 0, waist: 0, fat: 0, chest: 0, hips: 0, bicep: 0 },
  achievements: [
    { id:'first_log',  icon:'🌱', name:'First log',      done:false },
    { id:'streak3',    icon:'🔥', name:'3 day streak',   done:false },
    { id:'streak7',    icon:'⚡', name:'Week warrior',   done:false },
    { id:'streak30',   icon:'💎', name:'30 day streak',  done:false },
    { id:'protein',    icon:'💪', name:'Protein king',   done:false },
    { id:'water8',     icon:'💧', name:'Hydrated',       done:false },
    { id:'scan',       icon:'📷', name:'First scan',     done:false },
    { id:'barcode',    icon:'📊', name:'Barcode master', done:false },
    { id:'recipe',     icon:'👨‍🍳', name:'Chef mode',     done:false },
    { id:'coach',      icon:'🤖', name:'Coach talk',     done:false },
    { id:'fridge',     icon:'🧊', name:'Fridge scanner', done:false },
    { id:'voice',      icon:'🎙️', name:'Voice logger',   done:false },
    { id:'cheat',      icon:'🍕', name:'Cheat day',      done:false },
    { id:'gut',        icon:'🔬', name:'Gut detective',  done:false },
    { id:'social',     icon:'👥', name:'Social butterfly',done:false },
    { id:'family',     icon:'👨‍👩‍👧', name:'Family planner', done:false },
  ],
  fitData: null,
  theme: 'light',
  friends: [
    { name:'Alex M.', streak:12, cal:1850, avatar:'AM', color:'#3b82f6' },
    { name:'Jordan K.', streak:5,  cal:2100, avatar:'JK', color:'#8b5cf6' },
    { name:'Sam T.',    streak:9,  cal:1920, avatar:'ST', color:'#f97316' },
  ],
  familyMembers: [],
  onboarded: false,
  challenges: {},
  dietPrefs: [],
  savedMeals: [],
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return FRESH();
    const d = JSON.parse(raw);
    const f = FRESH();
    const merged = Object.assign({}, f, d);
    merged.goals   = Object.assign({}, f.goals,   d.goals   || {});
    merged.profile = Object.assign({}, f.profile, d.profile || {});
    merged.body    = Object.assign({}, f.body,    d.body    || {});
    merged.fitData = d.fitData || null;
    f.achievements.forEach(fa => {
      if (!merged.achievements.find(a => a.id === fa.id))
        merged.achievements.push({...fa});
    });
    return merged;
  } catch(e) { return FRESH(); }
}

let S = load();
let saveTimer = null;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
      const ind = document.getElementById('saved-ind');
      if (ind) { ind.style.opacity = '1'; clearTimeout(ind._t); ind._t = setTimeout(() => { ind.style.opacity = '0'; }, 1800); }
    } catch(e) {}
  }, 300);
}

function dailyReset() {
  if (S.lastLogged && S.lastLogged !== TODAY) {
    const totCal = S.foods.reduce((s,f) => s+f.cal, 0);
    const totPro = S.foods.reduce((s,f) => s+f.pro, 0);
    if (!S.history) S.history = {};
    if (totCal > 0) {
      S.history[S.lastLogged] = {
        cal: totCal, pro: totPro,
        carb: S.foods.reduce((s,f) => s+(f.carb||0), 0),
        fat:  S.foods.reduce((s,f) => s+(f.fat||0),  0),
        count: S.foods.length,
      };
    }
    const y = new Date(); y.setDate(y.getDate()-1);
    const yStr = y.toISOString().slice(0,10);
    if (S.lastLogged === yStr && totCal > 0) {
      S.streak = (S.streak||0) + 1;
    } else {
      S.streak = 0;
    }
    S.bestStreak = Math.max(S.bestStreak||0, S.streak);
    S.foods = []; S.water = 0; S.cheat = false;
    S.workouts = []; S.mood = ''; S.sleep = 0;
    S.supplements = S.supplements.map(s => ({...s, taken:false}));
  }
  S.lastLogged = TODAY;
  save();
}

dailyReset();

// =============================================
// ACHIEVEMENTS
// =============================================
function unlock(id) {
  const a = S.achievements.find(x => x.id === id);
  if (a && !a.done) {
    a.done = true; save();
    toast('🏆 Achievement: ' + a.name + '!', 3000);
    renderDashAch();
  }
}
function checkAch() {
  if (S.foods.length >= 1)     unlock('first_log');
  if (S.streak >= 3)           unlock('streak3');
  if (S.streak >= 7)           unlock('streak7');
  if (S.streak >= 30)          unlock('streak30');
  if (S.foods.reduce((s,f)=>s+f.pro,0) >= S.goals.pro) unlock('protein');
  if (S.water >= 8)            unlock('water8');
  if (S.familyMembers.length)  unlock('family');
}
function renderDashAch() {
  const el = document.getElementById('dash-ach');
  if (el) el.innerHTML = S.achievements.slice(0,8).map(a =>
    '<div class="ach' + (a.done?' done':'') + '"><span class="ach-icon">' + a.icon + '</span><div class="ach-name">' + a.name + '</div></div>'
  ).join('');
}

// =============================================
// NAVIGATION
// =============================================
function nav(page) { return document.querySelector('[data-page="'+page+'"]'); }

function go(el, page, title) {
  if (window.innerWidth <= 700) toggleSidebar(false);
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('pg-'+page);
  if (pg) pg.classList.add('active');
  if (el) el.classList.add('active');
  const pt = document.getElementById('page-title');
  if (pt) pt.textContent = title;
  const renders = {
    dashboard: renderDash, log: renderLog, progress: renderProgress,
    settings: renderSettingsPage, grocery: renderGrocery,
    restaurant: renderRestaurants, plan: renderPlan, social: renderSocial,
    report: renderReport, fitness: renderFitness,
  };
  if (renders[page]) renders[page]();
}

function toggleSidebar(force) {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('overlay');
  const open = force !== undefined ? force : !s.classList.contains('open');
  s.classList.toggle('open', open);
  o.classList.toggle('open', open);
}

function switchTab(t) {
  const tabs = ['stats','weight','body','photos','ach'];
  tabs.forEach(tab => {
    const el = document.getElementById('pt-'+tab);
    if (el) el.style.display = tab===t ? 'block' : 'none';
  });
  document.querySelectorAll('#pg-progress .tab').forEach((tab,i) => tab.classList.toggle('on', tabs[i]===t));
  if (t === 'weight') setTimeout(drawWeightChart, 50);
  if (t === 'ach') {
    const aa = document.getElementById('all-ach');
    if (aa) aa.innerHTML = S.achievements.map(a =>
      '<div class="ach'+(a.done?' done':'')+'"><span class="ach-icon">'+a.icon+'</span><div class="ach-name">'+a.name+'</div></div>'
    ).join('');
  }
}

function switchSettings(tab) {
  ['profile','goals','supps','diet','notifs','family','firebase'].forEach(t => {
    const el = document.getElementById('st-'+t);
    if (el) el.style.display = t===tab ? 'block' : 'none';
  });
  document.querySelectorAll('#pg-settings .tab').forEach(t => {
    t.classList.toggle('on', t.textContent.toLowerCase().includes(tab) || (tab==='family'&&t.textContent==='Family') || (tab==='firebase'&&t.textContent==='Firebase'));
  });
}

// =============================================
// TOAST / UTILS
// =============================================
function toast(msg, dur=2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), dur);
}

function selPill(el, group) {
  el.closest('.pills').querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
}

function weeklyData() {
  const days = [];
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    if (key === TODAY) days.push({ cal: S.foods.reduce((s,f)=>s+f.cal,0), pro: S.foods.reduce((s,f)=>s+f.pro,0) });
    else days.push(S.history && S.history[key] ? S.history[key] : {cal:0, pro:0});
  }
  return days;
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// =============================================
// ONBOARDING
// =============================================
function showOnboarding() {
  const modal = document.getElementById('onboard-modal');
  if (modal) modal.classList.add('show');
  onboardNext(1);
}
function closeOnboarding() {
  const modal = document.getElementById('onboard-modal');
  if (modal) modal.classList.remove('show');
  S.onboarded = true; save();
  updateSidebarUser();
}
function onboardNext(step) {
  document.querySelectorAll('.ob-step').forEach(s => s.style.display='none');
  const el = document.getElementById('ob-step-'+step);
  if (el) el.style.display='block';
}
function saveOnboardProfile() {
  const name = document.getElementById('ob-name').value.trim();
  const age  = parseInt(document.getElementById('ob-age').value)||0;
  if (!name) { toast('Please enter your name'); return; }
  S.profile.name = name;
  S.profile.age  = age;
  save();
  onboardNext(2);
}
function saveOnboardGoal(goal) {
  S.profile.goal = goal;
  const calMap = { 'lose weight': 1600, 'build muscle': 2400, 'eat healthier': 2000, 'maintain': 2000 };
  const proMap = { 'lose weight': 120, 'build muscle': 180, 'eat healthier': 120, 'maintain': 140 };
  S.goals.cal = calMap[goal] || 2000;
  S.goals.pro = proMap[goal] || 140;
  save();
  document.querySelectorAll('.ob-goal-btn').forEach(b => b.classList.remove('on'));
  const btn = document.querySelector('.ob-goal-btn[data-goal="'+goal+'"]');
  if (btn) btn.classList.add('on');
  onboardNext(3);
}
function finishOnboarding() {
  closeOnboarding();
  updateGoalInputs();
  renderDash();
  toast('Welcome to NutriQ, ' + (S.profile.name || 'friend') + '! 🎉');
}
function updateSidebarUser() {
  const n = S.profile.name || 'You';
  const el = document.getElementById('sidebar-name');
  if (el) el.textContent = n;
  const av = document.getElementById('sidebar-avatar');
  if (av) av.textContent = n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
}

// =============================================
// DASHBOARD
// =============================================
function renderDash() {
  const totCal = S.foods.reduce((s,f) => s+f.cal, 0);
  const totPro = S.foods.reduce((s,f) => s+f.pro, 0);
  const totCarb = S.foods.reduce((s,f) => s+(f.carb||0), 0);
  const totFat  = S.foods.reduce((s,f) => s+(f.fat||0),  0);
  const burned  = S.workouts.reduce((s,w) => s+w.burn, 0);
  const calGoal = S.cheat ? S.goals.cal+500 : S.goals.cal;
  const netCal  = totCal - burned;
  const remCal  = Math.max(0, calGoal - netCal);
  const calPct  = Math.min(100, Math.round(netCal/calGoal*100));

  // Streak
  const sd = document.getElementById('streak-disp');
  if (sd) sd.textContent = S.streak;

  // Hero ring
  const ringCirc = document.getElementById('cal-ring-fill');
  if (ringCirc) {
    const r = 52, circ = 2*Math.PI*r;
    ringCirc.style.strokeDashoffset = circ - (circ * calPct/100);
    ringCirc.style.stroke = calPct >= 100 ? '#ef4444' : calPct >= 80 ? '#f97316' : '#00e87a';
  }
  const setT = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  setT('d-cal', netCal);
  setT('d-cal-pct', calPct + '%');
  setT('d-cal-sub', remCal + ' remaining');
  setT('d-pro', totPro);
  setT('d-pro-goal', S.goals.pro);
  setT('d-water', S.water);
  setT('d-burned', burned);

  // Bars
  const setBar = (id, pct, color) => {
    const e = document.getElementById(id);
    if (e) { e.style.width = pct+'%'; if(color) e.style.background=color; }
  };
  setBar('d-cal-bar', calPct, calPct>=100?'var(--red)':calPct>=80?'var(--orange)':'var(--g)');
  setBar('d-pro-bar', Math.min(100,Math.round(totPro/S.goals.pro*100)));
  setBar('d-water-bar', Math.min(100,Math.round(S.water/8*100)));
  setBar('d-burn-bar', Math.min(100,Math.round(burned/600*100)));

  const wp = document.getElementById('water-pct');
  if (wp) wp.textContent = Math.round(S.water/8*100)+'%';

  // Macro mini bars
  const macroEl = document.getElementById('d-macros');
  if (macroEl) {
    macroEl.innerHTML =
      '<div class="macro-row"><span>Carbs</span><div class="macro-bar"><div style="width:'+Math.min(100,Math.round(totCarb/S.goals.carb*100))+'%;background:var(--yellow)"></div></div><span>'+totCarb+'g</span></div>' +
      '<div class="macro-row"><span>Fat</span><div class="macro-bar"><div style="width:'+Math.min(100,Math.round(totFat/S.goals.fat*100))+'%;background:var(--orange)"></div></div><span>'+totFat+'g</span></div>';
  }

  // Water cups
  let wHtml = '';
  for (let i=1; i<=8; i++)
    wHtml += '<div class="wcup'+(i<=S.water?' full':'')+'" onclick="setWater('+i+')" title="'+i+' cup'+(i>1?'s':'')+'"></div>';
  const wc = document.getElementById('water-cups');
  if (wc) wc.innerHTML = wHtml;

  // AI tip
  const tip = S.foods.length===0
    ? 'Log your first meal to get a personalized tip! Tap Scan Food or use the barcode scanner.'
    : totPro < S.goals.pro*0.4
    ? 'Protein is at '+totPro+'g — you need '+(S.goals.pro-totPro)+'g more. Add eggs, chicken, or Greek yogurt.'
    : remCal > 600
    ? 'You have '+remCal+' calories left. A balanced meal with lean protein and veggies would hit your targets.'
    : S.water < 4
    ? 'Only '+S.water+' cup'+(S.water!==1?'s':'')+' of water — try to reach 8. Hydration affects energy and metabolism.'
    : 'Great work! '+totPro+'g protein and '+netCal+' calories. You\'re '+Math.round(totPro/S.goals.pro*100)+'% to your protein goal!';
  const tipEl = document.getElementById('ai-tip-text');
  if (tipEl) tipEl.textContent = tip;

  // Smart suggestion
  const sc = document.getElementById('smart-card');
  if (sc) {
    if (S.foods.length > 0 && remCal > 300) {
      sc.style.display = 'block';
      const msgs = [
        (S.goals.pro-totPro)+'g protein left — Greek yogurt or cottage cheese closes the gap fast.',
        remCal+' cal remaining — a chicken and rice bowl hits both calorie and protein goals.',
        'Crushing it today! One more high-protein snack and you\'ll nail all your goals. 💪',
      ];
      const st = document.getElementById('smart-text');
      if (st) st.textContent = msgs[S.foods.length % msgs.length];
    } else {
      sc.style.display = 'none';
    }
  }

  // Food preview
  const fp = document.getElementById('dash-food');
  if (fp) {
    const colors = { Breakfast:'#eab308', Lunch:'#3b82f6', Dinner:'#8b5cf6', Snack:'#00e87a' };
    fp.innerHTML = S.foods.length === 0
      ? '<div class="empty"><div class="empty-icon">🥗</div><div class="empty-text">Nothing logged yet</div></div>'
      : S.foods.slice(-5).map(f =>
          '<div class="food-row"><div class="food-dot" style="background:'+( colors[f.meal]||'#00e87a')+'"></div>' +
          '<div class="food-name">'+esc(f.name)+'</div>' +
          '<div class="food-tag">'+esc(f.meal)+'</div>' +
          '<div class="food-cal">'+f.cal+' kcal</div></div>'
        ).join('');
  }

  // Supplements
  const ds = document.getElementById('dash-supps');
  if (ds) {
    ds.innerHTML = S.supplements.length === 0
      ? '<div style="font-size:13px;color:var(--text3);padding:8px 0">No supplements — add in Settings</div>'
      : S.supplements.map((s,i) =>
          '<div class="supp-item">' +
          '<div class="supp-dot'+(s.taken?' taken':'')+'" onclick="suppTake('+i+')">'+(s.taken?'✓':'')+'</div>' +
          '<div style="flex:1;font-size:13px;font-weight:500">'+esc(s.name)+'</div>' +
          '<div style="font-size:11px;color:var(--text3)">'+esc(s.time)+'</div></div>'
        ).join('');
  }

  // Hunger bars
  const hours = [7,9,11,13,15,17,19,21];
  const base  = [30,20,70,90,55,80,70,40];
  const hw = document.getElementById('hunger-wrap');
  if (hw) hw.innerHTML = hours.map((h,i) =>
    '<div class="h-slot">' +
    '<div class="h-bar-wrap"><div class="h-bar" style="height:'+Math.round(base[i]*0.46)+'px;background:'+(base[i]>70?'var(--orange)':base[i]>45?'var(--yellow)':'var(--g)')+'"></div></div>' +
    '<div class="h-time">'+(h>12?h-12+'p':h+'a')+'</div></div>'
  ).join('');

  // Daily challenges
  renderChallenges();

  // Achievements preview
  renderDashAch();

  // Mood restore
  if (S.mood) {
    const mo = document.querySelector('.mood-opt[data-mood="'+S.mood+'"]');
    if (mo) mo.classList.add('picked');
  }
  if (S.sleep) { const sl = document.getElementById('sleep-in'); if (sl) sl.value = S.sleep; }
}

function setWater(n) { S.water=n; save(); renderDash(); checkAch(); }
function pickMood(el, m) {
  document.querySelectorAll('.mood-opt').forEach(x => x.classList.remove('picked'));
  el.classList.add('picked'); S.mood=m; save();
}
function suppTake(i) { S.supplements[i].taken=!S.supplements[i].taken; save(); renderDash(); }

// =============================================
// DAILY CHALLENGES
// =============================================
const DAILY_CHALLENGES = [
  { id:'log3', icon:'🍽️', text:'Log 3 meals today',  check: () => ['Breakfast','Lunch','Dinner'].filter(m=>S.foods.some(f=>f.meal===m)).length >= 3 },
  { id:'pro',  icon:'💪', text:'Hit your protein goal', check: () => S.foods.reduce((s,f)=>s+f.pro,0) >= S.goals.pro },
  { id:'h2o',  icon:'💧', text:'Drink 8 cups of water', check: () => S.water >= 8 },
  { id:'scan', icon:'📷', text:'Scan a food barcode',   check: () => S.achievements.find(a=>a.id==='barcode')?.done },
];

function renderChallenges() {
  const el = document.getElementById('dash-challenges');
  if (!el) return;
  if (!S.challenges) S.challenges = {};
  const todayKey = TODAY;
  el.innerHTML = DAILY_CHALLENGES.map(c => {
    const done = c.check();
    return '<div class="challenge-row'+(done?' done':'')+'">' +
      '<span class="challenge-icon">'+c.icon+'</span>' +
      '<span class="challenge-text">'+c.text+'</span>' +
      (done ? '<span class="challenge-check">✓</span>' : '<span class="challenge-pend"></span>') +
      '</div>';
  }).join('');
}

// =============================================
// FAMILY PROFILES
// =============================================
function renderFamilySettings() {
  const el = document.getElementById('family-list');
  if (!el) return;
  if (!S.familyMembers || S.familyMembers.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">👨‍👩‍👧</div><div class="empty-text">No family members added yet</div></div>';
    return;
  }
  el.innerHTML = S.familyMembers.map((m,i) =>
    '<div class="family-member-row">' +
    '<div class="fam-avatar" style="background:'+m.color+'">'+esc(m.avatar)+'</div>' +
    '<div style="flex:1"><div style="font-size:13px;font-weight:600">'+esc(m.name)+'</div>' +
    '<div style="font-size:11px;color:var(--text3)">'+m.cal+' kcal goal · '+m.pro+'g protein</div></div>' +
    '<button class="btn sm danger" onclick="removeFamilyMember('+i+')">Remove</button></div>'
  ).join('');
}

function addFamilyMember() {
  const nameEl = document.getElementById('fam-name');
  const calEl  = document.getElementById('fam-cal');
  const proEl  = document.getElementById('fam-pro');
  const name = nameEl.value.trim();
  if (!name) { toast('Please enter a name'); return; }
  const colors = ['#3b82f6','#8b5cf6','#f97316','#ef4444'];
  const member = {
    id: Date.now(),
    name,
    avatar: name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
    cal: parseInt(calEl.value)||1800,
    pro: parseInt(proEl.value)||120,
    color: colors[S.familyMembers.length % colors.length],
    foods: [],
  };
  S.familyMembers.push(member);
  nameEl.value=''; calEl.value=''; proEl.value='';
  save(); renderFamilySettings(); unlock('family');
  toast('👨‍👩‍👧 '+name+' added to your family plan!');
}

function removeFamilyMember(i) {
  if (!confirm('Remove '+S.familyMembers[i].name+'?')) return;
  S.familyMembers.splice(i,1); save(); renderFamilySettings();
}

// =============================================
// FOOD MANAGEMENT
// =============================================
var _offProducts = [];
var pendingOFFProduct = null;

function addFood(food) {
  S.foods.push({ id: Date.now(), ...food });
  S.lastLogged = TODAY;
  if (S.streak === 0 && S.foods.length === 1) S.streak = 1;
  save(); checkAch(); renderDash(); renderLog();
}
function removeFood(id) { S.foods = S.foods.filter(f=>f.id!==id); save(); renderDash(); renderLog(); }
function editFood(id) {
  const f = S.foods.find(x=>x.id===id); if (!f) return;
  const nc = prompt('Edit calories (currently '+f.cal+'):', f.cal); if (nc===null) return;
  const np = prompt('Edit protein g (currently '+f.pro+'):', f.pro); if (np===null) return;
  f.cal = parseInt(nc)||f.cal; f.pro = parseInt(np)||f.pro;
  save(); renderLog(); renderDash(); toast('✅ Updated!');
}

function addManual() {
  const n = document.getElementById('mn').value.trim(); if (!n) { toast('Enter a food name'); return; }
  const cal  = parseInt(document.getElementById('mc').value)||0;
  const pro  = parseInt(document.getElementById('mp').value)||0;
  const carb = parseInt(document.getElementById('mcb').value)||0;
  const fat  = parseInt(document.getElementById('mf').value)||0;
  const meal = document.getElementById('mm').value;
  addFood({name:n, cal, pro, carb, fat, meal});
  ['mn','mc','mp','mcb','mf'].forEach(id => { const e=document.getElementById(id); if(e) e.value=''; });
  toast('✅ '+n+' added!');
}

// =============================================
// OPEN FOOD FACTS SEARCH
// =============================================
async function searchOFF(query, statusId, resultId) {
  statusId  = statusId  || 'scan-status';
  resultId  = resultId  || 'scan-result';
  const status = document.getElementById(statusId);
  const result = document.getElementById(resultId);
  if (!query || !status || !result) return;
  status.innerHTML = '<span class="spin"></span> Searching food database...';
  result.innerHTML = '';
  try {
    const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms='+encodeURIComponent(query)+'&search_simple=1&action=process&json=1&page_size=6&fields=product_name,nutriments,image_small_url,brands,code';
    const r = await fetch(url);
    const d = await r.json();
    _offProducts = (d.products||[]).filter(p => p.product_name && p.nutriments);
    if (_offProducts.length === 0) {
      const q2 = query.toLowerCase();
      const matches = COMMON_FOODS.filter(f => f.name.toLowerCase().includes(q2));
      if (matches.length > 0) {
        status.textContent = matches.length + ' matches from built-in foods:';
        result.innerHTML = matches.map((f,i) =>
          '<div class="scan-result-wrap" style="margin-bottom:8px;cursor:pointer" data-cfidx="'+i+'">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<div><div style="font-size:13px;font-weight:600;color:var(--text)">'+esc(f.name)+'</div>' +
          '<div style="font-size:11px;color:var(--text3);margin-top:3px">'+f.cal+' kcal · '+f.pro+'g protein · '+f.carb+'g carbs · '+f.fat+'g fat</div></div>' +
          '<div style="font-size:18px;font-weight:700;color:var(--g);flex-shrink:0">'+f.cal+'<span style="font-size:10px;color:var(--text3)"> kcal</span></div>' +
          '</div></div>'
        ).join('');
        result.onclick = e => {
          const card = e.target.closest('[data-cfidx]');
          if (card) pickCommonFood(matches[parseInt(card.dataset.cfidx)], statusId, resultId);
        };
      } else {
        status.textContent = 'No results — try a different name or use manual entry.';
      }
      return;
    }
    status.textContent = _offProducts.length+' foods found — pick one:';
    result.innerHTML = _offProducts.map((p,i) => {
      const n = p.nutriments;
      const cal  = Math.round(n['energy-kcal_100g']||n['energy-kcal']||(n['energy_100g']||0)/4.184)||0;
      const pro  = Math.round(n.proteins_100g||0);
      const carb = Math.round(n.carbohydrates_100g||0);
      const fat  = Math.round(n.fat_100g||0);
      const img  = p.image_small_url
        ? '<img src="'+p.image_small_url+'" style="width:50px;height:50px;object-fit:cover;border-radius:8px">'
        : '<div style="width:50px;height:50px;background:var(--surface3);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px">🍽️</div>';
      return '<div class="scan-result-wrap" style="margin-bottom:10px;cursor:pointer" onclick="pickOFF('+i+',\''+statusId+'\',\''+resultId+'\')">' +
        '<div style="display:flex;align-items:center;gap:12px">'+img+
        '<div style="flex:1;min-width:0">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(p.product_name+(p.brands?' ('+p.brands.split(',')[0]+')':''))+'</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:3px">per 100g: '+cal+' kcal, '+pro+'g protein, '+carb+'g carbs, '+fat+'g fat</div>' +
        '</div><div style="font-size:18px;font-weight:700;color:var(--g);flex-shrink:0">'+cal+'<span style="font-size:10px;color:var(--text3)"> kcal</span></div>' +
        '</div></div>';
    }).join('');
    unlock('scan');
  } catch(e) {
    status.textContent = 'Search failed — check connection or use manual entry.';
  }
}

function pickOFF(i, statusId, resultId) {
  statusId = statusId || 'scan-status';
  resultId = resultId || 'scan-result';
  const p = _offProducts[i]; if (!p) return;
  const n = p.nutriments;
  const cal  = Math.round(n['energy-kcal_100g']||n['energy-kcal']||(n['energy_100g']||0)/4.184)||0;
  const pro  = Math.round(n.proteins_100g||0);
  const carb = Math.round(n.carbohydrates_100g||0);
  const fat  = Math.round(n.fat_100g||0);
  const name = p.product_name+(p.brands?' ('+p.brands.split(',')[0]+')':'');
  pendingOFFProduct = { name, cal, pro, carb, fat, statusId, resultId };
  document.getElementById(statusId).textContent = '';
  document.getElementById(resultId).innerHTML =
    '<div class="scan-result-wrap">' +
    '<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">'+esc(name)+'</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:10px">Adjust for your portion size (values shown are per 100g)</div>' +
    '<div class="g4" style="margin-bottom:12px">' +
    '<div class="editable-tile"><div class="tile-label">Calories</div><input type="number" id="e-cal" value="'+cal+'" min="0"></div>' +
    '<div class="editable-tile"><div class="tile-label">Protein g</div><input type="number" id="e-pro" value="'+pro+'" min="0"></div>' +
    '<div class="editable-tile"><div class="tile-label">Carbs g</div><input type="number" id="e-carb" value="'+carb+'" min="0"></div>' +
    '<div class="editable-tile"><div class="tile-label">Fat g</div><input type="number" id="e-fat" value="'+fat+'" min="0"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    '<select id="e-meal" style="width:auto;padding:8px 10px;font-size:12px"><option>Breakfast</option><option selected>Lunch</option><option>Dinner</option><option>Snack</option></select>' +
    '<button class="btn g" onclick="addScannedPending()">+ Add to log</button>' +
    '<button class="btn ghost" onclick="searchOFF(\'\',\''+statusId+'\',\''+resultId+'\');document.getElementById(\''+resultId+'\').innerHTML=\'\';document.getElementById(\''+statusId+'\').textContent=\'\'">← Back</button>' +
    '</div></div>';
}

function pickCommonFood(f, statusId, resultId) {
  pendingOFFProduct = { name: f.name, cal: f.cal, pro: f.pro, carb: f.carb, fat: f.fat, statusId, resultId };
  document.getElementById(statusId).textContent = '';
  document.getElementById(resultId).innerHTML =
    '<div class="scan-result-wrap">' +
    '<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">'+esc(f.name)+'</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:10px">Adjust for your portion size</div>' +
    '<div class="g4" style="margin-bottom:12px">' +
    '<div class="editable-tile"><div class="tile-label">Calories</div><input type="number" id="e-cal" value="'+f.cal+'" min="0"></div>' +
    '<div class="editable-tile"><div class="tile-label">Protein g</div><input type="number" id="e-pro" value="'+f.pro+'" min="0"></div>' +
    '<div class="editable-tile"><div class="tile-label">Carbs g</div><input type="number" id="e-carb" value="'+f.carb+'" min="0"></div>' +
    '<div class="editable-tile"><div class="tile-label">Fat g</div><input type="number" id="e-fat" value="'+f.fat+'" min="0"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    '<select id="e-meal" style="width:auto;padding:8px 10px;font-size:12px"><option>Breakfast</option><option selected>Lunch</option><option>Dinner</option><option>Snack</option></select>' +
    '<button class="btn g" onclick="addScannedPending()">+ Add to log</button>' +
    '</div></div>';
}

function addScannedPending() {
  if (!pendingOFFProduct) return;
  const cal  = parseInt(document.getElementById('e-cal').value) || pendingOFFProduct.cal;
  const pro  = parseInt(document.getElementById('e-pro').value) || pendingOFFProduct.pro;
  const carb = parseInt(document.getElementById('e-carb').value)|| pendingOFFProduct.carb;
  const fat  = parseInt(document.getElementById('e-fat').value) || pendingOFFProduct.fat;
  const meal = document.getElementById('e-meal').value;
  addFood({ name: pendingOFFProduct.name, cal, pro, carb, fat, meal });
  toast('Added '+pendingOFFProduct.name+'!');
  pendingOFFProduct = null;
  const sr = document.getElementById(pendingOFFProduct?.resultId||'scan-result');
  const ss = document.getElementById(pendingOFFProduct?.statusId||'scan-status');
  document.getElementById('scan-result').innerHTML = '';
  document.getElementById('scan-status').textContent = '';
  const prev = document.getElementById('scan-preview');
  if (prev) prev.style.display='none';
  go(nav('log'), 'log', 'My Log');
}

function doScan(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('scan-preview');
    if (prev) { prev.src = e.target.result; prev.style.display='block'; }
    document.getElementById('scan-status').textContent = '';
    document.getElementById('scan-result').innerHTML =
      '<div class="scan-result-wrap">' +
      '<div style="font-size:13px;font-weight:600;margin-bottom:8px">Photo taken! Search for this food:</div>' +
      '<div class="input-row">' +
      '<input type="text" id="photo-food-name" placeholder="e.g. Greek yogurt, chicken breast...">' +
      '<button class="btn g" onclick="searchOFF(document.getElementById(\'photo-food-name\').value)" style="flex:none">Search</button>' +
      '</div></div>';
    setTimeout(() => { const el=document.getElementById('photo-food-name'); if(el) el.focus(); }, 100);
  };
  reader.readAsDataURL(file); input.value='';
}

// =============================================
// BARCODE SCANNER
// =============================================
let barcodeReader = null;
let barcodeActive = false;
let barcodeStream = null;
let barcodeAnimFrame = null;

async function startBarcodeScanner() {
  if (barcodeActive) return;
  const container = document.getElementById('barcode-scanner-wrap');
  const statusEl  = document.getElementById('barcode-status');
  if (!container) return;

  container.style.display = 'block';
  statusEl.innerHTML = '<span class="spin"></span> Starting camera...';
  barcodeActive = true;
  document.getElementById('barcode-start-btn').style.display = 'none';
  document.getElementById('barcode-stop-btn').style.display  = 'inline-flex';

  try {
    // Request camera (prefer back camera on phones)
    barcodeStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('barcode-video');
    video.srcObject = barcodeStream;
    video.style.display = 'block';
    await video.play();

    // Use native BarcodeDetector if available (Chrome 83+, Edge)
    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf','qr_code'] });
      statusEl.textContent = '📊 Point camera at a barcode on any food package';
      const scan = async () => {
        if (!barcodeActive) return;
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            stopBarcodeScanner();
            statusEl.innerHTML = '<span class="spin"></span> Found '+code+' — looking up...';
            await lookupBarcode(code);
            unlock('barcode');
            return;
          }
        } catch(e) {}
        barcodeAnimFrame = requestAnimationFrame(scan);
      };
      barcodeAnimFrame = requestAnimationFrame(scan);

    // Fallback: try ZXing from CDN
    } else {
      statusEl.innerHTML = '<span class="spin"></span> Loading scanner library...';
      const ZXing = await new Promise((res, rej) => {
        if (window.ZXingBrowser || window.ZXing) { res(window.ZXingBrowser || window.ZXing); return; }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/umd/index.min.js';
        s.onload = () => res(window.ZXing || window.ZXingBrowser);
        s.onerror = rej;
        document.head.appendChild(s);
      });
      if (!ZXing) throw new Error('no library');
      barcodeReader = new ZXing.BrowserMultiFormatReader();
      statusEl.textContent = '📊 Point camera at a barcode on any food package';
      barcodeReader.decodeFromStream(barcodeStream, document.getElementById('barcode-video'), async (result) => {
        if (result && barcodeActive) {
          const code = result.getText();
          stopBarcodeScanner();
          statusEl.innerHTML = '<span class="spin"></span> Found '+code+' — looking up...';
          await lookupBarcode(code);
          unlock('barcode');
        }
      });
    }
  } catch(e) {
    stopBarcodeScanner();
    statusEl.textContent = e && e.name === 'NotAllowedError'
      ? 'Camera permission denied — please allow camera access and try again.'
      : 'Camera not available. Use the Photo/Search tab to search foods manually.';
  }
}

function stopBarcodeScanner() {
  barcodeActive = false;
  if (barcodeAnimFrame) { cancelAnimationFrame(barcodeAnimFrame); barcodeAnimFrame = null; }
  if (barcodeReader) { try { barcodeReader.reset(); } catch(e) {} barcodeReader = null; }
  if (barcodeStream) { barcodeStream.getTracks().forEach(t => t.stop()); barcodeStream = null; }
  const vid = document.getElementById('barcode-video');
  if (vid) { vid.srcObject = null; vid.style.display = 'none'; }
  document.getElementById('barcode-start-btn').style.display = 'inline-flex';
  document.getElementById('barcode-stop-btn').style.display  = 'none';
}

async function lookupBarcode(code) {
  const statusEl = document.getElementById('barcode-status');
  const resultEl = document.getElementById('barcode-result');
  if (!resultEl) return;
  try {
    const r = await fetch('https://world.openfoodfacts.org/api/v0/product/'+encodeURIComponent(code)+'.json');
    const d = await r.json();
    if (d.status === 1 && d.product) {
      const p = d.product;
      const n = p.nutriments || {};
      const cal  = Math.round(n['energy-kcal_100g']||n['energy-kcal']||(n['energy_100g']||0)/4.184)||0;
      const pro  = Math.round(n.proteins_100g||0);
      const carb = Math.round(n.carbohydrates_100g||0);
      const fat  = Math.round(n.fat_100g||0);
      const name = p.product_name||(p.brands||'Unknown product');
      const img  = p.image_front_small_url||p.image_small_url||'';
      statusEl.textContent = '✅ Product found!';
      pendingOFFProduct = { name, cal, pro, carb, fat, statusId:'barcode-status', resultId:'barcode-result' };
      resultEl.innerHTML =
        '<div class="scan-result-wrap" style="margin-top:12px">' +
        (img ? '<img src="'+img+'" style="width:80px;height:80px;object-fit:contain;border-radius:8px;margin-bottom:12px">' : '') +
        '<div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px">'+esc(name)+'</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
        '<span class="badge g">'+cal+' kcal</span><span class="badge blue">'+pro+'g protein</span>' +
        '<span class="badge yellow">'+carb+'g carbs</span><span class="badge orange">'+fat+'g fat</span>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-bottom:12px">Values per 100g — adjust portion if needed</div>' +
        '<div class="g4" style="margin-bottom:12px">' +
        '<div class="editable-tile"><div class="tile-label">Calories</div><input type="number" id="bc-cal" value="'+cal+'" min="0"></div>' +
        '<div class="editable-tile"><div class="tile-label">Protein g</div><input type="number" id="bc-pro" value="'+pro+'" min="0"></div>' +
        '<div class="editable-tile"><div class="tile-label">Carbs g</div><input type="number" id="bc-carb" value="'+carb+'" min="0"></div>' +
        '<div class="editable-tile"><div class="tile-label">Fat g</div><input type="number" id="bc-fat" value="'+fat+'" min="0"></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<select id="bc-meal" style="width:auto;padding:8px 10px;font-size:12px"><option>Breakfast</option><option selected>Lunch</option><option>Dinner</option><option>Snack</option></select>' +
        '<button class="btn g" onclick="addBarcodeProduct(\''+esc(name)+'\','+cal+','+pro+','+carb+','+fat+')">+ Add to log</button>' +
        '<button class="btn ghost" onclick="startBarcodeScanner()">Scan another</button>' +
        '</div></div>';
    } else {
      statusEl.textContent = 'Product not found in database. Try scanning again or search by name.';
      resultEl.innerHTML = '<div class="btn-row"><button class="btn g" onclick="startBarcodeScanner()">Try again</button></div>';
    }
  } catch(e) {
    statusEl.textContent = 'Lookup failed — check your connection.';
    resultEl.innerHTML = '<div class="btn-row"><button class="btn g" onclick="startBarcodeScanner()">Try again</button></div>';
  }
}

function addBarcodeProduct(name, defCal, defPro, defCarb, defFat) {
  const cal  = parseInt(document.getElementById('bc-cal').value)  || defCal;
  const pro  = parseInt(document.getElementById('bc-pro').value)  || defPro;
  const carb = parseInt(document.getElementById('bc-carb').value) || defCarb;
  const fat  = parseInt(document.getElementById('bc-fat').value)  || defFat;
  const meal = document.getElementById('bc-meal').value;
  addFood({ name, cal, pro, carb, fat, meal });
  toast('✅ '+name+' added!');
  document.getElementById('barcode-result').innerHTML = '';
  document.getElementById('barcode-status').textContent = 'Ready to scan again';
  go(nav('log'), 'log', 'My Log');
}

// =============================================
// VOICE LOG
// =============================================
let recognition = null, listening = false;

function toggleVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('voice-status').textContent = 'Voice works best in Chrome. Use the text box below!';
    return;
  }
  if (listening) { recognition.stop(); return; }
  // reset previous result before starting a new session
  document.getElementById('voice-result').innerHTML = '';
  document.getElementById('voice-transcript').textContent = '';
  document.getElementById('voice-transcript').style.display = 'none';
  document.getElementById('voice-status').textContent = 'Tap to start speaking';
  recognition = new SR();
  recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-US';
  recognition.onstart = () => {
    listening = true;
    document.getElementById('voice-btn').classList.add('active');
    document.getElementById('voice-status').textContent = 'Listening... speak now 🎙️';
    document.getElementById('voice-transcript').style.display = 'block';
  };
  recognition.onresult = e => {
    const t = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('voice-transcript').textContent = t;
  };
  recognition.onend = () => {
    listening = false;
    document.getElementById('voice-btn').classList.remove('active');
    const t = document.getElementById('voice-transcript').textContent;
    if (t) { document.getElementById('voice-status').textContent = 'Processing...'; parseVoiceText(t); }
    else document.getElementById('voice-status').textContent = 'Tap to start speaking';
  };
  recognition.onerror = () => {
    listening = false;
    document.getElementById('voice-btn').classList.remove('active');
    document.getElementById('voice-status').textContent = 'Could not hear. Try again or use the text box.';
  };
  recognition.start(); unlock('voice');
}

function parseVoiceText(text) {
  text = text || document.getElementById('voice-text-in').value.trim();
  if (!text) return;
  document.getElementById('voice-status').textContent = 'Got it! Search for what you said:';
  document.getElementById('voice-result').innerHTML =
    '<div class="card" style="margin-top:10px">' +
    '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;line-height:1.5">You said: <em style="color:var(--text)">"' + esc(text) + '"</em><br>Search each food to add it:</div>' +
    '<div class="input-row">' +
    '<input type="text" id="voice-search-in" placeholder="Type a food from your meal..." value="' + esc(text) + '">' +
    '<button class="btn g" style="flex:none" onclick="searchOFF(document.getElementById(\'voice-search-in\').value,\'voice-search-status\',\'voice-search-result\')">Search</button>' +
    '</div>' +
    '<div id="voice-search-status" style="margin-top:8px;font-size:13px;color:var(--text3)"></div>' +
    '<div id="voice-search-result" style="margin-top:4px"></div>' +
    '</div>';
  unlock('voice');
}

// =============================================
// FRIDGE SCANNER
// =============================================
function doFridge(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('fridge-preview');
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    document.getElementById('fridge-status').textContent = '';
    document.getElementById('fridge-result').innerHTML =
      '<div style="margin-top:14px">' +
      '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px">What can you see in your fridge?</div>' +
      '<textarea id="fridge-ings-input" placeholder="e.g. chicken breast, eggs, broccoli, cheese, milk, rice..." style="margin-bottom:10px;min-height:80px"></textarea>' +
      '<div class="btn-row"><button class="btn g" onclick="processFridgeIngredients()">🔍 Find meals I can make</button></div>' +
      '<div id="fridge-meal-results" style="margin-top:14px"></div>' +
      '</div>';
    unlock('fridge');
  };
  reader.readAsDataURL(file); input.value = '';
}

function processFridgeIngredients() {
  const ings = document.getElementById('fridge-ings-input').value.trim();
  if (!ings) { toast('List some ingredients first'); return; }
  const ingList = ings.split(',').map(i => i.trim()).filter(Boolean);
  document.getElementById('rec-ings').value = ings;
  const MEAL_SUGGESTIONS = [
    { name:'Chicken & Rice Bowl',    needs:['chicken','rice'],         cal:520, pro:45, carb:48, fat:12, desc:'Grilled chicken over fluffy rice with steamed veggies' },
    { name:'Veggie Omelette',        needs:['egg'],                    cal:280, pro:22, carb:6,  fat:18, desc:'Fluffy eggs with whatever veg you have on hand' },
    { name:'Stir Fry',               needs:['rice','broccoli'],        cal:420, pro:28, carb:52, fat:10, desc:'Quick high-protein stir fry over rice' },
    { name:'Protein Scramble',       needs:['egg','cheese'],           cal:340, pro:28, carb:4,  fat:22, desc:'Cheesy scrambled eggs loaded with protein' },
    { name:'Rice & Beans',           needs:['rice'],                   cal:380, pro:14, carb:68, fat:4,  desc:'Simple filling meal with complete protein' },
    { name:'Grilled Chicken Salad',  needs:['chicken'],                cal:310, pro:38, carb:12, fat:12, desc:'Light high-protein salad' },
    { name:'Pasta with Protein',     needs:['pasta','cheese'],         cal:580, pro:32, carb:72, fat:16, desc:'Comfort food that still hits your macros' },
    { name:'Smoothie Bowl',          needs:['milk'],                   cal:290, pro:18, carb:38, fat:6,  desc:'Quick nutritious breakfast or snack' },
    { name:'Turkey & Avocado Wrap',  needs:['turkey','avocado','wrap'],cal:420, pro:34, carb:36, fat:16, desc:'Easy high-protein wrap ready in 5 minutes' },
    { name:'Sweet Potato Power Bowl',needs:['sweet potato'],           cal:460, pro:20, carb:72, fat:10, desc:'Energizing bowl packed with vitamins' },
  ];
  const lc = ings.toLowerCase();
  const matches = MEAL_SUGGESTIONS.filter(m => m.needs.some(n => lc.includes(n)));
  const toShow = matches.length > 0 ? matches : MEAL_SUGGESTIONS.slice(0,3);
  const ingGrid = ingList.map(ing =>
    '<div class="fridge-item"><span class="fridge-emoji">🥗</span>' + esc(ing) + '</div>'
  ).join('');
  document.getElementById('fridge-meal-results').innerHTML =
    '<div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">Your ingredients (' + ingList.length + ')</div>' +
    '<div class="fridge-item-grid" style="margin-bottom:16px">' + ingGrid + '</div>' +
    '<div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">Meals you can make right now</div>' +
    toShow.map(m =>
      '<div class="card" style="margin-bottom:10px;padding:14px">' +
      '<div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:4px">' + esc(m.name) + '</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:8px">' + esc(m.desc) + '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px"><span class="badge g">' + m.cal + ' kcal</span><span class="badge blue">' + m.pro + 'g protein</span><span class="badge yellow">' + m.carb + 'g carbs</span></div>' +
      '<div class="btn-row">' +
      '<button class="btn g sm" onclick="addFridgeMeal(\'' + esc(m.name) + '\',' + m.cal + ',' + m.pro + ',' + m.carb + ',' + m.fat + ')">+ Add to dinner</button>' +
      '<button class="btn sm ghost" onclick="loadRecipeIngredients(\'' + esc(ings.replace(/'/g,"\\'")) + '\')">Build recipe →</button>' +
      '</div></div>'
    ).join('');
}

function addFridgeMeal(name, cal, pro, carb, fat) {
  addFood({ name, cal, pro, carb, fat, meal:'Dinner' });
  toast(name + ' added to dinner!');
  go(nav('log'), 'log', 'My Log');
}
function loadRecipeIngredients(ings) {
  document.getElementById('rec-ings').value = ings;
  go(nav('recipe'), 'recipe', 'Recipe Builder');
  toast('Ingredients loaded into recipe builder!');
}

// =============================================
// LOG PAGE
// =============================================
function renderLog() {
  const meals  = ['Breakfast','Lunch','Dinner','Snack'];
  const colors = { Breakfast:'#eab308', Lunch:'#3b82f6', Dinner:'#8b5cf6', Snack:'#00e87a' };
  let totC=0, totP=0, totCb=0, totF=0;
  meals.forEach(meal => {
    const el = document.getElementById('meal-'+meal); if (!el) return;
    const items = S.foods.filter(f => f.meal === meal);
    if (items.length === 0) {
      el.innerHTML = '<div class="empty" style="padding:10px"><div class="empty-text">Nothing logged</div></div>';
      return;
    }
    el.innerHTML = items.map(f =>
      '<div class="food-row">' +
      '<div class="food-dot" style="background:' + colors[meal] + '"></div>' +
      '<div class="food-name">' + esc(f.name) + '</div>' +
      '<div class="food-cal">' + f.cal + ' kcal</div>' +
      '<div class="food-pro">' + f.pro + 'g pro</div>' +
      '<button class="row-btn" onclick="editFood(' + f.id + ')" title="Edit">✏️</button>' +
      '<button class="row-btn del" onclick="removeFood(' + f.id + ')" title="Remove">×</button>' +
      '</div>'
    ).join('');
    totC  += items.reduce((s,f) => s+f.cal, 0);
    totP  += items.reduce((s,f) => s+f.pro, 0);
    totCb += items.reduce((s,f) => s+(f.carb||0), 0);
    totF  += items.reduce((s,f) => s+(f.fat||0),  0);
  });
  const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  set('log-cal',totC); set('log-pro',totP); set('log-carb',totCb); set('log-fat',totF);
  renderSavedMeals();
  const wl = document.getElementById('workout-list');
  if (wl) wl.innerHTML = S.workouts.length === 0
    ? '<div style="font-size:13px;color:var(--text3);padding:8px 0">No workouts logged yet</div>'
    : S.workouts.map((w,i) =>
        '<div class="food-row">' +
        '<div style="font-size:16px">🏋️</div>' +
        '<div class="food-name">' + esc(w.name) + '</div>' +
        '<span class="badge orange">-' + w.burn + ' kcal</span>' +
        '<button class="row-btn del" onclick="rmWorkout(' + i + ')">×</button>' +
        '</div>'
      ).join('');
  const cb = document.getElementById('cheat-banner');
  if (cb) cb.style.display = S.cheat ? 'block' : 'none';
  const cbtn = document.getElementById('cheat-btn');
  if (cbtn) cbtn.textContent = S.cheat ? 'Deactivate cheat day' : 'Activate cheat day';
}

function addWorkout() {
  const n = document.getElementById('wo-n').value.trim();
  const b = parseInt(document.getElementById('wo-b').value)||0;
  if (!n) return;
  S.workouts.push({ name:n, burn:b });
  document.getElementById('wo-n').value = '';
  document.getElementById('wo-b').value = '';
  save(); renderLog(); renderDash(); toast('💪 Workout logged!');
}
function rmWorkout(i)   { S.workouts.splice(i,1); save(); renderLog(); renderDash(); }
function clearLog()     { if(!confirm('Clear all food & workouts for today?')) return; S.foods=[]; S.workouts=[]; save(); renderDash(); renderLog(); }
function toggleCheat()  {
  S.cheat = !S.cheat;
  if (S.cheat) unlock('cheat');
  save(); renderDash(); renderLog();
  toast(S.cheat ? '🍕 Cheat day activated! +500 cal' : 'Cheat day deactivated.');
}

// =============================================
// MEAL PLAN
// =============================================
function renderPlan() {
  const days = Object.keys(S.mealPlan);
  const rows = document.getElementById('plan-rows');
  if (!rows) return;
  rows.innerHTML = days.map(day =>
    '<div class="plan-grid">' +
    '<div class="plan-day">' + day + '</div>' +
    '<div><input type="text" placeholder="Breakfast" value="' + esc(S.mealPlan[day].b) + '" oninput="S.mealPlan[\'' + day + '\'].b=this.value;save()"></div>' +
    '<div><input type="text" placeholder="Lunch"     value="' + esc(S.mealPlan[day].l) + '" oninput="S.mealPlan[\'' + day + '\'].l=this.value;save()"></div>' +
    '<div><input type="text" placeholder="Dinner"    value="' + esc(S.mealPlan[day].d) + '" oninput="S.mealPlan[\'' + day + '\'].d=this.value;save()"></div>' +
    '</div>'
  ).join('');

  // Family member tabs if any
  renderFamilyPlanTabs();
}

function renderFamilyPlanTabs() {
  const el = document.getElementById('family-plan-section');
  if (!el) return;
  if (!S.familyMembers || S.familyMembers.length === 0) { el.style.display='none'; return; }
  el.style.display = 'block';
  el.innerHTML =
    '<div class="card" style="margin-top:4px">' +
    '<div class="card-hd"><div class="card-title">👨‍👩‍👧 Family calorie summary</div></div>' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">Daily calorie goals for each family member — used to scale the grocery list.</div>' +
    S.familyMembers.map(m =>
      '<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)">' +
      '<div class="fam-avatar" style="background:'+m.color+';width:30px;height:30px;font-size:12px">'+esc(m.avatar)+'</div>' +
      '<div style="flex:1;font-size:13px;font-weight:500">'+esc(m.name)+'</div>' +
      '<div class="badge g">'+m.cal+' kcal</div>' +
      '<div class="badge blue">'+m.pro+'g pro</div>' +
      '</div>'
    ).join('') +
    '</div>';
}

function genGrocery() {
  const items = [];
  Object.values(S.mealPlan).forEach(day => {
    Object.values(day).forEach(m => {
      if (m.trim()) m.split(',').forEach(x => { const t=x.trim(); if(t&&!items.includes(t)) items.push(t); });
    });
  });
  const defaults = ['Chicken breast','Brown rice','Broccoli','Greek yogurt','Eggs','Olive oil','Spinach','Oats','Sweet potato','Almonds','Milk','Whole wheat bread'];
  (items.length > 0 ? items : defaults).forEach(name => {
    if (!S.grocery.find(g => g.name === name)) S.grocery.push({ name, done:false });
  });
  save(); go(nav('grocery'),'grocery','Grocery List'); toast('🛒 Grocery list generated!');
}

// =============================================
// RECIPE BUILDER
// =============================================
const RECIPES = [
  { name:'High Protein Chicken Bowl', goal:'muscle', tags:['chicken','protein'], cal:580, pro:52, carb:48, fat:14,
    steps:'1. Season chicken breast with salt, pepper, garlic powder.\n2. Cook in a pan with olive oil for 6-7 min each side.\n3. Cook 1 cup brown rice per package directions.\n4. Steam broccoli for 5 minutes.\n5. Slice chicken and serve over rice with broccoli.\n6. Drizzle with soy sauce or hot sauce.\n\nNutrition per serving: 580 kcal · 52g protein · 48g carbs · 14g fat' },
  { name:'Egg & Veggie Omelette', goal:'any', tags:['egg','breakfast'], cal:320, pro:24, carb:8, fat:20,
    steps:'1. Whisk 3 large eggs with salt and pepper.\n2. Heat a non-stick pan over medium heat with butter.\n3. Pour in eggs, let set for 30 seconds.\n4. Add diced vegetables and cheese on one half.\n5. Fold and cook 1 more minute.\n6. Serve immediately.\n\nNutrition: 320 kcal · 24g protein · 8g carbs · 20g fat' },
  { name:'Greek Yogurt Parfait', goal:'any', tags:['yogurt','breakfast','snack'], cal:280, pro:22, carb:34, fat:4,
    steps:'1. Layer 1 cup Greek yogurt in a bowl.\n2. Add 1/2 cup mixed berries or sliced banana.\n3. Top with 2 tbsp granola.\n4. Drizzle with honey if desired.\n\nNutrition: 280 kcal · 22g protein · 34g carbs · 4g fat' },
  { name:'Tuna Pasta Salad', goal:'any', tags:['tuna','pasta'], cal:490, pro:38, carb:52, fat:12,
    steps:'1. Cook 2 cups pasta, drain and cool.\n2. Drain 2 cans tuna, flake with a fork.\n3. Mix pasta, tuna, 2 tbsp mayo, diced celery, red onion.\n4. Season with salt, pepper, lemon juice.\n5. Refrigerate 30 min before serving.\n\nNutrition: 490 kcal · 38g protein · 52g carbs · 12g fat' },
  { name:'Protein Stir Fry', goal:'muscle', tags:['rice','broccoli','stir','protein'], cal:520, pro:42, carb:54, fat:14,
    steps:'1. Cook rice and set aside.\n2. Heat oil in a wok over high heat.\n3. Add diced chicken, cook 5-6 min.\n4. Add broccoli, peppers, and other veg.\n5. Add soy sauce, sesame oil, garlic.\n6. Toss and serve over rice.\n\nNutrition: 520 kcal · 42g protein · 54g carbs · 14g fat' },
  { name:'Overnight Oats', goal:'any', tags:['oat','breakfast'], cal:380, pro:16, carb:58, fat:9,
    steps:'1. Combine 1/2 cup oats and 1/2 cup milk in a jar.\n2. Add 1/2 cup Greek yogurt, 1 tbsp chia seeds.\n3. Sweeten with honey or maple syrup.\n4. Top with fruit.\n5. Cover and refrigerate overnight.\n\nNutrition: 380 kcal · 16g protein · 58g carbs · 9g fat' },
  { name:'Baked Salmon & Veg', goal:'any', tags:['salmon','fish'], cal:440, pro:40, carb:18, fat:22,
    steps:'1. Preheat oven to 400°F.\n2. Place salmon on a baking sheet.\n3. Season with olive oil, lemon, salt, pepper, dill.\n4. Add asparagus or broccoli alongside.\n5. Bake 12-15 minutes until salmon flakes.\n\nNutrition: 440 kcal · 40g protein · 18g carbs · 22g fat' },
  { name:'Black Bean Burrito Bowl', goal:'any', tags:['bean','rice','vegetarian','vegan'], cal:460, pro:18, carb:72, fat:10,
    steps:'1. Cook rice; warm black beans separately.\n2. Layer rice in a bowl, top with beans.\n3. Add salsa, diced avocado, shredded cheese.\n4. Top with lime juice, cilantro, sour cream.\n\nNutrition: 460 kcal · 18g protein · 72g carbs · 10g fat' },
  { name:'Turkey & Veggie Sheet Pan', goal:'any', tags:['turkey','sweet potato'], cal:430, pro:36, carb:40, fat:12,
    steps:'1. Preheat oven to 425°F.\n2. Cube sweet potato; halve Brussels sprouts.\n3. Toss turkey pieces and veg with olive oil, salt, pepper, paprika.\n4. Spread on a sheet pan in a single layer.\n5. Roast 25-30 minutes, tossing halfway.\n\nNutrition: 430 kcal · 36g protein · 40g carbs · 12g fat' },
  { name:'Cottage Cheese Protein Bowl', goal:'lose weight', tags:['cottage','cheese','snack'], cal:220, pro:26, carb:18, fat:4,
    steps:'1. Scoop 1 cup cottage cheese into a bowl.\n2. Add 1/2 cup pineapple or berries.\n3. Sprinkle with cinnamon and a drizzle of honey.\n4. Optional: add 1 tbsp flaxseed for omega-3s.\n\nNutrition: 220 kcal · 26g protein · 18g carbs · 4g fat' },
];

function buildRecipe() {
  const ings = document.getElementById('rec-ings').value.trim();
  if (!ings) { toast('Enter some ingredients first'); return; }
  const goal = document.querySelector('#pg-recipe .pill.on')?.textContent || 'high protein';
  const out  = document.getElementById('recipe-out');
  const lc   = (ings+' '+goal).toLowerCase();

  const matches = RECIPES.filter(r =>
    r.tags.some(t => lc.includes(t)) ||
    (goal.toLowerCase().includes('muscle') && r.goal==='muscle') ||
    (goal.toLowerCase().includes('weight') && r.cal<400) ||
    (goal.toLowerCase().includes('quick')  && r.cal<400)
  );
  const recipe = matches.length > 0 ? matches[0] : RECIPES[Math.floor(Math.random()*RECIPES.length)];

  out.innerHTML =
    '<div class="card" style="margin-top:0">' +
    '<div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px">' + esc(recipe.name) + '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">' +
    '<span class="badge g">' + recipe.cal + ' kcal</span>' +
    '<span class="badge blue">' + recipe.pro + 'g protein</span>' +
    '<span class="badge yellow">' + recipe.carb + 'g carbs</span>' +
    '<span class="badge orange">' + recipe.fat + 'g fat</span>' +
    '</div>' +
    '<div style="font-size:13px;line-height:1.85;white-space:pre-wrap;color:var(--text2)">' + esc(recipe.steps) + '</div>' +
    '<div class="btn-row"><button class="btn g" id="recipe-add-btn">+ Add to dinner log</button></div>' +
    '</div>';

  setTimeout(() => {
    const btn = document.getElementById('recipe-add-btn');
    if (btn) btn.onclick = () => {
      addFood({ name:recipe.name, cal:recipe.cal, pro:recipe.pro, carb:recipe.carb, fat:recipe.fat, meal:'Dinner' });
      toast(recipe.name + ' added to dinner!');
      go(nav('log'), 'log', 'My Log');
    };
  }, 50);
  unlock('recipe');
}

// =============================================
// GROCERY
// =============================================
function renderGrocery() {
  const el = document.getElementById('groc-list'); if (!el) return;
  if (S.grocery.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🛒</div><div class="empty-text">Generate from your meal plan or add items above</div></div>';
    return;
  }
  el.innerHTML = S.grocery.map((g,i) =>
    '<div class="groc-item">' +
    '<div class="groc-check' + (g.done?' done':'') + '" onclick="toggleGroc(' + i + ')">' + (g.done?'✓':'') + '</div>' +
    '<div class="groc-name' + (g.done?' striked':'') + '">' + esc(g.name) + '</div>' +
    '<button class="row-btn del" onclick="rmGroc(' + i + ')">×</button>' +
    '</div>'
  ).join('');
}
function addGroc() {
  const v = document.getElementById('groc-in').value.trim(); if (!v) return;
  S.grocery.push({ name:v, done:false });
  document.getElementById('groc-in').value = '';
  save(); renderGrocery();
}
function toggleGroc(i) { S.grocery[i].done = !S.grocery[i].done; save(); renderGrocery(); }
function rmGroc(i)      { S.grocery.splice(i,1); save(); renderGrocery(); }

function exportGrocery() {
  const text = S.grocery.map(g => (g.done?'[x] ':'[ ] ') + g.name).join('\n');
  const blob = new Blob([text], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nutriq-grocery-' + TODAY + '.txt';
  a.click(); URL.revokeObjectURL(a.href);
}

// =============================================
// RESTAURANTS
// =============================================
const RESTS = {
  "McDonald's": [
    {name:'Big Mac',cal:550,pro:25,carb:46,fat:30},
    {name:'McChicken',cal:400,pro:19,carb:40,fat:18},
    {name:'Egg McMuffin',cal:310,pro:17,carb:30,fat:13},
    {name:'Caesar salad',cal:190,pro:9,carb:16,fat:10},
    {name:'Large fries',cal:490,pro:7,carb:66,fat:23},
    {name:'10pc McNuggets',cal:420,pro:25,carb:26,fat:24},
  ],
  'Chipotle': [
    {name:'Chicken burrito bowl',cal:700,pro:56,carb:81,fat:17},
    {name:'Steak bowl',cal:760,pro:55,carb:80,fat:22},
    {name:'Veggie bowl',cal:505,pro:16,carb:70,fat:17},
    {name:'Chicken salad',cal:480,pro:48,carb:32,fat:17},
    {name:'Chips & guac',cal:480,pro:6,carb:55,fat:27},
    {name:'Sofritas bowl',cal:580,pro:24,carb:78,fat:18},
  ],
  'Subway': [
    {name:'6" Turkey breast',cal:280,pro:18,carb:40,fat:4},
    {name:'6" Steak & cheese',cal:380,pro:24,carb:41,fat:12},
    {name:'Footlong chicken',cal:700,pro:52,carb:84,fat:16},
    {name:'Veggie Delite 6"',cal:230,pro:9,carb:44,fat:3},
    {name:'6" Tuna',cal:480,pro:21,carb:40,fat:25},
  ],
  'Chick-fil-A': [
    {name:'Grilled chicken sandwich',cal:390,pro:37,carb:40,fat:11},
    {name:'Grilled nuggets 8pc',cal:140,pro:25,carb:2,fat:3},
    {name:'Waffle fries medium',cal:420,pro:5,carb:52,fat:21},
    {name:'Spicy chicken sandwich',cal:540,pro:37,carb:52,fat:24},
    {name:'Cobb salad',cal:630,pro:47,carb:22,fat:40},
  ],
  'Panera Bread': [
    {name:'Fuji apple salad',cal:560,pro:36,carb:50,fat:22},
    {name:'Broccoli cheddar soup',cal:360,pro:11,carb:35,fat:19},
    {name:'Turkey sandwich',cal:620,pro:39,carb:74,fat:18},
    {name:'Greek salad',cal:390,pro:13,carb:32,fat:24},
    {name:'Strawberry poppyseed salad',cal:340,pro:21,carb:42,fat:10},
  ],
  'Starbucks': [
    {name:'Egg white bites',cal:170,pro:13,carb:13,fat:6},
    {name:'Spinach feta wrap',cal:290,pro:19,carb:34,fat:10},
    {name:'Chicken protein box',cal:490,pro:29,carb:46,fat:23},
    {name:'Oatmeal',cal:160,pro:5,carb:28,fat:3},
    {name:'Turkey bacon sandwich',cal:230,pro:13,carb:28,fat:6},
  ],
  'Taco Bell': [
    {name:'Soft taco',cal:180,pro:10,carb:20,fat:8},
    {name:'Burrito supreme',cal:470,pro:18,carb:53,fat:18},
    {name:'Power bowl chicken',cal:480,pro:26,carb:50,fat:19},
    {name:'Crunchwrap supreme',cal:530,pro:17,carb:71,fat:20},
    {name:'Bean burrito',cal:380,pro:14,carb:55,fat:11},
  ],
  'Panda Express': [
    {name:'String bean chicken',cal:190,pro:14,carb:13,fat:9},
    {name:'Broccoli beef',cal:150,pro:9,carb:13,fat:7},
    {name:'Fried rice',cal:520,pro:11,carb:85,fat:16},
    {name:'Orange chicken',cal:490,pro:22,carb:51,fat:23},
    {name:'Grilled teriyaki chicken',cal:300,pro:36,carb:13,fat:13},
  ],
  "Wendy's": [
    {name:'Dave\'s Single',cal:590,pro:30,carb:40,fat:34},
    {name:'Spicy chicken sandwich',cal:500,pro:29,carb:54,fat:20},
    {name:'Grilled chicken wrap',cal:270,pro:26,carb:24,fat:8},
    {name:'Chili (large)',cal:330,pro:23,carb:35,fat:9},
    {name:'Apple pecan salad',cal:480,pro:33,carb:41,fat:19},
    {name:'Baked potato plain',cal:270,pro:7,carb:61,fat:0},
  ],
  'KFC': [
    {name:'Original recipe breast',cal:390,pro:39,carb:11,fat:21},
    {name:'Grilled chicken breast',cal:210,pro:38,carb:0,fat:7},
    {name:'Famous bowl',cal:720,pro:26,carb:79,fat:34},
    {name:'KFC bowl (no gravy)',cal:500,pro:22,carb:60,fat:18},
    {name:'Cole slaw',cal:170,pro:1,carb:22,fat:9},
    {name:'Corn on the cob',cal:70,pro:2,carb:13,fat:2},
  ],
  'Five Guys': [
    {name:'Little burger',cal:550,pro:26,carb:40,fat:32},
    {name:'Regular burger',cal:840,pro:41,carb:40,fat:52},
    {name:'Veggie sandwich',cal:440,pro:11,carb:60,fat:17},
    {name:'Little hot dog',cal:370,pro:14,carb:26,fat:23},
    {name:'Regular fries',cal:953,pro:11,carb:131,fat:41},
    {name:'Bacon cheeseburger',cal:920,pro:46,carb:40,fat:62},
  ],
  'Olive Garden': [
    {name:'Chicken alfredo',cal:1480,pro:74,carb:105,fat:82},
    {name:'Spaghetti & meatballs',cal:1090,pro:52,carb:134,fat:34},
    {name:'Grilled chicken margherita',cal:590,pro:57,carb:43,fat:21},
    {name:'Zuppa toscana soup',cal:220,pro:11,carb:19,fat:11},
    {name:'House salad (no dressing)',cal:120,pro:6,carb:16,fat:4},
    {name:'Breadstick (1)',cal:140,pro:5,carb:26,fat:2},
  ],
  'Shake Shack': [
    {name:'ShackBurger',cal:500,pro:27,carb:38,fat:27},
    {name:'SmokeShack',cal:580,pro:35,carb:38,fat:31},
    {name:'Chicken Shack',cal:590,pro:35,carb:50,fat:28},
    {name:'Veggie burger',cal:440,pro:16,carb:47,fat:22},
    {name:'Crinkle cut fries',cal:470,pro:7,carb:60,fat:23},
    {name:'Shack-cago dog',cal:380,pro:15,carb:33,fat:21},
  ],
  'Dominos': [
    {name:'Pepperoni pizza (2 slices hand-tossed)',cal:510,pro:22,carb:60,fat:20},
    {name:'Cheese pizza (2 slices thin crust)',cal:380,pro:17,carb:44,fat:14},
    {name:'Chicken bacon ranch pizza (2 slices)',cal:560,pro:26,carb:56,fat:25},
    {name:'Pacific veggie pizza (2 slices)',cal:420,pro:18,carb:58,fat:13},
    {name:'Breadtwists (2)',cal:280,pro:10,carb:38,fat:10},
    {name:'Wings (6pc plain)',cal:420,pro:36,carb:3,fat:30},
  ],
};

const RESTS_KEYS = Object.keys(RESTS);

const COMMON_FOODS = [
  {name:'Egg (large)',cal:72,pro:6,carb:0,fat:5},
  {name:'Egg whites (3)',cal:51,pro:11,carb:1,fat:0},
  {name:'Chicken breast (100g)',cal:165,pro:31,carb:0,fat:4},
  {name:'Turkey breast (100g)',cal:135,pro:30,carb:0,fat:1},
  {name:'Salmon (100g)',cal:208,pro:20,carb:0,fat:13},
  {name:'Tuna canned (100g)',cal:116,pro:25,carb:0,fat:1},
  {name:'Ground beef lean (100g)',cal:250,pro:26,carb:0,fat:15},
  {name:'Shrimp (100g)',cal:99,pro:24,carb:0,fat:1},
  {name:'Greek yogurt plain (1 cup)',cal:130,pro:22,carb:9,fat:1},
  {name:'Cottage cheese (1 cup)',cal:206,pro:28,carb:8,fat:5},
  {name:'Cheddar cheese (1 oz)',cal:113,pro:7,carb:0,fat:9},
  {name:'Mozzarella (1 oz)',cal:85,pro:6,carb:1,fat:6},
  {name:'Whole milk (1 cup)',cal:149,pro:8,carb:12,fat:8},
  {name:'Skim milk (1 cup)',cal:83,pro:8,carb:12,fat:0},
  {name:'Whey protein (1 scoop)',cal:120,pro:25,carb:3,fat:2},
  {name:'Brown rice (1 cup cooked)',cal:216,pro:5,carb:45,fat:2},
  {name:'White rice (1 cup cooked)',cal:204,pro:4,carb:44,fat:0},
  {name:'Oatmeal (1 cup cooked)',cal:154,pro:6,carb:28,fat:3},
  {name:'Whole wheat bread (1 slice)',cal:81,pro:4,carb:15,fat:1},
  {name:'Pasta (1 cup cooked)',cal:220,pro:8,carb:43,fat:1},
  {name:'Quinoa (1 cup cooked)',cal:222,pro:8,carb:39,fat:4},
  {name:'Flour tortilla (10 inch)',cal:218,pro:6,carb:36,fat:6},
  {name:'Sweet potato (medium)',cal:112,pro:2,carb:26,fat:0},
  {name:'Banana (medium)',cal:105,pro:1,carb:27,fat:0},
  {name:'Apple (medium)',cal:95,pro:1,carb:25,fat:0},
  {name:'Orange (medium)',cal:62,pro:1,carb:15,fat:0},
  {name:'Strawberries (1 cup)',cal:49,pro:1,carb:12,fat:1},
  {name:'Blueberries (1 cup)',cal:84,pro:1,carb:21,fat:1},
  {name:'Avocado (half)',cal:120,pro:2,carb:6,fat:11},
  {name:'Broccoli (1 cup)',cal:55,pro:4,carb:11,fat:1},
  {name:'Spinach (1 cup raw)',cal:7,pro:1,carb:1,fat:0},
  {name:'Baby carrots (1 cup)',cal:52,pro:1,carb:12,fat:0},
  {name:'Mixed salad greens (2 cups)',cal:18,pro:1,carb:3,fat:0},
  {name:'Almonds (1 oz)',cal:164,pro:6,carb:6,fat:14},
  {name:'Peanut butter (2 tbsp)',cal:188,pro:8,carb:6,fat:16},
  {name:'Mixed nuts (1 oz)',cal:172,pro:5,carb:6,fat:15},
  {name:'Hummus (2 tbsp)',cal:70,pro:2,carb:6,fat:4},
  {name:'Olive oil (1 tbsp)',cal:119,pro:0,carb:0,fat:14},
  {name:'Lentils (1 cup cooked)',cal:230,pro:18,carb:40,fat:1},
  {name:'Black beans (1 cup)',cal:227,pro:15,carb:41,fat:1},
  {name:'Protein bar (avg)',cal:200,pro:20,carb:22,fat:7},
  {name:'Granola bar',cal:193,pro:4,carb:29,fat:7},
  {name:'Coffee black (8 oz)',cal:5,pro:0,carb:0,fat:0},
  {name:'Orange juice (8 oz)',cal:112,pro:2,carb:26,fat:1},
  {name:'Bagel (plain)',cal:270,pro:11,carb:53,fat:2},
  {name:'Pancakes (2 medium)',cal:340,pro:8,carb:56,fat:10},
  {name:'Scrambled eggs (2)',cal:182,pro:12,carb:2,fat:14},
  {name:'Grilled cheese sandwich',cal:390,pro:16,carb:37,fat:20},
  {name:'Tuna salad sandwich',cal:350,pro:25,carb:34,fat:12},
  {name:'Caesar salad (no croutons)',cal:190,pro:7,carb:8,fat:16},
  {name:'Beef steak (6 oz sirloin)',cal:420,pro:48,carb:0,fat:24},
  {name:'Pork chop (6 oz)',cal:360,pro:44,carb:0,fat:19},
];

function renderRestaurants(q) {
  q = q || '';
  const el = document.getElementById('rest-list'); if (!el) return;
  const keys = RESTS_KEYS.filter(k => k.toLowerCase().includes(q.toLowerCase()));
  el.innerHTML = keys.map(k => {
    const idx = RESTS_KEYS.indexOf(k);
    return '<div class="card" data-ridx="' + idx + '" style="cursor:pointer;margin-bottom:8px;padding:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;pointer-events:none">' +
      '<div style="font-size:15px;font-weight:700">' + esc(k) + '</div>' +
      '<div style="font-size:12px;color:var(--text3)">' + RESTS[k].length + ' items →</div>' +
      '</div></div>';
  }).join('');
  el.onclick = e => {
    const card = e.target.closest('[data-ridx]');
    if (card) showRestMenu(parseInt(card.dataset.ridx));
  };
  const rm = document.getElementById('rest-menu');
  if (rm) rm.style.display = 'none';
}

function searchRest(q) { renderRestaurants(q); }

function showRestMenu(idx) {
  const name = RESTS_KEYS[idx];
  const items = RESTS[name]; if (!items) return;
  const el = document.getElementById('rest-menu');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML =
    '<div class="card">' +
    '<div class="card-hd">' +
    '<div class="card-title">🍔 ' + esc(name) + '</div>' +
    '<button class="btn sm ghost" id="rest-back-btn">← Back</button>' +
    '</div>' +
    items.map((it, i) =>
      '<div class="rest-item">' +
      '<div><div class="rest-name">' + esc(it.name) + '</div>' +
      '<div class="rest-macros">' + it.cal + ' kcal · ' + it.pro + 'g pro · ' + it.carb + 'g carbs · ' + it.fat + 'g fat</div></div>' +
      '<button class="btn g sm" data-ridx="' + idx + '" data-iidx="' + i + '">+ Add</button>' +
      '</div>'
    ).join('') +
    '</div>';
  document.getElementById('rest-back-btn').onclick = () => { el.style.display = 'none'; };
  el.onclick = e => {
    const btn = e.target.closest('[data-iidx]');
    if (btn) addRestItem(parseInt(btn.dataset.ridx), parseInt(btn.dataset.iidx));
  };
}

function addRestItem(restIdx, itemIdx) {
  const name = RESTS_KEYS[restIdx];
  const it = RESTS[name][itemIdx];
  addFood({ name: it.name+' ('+name+')', cal:it.cal, pro:it.pro, carb:it.carb, fat:it.fat, meal:'Lunch' });
  toast('✅ ' + it.name + ' added!');
  go(nav('log'), 'log', 'My Log');
}

function addCustomRestItem() {
  const name  = document.getElementById('cust-rest-name').value.trim();
  const cal   = parseInt(document.getElementById('cust-rest-cal').value)||0;
  const pro   = parseInt(document.getElementById('cust-rest-pro').value)||0;
  const carb  = parseInt(document.getElementById('cust-rest-carb').value)||0;
  const place = document.getElementById('cust-rest-place').value.trim();
  if (!name) { toast('Enter a food name'); return; }
  addFood({ name: name+(place?' ('+place+')':''), cal, pro, carb, fat:0, meal:'Lunch' });
  ['cust-rest-name','cust-rest-cal','cust-rest-pro','cust-rest-carb','cust-rest-place'].forEach(id => {
    const e = document.getElementById(id); if(e) e.value='';
  });
  toast('✅ '+name+' added to log!');
  go(nav('log'), 'log', 'My Log');
}

// =============================================
// MEAL TEMPLATES
// =============================================
function saveMealTemplate() {
  if (!S.foods || S.foods.length === 0) { toast('Log some food first!'); return; }
  const name = prompt("Name this meal template (e.g. 'My usual breakfast'):");
  if (!name || !name.trim()) return;
  if (!S.savedMeals) S.savedMeals = [];
  S.savedMeals.push({
    id: Date.now(),
    name: name.trim(),
    foods: S.foods.map(f => ({ name:f.name, cal:f.cal, pro:f.pro, carb:f.carb||0, fat:f.fat||0, meal:f.meal })),
    cal: S.foods.reduce((s,f)=>s+f.cal,0),
    pro: S.foods.reduce((s,f)=>s+f.pro,0),
  });
  save(); renderSavedMeals();
  toast('✅ Meal saved as "'+name.trim()+'"!');
}

function logSavedMeal(idx) {
  const t = S.savedMeals[idx]; if (!t) return;
  t.foods.forEach(f => S.foods.push({ id:Date.now()+Math.random(), ...f }));
  S.lastLogged = TODAY; save(); checkAch(); renderDash(); renderLog();
  toast('✅ '+t.name+' logged!');
  go(nav('log'), 'log', 'My Log');
}

function deleteSavedMeal(idx) {
  if (!confirm('Delete "'+S.savedMeals[idx].name+'"?')) return;
  S.savedMeals.splice(idx,1); save(); renderSavedMeals();
}

function renderSavedMeals() {
  const el = document.getElementById('saved-meals-list'); if (!el) return;
  if (!S.savedMeals || S.savedMeals.length === 0) {
    el.innerHTML = '<div class="empty" style="padding:10px"><div class="empty-text">No saved meals yet</div></div>';
    return;
  }
  el.innerHTML = S.savedMeals.map((t,i) =>
    '<div class="food-row">' +
    '<div style="flex:1"><div class="food-name">'+esc(t.name)+'</div>' +
    '<div style="font-size:11px;color:var(--text3)">'+t.cal+' kcal · '+t.pro+'g protein · '+t.foods.length+' items</div></div>' +
    '<button class="btn g sm" data-lsm="'+i+'">Log again</button>' +
    '<button class="row-btn del" data-dsm="'+i+'">×</button>' +
    '</div>'
  ).join('');
  el.onclick = e => {
    const lb = e.target.closest('[data-lsm]');
    const db = e.target.closest('[data-dsm]');
    if (lb) logSavedMeal(parseInt(lb.dataset.lsm));
    if (db) deleteSavedMeal(parseInt(db.dataset.dsm));
  };
}

// =============================================
// PROGRESS
// =============================================
function renderProgress() {
  const wd   = weeklyData();
  const vals = wd.map(d => d.cal);
  const filled = vals.filter(v => v > 0);
  const proVals = wd.filter(d => d.pro > 0).map(d => d.pro);
  const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  set('avg-cal',     filled.length ? Math.round(filled.reduce((s,v)=>s+v,0)/filled.length) : '—');
  set('avg-pro',     proVals.length ? Math.round(proVals.reduce((s,v)=>s+v,0)/proVals.length)+'g' : '—');
  set('best-streak', S.bestStreak || S.streak || 0);
  set('days-tracked',Object.keys(S.history||{}).length + (S.foods.length > 0 ? 1 : 0));

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const max  = Math.max(...vals, 1);
  const wc   = document.getElementById('week-chart');
  if (wc) wc.innerHTML = vals.map((v,i) =>
    '<div class="bar-col">' +
    '<div class="bar-rect" style="height:' + Math.round(v/max*76) + 'px;background:' + (v > 0 ? 'var(--g)' : 'var(--surface3)') + '"></div>' +
    '<div class="bar-lbl">' + days[i] + '</div>' +
    '</div>'
  ).join('');

  const aa = document.getElementById('all-ach');
  if (aa) aa.innerHTML = S.achievements.map(a =>
    '<div class="ach'+(a.done?' done':'')+'"><span class="ach-icon">'+a.icon+'</span><div class="ach-name">'+a.name+'</div></div>'
  ).join('');

  drawWeightChart();

  if (S.body.weight) { const e=document.getElementById('b-wt');   if(e) e.value=S.body.weight; }
  if (S.body.waist)  { const e=document.getElementById('b-waist'); if(e) e.value=S.body.waist;  }
  if (S.body.fat)    { const e=document.getElementById('b-fat');   if(e) e.value=S.body.fat;    }
  if (S.body.chest)  { const e=document.getElementById('b-chest'); if(e) e.value=S.body.chest;  }
  if (S.body.hips)   { const e=document.getElementById('b-hips');  if(e) e.value=S.body.hips;   }
  if (S.body.bicep)  { const e=document.getElementById('b-bicep'); if(e) e.value=S.body.bicep;  }

  // Weight list
  const wl = document.getElementById('wt-list');
  if (wl) wl.innerHTML = S.weightLog.slice().reverse().slice(0,8).map((w,i) =>
    '<div class="food-row"><div class="food-name">'+(i===0?'Today':w.date)+'</div><div class="food-cal">'+w.val+' lbs</div></div>'
  ).join('');
}

function logWeight() {
  const v = parseFloat(document.getElementById('wt-in').value); if (!v) return;
  if (!S.weightLog) S.weightLog = [];
  S.weightLog.push({ date:TODAY, val:v }); save();
  document.getElementById('wt-in').value = '';
  drawWeightChart();
  renderProgress();
  toast('⚖️ Weight logged!');
}

function drawWeightChart() {
  const canvas = document.getElementById('wt-canvas'); if (!canvas) return;
  const data   = (S.weightLog||[]).slice(-14);
  const w = canvas.width  = canvas.offsetWidth||680;
  const h = canvas.height = 110;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,w,h);
  if (data.length < 2) {
    ctx.fillStyle = 'rgba(150,150,150,0.4)';
    ctx.font = '13px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText('Log at least 2 weight entries to see chart', w/2, 55);
    return;
  }
  const vals = data.map(d => d.val);
  const mn = Math.min(...vals)-1, mx = Math.max(...vals)+1;
  const xS = w/(data.length-1), yS = (h-20)/(mx-mn);
  ctx.beginPath();
  data.forEach((d,i) => { const x=i*xS, y=h-10-(d.val-mn)*yS; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.lineTo((data.length-1)*xS,h); ctx.lineTo(0,h); ctx.closePath();
  ctx.fillStyle = 'rgba(0,232,122,0.08)'; ctx.fill();
  ctx.beginPath();
  data.forEach((d,i) => { const x=i*xS, y=h-10-(d.val-mn)*yS; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.strokeStyle='#00e87a'; ctx.lineWidth=2; ctx.stroke();
  data.forEach((d,i) => {
    const x=i*xS, y=h-10-(d.val-mn)*yS;
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle='#00e87a'; ctx.fill();
    ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fillStyle=document.body.classList.contains('light')?'#fff':'#0a0c0f'; ctx.fill();
  });
}

function addProgPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const grid = document.getElementById('prog-grid');
    if (!grid) return;
    const div = document.createElement('div');
    div.className = 'prog-photo';
    div.innerHTML = '<img src="'+e.target.result+'"><div class="prog-photo-date">'+new Date().toLocaleDateString()+'</div>';
    grid.prepend(div);
    toast('📸 Progress photo saved!');
  };
  reader.readAsDataURL(file); input.value = '';
}

// =============================================
// GUT HEALTH JOURNAL
// =============================================
function addGut() {
  const food = document.getElementById('gut-food').value.trim(); if (!food) return;
  const feelings = Array.from(document.querySelectorAll('#gut-feel .pill.on')).map(p => p.textContent);
  const note = document.getElementById('gut-note').value.trim();
  if (!S.gutLog) S.gutLog = [];
  S.gutLog.push({ food, feelings, note, date: new Date().toLocaleDateString() });
  save();
  document.getElementById('gut-food').value = '';
  document.getElementById('gut-note').value = '';
  document.querySelectorAll('#gut-feel .pill').forEach(p => p.classList.remove('on'));
  renderGutLog();
  unlock('gut');
  toast('🔬 Gut entry saved!');
}

function renderGutLog() {
  const isBad = f => ['Bloated','Stomach pain','Nauseous','Sluggish','Tired'].includes(f);
  const gl = document.getElementById('gut-log'); if (!gl) return;
  gl.innerHTML = (S.gutLog||[]).slice().reverse().map(e =>
    '<div class="gut-entry ' + (e.feelings.some(isBad)?'bad':e.feelings.some(f=>['Energized','Great'].includes(f))?'good':'') + '">' +
    '<div style="font-size:13px;font-weight:600">' + esc(e.food) + ' <span style="font-size:11px;color:var(--text3);font-weight:400">· ' + e.date + '</span></div>' +
    (e.feelings.length ? '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">'+e.feelings.map(f=>'<span class="badge '+(isBad(f)?'red':'g')+'">'+f+'</span>').join('')+'</div>' : '') +
    (e.note ? '<div style="font-size:12px;color:var(--text3);margin-top:6px">'+esc(e.note)+'</div>' : '') +
    '</div>'
  ).join('');

  if ((S.gutLog||[]).length >= 3) {
    const badFoods = S.gutLog.filter(e => e.feelings.some(isBad)).map(e => e.food);
    if (badFoods.length >= 2) {
      const ai = document.getElementById('gut-ai');
      const at = document.getElementById('gut-ai-text');
      if (ai) ai.style.display = 'block';
      if (at) at.textContent = 'Pattern detected: You\'ve reported discomfort after ' +
        [...new Set(badFoods)].join(', ') + '. Consider reducing these or trying an elimination approach. Log more entries for stronger insights.';
    }
  }
}

// =============================================
// SOCIAL
// =============================================
function renderSocial() {
  const me  = { name: S.profile.name||'You', streak:S.streak, avatar: (S.profile.name||'You').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ME', color:'#00e87a', me:true };
  const all = [me, ...(S.friends||[])].sort((a,b) => b.streak-a.streak);
  const rankColors = ['#eab308','#94a3b8','#ca8a04'];
  const lb = document.getElementById('leaderboard');
  if (lb) lb.innerHTML = all.map((f,i) =>
    '<div class="lb-row">' +
    '<div class="lb-rank" style="color:'+(rankColors[i]||'var(--text3)'+'">'+(i+1))+'</div>' +
    '<div class="post-avatar" style="background:'+f.color+'">'+esc(f.avatar)+'</div>' +
    '<div style="flex:1;font-size:13px;font-weight:'+(f.me?'600':'500')+'">'+ esc(f.name)+(f.me?' (you)':'')+'</div>' +
    '<div style="font-size:13px;color:var(--orange);font-weight:700">🔥 '+f.streak+'</div>' +
    '</div>'
  ).join('');

  const fl = document.getElementById('friends-list');
  if (fl) fl.innerHTML = (S.friends||[]).map(f =>
    '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">' +
    '<div class="post-avatar" style="background:'+f.color+'">'+esc(f.avatar)+'</div>' +
    '<div style="flex:1"><div style="font-size:13px;font-weight:500">'+esc(f.name)+'</div>' +
    '<div style="font-size:11px;color:var(--text3)">'+f.cal+' kcal · 🔥 '+f.streak+' streak</div></div>' +
    '<span class="badge g">Active</span>' +
    '</div>'
  ).join('');

  const posts = [
    { name:'Alex M.',   avatar:'AM', color:'#3b82f6', text:'Just hit my protein goal for the 5th day in a row! 💪 Chicken rice bowls every day.',                   time:'2h ago', likes:4  },
    { name:'Jordan K.', avatar:'JK', color:'#8b5cf6', text:'Scanned my lunch with the barcode scanner — so much faster than typing everything out! 🎉',              time:'4h ago', likes:7  },
    { name:'Sam T.',    avatar:'ST', color:'#f97316', text:'Cheat day mode activated 🍕 No regrets. Back on track tomorrow.',                                         time:'6h ago', likes:12 },
    { name:'Alex M.',   avatar:'AM', color:'#3b82f6', text:'Used the Fridge AI and it found 3 meals I could make with what I had. Game changer for meal planning!',  time:'1d ago', likes:9  },
  ];
  const sf = document.getElementById('social-feed');
  if (sf) sf.innerHTML = posts.map(p =>
    '<div class="post">' +
    '<div class="post-header"><div class="post-avatar" style="background:'+p.color+'">'+p.avatar+'</div>' +
    '<div><div style="font-size:13px;font-weight:600">'+esc(p.name)+'</div><div style="font-size:11px;color:var(--text3)">'+p.time+'</div></div></div>' +
    '<div class="post-text">'+esc(p.text)+'</div>' +
    '<div class="post-actions">' +
    '<div class="post-action" onclick="this.textContent=\'❤️ \'+(parseInt(this.textContent.replace(/\\D/g,\'\'))+1)">🤍 '+p.likes+'</div>' +
    '<div class="post-action">💬 Reply</div>' +
    '<div class="post-action" onclick="toast(\'Link copied!\')">↗ Share</div>' +
    '</div></div>'
  ).join('');
  unlock('social');
}

// =============================================
// AI COACH
// =============================================
function sendChat() {
  const inp = document.getElementById('chat-in');
  const msg = inp.value.trim(); if (!msg) return;
  inp.value = '';
  addMsg(msg, 'user');
  unlock('coach');

  const totCal  = S.foods.reduce((s,f) => s+f.cal, 0);
  const totPro  = S.foods.reduce((s,f) => s+f.pro, 0);
  const burned  = S.workouts.reduce((s,w) => s+w.burn, 0);
  const calGoal = S.cheat ? S.goals.cal+500 : S.goals.cal;
  const remCal  = Math.max(0, calGoal - totCal + burned);
  const remPro  = Math.max(0, S.goals.pro - totPro);
  const lc = msg.toLowerCase();
  const name = S.profile.name ? S.profile.name.split(' ')[0] : 'friend';
  let reply = '';

  const apiKey = getApiKey();
  if (apiKey) {
    // Real Claude API call
    callClaudeCoach(msg, totCal, totPro, burned, calGoal, remCal, remPro, name);
    return;
  }

  // Rule-based fallback
  if (lc.includes('on track') || lc.includes('how am i doing')) {
    const pct = Math.round(totCal/calGoal*100);
    const proPct = Math.round(totPro/S.goals.pro*100);
    reply = 'You\'re at '+totCal+' cal ('+pct+'% of goal) and '+totPro+'g protein ('+proPct+'% of goal) today. ';
    reply += pct<50 ? 'Plenty of room left, keep logging!' : pct>90 ? 'Almost at your limit — light snacks only.' : 'Looking solid, '+name+'! Keep it up! 💪';
  } else if (lc.includes('calories left') || lc.includes('cal left') || lc.includes('how many cal')) {
    reply = 'You have '+remCal+' calories remaining today, '+name+'. You\'ve had '+totCal+' kcal and burned '+burned+' kcal from workouts.';
  } else if (lc.includes('protein') || lc.includes('pro left')) {
    reply = remPro > 0
      ? 'You need '+remPro+'g more protein today. Try Greek yogurt (17g), chicken breast (31g/100g), eggs (6g each), or a protein shake.'
      : 'You\'ve already hit your protein goal of '+S.goals.pro+'g today! Great work, '+name+'! 🎉';
  } else if (lc.includes('snack')) {
    const snacks = [
      {n:'Greek yogurt (1 cup)',cal:150,pro:17},{n:'2 hard boiled eggs',cal:140,pro:12},
      {n:'Cottage cheese (½ cup)',cal:110,pro:13},{n:'Protein bar',cal:200,pro:20},
      {n:'Apple & peanut butter',cal:200,pro:7},{n:'String cheese (2)',cal:160,pro:14},
      {n:'Turkey slices (2 oz)',cal:60,pro:12},{n:'Edamame (½ cup)',cal:95,pro:9},
    ].filter(s => s.cal <= remCal);
    reply = 'Snacks that fit your '+remCal+' cal budget: '+snacks.slice(0,4).map(s=>s.n+' ('+s.cal+' kcal, '+s.pro+'g protein)').join('; ')+'.';
  } else if (lc.includes('dinner') || lc.includes('lunch') || lc.includes('breakfast') || lc.includes('meal idea')) {
    const meal = lc.includes('breakfast')?'breakfast':lc.includes('lunch')?'lunch':'dinner';
    const ideas = {
      breakfast:['Oatmeal with berries and protein powder (420 kcal, 30g protein)','Egg white omelette with vegetables (280 kcal, 24g protein)','Greek yogurt parfait with granola (320 kcal, 22g protein)'],
      lunch:    ['Grilled chicken salad with quinoa (450 kcal, 40g protein)','Turkey wrap with avocado (480 kcal, 32g protein)','Tuna pasta salad (490 kcal, 38g protein)'],
      dinner:   ['Salmon with roasted veg and rice (580 kcal, 42g protein)','Chicken stir fry over brown rice (520 kcal, 42g protein)','Lean beef tacos with black beans (560 kcal, 38g protein)'],
    };
    reply = 'Here are '+meal+' ideas for your '+remCal+' remaining calories: '+ideas[meal].join('; ')+'.';
  } else if (lc.includes('water') || lc.includes('hydrat')) {
    reply = 'You\'ve had '+S.water+' of 8 cups today. '+(S.water>=8?'Fully hydrated! 💧':'Try to get '+(8-S.water)+' more cups. Drink a glass before each meal.');
  } else if (lc.includes('streak')) {
    reply = 'You\'re on a '+S.streak+'-day streak! '+(S.streak>=7?'That\'s a whole week — incredible! 🔥':S.streak>=3?'Keep going, you\'re building a real habit!':'Every day logged is a win. Keep showing up!');
  } else if (lc.includes('cheat') || lc.includes('pizza') || lc.includes('junk')) {
    reply = 'One cheat meal won\'t ruin your progress. Activate Cheat Day mode in the log page to add +500 cal without hurting your streak. Enjoy it and get back on track tomorrow! 🍕';
  } else if (lc.includes('weight') || lc.includes('lose') || lc.includes('cut')) {
    reply = 'To lose weight, aim for a 300-500 cal deficit. Your goal is '+calGoal+' kcal. Keep protein high at '+S.goals.pro+'g to preserve muscle. Log your weight daily in Progress to see trends.';
  } else if (lc.includes('muscle') || lc.includes('gain') || lc.includes('bulk')) {
    reply = 'To build muscle, hit '+S.goals.pro+'g protein every day and eat at or slightly above '+calGoal+' cal. You\'re at '+totPro+'g protein today. Progressive overload in the gym matters most!';
  } else if (lc.includes('rate') || lc.includes('score') || lc.includes('week')) {
    const wd = weeklyData();
    const filled = wd.filter(d => d.cal > 0);
    const avg = filled.length ? Math.round(filled.reduce((s,d)=>s+d.cal,0)/filled.length) : 0;
    const score = Math.min(10, Math.round((filled.length/7)*5+(avg>0&&Math.abs(avg-calGoal)<300?3:1)+(S.streak>=3?2:0)));
    reply = 'This week I\'d rate you '+score+'/10. '+filled.length+' of 7 days logged, averaging '+avg+' kcal per day. '+(score>=8?'Seriously impressive! 🌟':score>=6?'Solid week! More consistency and you\'ll be elite.':'Keep showing up — every logged day counts.');
  } else if (lc.includes('gut') || lc.includes('bloat') || lc.includes('digest')) {
    const bad = (S.gutLog||[]).filter(e => e.feelings.some(f=>['Bloated','Stomach pain','Nauseous'].includes(f)));
    reply = bad.length > 0
      ? 'Based on your gut journal, you\'ve had issues after: '+[...new Set(bad.map(e=>e.food))].join(', ')+'. Consider reducing those foods.'
      : 'Your gut journal looks good! No major red flags yet. Keep logging to spot patterns.';
  } else if (lc.includes('hello') || lc.includes('hi') || lc.includes('hey')) {
    reply = 'Hey '+name+'! 👋 Ready to crush today? You\'re at '+totCal+' cal and '+totPro+'g protein so far. What do you need help with?';
  } else if (lc.includes('family') || lc.includes('kid') || lc.includes('child')) {
    reply = 'For the family, check out the Family Planner in Settings — you can add family members with their own calorie goals and see their targets in the meal planner. Great for planning family dinners! 👨‍👩‍👧';
  } else {
    const tips = [
      'Focus on hitting your protein goal first — everything else falls into place.',
      'Consistency beats perfection every time. One bad meal doesn\'t define your diet.',
      'Drink a glass of water before each meal to hit your water goal and control portions.',
      'Sleep 7-9 hours — it affects hunger hormones more than most people realize.',
      'Meal prepping on Sunday saves you from bad choices all week.',
      'Try the barcode scanner on any packaged food for instant nutrition info — no typing needed!',
    ];
    reply = tips[Math.floor(Math.random()*tips.length)]+' Ask me anything about your goals, meals, or progress!';
  }
  addMsg(reply, 'ai');
  const wrap = document.getElementById('chat-msgs');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

async function callClaudeCoach(msg, totCal, totPro, burned, calGoal, remCal, remPro, name) {
  const wrap = document.getElementById('chat-msgs');
  const typingId = addMsg('<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>', 'ai');

  const systemPrompt = `You are a friendly, encouraging personal nutrition coach for NutriQ. The user's name is ${name}.
Today's data: ${totCal} kcal eaten, ${totPro}g protein, ${burned} kcal burned, ${remCal} kcal remaining, goal is ${calGoal} kcal and ${S.goals.pro}g protein.
Streak: ${S.streak} days. Water: ${S.water}/8 cups.
Be concise (2-4 sentences), supportive, and use emojis sparingly. Give specific, actionable advice.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role:'user', content: msg }],
      }),
    });
    const data = await resp.json();
    const el = document.getElementById(typingId);
    if (el) el.innerHTML = data.content?.[0]?.text || 'Sorry, I couldn\'t get a response. Try again!';
  } catch(e) {
    const el = document.getElementById(typingId);
    if (el) el.innerHTML = 'Connection error. Check your API key in Settings and try again.';
  }
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

function qChat(msg) { document.getElementById('chat-in').value = msg; sendChat(); }
function addMsg(text, role) {
  const id  = 'm'+Date.now()+Math.random().toString(36).slice(2);
  const el  = document.createElement('div');
  el.className = 'msg '+role; el.id = id; el.innerHTML = text;
  const wrap = document.getElementById('chat-msgs');
  if (wrap) { wrap.appendChild(el); wrap.scrollTop = wrap.scrollHeight; }
  return id;
}

// =============================================
// WEEKLY REPORT
// =============================================
function renderReport() {
  const wd   = weeklyData();
  const vals = wd.map(d => d.cal).filter(v => v > 0);
  const avgCal = vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
  const days = Object.keys(S.history||{}).length + (S.foods.length>0?1:0);
  const rs = document.getElementById('report-stats');
  if (rs) rs.innerHTML =
    '<div class="g4" style="margin-bottom:14px">' +
    '<div class="tile"><div class="tile-label">Days tracked</div><div class="tile-value">'+days+'</div></div>' +
    '<div class="tile"><div class="tile-label">Avg calories</div><div class="tile-value">'+(avgCal||'—')+'</div></div>' +
    '<div class="tile"><div class="tile-label">Current streak</div><div class="tile-value">'+S.streak+'</div></div>' +
    '<div class="tile"><div class="tile-label">Best streak</div><div class="tile-value">'+(S.bestStreak||S.streak||0)+'</div></div>' +
    '</div>';
}

function genReport() {
  const btn = event.target; btn.textContent='Generating...'; btn.disabled=true;
  const wd   = weeklyData();
  const filled = wd.filter(d => d.cal > 0);
  const avgCal = filled.length ? Math.round(filled.reduce((s,d)=>s+d.cal,0)/filled.length) : 0;
  const avgPro = filled.length ? Math.round(filled.reduce((s,d)=>s+d.pro,0)/filled.length) : 0;
  const goalHitDays = filled.filter(d => Math.abs(d.cal-S.goals.cal) < 300).length;
  const proHitDays  = filled.filter(d => d.pro >= S.goals.pro*0.9).length;
  const score = Math.min(10, Math.round(
    (filled.length/7)*3 + (goalHitDays/Math.max(1,filled.length))*2 +
    (proHitDays/Math.max(1,filled.length))*2 + (S.streak>=7?2:S.streak>=3?1:0) + (S.water>=6?1:0)
  ));
  const scoreColor = score>=8?'var(--g)':score>=6?'var(--yellow)':'var(--red)';
  const strengths=[],improvements=[],actions=[];
  if (filled.length>=5)               strengths.push('Logged '+filled.length+' of 7 days — excellent consistency');
  if (avgPro>=S.goals.pro*0.85)       strengths.push('Protein averaging '+avgPro+'g/day — right on target');
  if (S.streak>=7)                    strengths.push(S.streak+'-day streak — building a real habit!');
  if (S.water>=6)                     strengths.push('Hydration is solid at '+S.water+' cups today');
  if (goalHitDays>=4)                 strengths.push('Hit calorie goal '+goalHitDays+' days this week');
  if (filled.length<5)                improvements.push('Only logged '+filled.length+' of 7 days — aim for every day');
  if (avgPro<S.goals.pro*0.8)        improvements.push('Protein averaging '+avgPro+'g vs '+S.goals.pro+'g goal');
  if (S.water<5)                      improvements.push('Water intake low — try to hit 8 cups daily');
  if (S.streak<3)                     improvements.push('Streak is at '+S.streak+' — consistency is key');
  if (Math.abs(avgCal-S.goals.cal)>400) improvements.push('Calories averaging '+avgCal+' vs '+S.goals.cal+' goal');
  actions.push('Log every meal this week — even just the name counts');
  if (avgPro<S.goals.pro) actions.push('Add one high protein snack daily (Greek yogurt, eggs, cottage cheese)');
  if (S.water<6)          actions.push('Set a reminder to drink water at 10am, 2pm, 5pm, and 8pm');
  if (S.streak<7)         actions.push('Focus on a 7-day streak — it becomes automatic after that');
  actions.push('Weigh yourself same time each morning for accurate tracking');

  const name = S.profile.name ? S.profile.name.split(' ')[0] : 'You';
  const ra = document.getElementById('report-ai');
  if (ra) {
    ra.innerHTML =
      '<div class="card">' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">' +
      '<div style="text-align:center;background:var(--surface2);border-radius:var(--r);padding:16px 20px;flex-shrink:0">' +
      '<div style="font-size:48px;font-weight:900;color:'+scoreColor+';line-height:1;font-family:\'Bebas Neue\',sans-serif">'+score+'</div>' +
      '<div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.1em">/10 score</div></div>' +
      '<div><div style="font-size:20px;font-weight:700;color:var(--text)">'+name+'\'s Weekly Report</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-top:4px">'+filled.length+' days logged · avg '+avgCal+' kcal · avg '+avgPro+'g protein · '+S.streak+' day streak</div></div>' +
      '</div>' +
      (strengths.length?'<div style="font-size:11px;color:var(--g);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">✅ What\'s working</div><ul style="padding-left:16px;margin-bottom:16px">'+strengths.map(s=>'<li style="font-size:13px;color:var(--text2);margin-bottom:4px;line-height:1.4">'+esc(s)+'</li>').join('')+'</ul>':'') +
      (improvements.length?'<div style="font-size:11px;color:var(--yellow);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">⚡ Areas to improve</div><ul style="padding-left:16px;margin-bottom:16px">'+improvements.map(s=>'<li style="font-size:13px;color:var(--text2);margin-bottom:4px;line-height:1.4">'+esc(s)+'</li>').join('')+'</ul>':'') +
      '<div style="font-size:11px;color:var(--blue);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">🎯 Action plan for next week</div>' +
      '<ul style="padding-left:16px">'+actions.map(s=>'<li style="font-size:13px;color:var(--text2);margin-bottom:4px;line-height:1.4">'+esc(s)+'</li>').join('')+'</ul>' +
      '</div>';
    ra.style.display = 'block';
  }
  btn.textContent='✨ Generate full AI report'; btn.disabled=false;
}

// =============================================
// FITNESS SYNC
// =============================================
function renderFitness() {
  const fd = S.fitData;
  const banner = document.getElementById('fit-connected-banner');
  const statsRow = document.getElementById('fit-stats-row');
  if (fd && fd.synced) {
    if (banner)   banner.style.display = 'block';
    if (statsRow) statsRow.style.display = '';
    const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
    set('fit-steps',  (fd.steps||0).toLocaleString());
    set('fit-burned', fd.burned||0);
    set('fit-active', fd.active||0);
    set('fit-sleep',  fd.sleep||'—');
    set('fit-sync-time', 'Last synced '+fd.syncTime);
    const setBar = (id,w) => { const e=document.getElementById(id); if(e) e.style.width=w+'%'; };
    setBar('fit-steps-bar',  Math.min(100,Math.round((fd.steps||0)/10000*100)));
    setBar('fit-burned-bar', Math.min(100,Math.round((fd.burned||0)/600*100)));
    setBar('fit-active-bar', Math.min(100,Math.round((fd.active||0)/30*100)));
    setBar('fit-sleep-bar',  Math.min(100,Math.round((fd.sleep||0)/9*100)));
    const fac = document.getElementById('fit-ai-card');
    const fwc = document.getElementById('fit-weekly-card');
    if (fac) fac.style.display = 'block';
    if (fwc) fwc.style.display = 'block';
    renderFitWeekChart();
    if (!fd.insight) getFitInsight();
    else { const e=document.getElementById('fit-ai-text'); if(e) e.textContent=fd.insight; }
  }
  if (fd) {
    const fill = (id,v) => { const e=document.getElementById(id); if(e&&v) e.value=v; };
    fill('fi-steps', fd.steps); fill('fi-burned', fd.burned);
    fill('fi-active', fd.active); fill('fi-sleep', fd.sleep); fill('fi-hr', fd.hr);
  }
}

function liveUpdate() {
  const steps  = parseInt(document.getElementById('fi-steps').value)||0;
  const burned = parseInt(document.getElementById('fi-burned').value)||0;
  const prev   = document.getElementById('fit-live-preview');
  if (steps > 0 || burned > 0) {
    if (prev) prev.style.display = 'block';
    const stepCals = Math.round(steps*0.04);
    const total    = burned + stepCals;
    const totCal   = S.foods.reduce((s,f)=>s+f.cal,0);
    const net      = (S.cheat?S.goals.cal+500:S.goals.cal) - totCal + total;
    const nc = document.getElementById('fit-net-cal');
    const ns = document.getElementById('fit-net-sub');
    if (nc) nc.textContent = Math.max(0,net).toLocaleString()+' kcal';
    if (ns) ns.textContent = (net>0?'remaining':'over')+' today (after '+total+' burned)';
  } else {
    if (prev) prev.style.display = 'none';
  }
}

function syncFitData() {
  const steps  = parseInt(document.getElementById('fi-steps').value)||0;
  const burned = parseInt(document.getElementById('fi-burned').value)||0;
  const active = parseInt(document.getElementById('fi-active').value)||0;
  const sleep  = parseFloat(document.getElementById('fi-sleep').value)||0;
  const hr     = parseInt(document.getElementById('fi-hr').value)||0;
  if (!steps && !burned && !active && !sleep) { toast('Enter at least one value to sync'); return; }
  const stepCals   = Math.round(steps*0.04);
  const totalBurned = burned + stepCals;
  if (!S.fitData) S.fitData = {};
  S.fitData = { steps, burned:totalBurned, active, sleep, hr, synced:true, syncTime:new Date().toLocaleTimeString(), insight:null, weeklySteps: S.fitData.weeklySteps||generateWeeklySteps(steps) };
  if (sleep>0) { S.sleep=sleep; const sl=document.getElementById('sleep-in'); if(sl) sl.value=sleep; }
  if (totalBurned>0) {
    S.workouts = S.workouts.filter(w => w.fromFitbit!==true);
    S.workouts.push({ name:'Fitness activity', burn:totalBurned, fromFitbit:true });
  }
  save(); renderFitness(); renderDash(); renderLog();
  toast('✅ Fitness data synced!');
  getFitInsight();
}

function generateWeeklySteps(today) {
  const base = today||7500;
  return [
    Math.round(base*(0.7+Math.random()*0.5)), Math.round(base*(0.8+Math.random()*0.4)),
    Math.round(base*(0.6+Math.random()*0.6)), Math.round(base*(0.9+Math.random()*0.3)),
    Math.round(base*(0.75+Math.random()*0.5)),Math.round(base*(1.0+Math.random()*0.4)),
    today||0,
  ];
}

function renderFitWeekChart() {
  const data  = (S.fitData&&S.fitData.weeklySteps)||[0,0,0,0,0,0,0];
  const max   = Math.max(...data,1);
  const chart = document.getElementById('fit-week-chart');
  if (chart) chart.innerHTML = data.map(v =>
    '<div class="bar-col">' +
    '<div class="bar-rect" style="height:'+Math.round(v/max*76)+'px;background:'+(v>=10000?'var(--g)':v>=7500?'var(--yellow)':'var(--surface3)')+'"></div>' +
    '<div class="bar-lbl">'+(v>0?(v/1000).toFixed(1)+'k':'-')+'</div>' +
    '</div>'
  ).join('');
}

function clearFitData() {
  if (!confirm('Clear all fitness sync data?')) return;
  S.fitData = null;
  S.workouts = S.workouts.filter(w => w.fromFitbit!==true);
  save(); renderDash(); renderLog();
  ['fit-connected-banner','fit-ai-card','fit-weekly-card'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  const sr = document.getElementById('fit-stats-row'); if(sr) sr.style.display='none';
  ['fi-steps','fi-burned','fi-active','fi-sleep','fi-hr'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const fp = document.getElementById('fit-live-preview'); if(fp) fp.style.display='none';
  toast('Fitness data cleared.');
}

function handleCsvDrop(e) {
  e.preventDefault();
  document.getElementById('csv-drop').classList.remove('drag');
  const file = e.dataTransfer.files[0]; if (file) parseCsvFile(file);
}
function readCsv(input) { const file=input.files[0]; if(file) parseCsvFile(file); input.value=''; }

function parseCsvFile(file) {
  const status = document.getElementById('csv-status');
  const result = document.getElementById('csv-result');
  status.innerHTML = '<span class="spin"></span> Reading CSV...';
  result.innerHTML = '';
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const lines = e.target.result.trim().split('\n').filter(l=>l.trim());
      if (lines.length < 2) { status.textContent='File seems empty.'; return; }
      const parsed = parseGenericCsv(lines);
      if (!parsed) { status.textContent='Could not read this CSV format — try manual sync.'; return; }
      status.textContent = '✅ Successfully read '+file.name;
      result.innerHTML =
        '<div style="background:var(--g4);border:1px solid rgba(0,232,122,0.2);border-radius:var(--r-sm);padding:14px;margin-bottom:12px">' +
        '<div style="font-size:11px;color:var(--g);font-weight:700;text-transform:uppercase;margin-bottom:10px">Data found</div>' +
        '<div class="g2">' +
        (parsed.steps!=null?'<div><div style="font-size:11px;color:var(--text3)">Steps</div><div style="font-size:22px;font-weight:700">'+parsed.steps.toLocaleString()+'</div></div>':'') +
        (parsed.calories!=null?'<div><div style="font-size:11px;color:var(--text3)">Cal burned</div><div style="font-size:22px;font-weight:700">'+parsed.calories+'</div></div>':'') +
        (parsed.activeMinutes!=null?'<div><div style="font-size:11px;color:var(--text3)">Active mins</div><div style="font-size:22px;font-weight:700">'+parsed.activeMinutes+'</div></div>':'') +
        (parsed.sleep!=null?'<div><div style="font-size:11px;color:var(--text3)">Sleep (hrs)</div><div style="font-size:22px;font-weight:700">'+parsed.sleep+'</div></div>':'') +
        '</div></div>' +
        '<button class="btn g" onclick="applyCsvData('+JSON.stringify(parsed)+')">Apply to dashboard</button>';
    } catch(err) { status.textContent='Could not parse file. Try manual sync.'; }
  };
  reader.readAsText(file);
}

function parseGenericCsv(lines) {
  const headers = lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/['"]/g,''));
  const rows    = lines.slice(1).map(l=>l.split(',').map(v=>v.trim().replace(/['"]/g,'')));
  const find    = keys => { for(const k of keys){const i=headers.findIndex(h=>h.includes(k));if(i>=0)return i;} return -1; };
  const stepsIdx  = find(['steps','step count']);
  const calIdx    = find(['calories','cal burned','active calories']);
  const activeIdx = find(['active minutes','minutes fairly active','minutes very active','active min']);
  const sleepIdx  = find(['sleep','hours sleep','minutes asleep']);
  const hrIdx     = find(['resting heart','heart rate','resting hr']);
  const row = rows[rows.length-1]; if (!row) return null;
  const getNum = idx => { if(idx<0||!row[idx])return null; const n=parseFloat(row[idx].replace(/,/g,'')); return isNaN(n)?null:n; };
  let sleep = getNum(sleepIdx); if(sleep&&sleep>24) sleep=Math.round(sleep/60*10)/10;
  const steps=getNum(stepsIdx),calories=getNum(calIdx),heartRate=getNum(hrIdx);
  let activeMinutes=getNum(activeIdx);
  const fairIdx=find(['minutes fairly active']),veryIdx=find(['minutes very active']);
  if(fairIdx>=0&&veryIdx>=0) activeMinutes=(getNum(fairIdx)||0)+(getNum(veryIdx)||0);
  if(!steps&&!calories&&!sleep) return null;
  return { steps:steps?Math.round(steps):null, calories:calories?Math.round(calories):null, activeMinutes:activeMinutes?Math.round(activeMinutes):null, sleep, heartRate:heartRate?Math.round(heartRate):null };
}

function applyCsvData(parsed) {
  const fill = (id,v) => { if(v){const e=document.getElementById(id);if(e)e.value=v;} };
  fill('fi-steps',parsed.steps); fill('fi-burned',parsed.calories);
  fill('fi-active',parsed.activeMinutes); fill('fi-sleep',parsed.sleep); fill('fi-hr',parsed.heartRate);
  liveUpdate(); syncFitData();
  const cr = document.getElementById('csv-result');
  if(cr) cr.innerHTML='<div style="font-size:13px;color:var(--g);font-weight:600;padding:8px 0">✅ Applied to dashboard!</div>';
}

function getFitInsight() {
  const el = document.getElementById('fit-ai-text'); if(!el||!S.fitData) return;
  const fd = S.fitData;
  const totCal = S.foods.reduce((s,f)=>s+f.cal,0);
  const totPro = S.foods.reduce((s,f)=>s+f.pro,0);
  const tips=[];
  if(fd.steps&&fd.steps>=10000) tips.push('You crushed your step goal with '+(fd.steps).toLocaleString()+' steps! 🎉');
  else if(fd.steps)              tips.push('You\'ve done '+(fd.steps).toLocaleString()+' steps — '+(10000-fd.steps).toLocaleString()+' more to hit 10k!');
  if(fd.sleep&&fd.sleep<7)      tips.push('Sleep was only '+fd.sleep+'hrs. Under 7hrs raises hunger hormones — try to get 7-9hrs for best results.');
  else if(fd.sleep&&fd.sleep>=8) tips.push('Great sleep at '+fd.sleep+'hrs — your body recovers and builds muscle during sleep. 💤');
  if(fd.burned&&fd.burned>400)  tips.push('You burned '+fd.burned+' cal from activity — your net calorie budget is higher. Room for a bigger meal!');
  if(totPro<S.goals.pro*0.6)    tips.push('Protein is only '+totPro+'g today. With your activity level, hitting '+S.goals.pro+'g is extra important for recovery.');
  if(fd.hr&&fd.hr<60)           tips.push('Resting HR of '+fd.hr+'bpm is excellent — athlete-level! 💪');
  const insight = tips.length > 0 ? tips.join(' ') : 'Keep up the consistency! Log more days to see patterns in your fitness + nutrition data.';
  el.textContent = insight;
  if(S.fitData) { S.fitData.insight=insight; save(); }
}

// =============================================
// SETTINGS
// =============================================
function renderSettingsPage() {
  updateApiKeyStatus();
  updateGoalInputs();
  renderSuppList();
  renderFamilySettings();
  // Fill profile
  const sp = S.profile;
  const fill = (id,v) => { const e=document.getElementById(id); if(e&&v) e.value=v; };
  fill('s-name', sp.name); fill('s-age', sp.age||'');
  fill('s-ht', sp.height||''); fill('s-wt', sp.weight||'');
}

function updateGoalInputs() {
  const fill = (id,v) => { const e=document.getElementById(id); if(e) e.value=v||''; };
  fill('g-cal', S.goals.cal); fill('g-pro', S.goals.pro);
  fill('g-carb', S.goals.carb); fill('g-fat', S.goals.fat);
}

function saveProfile() {
  const name = document.getElementById('s-name').value.trim();
  S.profile.name   = name || S.profile.name;
  S.profile.age    = parseInt(document.getElementById('s-age').value)||0;
  S.profile.height = parseFloat(document.getElementById('s-ht').value)||0;
  S.profile.weight = parseFloat(document.getElementById('s-wt').value)||0;
  save(); updateSidebarUser();
  toast('✅ Profile saved!');
}

function renderSuppList() {
  const el = document.getElementById('supp-list'); if (!el) return;
  if (S.supplements.length === 0) {
    el.innerHTML = '<div style="font-size:13px;color:var(--text3);padding:8px 0">No supplements added yet</div>';
    return;
  }
  el.innerHTML = S.supplements.map((s,i) =>
    '<div class="supp-item">' +
    '<div class="supp-dot'+(s.taken?' taken':'')+'" onclick="suppTake('+i+')">'+(s.taken?'✓':'')+'</div>' +
    '<div style="flex:1;font-size:13px;font-weight:500">'+esc(s.name)+'</div>' +
    '<div style="font-size:11px;color:var(--text3)">'+esc(s.time)+'</div>' +
    '<button class="row-btn del" onclick="rmSupp('+i+')">×</button>' +
    '</div>'
  ).join('');
}

function addSupp() {
  const n = document.getElementById('supp-n').value.trim();
  const t = document.getElementById('supp-t').value.trim()||'Morning';
  if (!n) return;
  S.supplements.push({ name:n, time:t, taken:false });
  document.getElementById('supp-n').value = '';
  document.getElementById('supp-t').value = '';
  save(); renderSuppList(); renderDash();
  toast('💊 '+n+' added!');
}
function rmSupp(i) { S.supplements.splice(i,1); save(); renderSuppList(); renderDash(); }

// =============================================
// EXPORT
// =============================================
function exportData() {
  const rows = [['Date','Food','Calories','Protein(g)','Carbs(g)','Fat(g)','Meal']];
  Object.entries(S.history||{}).forEach(([date,day]) => {
    rows.push([date,'(daily total)',day.cal,day.pro,day.carb||0,day.fat||0,'All']);
  });
  S.foods.forEach(f => rows.push([TODAY,f.name,f.cal,f.pro,f.carb||0,f.fat||0,f.meal]));
  const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nutriq-export-'+TODAY+'.csv';
  a.click(); URL.revokeObjectURL(a.href);
  toast('📁 Data exported!');
}

function backupAllData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nutriq-backup-' + TODAY + '.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('✅ Full backup downloaded!');
}

function restoreAllData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.goals) { toast('Invalid backup file'); return; }
        if (!confirm('This will replace all your current data. Continue?')) return;
        S = Object.assign(FRESH(), data);
        save(); location.reload();
      } catch(err) { toast('Could not read backup file'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// =============================================
// THEME
// =============================================
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  S.theme = isLight ? 'light' : 'dark';
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  save();
}
function applyTheme() {
  const isLight = S.theme === 'light';
  document.body.classList.toggle('light', isLight);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
}

// =============================================
// API KEY
// =============================================
const API_KEY_STORAGE = 'nutriq_api_key';
function getApiKey()  { return localStorage.getItem(API_KEY_STORAGE)||''; }

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) { toast('Please enter your API key'); return; }
  if (!key.startsWith('sk-ant')) { toast('Should start with sk-ant'); return; }
  localStorage.setItem(API_KEY_STORAGE, key);
  document.getElementById('api-modal').classList.remove('show');
  toast('✅ API key saved! AI features are now active.');
  updateApiKeyStatus();
}
function skipApiKey() {
  document.getElementById('api-modal').classList.remove('show');
  toast('No problem — add a key in Settings anytime to unlock AI features.');
}
function saveApiKeyFromSettings() {
  const key = document.getElementById('api-key-settings-input').value.trim();
  if (!key) { toast('Please enter your API key'); return; }
  if (!key.startsWith('sk-ant')) { toast('Should start with sk-ant'); return; }
  localStorage.setItem(API_KEY_STORAGE, key);
  toast('✅ API key saved! AI features active.');
  updateApiKeyStatus();
}
function clearApiKey() {
  if (!confirm('Remove your API key? AI features will stop working.')) return;
  localStorage.removeItem(API_KEY_STORAGE);
  const el = document.getElementById('api-key-settings-input');
  if (el) el.value = '';
  toast('API key removed.'); updateApiKeyStatus();
}
function updateApiKeyStatus() {
  const key = getApiKey();
  const el  = document.getElementById('api-key-status'); if (!el) return;
  el.innerHTML = key
    ? '<span style="color:var(--g);font-weight:600">✅ API key active</span> — AI Coach powered by Claude'
    : '<span style="color:var(--orange);font-weight:600">⚠️ No API key</span> — AI Coach uses built-in responses';
  const inp = document.getElementById('api-key-settings-input');
  if (inp && key) inp.value = key;
}

// =============================================
// INSTALL BANNER
// =============================================
function showInstallBanner() {
  if (localStorage.getItem('nutriq_install_dismissed')) return;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  if ((!isIOS && !isAndroid) || window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) return;
  const banner = document.getElementById('install-banner');
  const instr  = document.getElementById('install-instructions');
  if (instr) instr.textContent = isIOS
    ? 'Tap the Share button (□↑) then "Add to Home Screen"'
    : 'Tap the menu (⋮) then "Add to Home Screen"';
  if (banner) setTimeout(() => { banner.style.display='flex'; }, 3500);
}

// =============================================
// INIT
// =============================================
applyTheme();

// Restore mood
if (S.mood) {
  const mo = document.querySelector('.mood-opt[data-mood="'+S.mood+'"]');
  if (mo) mo.classList.add('picked');
}
if (S.sleep) { const sl=document.getElementById('sleep-in'); if(sl) sl.value=S.sleep; }

updateSidebarUser();
showInstallBanner();

// Show onboarding for new users
if (!S.onboarded || !S.profile.name) {
  setTimeout(() => showOnboarding(), 400);
}

renderDash();
renderGrocery();
renderRestaurants();
renderGutLog();
