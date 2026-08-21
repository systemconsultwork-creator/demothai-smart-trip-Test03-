import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for JSON files
const dataDir = path.join(process.cwd(), 'backend', 'data');

function readJsonFile(filename: string) {
  try {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
}

function writeJsonFile(filename: string, data: any) {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
}

// ---------------- AUTH MIDDLEWARE ----------------
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = req.headers['x-user-role'];
  const email = req.headers['x-user-email'];
  const authHeader = req.headers['authorization'];

  if (role === 'admin') {
    return next();
  }

  const users = readJsonFile('users.json');

  if (email && typeof email === 'string') {
    const user = users.find((u: any) => u.email === email);
    if (user && user.role === 'admin') {
      return next();
    }
  }

  if (authHeader && typeof authHeader === 'string') {
    const token = authHeader.replace('Bearer ', '');
    if (token.includes('usr-admin')) {
      return next();
    }
  }

  return res.status(403).json({
    error: 'Access denied. Administrator privileges required.',
    code: 'FORBIDDEN'
  });
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'thai-smart-trip-api', timestamp: new Date().toISOString() });
});

// Categories
app.get('/api/categories', (req, res) => {
  const categories = readJsonFile('categories.json');
  res.json(categories);
});

// Provinces
app.get('/api/provinces', (req, res) => {
  const provinces = readJsonFile('provinces.json');
  res.json(provinces);
});

// Places List & Filtering
app.get('/api/places', (req, res) => {
  const places = readJsonFile('places.json');
  const { q, category, region, province, minRating, sort, featured, popular, recommended, limit } = req.query;

  let filtered = [...places];

  // Search query (matches TH, EN, ZH names or descriptions or provinces)
  if (q && typeof q === 'string') {
    const query = q.toLowerCase().trim();
    filtered = filtered.filter(p => {
      const nameTh = p.name?.th?.toLowerCase() || '';
      const nameEn = p.name?.en?.toLowerCase() || '';
      const nameZh = p.name?.zh?.toLowerCase() || '';
      const provTh = p.province?.th?.toLowerCase() || '';
      const provEn = p.province?.en?.toLowerCase() || '';
      const descTh = p.description?.th?.toLowerCase() || '';
      const descEn = p.description?.en?.toLowerCase() || '';
      return nameTh.includes(query) || nameEn.includes(query) || nameZh.includes(query) ||
             provTh.includes(query) || provEn.includes(query) || descTh.includes(query) || descEn.includes(query);
    });
  }

  // Category filter
  if (category && typeof category === 'string' && category !== 'all') {
    filtered = filtered.filter(p => p.categoryId === category);
  }

  // Region filter
  if (region && typeof region === 'string' && region !== 'all') {
    filtered = filtered.filter(p => p.regionId === region);
  }

  // Province filter
  if (province && typeof province === 'string' && province !== 'all') {
    filtered = filtered.filter(p => p.province?.th === province || p.province?.en === province);
  }

  // Minimum Rating
  if (minRating) {
    const min = parseFloat(minRating as string);
    if (!isNaN(min)) {
      filtered = filtered.filter(p => (p.rating || 0) >= min);
    }
  }

  // Featured / Popular / Recommended flags
  if (featured === 'true') {
    filtered = filtered.filter(p => p.featured);
  }
  if (popular === 'true') {
    filtered = filtered.filter(p => p.popular);
  }
  if (recommended === 'true') {
    filtered = filtered.filter(p => p.recommended);
  }

  // Sorting
  if (sort === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'popular') {
    filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
  } else if (sort === 'name') {
    filtered.sort((a, b) => (a.name?.th || '').localeCompare(b.name?.th || ''));
  }

  // Limit
  if (limit) {
    const l = parseInt(limit as string, 10);
    if (!isNaN(l) && l > 0) {
      filtered = filtered.slice(0, l);
    }
  }

  res.json({
    total: filtered.length,
    places: filtered
  });
});

// Single Place
app.get('/api/places/:id', (req, res) => {
  const places = readJsonFile('places.json');
  const placeId = parseInt(req.params.id, 10);
  const place = places.find((p: any) => p.id === placeId);
  if (!place) {
    return res.status(404).json({ error: 'Place not found' });
  }
  res.json(place);
});

