# Leado - PLAYBEAT LEADPULSE v3 - Lead Employee Engine

**Repo:** https://github.com/uzzirulzz-cyber/leado
**Live:** https://lead-employee-engin.vercel.app
**Branding:** PLAYBEAT LEADPULSE - dark neon blue + yellow heartbeat P logo

## Super Admin (Password Protected Landing)
- Email: admin@playbeat.live
- Password: playbeat1122
- Authority: Create employees, assign Seat 1/2/3/4, route leads, edit landing

## Neon DB
postgresql://neondb_owner:npg_YfErWsIBK3D8@ep-royal-feather-aei4avdp-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

## Seats
- Seat One (1) - 250 leads - Employee One emp1@playbeat.live / playbeat1122
- Seat Two (2) - 250 leads - Employee Two emp2@playbeat.live / playbeat1122
- Seat Three (3) - 250 leads - Employee Three emp3@playbeat.live / playbeat1122 WhatsApp
- Seat Four (4) - 250 leads - Employee Four emp4@playbeat.live / playbeat1122 Calling

## Quick Start
npm install
npx prisma migrate dev --name init_leado
npx prisma generate
node src/seed.js
npm start

Dashboard: http://localhost:3000/index.html -> admin@playbeat.live / playbeat1122
Landing: http://localhost:3000/landing.html -> YOUR WORLD OF LEAD POSSIBILITIES
