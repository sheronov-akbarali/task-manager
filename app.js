// ===== STORAGE =====
function dbGet(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function dbSet(k,v){localStorage.setItem(k,JSON.stringify(v));}

function foydalanuvchilarOl(){
  var u=dbGet("tf_users");
  if(!u){u=[{username:"admin",password:"1234",ism:"Admin"}];dbSet("tf_users",u);}
  return u;
}
function joriyFoydalanuvchi(){return dbGet("tf_session");}
function sessiyaSaqla(u){dbSet("tf_session",u);}
function sessiyaOchir(){localStorage.removeItem("tf_session");}
function vazifalarKaliti(){var u=joriyFoydalanuvchi();return u?"tf_tasks_"+u.username:"tf_tasks_guest";}
function vazifalarOl(){return dbGet(vazifalarKaliti())||[];}
function vazifalarSaqla(v){dbSet(vazifalarKaliti(),v);}

// ===== AUTH =====
function authTab(tab){
  document.getElementById("tabKirish").classList.toggle("active",tab==="kirish");
  document.getElementById("tabRoyxat").classList.toggle("active",tab==="royxat");
  document.getElementById("formKirish").style.display=tab==="kirish"?"flex":"none";
  document.getElementById("formRoyxat").style.display=tab==="royxat"?"flex":"none";
}
function kozsuzlik(id,btn){
  var i=document.getElementById(id);
  if(i.type==="password"){i.type="text";btn.textContent="🙈";}
  else{i.type="password";btn.textContent="👁️";}
}
function kirish(e){
  e.preventDefault();
  var un=document.getElementById("kUsername").value.trim();
  var pw=document.getElementById("kPassword").value;
  var el=document.getElementById("kirishXato");
  el.classList.remove("show");
  if(!un||!pw){el.textContent="Barcha maydonlarni toldiring!";el.classList.add("show");return;}
  var users=foydalanuvchilarOl();
  var user=users.find(function(u){return u.username===un&&u.password===pw;});
  if(!user){el.textContent="Username yoki parol notogri!";el.classList.add("show");return;}
  sessiyaSaqla(user);ilovaYuklash();
}
function royxatdan(e){
  e.preventDefault();
  var ism=document.getElementById("rIsm").value.trim();
  var un=document.getElementById("rUsername").value.trim();
  var pw=document.getElementById("rPassword").value;
  var pw2=document.getElementById("rPassword2").value;
  var el=document.getElementById("royxatXato");
  el.classList.remove("show");
  if(!ism||!un||!pw){el.textContent="Barcha maydonlarni toldiring!";el.classList.add("show");return;}
  if(pw!==pw2){el.textContent="Parollar mos kelmadi!";el.classList.add("show");return;}
  if(pw.length<4){el.textContent="Parol kamida 4 ta belgi!";el.classList.add("show");return;}
  var users=foydalanuvchilarOl();
  if(users.find(function(u){return u.username===un;})){el.textContent="Bu username band!";el.classList.add("show");return;}
  var nu={username:un,password:pw,ism:ism};
  users.push(nu);dbSet("tf_users",users);sessiyaSaqla(nu);ilovaYuklash();
}
function chiqish(){
  if(!confirm("Chiqmoqchimisiz?"))return;
  sessiyaOchir();
  document.getElementById("appPage").style.display="none";
  document.getElementById("authPage").style.display="flex";
}

// ===== ILOVA YUKLASH =====
function ilovaYuklash(){
  var user=joriyFoydalanuvchi();if(!user)return;
  document.getElementById("authPage").style.display="none";
  document.getElementById("appPage").style.display="block";
  document.getElementById("userName").textContent=user.ism||user.username;
  document.getElementById("userAvatar").textContent=(user.ism||user.username).charAt(0).toUpperCase();
  var tema=dbGet("tf_tema_"+user.username);
  if(tema==="dark"){
    document.documentElement.setAttribute("data-theme","dark");
    document.getElementById("themeEmoji").textContent="☀️";
    document.getElementById("themeText").textContent="Kunduzgi rejim";
  }else{
    document.documentElement.setAttribute("data-theme","light");
    document.getElementById("themeEmoji").textContent="🌙";
    document.getElementById("themeText").textContent="Tungi rejim";
  }
  demoVazifalarQosh();sahifaYangilash();bildirishnomaTekshir();
  setInterval(muddatTekshir,30000);muddatTekshir();
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded",function(){
  var user=joriyFoydalanuvchi();
  if(user){ilovaYuklash();}
  else{document.getElementById("authPage").style.display="flex";document.getElementById("appPage").style.display="none";}
  hodisalarBoglash();pwaYuklash();
});// ===== HOLATLAR =====
var joriyFilter="all",joriyKat="all",joriyPrioritet="all",joriySort="yangi";
var tahrirlashId=null,kichikVazifalar=[],sudralayotgan=null;

