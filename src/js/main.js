// main.js - CurveLab-first wiring: nav, spreadsheet, paste, CSV import, fit, and logger-only results
document.addEventListener('DOMContentLoaded', ()=> {
  // NAV wiring (no logging)
  const navItems = document.querySelectorAll('.nav-item');
  const subItems = document.querySelectorAll('.nav-sub-item');
  const views = document.querySelectorAll('.view');
  const title = document.getElementById('main-title');

  function showView(id){
    views.forEach(v=> { v.style.display = (v.id === id ? '' : 'none'); });
    navItems.forEach(n=> n.classList.toggle('active', n.dataset.view === id));
    subItems.forEach(s=> s.classList.toggle('active', s.dataset.view === id));
    title.textContent = (id === 'curvelab') ? 'CurveLab' : (id.startsWith('elec-') ? 'ElecTools — ' + document.querySelector(`[data-view="${id}"]`).textContent : (id.charAt(0).toUpperCase()+id.slice(1)));
  }

  document.querySelectorAll('.nav-item').forEach(btn=> btn.addEventListener('click', ()=> showView(btn.dataset.view)));
  document.querySelectorAll('.nav-sub-item').forEach(btn=> btn.addEventListener('click', ()=> showView(btn.dataset.view)));

  // Collapsible ElecTools (visual only)
  const groupToggle = document.querySelector('.group-toggle');
  const electoolsSub = document.getElementById('electools-sub');
  if (groupToggle) {
    groupToggle.addEventListener('click', ()=> {
      const open = electoolsSub.style.display === 'flex';
      electoolsSub.style.display = open ? 'none' : 'flex';
      groupToggle.textContent = open ? 'ElecTools ▾' : 'ElecTools ▴';
    });
    electoolsSub.style.display = 'none';
  }

  // SPREADSHEET
  const tbody = document.querySelector('#data-table tbody');

  function newRow(x='', y='') {
    const tr = document.createElement('tr');
    const tdX = document.createElement('td'); tdX.contentEditable = true; tdX.spellcheck = false; tdX.innerText = x;
    const tdY = document.createElement('td'); tdY.contentEditable = true; tdY.spellcheck = false; tdY.innerText = y;
    tr.appendChild(tdX); tr.appendChild(tdY);
    tdX.addEventListener('keydown', (e) => handleCellKey(e, tdX, tdY));
    tdY.addEventListener('keydown', (e) => handleCellKey(e, tdY, tdX));
    tdX.addEventListener('paste', handlePaste); tdY.addEventListener('paste', handlePaste);
    tbody.appendChild(tr);
    return tr;
  }

  function handleCellKey(e, cell, nextCell) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cell.nextElementSibling) { cell.nextElementSibling.focus(); selectAll(cell.nextElementSibling); }
      else { const last = newRow('',''); last.firstChild.focus(); }
    }
    setTimeout(()=> {
      const rows = tbody.querySelectorAll('tr');
      const lastRow = rows[rows.length-1];
      const any = Array.from(lastRow.children).some(td=>td.innerText.trim() !== '');
      if (any) newRow('','');
    }, 10);
  }

  function selectAll(el) { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(range); }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const rows = text.trim().split(/\r?\n/).map(r => r.split(/\t|,/).map(c=>c.trim()));
    const startTr = e.target.parentElement;
    let rIndex = Array.from(tbody.children).indexOf(startTr);
    for (let i=0;i<rows.length;i++){
      const row = rows[i];
      const targetRow = tbody.children[rIndex + i] || newRow('','');
      if (row.length > 0) targetRow.children[0].innerText = row[0] || '';
      if (row.length > 1) targetRow.children[1].innerText = row[1] || '';
    }
    const lastRow = tbody.lastElementChild;
    const any = Array.from(lastRow.children).some(td=>td.innerText.trim() !== '');
    if (any) newRow('','');
  }

  // initial rows
  tbody.innerHTML = '';
  for (let i=0;i<8;i++) newRow('','');

  // CSV import only (top-right)
  const fileInput = document.getElementById('file-csv');
  if (fileInput) {
    fileInput.addEventListener('change', (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = Utils.parseCSV(reader.result);
        loadDataToTable(parsed);
        Logger.info(`Fitted data imported (${parsed.length} rows).`);
      };
      reader.readAsText(f);
    });
  }

  // Clear table (bottom-right)
  document.getElementById('clear-table').addEventListener('click', () => {
    tbody.innerHTML = '';
    for (let i=0;i<6;i++) newRow('','');
    window.curveData = [];
    Plotly.purge(document.getElementById('plot'));
    window.lastFitResult = null;
    Logger.info(''); // clear visual separation
    Logger.clear();
  });

  function loadDataToTable(data){
    tbody.innerHTML = '';
    data.forEach(d => newRow(d.x, d.y));
    newRow('','');
    window.curveData = data;
  }

  function readTableData(){
    const rows = Array.from(tbody.querySelectorAll('tr')); const out = [];
    for (const tr of rows){
      const a = tr.children[0].innerText.trim(); const b = tr.children[1].innerText.trim();
      const x = parseFloat(a); const y = parseFloat(b); if (isFinite(x) && isFinite(y)) out.push({x,y});
    }
    return out;
  }

  // Fit controls
  const fitType = document.getElementById('fit-type');
  const degInput = document.getElementById('poly-degree');
  fitType.addEventListener('change', () => { degInput.style.display = (fitType.value === 'polynomial') ? '' : 'none'; });

  document.getElementById('btn-fit').addEventListener('click', () => {
    const data = readTableData(); if (!data.length || data.length < 2){ alert('Enter at least two valid (x,y) rows.'); return; }
    window.curveData = data; const type = fitType.value; let result = null;
    const t0 = performance.now();
    if (type === 'linear') result = Regression.linearFit(data);
    else if (type === 'polynomial') result = Regression.polynomialFit(data, Math.max(1, parseInt(degInput.value || 2)));
    else if (type === 'exponential') result = Regression.exponentialFit(data);
    else if (type === 'logarithmic') result = Regression.logarithmicFit(data);
    const t1 = performance.now();

    if (!result){ Logger.clear(); Logger.info('Fit failed or insufficient data for selected model.'); return; }
    window.lastFitResult = result;
    Plotter.plotScatterWithFit(document.getElementById('plot'), data, result.predict);

    // Build result only log (no timestamps)
    let info = '';
    if (type === 'linear'){
      info += 'Fitting type: Linear\n';
      info += 'Equation form: y = m × x + b\n';
      info += `Computed: m = ${Utils.round(result.coeffs[0],6)}   b = ${Utils.round(result.coeffs[1],6)}\n`;
      info += `Resulting equation: y = ${Utils.round(result.coeffs[0],6)}x + ${Utils.round(result.coeffs[1],6)}\n`;
      info += `Correlation coefficient (R²) = ${Utils.round(result.r2,6)}\n`;
      info += `Standard error = ${Utils.round(result.stderr,6)}\n`;
      info += `Run time = ${((t1-t0)/1000).toFixed(4)} s`;
    } else if (type === 'polynomial'){
      info += `Fitting type: Polynomial (degree ${result.degree})\n`;
      info += `Coefficients: ${result.coeffs.map((c,i)=> `a${i}=${Utils.round(c,6)}`).join(', ')}\n`;
      info += `R² = ${Utils.round(result.r2,6)}\nStd err = ${Utils.round(result.stderr,6)}\nRun time = ${((t1-t0)/1000).toFixed(4)} s`;
    } else if (type === 'exponential'){
      info += 'Fitting type: Exponential\n';
      info += `y = A × exp(B × x)\nA = ${Utils.round(result.coeffs[0],6)}, B = ${Utils.round(result.coeffs[1],6)}\n`;
      info += `R² = ${Utils.round(result.r2,6)}\nStd err = ${Utils.round(result.stderr,6)}\nRun time = ${((t1-t0)/1000).toFixed(4)} s`;
    } else if (type === 'logarithmic'){
      info += 'Fitting type: Logarithmic\n';
      info += `y = A + B × ln(x)\nA = ${Utils.round(result.coeffs[0],6)}, B = ${Utils.round(result.coeffs[1],6)}\n`;
      info += `R² = ${Utils.round(result.r2,6)}\nStd err = ${Utils.round(result.stderr,6)}\nRun time = ${((t1-t0)/1000).toFixed(4)} s`;
    }

    // Replace logger content with the result block
    Logger.clear();
    Logger.info(info);
  });

  // expose small API
  window.getCurveData = () => window.curveData || [];
});
