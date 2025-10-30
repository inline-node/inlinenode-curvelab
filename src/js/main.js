// main.js - app wiring
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabCurve = document.getElementById('tab-curvelab');
  const tabElec = document.getElementById('tab-electools');
  const viewCurve = document.getElementById('curvelab');
  const viewElec = document.getElementById('electools');

  function showCurve() {
    tabCurve.classList.add('active'); tabElec.classList.remove('active');
    viewCurve.style.display = ''; viewElec.style.display = 'none';
  }
  function showElec() {
    tabElec.classList.add('active'); tabCurve.classList.remove('active');
    viewElec.style.display = ''; viewCurve.style.display = 'none';
  }
  tabCurve.addEventListener('click', showCurve);
  tabElec.addEventListener('click', showElec);

  // load sample:
  document.getElementById('open-sample').addEventListener('click', (e) => {
    e.preventDefault();
    const sample = `x,y
0,1
1,2
2,2.9
3,4.1
4,4.9
5,6.2
6,7.1
7,8.2`;
    document.getElementById('paste-area').value = sample;
    loadFromTextarea();
  });

  // file input
  const fileInput = document.getElementById('file-input');
  fileInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById('paste-area').value = reader.result;
      loadFromTextarea();
    };
    reader.readAsText(f);
  });

  // paste area load
  function loadFromTextarea() {
    const text = document.getElementById('paste-area').value;
    const data = Utils.parseCSV(text);
    if (!data.length) {
      document.getElementById('data-table-container').textContent = 'No valid x,y rows found.';
      return;
    }
    // show small table
    const preview = data.slice(0, 20).map(d => `${d.x}, ${d.y}`).join('\n');
    document.getElementById('data-table-container').textContent = `Loaded ${data.length} rows. Preview:\n` + preview;
    // store
    window.__curvelab_data = data;
  }

  document.getElementById('paste-area').addEventListener('input', () => {
    // lazy load, don't parse every keystroke unless user clicks Fit
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    document.getElementById('paste-area').value = '';
    document.getElementById('data-table-container').textContent = '';
    window.__curvelab_data = [];
    const plotEl = document.getElementById('plot');
    Plotly.purge(plotEl);
    document.getElementById('fit-info').textContent = '';
  });

  // show/hide degree input when polynomial chosen
  const fitType = document.getElementById('fit-type');
  const degLabel = document.getElementById('deg-label');
  const degInput = document.getElementById('poly-degree');
  fitType.addEventListener('change', () => {
    if (fitType.value === 'polynomial') {
      degLabel.style.display = ''; degInput.style.display = '';
    } else {
      degLabel.style.display = 'none'; degInput.style.display = 'none';
    }
  });

  // Fit button
  document.getElementById('btn-fit').addEventListener('click', () => {
    const data = window.__curvelab_data || Utils.parseCSV(document.getElementById('paste-area').value || '');
    if (!data || data.length < 2) {
      alert('Please load or paste at least two data points (x,y).');
      return;
    }
    const type = fitType.value;
    let result = null;
    if (type === 'linear') result = Regression.linearFit(data);
    else if (type === 'polynomial') result = Regression.polynomialFit(data, Math.max(1, parseInt(degInput.value || 2)));
    else if (type === 'exponential') result = Regression.exponentialFit(data);
    else if (type === 'logarithmic') result = Regression.logarithmicFit(data);

    if (!result) {
      document.getElementById('fit-info').textContent = 'Fit failed or insufficient data for selected model.';
      return;
    }

    // Plot
    const plotEl = document.getElementById('plot');
    Plotter.plotScatterWithFit(plotEl, data, result.predict);

    // Info
    let info = `R² = ${ (result.r2||0).toFixed(6) }`;
    if (result.coeffs) {
      if (result.degree && result.degree >= 1) {
        const coeffs = result.coeffs.map((c,i) => `a${i}=${Number(c).toPrecision(6)}`).join(', ');
        info += ` | coeffs: ${coeffs}`;
      } else if (result.type === 'exp') {
        info += ` | A=${Number(result.coeffs[0]).toPrecision(6)}, B=${Number(result.coeffs[1]).toPrecision(6)}`;
      } else if (result.type === 'log') {
        info += ` | A=${Number(result.coeffs[0]).toPrecision(6)}, B=${Number(result.coeffs[1]).toPrecision(6)}`;
      } else if (result.coeffs.length === 2) {
        info += ` | slope=${Number(result.coeffs[0]).toPrecision(6)}, intercept=${Number(result.coeffs[1]).toPrecision(6)}`;
      }
    }
    document.getElementById('fit-info').textContent = info;

    // store fitted values for export
    const xsLine = (() => {
      const xs = data.map(d=>d.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const pad = (maxX - minX) * 0.02 || 1;
      const pts = [];
      for (let i=0;i<Math.max(50, data.length);i++) {
        const x = minX - pad + (i/(Math.max(50, data.length)-1)) * ((maxX+pad) - (minX-pad));
        pts.push({x, y: result.predict(x)});
      }
      return pts;
    })();
    window.__curvelab_fitted = xsLine;
  });

  // export fitted CSV
  document.getElementById('btn-export').addEventListener('click', () => {
    const fitted = window.__curvelab_fitted;
    if (!fitted || !fitted.length) {
      alert('No fitted results to export. Run a fit first.');
      return;
    }
    const xs = fitted.map(p=>p.x);
    const ys = fitted.map(p=>p.y);
    const csv = Utils.csvFromArray(xs, ys, 'x,y');
    Utils.downloadText('fitted.csv', csv);
  });

  // Initialize ElecTools
  ElecTools.init();

  // small initialization state
  window.__curvelab_data = [];
  window.__curvelab_fitted = [];

});
