// utils.js - small helpers
const Utils = (() => {
  function parseCSV(text) {
    // returns array of {x:Number, y:Number}
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out = [];
    for (let i=0;i<lines.length;i++){
      const row = lines[i].split(',').map(s=>s.trim());
      if (row.length < 2) continue;
      const x = parseFloat(row[0]);
      const y = parseFloat(row[1]);
      if (!isFinite(x) || !isFinite(y)) continue;
      out.push({x, y});
    }
    return out;
  }

  function csvFromArray(xs, ys, header = 'x,y') {
    const rows = [header];
    for (let i=0;i<xs.length;i++){
      rows.push(`${xs[i]},${ys[i]}`);
    }
    return rows.join('\n');
  }

  function downloadText(filename, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: 'text/csv'}));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function approxEqual(a,b,eps=1e-9){ return Math.abs(a-b) <= eps }

  return { parseCSV, csvFromArray, downloadText, approxEqual };
})();
