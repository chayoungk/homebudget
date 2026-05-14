const defaultItems={
  fixed:[
    {id:'f1',name:'대출 이자',budget:1370000,dot:'#ff6b9d'},
    {id:'f2',name:'관리비',budget:200000,dot:'#ff6b9d'},
    {id:'f3',name:'가스/전기세',budget:100000,dot:'#ff6b9d'},
    {id:'f4',name:'기주 보험료',budget:100000,dot:'#ff6b9d'},
    {id:'f5',name:'차영 보험료',budget:50000,dot:'#ff6b9d'},
    {id:'f6',name:'휴대폰/인터넷/TV',budget:150000,dot:'#ff6b9d'},
    {id:'f7',name:'OTT',budget:33000,dot:'#ff6b9d'},
    {id:'f9',name:'남편 용돈',budget:300000,dot:'#ff6b9d'},
    {id:'f10',name:'아내 용돈',budget:400000,dot:'#ff6b9d'},
  ],
  variable:[
    {id:'v1',name:'식재료 (장보기)',budget:300000,dot:'#f7971e'},
    {id:'v2',name:'외식/배달',budget:200000,dot:'#f7971e'},
    {id:'v3',name:'주유비',budget:200000,dot:'#f7971e'},
    {id:'v4',name:'하이패스',budget:50000,dot:'#f7971e'},
    {id:'v5',name:'대중교통',budget:130000,dot:'#f7971e'},
    {id:'v6',name:'생필품',budget:50000,dot:'#f7971e'},
    {id:'v7',name:'화장품/의류',budget:80000,dot:'#f7971e'},
    {id:'v8',name:'문화/여가',budget:100000,dot:'#f7971e'},
    {id:'v9',name:'여행',budget:200000,dot:'#f7971e'},
    {id:'v10',name:'가평카드',budget:200000,dot:'#f7971e'},
  ],
  irregular:[
    {id:'i1',name:'부모님 용돈',budget:0,dot:'#a78bfa'},
    {id:'i2',name:'명절비',budget:0,dot:'#a78bfa'},
    {id:'i3',name:'축의금/조의금',budget:0,dot:'#a78bfa'},
    {id:'i4',name:'생일',budget:0,dot:'#a78bfa'},
    {id:'i5',name:'자동차세',budget:0,dot:'#a78bfa'},
    {id:'i6',name:'재산세',budget:0,dot:'#a78bfa'},
    {id:'i7',name:'자동차 수리비',budget:0,dot:'#a78bfa'},
    {id:'i8',name:'병원비',budget:0,dot:'#a78bfa'},
  ],
  asset:[
    {id:'a1',name:'적금',budget:500000,dot:'#7c6fff'},
    {id:'a2',name:'청년적금',budget:500000,dot:'#7c6fff'},
  ],
  income:[
    {id:'in1',name:'남편 급여',budget:0,dot:'#43e97b'},
    {id:'in2',name:'아내 급여',budget:0,dot:'#43e97b'},
    {id:'in3',name:'기타 수입',budget:0,dot:'#43e97b'},
  ]
};

let ITEMS={};
let cy=new Date().getFullYear(),cm=new Date().getMonth()+1;
let mData={},mMemos={};
let detTarget=null;
let monthPeriod=3;
let selectedYear=cy;
let editingMemoIndex=null;

function dk(y,m){return`hb_${y}_${String(m).padStart(2,'0')}`}
function mk(y,m){return`hbm_${y}_${String(m).padStart(2,'0')}`}
function bk(y,m){return`hbb_${y}_${String(m).padStart(2,'0')}`}

// 월별 예산 캐시
let mBudget={};
function loadBudget(y,m){
  try{mBudget=JSON.parse(localStorage.getItem(bk(y,m))||'{}');}catch{mBudget={};}
}
function saveBudgetMonth(y,m){
  localStorage.setItem(bk(y,m),JSON.stringify(mBudget));
}
// id의 해당 월 예산: 저장된 값 없으면 ITEMS 기본값
// 비정기 지출은 연간 예산으로 공유
function getBudget(id,y,m){
  const item=findItemById(id);
  const isIrregular=item&&findCategoryById(id)==='irregular';

  if(isIrregular)return getDefaultBudget(id);

  if(y===cy&&m===cm)return mBudget[id]!==undefined?mBudget[id]:getDefaultBudget(id);
  try{
    const b=JSON.parse(localStorage.getItem(bk(y,m))||'{}');
    return b[id]!==undefined?b[id]:getDefaultBudget(id);
  }catch{return getDefaultBudget(id);}
}
function findCategoryById(id){
  for(const c of Object.keys(ITEMS)){
    if(ITEMS[c].find(i=>i.id===id))return c;
  }
  return null;
}
function findItemById(id){
  for(const c of Object.keys(ITEMS)){
    const item=ITEMS[c].find(i=>i.id===id);
    if(item)return item;
  }
  return null;
}
function getDefaultBudget(id){
  for(const c of Object.keys(ITEMS)){
    const it=ITEMS[c].find(i=>i.id===id);
    if(it)return it.budget;
  }
  return 0;
}

