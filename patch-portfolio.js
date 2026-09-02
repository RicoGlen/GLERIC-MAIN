const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
const raw = fs.readFileSync(filePath, 'utf8');

const manifestMatch = raw.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (!manifestMatch) throw new Error('manifest tag not found');
const manifest = JSON.parse(manifestMatch[1]);

const TARGET_UUID = '2ba1566e-e5f0-4122-8de3-231c36c18685';
const entry = manifest[TARGET_UUID];
if (!entry) throw new Error('target uuid missing from manifest');

const fieldName = entry.data !== undefined ? 'data' : entry.base64 !== undefined ? 'base64' : 'content';
console.log('entry keys:', Object.keys(entry), 'using field:', fieldName);

const compressed = Buffer.from(entry[fieldName], 'base64');
const original = zlib.gunzipSync(compressed).toString('utf8');

const oldDemosStart = original.indexOf('const demos = [');
if (oldDemosStart === -1) throw new Error('demos array not found');
const oldDemosEnd = original.indexOf('];', oldDemosStart) + 2;
const oldDemosBlock = original.slice(oldDemosStart, oldDemosEnd);
console.log('--- OLD DEMOS BLOCK ---\n' + oldDemosBlock);

const newDemosBlock = `const demos = [
    {
      idx: "01", tier: "blue", cat: "Horeca",
      title: "Restaurant website",
      desc: "Menukaart, reserveringen en sfeer die gasten overtuigt.",
      url: "demo-restaurant.gleric.nl",
      ph: "restaurant — demo preview",
      link: "portfolio/atelier-27/index.html",
      external: false
    },
    {
      idx: "02", tier: "violet", cat: "Techniek",
      title: "Vakspecialist website",
      desc: "Groepenkast vervangen in Alkmaar & Heiloo — heldere indicatieprijs en WhatsApp-inspectie.",
      url: "groepenkast.info",
      ph: "groepenkast vervangen — live project",
      link: "https://groepenkastvervangen-info.vercel.app",
      external: true
    },
    {
      idx: "03", tier: "cyan", cat: "Autodetailing",
      title: "Detailing website",
      desc: "Premium autodetailing in Heiloo — lakcorrectie, coating en directe afspraken.",
      url: "richierichdetailing.com",
      ph: "auto detailing — live project",
      link: "https://richierichdetailing.com",
      external: true
    }];`;

let patched = original.slice(0, oldDemosStart) + newDemosBlock + original.slice(oldDemosEnd);

const oldAnchor = '<a href="#contact" className="demo__link">';
const newAnchor = '<a href={d.link} target={d.external ? "_blank" : undefined} rel={d.external ? "noopener noreferrer" : undefined} className="demo__link">';
if (!patched.includes(oldAnchor)) throw new Error('anchor pattern not found');
patched = patched.replace(oldAnchor, newAnchor);

console.log('\n--- Patched length ---', patched.length, '(was', original.length, ')');

const newCompressed = zlib.gzipSync(Buffer.from(patched, 'utf8'));
const newBase64 = newCompressed.toString('base64');
entry[fieldName] = newBase64;
if (entry.size !== undefined) entry.size = newCompressed.length;

const newManifestJson = JSON.stringify(manifest);
const newRaw = raw.slice(0, manifestMatch.index) +
  `<script type="__bundler/manifest">${newManifestJson}</script>` +
  raw.slice(manifestMatch.index + manifestMatch[0].length);

fs.writeFileSync(filePath, newRaw, 'utf8');
console.log('\nWrote patched file. New file size:', newRaw.length, '(was', raw.length, ')');
