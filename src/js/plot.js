// plot.js - helper to show scatter + fitted line/curve using Plotly

const Plotter = (() => {
  function plotScatterWithFit(el, data, predictFunc, opts = {}) {
    // data: [{x,y},...]
    const sorted = data.slice().sort((a,b)=> a.x - b.x);
    const xs = sorted.map(d=>d.x);
    const ys = sorted.map(d=>d.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const pad = (maxX - minX) * 0.08 || 1;
    const xsLine = linspace(minX - pad, maxX + pad, 240);
    const ysLine = xsLine.map(x => predictFunc(x));

    const scatter = {
      x: xs, y: ys, mode: 'markers', name: 'Data',
      marker: { size:6 }
    };
    const fitLine = {
      x: xsLine, y: ysLine, mode: 'lines', name: 'Fit',
      line: { width:2 }
    };

    const layout = {
      margin:{t:10,b:40,l:60,r:20},
      xaxis:{title:opts.xlabel || 'x'},
      yaxis:{title:opts.ylabel || 'y'},
      hovermode:'closest',
      paper_bgcolor:'white',
      plot_bgcolor:'white'
    };

    Plotly.newPlot(el, [scatter, fitLine], layout, {responsive:true});
  }

  function linspace(a,b,n) {
    const out = [];
    if (n <= 1) return [a];
    const step = (b - a) / (n - 1);
    for (let i=0;i<n;i++) out.push(a + i*step);
    return out;
  }

  return { plotScatterWithFit };
})();
