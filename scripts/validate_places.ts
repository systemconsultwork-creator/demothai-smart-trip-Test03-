import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'backend', 'data', 'places.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

console.log('Total places:', data.length);
let countWithUrl = 0;
let missingUrl = 0;

for (const p of data) {
  if (p.location && p.location.map_url && p.location.map_url.startsWith('http')) {
    countWithUrl++;
  } else {
    console.log(`Place ID ${p.id} (${p.name?.th}) missing valid map_url!`);
    missingUrl++;
  }
}

console.log(`Validation result: ${countWithUrl} / 200 places have direct Google Maps URLs.`);
console.log(`Missing URLs: ${missingUrl}`);

// Print a few sample places with map_url
console.log('Sample place 1:', { id: data[0].id, name: data[0].name.th, map_url: data[0].location.map_url });
console.log('Sample place 100:', { id: data[99].id, name: data[99].name.th, map_url: data[99].location.map_url });
console.log('Sample place 200:', { id: data[199].id, name: data[199].name.th, map_url: data[199].location.map_url });
