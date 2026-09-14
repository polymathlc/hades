import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const read = name => fs.readFileSync(fileURLToPath(new URL('../' + name, import.meta.url)), 'utf8');

test('standalone release contains executable JavaScript and no unresolved build markers', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /%(?:ASSETS_JSON|SCRIPTS|STYLES)%/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
});

test('all bundled images are valid, nonempty WebP assets', () => {
  const html = read('index.html');
  const assetBlock = html.match(/const ASSETS_DATA\s*=\s*(\{[^\r\n]+\});/);
  assert.ok(assetBlock, 'missing embedded asset table');
  const assets = JSON.parse(assetBlock[1]);
  assert.equal(Object.keys(assets).length, 19);
  for (const [name, uri] of Object.entries(assets)) {
    assert.match(uri, /^data:image\/webp;base64,/);
    const bytes = Buffer.from(uri.split(',')[1], 'base64');
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', name);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', name);
    assert.ok(bytes.length > 100, name);
  }
});
