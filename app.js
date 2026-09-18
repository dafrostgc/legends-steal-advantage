const roster=[
  ['00','Jacob Morrison'],['3','Carter Gould'],['5','Landon Osborn'],
  ['7','Nathan Hein'],['8','Alex Blanquet'],['8','Ryder Olsen'],
  ['9','Owen Stenbak'],['11','Evan Graham'],['12','Christian Psaradelis'],
  ['14','Jake Frost'],['16','Van Crossman'],['21','Johnny Williams'],
  ['22','Griffin Combs'],['24','Landin Mingo'],['25','Owen Brasket'],
  ['99','Jakah Neilson']
];

const fresh=()=>({
  players:roster.map(([n,name])=>({n,name,base:null,trials:[]})),
  pitcher:'', pitcherTeam:'', pitcherNumber:'', pitcherProfileId:null,
  catcher:'', catcherTeam:'', catcherNumber:'', catcherProfileId:null,
  pt:[], ct:[],
  batteryProfiles:[],
  green:.20, yellow:.05
});

function normalizeState(raw){
  const s=raw&&typeof raw==='object'?raw:fresh();
  const priorPlayers=Array.isArray(s.players)?s.players:[];
  s.players=roster.map(([n,name])=>{
    let p=priorPlayers.find(x=>x.name===name);
    if(!p&&name==='Owen Stenbak')p=priorPlayers.find(x=>x.name==='Owen Stenbeck');
    p=p||{};
    return {...p,n,name,base:p.base??null,trials:Array.isArray(p.trials)?p.trials.slice(0,3):[]};
  });
  s.pitcher=s.pitcher||'';
  s.pitcherTeam=s.pitcherTeam||'';
  s.pitcherNumber=s.pitcherNumber||'';
  s.pitcherProfileId=s.pitcherProfileId||null;
  s.catcher=s.catcher||'';
  s.catcherTeam=s.catcherTeam||'';
  s.catcherNumber=s.catcherNumber||'';
  s.catcherProfileId=s.catcherProfileId||null;
  s.pt=Array.isArray(s.pt)?s.pt.slice(0,3):[];
  s.ct=Array.isArray(s.ct)?s.ct.slice(0,3):[];
  s.batteryProfiles=Array.isArray(s.batteryProfiles)?s.batteryProfiles.map(p=>({
    id:String(p.id||('b'+Date.now()+Math.random())),
    role:p.role==='catcher'?'catcher':'pitcher',
    team:String(p.team||''),
    number:String(p.number||''),
    name:String(p.name||''),
    times:Array.isArray(p.times)?p.times.slice(0,3):[]
  })).filter(p=>p.name):[];
  s.green=Number.isFinite(+s.green)?+s.green:.20;
  s.yellow=Number.isFinite(+s.yellow)?+s.yellow:.05;
  return s;
}

let state;
try{state=normalizeState(JSON.parse(localStorage.getItem('lsa-state'))||fresh())}
catch{state=fresh()}

let view='game',measureKind='player',selected=0,timerStart=null,timerType=null;
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const f=x=>x==null?'—':Number(x).toFixed(2);
const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const h=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function save(){
  localStorage.setItem('lsa-state',JSON.stringify(state));
  const x=q('#saved');
  if(x){
    x.textContent='Saved ✓';
    setTimeout(()=>{if(q('#saved'))q('#saved').textContent=''},1200);
  }
}

