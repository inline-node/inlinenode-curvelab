// main.js - UI wiring (import CSV, table paste, clear, simple placeholder plot & logger)
document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#data-table tbody');
  const fileInput = document.getElementById('file-csv');
  const logger = document.getElementById('logger');
  const plotEl = document.getElementById('plot');

  // small helpers
  function newRow(x = '', y = '') {
    const tr = document.createElement('tr');
    const tdX = document.createElement('td'); tdX.contentEditable = true; tdX.innerText = x;
    const tdY = document.createElement('td'); tdY.contentEditable = true; tdY.innerText = y;
    tr.appendChild(tdX); tr.appendChild(tdY);
    // paste handling
    tdX.addEventListener('paste', handlePaste); tdY.addEventListener('paste', handlePaste);
    // enter to add row
    tdY.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); newRow(); } });
    tbody.appendChild(tr);
    return tr;
  }

  function readTableData() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const out = [];
    for (const tr of rows) {
      const a = tr.children[0].innerText.trim(), b = tr.children[1].innerText.trim();
      const x = parseFloat(a), y = parseFloat(b);
      if (isFinite(x) && isFinite(y)) out.push({x, y});
    }
    return out;
  }

  function clearTable() { tbody.innerHTML=''; for (let i=0;i<8;i++) newRow(); logClear(); logInfo('Table cleared.'); Plotly.purge(plotEl); }

  // logger helpers
  function log(msg) { const d = document.createElement('div'); d.textContent = msg; logger.appendChild(d); logger.scrollTop = logger.scrollHeight; }
  function logInfo(msg) { log('[INFO] ' + msg); }
  function logResult(msg) { log('[RESULT] ' + msg); }
  function logError(msg) { log('[ERROR] ' + msg); }
  function logClear(){ logger.innerHTML = ''; }

  // initial rows
  tbody.innerHTML=''; for (let i=0;i<8;i++) newRow();

  // paste from clipboard (multi-row)
  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const rows = text.trim().split(/\r?\n/).map(r => r.split(/\t|,/).map(c=>c.trim()));
    const startRow = e.target.parentElement;
    let idx = Array.from(tbody.children).indexOf(startRow);
    for (let r=0;r<rows.length;r++){
      const row = rows[r];
      const tr = tbody.children[idx + r] || newRow();
      if (row[0] !== undefined) tr.children[0].innerText = row[0];
      if (row[1] !== undefined) tr.children[1].innerText = row[1];
    }
    logInfo('Pasted data into table.');
  }

  // CSV import
  if (fileInput) {
    fileInput.addEventListener('change', (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const parsed = Utils.parseCSV(r.result);
        tbody.innerHTML = '';
        parsed.forEach(d => newRow(d.x, d.y));
        newRow();
        logInfo(`Imported ${parsed.length} rows from CSV.`);
        renderPlaceholderPlot(parsed);
      };
      r.readAsText(f);
    });
  }

  // delete / clear button
  document.getElementById('btn-delete').addEventListener('click', () => {
    if (confirm('Clear table? This action removes all data.')) { clearTable(); }
  });

  // Fit button (placeholder until math is wired)
  document.getElementById('btn-fit').addEventListener('click', () => {
    const data = readTableData();
    if (data.length < 2) { logError('Enter at least two valid (x,y) rows before fitting.'); return; }
    logClear();
    logInfo('Fit module not yet implemented. Placeholder results below.');
    logResult(`Data rows: ${data.length}`);
    // simple placeholder: show trend line with linear fit via a naive slope
    renderPlaceholderPlot(data);
  });

  // tiny plotting helper (placeholder) - draws points and a simple linear fit using Plotly
  function renderPlaceholderPlot(data){
    if (!data || !data.length) { plotEl.innerHTML = ''; return; }
    // sort
    const xs = data.map(d=>d.x);
    const ys = data.map(d=>d.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    // naive linear fit using least squares (small util here)
    const n = data.length;
    const xbar = xs.reduce((s,v)=>s+v,0)/n;
    const ybar = ys.reduce((s,v)=>s+v,0)/n;
    let num=0, den=0;
    for (let i=0;i<n;i++){ num += (xs[i]-xbar)*(ys[i]-ybar); den += (xs[i]-xbar)*(xs[i]-xbar); }
    const m = den===0?0:num/den; const b = ybar - m*xbar;
    const lineX = [minX, maxX]; const lineY = [m*minX + b, m*maxX + b];

    const traceData = [{ x: xs, y: ys, mode:'markers', name:'Data', marker:{size:6} },
                       { x: lineX, y: lineY, mode:'lines', name:'Fit', line:{width:2, color:'#ff7f0e'} }];
    const layout = {margin:{t:10,b:40,l:40,r:10}, xaxis:{title:'x'}, yaxis:{title:'y'}, plot_bgcolor:'#fff', paper_bgcolor:'#fafafb', showlegend:true};
    Plotly.newPlot(plotEl, traceData, layout, {displayModeBar:false, responsive:true});

    logResult(`Placeholder linear fit: y = ${m.toFixed(4)} x + ${b.toFixed(4)}`);
    logResult(`R² estimation: not computed (math module pending)`);
  }

  // expose small API
  window.IN = { logInfo, logResult, logError };
});
