#!/usr/bin/env python3
"""
Separa admin.html monolito en:
  admin.html (slim)
  css/admin.css
  js/admin.js

Tambien corrige branch principal → main
Uso:
  python3 scripts/split_admin.py admin.html
"""
import re
import sys
from pathlib import Path

src = Path(sys.argv[1] if len(sys.argv) > 1 else "admin.html")
if not src.exists():
    print(f"No existe: {src}")
    print("Descarga admin.html desde GitHub y ponlo junto a este script.")
    sys.exit(1)

text = src.read_text(encoding="utf-8")

# Fix branch
text2 = text.replace("branch: 'principal'", "branch: 'main'")
text2 = text2.replace('branch: "principal"', 'branch: "main"')
if text2 != text:
    print("OK: principal → main")
else:
    print("Info: no se encontro 'principal' (quizas ya estaba corregido)")

m_css = re.search(r"<style>(.*?)</style>", text2, re.DOTALL | re.IGNORECASE)
m_js = re.search(r"<script>(.*?)</script>\s*</body>", text2, re.DOTALL | re.IGNORECASE)

if not m_css or not m_js:
    print("Error: no se pudo extraer <style> o <script>")
    sys.exit(1)

css = m_css.group(1).strip() + "\n"
js = m_js.group(1).strip() + "\n"

slim = re.sub(r"<style>.*?</style>", '<link rel="stylesheet" href="css/admin.css">', text2, count=1, flags=re.DOTALL | re.IGNORECASE)
slim = re.sub(
    r"<script>.*?</script>\s*</body>",
    '<script src="js/admin.js"></script>\n</body>',
    slim,
    count=1,
    flags=re.DOTALL | re.IGNORECASE,
)

out_dir = Path(".")
(out_dir / "css").mkdir(exist_ok=True)
(out_dir / "js").mkdir(exist_ok=True)

helpers = '''
function showLoading(msg) {
  const el = document.getElementById('loadingOverlay');
  if (!el) return;
  const t = el.querySelector('.loading-text');
  if (t && msg) t.textContent = msg;
  el.classList.add('active');
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.remove('active');
}
'''
if 'function showLoading' not in js:
    js = helpers + "\n" + js
    print("OK: anadidos helpers showLoading/hideLoading")

(out_dir / "css" / "admin.css").write_text(css, encoding="utf-8")
(out_dir / "js" / "admin.js").write_text(js, encoding="utf-8")
(out_dir / "admin.modular.html").write_text(slim, encoding="utf-8")

print(f"OK css/admin.css  ({len(css):,} bytes)")
print(f"OK js/admin.js    ({len(js):,} bytes)")
print(f"OK admin.modular.html ({len(slim):,} bytes)")
print()
print("Siguiente paso:")
print("  1. Renombra admin.modular.html → admin.html (reemplaza el viejo)")
print("  2. Sube admin.html, css/admin.css y js/admin.js a GitHub")
