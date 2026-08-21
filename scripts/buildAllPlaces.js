import fs from 'fs';
import path from 'path';
import { rawData as northData } from './northPlaces.js';
import { centralData } from './centralPlaces.js';
import { northeastData } from './northeastPlaces.js';
import { southData } from './southPlaces.js';

// Categories lookup
const categoriesMap = {
  nature: { th: "ธรรมชาติและภูเขา", en: "Nature & Mountains", zh: "自然与山脉" },
  temple: { th: "วัดและศาสนสถาน", en: "Temples & Culture", zh: "寺庙与宗教" },
  sea: { th: "ทะเลและหมู่เกาะ", en: "Beaches & Islands", zh: "海滩与岛屿" },
  market: { th: "ตลาดและสตรีทฟู้ด", en: "Markets & Street Food", zh: "市场与街头美食" },
  history: { th: "ประวัติศาสตร์และมรดกโลก", en: "History & Heritage", zh: "历史与世界遗产" },
  lifestyle: { th: "ชุมชนและวิถีชีวิต", en: "Community & Lifestyle", zh: "社区与生活风情" }
};

const regionsMap = {
  north: { th: "ภาคเหนือ", en: "Northern Thailand", zh: "泰国北部" },
  central: { th: "ภาคกลาง", en: "Central Thailand", zh: "泰国中部" },
  northeast: { th: "ภาคตะวันออกเฉียงเหนือ", en: "Northeastern Thailand", zh: "泰国东北部" },
  south: { th: "ภาคใต้", en: "Southern Thailand", zh: "泰国南部" }
};

const allRaw = [...northData, ...centralData, ...northeastData, ...southData];

console.log(`Combining ${allRaw.length} total places...`);

const enrichedPlaces = allRaw.map(p => {
  const catObj = categoriesMap[p.categoryId] || { th: "ท่องเที่ยว", en: "Attraction", zh: "景点" };
  const regObj = regionsMap[p.region] || { th: "ประเทศไทย", en: "Thailand", zh: "泰国" };
  
  return {
    id: p.id,
    name: p.name,
    province: p.province,
    category: catObj,
    categoryId: p.categoryId,
    region: regObj,
    regionId: p.region,
    description: p.description,
    rating: p.rating || 4.7,
    reviewCount: p.reviewCount || 100,
    price: p.price || { th: "เข้าชมฟรี", en: "Free Entry", zh: "免费入场" },
    hours: p.hours || "08:00 - 17:00",
    lat: p.lat,
    lng: p.lng,
    images: [
      p.image,
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1000&q=80"
    ],
    featured: [1, 4, 11, 23, 28, 44, 47, 51, 53, 55, 61, 79, 102, 106, 109, 116, 121, 136, 151, 156, 163, 164, 168, 183].includes(p.id),
    popular: [1, 3, 4, 11, 21, 44, 46, 51, 52, 53, 55, 56, 61, 66, 79, 80, 102, 106, 109, 116, 119, 136, 140, 151, 152, 153, 156, 164, 168, 170, 172, 183].includes(p.id),
    recommended: [2, 5, 12, 16, 22, 28, 30, 36, 47, 54, 58, 62, 70, 78, 81, 83, 87, 96, 97, 103, 110, 111, 118, 124, 125, 133, 141, 145, 158, 159, 162, 163, 165, 174, 177, 179, 180, 184, 189, 191, 195, 200].includes(p.id),
    address: {
      th: `ตำบล/อำเภอ, ${p.province.th}, ประเทศไทย`,
      en: `${p.province.en}, Thailand`,
      zh: `泰国${p.province.zh}`
    },
    contact: "+66 2 250 5500 (TAT Call Center 1672)",
    tags: [catObj.th, regObj.th, p.province.th]
  };
});

const outPath = path.join(process.cwd(), 'backend', 'data', 'places.json');
fs.writeFileSync(outPath, JSON.stringify(enrichedPlaces, null, 2), 'utf8');

console.log(`Successfully generated ${enrichedPlaces.length} places into ${outPath}`);