function loadItems(){
  try{
    const s=JSON.parse(localStorage.getItem('hb_items'));
    const requiredCats=['fixed','variable','irregular','asset','income'];
    const isValid=s&&requiredCats.every(c=>Array.isArray(s[c]));
    ITEMS=isValid?s:JSON.parse(JSON.stringify(defaultItems));
    // 누락된 카테고리 보완
    requiredCats.forEach(c=>{if(!ITEMS[c])ITEMS[c]=defaultItems[c]?JSON.parse(JSON.stringify(defaultItems[c])):[];});
  }
  catch{ITEMS=JSON.parse(JSON.stringify(defaultItems));}
}
function saveItems(){localStorage.setItem('hb_items',JSON.stringify(ITEMS));}
function loadData(y,m){
  try{mData=JSON.parse(localStorage.getItem(dk(y,m))||'{}');}catch{mData={};}
  try{mMemos=JSON.parse(localStorage.getItem(mk(y,m))||'{}');}catch{mMemos={};}
  loadBudget(y,m);
}
function saveData(){
  localStorage.setItem(dk(cy,cm),JSON.stringify(mData));
  localStorage.setItem(mk(cy,cm),JSON.stringify(mMemos));
}

function fmt(n,short=false){
  if(!n)return'0원';
  const a=Math.abs(n),s=n<0?'-':'';
  if(a>=10000){
    if(short)return s+Math.round(a/1000)/10+'만원';
    const mv=Math.floor(a/10000),r=a%10000;
    return r===0?s+mv+'만원':s+a.toLocaleString()+'원';
  }
  return s+a.toLocaleString()+'원';
}

function getTotal(id){
  const ms=mMemos[id];
  return ms&&ms.length?ms.reduce((s,m)=>s+m.amount,0):mData[id]||0;
}
function getTotalFrom(id,data,memos){
  const ms=memos[id];
  return ms&&ms.length?ms.reduce((s,m)=>s+m.amount,0):data[id]||0;
}
// ── 연간 비정기 지출 누적 합계 ──
function getIrregularYearTotal(id, year){
  let total=0;
  for(let m=1;m<=12;m++){
    let d={},mm={};
    try{d=JSON.parse(localStorage.getItem(dk(year,m))||'{}');}catch{}
    try{mm=JSON.parse(localStorage.getItem(mk(year,m))||'{}');}catch{}
    total+=getTotalFrom(id,d,mm);
  }
  return total;
}
function getIrregularYearTotalAll(year){
  return ITEMS.irregular.reduce((s,it)=>s+getIrregularYearTotal(it.id,year),0);
}
// 연간 비정기 예산 전체 합
function getIrregularAnnualBudget(){
  return ITEMS.irregular.reduce((s,it)=>s+it.budget,0);
}

function sumCategory(cat,dataFn=null){
  return ITEMS[cat].reduce((s,it)=>s+(dataFn?dataFn(it):getTotal(it.id)),0);
}
function sumCategories(cats,dataFn=null){
  return cats.reduce((s,cat)=>s+sumCategory(cat,dataFn),0);
}
function getMonthRange(startY,startM,endY,endM){
  const months=[];
  for(let y=startY;y<=endY;y++){
    const ms=(y===startY)?startM:1,me=(y===endY)?endM:12;
    for(let m=ms;m<=me;m++)months.push({y,m});
  }
  return months;
}

function renderList(cat,listId,totId){
  const el=document.getElementById(listId||'list-'+cat);
  if(!el)return 0;
  let tot=0;
  el.innerHTML=ITEMS[cat].map(it=>{
    const v=getTotal(it.id);tot+=v;
    const curBudget=getBudget(it.id,cy,cm);
    const over=curBudget>0&&v>curBudget;
    const ms=mMemos[it.id]||[];
    const last=ms[ms.length-1];
    const tagHtml=last?((last.person?`<span class="itag itag-p">${last.person}</span>`:'')+
      (last.pay?`<span class="itag itag-pay">${last.pay}</span>`:'')):'';
    const memoH=ms.length>1?`<div class="imemo-prev">${ms.length}건${last?.memo?' · '+last.memo:''}</div>`:
      last?.memo?`<div class="imemo-prev">${last.memo}</div>`:'';
    // 비정기: 연간 예산 기준으로 표시, 수입: 예산 표시 안 함
    let budDisplay;
    if(cat==='income'){
      budDisplay='';
    } else if(cat==='irregular'){
      if(it.budget>0){
        const ytot=getIrregularYearTotal(it.id,cy);
        const yleft=it.budget-ytot;
        const overStr=yleft<0?` <span style="color:var(--exp)">${fmt(Math.abs(yleft))} 초과</span>`:'';
        const leftStr=yleft>=0?` · 잔여 ${fmt(yleft)}`:'';
        budDisplay=`연간 ${fmt(it.budget)} · 올해 ${fmt(ytot)}${leftStr}${overStr}`;
      } else {
        budDisplay='연간 예산 미설정';
      }
    } else {
      budDisplay=curBudget>0?'예산 '+fmt(curBudget):'예산 미설정';
    }
    return`<div class="irow" onclick="openDetail('${it.id}','${cat}')">
      <div class="idot" style="background:${it.dot}"></div>
      <div class="iinfo"><div class="iname">${it.name}</div><div class="ibud">${budDisplay}</div></div>
      <div class="iright">
        <div class="iamt ${v===0?'zero':over?'over':''}">${v===0?'탭해서 입력':fmt(v)}</div>
        ${tagHtml?`<div class="itags">${tagHtml}</div>`:''}
        ${memoH}
      </div>
    </div>`;
  }).join('');
  const te=document.getElementById(totId||'tot-'+cat);
  if(te)te.textContent=fmt(tot);
  return tot;
}

