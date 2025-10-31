/* main.js — Complete functional CurveLab v0.7
   - Full regression (linear, polynomial, exponential, logarithmic)
   - Plotting (Plotly)
   - CSV import, clipboard paste (Excel), Clear
   - Table internal scrolling (tbody), controls always visible
   - Logger shows formula + substitutions + results (no timestamps)
*/

(() => {
  // UTILITIES
  const Utils = {
    parseCSV(text) {
      if (!text) return [];
      const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const out = [];
      for (const line of lines) {
        const cols = line.split(/\t|,/).map(c => c.trim());
        if (cols.length < 2) continue;
        const x = parseFloat(cols[0]), y = parseFloat(cols[1]);
        if (!isFinite(x) || !isFinite(y)) continue;
        out.push({ x, y });
      }
      return out;
    },
    round(v, p = 6) { return Number.isFinite(v) ? Number.parseFloat(v).toPrecision(p) : v; }
  };

  // LOGGER (single place)
  const Logger = (() => {
    const el = document.getElementById('logger');
    return {
      set(text) { if (el) { el.textContent = text; el.scrollTop = el.scrollHeight; } },
      clear() { if (el) el.innerHTML = ''; },
      append(text) { if (el) { const d = document.createElement('div'); d.textContent = text; el.appendChild(d); el.scrollTop = el.scrollHeight; } }
    };
  })();

  // REGRESSION implementation (uses mathjs)
  const Regression = (() => {
    function linearFit(data) {
      const n = data.length; if (n < 2) return null;
      const xs = data.map(d => d.x), ys = data.map(d => d.y);
      const xBar = math.mean(xs), yBar = math.mean(ys);
      const ssXY = math.sum(xs.map((x, i) => (x - xBar) * (ys[i] - yBar)));
      const ssXX = math.sum(xs.map(x => Math.pow(x - xBar, 2)));
      const m = ssXY / ssXX;
      const b = yBar - m * xBar;
      const predict = x => m * x + b;
      const residuals = ys.map((y, i) => y - predict(xs[i]));
      const ssRes = math.sum(residuals.map(r => r * r));
      const ssTot = math.sum(ys.map(y => Math.pow(y - yBar, 2)));
      const r2 = 1 - (ssRes / ssTot);
      const stderr = Math.sqrt(ssRes / (n - 2) || 0);
      return { coeffs: [m, b], r2, stderr, predict, type: 'linear' };
    }

    function polynomialFit(data, degree = 2) {
      const n = data.length;
      if (n < degree + 1) return null;
      const xs = data.map(d => d.x), ys = data.map(d => d.y);
      const m = degree + 1;
      // Vandermonde X (n x m)
      const X = xs.map(x => Array.from({ length: m }, (_, j) => Math.pow(x, j)));
      const XT = math.transpose(X);
      const A = math.multiply(XT, X);
      const bVec = math.multiply(XT, ys);
      let coeffs;
      try {
        const sol = math.lusolve(A, math.matrix(bVec));
        coeffs = sol.map(r => r[0]).valueOf ? sol.map(r => r[0]).valueOf() : sol;
      } catch (e) {
        try { coeffs = math.multiply(math.inv(A), bVec); } catch (e2) { return null; }
      }
      coeffs = coeffs.map(v => Number(v));
      const predict = x => coeffs.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
      const yBar = math.mean(ys);
      const residuals = ys.map((y, i) => y - predict(xs[i]));
      const ssRes = math.sum(residuals.map(r => r * r));
      const ssTot = math.sum(ys.map(y => Math.pow(y - yBar, 2)));
      const r2 = 1 - (ssRes / ssTot);
      const stderr = Math.sqrt(ssRes / (n - m) || 0);
      return { coeffs, r2, stderr, predict, degree, type: 'polynomial' };
    }

    function exponentialFit(data) {
      const filtered = data.filter(d => d.y > 0);
      if (filtered.length < 2) return null;
      const xs = filtered.map(d => d.x), ysLog = filtered.map(d => Math.log(d.y));
      const xBar = math.mean(xs), yBar = math.mean(ysLog);
      const ssXY = math.sum(xs.map((x, i) => (x - xBar) * (ysLog[i] - yBar)));
      const ssXX = math.sum(xs.map(x => Math.pow(x - xBar, 2)));
      const B = ssXY / ssXX;
      const lnA = yBar - B * xBar;
      const A = Math.exp(lnA);
      const predict = x => A * Math.exp(B * x);
      const residuals = filtered.map((d, i) => d.y - predict(d.x));
      const ssRes = math.sum(residuals.map(r => r * r));
      const ssTot = math.sum(filtered.map(d => Math.pow(d.y - math.mean(filtered.map(f => f.y)), 2)));
      const r2 = 1 - ssRes / ssTot;
      const stderr = Math.sqrt(ssRes / (filtered.length - 2) || 0);
      return { coeffs: [A, B], r2, stderr, predict, type: 'exponential' };
    }

    function logarithmicFit(data) {
      const filtered = data.filter(d => d.x > 0);
      if (filtered.length < 2) return null;
      const xs = filtered.map(d => Math.log(d.x)), ys = filtered.map(d => d.y);
      const xBar = math.mean(xs), yBar = math.mean(ys);
      const ssXY = math.sum(xs.map((x, i) => (x - xBar) * (ys[i] - yBar)));
      const ssXX = math.sum(xs.map(x => Math.pow(x - xBar, 2)));
      const B = ssXY / ssXX;
      const A = yBar - B * xBar;
      const predict = x => A + B * Math.log(x);
      const residuals = filtered.map((d, i) => d.y - predict(d.x));
      const ssRes = math.sum(residuals.map(r => r * r));
      const ssTot = math.sum(filtered.map(d => Math.pow(d.y - math.mean(filtered.map(f => f.y)), 2)));
      const r2 = 1 - ssRes / ssTot;
      const stderr = Math.sqrt(ssRes / (filtered.length - 2) || 0);
      return { coeffs: [A, B], r2, stderr, predict, type: 'logarithmic' };
    }

    return { linearFit, polynomialFit, exponentialFit, logarithmicFit };
  })();

  // PLOTTING
  const Plotter = (() => {
    function linspace(a, b, n) {
      const out = []; const step = (b - a) / (n - 1 || 1);
      for (let i = 0; i < n; i++) out.push(a + i * step);
      return out;
    }

    function plotScatterWithFit(el, data, predictFunc) {
      if (!el) return;
      if (!data || !data.length) { el.innerHTML = ''; return; }
      const sorted = data.slice().sort((a, b) => a.x - b.x);
      const xs = sorted.map(d => d.x), ys = sorted.map(d => d.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const pad = (maxX - minX) * 0.08 || 1;
      const xsLine = linspace(minX - pad, maxX + pad, 240);
      const ysLine = xsLine.map(x => predictFunc(x));

      const scatter = { x: xs, y: ys, mode: 'markers', name: 'Data', marker: { size:6 } };
      const fitLine = { x: xsLine, y: ysLine, mode: 'lines', name: 'Fit', line: { width:2 } };
      const layout = {
        margin: { t: 8, b: 40, l: 50, r: 10 },
        xaxis: { title: 'x' },
        yaxis: { title: 'y' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: '#ffffff'
      };
      Plotly.newPlot(el, [scatter, fitLine], layout, { responsive: true, displayModeBar: false });
    }

    return { plotScatterWithFit };
  })();

  // TABLE helpers & paste support
  const tbody = document.querySelector('#data-table tbody');
  function createRow(x = '', y = '') {
    const tr = document.createElement('tr');
    const tdX = document.createElement('td'); tdX.contentEditable = true; tdX.spellcheck = false; tdX.innerText = x;
    const tdY = document.createElement('td'); tdY.contentEditable = true; tdY.spellcheck = false; tdY.innerText = y;
    tr.appendChild(tdX); tr.appendChild(tdY);

    // Enter behavior
    tdX.addEventListener('keydown', (e) => handleCellKey(e, tdX));
    tdY.addEventListener('keydown', (e) => handleCellKey(e, tdY));

    // Paste multi-row
    tdX.addEventListener('paste', handlePaste);
    tdY.addEventListener('paste', handlePaste);

    return tr;
  }

  function handleCellKey(e, cell) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tr = cell.parentElement;
      const nextTD = cell.nextElementSibling;
      if (nextTD) { selectAll(nextTD); }
      else {
        appendEmptyRow();
        const lastFirst = tbody.querySelector('tr:last-child td:first-child');
        if (lastFirst) selectAll(lastFirst);
      }
    }
  }

  function selectAll(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    const rows = text.trim().split(/\r?\n/).map(r => r.split(/\t|,/).map(c => c.trim()));
    const startTr = e.target.parentElement;
    let startIndex = Array.from(tbody.children).indexOf(startTr);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const target = tbody.children[startIndex + i] || appendEmptyRow();
      if (row.length > 0) target.children[0].innerText = row[0] || '';
      if (row.length > 1) target.children[1].innerText = row[1] || '';
    }
  }

  function appendEmptyRow() {
    const r = createRow('', '');
    tbody.appendChild(r);
    return r;
  }

  function initRows(count = 12) {
    tbody.innerHTML = '';
    for (let i = 0; i < count; i++) tbody.appendChild(createRow('', ''));
  }

  function readData() {
    const out = [];
    for (const tr of tbody.querySelectorAll('tr')) {
      const a = tr.children[0].innerText.trim(), b = tr.children[1].innerText.trim();
      const x = parseFloat(a), y = parseFloat(b);
      if (isFinite(x) && isFinite(y)) out.push({ x, y });
    }
    return out;
  }

  // UI references
  const fileInput = document.getElementById('file-csv');
  const btnFit = document.getElementById('btn-fit');
  const btnClear = document.getElementById('clear-table');
  const fitType = document.getElementById('fit-type');
  const polyDegree = document.getElementById('poly-degree');
  const plotEl = document.getElementById('plot');

  // initial rows
  initRows(12);

  // CSV import
  fileInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const parsed = Utils.parseCSV(r.result);
      tbody.innerHTML = '';
      parsed.forEach(d => tbody.appendChild(createRow(d.x, d.y)));
      appendEmptyRow();
    };
    r.readAsText(f);
  });

  // Clear table
  btnClear.addEventListener('click', () => {
    initRows(12);
    Plotly.purge(plotEl);
    Logger.clear();
  });

  // Fit button
  btnFit.addEventListener('click', () => {
    const data = readData();
    if (!data.length || data.length < 2) { Logger.set('Enter at least two numeric (x,y) rows.'); return; }

    const t0 = performance.now();
    let res = null;
    const type = fitType.value;
    if (type === 'linear') res = Regression.linearFit(data);
    else if (type === 'polynomial') res = Regression.polynomialFit(data, Math.max(1, parseInt(polyDegree.value || 2)));
    else if (type === 'exponential') res = Regression.exponentialFit(data);
    else if (type === 'logarithmic') res = Regression.logarithmicFit(data);

    const t1 = performance.now();
    if (!res) { Logger.set('Fit failed or insufficient data for selected model.'); return; }

    // Plot
    Plotter.plotScatterWithFit(plotEl, data, res.predict);

    // Build nice result summary
    let info = '';
    if (res.type === 'linear') {
      info += 'Fitting type: Linear\n';
      info += 'Equation form: y = m × x + b\n';
      info += `Computed: m = ${Utils.round(res.coeffs[0],6)}   b = ${Utils.round(res.coeffs[1],6)}\n`;
      info += `Resulting equation: y = ${Utils.round(res.coeffs[0],6)}x + ${Utils.round(res.coeffs[1],6)}\n`;
      info += `Correlation coefficient (R²) = ${Utils.round(res.r2,6)}\n`;
      info += `Standard error = ${Utils.round(res.stderr,6)}\n`;
    } else if (res.type === 'polynomial') {
      info += `Fitting type: Polynomial (degree ${res.degree})\n`;
      info += `Coefficients: ${res.coeffs.map((c,i)=> `a${i}=${Utils.round(c,6)}`).join(', ')}\n`;
      info += `R² = ${Utils.round(res.r2,6)}\nStd err = ${Utils.round(res.stderr,6)}\n`;
    } else if (res.type === 'exponential') {
      info += 'Fitting type: Exponential\n';
      info += `y = A × exp(B × x)\nA = ${Utils.round(res.coeffs[0],6)}, B = ${Utils.round(res.coeffs[1],6)}\n`;
      info += `R² = ${Utils.round(res.r2,6)}\nStd err = ${Utils.round(res.stderr,6)}\n`;
    } else if (res.type === 'logarithmic') {
      info += 'Fitting type: Logarithmic\n';
      info += `y = A + B × ln(x)\nA = ${Utils.round(res.coeffs[0],6)}, B = ${Utils.round(res.coeffs[1],6)}\n`;
      info += `R² = ${Utils.round(res.r2,6)}\nStd err = ${Utils.round(res.stderr,6)}\n`;
    }
    info += `Run time = ${((t1 - t0) / 1000).toFixed(4)} s`;
    Logger.set(info);
  });

  // Keep references for replotting on resize
  window.addEventListener('resize', () => {
    // replot if needed (Plotly is responsive)
    // nothing mandatory here; Plotly handles responsive redraw
  });

  // expose for debugging if needed
  window._InlineNode = { Utils, Regression, Logger, Plotter };
})();
