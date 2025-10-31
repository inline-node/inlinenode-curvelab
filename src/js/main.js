// main.js - wiring, spreadsheet, nav, theme
document.addEventListener('DOMContentLoaded', () => {
  // Navigation wiring
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(btn => btn.addEventListener('click', (e) => {
    navItems.forEach(n => n.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const view = e.currentTarget.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.style.display = (v.id === view ? '' : 'none'));
    // on view change, if plot present, resize
    if (view === 'curvelab') {
      setTimeout(()=> { if (window.lastFitResult) { Plotter.plotScatterWithFit(document.getElementById('plot'), window.curveData || [], window.lastFitResult.predict || (()=>0), getTheme()); } }, 120);
    }
  }));

  // Theme toggle
  const app = document.getElementById('app');
  const themeSwitch = document.getElementById('theme-switch');
  const saved = localStorage.getItem('inlinenode-theme') || 'light';
  setTheme(saved);
  themeSwitch.checked = (saved === 'dark');
  themeSwitch.addEventListener('change', () => setTheme(themeSwitch.checked ? 'dark' : 'light'));

  function setTheme(t) {
    app.setAttribute('data-theme', t);
    localStorage.setItem('inlinenode-theme', t);
    // replot with theme
    if (window.lastFitResult) {
      Plotter.plotScatterWithFit(document.getElementById('plot'), window.curveData || [], window.lastFitResult.predict || (()=>0), t);
    }
  }
  function getTheme() { return app.getAttribute('data-theme') || 'light'; }

  // Spreadsheet table helpers
  const tbody = document.querySelector('#data-table tbody');

  function newRow(x='', y='') {
    const tr = document.createElement('tr');
    const tdX = document.createElement('td');
    tdX.contentEditable = true; tdX.spellcheck = false; tdX.innerText = (x==='') ? '' : x;
    const tdY = document.createElement('td');
    tdY.contentEditable = true; tdY.spellcheck = false; tdY.innerText = (y==='') ? '' : y;
    tr.appendChild(tdX); tr.appendChild(tdY);
    // Enter behavior
    tdX.addEventListener('keydown', (e) => handleCellKey(e, tdX, tdY));
    tdY.addEventListener('keydown', (e) => handleCellKey(e, tdY, tdX));
    // Paste handler to accept CSV blocks
    tdX.addEventListener('paste', handlePaste);
    tdY.addEventListener('paste', handlePaste);
    tbody.appendChild(tr);
    return tr;
  }

  function handleCellKey(e, cell, nextCell) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // move to next cell or create new row
      if (cell.nextElementSibling) {
        cell.nextElementSibling.focus();
        selectAll(cell.nextElementSibling);
      } else {
        // last column, create row and focus X
        const last = newRow('','');
        last.firstChild.focus();
      }
    }
    // if editing last row and typing, ensure there's another empty row
    setTimeout(()=> {
      const rows = tbody.querySelectorAll('tr');
      const lastRow = rows[rows.length-1];
      const anyContent = Array.from(lastRow.children).some(td => td.innerText.trim() !== '');
      if (anyContent) newRow('','');
    }, 10);
  }

  function selectAll(el) { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(range); }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    // parse CSV like content rows and fill downward from this cell's row
    const rows = text.trim().split(/\r?\n/).map(r=> r.split(',').map(c=>c.trim()));
    const startTr = e.target.parentElement;
    let rIndex = Array.from(tbody.children).indexOf(startTr);
    for (let i=0;i<rows.length;i++){
      const row = rows[i];
      const targetRow = tbody.children[rIndex + i] || newRow('','');
      if (row.length > 0) targetRow.children[0].innerText = row[0] || '';
      if (row.length > 1) targetRow.children[1].innerText = row[1] || '';
    }
    // ensure last row blank
    const lastRow = tbody.lastElementChild;
    const any = Array.from(lastRow.children).some(td=>td.innerText.trim() !== '');
    if (any) newRow('','');
  }

  // load initial rows
  for (let i=0;i<8;i++) newRow('','');

  // file import
  document.getElementById('file-csv').addEventListener('change', (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = Utils.parseCSV(reader.result);
      loadDataToTable(parsed);
    };
    reader.readAsText(f);
  });

  document.getElementById('load-sample').addEventListener('click', () => {
    const sample = `0,1\n1,2\n2,2.9\n3,4.1\n4,4.9\n5,6.2\n6,7.1\n7,8.2`;
    const parsed = Utils.parseCSV(sample);
    loadDataToTable(parsed);
  });

  function loadDataToTable(data) {
    tbody.innerHTML = '';
    data.forEach(d => newRow(d.x, d.y));
    newRow('','');
    window.curveData = data;
  }

  function readTableData() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const out = [];
    for (const tr of rows) {
      const a = tr.children[0].innerText.trim();
      const b = tr.children[1].innerText.trim();
      const x = parseFloat(a); const y = parseFloat(b);
      if (isFinite(x) && isFinite(y)) out.push({x,y});
    }
    return out;
  }

  document.getElementById('export-csv').addEventListener('click', () => {
    const data = readTableData();
    if (!data.length) { alert('No numeric data to export.'); return; }
    const xs = data.map(d=>d.x); const ys = data.map(d=>d.y);
    const csv = Utils.csvFromArray(xs, ys);
    Utils.downloadText('data.csv', csv);
  });

  document.getElementById('clear-table').addEventListener('click', () => {
    tbody.innerHTML = '';
    for (let i=0;i<6;i++) newRow('','');
    window.curveData = [];
    Plotly.purge(document.getElementById('plot'));
    document.getElementById('fit-info').textContent = '';
    window.lastFitResult = null;
  });

  // Fit behavior
  const fitType = document.getElementById('fit-type');
  const degLabel = document.getElementById('deg-label');
  const degInput = document.getElementById('poly-degree');
  fitType.addEventListener('change', () => {
    if (fitType.value === 'polynomial') { degLabel.style.display=''; degInput.style.display=''; }
    else { degLabel.style.display='none'; degInput.style.display='none'; }
  });

  document.getElementById('btn-fit').addEventListener('click', () => {
    const data = readTableData();
    if (!data.length || data.length < 2) { alert('Enter at least two valid (x,y) rows.'); return; }
    window.curveData = data;
    const type = fitType.value;
    let result = null;
    if (type === 'linear') result = Regression.linearFit(data);
    else if (type === 'polynomial') result = Regression.polynomialFit(data, Math.max(1, parseInt(degInput.value || 2)));
    else if (type === 'exponential') result = Regression.exponentialFit(data);
    else if (type === 'logarithmic') result = Regression.logarithmicFit(data);

    if (!result) { document.getElementById('fit-info').textContent = 'Fit failed or insufficient data for selected model.'; return; }
    window.lastFitResult = result;

    // plot
    Plotter.plotScatterWithFit(document.getElementById('plot'), data, result.predict, getTheme());

    // show info
    let info = `R² = ${(result.r2||0).toFixed(6)}\n`;
    if (result.coeffs) {
      if (result.degree && result.degree >= 1) {
        const coeffs = result.coeffs.map((c,i) => `a${i}=${Utils.round(c,6)}`).join(', ');
        info += `coeffs: ${coeffs}\n`;
      } else if (result.type === 'exp') {
        info += `A=${Utils.round(result.coeffs[0],6)}, B=${Utils.round(result.coeffs[1],6)}\n`;
      } else if (result.type === 'log') {
        info += `A=${Utils.round(result.coeffs[0],6)}, B=${Utils.round(result.coeffs[1],6)}\n`;
      } else if (result.coeffs.length === 2) {
        info += `slope=${Utils.round(result.coeffs[0],6)}, intercept=${Utils.round(result.coeffs[1],6)}\n`;
      }
    }
    document.getElementById('fit-info').textContent = info;
  });

  // init ElecTools
  Elec.init();

  // expose theme getter
  window.getTheme = getTheme;
});
