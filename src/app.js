
require('dotenv').config();
const express=require('express');
const cors=require('cors');
const bcrypt=require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma=new PrismaClient();
const app=express();

app.use(cors());
app.use(express.json({ limit:'20mb' }));
app.use(express.static('public'));
app.use(express.urlencoded({ extended:true }));

const { signToken, authMiddleware, requireRole } = require('./middleware/auth');
const { getSeats, routeLeads, assignSingleLead } = require('./services/leadRouter');
const { getProvider, answerCall, hangupCall } = require('./services/callService');
const { sendEmail, renderTemplate, getTransporter } = require('./services/emailService');
const { enrollLeads, processDueSequences } = require('./services/sequenceService');
const { checkWarmupLimit, importCsvLeads, WARMUP_SCHEDULE } = require('./services/warmupService');
const { runCampaign } = require('./services/jobRunner');

app.get('/api/health', (req,res)=>res.json({ success:true, message:'PLAYBEAT LEADPULSE v3 - Lead Employee Engine - Vercel', neon: !!process.env.DATABASE_URL }));

app.post('/api/auth/login', async (req,res)=>{
  const { email, password }=req.body;
  const user=await prisma.user.findUnique({ where:{ email }});
  if(!user) return res.status(401).json({ success:false, error:'Invalid credentials' });
  const valid=await bcrypt.compare(password, user.passwordHash);
  if(!valid) return res.status(401).json({ success:false, error:'Invalid credentials' });
  if(!user.isActive) return res.status(403).json({ success:false, error:'Account disabled' });
  const token=signToken(user);
  res.json({ success:true, data:{ token, user:{ id:user.id, email:user.email, name:user.name, role:user.role, seatId:user.seatId }}});
});

app.post('/api/auth/setup-super-admin', async (req,res)=>{
  const existing=await prisma.user.findFirst({ where:{ role:'SUPER_ADMIN' }});
  if(existing) return res.status(400).json({ success:false, error:'Super Admin already exists. Use login.' });
  const { email, password, name }=req.body;
  if(!email || !password) return res.status(400).json({ success:false, error:'email and password required' });
  const hash=await bcrypt.hash(password, 10);
  const user=await prisma.user.create({ data:{ email, passwordHash:hash, name:name||'Super Admin', role:'SUPER_ADMIN' }});
  const token=signToken(user);
  res.json({ success:true, data:{ token, user }});
});

app.post('/api/users', authMiddleware, requireRole('SUPER_ADMIN','ADMIN'), async (req,res)=>{
  const { email, password, name, role, seatNumber }=req.body;
  if(!email || !password || !name) return res.status(400).json({ success:false, error:'email, password, name required' });
  const hash=await bcrypt.hash(password, 10);
  let seat=null;
  if(seatNumber){
    seat=await prisma.seat.findUnique({ where:{ seatNumber: parseInt(seatNumber) }});
    if(!seat){ seat=await prisma.seat.create({ data:{ seatNumber: parseInt(seatNumber), name:`Seat ${['One','Two','Three','Four'][parseInt(seatNumber)-1]||seatNumber}`, maxLeads:250 }}); }
  }
  const user=await prisma.user.create({ data:{ email, passwordHash:hash, name, role: role||'EMPLOYEE', seatId: seat?.id, createdById: req.user.id }});
  res.json({ success:true, data:user });
});

app.get('/api/users', authMiddleware, requireRole('SUPER_ADMIN','ADMIN'), async (req,res)=>{
  const users=await prisma.user.findMany({ include:{ seat:true }, orderBy:{ createdAt:'desc' }});
  res.json({ success:true, data:users });
});

app.delete('/api/users/:id', authMiddleware, requireRole('SUPER_ADMIN'), async (req,res)=>{
  await prisma.user.delete({ where:{ id:req.params.id }});
  res.json({ success:true });
});

app.get('/api/seats', authMiddleware, async (req,res)=>{
  const seats=await getSeats();
  res.json({ success:true, data:seats });
});

app.get('/api/landing', async (req,res)=>{
  let page=await prisma.landingPage.findFirst();
  if(!page) page=await prisma.landingPage.create({ data:{ title:'PLAYBEAT LEADPULSE', subtitle:'YOUR WORLD OF LEAD POSSIBILITIES', protected:true, logoUrl:'/logo-playbeat.jpeg' }});
  res.json({ success:true, data:page });
});

