// ===== MA'LUMOTLAR =====
let vazifalar = JSON.parse(localStorage.getItem('taskflow_v2') || '[]');
let tahrirlashId = null;
let joriyFilter = 'all';
let joriyKat = 'all';
let joriyPrioritet = 'all';
let joriySort = 'yangi';
let kichikVazifalar = [];
let sudralayotgan = null;

// ===== ISHGA TUSHIRISH =====
document.addEventListener('DOMContentLoaded', () => {
  demoVazifalarQosh();
  sahifaYangilash();
  bildirishnomaTekshir();
  setInterval(muddatTekshir, 30000);
  muddatTekshir();
  hodisalarBoglash();
});

// ===== HODISALAR =====
function hodisalarBoglash() {
  document.getElementById('openModalBtn').onclick = () => modalOch();
  document.getElementById('closeModalBtn').onclick = modalYop;
  document.getElementById('cancelModalBtn').onclick = modalYop;
  document.getElementById('saveTaskBtn').onclick = vazifaSaqla;
  document.getElementById('modalBg').onclick = (e) => { if(e.target.id==='modalBg') modalYop(); };
  document.getElementById('searchInput').oninput = royhatKorsatish;
  document.getElementById('sortSel').onchange = (e) => { joriySort = e.target.value; royhatKorsatish(); };
  document.getElementById('fTitle').oninput = function() {
    document.getElementById('fTitleCount').textContent = this.value.length + '/100';
  };
  document.getElementById('addSubBtn').onclick = kichikVazifaQosh;
  document.getElementById('fSubInput').onkeydown = (e) => { if(e.key==='Enter') kichikVazifaQosh(); };
  document.getElementById('allowNotif').onclick = () => {
    Notification.requestPermission().then(p => {
      if(p==='granted') xabar('Bildirishnomalar yoqildi! 🔔','success');
      document.getElementById('notifBanner').classList.remove('show');
    });
  };
  document.getElementById('dismissBanner').onclick = () => {
    document.getElementById('notifBanner').classList.remove('show');
  };
  document.getElementById('themeBtn').onclick = temaAlmashtir;
  document.getElementById('burgerBtn').onclick = () => {
    document.getElementById('sidebar').classList.toggle('mini');
  };

  document.querySelectorAll('.sn-item').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.sn-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      joriyFilter = btn.dataset.filter;
      sahifaNominiYangilash();
      royhatKorsatish();
    };
  });

  document.querySelectorAll('.sc-item').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.sc-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      joriyKat = btn.dataset.cat;
      royhatKorsatish();
    };
  });

  document.querySelectorAll('.pt').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.pt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      joriyPrioritet = btn.dataset.p;
      royhatKorsatish();
    };
  });

  const tema = localStorage.getItem('taskflow_tema');
  if(tema === 'dark') {
    document.documentElement.setAttribute('data-theme','dark');
    document.getElementById('themeEmoji').textContent = '☀️';
    document.getElementById('themeText').textContent = 'Kunduzgi rejim';
  }
}

// ===== BILDIRISHNOMA =====
function bildirishnomaTekshir() {
  if(!('Notification' in window)) return;
  if(Notification.permission === 'default') {
    document.getElementById('notifBanner').classList.add('show');
  }
}

function muddatTekshir() {
  const hozir = new Date();
  let ozgardi = false;
  vazifalar.forEach(v => {
    if(v.bajarilgan || !v.muddat) return;
    const muddat = new Date(v.muddat);
    const farq = muddat - hozir;
    const eslatmaMs = (v.eslatma || 0) * 60000;

    if(farq < 0 && !v.muddatOtdiXabar) {
      bildirishnomayuborish('Muddati otdi!', '"' + v.nomi + '" vazifasining muddati otib ketdi!', 'error');
      v.muddatOtdiXabar = true;
      ozgardi = true;
      document.getElementById('bellDot').classList.add('show');
    }
    if(eslatmaMs > 0 && farq > 0 && farq <= eslatmaMs && !v.eslatmaXabar) {
      const daqiqa = Math.round(farq / 60000);
      bildirishnomayuborish('Eslatma!', '"' + v.nomi + '" ' + daqiqa + ' daqiqadan keyin tugaydi!', 'warning');
      v.eslatmaXabar = true;
      ozgardi = true;
      document.getElementById('bellDot').classList.add('show');
    }
  });
  if(ozgardi) { saqlash(); royhatKorsatish(); }
}

