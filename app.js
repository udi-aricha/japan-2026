function todayKey(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const m=p.find(x=>x.type==="month").value,d=p.find(x=>x.type==="day").value;return m+"-"+d}
function startKey(){const t=todayKey();if(DAYS.some(x=>x.d===t))return t;return t>"11-20"&&t<"12-31"?DAYS[DAYS.length-1].d:DAYS[0].d}
function daysToGo(){const now=new Date(),dep=new Date("2026-10-28T00:00:00+03:00");return Math.ceil((dep-now)/864e5)}
let cur=startKey(), tab="today";
const fmt=k=>{const[m,d]=k.split("-");return `${+d}/${+m}`};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){const e=document.getElementById("toast");e.textContent=t;e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>e.hidden=true,1800)}
function copy(t){try{navigator.clipboard.writeText(t).then(()=>toast("הועתק"),()=>toast(t))}catch(e){toast(t)}}
document.addEventListener("click",e=>{const c=e.target.closest("[data-copy]");if(c)copy(c.dataset.copy)});

const PIN='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const FLAME='<svg class="flame" viewBox="0 0 34 44"><path d="M17 4c4 6 7 9 7 14a7 7 0 01-14 0c0-3 2-5 3-7 1 3 2 4 4 4-1-4-1-7 0-11z" fill="var(--gold)"/><rect x="12" y="27" width="10" height="15" rx="2" fill="var(--gold)" opacity=".45"/></svg>';

const lnk=(l,cls)=>`<a class="btn ${cls||""}" href="${l[1]}" target="_blank" rel="noopener">${esc(l[0])} ↗</a>`;
function ciBlock(s,open){
  return s.ci?`<details class="fold"${open?" open":""}><summary>הוראות צ'ק-אין</summary><ul class="ci">${s.ci.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></details>`:"";
}
function stayBlock(k,full,open){
  const s=STAYS[k];
  return `${ciBlock(s,open)}<dl class="kv">
    <dt>כתובת</dt><dd><div class="jp" lang="ja">${esc(s.jp)}</div><div class="small muted mono">${esc(s.en)}</div></dd>
    <dt>טלפון</dt><dd class="mono">${esc(s.tel)}</dd>
    ${full?`<dt>הזמנה</dt><dd class="mono">${esc(s.ref)}</dd><dt>צ'ק-אין</dt><dd>${esc(s.in)}</dd><dt>צ'ק-אאוט</dt><dd>${esc(s.out)}</dd><dt>תשלום</dt><dd>${esc(s.pay)}</dd>`:""}
    <dt>כניסה</dt><dd>${esc(s.entry)}</dd></dl>
   <div class="btns">${s.map?`<a class="btn solid" href="${s.map}" target="_blank" rel="noopener">במפה</a><a class="btn" href="${s.nav}" target="_blank" rel="noopener">ניווט</a>`:`<a class="btn solid" href="${s.nav||G(s.en)}" target="_blank" rel="noopener">${esc(s.navLabel||"ניווט")}</a>`}
    <button class="btn" data-copy="${esc(s.jp)}">העתק כתובת ביפנית</button>
    <button class="btn" data-copy="${esc(s.tel)}">העתק טלפון</button>
    ${(s.links||[]).map(l=>lnk(l)).join("")}</div>`;
}