app.post('/api/landing', authMiddleware, requireRole('SUPER_ADMIN'), async (req,res)=>{
  const { logoUrl, heroImageUrl, title, subtitle, protected: isProtected }=req.body;
  let page=await prisma.landingPage.findFirst();
  if(!page) page=await prisma.landingPage.create({ data:{ logoUrl, heroImageUrl, title, subtitle, protected: isProtected }});
  else page=await prisma.landingPage.update({ where:{ id: page.id }, data:{ logoUrl, heroImageUrl, title, subtitle, protected: isProtected }});
  res.json({ success:true, data:page });
});

app.post('/api/campaigns', authMiddleware, async (req,res)=>{
  const { name, industry, country, city, keywords=[], targetCount=1000 } = req.body;
  if(!name) return res.status(400).json({ success:false, error:'name required' });
  const c=await prisma.campaign.create({ data:{ name, industry, country, city, keywords, targetCount: parseInt(targetCount)||1000, status:'DRAFT' }});
  res.json({ success:true, data:c });
});
app.get('/api/campaigns', authMiddleware, async (req,res)=>{ const campaigns=await prisma.campaign.findMany({ orderBy:{ createdAt:'desc' }}); res.json({ success:true, data:campaigns }); });
app.post('/api/campaigns/:id/start', authMiddleware, async (req,res)=>{
  const campaign=await prisma.campaign.findUnique({ where:{ id:req.params.id }});
  if(!campaign) return res.status(404).json({ success:false, error:'Not found' });
  const job=await prisma.job.create({ data:{ campaignId:campaign.id, status:'QUEUED', stage:'DISCOVERY', batchSize:50 }});
  await prisma.campaign.update({ where:{ id:campaign.id }, data:{ status:'QUEUED', currentStage:'QUEUED' }});
  setTimeout(()=>runCampaign(job.id), 500);
  res.json({ success:true, data:{ jobId:job.id, status:'QUEUED' }});
});

app.get('/api/leads', authMiddleware, async (req,res)=>{
  const { search, page=1, limit=50, myLeads } = req.query;
  const where={};
  if(search) where.OR=[{ companyName:{ contains:search, mode:'insensitive'}},{ email:{ contains:search, mode:'insensitive'}}];
  if(myLeads==='true' && req.user.role==='EMPLOYEE') where.assignedToId=req.user.id;
  const skip=(parseInt(page)-1)*parseInt(limit);
  const [leads,total]=await Promise.all([prisma.lead.findMany({ where, orderBy:{ leadScore:'desc' }, skip, take:Math.min(parseInt(limit),100), include:{ assignedTo:true, assignedSeat:true }}), prisma.lead.count({ where })]);
  res.json({ success:true, data:{ leads, total, page:parseInt(page), totalPages:Math.ceil(total/parseInt(limit)) }});
});

app.post('/api/leads/route', authMiddleware, requireRole('SUPER_ADMIN','ADMIN'), async (req,res)=>{
  const { campaignId, strategy, channel } = req.body;
  if(!campaignId) return res.status(400).json({ success:false, error:'campaignId required' });
  try{
    const result=await routeLeads({ campaignId, strategy: strategy||'round_robin', channel, assignedById: req.user.id });
    res.json({ success:true, data: result });
  }catch(e){ res.status(500).json({ success:false, error: String(e.message) }); }
});

app.get('/api/stats', authMiddleware, async (req,res)=>{
  const baseWhere = req.user.role==='EMPLOYEE' ? { assignedToId: req.user.id } : {};
  const [total, verified, whatsapp, phone]=await Promise.all([
    prisma.lead.count({ where: baseWhere }),
    prisma.lead.count({ where:{ ...baseWhere, emailStatus:'VALID' }}),
    prisma.lead.count({ where:{ ...baseWhere, whatsappDetected:true }}),
    prisma.lead.count({ where:{ ...baseWhere, phoneRaw:{ not:null }}}),
  ]);
  const seats=await prisma.seat.findMany({ include:{ _count:{ select:{ leads:true }}, user:true }});
  res.json({ success:true, data:{ total, verified, whatsapp, phone, seats }});
});

app.get('/api/calls/provider/status', (req,res)=>{ const provider=getProvider(); res.json({ success:true, data:{ provider: provider.name, mode: provider.name==='twilio'?'PSTN':'Mock/WebRTC free' }}); });

module.exports=app;