function renderSummary(){
  const exp=sumCategories(['fixed','variable','irregular']),sav=sumCategory('asset'),inc=sumCategory('income');
  const bal=inc-exp-sav;

  document.getElementById('s-inc').textContent=fmt(inc,true);
  document.getElementById('s-exp').textContent=fmt(exp,true);
  document.getElementById('s-sav').textContent=fmt(sav,true);

  const bel=document.getElementById('s-bal');
  bel.textContent=fmt(bal,true);
  bel.style.color=bal<0?'var(--exp)':bal===0?'var(--txt2)':'var(--txt)';
}

function renderAll(){
  loadData(cy,cm);
  ['fixed','variable','irregular','asset','income'].forEach(c=>renderList(c));
  renderSummary();
  renderSettingsPage();
}

function openDetail(id,cat){
  detTarget={id,cat};
  const it=ITEMS[cat].find(i=>i.id===id);if(!it)return;
  document.getElementById('det-name').textContent=it.name;
  refreshDetailHeader(id,it);
  renderDetBody(id);
  document.getElementById('detOv').classList.add('open');
}
function refreshDetailHeader(id,it){
  const tot=getTotal(id);
  document.getElementById('det-total').textContent=fmt(tot);
  if(it.cat==='irregular'||detTarget?.cat==='irregular'){
    if(it.budget>0){
      const ytot=getIrregularYearTotal(id,cy);
      const yleft=it.budget-ytot;
      document.getElementById('det-bud').textContent=
        `연간예산 ${fmt(it.budget)} · 올해누적 ${fmt(ytot)} · 잔여 ${yleft<0?'⚠️ '+fmt(Math.abs(yleft))+' 초과':fmt(yleft)}`;
    } else {
      document.getElementById('det-bud').textContent='연간 예산 미설정';
    }
  } else {
    const cb=getBudget(it.id,cy,cm);
    document.getElementById('det-bud').textContent=cb>0
      ?(tot>cb?`예산 ${fmt(cb)} · ⚠️ ${fmt(tot-cb)} 초과`:`예산 ${fmt(cb)} · 남은예산 ${fmt(cb-tot)}`)
      :'예산 미설정';
  }
}
function renderDetBody(id){
  const body=document.getElementById('det-body');
  const ms=mMemos[id]||[];
  const single=mData[id]||0;
  if(!ms.length&&!single){
    body.innerHTML=`<div class="det-empty">아직 내역이 없어요<br>위 [+ 내역 추가]를 눌러<br>상세 내역을 기록하세요</div>`;return;
  }
  if(!ms.length){
    body.innerHTML=`<div class="memo-item"><div class="memo-top"><div class="memo-left"><div class="memo-amt">${fmt(single)}</div><div class="memo-date" style="font-style:italic">단일 금액</div></div><button class="memo-del" onclick="delSingle('${id}')">삭제</button></div></div>`;return;
  }
  body.innerHTML=ms.map((m,i)=>`<div class="memo-item"><div class="memo-top"><div class="memo-left"><div class="memo-tags">${m.person?`<span class="itag itag-p">${m.person}</span>`:''}${m.pay?`<span class="itag itag-pay">${m.pay}</span>`:''}</div><div class="memo-amt">${fmt(m.amount)}</div>${m.memo?`<div class="memo-note">${m.memo}</div>`:''}<div class="memo-date">${m.date||''}</div></div><div style="display:flex;gap:4px"><button class="memo-edit" onclick="editMemo('${id}',${i})">수정</button><button class="memo-del" onclick="delMemo('${id}',${i})">삭제</button></div></div></div>`).join('')+
    (ms.length>1?`<div style="text-align:center;padding:8px 0 2px;font-size:13px;color:var(--txt2)">합계 <b style="color:var(--txt)">${fmt(ms.reduce((s,m)=>s+m.amount,0))}</b> (${ms.length}건)</div>`:'');
}
function delSingle(id){
  if(!confirm('삭제할까요?'))return;
  delete mData[id];saveData();renderAll();
  refreshDetailHeader(id,ITEMS[detTarget.cat].find(i=>i.id===id));
  renderDetBody(id);
}
function delMemo(id,i){
  if(!confirm('이 내역을 삭제할까요?'))return;
  mMemos[id].splice(i,1);
  if(!mMemos[id].length)delete mMemos[id];
  saveData();renderAll();
  refreshDetailHeader(id,ITEMS[detTarget.cat].find(x=>x.id===id));
  renderDetBody(id);
}