function batteryRolePrefix(kind){return kind==='pitcher'?'pitcher':'catcher'}
function batteryName(kind){return state[batteryRolePrefix(kind)]||''}
function batteryTeam(kind){return state[batteryRolePrefix(kind)+'Team']||''}
function batteryNumber(kind){return state[batteryRolePrefix(kind)+'Number']||''}
function batteryProfileId(kind){return state[batteryRolePrefix(kind)+'ProfileId']||null}
function batteryDisplay(kind){
  const name=batteryName(kind),num=batteryNumber(kind);
  return [num?('#'+num):'',name].filter(Boolean).join(' ');
}
function profilesFor(kind){
  return state.batteryProfiles
    .filter(p=>p.role===kind)
    .sort((a,b)=>(a.team||'').localeCompare(b.team||'')||(a.name||'').localeCompare(b.name||''));
}
function currentProfile(kind){
  const id=batteryProfileId(kind);
  return id?state.batteryProfiles.find(p=>p.id===id):null;
}
function loadBatteryProfile(kind,id){
  const p=state.batteryProfiles.find(x=>x.id===id&&x.role===kind);
  if(!p)return;
  const pre=batteryRolePrefix(kind);
  state[pre]=p.name;
  state[pre+'Team']=p.team;
  state[pre+'Number']=p.number;
  state[pre+'ProfileId']=p.id;
  state[kind==='pitcher'?'pt':'ct']=[...(p.times||[])].slice(0,3);
  save();
}
function saveBatteryProfile(kind){
  const pre=batteryRolePrefix(kind);
  const team=(state[pre+'Team']||'').trim();
  const name=(state[pre]||'').trim();
  const number=(state[pre+'Number']||'').trim();
  if(!team||!name){
    alert('Enter both the team and player name before saving.');
    return false;
  }
  let p=currentProfile(kind);
  if(!p){
    p=state.batteryProfiles.find(x=>
      x.role===kind &&
      x.team.toLowerCase()===team.toLowerCase() &&
      x.name.toLowerCase()===name.toLowerCase() &&
      (x.number||'')===number
    );
  }
  const times=[...(kind==='pitcher'?state.pt:state.ct)].slice(0,3);
  if(p){
    p.team=team;p.name=name;p.number=number;p.times=times;
  }else{
    p={id:'b'+Date.now()+Math.random().toString(36).slice(2,7),role:kind,team,number,name,times};
    state.batteryProfiles.push(p);
  }
  state[pre+'ProfileId']=p.id;
  save();
  return true;
}
function syncCurrentBatteryProfile(kind){
  const p=currentProfile(kind);
  if(!p)return;
  p.times=[...(kind==='pitcher'?state.pt:state.ct)].slice(0,3);
  save();
}
function clearCurrentBattery(kind){
  const pre=batteryRolePrefix(kind);
  state[pre]='';
  state[pre+'Team']='';
  state[pre+'Number']='';
  state[pre+'ProfileId']=null;
  state[kind==='pitcher'?'pt':'ct']=[];
}

