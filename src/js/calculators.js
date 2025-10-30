// calculators.js - electronics tools UI and logic
const ElecTools = (() => {

  function init() {
    // Ohm's law
    document.getElementById('ohm-calc').addEventListener('click', () => {
      const V = parseFloat(document.getElementById('ohm-v').value);
      const I = parseFloat(document.getElementById('ohm-i').value);
      const R = parseFloat(document.getElementById('ohm-r').value);
      const out = document.getElementById('ohm-result');

      // Determine which is missing
      if (isFinite(V) && isFinite(I) && !isFinite(R)) {
        out.textContent = `R = V / I = ${ (V / I).toPrecision(6) } Ω`;
      } else if (isFinite(V) && isFinite(R) && !isFinite(I)) {
        out.textContent = `I = V / R = ${ (V / R).toPrecision(6) } A`;
      } else if (isFinite(I) && isFinite(R) && !isFinite(V)) {
        out.textContent = `V = I × R = ${ (I * R).toPrecision(6) } V`;
      } else {
        out.textContent = 'Provide any two values to compute the third.';
      }
    });
    document.getElementById('ohm-clear').addEventListener('click', () => {
      ['ohm-v','ohm-i','ohm-r'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('ohm-result').textContent='';
    });

    // Voltage divider
    document.getElementById('vd-calc').addEventListener('click', () => {
      const Vin = parseFloat(document.getElementById('vd-vin').value);
      const R1 = parseFloat(document.getElementById('vd-r1').value);
      const R2 = parseFloat(document.getElementById('vd-r2').value);
      const out = document.getElementById('vd-result');
      if (!isFinite(Vin) || !isFinite(R1) || !isFinite(R2)) {
        out.textContent = 'Enter Vin, R1 and R2';
        return;
      }
      const Vout = Vin * (R2 / (R1 + R2));
      out.textContent = `Vout = ${Vout.toPrecision(6)} V   (Vout/Vin = ${ (R2/(R1+R2)).toPrecision(6) })`;
    });
    document.getElementById('vd-clear').addEventListener('click', () => {
      ['vd-vin','vd-r1','vd-r2'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('vd-result').textContent='';
    });

    // Power
    document.getElementById('p-calc').addEventListener('click', () => {
      const V = parseFloat(document.getElementById('p-v').value);
      const I = parseFloat(document.getElementById('p-i').value);
      const R = parseFloat(document.getElementById('p-r').value);
      const out = document.getElementById('p-result');

      if (isFinite(V) && isFinite(I)) out.textContent = `P = V × I = ${(V*I).toPrecision(6)} W`;
      else if (isFinite(V) && isFinite(R)) out.textContent = `P = V² / R = ${(V*V/R).toPrecision(6)} W`;
      else if (isFinite(I) && isFinite(R)) out.textContent = `P = I² × R = ${(I*I*R).toPrecision(6)} W`;
      else out.textContent = 'Enter two values (V,I,R) to compute power.';
    });
    document.getElementById('p-clear').addEventListener('click', () => {
      ['p-v','p-i','p-r'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('p-result').textContent='';
    });

    // RC time constant
    document.getElementById('rc-calc').addEventListener('click', () => {
      const R = parseFloat(document.getElementById('rc-r').value);
      const C = parseFloat(document.getElementById('rc-c').value);
      const out = document.getElementById('rc-result');
      if (!isFinite(R) || !isFinite(C)) {
        out.textContent = 'Enter R (Ω) and C (F)';
        return;
      }
      const tau = R * C;
      out.textContent = `τ = R × C = ${tau} seconds  —  (63.2% charge at t = τ)`;
    });
    document.getElementById('rc-clear').addEventListener('click', () => {
      ['rc-r','rc-c'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('rc-result').textContent='';
    });
  }

  return { init };
})();
