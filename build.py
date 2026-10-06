#!/usr/bin/env python3
"""Rebuild the deployed page and a self-contained copy. Python 3 standard library only."""
from pathlib import Path
import base64
import html
import json
import re

ROOT = Path(__file__).resolve().parent

def main() -> None:
    data = json.loads((ROOT / 'catalog.json').read_text(encoding='utf-8'))
    if not isinstance(data, list) or len({p['id'] for p in data}) != len(data):
        raise ValueError('Catalog must be a list of uniquely numbered products.')
    for p in data:
        if not str(p['url']).startswith('https://'):
            raise ValueError(f"Invalid product URL: {p['id']}")
        if not (ROOT / p['image']).is_file():
            raise FileNotFoundError(f"Missing image: {p['image']}")
    template = (ROOT / 'src/index.template.html').read_text(encoding='utf-8')
    template = template.replace('__CATALOG__', json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'))
    fallback = '<ol>' + ''.join(f'<li><a href="{html.escape(p["url"], quote=True)}">{html.escape(p["name"])}</a></li>' for p in data) + '</ol>'
    template = template.replace('__NOSCRIPT__', fallback)
    (ROOT / 'index.html').write_text(template, encoding='utf-8')
    portable = re.sub(r'<link\b(?=[^>]*href="styles\.css")[^>]*>', lambda _: '<style>\n' + (ROOT / 'styles.css').read_text(encoding='utf-8') + '\n</style>', template)
    portable = portable.replace('<script src="app.js"></script>', '<script>\n' + (ROOT / 'app.js').read_text(encoding='utf-8') + '\n</script>')
    mime_types = {'.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'}
    for asset in sorted((ROOT / 'assets').iterdir(), key=lambda p: -len(p.name)):
        if asset.suffix.lower() not in mime_types:
            continue
        payload = base64.b64encode(asset.read_bytes()).decode('ascii')
        uri = f'data:{mime_types[asset.suffix.lower()]};base64,{payload}'
        portable = portable.replace('assets/' + asset.name, uri)
    (ROOT / 'tonys_list.html').write_text(portable, encoding='utf-8')
    print(f'Rebuilt {len(data)} products: index.html and tonys_list.html')

if __name__ == '__main__':
    main()