function shell(){
  q('#app').innerHTML=`<header class='head'><div class='headrow'><div class='grow'><div class='brand'>LEGENDS STEAL ADVANTAGE</div><div class='muted'>Know the run. Control the game.</div></div><div id='saved' class='saved'></div></div></header><div id='content'></div><nav class='bottom'><button data-view='game'><span>🏃</span>Game Day</button><button data-view='players'><span>👥</span>Players</button><button data-view='measure'><span>⏱</span>Measure</button><button data-view='more'><span>•••</span>More</button></nav><div id='modal' class='modal hidden'><div id='sheet' class='sheet'></div></div>`;
  qa('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
  render();
}

function render(){
  qa('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  ({game,players,measure,more}[view]||game)();
}

function game(){
  const p=avg(state.pt),c=avg(state.ct),d=p!=null&&c!=null?p+c:null;
  q('#content').innerHTML=`<div class='card'><div class='row'><div class='grow'><div class='title'>Game Day</div><div class='muted'>Current opponent battery</div></div><button id='newGame'>New Game</button></div><div class='battery'><div class='card'><div class='muted'>PITCHER</div><div class='metric'>${f(p)}</div><div>${h(batteryDisplay('pitcher')||'Not set')}</div><div class='muted'>${h(batteryTeam('pitcher'))}</div><button id='editP'>Time / Change</button></div><div class='card'><div class='muted'>CATCHER</div><div class='metric'>${f(c)}</div><div>${h(batteryDisplay('catcher')||'Not set')}</div><div class='muted'>${h(batteryTeam('catcher'))}</div><button id='editC'>Time / Change</button></div></div><div class='card center'><div class='muted'>DEFENSE TO SECOND</div><div class='metric'>${f(d)}</div></div></div><div class='card'><div class='title'>Steal Board</div><div class='muted'>🟢 GO ≥ +${f(state.green)} · 🟡 READ ≥ +${f(state.yellow)} · 🔴 HOLD</div><div id='board'></div></div><div class='footer'>Timing edge = pitcher-to-home + catcher pop − runner baseline. It is a decision aid; game context, jump, pitch and throw still matter.</div>`;
  q('#newGame').onclick=()=>{
    if(confirm('Start a new game? Player baselines and saved opponent library stay saved.')){
      clearCurrentBattery('pitcher');
      clearCurrentBattery('catcher');
      save();game();
    }
  };
  q('#editP').onclick=()=>{measureKind='pitcher';view='measure';render()};
  q('#editC').onclick=()=>{measureKind='catcher';view='measure';render()};
  drawBoard(d);
}

function drawBoard(d){
  const b=q('#board');
  if(d==null){
    b.innerHTML=`<div class='empty'>Capture pitcher and catcher timing to activate the board.</div>`;
    return;
  }
  b.innerHTML=state.players
    .map(p=>({...p,e:p.base==null?null:d-p.base}))
    .sort((a,z)=>(z.e??-99)-(a.e??-99))
    .map(p=>{
      if(p.e==null)return `<div class='card row'><div class='num'>${p.n}</div><div class='grow'><b>${p.name}</b><div class='muted'>Not timed</div></div></div>`;
      let cls=p.e>=state.green?'go':p.e>=state.yellow?'read':'hold',lab=cls==='go'?'GO':cls==='read'?'READ':'HOLD';
      return `<div class='card row ${cls}'><div class='num'>${p.n}</div><div class='grow'><b>${p.name}</b><div class='muted'>Runner ${f(p.base)}</div></div><div class='right'><b>${p.e>=0?'+':''}${f(p.e)}</b><div class='pill'>${lab}</div></div></div>`;
    }).join('');
}

function playerStatus(p){
  const n=(p.trials||[]).length;
  if(n>0&&n<3)return `${n}/3 attempts`;
  if(n===3&&p.base==null)return `3/3 · avg ${f(avg(p.trials))}s`;
  if(p.base!=null&&n===3)return `${f(p.base)}s · 3/3 saved`;
  if(p.base!=null)return `${f(p.base)}s`;
  return 'Not Timed';
}

function players(){
  q('#content').innerHTML=`<div class='card'><div class='title'>Players</div><div class='muted'>Each attempt is saved immediately. Time one runner, switch players, and come back for attempts 2 and 3.</div>${state.players.map((p,i)=>`<button class='playerrow row' data-p='${i}'><div class='num'>${p.n}</div><div class='grow'><b>${p.name}</b></div><b>${playerStatus(p)} ›</b></button>`).join('')}</div>`;
  qa('[data-p]').forEach(b=>b.onclick=()=>{selected=+b.dataset.p;measureKind='player';view='measure';render()});
}

function batteryEditor(kind,label){
  const pre=batteryRolePrefix(kind);
  const profiles=profilesFor(kind);
  const currentId=state[pre+'ProfileId']||'';
  return `
    <label class='sectionlabel'>Saved ${label}s</label>
    <select id='savedBattery'>
      <option value=''>Choose a saved ${label.toLowerCase()}…</option>
      ${profiles.map(p=>`<option value='${h(p.id)}' ${p.id===currentId?'selected':''}>${h(p.team)} · ${h([p.number?('#'+p.number):'',p.name].filter(Boolean).join(' '))} · ${f(avg(p.times||[]))}s</option>`).join('')}
    </select>
    <div class='muted' style='margin-top:8px'>Or enter a new ${label.toLowerCase()} and save it for future games.</div>
    <label class='sectionlabel'>Team</label>
    <input id='oppTeam' placeholder='Team name' value='${h(state[pre+'Team'])}'>
    <div class='grid2'>
      <div><label class='sectionlabel'>Number</label><input id='oppNum' inputmode='numeric' placeholder='#' value='${h(state[pre+'Number'])}'></div>
      <div><label class='sectionlabel'>Name</label><input id='oppName' placeholder='${label} name' value='${h(state[pre])}'></div>
    </div>
    <button id='saveBattery' class='primary' style='width:100%;margin-top:10px'>${currentId?'Update Saved '+label:'Save '+label+' to Library'}</button>
  `;
}

function measure(){
  const isP=measureKind==='player';
  const label=isP?'Player':measureKind==='pitcher'?'Pitcher':'Catcher';
  q('#content').innerHTML=`<div class='card'><div class='title'>Measure Timing</div><div class='seg'><button data-kind='player' class='${measureKind==='player'?'active':''}'>Player</button><button data-kind='pitcher' class='${measureKind==='pitcher'?'active':''}'>Pitcher</button><button data-kind='catcher' class='${measureKind==='catcher'?'active':''}'>Catcher</button></div>${isP?`<label class='sectionlabel'>Player</label><select id='who'>${state.players.map((p,i)=>`<option value='${i}' ${i===selected?'selected':''}>#${p.n} ${p.name} · ${(p.trials||[]).length}/3</option>`).join('')}</select>`:batteryEditor(measureKind,label)}<p class='muted center'>${isP?"Pitcher's first movement → runner touches 2B":measureKind==='pitcher'?"Pitcher's first movement → catcher receives pitch":"Catcher receives pitch → throw received at 2B"}</p><div id='clock' class='bigmetric'>0.00</div><div class='center'>seconds</div><button id='timerBtn' class='greenbtn stop'>▶ Start</button><div class='recent' id='attempts'></div><div class='sectionlabel'>Or enter manually</div><div class='row'><input id='manual' inputmode='decimal' placeholder='0.00'><button id='addManual' class='primary'>Add</button></div><div id='saveArea'></div></div>`;

  qa('[data-kind]').forEach(b=>b.onclick=()=>{measureKind=b.dataset.kind;render()});

  if(isP){
    q('#who').onchange=e=>{selected=+e.target.value;render()};
  }else{
    const kind=measureKind,pre=batteryRolePrefix(kind);
    q('#savedBattery').onchange=e=>{
      if(!e.target.value)return;
      loadBatteryProfile(kind,e.target.value);
      render();
    };
    q('#oppTeam').oninput=e=>{state[pre+'Team']=e.target.value;save()};
    q('#oppNum').oninput=e=>{state[pre+'Number']=e.target.value;save()};
    q('#oppName').oninput=e=>{state[pre]=e.target.value;save()};
    q('#saveBattery').onclick=()=>{
      if(saveBatteryProfile(kind))render();
    };
  }

  q('#timerBtn').onclick=timerTap;
  q('#addManual').onclick=()=>{
    const v=parseFloat(q('#manual').value);
    if(Number.isFinite(v)&&v>0){addAttempt(v);q('#manual').value=''}
  };
  renderAttempts();
}

function currentAttempts(){
  return measureKind==='player'
    ?(state.players[selected].trials||[])
    :measureKind==='pitcher'?state.pt:state.ct;
}

function addAttempt(v){
  let a=[...currentAttempts()];
  if(a.length>=3)a=[];
  a.push(+v.toFixed(2));
  if(measureKind==='player'){
    state.players[selected].trials=a;
    save();
  }else{
    state[measureKind==='pitcher'?'pt':'ct']=a;
    syncCurrentBatteryProfile(measureKind);
    save();
  }
  renderAttempts();
}

function timerTap(){
  if(timerStart==null){
    timerStart=performance.now();
    timerType=measureKind;
    q('#timerBtn').textContent='■ STOP';
    q('#timerBtn').className='stop danger';
    const tick=()=>{
      if(timerStart!=null&&timerType===measureKind){
        const clock=q('#clock');
        if(clock)clock.textContent=((performance.now()-timerStart)/1000).toFixed(2);
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }else if(timerType===measureKind){
    const v=(performance.now()-timerStart)/1000;
    timerStart=null;timerType=null;
    q('#timerBtn').textContent='▶ Start';
    q('#timerBtn').className='greenbtn stop';
    q('#clock').textContent=v.toFixed(2);
    addAttempt(v);
  }
}

function renderAttempts(){
  const a=currentAttempts();
  q('#attempts').innerHTML=a.map((x,i)=>`<span class='chip'>${i+1}: ${f(x)}</span>`).join('');
  const area=q('#saveArea');
  if(measureKind==='player'){
    area.innerHTML=a.length===3
      ?`<div class='card center'><div class='muted'>NEW BASELINE</div><div class='metric'>${f(avg(a))}</div><div class='muted'>Current: ${f(state.players[selected].base)}</div></div><button id='saveBase' class='primary stop'>Save Baseline</button>`
      :`<div class='muted center'>${a.length}/3 attempts saved. You can switch players and come back later.</div>`;
    if(a.length===3)q('#saveBase').onclick=()=>{
      state.players[selected].base=+avg(a).toFixed(2);
      save();view='players';render();
    };
  }else{
    const p=currentProfile(measureKind);
    area.innerHTML=`<div class='muted center'>${a.length}/3 readings · average ${f(avg(a))}. Saved automatically.${p?' Stored with '+h(p.team)+' · '+h(batteryDisplay(measureKind))+'.':''}</div>`;
  }
}

function more(){
  const profiles=[...state.batteryProfiles].sort((a,b)=>
    (a.team||'').localeCompare(b.team||'')||a.role.localeCompare(b.role)||(a.name||'').localeCompare(b.name||'')
  );
  const library=profiles.length
    ?profiles.map(p=>`<div class='playerrow row'><div class='grow'><b>${h(p.team)}</b><div>${p.role==='pitcher'?'Pitcher':'Catcher'} · ${h([p.number?('#'+p.number):'',p.name].filter(Boolean).join(' '))}</div><div class='muted'>${p.times.length}/3 readings · avg ${f(avg(p.times))}s</div></div><button data-del-battery='${h(p.id)}'>Delete</button></div>`).join('')
    :`<div class='empty'>No saved opponent pitchers or catchers yet.</div>`;

  q('#content').innerHTML=`<div class='card'><div class='title'>Settings & Data</div><div class='sectionlabel'>Steal decision thresholds</div><label>Green at or above<input id='green' inputmode='decimal' value='${state.green}'></label><label>Read at or above<input id='yellow' inputmode='decimal' value='${state.yellow}'></label><button id='saveThresholds' class='primary' style='width:100%;margin-top:10px'>Save Thresholds</button><div class='sectionlabel'>Opponent Battery Library</div><p class='muted'>Saved pitchers and catchers can be recalled from the Measure screen with their timing samples.</p>${library}<div class='sectionlabel'>Backup</div><p class='muted'>Your data is automatically stored in this browser. Export a backup before changing phones or clearing browser data.</p><div class='actions'><button id='export'>Export Backup</button><button id='import'>Import Backup</button></div><input id='file' class='hidden' type='file' accept='application/json'><div class='sectionlabel'>About</div><p class='muted'>Legends Steal Advantage · Player performance data is not stored in GitHub.</p></div>`;

  q('#saveThresholds').onclick=()=>{
    let g=parseFloat(q('#green').value),y=parseFloat(q('#yellow').value);
    if(!Number.isFinite(g)||!Number.isFinite(y)||g<=y||y<0)return alert('Green must be greater than Read.');
    state.green=g;state.yellow=y;save();more();
  };

  qa('[data-del-battery]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.delBattery;
    const p=state.batteryProfiles.find(x=>x.id===id);
    if(!p)return;
    if(!confirm(`Delete ${p.team} · ${p.name} from the saved opponent library?`))return;
    state.batteryProfiles=state.batteryProfiles.filter(x=>x.id!==id);
    if(state.pitcherProfileId===id)state.pitcherProfileId=null;
    if(state.catcherProfileId===id)state.catcherProfileId=null;
    save();more();
  });

  q('#export').onclick=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='legends-steal-backup.json';
    a.click();URL.revokeObjectURL(a.href);
  };
  q('#import').onclick=()=>q('#file').click();
  q('#file').onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const x=JSON.parse(rd.result);
        if(!Array.isArray(x.players))throw 0;
        state=normalizeState(x);
        save();render();alert('Backup restored.');
      }catch{alert('That backup file is not valid.')}
    };
    rd.readAsText(file);
  };
}

shell();
