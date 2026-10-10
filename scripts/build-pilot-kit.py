"""Bundle only explicit public pilot materials; never walk the project directory."""
import argparse
import io
import posixpath
import re
from pathlib import Path
from urllib.parse import quote
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    'START-HERE.md': 'docs/COMPANY-QUICKSTART.md',
    'devices.csv': 'public/samples/devices.csv',
    'parts.csv': 'public/samples/parts.csv',
    'DATA-SOURCES.md': 'docs/DATA-SOURCES.md',
    'FEATURES.md': 'docs/FEATURES.md',
    'feature-catalog.csv': 'docs/feature-catalog.csv',
    'LICENSE': 'LICENSE',
}
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
buffer = io.BytesIO()
with ZipFile(buffer, 'w', compression=ZIP_DEFLATED) as archive:
    for name, source in FILES.items():
        info = ZipInfo(name, date_time=(2026, 10, 10, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        # Stable line endings keep Windows and Linux release checks identical.
        content = (ROOT / source).read_text(encoding='utf-8').replace('\r\n', '\n')
        if source.endswith('.md'):
            # Bundled guides stay readable even when extracted outside the repository.
            def public_link(match):
                destination = match.group(2)
                if re.match(r'^(?:[a-z]+:|#)', destination, re.I):
                    return match.group(0)
                resolved = posixpath.normpath(posixpath.join(posixpath.dirname(source), destination))
                return match.group(1) + 'https://github.com/Golden007-prog/sparecycle/blob/main/' + quote(resolved, safe='/#') + ')'
            content = re.sub(r'(\[[^\]]+\]\()([^\)]+)\)', public_link, content)
        archive.writestr(info, content.encode('utf-8'))
target = ROOT / 'public/samples/sparecycle-pilot-kit.zip'
if args.check:
    # ZIP compressor versions can differ. Verify names and decompressed bytes.
    with ZipFile(target) as actual, ZipFile(buffer) as expected:
        assert actual.namelist() == expected.namelist(), 'Unexpected pilot kit file list'
        for name in expected.namelist():
            assert actual.read(name) == expected.read(name), f'Stale pilot kit entry: {name}'
else:
    target.write_bytes(buffer.getvalue())
print(f'Pilot kit: {len(FILES)} public files; {"verified" if args.check else "generated"}.')