// ===== HODISALAR =====
function hodisalarBoglash(){
  document.getElementById("openModalBtn").onclick=function(){modalOch();};
  document.getElementById("closeModalBtn").onclick=modalYop;
  document.getElementById("cancelModalBtn").onclick=modalYop;
  document.getElementById("saveTaskBtn").onclick=vazifaSaqla;
  document.getElementById("modalBg").onclick=function(e){if(e.target.id==="modalBg")modalYop();};
  document.getElementById("searchInput").oninput=royhatKorsatish;
  document.getElementById("sortSel").onchange=function(e){joriySort=e.target.value;royhatKorsatish();};
  document.getElementById("fTitle").oninput=function(){document.getElementById("fTitleCount").textContent=this.value.length+"/100";};
  document.getElementById("addSubBtn").onclick=kichikVazifaQosh;
  document.getElementById("fSubInput").onkeydown=function(e){if(e.key==="Enter")kichikVazifaQosh();};
  document.getElementById("allowNotif").onclick=function(){
    Notification.requestPermission().then(function(p){
      if(p==="granted")xabar("Bildirishnomalar yoqildi!","success");
      document.getElementById("notifBanner").classList.remove("show");
    });
  };
  document.getElementById("dismissBanner").onclick=function(){document.getElementById("notifBanner").classList.remove("show");};
  document.getElementById("themeBtn").onclick=temaAlmashtir;
  document.getElementById("logoutBtn").onclick=chiqish;
  document.getElementById("burgerBtn").onclick=function(){document.getElementById("sidebar").classList.toggle("mini");};
  document.getElementById("mobileBurger").onclick=function(){
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("show");
  };
  document.getElementById("sidebarOverlay").onclick=function(){
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("show");
  };
  document.getElementById("mobileAdd").onclick=function(){modalOch();};
  document.getElementById("bnAdd").onclick=function(){modalOch();};
  document.querySelectorAll(".sn-item").forEach(function(btn){
    btn.onclick=function(){
      document.querySelectorAll(".sn-item").forEach(function(b){b.classList.remove("active");});
      btn.classList.add("active");
      joriyFilter=btn.dataset.filter;
      sahifaNominiYangilash();royhatKorsatish();
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("sidebarOverlay").classList.remove("show");
    };
  });
  document.querySelectorAll(".sc-item").forEach(function(btn){
    btn.onclick=function(){
      document.querySelectorAll(".sc-item").forEach(function(b){b.classList.remove("active");});
      btn.classList.add("active");joriyKat=btn.dataset.cat;royhatKorsatish();
    };
  });
  document.querySelectorAll(".pt").forEach(function(btn){
    btn.onclick=function(){
      document.querySelectorAll(".pt").forEach(function(b){b.classList.remove("active");});
      btn.classList.add("active");joriyPrioritet=btn.dataset.p;royhatKorsatish();
    };
  });
  document.querySelectorAll(".bn-item[data-filter]").forEach(function(btn){
    btn.onclick=function(){
      document.querySelectorAll(".bn-item").forEach(function(b){b.classList.remove("active");});
      btn.classList.add("active");
      joriyFilter=btn.dataset.filter;
      document.querySelectorAll(".sn-item").forEach(function(b){b.classList.toggle("active",b.dataset.filter===joriyFilter);});
      sahifaNominiYangilash();royhatKorsatish();
    };
  });
}// ===== BILDIRISHNOMA =====
function bildirishnomaTekshir(){
  if(!("Notification" in window))return;
  if(Notification.permission==="default")document.getElementById("notifBanner").classList.add("show");
}
function muddatTekshir(){
  var v=vazifalarOl(),hozir=new Date(),ozgardi=false;
  v.forEach(function(t){
    if(t.bajarilgan||!t.muddat)return;
    var m=new Date(t.muddat),farq=m-hozir,esMs=(t.eslatma||0)*60000;
    if(farq<0&&!t.muddatOtdiXabar){
      bildirishnomayuborish("Muddati otdi!",t.nomi+" vazifasining muddati otdi!","error");
      t.muddatOtdiXabar=true;ozgardi=true;
      document.getElementById("bellDot").classList.add("show");
    }
    if(esMs>0&&farq>0&&farq<=esMs&&!t.eslatmaXabar){
      var d=Math.round(farq/60000);
      bildirishnomayuborish("Eslatma!",t.nomi+" "+d+" daqiqadan keyin tugaydi!","warning");
      t.eslatmaXabar=true;ozgardi=true;
      document.getElementById("bellDot").classList.add("show");
    }
  });
  if(ozgardi){vazifalarSaqla(v);royhatKorsatish();}
}
function bildirishnomayuborish(s,m,t){
  if(Notification.permission==="granted")new Notification(s,{body:m});
  xabar(m,t);
}