function openMemoAdd(){
  if(!detTarget)return;
  editingMemoIndex=null;
  const it=ITEMS[detTarget.cat].find(i=>i.id===detTarget.id);
  document.getElementById('memo-ttl').textContent=(it?it.name:'')+'  내역 추가';
  document.getElementById('memo-bud').textContent='';
  document.getElementById('memo-inp').value='';
  document.getElementById('memo-txt').value='';
  document.getElementById('memo-save-btn').textContent='✓ 추가';
  clrSel('memo-pay');clrSel('memo-person');
  document.getElementById('detOv').classList.remove('open');
  document.getElementById('memoOv').classList.add('open');
  setTimeout(()=>document.getElementById('memo-inp').focus(),120);
}
function editMemo(id,i){
  if(!detTarget)return;
  editingMemoIndex=i;
  const m=mMemos[id][i];
  const it=ITEMS[detTarget.cat].find(x=>x.id===id);
  document.getElementById('memo-ttl').textContent=(it?it.name:'')+'  내역 수정';
  document.getElementById('memo-inp').value=m.amount;
  document.getElementById('memo-txt').value=m.memo||'';
  document.getElementById('memo-save-btn').textContent='✓ 수정';
  clrSel('memo-pay');clrSel('memo-person');
  if(m.pay)document.querySelector(`#memo-pay [data-val="${m.pay}"]`).classList.add('on');
  if(m.person)document.querySelector(`#memo-person [data-val="${m.person}"]`).classList.add('on');
  document.getElementById('detOv').classList.remove('open');
  document.getElementById('memoOv').classList.add('open');
  setTimeout(()=>document.getElementById('memo-inp').focus(),120);
}
function saveMemo(){
  if(!detTarget)return;
  const amt=parseInt(document.getElementById('memo-inp').value)||0;
  if(amt<=0){alert('금액을 입력해주세요');return;}
  const pay=getSel('memo-pay'),person=getSel('memo-person');
  const txt=document.getElementById('memo-txt').value.trim();
  const now=new Date();
  const d=`${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  if(!mMemos[detTarget.id])mMemos[detTarget.id]=[];
  if(editingMemoIndex!==null){
    mMemos[detTarget.id][editingMemoIndex]={amount:amt,pay,person,memo:txt,date:mMemos[detTarget.id][editingMemoIndex].date};
  }else{
    mMemos[detTarget.id].push({amount:amt,pay,person,memo:txt,date:d});
    delete mData[detTarget.id];
  }
  saveData();renderAll();
  const it=ITEMS[detTarget.cat].find(i=>i.id===detTarget.id);
  refreshDetailHeader(detTarget.id,it);
  renderDetBody(detTarget.id);
  closeOv('memoOv');
  document.getElementById('detOv').classList.add('open');
}

function sel(btn,groupId){
  const was=btn.classList.contains('on');
  document.querySelectorAll(`#${groupId} .sel-btn`).forEach(b=>b.classList.remove('on'));
  if(!was)btn.classList.add('on');
}
function getSel(groupId){const e=document.querySelector(`#${groupId} .sel-btn.on`);return e?e.dataset.val:'';}
function clrSel(groupId){document.querySelectorAll(`#${groupId} .sel-btn`).forEach(b=>b.classList.remove('on'));}
function closeOv(id){document.getElementById(id).classList.remove('open');}

function renderStats(){
  renderDaily();renderBudgetSummary();renderIncome();renderMonthly();renderCatBars();renderItemBars();
}
function renderDaily(){
  const now=new Date(),isCur=cy===now.getFullYear()&&cm===now.getMonth()+1;
  const lastDay=new Date(cy,cm,0).getDate(),today=isCur?now.getDate():lastDay;
  const rem=lastDay-today+1;
  const vb=sumCategory('variable',it=>getBudget(it.id,cy,cm)),va=sumCategory('variable');
  const left=vb-va,daily=rem>0?Math.floor(left/rem):0;
  const dEl=document.getElementById('dailyAmt');
  dEl.textContent=daily>0?fmt(daily):'초과 😥';
  dEl.style.color=daily<=0?'var(--exp)':'var(--acc3)';
  document.getElementById('dailySub').innerHTML=`변동예산 <b style="color:var(--txt)">${fmt(vb)}</b> · 사용 <b style="color:var(--exp)">${fmt(va)}</b><br>잔여 <b style="color:${left<0?'var(--exp)':'var(--acc3)'}">${fmt(Math.abs(left))}</b> · 남은 날 <b style="color:var(--txt)">${rem}일</b>`;
  const w=document.getElementById('dailyWarn');
  w.textContent='⚠️ 변동 지출 예산을 초과했습니다';
  w.style.display=left<0?'block':'none';
}

