// calculators.js - ElecTools with detailed breakdowns
const Elec = (() => {

  function pretty(v) { return Utils.round(v,6); }

  // OHM's law & power: solve for missing variable(s)
  function ohmCalculate() {
    const V = parseFloat(document.getElementById('ohm-v').value);
    const I = parseFloat(document.getElementById('ohm-i').value);
    const R = parseFloat(document.getElementById('ohm-r').value);
    const P = parseFloat(document.getElementById('ohm-p').value);
    const out = document.getElementById('ohm-result');

    // Count knowns
    const knowns = { V: isFinite(V), I: isFinite(I), R: isFinite(R), P: isFinite(P) };
    const knownCount = Object.values(knowns).filter(Boolean).length;

    if (knownCount < 2) {
      out.innerText = 'Provide at least two known values (V, I, R, or P).';
      return;
    }

    // Try common calculation choices: prefer V,I -> R,P; or any pair.
    let text = '';
    // If V and I known:
    if (knowns.V && knowns.I) {
      const Rcalc = V / I;
      const Pcalc = V * I;
      text += `Using V = I × R\nSubstitution: ${V} = ${I} × R\n=> R = V / I = ${pretty(Rcalc)} Ω\n\n`;
      text += `Power: P = V × I = ${pretty(Pcalc)} W\n`;
      out.innerText = text;
      return;
    }
    // If V and R known:
    if (knowns.V && knowns.R) {
      const Icalc = V / R;
      const Pcalc = V * Icalc;
      text += `Using V = I × R\nSubstitution: ${V} = I × ${R}\n=> I = V / R = ${pretty(Icalc)} A\n\n`;
      text += `Power: P = V × I = ${pretty(Pcalc)} W\n`;
      out.innerText = text;
      return;
    }
    // If I and R known:
    if (knowns.I && knowns.R) {
      const Vcalc = I * R;
      const Pcalc = I * I * R;
      text += `Using V = I × R\nSubstitution: V = ${I} × ${R}\n=> V = ${pretty(Vcalc)} V\n\n`;
      text += `Power: P = I² × R = ${pretty(Pcalc)} W\n`;
      out.innerText = text;
      return;
    }
    // If P and V known:
    if (knowns.P && knowns.V) {
      const Icalc = P / V;
      const Rcalc = V / Icalc;
      text += `Using P = V × I => I = P / V\nSubstitution: I = ${P} / ${V} = ${pretty(Icalc)} A\n\n`;
      text += `R = V / I = ${pretty(Rcalc)} Ω\n`;
      out.innerText = text;
      return;
    }
    // If P and I known:
    if (knowns.P && knowns.I) {
      const Vcalc = P / I;
      const Rcalc = Vcalc / I;
      text += `Using P = V × I => V = P / I\nSubstitution: V = ${P} / ${I} = ${pretty(Vcalc)} V\n\n`;
      text += `R = V / I = ${pretty(Rcalc)} Ω\n`;
      out.innerText = text;
      return;
    }
    // If P and R known:
    if (knowns.P && knowns.R) {
      const Icalc = Math.sqrt(P / R);
      const Vcalc = Icalc * R;
      text += `Using P = I² × R => I = sqrt(P / R)\nSubstitution: I = sqrt(${P} / ${R}) = ${pretty(Icalc)} A\n\n`;
      text += `V = I × R = ${pretty(Vcalc)} V\n`;
      out.innerText = text;
      return;
    }

    out.innerText = 'Computation not supported for provided combination.';
  }

  function ohmClear() {
    ['ohm-v','ohm-i','ohm-r','ohm-p'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ohm-result').textContent = '';
  }

  // Voltage divider: allow solving any single unknown among Vin,R1,R2,Vout (requires 3 knowns)
  function vdCalculate() {
    const Vin = parseFloat(document.getElementById('vd-vin').value);
    const R1 = parseFloat(document.getElementById('vd-r1').value);
    const R2 = parseFloat(document.getElementById('vd-r2').value);
    const Vout = parseFloat(document.getElementById('vd-vout').value);
    const out = document.getElementById('vd-result');

    const known = {Vin: isFinite(Vin), R1: isFinite(R1), R2: isFinite(R2), Vout: isFinite(Vout)};
    const cnt = Object.values(known).filter(Boolean).length;
    if (cnt < 3) {
      out.innerText = 'Provide any three values to compute the fourth.';
      return;
    }

    let text = '';
    // If Vin,R1,R2 known -> compute Vout
    if (known.Vin && known.R1 && known.R2 && !known.Vout) {
      const v = Vin * (R2 / (R1 + R2));
      text += `Equation used: Vout = Vin × (R2 / (R1 + R2))\nSubstitution: Vout = ${Vin} × (${R2} / (${R1} + ${R2}))\nResult: Vout = ${pretty(v)} V\n`;
      out.innerText = text;
      return;
    }
    // If Vin,R1,Vout known -> compute R2
    if (known.Vin && known.R1 && known.Vout && !known.R2) {
      if (Math.abs(Vin - Vout) < 1e-12) { out.innerText = 'Vin and Vout equal — cannot solve for R2 (division by zero).'; return; }
      const r2 = R1 * (Vout / (Vin - Vout));
      text += `Rearranged: R2 = R1 × (Vout / (Vin - Vout))\nSubstitution: R2 = ${R1} × (${Vout} / (${Vin} - ${Vout}))\nResult: R2 = ${pretty(r2)} Ω\n`;
      out.innerText = text; return;
    }
    // If Vin,R2,Vout known -> compute R1
    if (known.Vin && known.R2 && known.Vout && !known.R1) {
      if (Math.abs(Vout) < 1e-12) { out.innerText = 'Vout is zero — cannot compute R1 (division by zero).'; return; }
      const r1 = R2 * ((Vin - Vout) / Vout);
      text += `Rearranged: R1 = R2 × ((Vin - Vout) / Vout)\nSubstitution: R1 = ${R2} × ((${Vin} - ${Vout}) / ${Vout})\nResult: R1 = ${pretty(r1)} Ω\n`;
      out.innerText = text; return;
    }
    // If R1,R2,Vout known -> compute Vin
    if (known.R1 && known.R2 && known.Vout && !known.Vin) {
      const vin = Vout * ((R1 + R2) / R2);
      text += `Rearranged: Vin = Vout × ((R1 + R2) / R2)\nSubstitution: Vin = ${Vout} × ((${R1} + ${R2}) / ${R2})\nResult: Vin = ${pretty(vin)} V\n`;
      out.innerText = text; return;
    }

    out.innerText = 'Unsupported combination or division by zero risk. Provide three valid values.';
  }

  function vdClear() {
    ['vd-vin','vd-r1','vd-r2','vd-vout'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('vd-result').textContent = '';
  }

  // RC time constant
  function rcCalculate() {
    const R = parseFloat(document.getElementById('rc-r').value);
    const C = parseFloat(document.getElementById('rc-c').value);
    const out = document.getElementById('rc-result');
    if (!isFinite(R) || !isFinite(C)) { out.innerText = 'Enter R (Ω) and C (F)'; return; }
    const tau = R * C;
    document.getElementById('rc-tau').value = pretty(tau);
    out.innerText = `Equation: τ = R × C\nSubstitution: τ = ${R} × ${C}\nResult: τ = ${pretty(tau)} seconds\n(≈63.2% charge at t = τ)`;
  }

  function rcClear() {
    ['rc-r','rc-c','rc-tau'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('rc-result').textContent = '';
  }

  // Series / Parallel quick helper
  function rpCalculate() {
    const a = parseFloat(document.getElementById('rp-a').value);
    const b = parseFloat(document.getElementById('rp-b').value);
    const mode = document.getElementById('rp-mode').value;
    const out = document.getElementById('rp-result');
    if (!isFinite(a) || !isFinite(b)) { out.innerText = 'Enter both resistances.'; return; }
    if (mode === 'series') {
      const r = a + b;
      out.innerText = `Series: R = RA + RB = ${a} + ${b} = ${pretty(r)} Ω`;
    } else {
      if (a <= 0 || b <= 0) { out.innerText = 'Resistances must be positive for parallel calculation.'; return; }
      const r = (a * b) / (a + b);
      out.innerText = `Parallel: 1/R = 1/RA + 1/RB\n=> R = (RA × RB) / (RA + RB)\nResult: R = ${pretty(r)} Ω`;
    }
  }

  function rpClear() {
    ['rp-a','rp-b'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('rp-result').textContent = '';
  }

  function init() {
    // wiring
    document.getElementById('ohm-calc').addEventListener('click', ohmCalculate);
    document.getElementById('ohm-clear').addEventListener('click', ohmClear);
    document.getElementById('vd-calc').addEventListener('click', vdCalculate);
    document.getElementById('vd-clear').addEventListener('click', vdClear);
    document.getElementById('rc-calc').addEventListener('click', rcCalculate);
    document.getElementById('rc-clear').addEventListener('click', rcClear);
    document.getElementById('rp-calc').addEventListener('click', rpCalculate);
    document.getElementById('rp-clear').addEventListener('click', rpClear);
    document.getElementById('elec-reset-all').addEventListener('click', () => {
      ohmClear(); vdClear(); rcClear(); rpClear();
    });
  }

  return { init };
})();