function mapPts(x){return x.pl.filter(p=>p[4]&&p[4].c).map(p=>({p,c:p[4].c,n:p[0],u:p[2]}))}
let LP=null;
function loadLeaflet(){if(window.L)return Promise.resolve();if(LP)return LP;
  LP=new Promise((ok,no)=>{const c=document.createElement("link");c.rel="stylesheet";c.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(c);
    const j=document.createElement("script");j.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";j.onload=ok;j.onerror=()=>{LP=null;no()};document.head.appendChild(j)});return LP}
function drawDayMap(){const el=document.getElementById("daymap");if(!el)return;const x=DAYS.find(d=>d.d===cur);const pts=mapPts(x);
  loadLeaflet().then(()=>{if(!document.body.contains(el))return;
    const m=L.map(el,{scrollWheelZoom:false,attributionControl:true,zoomControl:true});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(m);
    const all=[];
    pts.forEach((q,n)=>{const ic=L.divIcon({className:"mk"+(q.p[3]?" alt":""),html:`<span>${n+1}</span>`,iconSize:[28,28],iconAnchor:[14,14]});
      L.marker(q.c,{icon:ic,title:q.n}).addTo(m).bindPopup(`<b>${esc(q.n)}</b><br><a href="${q.u}" target="_blank" rel="noopener">פתח בגוגל מפות ↗</a>`);all.push(q.c)});
    const g=x.sleep&&GEO[x.sleep];if(g){const ic=L.divIcon({className:"mk home",html:"<span>🏠</span>",iconSize:[30,30],iconAnchor:[15,15]});
      L.marker([g[0],g[1]],{icon:ic,title:STAYS[x.sleep].name}).addTo(m).bindPopup(`<b>${esc(STAYS[x.sleep].name)}</b>`);all.push([g[0],g[1]])}
    m.fitBounds(all,{padding:[24,24],maxZoom:16});
  }).catch(()=>{const h=el.parentNode.querySelector('.maphint');if(h)h.remove();el.outerHTML='<div class="free small">המפה לא נטענה — אין קליטה. המקומות ברשימה למטה.</div>'})}
function dayView(k){
  const i=DAYS.findIndex(x=>x.d===k), x=DAYS[i], R=REG[x.r];
  const sh=x.sh?`<div class="shabbat">${FLAME}<div><div class="lbl">${x.sh[0]==="in"?"כניסת שבת":"צאת שבת"} · ${esc(R.he)}</div><div class="tm mono">${esc(x.sh[1])}</div><div class="n">${esc(x.sh[2])}</div></div></div>`:"";
  const fx=x.fx.length?`<section class="stack" style="gap:8px"><h2>בשעה קבועה</h2><div class="fixed">${x.fx.map(f=>`<div class="fx"><span class="t">${esc(f[0])}</span><div class="w"><div>${esc(f[1])}</div>${f[2]?`<div class="n">${esc(f[2])}</div>`:""}${f[3]?`<span class="remind">${esc(f[3])}</span>`:""}${f[4]?`<div style="margin-top:6px">${lnk(LINKS[f[4]],"sm")}</div>`:""}${bpFold(f[1])}${f[5]==="vjw"?vjwFold():""}</div></div>`).join("")}</div></section>`:"";
  const gd=x.guide?`<details class="fold pinfo"><summary>${esc(x.guide.title)}</summary><div class="stack" style="gap:4px;margin-top:6px">${x.guide.steps.map(g=>{const [a,...b]=g[2].split("\n");return `<details class="fold"><summary>${esc(g[0])} · ${esc(g[1])}</summary><p class="small" style="margin:6px 0 0;padding-inline:12px">${esc(a)}</p>${b.map(e=>`<p class="small muted" dir="ltr" style="text-align:left;margin:4px 0 0;padding:0 12px 8px">${esc(e)}</p>`).join("")}${g[3]==="vjw"?vjwFold():""}</details>`}).join("")}</div>${x.guide.note?`<p class="small muted" style="margin:6px 0 0">${esc(x.guide.note)}</p>`:""}</details>`:"";
  const tl=TASKS[k]||[];
  const tk=tl.length?`<details class="fold tasks"><summary>משימות <span class="count">${tl.length}</span></summary><div class="tlist">${tl.map(t=>`<a class="trow" href="${TD(t[2])}" target="_blank" rel="noopener"><span class="box p${t[1]}"></span><span>${esc(t[0])}</span></a>`).join("")}</div><p class="small muted" style="margin:6px 0 0">מסמנים ביצוע ב-Todoist.</p></details>`:"";
  const info=i=>i?`<details class="fold pinfo"><summary>שעות, מחיר וקישורים</summary><dl class="kv">${i.h?`<dt>שעות</dt><dd>${esc(i.h)}</dd>`:""}${i.p?`<dt>מחיר</dt><dd>${esc(i.p)}</dd>`:""}${i.v?`<dt>ודאות</dt><dd class="small muted">${esc(i.v)}</dd>`:""}</dl><div class="btns">${(i.links||[]).map(l=>lnk(l,"sm")).join("")}</div></details>`:"";
  const pl=x.pl.length?`<section class="stack" style="gap:8px"><h2>מה יש היום</h2><div class="places">${x.pl.map(p=>`<div class="place"><span class="pin">${p[4]&&p[4].c?`<b class="num">${mapPts(x).findIndex(m=>m.p===p)+1}</b>`:PIN}</span><div class="body"><h3>${esc(p[0])}${p[3]?'<span class="tag">הצעה</span>':""}</h3><p>${esc(p[1])}</p>${info(p[4])}${x.guide&&x.pl.indexOf(p)===(x.guide.at||0)?gd:""}</div><a class="go" href="${p[2]}" target="_blank" rel="noopener">לשם</a></div>`).join("")}</div></section>`:(x.free?`<div class="free">${esc(x.free)}</div>`:"");
  const st=x.sleep?`<details class="fold tonightfold"${CHECKIN_DAY[k]===x.sleep?" open":""}><summary>ישנים הלילה · ${esc(STAYS[x.sleep].name)}<span class="small muted" style="font-weight:400">${esc(STAYS[x.sleep].area)}</span></summary><div class="tonight">${stayBlock(x.sleep,false,CHECKIN_DAY[k]===x.sleep)}</div></details>`:"";
  const pts=mapPts(x);
  const mp=pts.length?`<section class="daymapbox"><div id="daymap" class="daymap" role="img" aria-label="מפת המקומות של היום"></div><p class="small muted maphint">מספרים = המקומות ברשימה · 🏠 = הלינה. לחיצה על נקודה פותחת אותה בגוגל מפות.</p></section>`:"";
  const prev=DAYS[i-1], next=DAYS[i+1];
  return `<div class="stack rg-${x.r}">
    <div class="hero" data-r="${x.r}"><canvas aria-hidden="true"></canvas>
      <div class="kanji" lang="ja" aria-hidden="true">${R.k}</div>
      <div class="meta">${i===0&&daysToGo()>0?`עוד ${daysToGo()} ימים · `:""}יום ${i+1} מתוך ${DAYS.length} · ${x.dow} ${fmt(x.d)}</div>
      <h1>${esc(x.title)}</h1><div class="where">${esc(R.he)}</div></div>
    ${sh}${mp}${tk}${fx}${pl}${st}
    <div class="pager">${prev?`<button class="btn" data-go="${prev.d}">→ ${prev.dow} ${fmt(prev.d)}</button>`:"<span></span>"}${next?`<button class="btn" data-go="${next.d}">${next.dow} ${fmt(next.d)} ←</button>`:""}</div>
    <div class="sync"><i class="${navigator.onLine?"on":"off"}"></i>${navigator.onLine?"מחובר":"בלי קליטה — מוצגת הגרסה השמורה"} · עודכן ${UPDATED}</div>
  </div>`;
}

function daysView(){
  const groups=[];DAYS.forEach(x=>{const g=groups[groups.length-1];if(g&&g.r===x.r)g.items.push(x);else groups.push({r:x.r,items:[x]})});
  return `<h1 style="font-size:28px">המסלול</h1><p class="muted small" style="margin:4px 0 0">28/10–20/11 · שש לינות, שלוש שבתות</p>`+groups.map(g=>`<section class="region rg-${g.r}"><div class="rh"><span class="k" lang="ja">${REG[g.r].k}</span><h2>${REG[g.r].he}</h2><span class="small muted">${fmt(g.items[0].d)}${g.items.length>1?"–"+fmt(g.items[g.items.length-1].d):""}</span></div>${g.items.map(x=>`<button class="dayrow ${x.d===cur?"cur":""}" data-go="${x.d}"><span class="d">${fmt(x.d)}</span><span class="x">${esc(x.title)}<br><span class="small muted">${x.dow}</span></span>${x.sh?'<span class="chip">שבת</span>':""}</button>`).join("")}</section>`).join("");
}
function stayView(){
  return `<h1 style="font-size:28px">לינה</h1><p class="muted small" style="margin:4px 0 12px">כתובת ביפנית להצגה לנהג מונית או להזנה בניווט ברכב.</p><div class="stack">${Object.keys(STAYS).map(k=>`<div class="card rg-${k}"><span class="k" lang="ja">${REG[k].k}</span><div class="small muted">${REG[k].he} · ${esc(STAYS[k].area)}</div><h3 style="font-size:19px">${esc(STAYS[k].name)}</h3>${stayBlock(k,true,false)}</div>`).join("")}</div>`;
}
function vjwImgs(){
  if(typeof VJW==="undefined")return "";
  return VJW.pax.map(P=>`<div class="ticket"><div class="small"><b>${P[0]}</b></div><a href="${P[1]}" target="_blank" rel="noopener"><img src="${P[1]}" alt="קוד כניסה ליפן ${P[0]}" style="width:100%;max-width:340px;margin-top:8px;border-radius:8px;background:#fff"></a></div>`).join("");
}
function vjwFold(){
  if(typeof VJW==="undefined")return "";
  return `<details class="fold"><summary>קוד QR לכניסה ליפן</summary>${vjwImgs()}<p class="small muted" style="margin:8px 0 0">${esc(VJW.note)}</p></details>`;
}
function bpFold(label){
  if(typeof BOARDING==="undefined")return "";
  const L=BOARDING.legs.find(l=>String(label).startsWith(l.f));if(!L)return "";
  const have=L.pax.filter(P=>P[2]);
  const body=have.length?have.map(P=>`<div class="small" style="margin-top:8px"><b>${P[0]}</b> · מושב <span class="mono">${P[1]}</span></div><a href="${P[2]}" target="_blank" rel="noopener"><img src="${P[2]}" alt="כרטיס עלייה ${P[0]} ${L.f}" style="width:100%;margin-top:4px;border-radius:8px;background:#fff"></a>${BOARDING.wallet[P[0]]?`<div class="btns" style="margin-top:4px"><a class="btn sm" href="${BOARDING.wallet[P[0]]}" target="_blank" rel="noopener">${P[0]} — הכרטיס באתר Etihad</a></div>`:""}`).join(""):`<p class="small muted" style="margin:8px 0 0">${esc(L.note||"כרטיסי עלייה עוד לא התקבלו — אחרי הצ'ק-אין.")}</p>`;
  return `<details class="fold"><summary>כרטיסי עלייה${have.length?` · עלייה ${L.board}, קבוצה ${L.group}`:""}</summary>${body}</details>`;
}
function tixView(){
  const B=BOARDING;
  return `<h1 style="font-size:28px">כרטיסים</h1><p class="muted small" style="margin:4px 0 12px">הזמנה <span class="mono">${B.ref}</span> · צ'ק-אין להלוך בוצע ${B.checked}. לחיצה על כרטיס פותחת אותו בגודל מלא — להציג בשער.</p><div class="stack rg-air">
   ${B.legs.map(L=>`<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><h3 class="mono" style="font-size:20px">${L.f}</h3><span class="small muted">${L.date}</span></div><div>${L.route}</div><div class="small muted"><span class="mono">${L.dep}</span> ${esc(L.from)} → <span class="mono">${L.arr}</span> ${esc(L.to)}</div>${L.board?`<div class="small" style="margin-top:4px">עלייה למטוס <b class="mono">${L.board}</b> · קבוצה ${L.group}</div>`:""}
    ${L.pax.map(P=>`<div class="ticket"><div class="small"><b>${P[0]}</b> · מושב <span class="mono">${P[1]}</span></div>${P[2]?`<a href="${P[2]}" target="_blank" rel="noopener"><img src="${P[2]}" alt="כרטיס עלייה ${P[0]} ${L.f}" style="width:100%;margin-top:8px;border-radius:8px;background:#fff"></a>`:`<div class="small muted" style="margin-top:6px">${L.note&&P[0]==="אודי"?esc(L.note):"כרטיס עלייה — עוד לא התקבל"}</div>`}</div>`).join("")}
    <div class="btns">${L.pax.filter(P=>P[2]&&B.wallet[P[0]]).map(P=>`<a class="btn" href="${B.wallet[P[0]]}" target="_blank" rel="noopener">${P[0]} — באתר Etihad</a>`).join("")}${lnk(LINKS.etihad)}</div></div>`).join("")}
   ${typeof VJW!=="undefined"?`<div class="card"><h3>כניסה ליפן — Visit Japan Web</h3><p class="small muted" style="margin:4px 0 0">ביקורת גבולות ומכס בנריטה · נרשם ${VJW.checked}. ${esc(VJW.note)} לחיצה על קוד פותחת אותו בגודל מלא.</p>${vjwImgs()}</div>`:""}
   <div class="card"><h3>רכב — טויוטה</h3><dl class="kv"><dt>הזמנה</dt><dd class="mono">99937466600</dd><dt>איסוף</dt><dd>2/11 · 09:00 · Sanjo Keihan-Kita, קיוטו · <span class="mono">075-762-0115</span></dd><dt>החזרה</dt><dd>16/11 · 10:00 · אודווארה, יציאה מערבית</dd><dt>מרכז הזמנות</dt><dd class="mono">+81-92-577-0091</dd></dl>
    <details class="fold"><summary>לזכור באיסוף</summary><ul class="ci"><li>רישיון בינלאומי + ישראלי + דרכון — לשניכם.</li><li>חותמת כניסה בדרכון.</li><li>לרשום את מירי כנהגת נוספת.</li><li>להחזיר עם מיכל מלא ולשמור קבלה.</li></ul></details>
    <div class="btns"><a class="btn solid" href="${G("Toyota Rent a Car Sanjo Keihan-Kita Kyoto")}" target="_blank" rel="noopener">ניווט לאיסוף</a>${lnk(LINKS.toyota)}${lnk(LINKS.toyotaInfo)}</div></div>
   <div class="card"><h3>המסמכים המלאים</h3><p class="small muted" style="margin:4px 0 0">אישורים, דרכונים ופוליסה — בתיקיית Dropbox המשותפת, זמינה בלי קליטה.</p></div></div>`;
}
function moreView(){
  return `<h1 style="font-size:28px">עזרה</h1><div class="stack rg-tokyo" style="margin-top:12px">
   <div class="card"><h3>ביטוח — PassportCard</h3><dl class="kv"><dt>פוליסה</dt><dd class="mono">311233832</dd><dt>וואטסאפ 24/7</dt><dd class="mono">050-6708544</dd></dl><div class="btns"><button class="btn" data-copy="050-6708544">העתק מספר</button>${lnk(LINKS.passport)}</div></div>
   <div class="card"><h3>מספרי חירום ביפן</h3><dl class="kv"><dt>משטרה</dt><dd class="mono">110</dd><dt>אמבולנס / כיבוי</dt><dd class="mono">119</dd><dt>טויוטה, מרכז הזמנות</dt><dd class="mono">+81-92-577-0091</dd><dt>שגרירות ישראל</dt><dd>יושלם בגרסה המלאה</dd></dl></div>
   <h2 style="margin-top:6px">אוכל כשר</h2>
   <div class="place"><span class="pin">${PIN}</span><div class="body"><h3>חב"ד טוקיו — טקנאווה</h3><p>5 דק' מסנגקוג'י · קו אסקוסה ישירות מהדירה</p></div><a class="go" href="${G("1-5-23 Takanawa, Minato-ku, Tokyo")}" target="_blank" rel="noopener">לשם</a></div>
   <div class="place"><span class="pin">${PIN}</span><div class="body"><h3>David's Deli</h3><p>מסעדה כשרה צמודה לחב"ד</p></div><a class="go" href="${S("David's Deli Takanawa Tokyo")}" target="_blank" rel="noopener">לשם</a></div>
   <div class="place"><span class="pin">${PIN}</span><div class="body"><h3>חב"ד קיוטו</h3><p>אוקזאקי, כרבע שעה ברגל מהדירה · ארוחות שבת בהרשמה · וואטסאפ +81 90-3684-7707</p></div><a class="go" href="${PM("Chabad Jewish center Kyoto",KID.chabad)}" target="_blank" rel="noopener">לשם</a></div></div>`;
}

function render(){
  const v=document.getElementById("view");
  v.innerHTML={today:()=>dayView(cur),days:daysView,stay:stayView,tix:tixView,more:moreView}[tab]();
  document.querySelectorAll(".tab").forEach(b=>b.setAttribute("aria-selected",b.dataset.t===tab));
  const r=DAYS.find(x=>x.d===cur).r; document.querySelector("nav.tabs").className="tabs rg-"+(tab==="today"?r:"tokyo");
  v.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{cur=b.dataset.go;show("today")}));
  v.querySelectorAll(".hero").forEach(drawHero);
  if(tab==="today")drawDayMap();
  v.querySelectorAll("canvas.qr").forEach(drawQR);
  v.classList.remove("view");void v.offsetWidth;v.classList.add("view");
}
function show(t){tab=t;render();window.scrollTo(0,0)}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.t==="today"&&tab==="today")cur=startKey();show(b.dataset.t)}));

