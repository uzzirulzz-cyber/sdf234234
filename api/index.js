
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PLAYBEAT LEADPULSE v3 - sdf234234 - Node 24.x - Crash Fixed',
    version: '3.0.2',
    node: process.version,
    env: { hasDatabase: !!process.env.DATABASE_URL, hasJwt: !!process.env.JWT_SECRET }
  });
});

app.get('/api/health/db', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) return res.status(500).json({ success: false, error: 'DATABASE_URL not set in Vercel' });
    let dbUrl = process.env.DATABASE_URL;
    if (dbUrl.includes('channel_binding')) {
      dbUrl = dbUrl.split('&channel_binding')[0].split('?channel_binding')[0];
      if (!dbUrl.includes('sslmode')) dbUrl += '?sslmode=require';
    }
    process.env.DATABASE_URL = dbUrl;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    const count = await prisma.user.count();
    await prisma.$disconnect();
    res.json({ success: true, message: 'Neon DB connected', userCount: count });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    let dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('channel_binding')) {
      dbUrl = dbUrl.split('&channel_binding')[0].split('?channel_binding')[0];
      if (!dbUrl.includes('sslmode')) dbUrl += '?sslmode=require';
    }
    process.env.DATABASE_URL = dbUrl;
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const prisma = new PrismaClient();
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { await prisma.$disconnect(); return res.status(401).json({ success: false, error: 'Invalid' }); }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { await prisma.$disconnect(); return res.status(401).json({ success: false, error: 'Invalid' }); }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'playbeat-secret', { expiresIn: '7d' });
    await prisma.$disconnect();
    res.json({ success: true, data: { token, user } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/auth/setup', async (req, res) => {
  try {
    let dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('channel_binding')) {
      dbUrl = dbUrl.split('&channel_binding')[0].split('?channel_binding')[0];
      if (!dbUrl.includes('sslmode')) dbUrl += '?sslmode=require';
    }
    process.env.DATABASE_URL = dbUrl;
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existing) { await prisma.$disconnect(); return res.json({ success: true, message: 'Super Admin exists', user: existing }); }
    const { email, password, name } = req.body;
    const hash = await bcrypt.hash(password || 'playbeat1122', 10);
    const user = await prisma.user.create({ data: { email: email || 'admin@playbeat.live', passwordHash: hash, name: name || 'Super Admin', role: 'SUPER_ADMIN', isActive: true } });
    for (let i = 1; i <= 4; i++) {
      const ex = await prisma.seat.findUnique({ where: { seatNumber: i } });
      if (!ex) await prisma.seat.create({ data: { seatNumber: i, name: `Seat ${['One','Two','Three','Four'][i-1]}`, maxLeads: 250, status: 'AVAILABLE' } });
    }
    await prisma.$disconnect();
    res.json({ success: true, data: { user, message: 'Super Admin created: admin@playbeat.live / playbeat1122' } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ success: false, error: 'Not found' });
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

module.exports = app;
