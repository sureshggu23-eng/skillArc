/* Certificate rendering (SVG) + download */
function wrapText(t, max) {
  const words = String(t).split(' '), lines = []; let cur = '';
  words.forEach(w => { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur); return lines.slice(0, 3);
}
function certSVG(c) {
  const site = esc(S.settings.site_name || 'SkillArc'), name = esc(c.student), nl = c.student.length;
  const nfs = nl <= 18 ? 70 : nl <= 26 ? 56 : nl <= 34 ? 44 : 34;
  const lines = wrapText(c.course, 34), cfs = lines.length > 1 ? 36 : 44, y0 = 494 - (lines.length - 1) * 24;
  const date = new Date(c.issued_at.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const url = (location.origin + '/#/certificate/' + c.code).replace(/^https?:\/\//, '');
  const serif = "Georgia,'Times New Roman',serif", sans = "'Helvetica Neue',Arial,sans-serif";
  const corner = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M0 120a120 120 0 0 1 120-120" fill="none" stroke="#5a3df0" stroke-width="10" stroke-linecap="round"/><path d="M0 84a84 84 0 0 1 84-84" fill="none" stroke="#5a3df0" stroke-opacity=".28" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="0" r="9" fill="#d6ff4d" stroke="#14151c" stroke-width="2"/></g>`;
  const ray = Array.from({ length: 24 }, (_, i) => { const a = i * 15 * Math.PI / 180; return `<line x1="${Math.cos(a) * 52}" y1="${Math.sin(a) * 52}" x2="${Math.cos(a) * 62}" y2="${Math.sin(a) * 62}" stroke="#5a3df0" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="780" viewBox="0 0 1100 780" font-family="${serif}">
<rect width="1100" height="780" fill="#fffdf7"/><rect x="26" y="26" width="1048" height="728" rx="14" fill="none" stroke="#14151c" stroke-width="2"/><rect x="40" y="40" width="1020" height="700" rx="8" fill="none" stroke="#5a3df0" stroke-opacity=".35" stroke-width="1.5"/>
${corner(44, 44, 1, 1)}${corner(1056, 44, -1, 1)}${corner(44, 736, 1, -1)}${corner(1056, 736, -1, -1)}
<g transform="translate(550 98)"><rect x="-120" y="-24" width="30" height="30" rx="9" fill="#5a3df0"/><path d="M-114 -2a9 9 0 0 1 18 0" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="-96" cy="-2" r="3" fill="#d6ff4d"/><text x="-80" y="0" font-size="30" font-weight="700" fill="#14151c">${site}</text></g>
<text x="550" y="200" text-anchor="middle" font-size="60" font-weight="700" fill="#14151c" letter-spacing="6">CERTIFICATE</text>
<text x="550" y="238" text-anchor="middle" font-family="${sans}" font-size="15" font-weight="700" fill="#5a3df0" letter-spacing="9">OF COMPLETION</text>
<text x="550" y="300" text-anchor="middle" font-size="19" font-style="italic" fill="#6f7382">This certificate is proudly presented to</text>
<text x="550" y="${372 + (70 - nfs) / 3}" text-anchor="middle" font-size="${nfs}" font-style="italic" font-weight="600" fill="#5a3df0">${name}</text>
<line x1="230" y1="394" x2="870" y2="394" stroke="#14151c" stroke-opacity=".25"/><rect x="480" y="389" width="140" height="10" rx="5" fill="#d6ff4d"/>
<text x="550" y="432" text-anchor="middle" font-size="19" font-style="italic" fill="#6f7382">for successfully completing the course</text>
${lines.map((l, i) => `<text x="550" y="${y0 + i * 42}" text-anchor="middle" font-size="${cfs}" font-weight="700" fill="#14151c">${esc(l)}</text>`).join('')}
<text x="550" y="${y0 + (lines.length - 1) * 42 + 44}" text-anchor="middle" font-family="${sans}" font-size="15" fill="#3b3e4c">with a final assessment score of <tspan font-weight="700">${c.percent}%</tspan>${c.hours ? ' &#183; ' + esc(c.hours) + ' of learning' : ''}</text>
<g transform="translate(550 650)"><circle r="70" fill="#14151c"/><g>${ray}</g><circle r="46" fill="#5a3df0"/><circle r="40" fill="none" stroke="#d6ff4d" stroke-width="2"/><path d="M-16 2l11 11 22-24" fill="none" stroke="#d6ff4d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>
<g font-family="${sans}"><text x="210" y="632" text-anchor="middle" font-family="${serif}" font-size="22" font-weight="600">${date}</text><line x1="100" y1="644" x2="320" y2="644" stroke="#14151c"/><text x="210" y="666" text-anchor="middle" font-size="12" letter-spacing="2" fill="#6f7382">DATE ISSUED</text>
<text x="890" y="632" text-anchor="middle" font-family="${serif}" font-size="26" font-style="italic" font-weight="600" fill="#14151c">${esc(c.instructor || site)}</text><line x1="780" y1="644" x2="1000" y2="644" stroke="#14151c"/><text x="890" y="666" text-anchor="middle" font-size="12" letter-spacing="2" fill="#6f7382">COURSE INSTRUCTOR</text>
<text x="550" y="738" text-anchor="middle" font-size="12.5" fill="#6f7382">Certificate ID <tspan font-weight="700" fill="#14151c">${esc(c.code)}</tspan>  &#183;  Verify at ${esc(url)}</text></g></svg>`;
}
function downloadCertPNG(code, student) {
  const svg = $('#certsvg svg'); if (!svg) return;
  const img = new Image(), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  img.onload = () => { const c = document.createElement('canvas'); c.width = 2200; c.height = 1560; const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `certificate-${code}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png'); };
  img.onerror = () => toast('Could not create the image. Use Print / Save as PDF instead.', 'bad'); img.src = url;
}