// ===== XABAR (TOAST) =====
function xabar(matn,tur){
  tur=tur||"info";
  var ico={success:"✅",error:"🔥",warning:"⚠️",info:"💡"};
  var wrap=document.getElementById("toastWrap");
  var el=document.createElement("div");
  el.className="toast t-"+tur;
  el.innerHTML="<span class=\"toast-ico\">"+ico[tur]+"</span><span class=\"toast-msg\">"+matn+"</span><button class=\"toast-x\" onclick=\"this.parentElement.remove()\">✕</button>";
  wrap.appendChild(el);
  setTimeout(function(){el.classList.add("hide");setTimeout(function(){el.remove();},300);},4500);
}

// ===== MODAL =====
function modalOch(vazifa){
  vazifa=vazifa||null;
  tahrirlashId=vazifa?vazifa.id:null;
  kichikVazifalar=vazifa?JSON.parse(JSON.stringify(vazifa.kichikVazifalar||[])):[];
  document.getElementById("modalHeadTitle").textContent=vazifa?"Vazifani tahrirlash":"Yangi vazifa";
  document.getElementById("fTitle").value=vazifa?vazifa.nomi:"";
  document.getElementById("fDesc").value=vazifa?vazifa.tavsif:"";
  document.getElementById("fPriority").value=vazifa?vazifa.prioritet:"urta";
  document.getElementById("fCat").value=vazifa?vazifa.kategoriya:"ish";
  document.getElementById("fReminder").value=vazifa?(vazifa.eslatma||0):0;
  document.getElementById("fTitleCount").textContent=(vazifa?vazifa.nomi.length:0)+"/100";
  if(vazifa&&vazifa.muddat){
    var d=new Date(vazifa.muddat);
    document.getElementById("fDate").value=d.toISOString().split("T")[0];
    document.getElementById("fTime").value=d.toTimeString().slice(0,5);
  }else{document.getElementById("fDate").value="";document.getElementById("fTime").value="";}
  kichikRoyhatKorsatish();
  document.getElementById("modalBg").classList.add("open");
  setTimeout(function(){document.getElementById("fTitle").focus();},100);
}
function modalYop(){
  document.getElementById("modalBg").classList.remove("open");
  tahrirlashId=null;kichikVazifalar=[];
}

// ===== KICHIK VAZIFALAR =====
function kichikVazifaQosh(){
  var inp=document.getElementById("fSubInput"),q=inp.value.trim();
  if(!q)return;
  kichikVazifalar.push({id:Date.now(),matn:q,bajarilgan:false});
  inp.value="";kichikRoyhatKorsatish();
}
function kichikRoyhatKorsatish(){
  document.getElementById("subList").innerHTML=kichikVazifalar.map(function(s,i){
    return "<li><span>"+xavfsizMatn(s.matn)+"</span><button onclick=\"kichikOchir("+i+")\">✕</button></li>";
  }).join("");
}
function kichikOchir(i){kichikVazifalar.splice(i,1);kichikRoyhatKorsatish();}

