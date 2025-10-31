// calculators.js - ElecTools pages, unit handling, detailed steps
const Elec = (() => {
  function u(v, mul) { return Number.isFinite(v) ? v * mul : NaN; }
  function pretty(v){ return Utils.round(v,6); }

  // OHM
  function ohmCalculate() {
    const V = parseFloat(document.getElementById('ohm-v').value);
    const I = parseFloat(document.getElementById('ohm-i').value);
    const Rraw = parseFloat(document.getElementById('ohm-r').value);
    const Rmul = Number(document.getElementById('ohm-r-unit').value);
    const R = Number.isFinite(Rraw) ? Rraw * Rmul : NaN;
    const P = parseFloat(document.getElementById('ohm-p').value);
    const out = document.getElementById('ohm-result');
    const known = {V: isFinite(V), I: isFinite(I), R: isFinite(R), P: isFinite(P)};
    if (Object.values(known).filter(Boolean).length < 2) { out.innerText = 'Provide at least two known values.'; return; }

    // Cases
    let txt = '';
    if (known.V && known.I) {
      const Rcalc = V / I; const Pcalc = V * I;
      txt += 'Equation used: V = I × R\n';
      txt += `Substitution: ${V} = ${I} × R\n=> R = V / I = ${pretty(Rcalc)} Ω\n\n`;
      txt += `Power: P = V × I = ${pretty(Pcalc)} W\n`;
      document.getElementById('ohm-r').value = pretty(Rcalc);
      document.getElementById('ohm-p').value = pretty(Pcalc);
    } else if (known.V && known.R) {
      const Icalc = V / R; const Pcalc = V * Icalc;
      txt += 'Equation used: V = I × R\n';
      txt += `Substitution: ${V} = I × ${pretty(R)}\n=> I = V / R = ${pretty(Icalc)} A\n\n`;
      txt += `Power: P = V × I = ${pretty(Pcalc)} W\n`;
      document.getElementById('ohm-i').value = pretty(Icalc);
      document.getElementById('ohm-p').value = pretty(Pcalc);
    } else if (known.I && known.R) {
      const Vcalc = I * R; const Pcalc = I * I * R;
      txt += 'Equation used: V = I × R\n';
      txt += `Substitution: V = ${I} × ${pretty(R)}\n=> V = ${pretty(Vcalc)} V\n\n`;
      txt += `Power: P = I² × R = ${pretty(Pcalc)} W\n`;
      document.getElementById('ohm-v').value = pretty(Vcalc);
      document.getElementById('ohm-p').value = pretty(Pcalc);
    } else if (known.P && known.V) {
      const Icalc = P / V; const Rcalc = V / Icalc;
      txt += 'Equation used: P = V × I\n';
      txt += `Substitution: I = P / V = ${pretty(Icalc)} A\n\nR = V / I = ${pretty(Rcalc)} Ω\n`;
      document.getElementById('ohm-i').value = pretty(Icalc);
      document.getElementById('ohm-r').value = pretty(Rcalc);
    } else if (known.P && known.I) {
      const Vcalc = P / I; const Rcalc = Vcalc / I;
      txt += 'Equation used: P = V × I\n';
      txt += `Substitution: V = P / I = ${pretty(Vcalc)} V\n\nR = V / I = ${pretty(Rcalc)} Ω\n`;
      document.getElementById('ohm-v').value = pretty(Vcalc);
      document.getElementById('ohm-r').value = pretty(Rcalc);
    } else if (known.P && known.R) {
      const Icalc = Math.sqrt(P / R); const Vcalc = Icalc * R;
      txt += 'Equation used: P = I² × R\n';
      txt += `Substitution: I = sqrt(P / R) = ${pretty(Icalc)} A\n\nV = I × R = ${pretty(Vcalc)} V\n`;
      document.getElementById('ohm-i').value = pretty(Icalc);
      document.getElementById('ohm-v').value = pretty(Vcalc);
    } else {
      txt = 'Unsupported combination.';
    }
    out.innerText = txt;
  }
  function ohmClear() { ['ohm-v','ohm-i','ohm-r','ohm-p'].forEach(id=>document.getElementById(id).value=''); document.getElementById('ohm-result').textContent=''; }

  // Voltage divider
  function vdCalculate() {
    const Vin = parseFloat(document.getElementById('vd-vin').value);
    const R1raw = parseFloat(document.getElementById('vd-r1').value);
    const R1mul = Number(document.getElementById('vd-r1-unit').value); const R1 = isFinite(R1raw) ? R1raw * R1mul : NaN;
    const R2raw = parseFloat(document.getElementById('vd-r2').value);
    const R2mul = Number(document.getElementById('vd-r2-unit').value); const R2 = isFinite(R2raw) ? R2raw * R2mul : NaN;
    const Vout = parseFloat(document.getElementById('vd-vout').value);
    const out = document.getElementById('vd-result');
    const known = {Vin:isFinite(Vin),R1:isFinite(R1),R2:isFinite(R2),Vout:isFinite(Vout)};
    if (Object.values(known).filter(Boolean).length < 3) { out.innerText = 'Provide any three values to compute the fourth.'; return; }
    let txt='';
    if (known.Vin && known.R1 && known.R2 && !known.Vout) {
      const v=Vin*(R2/(R1+R2));
      txt += 'Equation used: Vout = Vin × (R2 / (R1 + R2))\n';
      txt += `Substitution: Vout = ${Vin} × (${R2} / (${R1} + ${R2}))\nResult: Vout = ${pretty(v)} V\n`;
      document.getElementById('vd-vout').value = pretty(v);
    } else if (known.Vin && known.R1 && known.Vout && !known.R2) {
      if (Math.abs(Vin - Vout) < 1e-12) { out.innerText = 'Vin and Vout equal — cannot compute R2.'; return; }
      const r2 = R1 * (Vout / (Vin - Vout));
      txt += 'Rearranged: R2 = R1 × (Vout / (Vin - Vout))\n';
      txt += `Substitution: R2 = ${R1} × (${Vout} / (${Vin} - ${Vout}))\nResult: R2 = ${pretty(r2)} Ω\n`;
      document.getElementById('vd-r2').value = pretty(r2);
    } else if (known.Vin && known.R2 && known.Vout && !known.R1) {
      if (Math.abs(Vout) < 1e-12) { out.innerText = 'Vout zero — cannot compute R1.'; return; }
      const r1 = R2 * ((Vin - Vout) / Vout);
      txt += 'Rearranged: R1 = R2 × ((Vin - Vout) / Vout)\n';
      txt += `Substitution: R1 = ${R2} × ((${Vin} - ${Vout}) / ${Vout})\nResult: R1 = ${pretty(r1)} Ω\n`;
      document.getElementById('vd-r1').value = pretty(r1);
    } else if (known.R1 && known.R2 && known.Vout && !known.Vin) {
      const vin = Vout * ((R1 + R2) / R2);
      txt += 'Rearranged: Vin = Vout × ((R1 + R2) / R2)\n';
      txt += `Substitution: Vin = ${Vout} × ((${R1} + ${R2}) / ${R2})\nResult: Vin = ${pretty(vin)} V\n`;
      document.getElementById('vd-vin').value = pretty(vin);
    } else {
      txt = 'Unsupported combo or division risk.';
    }
    out.innerText = txt;
  }
  function vdClear(){ ['vd-vin','vd-r1','vd-r2','vd-vout'].forEach(id=>document.getElementById(id).value=''); document.getElementById('vd-result').textContent=''; }

  // RC
  function rcCalculate(){ 
    const Rraw = parseFloat(document.getElementById('rc-r').value);
    const Rmul = Number(document.getElementById('rc-r-unit').value); const R = isFinite(Rraw) ? Rraw * Rmul : NaN;
    const C = parseFloat(document.getElementById('rc-c').value); const out = document.getElementById('rc-result');
    if (!isFinite(R) || !isFinite(C)) { out.innerText='Enter R and C'; return; }
    const tau = R * C;
    document.getElementById('rc-tau').value = pretty(tau);
    out.innerText = `Equation: τ = R × C\nSubstitution: τ = ${R} × ${C}\nResult: τ = ${pretty(tau)} s\n(≈63.2% at t = τ)`;
  }
  function rcClear(){ ['rc-r','rc-c','rc-tau'].forEach(id=>document.getElementById(id).value=''); document.getElementById('rc-result').textContent=''; }

  // series/parallel
  function rpCalculate(){
    const a = parseFloat(document.getElementById('rp-a').value);
    const b = parseFloat(document.getElementById('rp-b').value);
    const mode = document.getElementById('rp-mode').value; const out = document.getElementById('rp-result');
    if (!isFinite(a) || !isFinite(b)) { out.innerText='Enter both resistances'; return; }
    if (mode==='series'){ const r = a + b; out.innerText = `Series: R = RA + RB = ${a} + ${b} = ${pretty(r)} Ω`; }
    else { if (a<=0||b<=0){ out.innerText='Resistances must be positive'; return; } const r = (a*b)/(a+b); out.innerText = `Parallel: R = (RA×RB)/(RA+RB) = ${pretty(r)} Ω`; }
  }
  function rpClear(){ ['rp-a','rp-b'].forEach(id=>document.getElementById(id).value=''); document.getElementById('rp-result').textContent=''; }

  function init(){
    document.getElementById('ohm-calc').addEventListener('click', ohmCalculate);
    document.getElementById('ohm-clear').addEventListener('click', ohmClear);
    document.getElementById('vd-calc').addEventListener('click', vdCalculate);
    document.getElementById('vd-clear').addEventListener('click', vdClear);
    document.getElementById('rc-calc').addEventListener('click', rcCalculate);
    document.getElementById('rc-clear').addEventListener('click', rcClear);
    document.getElementById('rp-calc').addEventListener('click', rpCalculate);
    document.getElementById('rp-clear').addEventListener('click', rpClear);
  }

  return { init };
})();
