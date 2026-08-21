import fs from 'fs';
import path from 'path';

// Load the newly provided JSON (hierarchical regions structure)
const incomingRaw = fs.readFileSync(path.join(process.cwd(), 'scripts', 'incoming_places.json'), 'utf8');
const incomingData = JSON.parse(incomingRaw);

// Load existing backend places.json
const existingRaw = fs.readFileSync(path.join(process.cwd(), 'backend', 'data', 'places.json'), 'utf8');
const existingPlaces = JSON.parse(existingRaw);

console.log('Incoming total_places in header:', incomingData.total_places);
console.log('Incoming regions count:', incomingData.regions.length);

const incomingMap = new Map();
for (const region of incomingData.regions) {
  for (const p of region.places) {
    incomingMap.set(p.id, {
      regionId: region.id,
      regionName: region.name,
      ...p
    });
  }
}

console.log('Total places parsed from incoming:', incomingMap.size);

// Check if all 1..200 exist
let missingInIncoming = 0;
for (let id = 1; id <= 200; id++) {
  if (!incomingMap.has(id)) {
    console.log('Missing id in incoming:', id);
    missingInIncoming++;
  }
}
console.log('Missing count in incoming:', missingInIncoming);

// Build updated places array
const updatedPlaces = existingPlaces.map((oldPlace: any) => {
  const inc = incomingMap.get(oldPlace.id);
  if (!inc) {
    return oldPlace;
  }
  return {
    ...oldPlace,
    name: inc.name || oldPlace.name,
    province: inc.province || oldPlace.province,
    description: inc.description || oldPlace.description,
    location: inc.location || { map_url: '' }
  };
});

console.log('Updated places count:', updatedPlaces.length);
console.log('Sample updated place 0:', JSON.stringify(updatedPlaces[0], null, 2));
console.log('Sample updated place 199:', JSON.stringify(updatedPlaces[199], null, 2));

// Save back to backend/data/places.json
fs.writeFileSync(path.join(process.cwd(), 'backend', 'data', 'places.json'), JSON.stringify(updatedPlaces, null, 2), 'utf8');
console.log('Successfully updated backend/data/places.json!');
