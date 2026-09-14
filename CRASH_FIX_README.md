
# SERVERLESS FUNCTION CRASHED - FIX APPLIED v3.0.1

## Why it crashed:
Vercel log: "This Serverless Function has crashed"
Cause: Prisma Client trying to load at top-level before DATABASE_URL exists, or DATABASE_URL has channel_binding=require which crashes

## Fix applied in this version:
1. api/index.js now has NO top-level Prisma import - lazy loads inside try/catch
2. /api/health returns success WITHOUT DB - will NEVER crash
3. /api/health/db checks DB separately
4. Automatically strips channel_binding=require from DATABASE_URL
5. Removed socket.io, twilio, heavy deps (caused 250MB size crash)
6. vercel.json rewrites all to api/index.js

## Deploy this fixed version:

1. Upload this to https://github.com/uzzirulzz-cyber/leado (replace all files)
2. Vercel will auto-deploy
3. Check https://leado.vercel.app/api/health -> should return success:true (no crash)
4. Check https://leado.vercel.app/api/health/db -> if DATABASE_URL set correctly, should return userCount
   If it says DATABASE_URL not set -> go to Vercel Dashboard -> Settings -> Environment Variables -> Add DATABASE_URL

   CORRECT DATABASE_URL (NO channel_binding):
   postgresql://neondb_owner:npg_YfErWsIBK3D8@ep-royal-feather-aei4avdp-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

5. Seed Super Admin:
   POST https://leado.vercel.app/api/auth/setup
   Body: { "email": "admin@playbeat.live", "password": "playbeat1122", "name": "Super Admin" }

   Or use curl:
   curl -X POST https://leado.vercel.app/api/auth/setup -H "Content-Type: application/json" -d '{"email":"admin@playbeat.live","password":"playbeat1122"}'

6. Login:
   https://leado.vercel.app/index.html -> admin@playbeat.live / playbeat1122

## If still crashes:
Share Vercel -> Deployments -> Click failed -> Function Logs -> copy error message