function renderBudgetSummary(){
  const el=document.getElementById('budget-summary-rows');
  if(!el)return;

  // 월 지출 예산 (고정+변동, 비정기 연간/12 환산)
  const fixedBud=sumCategory('fixed',it=>getBudget(it.id,cy,cm));
  const varBud=sumCategory('variable',it=>getBudget(it.id,cy,cm));
  const irrAnnual=ITEMS.irregular.reduce((s,it)=>s+it.budget,0);
  const irrMonthly=Math.round(irrAnnual/12);
  const totalExpBud=fixedBud+varBud+irrMonthly;
  const savBud=sumCategory('asset',it=>getBudget(it.id,cy,cm));
  // 수입 예산 변수 제거

  const irrYtot=getIrregularYearTotalAll(cy);
  const irrLeft=irrAnnual-irrYtot;

  // 이번 달 실제
  const actualExp=sumCategories(['fixed','variable','irregular']);
  const actualSav=sumCategory('asset');
  // 실제 수입 합계 변수 제거

  // rows 배열에서 수입 예산 항목 삭제
  const rows=[
    {label:'월 지출 예산', budget:totalExpBud, actual:actualExp, color:'var(--exp)'},
    {label:'저축 예산', budget:savBud, actual:actualSav, color:'var(--sav)'},
  ];

  el.innerHTML=rows.map(r=>{
    const pct=r.budget>0?Math.min(Math.round(r.actual/r.budget*100),130):0;
    const over=r.actual>r.budget;
    const barCol=over?'var(--exp)':r.color;
    const diffAmt=Math.abs(r.budget-r.actual);
    const isSav = r.label === '저축 예산';
    let diffLabel = '';
    let diffColor = '';

    if (r.budget > 0) {
      if (isSav) {
        const isDeficit = r.actual < r.budget;
        diffLabel = isDeficit ? `${fmt(diffAmt)} 부족` : `목표 달성 ✨`;
        diffColor = isDeficit ? 'var(--acc4)' : 'var(--acc3)';
      } else {
        diffLabel = over ? `⚠️ ${fmt(diffAmt)} 초과` : `${fmt(diffAmt)} 여유`;
        diffColor = over ? 'var(--exp)' : 'var(--acc3)';
      }
    }

    return`<div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
        <span style="font-size:12px;color:var(--txt2)">${r.label}</span>
        <span style="font-size:11px">
          <span style="font-weight:700;color:var(--txt)">${fmt(r.actual)}</span>
          <span style="color:var(--txt3)"> / ${fmt(r.budget)}</span>
        </span>
      </div>
      <div class="bar-trk" style="height:8px;margin-bottom:3px">
        <div class="bar-fil" style="width:${Math.min(pct,100)}%;background:${barCol}"></div>
      </div>
      <div style="text-align:right;font-size:10px;color:${diffColor}">${diffLabel}</div>
    </div>`;
  }).join('') +
  // 연간 비정기 예산 표시 로직은 유지
  `<div style="margin-top:4px;padding:10px 12px;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);border-radius:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:11px;color:#c4b5fd;font-weight:600">🗓️ 연간 비정기 예산</span>
      <span style="font-size:13px;font-weight:700;color:#a78bfa">${fmt(irrAnnual)}</span>
    </div>
    <div class="bar-trk" style="height:6px;margin-bottom:4px">
      <div class="bar-fil" style="width:${irrAnnual>0?Math.min(Math.round(irrYtot/irrAnnual*100),100):0}%;background:${irrLeft<0?'var(--exp)':'#a78bfa'}"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px">
      <span style="color:var(--txt3)">올해 사용 <b style="color:var(--txt)">${fmt(irrYtot)}</b></span>
      <span style="color:${irrLeft<0?'var(--exp)':'var(--acc3)'}">${irrLeft<0?'초과 '+fmt(Math.abs(irrLeft)):'잔여 '+fmt(irrLeft)}</span>
    </div>
  </div>`;
}