function bildirishnomayuborish(sarlavha, matn, tur) {
  if(Notification.permission === 'granted') {
    new Notification(sarlavha, { body: matn });
  }
  xabar(matn, tur);
}

// ===== XABAR (TOAST) =====
function xabar(matn, tur) {
  tur = tur || 'info';
  var ikonlar = { success:'✅', error:'🔥', warning:'⚠️', info:'💡' };
  var wrap = document.getElementById('toastWrap');
  var el = document.createElement('div');
  el.className = 'toast t-' + tur;
  el.innerHTML = '<span class="toast-ico">' + (ikonlar[tur]||'💡') + '</span>' +
    '<span class="toast-msg">' + matn + '</span>' +
    '<button class="toast-x" onclick="this.parentElement.remove()">✕</button>';
  wrap.appendChild(el);
  setTimeout(function() {
    el.classList.add('hide');
    setTimeout(function() { el.remove(); }, 300);
  }, 4500);
}

// ===== MODAL =====
function modalOch(vazifa) {
  vazifa = vazifa || null;
  tahrirlashId = vazifa ? vazifa.id : null;
  kichikVazifalar = vazifa ? JSON.parse(JSON.stringify(vazifa.kichikVazifalar || [])) : [];
  document.getElementById('modalHeadTitle').textContent = vazifa ? 'Vazifani tahrirlash' : 'Yangi vazifa';
  document.getElementById('fTitle').value = vazifa ? vazifa.nomi : '';
  document.getElementById('fDesc').value = vazifa ? vazifa.tavsif : '';
  document.getElementById('fPriority').value = vazifa ? vazifa.prioritet : 'urta';
  document.getElementById('fCat').value = vazifa ? vazifa.kategoriya : 'ish';
  document.getElementById('fReminder').value = vazifa ? (vazifa.eslatma || 0) : 0;
  document.getElementById('fTitleCount').textContent = (vazifa ? vazifa.nomi.length : 0) + '/100';
  if(vazifa && vazifa.muddat) {
    var d = new Date(vazifa.muddat);
    document.getElementById('fDate').value = d.toISOString().split('T')[0];
    document.getElementById('fTime').value = d.toTimeString().slice(0,5);
  } else {
    document.getElementById('fDate').value = '';
    document.getElementById('fTime').value = '';
  }
  kichikRoyhatKorsatish();
  document.getElementById('modalBg').classList.add('open');
  setTimeout(function() { document.getElementById('fTitle').focus(); }, 100);
}

function modalYop() {
  document.getElementById('modalBg').classList.remove('open');
  tahrirlashId = null;
  kichikVazifalar = [];
}

// ===== KICHIK VAZIFALAR =====
function kichikVazifaQosh() {
  var inp = document.getElementById('fSubInput');
  var qiymat = inp.value.trim();
  if(!qiymat) return;
  kichikVazifalar.push({ id: Date.now(), matn: qiymat, bajarilgan: false });
  inp.value = '';
  kichikRoyhatKorsatish();
}

function kichikRoyhatKorsatish() {
  document.getElementById('subList').innerHTML = kichikVazifalar.map(function(s, i) {
    return '<li><span>' + xavfsizMatn(s.matn) + '</span>' +
      '<button onclick="kichikOchir(' + i + ')">✕</button></li>';
  }).join('');
}

function kichikOchir(i) {
  kichikVazifalar.splice(i, 1);
  kichikRoyhatKorsatish();
}

