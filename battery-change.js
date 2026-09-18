// Makes opponent battery changes explicit so old timing data cannot be mistaken for the new player.
const baseMeasure = measure;
measure = function () {
  baseMeasure();
  if (measureKind !== 'pitcher' && measureKind !== 'catcher') return;

  const isPitcher = measureKind === 'pitcher';
  const kind = isPitcher ? 'pitcher' : 'catcher';
  const name = isPitcher ? state.pitcher : state.catcher;
  const team = isPitcher ? state.pitcherTeam : state.catcherTeam;
  const number = isPitcher ? state.pitcherNumber : state.catcherNumber;
  const profileId = isPitcher ? state.pitcherProfileId : state.catcherProfileId;
  const times = isPitcher ? state.pt : state.ct;
  const hasCurrent = !!name || !!team || !!number || !!profileId || times.length > 0;
  if (!hasCurrent) return;

  const label = isPitcher ? 'Pitcher' : 'Catcher';

  // Keep the identity fields and Save/Update button editable. Coaches need
  // to be able to enter or correct team / number / name even when a timing set
  // already exists. "Change" remains the explicit way to clear the current
  // battery member and start a different one.
  const timerBtn=q('#timerBtn');
  const manual=q('#manual');
  const addManual=q('#addManual');
  if(timerBtn)timerBtn.disabled=false;
  if(manual)manual.disabled=false;
  if(addManual)addManual.disabled=false;

  const card=q('#content .card');
  const change=document.createElement('button');
  change.id='changeBattery';
  change.className='primary stop';
  change.textContent=`Change ${label}`;
  change.style.marginBottom='12px';

  const explanation=document.createElement('div');
  explanation.className='muted center';
  explanation.style.marginBottom='10px';
  explanation.textContent=`Time the current ${label.toLowerCase()} below, or press Change ${label} to switch players. Saved library entries are kept.`;

  const title=card.querySelector('.title');
  title.insertAdjacentElement('afterend',explanation);
  explanation.insertAdjacentElement('afterend',change);

  change.onclick=()=>{
    const ok=confirm(`Change ${label.toLowerCase()}? The current game selection and timing samples will be cleared, but saved opponent library entries will remain.`);
    if(!ok)return;
    timerStart=null;
    timerType=null;
    clearCurrentBattery(kind);
    save();
    measure();
    const freshSelect=q('#savedBattery');
    if(freshSelect)freshSelect.focus();
  };
};
