// regression.js - fits for linear, polynomial, exponential, logarithmic
// uses math.js (window.math)

const Regression = (() => {

  function linearFit(data) {
    // returns {coeffs: [a,b] for y = a*x + b, r2, predict(x)}
    const n = data.length;
    if (n < 2) return null;
    const xs = data.map(d=>d.x);
    const ys = data.map(d=>d.y);
    const xBar = math.mean(xs);
    const yBar = math.mean(ys);
    const ssXY = math.sum(xs.map((x,i)=> (x - xBar) * (ys[i] - yBar)));
    const ssXX = math.sum(xs.map(x=> Math.pow(x - xBar, 2)));
    const a = ssXY / ssXX;
    const b = yBar - a * xBar;

    const predict = (x) => a * x + b;
    const residuals = ys.map((y,i)=> y - predict(xs[i]));
    const ssRes = math.sum(residuals.map(r=> r*r));
    const ssTot = math.sum(ys.map(y=> Math.pow(y - yBar, 2)));
    const r2 = 1 - (ssRes / ssTot);

    return { coeffs: [a,b], r2, predict, degree:1 };
  }

  function polynomialFit(data, degree=2) {
    // Fit by normal equations: (X^T X)^{-1} X^T y
    const n = data.length;
    if (n < degree+1) return null;
    const xs = data.map(d=>d.x);
    const ys = data.map(d=>d.y);

    // Build Vandermonde matrix X (n x m) where m = degree+1
    const m = degree + 1;
    const X = [];
    for (let i=0;i<n;i++){
      const row = [];
      for (let j=0;j<m;j++){
        row.push(Math.pow(xs[i], j)); // column: x^0, x^1, ...
      }
      X.push(row);
    }
    const XT = math.transpose(X);
    // normal matrix: A = XT * X  (m x m)
    const A = math.multiply(XT, X);
    // right-hand: b = XT * y  (m x 1)
    const b = math.multiply(XT, ys);
    // solve A * coeffs = b
    let coeffs;
    try {
      coeffs = math.lusolve(A, math.matrix(b)).map(v=> v[0]); // returns array of arrays
    } catch (err) {
      // fallback using pseudo-inverse: coeffs = pinv(X) * y
      try {
        const pinv = math.multiply(math.inv(math.multiply(XT, X)), XT);
        coeffs = math.multiply(pinv, ys);
      } catch(e2) {
        return null;
      }
    }
    // flatten if needed
    if (Array.isArray(coeffs) && Array.isArray(coeffs[0])) coeffs = coeffs.map(r=> r[0]);

    const predict = (x) => {
      let s = 0;
      for (let j=0;j<coeffs.length;j++) s += coeffs[j] * Math.pow(x, j);
      return s;
    };

    const yBar = math.mean(ys);
    const residuals = ys.map((y,i)=> y - predict(xs[i]));
    const ssRes = math.sum(residuals.map(r=> r*r));
    const ssTot = math.sum(ys.map(y=> Math.pow(y - yBar, 2)));
    const r2 = 1 - ssRes / ssTot;

    return { coeffs, r2, predict, degree };
  }

  function exponentialFit(data) {
    // y = A * exp(B x)  => ln(y) = ln(A) + B x  -> linear fit on transformed data
    const filtered = data.filter(d => d.y > 0);
    if (filtered.length < 2) return null;
    const xs = filtered.map(d=>d.x);
    const ys = filtered.map(d=>Math.log(d.y));

    // linear fit on (x, ln(y))
    const n = xs.length;
    const xBar = math.mean(xs);
    const yBar = math.mean(ys);
    const ssXY = math.sum(xs.map((x,i)=> (x - xBar) * (ys[i] - yBar)));
    const ssXX = math.sum(xs.map(x=> Math.pow(x - xBar, 2)));
    const B = ssXY / ssXX;
    const lnA = yBar - B * xBar;
    const A = Math.exp(lnA);

    const predict = (x) => A * Math.exp(B * x);
    const residuals = filtered.map((d,i)=> d.y - predict(d.x));
    const ssRes = math.sum(residuals.map(r=> r*r));
    const ssTot = math.sum(filtered.map(d=> Math.pow(d.y - math.mean(filtered.map(f=>f.y)), 2)));
    const r2 = 1 - ssRes / ssTot;

    return { coeffs: [A, B], r2, predict, type: 'exp' };
  }

  function logarithmicFit(data) {
    // y = A + B ln(x)  (x must be > 0)
    const filtered = data.filter(d => d.x > 0);
    if (filtered.length < 2) return null;
    const xs = filtered.map(d=>Math.log(d.x));
    const ys = filtered.map(d=>d.y);

    // linear fit on (ln(x), y)
    const xBar = math.mean(xs);
    const yBar = math.mean(ys);
    const ssXY = math.sum(xs.map((x,i)=> (x - xBar) * (ys[i] - yBar)));
    const ssXX = math.sum(xs.map(x=> Math.pow(x - xBar, 2)));
    const B = ssXY / ssXX;
    const A = yBar - B * xBar;

    const predict = (x) => A + B * Math.log(x);
    const residuals = filtered.map((d,i)=> d.y - predict(d.x));
    const ssRes = math.sum(residuals.map(r=> r*r));
    const ssTot = math.sum(filtered.map(d=> Math.pow(d.y - math.mean(filtered.map(f=>f.y)), 2)));
    const r2 = 1 - ssRes / ssTot;

    return { coeffs: [A, B], r2, predict, type: 'log' };
  }

  return { linearFit, polynomialFit, exponentialFit, logarithmicFit };
})();
