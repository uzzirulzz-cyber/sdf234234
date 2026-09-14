
// Vercel Serverless - Minimal entry - no socket.io
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Health - no DB needed
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'PLAYBEAT LEADPULSE v3 - Leado - Live on Vercel',
    version: '3.0.0',
    neon: !!process.env.DATABASE_URL,
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJwt: !!process.env.JWT_SECRET
    }
  });
});

// Lazy load Prisma only when needed to avoid build failure
let prisma = null;
function getPrisma() {
  if (!prisma) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
    } catch (e) {
      console.error('Prisma init error:', e.message);
      throw e;
    }
  }
  return prisma;
}

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const prisma = getPrisma();
    const bcrypt = require('bcryptjs');
    const { signToken } = require('../src/middleware/auth');
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, seatId: user.seatId } } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Setup Super Admin if none exists
app.post('/api/auth/setup', async (req, res) => {
  try {
    const prisma = getPrisma();
    const bcrypt = require('bcryptjs');
    const { signToken } = require('../src/middleware/auth');
    const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existing) return res.status(400).json({ success: false, error: 'Super Admin already exists' });
    const { email, password, name } = req.body;
    const hash = await bcrypt.hash(password || 'playbeat1122', 10);
    const user = await prisma.user.create({ 
      data: { 
        email: email || 'admin@playbeat.live', 
        passwordHash: hash, 
        name: name || 'Super Admin', 
        role: 'SUPER_ADMIN',
        isActive: true
      } 
    });
    // Create 4 seats
    for (let i = 1; i <= 4; i++) {
      const seatExists = await prisma.seat.findUnique({ where: { seatNumber: i } });
      if (!seatExists) {
        await prisma.seat.create({ data: { seatNumber: i, name: `Seat ${['One','Two','Three','Four'][i-1]}`, maxLeads: 250, status: 'AVAILABLE' } });
      }
    }
    const token = signToken(user);
    res.json({ success: true, data: { token, user, message: 'Super Admin created: admin@playbeat.live / playbeat1122' } });
  } catch (e) {
    console.error('Setup error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// All other routes - load app.js
try {
  const mainApp = require('../src/app');
  app.use('/api', mainApp);
} catch (e) {
  console.log('Main app not loaded in serverless, using minimal routes:', e.message);
}

// Catch all -> serve landing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

module.exports = app;