/* landscape band: layered ridges, Fuji cone for fuji/hakone, sun disc */
function drawHero(h){
  const c=h.querySelector("canvas"),dpr=window.devicePixelRatio||1,W=h.clientWidth,H=h.clientHeight;
  c.width=W*dpr;c.height=H*dpr;const x=c.getContext("2d");x.scale(dpr,dpr);
  const r=h.dataset.r;let s=[...r].reduce((a,ch)=>a+ch.charCodeAt(0),0);const rnd=()=>(s=(s*9301+49297)%233280)/233280;
  x.fillStyle="rgba(255,255,255,.18)";x.beginPath();x.arc(W*.72,H*.3,26,0,Math.PI*2);x.fill();
  if(r==="fuji"||r==="hakone"){const cx=W*(r==="fuji"?.62:.78),top=H*(r==="fuji"?.18:.34),base=H*.78,hw=W*(r==="fuji"?.42:.26);
    x.fillStyle="rgba(255,255,255,.22)";x.beginPath();x.moveTo(cx-hw,base);x.lineTo(cx-hw*.12,top);x.lineTo(cx+hw*.12,top);x.lineTo(cx+hw,base);x.fill();
    x.fillStyle="rgba(255,255,255,.55)";x.beginPath();x.moveTo(cx-hw*.12,top);x.lineTo(cx+hw*.12,top);x.lineTo(cx+hw*.3,top+(base-top)*.22);x.lineTo(cx+hw*.1,top+(base-top)*.18);x.lineTo(cx-hw*.05,top+(base-top)*.25);x.lineTo(cx-hw*.3,top+(base-top)*.22);x.fill();}
  if(r==="air"){x.strokeStyle="rgba(255,255,255,.35)";x.setLineDash([4,6]);x.lineWidth=2;x.beginPath();x.moveTo(-10,H*.7);x.quadraticCurveTo(W*.5,H*.05,W+10,H*.45);x.stroke();x.setLineDash([]);}
  const layers=r==="tokyo"?0:3;
  for(let l=0;l<layers;l++){const yb=H*(.5+l*.12),amp=H*(.16-l*.03);x.fillStyle=`rgba(0,0,0,${.08+l*.07})`;x.beginPath();x.moveTo(0,H);
    let y=yb;for(let px=0;px<=W;px+=W/14){y=yb-amp*(.4+rnd()*.6);x.lineTo(px,y)}x.lineTo(W,H);x.fill();}
  if(r==="tokyo"){let px=0;while(px<W){const w=12+rnd()*22,hh=H*(.12+rnd()*.32);x.fillStyle="rgba(0,0,0,.16)";x.fillRect(px,H-hh,w,hh);px+=w+3}
    x.fillStyle="rgba(0,0,0,.22)";x.fillRect(W*.3,H*.22,5,H*.78);}
  if(r==="kyoto"){x.strokeStyle="rgba(255,255,255,.5)";x.lineWidth=5;const gx=W*.22,gy=H*.38;x.beginPath();x.moveTo(gx-30,gy);x.lineTo(gx+30,gy);x.moveTo(gx-24,gy+12);x.lineTo(gx+24,gy+12);x.moveTo(gx-18,gy);x.lineTo(gx-18,gy+60);x.moveTo(gx+18,gy);x.lineTo(gx+18,gy+60);x.stroke();}
}
function drawQR(c){const x=c.getContext("2d"),n=25;let s=+c.dataset.seed*9301;const r=()=>(s=(s*9301+49297)%233280)/233280;
 x.fillStyle="#fff";x.fillRect(0,0,n,n);x.fillStyle="#111";for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(r()>.55)x.fillRect(i,j,1,1);
 [[0,0],[n-7,0],[0,n-7]].forEach(([a,b])=>{x.fillStyle="#111";x.fillRect(a,b,7,7);x.fillStyle="#fff";x.fillRect(a+1,b+1,5,5);x.fillStyle="#111";x.fillRect(a+2,b+2,3,3)});}
window.addEventListener("resize",()=>document.querySelectorAll(".hero").forEach(drawHero));
render();

window.addEventListener("online",render);window.addEventListener("offline",render);
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").then(r=>{r.addEventListener("updatefound",()=>{const w=r.installing;w&&w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)toast("יש גרסה חדשה — נטענת")})})});
 let reloaded=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!reloaded){reloaded=true;location.reload()}})}