// ===== VAZIFA SAQLASH =====
function vazifaSaqla() {
  var nomi = document.getElementById('fTitle').value.trim();
  if(!nomi) { xabar("Vazifa nomini kiriting!", 'error'); return; }
  var sana = document.getElementById('fDate').value;
  var vaqt = document.getElementById('fTime').value || '23:59';
  var muddat = sana ? new Date(sana + 'T' + vaqt).toISOString() : null;

  var yangiVazifa = {
    id: tahrirlashId || Date.now(),
    nomi: nomi,
    tavsif: document.getElementById('fDesc').value.trim(),
    prioritet: document.getElementById('fPriority').value,
    kategoriya: document.getElementById('fCat').value,
    eslatma: parseInt(document.getElementById('fReminder').value),
    muddat: muddat,
    kichikVazifalar: JSON.parse(JSON.stringify(kichikVazifalar)),
    bajarilgan: false,
    yaratilgan: Date.now(),
    muddatOtdiXabar: false,
    eslatmaXabar: false
  };

  if(tahrirlashId) {
    var idx = vazifalar.findIndex(function(v) { return v.id === tahrirlashId; });
    if(idx > -1) {
      yangiVazifa.bajarilgan = vazifalar[idx].bajarilgan;
      yangiVazifa.yaratilgan = vazifalar[idx].yaratilgan;
      vazifalar[idx] = yangiVazifa;
    }
    xabar('Vazifa yangilandi!', 'success');
  } else {
    vazifalar.unshift(yangiVazifa);
    xabar("Yangi vazifa qo'shildi! 🎉", 'success');
  }
  saqlash();
  modalYop();
  sahifaYangilash();
}

// ===== BAJARILGAN =====
function bajarilganBelgila(id) {
  var v = vazifalar.find(function(v) { return v.id === id; });
  if(!v) return;
  v.bajarilgan = !v.bajarilgan;
  if(v.bajarilgan) xabar('"' + v.nomi + '" bajarildi! 🎉', 'success');
  saqlash();
  sahifaYangilash();
}

// ===== O'CHIRISH =====
function vazifaOchir(id) {
  var v = vazifalar.find(function(v) { return v.id === id; });
  if(!v) return;
  if(!confirm('"' + v.nomi + '" ochirisinmi?')) return;
  vazifalar = vazifalar.filter(function(v) { return v.id !== id; });
  saqlash();
  sahifaYangilash();
  xabar("Vazifa o'chirildi", 'warning');
}

// ===== LOCALSTORAGE =====
function saqlash() {
  localStorage.setItem('taskflow_v2', JSON.stringify(vazifalar));
}

// ===== FILTERLASH =====
function filterlash() {
  var hozir = new Date();
  var bugun = hozir.toDateString();
  var qidiruv = document.getElementById('searchInput').value.toLowerCase();

  var natija = vazifalar.filter(function(v) {
    if(qidiruv && v.nomi.toLowerCase().indexOf(qidiruv) === -1 && (v.tavsif||'').toLowerCase().indexOf(qidiruv) === -1) return false;
    if(joriyKat !== 'all' && v.kategoriya !== joriyKat) return false;
    if(joriyPrioritet !== 'all' && v.prioritet !== joriyPrioritet) return false;
    if(joriyFilter === 'bajarilgan') return v.bajarilgan;
    if(joriyFilter === 'bugun') return v.muddat && new Date(v.muddat).toDateString() === bugun && !v.bajarilgan;
    if(joriyFilter === 'kelgusi') return v.muddat && new Date(v.muddat) > hozir && !v.bajarilgan;
    if(joriyFilter === 'otgan') return v.muddat && new Date(v.muddat) < hozir && !v.bajarilgan;
    return true;
  });

  if(joriySort === 'muddat') {
    natija.sort(function(a,b) {
      if(!a.muddat) return 1;
      if(!b.muddat) return -1;
      return new Date(a.muddat) - new Date(b.muddat);
    });
  } else if(joriySort === 'prioritet') {
    var p = {yuqori:0, urta:1, past:2};
    natija.sort(function(a,b) { return p[a.prioritet] - p[b.prioritet]; });
  } else if(joriySort === 'alifbo') {
    natija.sort(function(a,b) { return a.nomi.localeCompare(b.nomi); });
  } else {
    natija.sort(function(a,b) { return b.yaratilgan - a.yaratilgan; });
  }
  return natija;
}

