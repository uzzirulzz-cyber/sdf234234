# Lead Employee Engine - PLAYBEAT LEADPULSE v3

**Repo:** https://github.com/uzzirulzz-cyber/lead-employee-engin
**Live Branding:** PLAYBEAT LEADPULSE - dark neon blue + yellow heartbeat P logo

## Super Admin (Password Protected)
- Email: admin@playbeat.live
- Password: playbeat1122
- Authority: Create employees, assign to Seat 1/2/3/4, route leads, edit landing

## Neon Database
postgresql://neondb_owner:npg_YfErWsIBK3D8@ep-royal-feather-aei4avdp-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

## Seats - 4 Seats for 1000 Leads = 250 each
- Seat One (Seat 1) → Employee One emp1@playbeat.live / playbeat1122 → 250 leads
- Seat Two (Seat 2) → Employee Two emp2@playbeat.live / playbeat1122 → 250 leads
- Seat Three (Seat 3) → Employee Three emp3@playbeat.live / playbeat1122 → 250 leads (WhatsApp)
- Seat Four (Seat 4) → Employee Four emp4@playbeat.live / playbeat1122 → 250 leads (Calling)

## Quick Start
npm install
npx prisma migrate dev --name init_lead_employee_engin
npx prisma generate
node src/seed.js
# Creates Super Admin admin@playbeat.live / playbeat1122 + 4 seats in Neon
npm start
Dashboard: http://localhost:3000/index.html
Landing: http://localhost:3000/landing.html

## Push to GitHub
https://github.com/uzzirulzz-cyber/lead-employee-engin
```bash
git init
git add .
git commit -m "Lead Employee Engine v3 - Super Admin admin@playbeat.live / playbeat1122 + 4 seats + router + Neon DB"
git branch -M main
git remote add origin https://github.com/uzzirulzz-cyber/lead-employee-engin.git
git push -u origin main --force
```