// ===== VAZIFA SAQLASH =====
function vazifaSaqla(){
  var nomi=document.getElementById("fTitle").value.trim();
  if(!nomi){xabar("Vazifa nomini kiriting!","error");return;}
  var sana=document.getElementById("fDate").value;
  var vaqt=document.getElementById("fTime").value||"23:59";
  var muddat=sana?new Date(sana+"T"+vaqt).toISOString():null;
  var v=vazifalarOl();
  var yangi={
    id:tahrirlashId||Date.now(),nomi:nomi,
    tavsif:document.getElementById("fDesc").value.trim(),
    prioritet:document.getElementById("fPriority").value,
    kategoriya:document.getElementById("fCat").value,
    eslatma:parseInt(document.getElementById("fReminder").value),
    muddat:muddat,kichikVazifalar:JSON.parse(JSON.stringify(kichikVazifalar)),
    bajarilgan:false,yaratilgan:Date.now(),muddatOtdiXabar:false,eslatmaXabar:false
  };
  if(tahrirlashId){
    var idx=v.findIndex(function(t){return t.id===tahrirlashId;});
    if(idx>-1){yangi.bajarilgan=v[idx].bajarilgan;yangi.yaratilgan=v[idx].yaratilgan;v[idx]=yangi;}
    xabar("Vazifa yangilandi!","success");
  }else{v.unshift(yangi);xabar("Yangi vazifa qoshildi!","success");}
  vazifalarSaqla(v);modalYop();sahifaYangilash();
}

// ===== BAJARILGAN =====
function bajarilganBelgila(id){
  var v=vazifalarOl();
  var t=v.find(function(t){return t.id===id;});
  if(!t)return;
  t.bajarilgan=!t.bajarilgan;
  if(t.bajarilgan)xabar(t.nomi+" bajarildi!","success");
  vazifalarSaqla(v);sahifaYangilash();
}

// ===== OCHIRISH =====
function vazifaOchir(id){
  var v=vazifalarOl();
  var t=v.find(function(t){return t.id===id;});
  if(!t||!confirm(t.nomi+" ochirilsinmi?"))return;
  vazifalarSaqla(v.filter(function(t){return t.id!==id;}));
  sahifaYangilash();xabar("Vazifa ochirildi","warning");
}// ===== FILTERLASH =====
function filterlash(){
  var v=vazifalarOl(),hozir=new Date(),bugun=hozir.toDateString();
  var q=document.getElementById("searchInput").value.toLowerCase();
  var r=v.filter(function(t){
    if(q&&t.nomi.toLowerCase().indexOf(q)===-1&&(t.tavsif||"").toLowerCase().indexOf(q)===-1)return false;
    if(joriyKat!=="all"&&t.kategoriya!==joriyKat)return false;
    if(joriyPrioritet!=="all"&&t.prioritet!==joriyPrioritet)return false;
    if(joriyFilter==="bajarilgan")return t.bajarilgan;
    if(joriyFilter==="bugun")return t.muddat&&new Date(t.muddat).toDateString()===bugun&&!t.bajarilgan;
    if(joriyFilter==="kelgusi")return t.muddat&&new Date(t.muddat)>hozir&&!t.bajarilgan;
    if(joriyFilter==="otgan")return t.muddat&&new Date(t.muddat)<hozir&&!t.bajarilgan;
    return true;
  });
  if(joriySort==="muddat")r.sort(function(a,b){if(!a.muddat)return 1;if(!b.muddat)return -1;return new Date(a.muddat)-new Date(b.muddat);});
  else if(joriySort==="prioritet"){var p={yuqori:0,urta:1,past:2};r.sort(function(a,b){return p[a.prioritet]-p[b.prioritet];});}
  else if(joriySort==="alifbo")r.sort(function(a,b){return a.nomi.localeCompare(b.nomi);});
  else r.sort(function(a,b){return b.yaratilgan-a.yaratilgan;});
  return r;
}

// ===== ROYHAT =====
function royhatKorsatish(){
  var r=filterlash();
  var grid=document.getElementById("taskGrid");
  var empty=document.getElementById("emptyBox");
  if(r.length===0){grid.innerHTML="";empty.classList.add("show");}
  else{empty.classList.remove("show");grid.innerHTML=r.map(function(t){return vazifaKartasi(t);}).join("");}
  statistikaYangilash();
}

