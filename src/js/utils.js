// utils.js - helpers for CSV, download, rounding, parsing pasted clipboard
const Utils = (() => {
  function parseCSV(text) {
    if (!text) return [];
    // accept tabs or commas; return array of {x,y}
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      // split on tab or comma
      const cols = line.split(/\t|,/).map(c => c.trim());
      if (cols.length < 2) continue;
      const x = parseFloat(cols[0]);
      const y = parseFloat(cols[1]);
      if (!isFinite(x) || !isFinite(y)) continue;
      out.push({x, y});
    }
    return out;
  }

  function csvFromArray(xs, ys, header = 'x,y') {
    const rows = [header];
    for (let i=0;i<xs.length;i++) rows.push(`${xs[i]},${ys[i]}`);
    return rows.join('\n');
  }

  function downloadText(filename, text, mime='text/csv') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: mime}));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1200);
  }

  function round(v, digits=6) { return Number.isFinite(v) ? Number.parseFloat(v).toPrecision(digits) : v; }

  return { parseCSV, csvFromArray, downloadText, round };
})();