let incPeriod=3;
let incSelectedYear=new Date().getFullYear();
function swIncPeriod(p,btn){
  incPeriod=p;
  document.querySelectorAll('[id^="inc-period-btn"]').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const ys=document.getElementById('incYearSelect');
  if(p===12){
    incSelectedYear=new Date().getFullYear();
    updateIncYearSelect();
    ys.style.display='inline-block';
  } else {
    ys.style.display='none';
  }
  renderIncome();
}
function updateIncYearSelect(){
  const now=new Date();
  const ys=document.getElementById('incYearSelect');
  if(!ys)return;
  const years=[];
  for(let y=2026;y<=now.getFullYear();y++)years.push(y);
  ys.innerHTML=years.map(y=>`<option value="${y}" ${y===incSelectedYear?'selected':''}>${y}년</option>`).join('');
}
function swIncYear(year){
  incSelectedYear=parseInt(year);
  renderIncome();
}
function renderIncome(){
  const now=new Date();
  let months=[];
  if(incPeriod===12){
    const endM=incSelectedYear===now.getFullYear()?now.getMonth()+1:12;
    months=getMonthRange(incSelectedYear,1,incSelectedYear,endM);
  } else {
    for(let i=incPeriod-1;i>=0;i--){
      let y=now.getFullYear(),m=now.getMonth()+1-i;
      while(m<1){m+=12;y--;}
      months.push({y,m});
    }
  }
  const incData=months.map(({y,m})=>{
    let d={},mm={};
    try{d=JSON.parse(localStorage.getItem(dk(y,m))||'{}');}catch{}
    try{mm=JSON.parse(localStorage.getItem(mk(y,m))||'{}');}catch{}
    return ITEMS.income.reduce((s,it)=>s+getTotalFrom(it.id,d,mm),0);
  });
  const mx=Math.max(...incData,1);
  // 막대 차트
  document.getElementById('inc-bars').innerHTML=months.map(({y,m},i)=>{
    const v=incData[i],h=Math.max(Math.round(v/mx*75),v>0?4:2);
    const cur=y===cy&&m===cm;
    return`<div class="mb-col">
      <div class="mb-amt" style="color:var(--inc);opacity:${cur?1:.65}">${fmt(v,true)}</div>
      <div class="mb-bar" style="height:${h}px;background:var(--inc);opacity:${cur?1:.45}"></div>
    </div>`;
  }).join('');
  document.getElementById('inc-lbls').innerHTML=months.map(({y,m})=>{
    const cur=y===cy&&m===cm;
    return`<div style="flex:1;text-align:center;font-size:9px;color:${cur?'var(--txt)':'var(--txt3)'};font-weight:${cur?700:400}">${m}월</div>`;
  }).join('');
}


function renderMonthly(){
  const now=new Date(),ys=document.getElementById('yearSelect');
  let months=[];

  if(monthPeriod===12){
    months=getMonthRange(selectedYear,1,selectedYear,now.getMonth()+(selectedYear===now.getFullYear()?1:13));
    ys.style.display='inline-block';
    updateYearSelect();
  }else{
    ys.style.display='none';
    for(let i=monthPeriod-1;i>=0;i--){
      let y=now.getFullYear(),m=now.getMonth()+1-i;
      while(m<1){m+=12;y--;}
      months.push({y,m});
    }
  }

  const bals=months.map(({y,m})=>{
    let d={},mm={};
    try{d=JSON.parse(localStorage.getItem(dk(y,m))||'{}');}catch{}
    try{mm=JSON.parse(localStorage.getItem(mk(y,m))||'{}');}catch{}
    let exp=0,inc=0,sav=0;
    ['fixed','variable','irregular'].forEach(c=>ITEMS[c].forEach(it=>{exp+=getTotalFrom(it.id,d,mm);}));
    ITEMS.asset.forEach(it=>{sav+=getTotalFrom(it.id,d,mm);});
    ITEMS.income.forEach(it=>{inc+=getTotalFrom(it.id,d,mm);});
    return inc-exp;
  });

  const mxAbs=Math.max(...bals.map(Math.abs),1);
  document.getElementById('mb-bars').innerHTML=months.map(({y,m},i)=>{
    const b=bals[i],h=Math.max(Math.round(Math.abs(b)/mxAbs*75),3),col=b<0?'#ff6b9d':'#7c6fff',cur=y===cy&&m===cm;
    return`<div class="mb-col"><div class="mb-amt" style="color:${col};opacity:${cur?1:.7}">${fmt(b,true)}</div><div class="mb-bar" style="height:${h}px;background:${col};opacity:${cur?1:.5}"></div></div>`;
  }).join('');
  document.getElementById('mb-lbls').innerHTML=months.map(({y,m})=>{
    const cur=y===cy&&m===cm;
    return`<div style="flex:1;text-align:center;font-size:9px;color:${cur?'var(--txt)':'var(--txt3)'};font-weight:${cur?700:400}">${m}월</div>`;
  }).join('');
}
function swPeriod(p,btn){
  monthPeriod=p;
  document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  if(p===12)selectedYear=cy;
  renderMonthly();
}
function updateYearSelect(){
  const now=new Date();
  const select=document.getElementById('yearSelect');
  const years=[];
  for(let y=2026;y<=now.getFullYear();y++)years.push(y);
  select.innerHTML=years.map(y=>`<option value="${y}" ${y===selectedYear?'selected':''}>${y}년</option>`).join('');
}
function swYear(year){
  selectedYear=parseInt(year);
  renderMonthly();
}
function renderCatBars(){
  const cats=[{l:'고정 지출',c:'#ff6b9d',k:'fixed'},{l:'변동 지출',c:'#f7971e',k:'variable'},{l:'비정기',c:'#a78bfa',k:'irregular'},{l:'자산/저축',c:'#7c6fff',k:'asset'}];
  const mx=Math.max(...cats.map(c=>sumCategory(c.k)),1);
  document.getElementById('catBars').innerHTML=cats.map(c=>{
    const amt=sumCategory(c.k);
    const p=Math.round(amt/mx*100);
    return`<div class="bar-row"><div class="bar-top"><span style="color:var(--txt2)">${c.l}</span><span style="font-weight:600">${fmt(amt)}</span></div><div class="bar-trk"><div class="bar-fil" style="width:${p}%;background:${c.c}"></div></div></div>`;
  }).join('');
}
function renderItemBars(){
  const items2=[];
  ['fixed','variable'].forEach(c=>ITEMS[c].forEach(it=>{
    const ac=getTotal(it.id);
    const curB=getBudget(it.id,cy,cm);
    if(curB>0||ac>0)items2.push({...it,budget:curB,actual:ac});
  }));
  document.getElementById('itemBars').innerHTML=items2.map(it=>{
    const p=it.budget>0?Math.min(Math.round(it.actual/it.budget*100),120):0;
    const col=p>100?'#ff6b9d':p>80?'#f7971e':'#43e97b';
    return`<div class="bar-row"><div class="bar-top"><span style="color:var(--txt2);font-size:11px">${it.name}</span><span style="font-weight:600;color:${col};font-size:11px">${fmt(it.actual)}</span></div><div class="bar-trk"><div class="bar-fil" style="width:${Math.min(p,100)}%;background:${col}"></div></div></div>`;
  }).join('');
}

