// main.js - wiring (nav, theme auto-detect, spreadsheet, paste, CSV controls, fits)
document.addEventListener('DOMContentLoaded', ()=> {
  // NAVIGATION
  const navItems = document.querySelectorAll('.nav-item');
  const subItems = document.querySelectorAll('.nav-sub-item');
  const views = document.querySelectorAll('.view');

  function showView(id){
    views.forEach(v=> v.style.display = (v.id === id ? '' : 'none'));
    // active state
    navItems.forEach(n=> n.classList.toggle('active', n.dataset.view === id));
    subItems.forEach(s=> s.classList.toggle('active', s.dataset.view === id));
  }

  document.querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const view = btn.dataset.view;
      showView(view);
    });
  });

  document.querySelectorAll('.nav-sub-item').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const view = btn.dataset.view;
      showView(view);
    });
  });

  // Collapsible group
  const groupToggle = document.querySelector('.group-toggle');
  const electoolsSub = document.getElementById('electools-sub');
  groupToggle.addEventListener('click', ()=> {
    const open = electoolsSub.style.display === 'flex';
    electoolsSub.style.display = open ? 'none' : 'flex';
    groupToggle.textContent = open ? 'ElecTools ▾' : 'ElecTools ▴';
  });
  // default collapse
  electoolsSub.style.display = 'none';

  // THEME: auto-detect system
  const app = document.getElementById('app');
  const themeSwitch = document.getElementById('theme-switch');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('inlinenode-theme');
  const initial = saved || (prefersDark ? 'dark' : 'light');
  setTheme(initial);
  themeSwitch.checked = (initial === 'dark');
  themeSwitch.addEventListener('change', ()=> setTheme(themeSwitch.checked ? 'dark' : 'light'));

  function setTheme(t){
    app.setAttribute('data-theme', t); localStorage.setItem('inlinenode-theme', t);
    // replot if needed
    if (window.lastFitResult) Plotter.plotScatterWithFit(document.getElementById('plot'), window.curveData || [], window.lastFitResult.predict || (()=>0), t);
  }

  function getTheme(){ return app.getAttribute('data-theme') || 'light'; }

  // SPREADSHEET
  const tbody = document.querySelector('#data-table tbody');

  function newRow(x='', y=''){
    const tr = document.createElement('tr');
    const tdX = document.createElement('td'); tdX.contentEditable = true; tdX.spellcheck = false; tdX.innerText = x;
    const tdY = document.createElement('td'); tdY.contentEditable = true; tdY.spellcheck = false; tdY.innerText = y;
    tr.appendChild(tdX); tr.appendChild(tdY);
    tdX.addEventListener('keydown', (e)=> handleCellKey(e, tdX, tdY));
    tdY.addEventListener('keydown', (e)=> handleCellKey(e, tdY, tdX));
    tdX.addEventListener('paste', handlePaste); tdY.addEventListener('paste', handlePaste);
    tbody.appendChild(tr);
    return tr;
  }

  function handleCellKey(e, cell, nextCell){
    if (e.key === 'Enter'){ e.preventDefault(); // move to next cell
      if (cell.nextElementSibling) { cell.nextElementSibling.focus(); selectAll(cell.nextElementSibling); } else { const last = newRow('',''); last.firstChild.focus(); }
    }
    setTimeout(()=> { const rows = tbody.querySelectorAll('tr'); const lastRow = rows[rows.length-1]; const any = Array.from(lastRow.children).some(td=>td.innerText.trim() !== ''); if (any) newRow('',''); }, 10);
  }

  function selectAll(el){ const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(range); }

  function handlePaste(e){
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    // split rows and columns (tabs or commas)
    const rows = text.trim().split(/\r?\n/).map(r => r.split(/\t|,/).map(c=>c.trim()));
    const startTr = e.target.parentElement;
    let rIndex = Array.from(tbody.children).indexOf(startTr);
    for (let i=0;i<rows.length;i++){
      const row = rows[i];
      const targetRow = tbody.children[rIndex + i] || newRow('','');
      // only take first two columns
      if (row.length > 0) targetRow.children[0].innerText = row[0] || '';
      if (row.length > 1) targetRow.children[1].innerText = row[1] || '';
    }
    const lastRow = tbody.lastElementChild; const any = Array.from(lastRow.children).some(td=>td.innerText.trim() !== ''); if (any) newRow('','');
  }

  // initial 8 rows
  tbody.innerHTML = '';
  for (let i=0;i<8;i++) newRow('','');

  // CSV import/export under table
  document.getElementById('file-csv').addEventListener('change', (ev)=> {
    const f = ev.target.files[0]; if (!f) return;
    const reader = new FileReader(); reader.onload = ()=> {
      const parsed = Utils.parseCSV(reader.result); loadDataToTable(parsed);
    }; reader.readAsText(f);
  });

  document.getElementById('export-csv').addEventListener('click', ()=> {
    const data = readTableData(); if (!data.length) { alert('No numeric data to export.'); return; }
    const xs = data.map(d=>d.x); const ys = data.map(d=>d.y); Utils.downloadText('data.csv', Utils.csvFromArray(xs, ys));
  });

  document.getElementById('clear-table').addEventListener('click', ()=> {
    tbody.innerHTML = ''; for (let i=0;i<6;i++) newRow('',''); window.curveData = []; Plotly.purge(document.getElementById('plot')); document.getElementById('fit-info').textContent = ''; window.lastFitResult = null;
  });

  function loadDataToTable(data){
    tbody.innerHTML = ''; data.forEach(d=> newRow(d.x, d.y)); newRow('',''); window.curveData = data;
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
  const fitType = document.getElementById('fit-type'); const degLabel = document.getElementById('deg-label'); const degInput = document.getElementById('poly-degree');
  fitType.addEventListener('change', ()=> { if (fitType.value === 'polynomial'){ degLabel.style.display=''; degInput.style.display=''; } else { degLabel.style.display='none'; degInput.style.display='none'; } });

  document.getElementById('btn-fit').addEventListener('click', ()=> {
    const data = readTableData(); if (!data.length || data.length < 2){ alert('Enter at least two valid (x,y) rows.'); return; }
    window.curveData = data; const type = fitType.value; let result = null;
    if (type === 'linear') result = Regression.linearFit(data);
    else if (type === 'polynomial') result = Regression.polynomialFit(data, Math.max(1, parseInt(degInput.value || 2)));
    else if (type === 'exponential') result = Regression.exponentialFit(data);
    else if (type === 'logarithmic') result = Regression.logarithmicFit(data);
    if (!result){ document.getElementById('fit-info').textContent = 'Fit failed or insufficient data for selected model.'; return; }
    window.lastFitResult = result; Plotter.plotScatterWithFit(document.getElementById('plot'), data, result.predict, getTheme());
    // Info block with formula and symbol definitions
    let info = '';
    if (type === 'linear'){
      info += 'Equation form: y = m × x + b\nWhere:\n  y → dependent variable\n  x → independent variable\n  m → slope\n  b → y-intercept\n\n';
      info += `Computed: y = ${Utils.round(result.coeffs[0],6)} × x + ${Utils.round(result.coeffs[1],6)}\nCorrelation coefficient (R²) = ${Utils.round(result.r2,6)}\n`;
    } else if (type === 'polynomial'){
      info += `Polynomial degree ${result.degree} (coeffs a0..a${result.coeffs.length-1})\nComputed coefficients:\n`;
      const coeffs = result.coeffs.map((c,i)=> `a${i}=${Utils.round(c,6)}`).join(', ');
      info += `${coeffs}\nCorrelation coefficient (R²) = ${Utils.round(result.r2,6)}\n`;
    } else if (type === 'exponential'){
      info += 'Equation form: y = A × exp(B × x)\n';
      info += `Computed: A = ${Utils.round(result.coeffs[0],6)}, B = ${Utils.round(result.coeffs[1],6)}\nR² = ${Utils.round(result.r2,6)}\n`;
    } else if (type === 'logarithmic'){
      info += 'Equation form: y = A + B × ln(x)\n';
      info += `Computed: A = ${Utils.round(result.coeffs[0],6)}, B = ${Utils.round(result.coeffs[1],6)}\nR² = ${Utils.round(result.r2,6)}\n`;
    }
    document.getElementById('fit-info').textContent = info;
  });

  // Initialize calculators
  Elec.init();

}); // DOMContentLoaded end
