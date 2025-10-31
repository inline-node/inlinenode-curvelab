// logger.js - only prints computation results & formula breakdowns (no timestamps)
const Logger = (() => {
  const el = () => document.getElementById('logger');

  function push(msg) {
    const container = el();
    if (!container) return;
    const block = document.createElement('div');
    block.textContent = msg;
    container.appendChild(block);
    container.scrollTop = container.scrollHeight;
    // also console for dev
    console.log(msg);
  }

  return {
    info: (m) => push(m),
    clear: () => { const c = el(); if (c) c.innerHTML = ''; }
  };
})();