function renderSettingsPage(){
  ['fixed','variable','irregular','asset','income'].forEach(cat=>{
    const el=document.getElementById('set-'+cat);if(!el)return;
    if(cat==='income'){
      // 수입은 삭제만 가능, 예산 입력 없음
      el.innerHTML=ITEMS[cat].map(it=>{
        return`<div class="set-row"><button class="set-del" onclick="delIncomeItem('${it.id}')">×</button><span class="set-lbl">${it.name}</span></div>`;
      }).join('');
    } else {
      el.innerHTML=ITEMS[cat].map(it=>{
        const unit=cat==='irregular'?'원/년':'원';
        const displayBudget=cat==='irregular'?it.budget:getBudget(it.id,cy,cm);
        const isOverride=cat!=='irregular'&&mBudget[it.id]!==undefined;
        const hint=cat==='irregular'
          ?`<span style="font-size:10px;color:var(--txt3);margin-left:2px">(연간)</span>`
          :isOverride?`<span style="font-size:10px;color:var(--acc4);margin-left:4px" title="이 달만 다른 예산">이달</span>`:'';
        const inputColor=isOverride?'color:var(--acc4)':'';
        return`<div class="set-row"><button class="set-del" onclick="delItem('${cat}','${it.id}')">×</button><span class="set-lbl">${it.name}</span><input class="set-inp s-inp" type="number" inputmode="numeric" data-id="${it.id}" data-original="${displayBudget}" data-cat="${cat}" value="${displayBudget}" style="${inputColor}" oninput="onBudgetInput(this)"><span class="set-unit">${unit}</span>${hint}</div>`;
      }).join('');
    }
    const totEl=document.getElementById('set-tot-'+cat);
    if(totEl){
      const sum=cat==='income'?0:ITEMS[cat].reduce((s,it)=>s+(cat==='irregular'?it.budget:getBudget(it.id,cy,cm)),0);
      totEl.textContent=cat==='irregular'?fmt(sum)+' (연간)':fmt(sum);
    }
  });
  let expBudget=0,savBudget=0,irrAnnualBudget=0,irrYearTotal=0;
  ['fixed','variable'].forEach(c=>ITEMS[c].forEach(it=>{expBudget+=getBudget(it.id,cy,cm);}));
  ITEMS.irregular.forEach(it=>{irrAnnualBudget+=getBudget(it.id,cy,cm);});
  ITEMS.asset.forEach(it=>{savBudget+=getBudget(it.id,cy,cm);});
  irrYearTotal=getIrregularYearTotalAll(cy);
  const irrLeft=irrAnnualBudget-irrYearTotal;
  const expEl=document.getElementById('tot-expense-budget');
  const savEl=document.getElementById('tot-savings-budget');
  const irrEl=document.getElementById('tot-irregular-budget');
  const irrUsedEl=document.getElementById('tot-irregular-used');
  if(expEl)expEl.textContent=fmt(expBudget);
  if(savEl)savEl.textContent=fmt(savBudget);
  if(irrEl)irrEl.textContent=fmt(irrAnnualBudget);
  if(irrUsedEl){
    irrUsedEl.textContent=`${fmt(irrYearTotal)} 사용 / 잔여 ${fmt(Math.abs(irrLeft))}${irrLeft<0?' 초과':''}`;
    irrUsedEl.style.color=irrLeft<0?'var(--exp)':'var(--acc3)';
  }
}
function saveBudgets(){
  // 변경된 항목만 이 달 mBudget에 저장 (비정기는 연간이므로 ITEMS에 저장)
  let changedCount=0;
  document.querySelectorAll('.s-inp').forEach(inp=>{
    const id=inp.dataset.id;
    const v=parseInt(inp.value)||0;
    const original=parseInt(inp.dataset.original)||0;
    if(v===original)return;
    changedCount++;
    const cat=findCategoryById(id);
    const t=findItemById(id);
    if(cat==='irregular'){
      if(t)t.budget=v;
    } else {
      mBudget[id]=v;
    }
  });
  if(changedCount===0){alert('변경된 항목이 없습니다.');return;}
  saveItems();
  saveBudgetMonth(cy,cm);
  renderAll();
  alert(`${cy}년 ${cm}월 예산이 저장되었습니다.`);
}
function onBudgetInput(inp){
  const v=parseInt(inp.value)||0;
  const original=parseInt(inp.dataset.original)||0;
  const cat=inp.dataset.cat;
  if(v!==original){
    inp.style.color='var(--acc4)';
    // 옆에 변경 표시
    let mark=inp.parentElement.querySelector('.changed-mark');
    if(!mark){
      mark=document.createElement('span');
      mark.className='changed-mark';
      mark.textContent='●';
      mark.style.cssText='color:var(--acc4);font-size:10px;margin-left:4px;flex-shrink:0';
      inp.parentElement.appendChild(mark);
    }
  } else {
    inp.style.color=cat==='irregular'?'var(--acc)':'var(--acc)';
    const mark=inp.parentElement.querySelector('.changed-mark');
    if(mark)mark.remove();
  }
}
function confirmDefaultSave(){
  if(!confirm('기본 예산을 변경할까요?\n월별 설정이 없는 모든 달에 적용됩니다.'))return;
  saveBudgets('default');
}