// ===== ROYHAT =====
function royhatKorsatish() {
  var natija = filterlash();
  var grid = document.getElementById('taskGrid');
  var empty = document.getElementById('emptyBox');
  if(natija.length === 0) {
    grid.innerHTML = '';
    empty.classList.add('show');
  } else {
    empty.classList.remove('show');
    grid.innerHTML = natija.map(function(v) { return vazifaKartasi(v); }).join('');
  }
  statistikaYangilash();
}

// ===== VAZIFA KARTASI =====
function vazifaKartasi(v) {
  var hozir = new Date();
  var muddatOtdi = v.muddat && !v.bajarilgan && new Date(v.muddat) < hozir;
  var bugunMi = v.muddat && new Date(v.muddat).toDateString() === hozir.toDateString();
  var pLabels = { yuqori:'Yuqori', urta:"O'rta", past:'Past' };
  var katLabels = { ish:'Ish', shaxsiy:'Shaxsiy', xarid:'Xarid', salomatlik:'Salomatlik', talim:"Ta'lim" };
  var katEmoji = { ish:'💼', shaxsiy:'👤', xarid:'🛒', salomatlik:'❤️', talim:'📚' };

  var muddatHtml = '';
  if(v.muddat) {
    var d = new Date(v.muddat);
    var sana = d.toLocaleDateString('uz-UZ', {day:'2-digit', month:'short', year:'numeric'});
    var vaqt = d.toLocaleTimeString('uz-UZ', {hour:'2-digit', minute:'2-digit'});
    var cls = muddatOtdi ? 'red' : bugunMi ? 'orange' : '';
    var ikon = muddatOtdi ? '🔥' : bugunMi ? '⚡' : '📅';
    muddatHtml = '<span class="tc-deadline ' + cls + '">' + ikon + ' ' + sana + ' ' + vaqt + '</span>';
  }

  var subHtml = '';
  if(v.kichikVazifalar && v.kichikVazifalar.length > 0) {
    var bajCount = v.kichikVazifalar.filter(function(s) { return s.bajarilgan; }).length;
    var foiz = Math.round((bajCount / v.kichikVazifalar.length) * 100);
    subHtml = '<div class="tc-sub-progress">' +
      '<div class="tc-sub-label">' + bajCount + '/' + v.kichikVazifalar.length + ' kichik vazifa bajarildi</div>' +
      '<div class="tc-sub-track"><div class="tc-sub-fill" style="width:' + foiz + '%"></div></div>' +
      '</div>';
  }

  return '<div class="task-card ' + (v.bajarilgan ? 'done' : '') + ' ' + (muddatOtdi ? 'overdue-card' : '') + '"' +
    ' draggable="true"' +
    ' ondragstart="sudraStart(event,' + v.id + ')"' +
    ' ondragover="sudraUstida(event)"' +
    ' ondrop="sudraTushir(event,' + v.id + ')">' +
    '<button class="tc-check ' + (v.bajarilgan ? 'checked' : '') + '"' +
    ' onclick="bajarilganBelgila(' + v.id + ')">' +
    (v.bajarilgan ? '✓' : '') + '</button>' +
    '<div class="tc-body">' +
    '<div class="tc-title">' + xavfsizMatn(v.nomi) + '</div>' +
    (v.tavsif ? '<div class="tc-desc">' + xavfsizMatn(v.tavsif) + '</div>' : '') +
    '<div class="tc-meta">' +
    '<span class="badge b-' + v.prioritet + '">' + (pLabels[v.prioritet] || v.prioritet) + '</span>' +
    '<span class="badge-cat">' + (katEmoji[v.kategoriya]||'') + ' ' + (katLabels[v.kategoriya]||v.kategoriya) + '</span>' +
    muddatHtml +
    '</div>' +
    subHtml +
    '</div>' +
    '<div class="tc-actions">' +
    '<button class="tc-btn edit" onclick="modalOch(vazifalar.find(function(v){return v.id===' + v.id + '}))" title="Tahrirlash">✏️</button>' +
    '<button class="tc-btn del" onclick="vazifaOchir(' + v.id + ')" title="Ochirish">🗑️</button>' +
    '</div></div>';
}

