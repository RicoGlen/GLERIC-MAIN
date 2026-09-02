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
const original = zlib.gunzipSync(Buffer.from(entry[fieldName], 'base64')).toString('utf8');

// --- 1. demos array: add thumbnail image paths ---
const oldDemosStart = original.indexOf('const demos = [');
if (oldDemosStart === -1) throw new Error('demos array not found');
const oldDemosEnd = original.indexOf('];', oldDemosStart) + 2;

const newDemosBlock = `const demos = [
    {
      idx: "01", tier: "blue", cat: "Horeca",
      title: "Restaurant website",
      desc: "Menukaart, reserveringen en sfeer die gasten overtuigt.",
      url: "demo-restaurant.gleric.nl",
      ph: "Atelier 27 — restaurant demo",
      img: "assets/thumbs/atelier-27.jpg",
      link: "portfolio/atelier-27/index.html",
      external: false
    },
    {
      idx: "02", tier: "violet", cat: "Techniek",
      title: "Vakspecialist website",
      desc: "Groepenkast vervangen in Alkmaar & Heiloo — heldere indicatieprijs en WhatsApp-inspectie.",
      url: "groepenkast.info",
      ph: "Groepenkast vervangen — live project",
      img: "assets/thumbs/groepenkast.jpg",
      link: "https://groepenkastvervangen-info.vercel.app",
      external: true
    },
    {
      idx: "03", tier: "cyan", cat: "Autodetailing",
      title: "Detailing website",
      desc: "Premium autodetailing in Heiloo — lakcorrectie, coating en directe afspraken.",
      url: "richierichdetailing.com",
      ph: "Richie Rich Detailing — live project",
      img: "assets/thumbs/detailing.jpg",
      link: "https://richierichdetailing.com",
      external: true
    }];`;

let patched = original.slice(0, oldDemosStart) + newDemosBlock + original.slice(oldDemosEnd);

// --- 2. anchor: per-demo link + external target ---
const oldAnchor = '<a href="#contact" className="demo__link">';
const newAnchor = '<a href={d.link} target={d.external ? "_blank" : undefined} rel={d.external ? "noopener noreferrer" : undefined} className="demo__link">';
if (patched.includes(oldAnchor)) {
  patched = patched.replace(oldAnchor, newAnchor);
} else if (!patched.includes('href={d.link}')) {
  throw new Error('anchor pattern not found and not already patched');
}

// --- 3. replace the empty placeholder box with a real screenshot ---
const oldPh = `<div className="demo__ph">
                  <span>{d.ph}</span>
                </div>`;
const newPh = `<div className="demo__ph">
                  <img
                    src={d.img}
                    alt={d.ph}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
                </div>`;
if (patched.includes(oldPh)) {
  patched = patched.replace(oldPh, newPh);
} else if (!patched.includes('src={d.img}')) {
  throw new Error('placeholder block not found and not already patched');
}

console.log('patched length:', patched.length, '(was', original.length, ')');

const newCompressed = zlib.gzipSync(Buffer.from(patched, 'utf8'));
entry[fieldName] = newCompressed.toString('base64');
if (entry.size !== undefined) entry.size = newCompressed.length;

const newRaw = raw.slice(0, manifestMatch.index) +
  `<script type="__bundler/manifest">${JSON.stringify(manifest)}</script>` +
  raw.slice(manifestMatch.index + manifestMatch[0].length);

fs.writeFileSync(filePath, newRaw, 'utf8');
console.log('wrote index.html:', newRaw.length, '(was', raw.length, ')');