function addItem(){
  const cat=document.getElementById('newCat').value;
  const name=document.getElementById('newName').value.trim();
  const budget=parseInt(document.getElementById('newBudget').value)||0;
  if(!name)return alert('항목 이름을 입력해주세요');
  const dots={fixed:'#ff6b9d',variable:'#f7971e',irregular:'#a78bfa',asset:'#7c6fff',income:'#43e97b'};
  ITEMS[cat].push({id:cat[0]+Date.now(),name,budget,dot:dots[cat]});
  saveItems();document.getElementById('newName').value='';document.getElementById('newBudget').value='';
  renderAll();alert(`[${name}] 항목이 추가되었습니다`);
}
function delItem(cat,id){
  if(!confirm('이 항목을 삭제할까요?'))return;
  ITEMS[cat]=ITEMS[cat].filter(i=>i.id!==id);saveItems();renderAll();
}
function delIncomeItem(id){
  if(!confirm('이 수입 항목을 삭제할까요?'))return;
  ITEMS.income=ITEMS.income.filter(i=>i.id!==id);
  saveItems();
  renderSettingsPage();
}
function resetData(){
  if(!confirm('모든 데이터를 초기화할까요?\n(초기 예산과 모든 내역이 삭제됩니다)'))return;
  localStorage.clear();
  location.reload();
}

function resetMonth(){
  if(!confirm(`${cy}년 ${cm}월 데이터를 초기화할까요?\n지출 내역과 이달 예산 설정이 삭제되며\n다른 달에는 영향이 없습니다.`))return;
  // 이달 지출/메모/예산 데이터만 삭제
  localStorage.removeItem(dk(cy,cm));
  localStorage.removeItem(mk(cy,cm));
  localStorage.removeItem(bk(cy,cm));
  mData={};
  mMemos={};
  mBudget={};
  renderAll();
  alert(`${cy}년 ${cm}월 데이터가 초기화되었습니다.`);
}

function swTab(tab,btn){
  document.querySelectorAll('.tc').forEach(el=>el.style.display='none');
  document.getElementById('tab-'+tab).style.display='block';
  document.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}
function swPage(pg,btn){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('on'));
  document.getElementById('pg-'+pg).classList.add('on');
  document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('ledger-tabs').style.display=pg==='ledger'?'flex':'none';
  if(pg==='stats')renderStats();
}
function chMonth(d){
  cm+=d;if(cm>12){cm=1;cy++;}if(cm<1){cm=12;cy--;}
  updateMonthSelect();
  renderAll();
  if(document.getElementById('pg-stats').classList.contains('on'))renderStats();
}
function chMonthSelect(val){
  const [y,m]=val.split('-').map(Number);
  cy=y;cm=m;
  renderAll();
  if(document.getElementById('pg-stats').classList.contains('on'))renderStats();
}
function updateMonthSelect(){
  const select=document.getElementById('monthSelect');
  const now=new Date(),nowY=now.getFullYear(),nowM=now.getMonth()+1;
  const endY=cy>nowY||(cy===nowY&&cm>nowM)?cy:nowY;
  const endM=(cy>nowY||(cy===nowY&&cm>nowM))?cm:nowM;
  const months=getMonthRange(2026,1,endY,endM);
  select.innerHTML=months.map(({y,m})=>`<option value="${y}-${m}" ${y===cy&&m===cm?'selected':''}>${y}.${String(m).padStart(2,'0')}</option>`).join('');
}

function init(){
  loadItems();
  const now=new Date();cy=now.getFullYear();cm=now.getMonth()+1;
  updateMonthSelect();
  renderAll();
}
init();