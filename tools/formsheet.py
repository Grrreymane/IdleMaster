# Render every player form (with and without full gear) into _lab/forms_sheet.png for review.
import pathlib, subprocess, sys, json
root = pathlib.Path(__file__).resolve().parent.parent
mods = ['core.js', 'art_base.js', 'art_quad.js', 'art_snake.js', 'rules.js', 'art_forms.js']
src = '\n'.join((root / 'src' / m).read_text(encoding='utf-8') for m in mods)
gear = sys.argv[1] if len(sys.argv) > 1 else '{}'
src += r'''
;(function(){
const ids = Object.keys(LOOK), SC = 3, cols = 6, gear = %s;
const cv = document.getElementById('c'), cx = cv.getContext('2d');
cv.width = cols * QW * SC; cv.height = Math.ceil(ids.length / cols) * (QH + 8) * SC;
cx.imageSmoothingEnabled = false;
ids.forEach((id, i) => {
  const s = formSprite(id, gear), x = (i %% cols) * QW * SC, y = Math.floor(i / cols) * (QH + 8) * SC;
  cx.fillStyle = (i + Math.floor(i / cols)) & 1 ? '#2c3650' : '#b9c6b0'; cx.fillRect(x, y, QW * SC, (QH + 8) * SC);
  cx.drawImage(s.cv, x, y, QW * SC, QH * SC);
  cx.fillStyle = '#fff'; cx.font = '20px sans-serif'; cx.fillText(id + ' ' + FORMS[id].n, x + 6, y + (QH + 6) * SC);
});
document.title = 'READY';
})();
''' % gear
(root / '_lab' / 'sheet_src.js').write_text(src, encoding='utf-8')
out = sys.argv[2] if len(sys.argv) > 2 else str(root / '_lab' / 'forms_sheet.png')
subprocess.run([sys.executable, 'D:/Minigame/_workflow/tools/shot.py', str(root), '--page', '_lab/forms_sheet.html', '--hash', '', '--size', '2016x1200', '--wait', '3000', '--out', out], check=True)
