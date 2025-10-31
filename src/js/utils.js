// utils.js - helpers
const Utils = (() => {
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out = [];
    for (let i=0;i<lines.length;i++){
      const row = lines[i].split(',').map(s=>s.trim()).filter(s=>s!=='');
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

  function downloadText(filename, text, mime='text/csv') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: mime}));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function round(v, digits=6) { return Number.parseFloat(v).toPrecision(digits); }

  return { parseCSV, csvFromArray, downloadText, round };
})();
