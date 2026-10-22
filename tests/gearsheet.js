// Every form wearing gear, zoomed: _test.html#window.MARK=1;window.GF='f0,f1';fetch('tests/gearsheet.js').then(r=>r.text()).then(t=>eval(t))
setTimeout(() => {
  const Z = window.GZ || 3, rs = window.GR || [-1, 2, 5], forms = (window.GF || 'f0,f1,f2,f3,f4,f5,f6').split(',');
  const c = document.createElement('canvas'); c.width = 1500; c.height = 2000;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#8a9aa8'; x.fillRect(0, 0, c.width, c.height);
  let y = 4;
  for (const id of forms) {
    let px = 4, rowH = 0, top = 1e9;
    for (const r of rs) {
      const g = {}; if (r >= 0) for (const s of SLOTS) g[s.id] = r;
      const sp = formSprite(id, g), cv = sp.cv, oy = cv.oy;
      top = Math.min(top, oy - 8);
      x.drawImage(cv, 0, oy - 8, cv.width, cv.height - oy + 8, px, y, cv.width * Z, (cv.height - oy + 8) * Z);
      if (r >= 0 && sp.A.orb) { x.fillStyle = ORB_COL[r]; x.fillRect(px + sp.A.orb[0] * Z - 6, y + (sp.A.orb[1] - oy + 8) * Z - 6, 12, 12); }
      if (window.MARK && r < 0) { const a = ANCH[id]; x.fillStyle = '#0ff';
        for (const k of ['crown', 'hip', 'tail', 'leg']) x.fillRect(px + (cv.ox + a[k][0]) * Z - 2, y + (a[k][1] + 8) * Z - 2, 5, 5);
        x.fillStyle = '#ff0'; x.fillRect(px + (cv.ox + a.collar[0]) * Z - 2, y + (a.collar[1] + 8) * Z - 2, 5, 5); x.fillRect(px + (cv.ox + a.collar[2]) * Z - 2, y + (a.collar[3] + 8) * Z - 2, 5, 5);
        x.fillStyle = '#f0f'; for (let i = 0; i < 6; i += 2) x.fillRect(px + (cv.ox + a.wing[i]) * Z - 2, y + (a.wing[i + 1] + 8) * Z - 2, 5, 5); }
      px += cv.width * Z + 8; rowH = Math.max(rowH, (cv.height - oy + 8) * Z);
    }
    y += rowH + 6;
  }
  document.body.innerHTML = ''; document.body.style.background = '#8a9aa8'; document.body.style.margin = 0; document.body.appendChild(c);
}, 1200);
