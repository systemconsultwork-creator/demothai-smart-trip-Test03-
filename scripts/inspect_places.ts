import fs from 'fs';
import path from 'path';

// 1. Read existing places.json
const existingPlacesPath = path.join(process.cwd(), 'backend', 'data', 'places.json');
const existingRaw = fs.readFileSync(existingPlacesPath, 'utf8');
const existingData = JSON.parse(existingRaw);

console.log('Existing structure keys:', Object.keys(existingData));
if (Array.isArray(existingData)) {
  console.log('Existing data is Array of length:', existingData.length);
  console.log('Sample place 0:', JSON.stringify(existingData[0], null, 2));
} else if (existingData.places) {
  console.log('Existing data is Object with places length:', existingData.places.length);
  console.log('Sample place 0:', JSON.stringify(existingData.places[0], null, 2));
} else if (existingData.regions) {
  console.log('Existing data has regions length:', existingData.regions.length);
}