// ===== VAZIFA KARTASI =====
function vazifaKartasi(t){
  var hozir=new Date();
  var otdi=t.muddat&&!t.bajarilgan&&new Date(t.muddat)<hozir;
  var bugunMi=t.muddat&&new Date(t.muddat).toDateString()===hozir.toDateString();
  var pL={yuqori:"Yuqori",urta:"Orta",past:"Past"};
  var kL={ish:"Ish",shaxsiy:"Shaxsiy",xarid:"Xarid",salomatlik:"Salomatlik",talim:"Talim"};
  var kE={ish:"💼",shaxsiy:"👤",xarid:"🛒",salomatlik:"❤️",talim:"📚"};
  var mHtml="";
  if(t.muddat){
    var d=new Date(t.muddat);
    var sana=d.toLocaleDateString("uz-UZ",{day:"2-digit",month:"short",year:"numeric"});
    var vaqt=d.toLocaleTimeString("uz-UZ",{hour:"2-digit",minute:"2-digit"});
    var cls=otdi?"red":bugunMi?"orange":"";
    var ico=otdi?"🔥":bugunMi?"⚡":"📅";
    mHtml="<span class=\"tc-deadline "+cls+"\">"+ico+" "+sana+" "+vaqt+"</span>";
  }
  var sHtml="";
  if(t.kichikVazifalar&&t.kichikVazifalar.length>0){
    var baj=t.kichikVazifalar.filter(function(s){return s.bajarilgan;}).length;
    var foiz=Math.round(baj/t.kichikVazifalar.length*100);
    sHtml="<div class=\"tc-sub-progress\"><div class=\"tc-sub-label\">"+baj+"/"+t.kichikVazifalar.length+" kichik vazifa</div><div class=\"tc-sub-track\"><div class=\"tc-sub-fill\" style=\"width:"+foiz+"%\"></div></div></div>";
  }
  return "<div class=\"task-card"+(t.bajarilgan?" done":"")+(otdi?" overdue-card":"")+"\""
    +" draggable=\"true\" ondragstart=\"sudraStart(event,"+t.id+")\" ondragover=\"sudraUstida(event)\" ondrop=\"sudraTushir(event,"+t.id+")\">"
    +"<button class=\"tc-check"+(t.bajarilgan?" checked":"")+"\""
    +" onclick=\"bajarilganBelgila("+t.id+")\">"+(t.bajarilgan?"✓":"")+"</button>"
    +"<div class=\"tc-body\">"
    +"<div class=\"tc-title\">"+xavfsizMatn(t.nomi)+"</div>"
    +(t.tavsif?"<div class=\"tc-desc\">"+xavfsizMatn(t.tavsif)+"</div>":"")
    +"<div class=\"tc-meta\">"
    +"<span class=\"badge b-"+t.prioritet+"\">"+pL[t.prioritet]+"</span>"
    +"<span class=\"badge-cat\">"+(kE[t.kategoriya]||"")+" "+(kL[t.kategoriya]||t.kategoriya)+"</span>"
    +mHtml+"</div>"+sHtml+"</div>"
    +"<div class=\"tc-actions\">"
    +"<button class=\"tc-btn edit\" onclick=\"editVazifa("+t.id+")\" title=\"Tahrirlash\">✏️</button>"
    +"<button class=\"tc-btn del\" onclick=\"vazifaOchir("+t.id+")\" title=\"Ochirish\">🗑️</button>"
    +"</div></div>";
}

function editVazifa(id){
  var v=vazifalarOl();
  var t=v.find(function(t){return t.id===id;});
  if(t)modalOch(t);
}

