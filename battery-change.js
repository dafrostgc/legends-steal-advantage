// Makes opponent battery changes explicit so old timing data cannot be mistaken for the new player.
const baseMeasure = measure;
measure = function () {
  baseMeasure();
  if (measureKind !== 'pitcher' && measureKind !== 'catcher') return;

  const isPitcher = measureKind === 'pitcher';
  const name = isPitcher ? state.pitcher : state.catcher;
  const times = isPitcher ? state.pt : state.ct;
  const hasCurrent = !!name || times.length > 0;
  if (!hasCurrent) return;

  const label = isPitcher ? 'Pitcher' : 'Catcher';
  const input = q('#opp');
  const timerBtn = q('#timerBtn');
  const manual = q('#manual');
  const addManual = q('#addManual');

  // Existing battery data is view-only until the coach explicitly changes that player.
  if (input) input.disabled = true;
  if (timerBtn) timerBtn.disabled = true;
  if (manual) manual.disabled = true;
  if (addManual) addManual.disabled = true;

  const card = q('#content .card');
  const change = document.createElement('button');
  change.id = 'changeBattery';
  change.className = 'primary stop';
  change.textContent = `Change ${label}`;
  change.style.marginBottom = '12px';

  const explanation = document.createElement('div');
  explanation.className = 'muted center';
  explanation.style.marginBottom = '10px';
  explanation.textContent = `Current ${label.toLowerCase()} timing is preserved until you press Change ${label}.`;

  const title = card.querySelector('.title');
  title.insertAdjacentElement('afterend', explanation);
  explanation.insertAdjacentElement('afterend', change);

  change.onclick = () => {
    const ok = confirm(`Change ${label.toLowerCase()}? This clears only the current ${label.toLowerCase()}'s timing samples so you can collect new ones.`);
    if (!ok) return;
    timerStart = null;
    timerType = null;
    if (isPitcher) {
      state.pitcher = '';
      state.pt = [];
    } else {
      state.catcher = '';
      state.ct = [];
    }
    save();
    measure();
    const freshInput = q('#opp');
    if (freshInput) freshInput.focus();
  };
};