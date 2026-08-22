import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { syncPlacesFromJsonFile } from '../backend/firebaseSync';

const filePath = path.join(process.cwd(), 'backend', 'data', 'places.json');
const places = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const result = await syncPlacesFromJsonFile(places);
console.log(JSON.stringify(result, null, 2));

if (!result.success) process.exitCode = 1;
