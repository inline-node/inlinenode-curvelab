// plot.js - theme-aware plotting wrapper
const Plotter = (() => {
  function plotScatterWithFit(el, data, predictFunc, theme='light') {
    if (!el) return;
    if (!data || !data.length) { el.innerHTML = ''; return; }
    const sorted = data.slice().sort((a,b)=> a.x - b.x);
    const xs = sorted.map(d=>d.x); const ys = sorted.map(d=>d.y);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const pad = (maxX - minX) * 0.08 || 1;
    const xsLine = linspace(minX - pad, maxX + pad, 240);
    const ysLine = xsLine.map(x => predictFunc(x));

    const scatter = { x: xs, y: ys, mode: 'markers', name: 'Data', marker: { size:6 } };
    const fitLine = { x: xsLine, y: ysLine, mode: 'lines', name: 'Fit', line: { width:2 } };

    const isDark = theme === 'dark';
    const layout = {
      margin:{t:6,b:36,l:48,r:10},
      xaxis:{title:'x', tickcolor: isDark ? '#9aa7b4' : '#666'},
      yaxis:{title:'y', tickcolor: isDark ? '#9aa7b4' : '#666'},
      hovermode:'closest',
      paper_bgcolor: isDark ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0)',
      plot_bgcolor: isDark ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0)',
      font: { color: isDark ? '#e6eef8' : '#1f2937' }
    };

    Plotly.newPlot(el, [scatter, fitLine], layout, {responsive:true,displayModeBar:false});
  }

  function linspace(a,b,n) { const out=[]; const step=(b-a)/(n-1||1); for(let i=0;i<n;i++) out.push(a+i*step); return out; }
  return { plotScatterWithFit };
})();
