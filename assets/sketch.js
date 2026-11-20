/* Hand-drawn illustration engine for the portfolio.
   Every drawing is generated as SVG ink strokes with a seeded wobble, so it
   looks drawn by hand but renders identically on every visit. Decorative only. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const f = n => Math.round(n * 10) / 10;
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rad = d => d * Math.PI / 180;

  function Pen(svg, seed) { this.svg = svg; this.g = svg; this.r = rng(seed); this.n = 0; }
  Pen.prototype = {
    R(a, b) { return a + (b - a) * this.r(); },
    el(tag, at) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); this.g.appendChild(e); return e; },
    d(p) {
      if (p.length < 2) return '';
      let s = `M${f(p[0][0])} ${f(p[0][1])}`;
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
        s += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (d[0] - b[0]) / 6)} ${f(c[1] - (d[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
      }
      return s;
    },
    stroke(p, o = {}) {
      const j = o.j ?? .6, w = o.w || 1.1, passes = o.p ?? 2;
      for (let k = 0; k < passes; k++) {
        const q = p.map(v => [v[0] + this.R(-j, j) * (k ? 1.7 : 1), v[1] + this.R(-j, j) * (k ? 1.7 : 1)]);
        const e = this.el('path', { d: this.d(q), pathLength: 1, class: o.c || '' });
        e.style.strokeWidth = k ? w * .5 : w;
        if (k) e.style.opacity = .45;
        e.style.setProperty('--dl', Math.min(this.n++ * .009, 1.5).toFixed(3) + 's');
      }
    },
    seg(a, b) { const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12)), o = []; for (let i = 0; i <= n; i++) o.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return o; },
    ln(a, b, o) { this.stroke(this.seg(a, b), o); },
    poly(p, o) { let out = []; for (let i = 0; i < p.length - 1; i++) { const s = this.seg(p[i], p[i + 1]); out = out.concat(i ? s.slice(1) : s); } this.stroke(out, o); },
    ell(cx, cy, rx, ry, o = {}) {
      const n = o.n || Math.max(10, Math.round((rx + ry) / 2)), st = this.R(0, 6.28), ov = o.ov ?? .22, rot = o.rot || 0, p = [];
      for (let i = 0; i <= n * (1 + ov); i++) { const t = st + i / n * 6.283, x = Math.cos(t) * rx * this.R(.98, 1.02), y = Math.sin(t) * ry * this.R(.98, 1.02); p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
      this.stroke(p, o);
    },
    dot(x, y, r, c) { const e = this.el('circle', { cx: f(x), cy: f(y), r, class: 'dot ' + (c || '') }); return e; },
    hatch(clip, ang, gap, o = {}) {
      const id = 'h' + Math.floor(this.r() * 1e9), cp = this.el('clipPath', { id }), pe = document.createElementNS(NS, 'path');
      pe.setAttribute('d', this.d(clip) + 'Z'); cp.appendChild(pe);
      const prev = this.g; this.g = this.el('g', { 'clip-path': `url(#${id})` });
      const xs = clip.map(p => p[0]), ys = clip.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const L = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 4, ca = Math.cos(ang), sa = Math.sin(ang);
      for (let t = -L; t <= L; t += gap) this.stroke([[cx - L * ca - t * sa, cy - L * sa + t * ca], [cx + L * ca - t * sa, cy + L * sa + t * ca]], { w: o.w || .55, p: 1, j: .35, c: o.c || 'olive' });
      this.g = prev;
    },
    text(x, y, s, o = {}) { const e = this.el('text', { x, y, class: 'hand ' + (o.c || ''), 'font-size': o.s || 16, 'text-anchor': o.a || 'start' }); if (o.rot) e.setAttribute('transform', `rotate(${o.rot} ${x} ${y})`); e.textContent = s; },
    arrow(p, o = {}) {
      this.stroke(p, o); const a = p[p.length - 1], b = p[p.length - 2], an = Math.atan2(a[1] - b[1], a[0] - b[0]), L = o.h || 10;
      this.stroke([[a[0] - L * Math.cos(an - .5), a[1] - L * Math.sin(an - .5)], a, [a[0] - L * Math.cos(an + .5), a[1] - L * Math.sin(an + .5)]], { ...o, j: .25, p: 1 });
    }
  };
  // local coordinate helper: translate, scale, rotate, optional mirror
  const T = (ox, oy, sc = 1, rot = 0, mx = 1) => p => { const x = p[0] * sc * mx, y = p[1] * sc; return [ox + x * Math.cos(rot) - y * Math.sin(rot), oy + x * Math.sin(rot) + y * Math.cos(rot)]; };
  const M = (tf, pts) => pts.map(tf);

  /* ---------- botanical ---------- */
  function fern(s, { x, y, len, ang, curl = .6, size = 60, n = 22 }) {
    const pts = [], tan = [], steps = 70; let px = x, py = y;
    for (let i = 0; i <= steps; i++) { const t = i / steps, a = ang + curl * t * t; pts.push([px, py]); tan.push(a); px += Math.cos(a) * len / steps; py += Math.sin(a) * len / steps; }
    s.stroke(pts, { w: 1.6 });
    for (let k = 1; k < n; k++) {
      const t = k / n, i = Math.round(t * steps), P = pts[i], a = tan[i];
      const L = size * Math.pow(1 - t, .75) * (t < .15 ? .55 + 3 * t : 1);
      for (const sd of [-1, 1]) pinna(s, P, a + sd * (1.15 - .45 * t), L, sd, curl);
    }
  }
  function pinna(s, P, a, L, sd, curl) {
    const N = 10, mid = [[...P]], lo = [[...P]], ro = [[...P]]; let q = [...P], an = a;
    for (let i = 1; i <= N; i++) {
      const u = i / N; an += sd * -.02 + curl * .015; q = [q[0] + Math.cos(an) * L / N, q[1] + Math.sin(an) * L / N];
      const w = L * .19 * Math.pow(1 - u, .55) * (.68 + .32 * Math.abs(Math.sin(u * Math.PI * 4.5)));
      const nx = -Math.sin(an), ny = Math.cos(an); mid.push([...q]); lo.push([q[0] + nx * w, q[1] + ny * w]); ro.push([q[0] - nx * w, q[1] - ny * w]);
    }
    s.stroke(mid, { w: .5, p: 1, c: 'olive' }); s.stroke(lo, { w: .85, p: 1 }); s.stroke(ro, { w: .85, p: 1 });
  }
  function leaflet(s, P, a, L, o = {}) {
    const tf = T(P[0], P[1], 1, a), W = L * (o.w || .2), left = [], right = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12; let w = W * Math.sin(Math.PI * Math.pow(u, .72));
      if (o.tooth && u > .06 && u < .2) w += L * .045 * Math.sin((u - .06) / .14 * Math.PI);
      left.push([u * L, -w]); right.push([u * L, w * (u < .2 ? .85 : 1)]);
    }
    s.stroke(M(tf, left), { w: .95 }); s.stroke(M(tf, right), { w: .95 });
    s.stroke(M(tf, [[0, 0], [L * .5, W * .03], [L * .97, 0]]), { w: .55, p: 1, c: 'olive' });
    for (let i = 1; i <= 5; i++) { const u = i / 6.3, w = W * Math.sin(Math.PI * Math.pow(u + .07, .72)) * .85; for (const sd of [-1, 1]) s.stroke(M(tf, [[u * L, 0], [(u + .05) * L, sd * w * .55], [(u + .1) * L, sd * w]]), { w: .4, p: 1, c: 'olive', j: .2 }); }
    if (o.shade) s.hatch(M(tf, left.concat([[L, 0], [0, 0]])), a + .9, 3.2);
  }
  function ailanthus(s, { x, y, len, ang, pairs = 7, leaf = 46 }) {
    const pts = []; let px = x, py = y;
    for (let i = 0; i <= 40; i++) { const t = i / 40, a = ang + .25 * t; pts.push([px, py]); px += Math.cos(a) * len / 40; py += Math.sin(a) * len / 40; }
    s.stroke(pts, { w: 1.4 });
    for (let k = 0; k < pairs; k++) {
      const t = .14 + .8 * k / (pairs - 1), i = Math.round(t * 40), P = pts[i], a = ang + .25 * t, L = leaf * (1 - .3 * t);
      for (const sd of [-1, 1]) { const P2 = [P[0] + s.R(-2, 2), P[1] + s.R(-2, 2)]; leaflet(s, P2, a + sd * (1.0 - .2 * t), L, { tooth: true, shade: k % 2 === 0 && sd > 0 }); }
    }
    leaflet(s, pts[40], ang + .25, leaf * .72, { tooth: true });
  }
  function roots(s, x, y, ang, len, w, depth) {
    const pts = [[x, y]]; let a = ang, px = x, py = y; const steps = Math.max(4, Math.round(len / 8));
    for (let i = 0; i < steps; i++) {
      a += s.R(-.22, .22); px += Math.cos(a) * len / steps; py += Math.sin(a) * len / steps; pts.push([px, py]);
      if (depth > 0 && i > 1 && s.r() < .32) roots(s, px, py, a + s.R(.45, 1.05) * (s.r() < .5 ? -1 : 1), len * s.R(.32, .58), w * .6, depth - 1);
      if (depth === 0 && s.r() < .5) { const ha = a + (s.r() < .5 ? 1.3 : -1.3); s.stroke([[px, py], [px + Math.cos(ha) * 5, py + Math.sin(ha) * 5]], { w: .35, p: 1, j: .2 }); }
    }
    s.stroke(pts, { w: Math.max(.45, w), p: w > 1 ? 2 : 1 });
  }
  function monstera(s, { x, y, sz, rot = 0 }) {
    const tf = T(x, y, sz, rot), P = p => M(tf, p);
    const hw = v => .52 * Math.pow(Math.sin(Math.PI * (.25 + .75 * Math.min(.995, v))), .62) * (1 - .1 * v);
    const cuts = [.17, .3, .43, .56, .69, .81], d = .02;
    for (const sd of [1, -1]) {
      s.stroke(P([[0, .06], [sd * .12, -.05], [sd * .3, -.06], [sd * .42, .005], [sd * hw(.04), .04]]), { w: 1.25 });
      let v = .04;
      cuts.forEach((c, k) => {
        const piece = []; for (; v < c - d; v += .02) piece.push([sd * hw(v), v]); piece.push([sd * hw(c - d), c - d]);
        s.stroke(P(piece), { w: 1.25 });
        const inner = [sd * (.09 + .015 * k), c - .075];
        s.stroke(P([[sd * hw(c - d), c - d], [sd * (hw(c) * .55 + inner[0] * .45), c - .045], inner]), { w: .9, p: 1 });
        s.stroke(P([inner, [sd * (hw(c) * .55 + inner[0] * .45), c - .02], [sd * hw(c + d), c + d]]), { w: .9, p: 1 });
        v = c + d;
        const mid = (c + (cuts[k + 1] || .93)) / 2;
        s.stroke(P([[sd * .015, mid - .07], [sd * hw(mid) * .5, mid - .03], [sd * hw(mid) * .93, mid]]), { w: .4, p: 1, c: 'olive' });
        if (k < 5) { const h = P([[sd * .17, mid - .035]])[0]; s.ell(h[0], h[1], sz * .026, sz * .014, { rot: rot + sd * .45, w: .75, p: 1 }); }
      });
      const tail = []; for (; v <= .985; v += .02) tail.push([sd * hw(v), v]); tail.push([0, 1]); s.stroke(P(tail), { w: 1.25 });
    }
    s.stroke(P([[-.05, -.4], [-.02, -.15], [0, .06], [.008, .5], [0, .97]]), { w: 1.15 });
    s.hatch(P([[0, .06], [.12, -.05], [.3, -.06], [.42, .005], [hw(.1), .1], [.1, .1], [0, .12]]), rot + .8, 3.2);
    s.hatch(P([[0, .5], [hw(.5) * .9, .5], [hw(.54), .54], [0, .56]]), rot + .8, 3.4);
  }
  function grass(s, { x, y, h }) {
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI / 2 + s.R(-.75, .75), L = h * s.R(.45, 1), bend = s.R(-.5, .5), p = [], q = [];
      for (let k = 0; k <= 8; k++) { const u = k / 8, an = a + bend * u * u, w = 3.5 * (1 - u); const cx = x + Math.cos(a) * L * u + Math.cos(an) * 0 + bend * u * u * L * .35, cy = y + Math.sin(a) * L * u * (1 - .1 * u); p.push([cx - w, cy]); q.push([cx + w, cy]); }
      s.stroke(p, { w: .85, p: 1 }); s.stroke(q, { w: .6, p: 1, c: 'olive' });
    }
    // seed panicle (Dichanthelium-like)
    const stalk = [[x + 4, y], [x + 10, y - h * .6], [x + 22, y - h * 1.05]]; s.stroke(stalk, { w: .8 });
    const top = stalk[2];
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + s.R(-1, 1), L = s.R(14, 30), e = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L]; s.stroke([top, e], { w: .5, p: 1 }); s.ell(e[0], e[1], 2.6, 1.6, { rot: a, w: .6, p: 1 }); }
  }
  /* ---------- molecular ---------- */
  function dna(s, { x, y, h, w, turns = 2.2, hor = false }) {
    const P = (u, v) => hor ? [x + v, y + u] : [x + u, y + v], N = 80;
    for (const ph of [0, Math.PI]) {
      let seg = [], front = null;
      for (let i = 0; i <= N; i++) {
        const t = i / N, th = 2 * Math.PI * turns * t + ph, fr = Math.cos(th) > 0, pt = P(w / 2 * Math.sin(th), h * t);
        if (front !== null && fr !== front) { s.stroke(seg.concat([pt]), { w: front ? 1.5 : .7, c: front ? '' : 'olive', p: front ? 2 : 1 }); seg = []; }
        seg.push(pt); front = fr;
      }
      s.stroke(seg, { w: front ? 1.5 : .7, c: front ? '' : 'olive' });
    }
    const R = Math.round(turns * 10);
    for (let i = 1; i < R; i++) { const t = i / R, th = 2 * Math.PI * turns * t, a = w / 2 * Math.sin(th), b = -a; if (Math.abs(a) < w * .08) continue; const m = (a + b) / 2; s.stroke([P(a, h * t), P(m - Math.sign(a) * 1.5, h * t)], { w: .6, p: 1, c: i % 3 ? 'olive' : 'bur' }); s.stroke([P(m + Math.sign(a) * 1.5, h * t), P(b, h * t)], { w: .6, p: 1, c: 'olive' }); }
  }
  function hexV(c, r) { const v = []; for (let k = 0; k < 6; k++) { const a = rad(-90 + 60 * k); v.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } return v; }
  function myricetin(s, { x, y, r = 22, label = true }) {
    const A = hexV([x, y], r), Cc = [x + r * Math.sqrt(3), y], C = hexV(Cc, r);
    const inner = (v, c, i, j) => { const k = .72, a = [c[0] + (v[i][0] - c[0]) * k, c[1] + (v[i][1] - c[1]) * k], b = [c[0] + (v[j][0] - c[0]) * k, c[1] + (v[j][1] - c[1]) * k]; s.ln(a, b, { w: .8, p: 1 }); };
    s.poly(A.concat([A[0]]), { w: 1.1 });
    s.poly([C[5], C[0], C[1], C[2], C[3], C[4]], { w: 1.1 });
    [[5, 0], [1, 2], [3, 4]].forEach(([i, j]) => inner(A, [x, y], i, j));
    inner(C, Cc, 1, 2);
    const C2 = C[1], E = [C2[0] + r * Math.cos(rad(-30)), C2[1] + r * Math.sin(rad(-30))], Bc = [E[0] + r * Math.cos(rad(30)), E[1] + r * Math.sin(rad(30))], B = hexV(Bc, r);
    s.ln(C2, E, { w: 1.1 }); s.poly(B.concat([B[0]]), { w: 1.1 });
    [[5, 0], [1, 2], [3, 4]].forEach(([i, j]) => inner(B, Bc, i, j));
    const out = (c, v, ang, txt, anc) => { const e = [v[0] + r * .55 * Math.cos(rad(ang)), v[1] + r * .55 * Math.sin(rad(ang))]; s.ln(v, e, { w: .9, p: 1 }); s.text(e[0] + Math.cos(rad(ang)) * 4, e[1] + Math.sin(rad(ang)) * 4 + 5, txt, { s: 17, a: anc || (Math.cos(rad(ang)) > .3 ? 'start' : Math.cos(rad(ang)) < -.3 ? 'end' : 'middle') }); };
    s.text(C[0][0], C[0][1] - 3, 'O', { s: 17, a: 'middle' });
    const C4 = C[3]; s.ln([C4[0] - 2, C4[1]], [C4[0] - 2, C4[1] + r * .6], { w: .9, p: 1 }); s.ln([C4[0] + 2, C4[1]], [C4[0] + 2, C4[1] + r * .6], { w: .9, p: 1 }); s.text(C4[0], C4[1] + r * .6 + 15, 'O', { s: 17, a: 'middle' });
    out(Cc, C[2], 30, 'OH'); out([x, y], A[3], 90, 'OH'); out([x, y], A[5], 210, 'HO', 'end');
    out(Bc, B[1], -30, 'OH'); out(Bc, B[2], 30, 'OH'); out(Bc, B[3], 90, 'OH');
    if (label) s.text(x + r * .6, y + r * 2.6, 'myricetin', { s: 20, c: 'soft' });
  }
  function geneTree(s, { x, y, w, h, labels }) {
    const n = labels.length, gap = h / (n - 1);
    const build = (lo, hi, d) => { if (lo === hi) return { x: x + w, y: y + lo * gap, leaf: lo }; const m = lo + Math.max(0, Math.min(hi - lo - 1, Math.floor((hi - lo) / 2 + s.R(-1, 1)))); const a = build(lo, m, d + 1), b = build(m + 1, hi, d + 1); return { x: x + d * w * .17, y: (a.y + b.y) / 2, a, b }; };
    const draw = nd => { if (nd.leaf !== undefined) return; s.ln([nd.x, nd.a.y], [nd.x, nd.b.y], { w: .9 }); s.ln([nd.x, nd.a.y], [nd.a.x, nd.a.y], { w: .9 }); s.ln([nd.x, nd.b.y], [nd.b.x, nd.b.y], { w: .9 }); draw(nd.a); draw(nd.b); };
    const root = build(0, n - 1, 1); s.ln([x, root.y], [root.x, root.y], { w: .9 }); draw(root);
    labels.forEach((l, i) => s.text(x + w + 6, y + i * gap + 5, l, { s: 15, c: 'soft' }));
  }
  /* ---------- laboratory ---------- */
  function microscope(s, { x, y, sc = 1 }) {
    const t = T(x, y, sc), P = p => M(t, p);
    s.poly(P([[8, 132], [96, 132], [100, 142], [4, 142], [8, 132]]), { w: 1.2 });
    const arm = [[72, 132], [70, 108], [64, 80], [69, 52], [60, 32], [46, 24], [56, 12], [76, 24], [86, 52], [80, 82], [86, 112], [86, 132]];
    s.stroke(P(arm.slice(0, 6)), { w: 1.2 }); s.stroke(P(arm.slice(6)), { w: 1.2 }); s.hatch(P(arm), .9, 3);
    s.poly(P([[20, 92], [88, 92], [88, 99], [20, 99], [20, 92]]), { w: 1 });
    s.ln(P([[32, 89]])[0], P([[62, 89]])[0], { w: .7, p: 1 });
    s.ell(...P([[46, 44]])[0], 12 * sc, 5 * sc, { w: .9 });
    s.poly(P([[40, 46], [42, 66], [50, 66], [52, 46]]), { w: 1 });
    s.poly(P([[52, 45], [60, 58], [64, 55], [57, 44]]), { w: .8, p: 1 });
    s.ln(P([[40, 40]])[0], P([[24, 8]])[0], { w: 1.1 }); s.ln(P([[52, 36]])[0], P([[36, 4]])[0], { w: 1.1 });
    s.ell(...P([[30, 6]])[0], 8 * sc, 3 * sc, { rot: -1.1, w: 1 });
    s.ell(...P([[80, 72]])[0], 8 * sc, 8 * sc, { w: 1 }); s.ell(...P([[80, 72]])[0], 3 * sc, 3 * sc, { w: .7, p: 1 });
    s.poly(P([[38, 99], [40, 107], [52, 107], [54, 99]]), { w: .8, p: 1 });
    s.ell(...P([[46, 120]])[0], 11 * sc, 4 * sc, { w: .9 });
  }
  function flask(s, { x, y, sc = 1 }) {
    const P = p => M(T(x, y, sc), p);
    s.ell(...P([[50, 8]])[0], 10 * sc, 3 * sc, { w: 1 });
    s.stroke(P([[40, 8], [41, 38], [14, 95], [17, 102], [26, 104], [74, 104], [83, 102], [86, 95], [59, 38], [60, 8]]), { w: 1.2 });
    s.stroke(P([[27, 70], [50, 72], [73, 70]]), { w: .8, p: 1 });
    s.hatch(P([[27, 70], [73, 70], [86, 95], [83, 102], [74, 104], [26, 104], [17, 102], [14, 95]]), .6, 3.2);
    [[40, 86, 2.5], [55, 80, 1.8], [62, 92, 3]].forEach(([a, b, r]) => { const c = P([[a, b]])[0]; s.ell(c[0], c[1], r * sc, r * sc, { w: .6, p: 1 }); });
    [56, 66, 76].forEach(v => { const k = (v - 38) / 57, xr = 59 + 27 * k; s.ln(P([[xr - 6, v]])[0], P([[xr - 1, v]])[0], { w: .5, p: 1 }); });
  }
  function pipette(s, { x, y, sc = 1, rot = 0 }) {
    const P = p => M(T(x, y, sc, rot), p);
    s.ell(...P([[15, 5]])[0], 8 * sc, 3.5 * sc, { rot, w: 1 });
    s.stroke(P([[12, 8], [12, 21]]), { w: .9, p: 1 }); s.stroke(P([[18, 8], [18, 21]]), { w: .9, p: 1 });
    const body = [[7, 21], [23, 21], [24, 92], [19, 118], [11, 118], [6, 92], [7, 21]];
    s.poly(P(body), { w: 1.2 }); s.hatch(P([[7, 21], [23, 21], [24, 50], [6, 50]]), rot + .7, 2.6);
    s.stroke(P([[23, 32], [32, 36], [31, 47], [23, 49]]), { w: 1 });
    s.poly(P([[11, 56], [19, 56], [19, 72], [11, 72], [11, 56]]), { w: .7, p: 1 });
    s.stroke(P([[6, 88], [2, 100], [8, 110]]), { w: .8, p: 1 });
    s.stroke(P([[12, 118], [14.4, 178]]), { w: .9 }); s.stroke(P([[18, 118], [15.6, 178]]), { w: .9 });
  }
  function petri(s, { x, y, rx, ry }) {
    s.ell(x, y, rx, ry, { w: 1.2 }); s.ell(x, y + 3, rx - 5, ry - 3, { w: .7, p: 1 });
    const streak = []; for (let i = 0; i <= 14; i++) streak.push([x - rx * .7 + i * rx * .1, y - ry * .35 + (i % 2 ? ry * .5 : 0) + s.R(-2, 2)]);
    s.stroke(streak, { w: .5, p: 1, c: 'olive' });
    streak.forEach((p, i) => { if (i % 2) for (let k = 0; k < 3; k++) { const r = s.R(1, 2.8); s.dot(p[0] + s.R(-6, 6), p[1] + s.R(-4, 4), r, i % 4 ? '' : 'bur'); } });
  }
  function gel(s, { x, y, w, h }) {
    s.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], { w: 1.2 });
    s.poly([[x + 6, y + 6], [x + w - 6, y + 6], [x + w - 6, y + h - 6], [x + 6, y + h - 6], [x + 6, y + 6]], { w: .6, p: 1, c: 'olive' });
    const lanes = 6, lw = (w - 24) / lanes, bands = [[.2, .32, .45, .58, .7, .82], [.4, .66], [.3, .52, .74], [.48], [.26, .44, .62], [.36]];
    for (let i = 0; i < lanes; i++) {
      const lx = x + 12 + i * lw + lw * .15, ww = lw * .7;
      s.poly([[lx, y + 12], [lx + ww, y + 12], [lx + ww, y + 18], [lx, y + 18], [lx, y + 12]], { w: .6, p: 1 });
      bands[i].forEach(b => s.ln([lx + 1, y + h * b], [lx + ww - 1, y + h * b], { w: i === 2 ? 2.2 : 1.8, p: 1, c: i === 2 ? 'bur' : '' }));
    }
    s.text(x - 6, y + 14, '−', { s: 22, a: 'end' }); s.text(x - 6, y + h, '+', { s: 22, a: 'end' });
  }
  function wellPlate(s, { x, y, w, h }) {
    s.poly([[x + 6, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 6], [x + 6, y]], { w: 1.2 });
    const cols = 12, rows = 8, gx = (w - 24) / (cols - 1), gy = (h - 24) / (rows - 1);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const cx = x + 14 + c * gx, cy = y + 14 + r * gy;
      s.ell(cx, cy, gx * .36, gx * .36, { w: .45, p: 1, n: 9 });
      if (r < 6 && c < 10) { const d = s.dot(cx, cy, gx * .26, 'bur'); d.style.opacity = (.85 - c * .08).toFixed(2); }
    }
    'ABCDEFGH'.split('').forEach((l, r) => s.text(x - 4, y + 18 + r * gy, l, { s: 12, a: 'end', c: 'soft' }));
  }
  function column(s, { x, y, sc = 1 }) {
    const P = p => M(T(x, y, sc), p);
    s.stroke(P([[28, 4], [44, 30], [44, 150]]), { w: 1.1 }); s.stroke(P([[72, 4], [56, 30], [56, 150]]), { w: 1.1 });
    s.ell(...P([[50, 4]])[0], 22 * sc, 4 * sc, { w: .9 });
    s.hatch(P([[44, 58], [56, 58], [56, 146], [44, 146]]), .9, 3.4);
    s.hatch(P([[44, 72], [56, 72], [56, 80], [44, 80]]), -.6, 1.6, { c: 'bur', w: .7 });
    s.hatch(P([[44, 100], [56, 100], [56, 107], [44, 107]]), -.6, 1.8, { w: .7, c: '' });
    s.poly(P([[46, 150], [48, 162], [52, 162], [54, 150]]), { w: .9, p: 1 });
    s.ell(...P([[50, 156]])[0], 4 * sc, 4 * sc, { w: .9, p: 1 }); s.ln(P([[36, 156]])[0], P([[64, 156]])[0], { w: 1 });
    s.ell(...P([[50, 172]])[0], 1.8 * sc, 2.6 * sc, { w: .7, p: 1 });
    s.stroke(P([[38, 180], [40, 206], [60, 206], [62, 180]]), { w: 1 });
  }
  function alignment(s, { x, y }) {
    const rows = [['DoWRKY12', 'WRKYGQK', 'AVKG'], ['DoWRKY27', 'WRKYGQK', 'PIKG'], ['DoWRKY40', 'WRKYGKK', 'AVKG'], ['DoWRKY63', 'WRKYGQK', 'VVKG'], ['DoWRKY81', 'WRKYGQK', 'AIKG']];
    const t = (tx, ty, str, len, c) => { const e = s.el('text', { x: tx, y: ty, class: 'hand ' + (c || ''), 'font-size': 18, textLength: len, lengthAdjust: 'spacingAndGlyphs' }); e.textContent = str; };
    rows.forEach((r, i) => { t(x, y + i * 22, r[0], 70, 'soft'); t(x + 84, y + i * 22, r[1], 74); t(x + 162, y + i * 22, r[2], 40, 'soft'); });
    t(x + 84, y + rows.length * 22 + 2, '**** *', 60, 'soft');
    s.stroke([[x + 80, y - 20], [x + 122, y - 23], [x + 164, y - 18], [x + 165, y + 84], [x + 122, y + 92], [x + 78, y + 86], [x + 76, y - 16], [x + 86, y - 22]], { w: .9, c: 'bur' });
    s.text(x + 84, y - 30, 'conserved WRKY motif', { s: 18, c: 'soft' });
  }
  /* ---------- organisms ---------- */
  function moth(s, { x, y, sc = 1 }) {
    for (const mx of [1, -1]) {
      const P = p => M(T(x, y, sc, 0, mx), p);
      const hw = [[6, 26], [24, 38], [44, 44], [52, 52], [40, 58], [22, 54], [8, 40]];
      s.stroke(P(hw.concat([hw[0]])), { w: .8, c: 'olive' });
      const fw = [[5, 12], [22, 5], [46, 9], [66, 21], [71, 30], [62, 37], [40, 39], [18, 35], [6, 24], [5, 12]];
      s.stroke(P(fw), { w: 1.15 });
      [[66, 24], [62, 34], [48, 38], [34, 37]].forEach(e => s.stroke(P([[7, 18], [(7 + e[0]) / 2, (18 + e[1]) / 2 - 2], e]), { w: .45, p: 1, c: 'olive' }));
      s.hatch(P([[22, 5], [46, 9], [66, 21], [44, 16], [24, 12]]), .3, 2.4);
      [[30, 24], [44, 28], [52, 22]].forEach(([a, b]) => { const c = P([[a, b]])[0]; s.dot(c[0], c[1], 1.2 * sc); });
      s.stroke(P([[2, 2], [8, -14], [16, -24], [24, -29]]), { w: .6, p: 1 });
      s.stroke(P([[5, 18], [14, 26], [16, 34]]), { w: .5, p: 1 }); s.stroke(P([[5, 22], [12, 32], [12, 42]]), { w: .5, p: 1 });
    }
    const P = p => M(T(x, y, sc), p);
    s.ell(...P([[0, 4]])[0], 4.5 * sc, 4.5 * sc, { w: 1 });
    s.ell(...P([[0, 17]])[0], 6.5 * sc, 10 * sc, { w: 1.1 });
    s.stroke(P([[-5, 27], [-6, 42], [-4, 56], [0, 67], [4, 56], [6, 42], [5, 27]]), { w: 1.1 });
    [33, 40, 47, 54].forEach(v => s.stroke(P([[-5, v], [0, v + 2], [5, v]]), { w: .5, p: 1 }));
    s.hatch(P([[-6.5, 10], [6.5, 10], [6.5, 26], [-6.5, 26]]), .8, 2.2);
  }
  function rat(s, { x, y, sc = 1, flip = false }) {
    const P = p => M(T(x, y, sc, 0, flip ? -1 : 1), p);
    s.stroke(P([[12, 52], [20, 44], [32, 37], [46, 30], [62, 26], [86, 21], [114, 19], [142, 25], [160, 37], [168, 52], [163, 64], [140, 70], [108, 72], [80, 70], [58, 66], [40, 62], [24, 59], [12, 52]]), { w: 1.25 });
    const ec = P([[46, 28]])[0]; s.ell(ec[0], ec[1], 8 * sc, 10 * sc, { rot: -.3, w: 1 }); s.ell(ec[0] + sc, ec[1] + sc, 4 * sc, 6 * sc, { rot: -.3, w: .5, p: 1, c: 'olive' });
    const eye = P([[31, 44]])[0]; s.dot(eye[0], eye[1], 1.8 * sc);
    const nose = P([[11, 52]])[0]; s.dot(nose[0], nose[1], 1.5 * sc, 'bur');
    [[-12, -8], [-14, 0], [-12, 7]].forEach(([dx, dy]) => s.stroke(P([[17, 52], [17 + dx * .6, 52 + dy * .5], [17 + dx * 1.6, 52 + dy]]), { w: .4, p: 1 }));
    s.stroke(P([[56, 64], [53, 78], [45, 82]]), { w: 1 }); s.stroke(P([[68, 68], [67, 80], [60, 83]]), { w: .8, p: 1 });
    s.stroke(P([[138, 66], [150, 79], [140, 83]]), { w: 1 }); s.stroke(P([[124, 70], [128, 80], [120, 83]]), { w: .8, p: 1 });
    const tail = [[166, 56], [184, 60], [200, 70], [212, 84], [228, 90], [240, 86]]; s.stroke(P(tail), { w: 1.1 });
    for (let i = 1; i < 12; i++) { const k = i / 12, a = tail[Math.floor(k * 5)], b = tail[Math.floor(k * 5) + 1]; const px = a[0] + (b[0] - a[0]) * (k * 5 % 1), py = a[1] + (b[1] - a[1]) * (k * 5 % 1); s.stroke(P([[px - 1, py - 2], [px + 1, py + 2]]), { w: .4, p: 1 }); }
    s.hatch(P([[62, 26], [86, 21], [114, 19], [142, 25], [160, 37], [150, 40], [118, 30], [86, 30], [62, 34]]), -.2, 3);
  }

  /* ---------- annotations ---------- */
  const uline = (s, w) => { s.stroke([[2, 9], [w * .3, 6], [w * .7, 8], [w - 2, 5]], { w: 1.6, p: 1 }); s.stroke([[w * .08, 13], [w * .5, 11], [w * .82, 12]], { w: .8, p: 1, c: 'olive' }); };

  /* ---------- compositions, keyed by data-draw ---------- */
  const D = {
    'hero-fern': s => { fern(s, { x: 150, y: 740, len: 660, ang: -1.72, curl: -.75, size: 92, n: 26 }); fern(s, { x: 175, y: 740, len: 380, ang: -1.2, curl: .5, size: 52, n: 16 }); },
    'hero-leaf': s => ailanthus(s, { x: 470, y: 8, len: 400, ang: 2.55, pairs: 7, leaf: 62 }),
    'hero-dna': s => dna(s, { x: 30, y: 6, h: 228, w: 34, turns: 2.4 }),
    'hero-micro': s => microscope(s, { x: 6, y: 4, sc: 1 }),
    'hero-arrow': s => s.arrow([[6, 10], [50, 14], [92, 36], [116, 72]], { w: 1.2, h: 11 }),
    'roots': s => { s.stroke([[150, 0], [151, 30]], { w: 2 }); leaflet(s, [151, 22], -2.3, 46, {}); leaflet(s, [151, 26], -.8, 40, {}); roots(s, 151, 30, 1.57, 230, 2.2, 3); roots(s, 151, 34, 2.2, 120, 1.2, 2); roots(s, 151, 34, .9, 130, 1.2, 2); s.text(214, 320, 'radicle and laterals', { s: 18, c: 'soft' }); },
    'gutter': s => s.stroke([[6, 0], [5, 200], [7, 420], [5, 640], [6, 860]], { w: .9, c: 'olive' }),
    'spec-1': s => ailanthus(s, { x: 18, y: 160, len: 170, ang: -.72, pairs: 5, leaf: 34 }),
    'spec-2': s => myricetin(s, { x: 46, y: 70, r: 20, label: false }),
    'spec-3': s => geneTree(s, { x: 8, y: 14, w: 100, h: 140, labels: ['DoWRKY3', 'DoWRKY17', 'DoWRKY29', 'DoWRKY44', 'DoWRKY58', 'DoWRKY71', 'DoWRKY84'] }),
    'spec-4': s => moth(s, { x: 100, y: 44, sc: 1.15 }),
    'spec-5': s => dna(s, { x: 14, y: 90, h: 180, w: 48, turns: 1.8, hor: true }),
    'case-1': s => { ailanthus(s, { x: 500, y: 26, len: 380, ang: 2.5, pairs: 7, leaf: 66 }); flask(s, { x: 40, y: 250, sc: 1.4 }); wellPlate(s, { x: 210, y: 300, w: 190, h: 120 }); s.text(214, 288, 'DPPH assay plate', { s: 20, c: 'soft' }); s.text(40, 426, 'plant extract', { s: 20, c: 'soft' }); s.text(24, 56, 'Ailanthus excelsa', { s: 26, c: 'soft' }); s.text(24, 80, 'compound leaf, pinnate', { s: 19, c: 'soft' }); },
    'case-2': s => { grass(s, { x: 110, y: 410, h: 260 }); geneTree(s, { x: 236, y: 70, w: 150, h: 200, labels: ['DoWRKY3', 'DoWRKY12', 'DoWRKY27', 'DoWRKY40', 'DoWRKY51', 'DoWRKY63', 'DoWRKY72', 'DoWRKY81'] }); alignment(s, { x: 200, y: 352 }); s.text(20, 40, 'Dichanthelium oligosanthes', { s: 24, c: 'soft' }); s.text(236, 300, 'illustrative sketch, not data', { s: 16, c: 'soft' }); },
    'case-3': s => { moth(s, { x: 150, y: 90, sc: 1.9 }); gel(s, { x: 290, y: 250, w: 200, h: 140 }); s.text(60, 268, 'Corcyra cephalonica', { s: 24, c: 'soft' }); s.text(60, 292, 'the rice moth, dorsal view', { s: 18, c: 'soft' }); s.arrow([[360, 210], [380, 228], [392, 244]], { w: .9, h: 8 }); s.text(300, 200, 'OBP transcripts, RT-PCR', { s: 19, c: 'soft' }); },
    'case-4': s => { rat(s, { x: 14, y: 40, sc: 1.05 }); petri(s, { x: 400, y: 116, rx: 86, ry: 36 }); s.text(30, 168, 'animal handling and preclinical research', { s: 19, c: 'soft' }); s.text(338, 186, 'microbiology module', { s: 19, c: 'soft' }); },
    'inv-1': s => pipette(s, { x: 96, y: 8, sc: .82, rot: .38 }),
    'inv-2': s => gel(s, { x: 34, y: 18, w: 150, h: 112 }),
    'inv-3': s => wellPlate(s, { x: 22, y: 16, w: 170, h: 112 }),
    'inv-4': s => flask(s, { x: 52, y: 14, sc: 1.12 }),
    'inv-5': s => column(s, { x: 56, y: 2, sc: .66 }),
    'inv-6': s => alignment(s, { x: 4, y: 40 }),
    'foot-monstera': s => { monstera(s, { x: 330, y: 110, sz: 400, rot: .5 }); },
    'foot-dna': s => dna(s, { x: 4, y: 24, h: 200, w: 40, turns: 1.6, hor: true }),
    'foot-rat': s => rat(s, { x: 8, y: 6, sc: .9 }),
    'tl-line': s => s.stroke([[10, 0], [8, 140], [12, 300], [9, 470], [11, 640], [9, 820], [10, 1000]], { w: 1, c: 'olive' }),
    'node': s => s.ell(12, 12, 6, 6, { w: 1.1 }),
    'farrow': s => s.arrow([[2, 12], [16, 9], [30, 11]], { w: 1, h: 6 })
  };

  let seed = 11;
  function render(svg) {
    if (svg.dataset.done) return; svg.dataset.done = 1;
    const key = svg.dataset.draw, fn = D[key]; if (!fn) return;
    const s = new Pen(svg, (svg.dataset.seed | 0) || seed++ * 97);
    if (key === 'uline') uline(s, +svg.viewBox.baseVal.width); else fn(s);
    if (!RM) svg.classList.add('pend');
  }
  // rough frame drawn around buttons, plates and labels
  function frame(el) {
    let svg = el.querySelector(':scope > svg.frame');
    if (!svg) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'frame sk'); svg.setAttribute('aria-hidden', 'true'); el.prepend(svg); }
    const w = el.offsetWidth, h = el.offsetHeight; if (!w) return;
    svg.innerHTML = ''; svg.setAttribute('viewBox', `-6 -6 ${w + 12} ${h + 12}`);
    const s = new Pen(svg, (w * 7 + h) | 0), j = el.classList.contains('circ') ? 0 : 1;
    if (el.classList.contains('circ')) s.ell(w / 2, h / 2, w / 2 + 3, h / 2 + 2, { w: 1.1, ov: .3, c: el.dataset.ink || '' });
    else s.poly([[-2, -1], [w + 2, 1], [w + 1, h + 2], [-1, h], [-2, -3]], { w: el.dataset.w || 1, j: 1 + j * .4 });
  }

  document.querySelectorAll('.sec-head h2').forEach(h => { const v = document.createElementNS(NS, 'svg'); v.setAttribute('class', 'uline sk'); v.setAttribute('viewBox', '0 0 300 16'); v.setAttribute('aria-hidden', 'true'); v.dataset.draw = 'uline'; h.after(v); });
  document.querySelectorAll('.flow li:not(:last-child)').forEach(li => { li.insertAdjacentHTML('beforeend', '<svg class="sk fa" viewBox="0 0 34 22" data-draw="farrow" aria-hidden="true"></svg>'); });
  D.uline = () => {};
  document.querySelectorAll('svg[data-draw]').forEach(render);
  const frames = [...document.querySelectorAll('.skbox,.circ')];
  frames.forEach(frame);
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(es => es.forEach(e => frame(e.target))); frames.forEach(el => ro.observe(el)); }

  // reveal: drawings ink themselves in, photographs uncover, once each
  if (!RM && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('svg.pend,.plate').forEach(el => { if (el.classList.contains('plate')) el.classList.add('veil'); io.observe(el); });
    // slight parallax on the hero botanicals
    const px = [...document.querySelectorAll('[data-parallax]')]; let tick = false;
    addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { const y = scrollY; px.forEach(el => el.style.transform = `translate3d(0,${(y * +el.dataset.parallax).toFixed(1)}px,0)`); tick = false; }); }, { passive: true });
  } else document.querySelectorAll('svg.pend').forEach(s => s.classList.remove('pend'));

  // mobile navigation
  const btn = document.querySelector('.menu-btn');
  if (btn) btn.addEventListener('click', () => { const open = document.body.classList.toggle('nav-open'); btn.setAttribute('aria-expanded', open); });
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('nav-open'); btn && btn.setAttribute('aria-expanded', 'false'); }));
})();
