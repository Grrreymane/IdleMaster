#!/bin/sh
# sync src -> index.html, rebuild _test.html, syntax-check the whole game script
cd "$(dirname "$0")/.." && python tools/sync.py && python D:/Minigame/_workflow/tools/make_test_page.py . >/dev/null && node -e "
const h=require('fs').readFileSync('index.html','utf8');const s=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(b=>b.includes('SOURCES BEGIN'));
try{new Function(s);console.log('syntax ok')}catch(e){console.log('SYNTAX',e.message)}"