// Admin Add Place
app.post('/api/places', requireAdmin, (req, res) => {
  const places = readJsonFile('places.json');
  const newId = places.length > 0 ? Math.max(...places.map((p: any) => p.id || 0)) + 1 : 1;
  
  const newPlace = {
    id: newId,
    ...req.body,
    rating: req.body.rating || 5.0,
    reviewCount: req.body.reviewCount || 0,
    createdAt: new Date().toISOString()
  };

  places.push(newPlace);
  writeJsonFile('places.json', places);
  res.status(201).json(newPlace);
});

// Admin Update Place
app.put('/api/places/:id', requireAdmin, (req, res) => {
  const places = readJsonFile('places.json');
  const placeId = parseInt(req.params.id, 10);
  const index = places.findIndex((p: any) => p.id === placeId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Place not found' });
  }

  places[index] = {
    ...places[index],
    ...req.body,
    id: placeId
  };

  writeJsonFile('places.json', places);
  res.json(places[index]);
});

// Admin Delete Place
app.delete('/api/places/:id', requireAdmin, (req, res) => {
  const places = readJsonFile('places.json');
  const placeId = parseInt(req.params.id, 10);
  const filtered = places.filter((p: any) => p.id !== placeId);
  
  writeJsonFile('places.json', filtered);
  res.json({ success: true, message: `Place ${placeId} deleted successfully` });
});

// Reviews
app.get('/api/reviews', (req, res) => {
  const reviews = readJsonFile('reviews.json');
  const { placeId, userId } = req.query;

  let filtered = [...reviews];
  if (placeId) {
    const pId = parseInt(placeId as string, 10);
    filtered = filtered.filter((r: any) => r.placeId === pId);
  }
  if (userId) {
    filtered = filtered.filter((r: any) => r.userId === userId);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered);
});

