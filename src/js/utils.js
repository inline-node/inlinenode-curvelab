// utils.js - light helpers (CSV parsing)
const Utils = (() => {
  function parseCSV(text) {
    if (!text) return [];
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      const cols = line.split(/\t|,/).map(c => c.trim());
      if (cols.length < 2) continue;
      const x = parseFloat(cols[0]); const y = parseFloat(cols[1]);
      if (!isFinite(x) || !isFinite(y)) continue;
      out.push({x, y});
    }
    return out;
  }
  return { parseCSV };
})();