// ===== STATISTIKA =====
function statistikaYangilash(){
  var v=vazifalarOl(),hozir=new Date(),bugun=hozir.toDateString();
  var jami=v.length;
  var baj=v.filter(function(t){return t.bajarilgan;}).length;
  var kut=v.filter(function(t){return !t.bajarilgan;}).length;
  var otg=v.filter(function(t){return t.muddat&&!t.bajarilgan&&new Date(t.muddat)<hozir;}).length;
  var kel=v.filter(function(t){return t.muddat&&new Date(t.muddat)>hozir&&!t.bajarilgan;}).length;
  var foiz=jami>0?Math.round(baj/jami*100):0;
  document.getElementById("stJami").textContent=jami;
  document.getElementById("stBajarilgan").textContent=baj;
  document.getElementById("stKutilmoqda").textContent=kut;
  document.getElementById("stOtgan").textContent=otg;
  document.getElementById("progressFill").style.width=foiz+"%";
  document.getElementById("progressPct").textContent=foiz+"%";
  document.getElementById("progressHint").textContent=foiz===0?"Hali birorta vazifa bajarilmagan":foiz===100?"Barcha vazifalar bajarildi! 🎉":baj+" ta bajarildi, "+kut+" ta qoldi";
  document.getElementById("cnt-all").textContent=kut;
  document.getElementById("cnt-bugun").textContent=v.filter(function(t){return t.muddat&&new Date(t.muddat).toDateString()===bugun&&!t.bajarilgan;}).length;
  document.getElementById("cnt-kelgusi").textContent=kel;
  document.getElementById("cnt-otgan").textContent=otg;
  document.getElementById("cnt-bajarilgan").textContent=baj;
}

function sahifaYangilash(){royhatKorsatish();}

function sahifaNominiYangilash(){
  var n={all:["Barcha vazifalar","Bugun ham maqsadlaringizga erishishingiz mumkin!"],bugun:["Bugungi vazifalar","Bugun nima qilish kerak?"],kelgusi:["Kelgusi vazifalar","Oldinda nima bor?"],otgan:["Muddati otgan","Ularni tezda bajaring!"],bajarilgan:["Bajarilgan vazifalar","Ajoyib ish! 🎉"]};
  var i=n[joriyFilter]||n.all;
  document.getElementById("pageTitle").textContent=i[0];
  document.getElementById("pageSub").textContent=i[1];
}

// ===== TEMA =====
function temaAlmashtir(){
  var html=document.documentElement;
  var tungi=html.getAttribute("data-theme")==="dark";
  html.setAttribute("data-theme",tungi?"light":"dark");
  document.getElementById("themeEmoji").textContent=tungi?"🌙":"☀️";
  document.getElementById("themeText").textContent=tungi?"Tungi rejim":"Kunduzgi rejim";
  var u=joriyFoydalanuvchi();
  if(u)dbSet("tf_tema_"+u.username,tungi?"light":"dark");
}

// ===== DRAG & DROP =====
function sudraStart(e,id){sudralayotgan=id;setTimeout(function(){var el=e.target.closest(".task-card");if(el)el.classList.add("dragging");},0);}
function sudraUstida(e){e.preventDefault();}
function sudraTushir(e,tid){
  e.preventDefault();
  if(!sudralayotgan||sudralayotgan===tid){sudralayotgan=null;return;}
  var v=vazifalarOl();
  var fi=v.findIndex(function(t){return t.id===sudralayotgan;});
  var ti=v.findIndex(function(t){return t.id===tid;});
  if(fi>-1&&ti>-1){var m=v.splice(fi,1)[0];v.splice(ti,0,m);vazifalarSaqla(v);royhatKorsatish();}
  sudralayotgan=null;
  document.querySelectorAll(".task-card").forEach(function(c){c.classList.remove("dragging");});
}