// ===== STATISTIKA =====
function statistikaYangilash() {
  var hozir = new Date();
  var bugun = hozir.toDateString();
  var jami = vazifalar.length;
  var bajarilgan = vazifalar.filter(function(v) { return v.bajarilgan; }).length;
  var kutilmoqda = vazifalar.filter(function(v) { return !v.bajarilgan; }).length;
  var otgan = vazifalar.filter(function(v) { return v.muddat && !v.bajarilgan && new Date(v.muddat) < hozir; }).length;
  var kelgusi = vazifalar.filter(function(v) { return v.muddat && new Date(v.muddat) > hozir && !v.bajarilgan; }).length;
  var foiz = jami > 0 ? Math.round((bajarilgan / jami) * 100) : 0;

  document.getElementById('stJami').textContent = jami;
  document.getElementById('stBajarilgan').textContent = bajarilgan;
  document.getElementById('stKutilmoqda').textContent = kutilmoqda;
  document.getElementById('stOtgan').textContent = otgan;
  document.getElementById('progressFill').style.width = foiz + '%';
  document.getElementById('progressPct').textContent = foiz + '%';
  document.getElementById('progressHint').textContent =
    foiz === 0 ? 'Hali birorta vazifa bajarilmagan' :
    foiz === 100 ? 'Barcha vazifalar bajarildi! 🎉' :
    bajarilgan + ' ta bajarildi, ' + kutilmoqda + ' ta qoldi';

  document.getElementById('cnt-all').textContent = kutilmoqda;
  document.getElementById('cnt-bugun').textContent = vazifalar.filter(function(v) {
    return v.muddat && new Date(v.muddat).toDateString() === bugun && !v.bajarilgan;
  }).length;
  document.getElementById('cnt-kelgusi').textContent = kelgusi;
  document.getElementById('cnt-otgan').textContent = otgan;
  document.getElementById('cnt-bajarilgan').textContent = bajarilgan;
}

// ===== SAHIFA =====
function sahifaYangilash() { royhatKorsatish(); }

function sahifaNominiYangilash() {
  var nomlar = {
    all:        ['Barcha vazifalar',     'Bugun ham maqsadlaringizga erishishingiz mumkin!'],
    bugun:      ['Bugungi vazifalar',    'Bugun nima qilish kerak?'],
    kelgusi:    ['Kelgusi vazifalar',    'Oldinda nima bor?'],
    otgan:      ["Muddati o'tgan",       'Ularni tezda bajaring!'],
    bajarilgan: ['Bajarilgan vazifalar', 'Ajoyib ish! 🎉']
  };
  var info = nomlar[joriyFilter] || nomlar.all;
  document.getElementById('pageTitle').textContent = info[0];
  document.getElementById('pageSub').textContent = info[1];
}

// ===== TEMA =====
function temaAlmashtir() {
  var html = document.documentElement;
  var tungi = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', tungi ? 'light' : 'dark');
  document.getElementById('themeEmoji').textContent = tungi ? '🌙' : '☀️';
  document.getElementById('themeText').textContent = tungi ? 'Tungi rejim' : 'Kunduzgi rejim';
  localStorage.setItem('taskflow_tema', tungi ? 'light' : 'dark');
}

// ===== DRAG & DROP =====
function sudraStart(e, id) {
  sudralayotgan = id;
  setTimeout(function() {
    var el = e.target.closest('.task-card');
    if(el) el.classList.add('dragging');
  }, 0);
}
function sudraUstida(e) { e.preventDefault(); }
function sudraTushir(e, targetId) {
  e.preventDefault();
  if(!sudralayotgan || sudralayotgan === targetId) { sudralayotgan = null; return; }
  var fromIdx = vazifalar.findIndex(function(v) { return v.id === sudralayotgan; });
  var toIdx = vazifalar.findIndex(function(v) { return v.id === targetId; });
  if(fromIdx > -1 && toIdx > -1) {
    var kochirildi = vazifalar.splice(fromIdx, 1)[0];
    vazifalar.splice(toIdx, 0, kochirildi);
    saqlash();
    royhatKorsatish();
  }
  sudralayotgan = null;
  document.querySelectorAll('.task-card').forEach(function(c) { c.classList.remove('dragging'); });
}

