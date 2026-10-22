#!/usr/bin/env python3
"""Inline src/*.js (order in src/modules.json) into index.html between // ==== SOURCES BEGIN/END ====.
   python tools/sync.py          write index.html
   python tools/sync.py --check  exit 1 if index.html is stale
Edit src/, never the generated block in index.html."""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
mods = json.loads((root / 'src' / 'modules.json').read_text(encoding='utf-8'))
parts = []
for m in mods:
    code = (root / 'src' / m).read_text(encoding='utf-8').rstrip('\n')
    parts.append(f'// ==== source:src/{m} ====\n{code}\n// ==== end source:src/{m} ====')
block = '// ==== SOURCES BEGIN ====\n' + '\n'.join(parts) + '\n// ==== SOURCES END ===='
p = root / 'index.html'
html = p.read_text(encoding='utf-8')
a = html.index('// ==== SOURCES BEGIN ===='); b = html.index('// ==== SOURCES END ====') + len('// ==== SOURCES END ====')
new = html[:a] + block + html[b:]
if '--check' in sys.argv:
    sys.exit(0 if new == html else 1)
if new != html:
    p.write_text(new, encoding='utf-8', newline='\n')
    print('index.html updated')