// ===== XAVFSIZ MATN =====
function xavfsizMatn(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

// ===== DEMO VAZIFALAR =====
function demoVazifalarQosh(){
  if(vazifalarOl().length>0)return;
  var h=new Date();
  var ert=new Date(h);ert.setDate(ert.getDate()+1);
  var kec=new Date(h);kec.setDate(kec.getDate()-1);
  var haf=new Date(h);haf.setDate(haf.getDate()+7);
  var bkv=new Date(h.getFullYear(),h.getMonth(),h.getDate(),18,0);
  var demo=[
    {id:1,nomi:"Loyiha taqdimotini tayyorlash",tavsif:"Mijoz uchun yangi loyiha taqdimotini tayyorlash",prioritet:"yuqori",kategoriya:"ish",muddat:ert.toISOString(),eslatma:60,kichikVazifalar:[{id:11,matn:"Slaydlar tuzish",bajarilgan:true},{id:12,matn:"Grafiklar qoshish",bajarilgan:false},{id:13,matn:"Matn tekshirish",bajarilgan:false}],bajarilgan:false,yaratilgan:Date.now()-86400000,muddatOtdiXabar:false,eslatmaXabar:false},
    {id:2,nomi:"Ingliz tili darsi",tavsif:"Online dars B2 darajasi",prioritet:"urta",kategoriya:"talim",muddat:bkv.toISOString(),eslatma:30,kichikVazifalar:[],bajarilgan:false,yaratilgan:Date.now()-3600000,muddatOtdiXabar:false,eslatmaXabar:false},
    {id:3,nomi:"Supermarketdan xarid",tavsif:"Haftalik oziq-ovqat xaridi",prioritet:"past",kategoriya:"xarid",muddat:null,eslatma:0,kichikVazifalar:[{id:31,matn:"Non va sut",bajarilgan:true},{id:32,matn:"Tuxum va sabzavot",bajarilgan:false}],bajarilgan:false,yaratilgan:Date.now()-7200000,muddatOtdiXabar:false,eslatmaXabar:false},
    {id:4,nomi:"Oylik hisobot yozish",tavsif:"Moliyaviy hisobot va tahlil",prioritet:"yuqori",kategoriya:"ish",muddat:kec.toISOString(),eslatma:0,kichikVazifalar:[],bajarilgan:false,yaratilgan:Date.now()-172800000,muddatOtdiXabar:false,eslatmaXabar:false},
    {id:5,nomi:"Sport zali mashguloti",tavsif:"Haftalik jismoniy mashqlar",prioritet:"urta",kategoriya:"salomatlik",muddat:haf.toISOString(),eslatma:60,kichikVazifalar:[],bajarilgan:true,yaratilgan:Date.now()-259200000,muddatOtdiXabar:false,eslatmaXabar:false},
    {id:6,nomi:"Kitob oqish",tavsif:"Atomic Habits kitobini tugatish",prioritet:"past",kategoriya:"shaxsiy",muddat:haf.toISOString(),eslatma:0,kichikVazifalar:[{id:61,matn:"1-5 boblar",bajarilgan:true},{id:62,matn:"6-10 boblar",bajarilgan:true},{id:63,matn:"11-20 boblar",bajarilgan:false}],bajarilgan:false,yaratilgan:Date.now()-345600000,muddatOtdiXabar:false,eslatmaXabar:false}
  ];
  vazifalarSaqla(demo);
}

// ===== PWA =====
var deferredPrompt=null;
function pwaYuklash(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(function(e){console.log("SW:",e);});
  }
  window.addEventListener("beforeinstallprompt",function(e){
    e.preventDefault();deferredPrompt=e;
    if(!localStorage.getItem("tf_installed")){
      setTimeout(function(){var b=document.getElementById("installBanner");if(b)b.classList.add("show");},2500);
    }
  });
  var ib=document.getElementById("installBtn");
  var ic=document.getElementById("installClose");
  var isb=document.getElementById("installSideBtn");
  if(ib)ib.onclick=ilovaniOrnat;
  if(ic)ic.onclick=function(){document.getElementById("installBanner").classList.remove("show");};
  if(isb)isb.onclick=function(){if(deferredPrompt)ilovaniOrnat();else xabar("Ilova allaqachon ornatilgan","info");};
  if(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone){
    localStorage.setItem("tf_installed","1");ornatilganKorinish();
  }
  window.addEventListener("appinstalled",function(){
    localStorage.setItem("tf_installed","1");
    document.getElementById("installBanner").classList.remove("show");
    deferredPrompt=null;xabar("TaskFlow ornatildi! 🎉","success");ornatilganKorinish();
  });
}
function ilovaniOrnat(){
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(r){
    if(r.outcome==="accepted"){
      localStorage.setItem("tf_installed","1");
      document.getElementById("installBanner").classList.remove("show");
      setTimeout(function(){var m=document.getElementById("installModalBg");if(m)m.classList.add("open");},400);
      xabar("TaskFlow ornatildi! 🎉","success");ornatilganKorinish();
    }
    deferredPrompt=null;
  });
}
function ornatilganKorinish(){
  var b=document.getElementById("installSideBtn");
  if(b){b.innerHTML="<span>✅</span><span id=\"installSideText\">Ornatildi</span>";b.style.background="rgba(16,185,129,.15)";b.style.borderColor="rgba(16,185,129,.4)";b.style.color="#6ee7b7";}
}