app.post('/api/reviews', (req, res) => {
  const reviews = readJsonFile('reviews.json');
  const { placeId, rating, comment, userName, userId, userAvatar, language } = req.body;

  if (!placeId || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    placeId: parseInt(placeId, 10),
    userId: userId || 'guest',
    userName: userName || 'Traveller',
    userAvatar: userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    rating: Number(rating),
    comment,
    language: language || 'th',
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  writeJsonFile('reviews.json', reviews);

  // Update place review count & average rating in places.json
  const places = readJsonFile('places.json');
  const placeIndex = places.findIndex((p: any) => p.id === newReview.placeId);
  if (placeIndex !== -1) {
    const placeReviews = reviews.filter((r: any) => r.placeId === newReview.placeId);
    const avg = placeReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / placeReviews.length;
    places[placeIndex].rating = parseFloat(avg.toFixed(1));
    places[placeIndex].reviewCount = placeReviews.length;
    writeJsonFile('places.json', places);
  }

  res.status(201).json(newReview);
});

app.delete('/api/reviews/:id', (req, res) => {
  const reviews = readJsonFile('reviews.json');
  const reviewId = req.params.id;
  const filtered = reviews.filter((r: any) => r.id !== reviewId);
  writeJsonFile('reviews.json', filtered);
  res.json({ success: true });
});

// Submissions (Pending Places)
app.get('/api/submissions', (req, res) => {
  const submissions = readJsonFile('pendingPlaces.json');
  const { userId } = req.query;
  let filtered = [...submissions];
  if (userId) {
    filtered = filtered.filter((s: any) => s.submittedBy?.userId === userId);
  }
  res.json(filtered);
});

app.post('/api/submissions', (req, res) => {
  const submissions = readJsonFile('pendingPlaces.json');
  const newSubmission = {
    id: `pend-${Date.now()}`,
    ...req.body,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };
  submissions.push(newSubmission);
  writeJsonFile('pendingPlaces.json', submissions);
  res.status(201).json(newSubmission);
});

// Approve Submission -> Move into places.json
app.post('/api/submissions/:id/approve', requireAdmin, (req, res) => {
  const submissions = readJsonFile('pendingPlaces.json');
  const submissionId = req.params.id;
  const subIndex = submissions.findIndex((s: any) => s.id === submissionId);

  if (subIndex === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const sub = submissions[subIndex];
  const places = readJsonFile('places.json');
  const newId = places.length > 0 ? Math.max(...places.map((p: any) => p.id || 0)) + 1 : 1;

  const approvedPlace = {
    id: newId,
    name: sub.name,
    province: sub.province,
    category: sub.category,
    categoryId: sub.categoryId,
    region: sub.region,
    regionId: sub.regionId,
    description: sub.description,
    rating: sub.rating || 5.0,
    reviewCount: 0,
    price: sub.price || { th: 'เข้าชมฟรี', en: 'Free Entry', zh: '免费入场' },
    hours: sub.hours || '08:00 - 17:00',
    lat: sub.lat || 13.7563,
    lng: sub.lng || 100.5018,
    images: sub.images?.length > 0 ? sub.images : ['https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1000&q=80'],
    address: {
      th: `${sub.province?.th || ''}, ประเทศไทย`,
      en: `${sub.province?.en || ''}, Thailand`,
      zh: `泰国${sub.province?.zh || ''}`
    },
    contact: '+66 2 250 5500',
    tags: [sub.category?.th || '', sub.region?.th || '', sub.province?.th || ''],
    createdAt: new Date().toISOString()
  };

  places.push(approvedPlace);
  writeJsonFile('places.json', places);

  // Mark submission as approved
  submissions[subIndex].status = 'approved';
  writeJsonFile('pendingPlaces.json', submissions);

  res.json({ success: true, place: approvedPlace });
});

// Reject Submission
app.post('/api/submissions/:id/reject', requireAdmin, (req, res) => {
  const submissions = readJsonFile('pendingPlaces.json');
  const submissionId = req.params.id;
  const subIndex = submissions.findIndex((s: any) => s.id === submissionId);

  if (subIndex === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  submissions[subIndex].status = 'rejected';
  writeJsonFile('pendingPlaces.json', submissions);
  res.json({ success: true, message: 'Submission rejected' });
});

// Admin Stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const places = readJsonFile('places.json');
  const submissions = readJsonFile('pendingPlaces.json');
  const reviews = readJsonFile('reviews.json');
  const users = readJsonFile('users.json');

  const pendingCount = submissions.filter((s: any) => s.status === 'pending').length;

  const regionalStats = {
    north: places.filter((p: any) => p.regionId === 'north').length,
    central: places.filter((p: any) => p.regionId === 'central').length,
    northeast: places.filter((p: any) => p.regionId === 'northeast').length,
    south: places.filter((p: any) => p.regionId === 'south').length
  };

  res.json({
    totalPlaces: places.length,
    pendingSubmissions: pendingCount,
    totalReviews: reviews.length,
    totalUsers: users.length,
    regionalStats
  });
});

// Users and Auth Simulation
app.get('/api/users', (req, res) => {
  const users = readJsonFile('users.json');
  res.json(users);
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const users = readJsonFile('users.json');
  let user = users.find((u: any) => u.email === email);

  if (!user) {
    // If not found in demo, create a default user profile
    const isSpecialAdmin = email.includes('admin');
    user = {
      id: isSpecialAdmin ? 'usr-admin' : `usr-${Date.now()}`,
      name: isSpecialAdmin ? 'Admin Thai Smart Trip' : email.split('@')[0],
      email,
      role: isSpecialAdmin ? 'admin' : 'user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date().toISOString(),
      favorites: []
    };
    users.push(user);
    writeJsonFile('users.json', users);
  }

  res.json({
    user,
    token: `jwt-token-${user.id}-${Date.now()}`
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body;
  const users = readJsonFile('users.json');
  
  const existing = users.find((u: any) => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name || email.split('@')[0],
    email,
    role: role || (email.includes('admin') ? 'admin' : 'user'),
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
    favorites: []
  };

  users.push(newUser);
  writeJsonFile('users.json', users);

  res.status(201).json({
    user: newUser,
    token: `jwt-token-${newUser.id}-${Date.now()}`
  });
});

// Toggle Favorite
app.post('/api/users/favorite', (req, res) => {
  const { userId, placeId } = req.body;
  const users = readJsonFile('users.json');
  const userIndex = users.findIndex((u: any) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[userIndex];
  const pId = parseInt(placeId, 10);
  const favs = new Set(user.favorites || []);

  if (favs.has(pId)) {
    favs.delete(pId);
  } else {
    favs.add(pId);
  }

  user.favorites = Array.from(favs);
  users[userIndex] = user;
  writeJsonFile('users.json', users);

  res.json({ favorites: user.favorites });
});

// ---------------- SERVER START & VITE ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Thai Smart Trip server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