// ===== XAVFSIZ MATN =====
function xavfsizMatn(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== DEMO VAZIFALAR =====
function demoVazifalarQosh() {
  if(vazifalar.length > 0) return;
  var hozir = new Date();
  var ertaga = new Date(hozir); ertaga.setDate(ertaga.getDate() + 1);
  var kecha = new Date(hozir); kecha.setDate(kecha.getDate() - 1);
  var keyingiHafta = new Date(hozir); keyingiHafta.setDate(keyingiHafta.getDate() + 7);
  var bugunKechqurun = new Date(hozir.getFullYear(), hozir.getMonth(), hozir.getDate(), 18, 0);

  vazifalar = [
    {
      id:1, nomi:"Loyiha taqdimotini tayyorlash",
      tavsif:"Mijoz uchun yangi loyiha taqdimotini tayyorlash va slaydlarni bezash",
      prioritet:'yuqori', kategoriya:'ish',
      muddat: ertaga.toISOString(), eslatma:60,
      kichikVazifalar:[
        {id:11, matn:"Slaydlar tuzish", bajarilgan:true},
        {id:12, matn:"Grafiklar qo'shish", bajarilgan:false},
        {id:13, matn:"Matn tekshirish", bajarilgan:false}
      ],
      bajarilgan:false, yaratilgan:Date.now()-86400000,
      muddatOtdiXabar:false, eslatmaXabar:false
    },
    {
      id:2, nomi:"Ingliz tili darsi",
      tavsif:"Online dars — B2 darajasi, grammatika mashqlari",
      prioritet:'urta', kategoriya:'talim',
      muddat: bugunKechqurun.toISOString(), eslatma:30,
      kichikVazifalar:[],
      bajarilgan:false, yaratilgan:Date.now()-3600000,
      muddatOtdiXabar:false, eslatmaXabar:false
    },
    {
      id:3, nomi:"Supermarketdan xarid qilish",
      tavsif:"Haftalik oziq-ovqat xaridi",
      prioritet:'past', kategoriya:'xarid',
      muddat:null, eslatma:0,
      kichikVazifalar:[
        {id:31, matn:"Non va sut", bajarilgan:true},
        {id:32, matn:"Tuxum va sabzavot", bajarilgan:false},
        {id:33, matn:"Meva va sharbat", bajarilgan:false}
      ],
      bajarilgan:false, yaratilgan:Date.now()-7200000,
      muddatOtdiXabar:false, eslatmaXabar:false
    },
    {
      id:4, nomi:"Oylik hisobot yozish",
      tavsif:"Moliyaviy hisobot va tahlil",
      prioritet:'yuqori', kategoriya:'ish',
      muddat: kecha.toISOString(), eslatma:0,
      kichikVazifalar:[],
      bajarilgan:false, yaratilgan:Date.now()-172800000,
      muddatOtdiXabar:false, eslatmaXabar:false
    },
    {
      id:5, nomi:"Sport zali mashg'uloti",
      tavsif:"Haftalik jismoniy mashqlar",
      prioritet:'urta', kategoriya:'salomatlik',
      muddat: keyingiHafta.toISOString(), eslatma:60,
      kichikVazifalar:[],
      bajarilgan:true, yaratilgan:Date.now()-259200000,
      muddatOtdiXabar:false, eslatmaXabar:false
    },
    {
      id:6, nomi:"Kitob o'qish",
      tavsif:"Atomic Habits kitobini tugatish",
      prioritet:'past', kategoriya:'shaxsiy',
      muddat: keyingiHafta.toISOString(), eslatma:0,
      kichikVazifalar:[
        {id:61, matn:"1-5 boblar", bajarilgan:true},
        {id:62, matn:"6-10 boblar", bajarilgan:true},
        {id:63, matn:"11-20 boblar", bajarilgan:false}
      ],
      bajarilgan:false, yaratilgan:Date.now()-345600000,
      muddatOtdiXabar:false, eslatmaXabar:false
    }
  ];
  saqlash();
}
