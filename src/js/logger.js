// logger.js - simple timestamped logger used by all modules
const Logger = (() => {
  const el = () => document.getElementById('logger');

  function timeStamp() {
    const d = new Date();
    return d.toLocaleTimeString();
  }

  function push(level, msg) {
    const container = el();
    if (!container) return;
    const line = document.createElement('div');
    const tspan = document.createElement('span'); tspan.className = 'time'; tspan.textContent = `[${timeStamp()}]`;
    const mspan = document.createElement('span'); mspan.className = level; mspan.textContent = ` ${msg}`;
    line.appendChild(tspan); line.appendChild(mspan);
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    // also console.log for debug
    console.log(`[${timeStamp()}] ${msg}`);
  }

  return {
    info: (m) => push('info', m),
    ok: (m) => push('ok', m),
    warn: (m) => push('warn', m),
    err: (m) => push('err', m)
  };
})();
