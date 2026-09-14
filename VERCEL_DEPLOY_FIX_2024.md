
# VERCEL DEPLOY FAIL - FIX FOR LEADO

## Your error is likely one of these:

### ERROR 1: Prisma - channel_binding=require
LOG: "Error: The `channel_binding` parameter is not supported"
FIX:
In Vercel Dashboard -> Settings -> Environment Variables:
DATABASE_URL must be WITHOUT &channel_binding=require

WRONG:
postgresql://...@ep-royal-feather.../neondb?sslmode=require&channel_binding=require

CORRECT:
postgresql://neondb_owner:npg_YfErWsIBK3D8@ep-royal-feather-aei4avdp-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

### ERROR 2: Build failed - prisma generate
LOG: "Can't find schema.prisma" or "prisma: not found"
FIX: This package.json now has:
"postinstall": "prisma generate"
"build": "prisma generate"
And prisma is in dependencies (not devDependencies)

### ERROR 3: Function size too large / socket.io
LOG: "Function size 250MB exceeds 50MB"
FIX: Removed socket.io and twilio from dependencies in this fixed package.json
Socket.io = 30MB, twilio = 20MB -> causes Vercel size error
Calling feature will work in Mock mode only on Vercel, for real PSTN deploy calling to Railway.

### ERROR 4: Cannot find module '../src/app'
FIX: New api/index.js is standalone minimal, doesn't require src/app.js if it fails
Health check /api/health will work even if DB fails

## DEPLOY STEPS FOR LEADO:

1. Push this fixed version to https://github.com/uzzirulzz-cyber/leado

2. Vercel Dashboard:
   - Go to https://vercel.com/new
   - Import leado repo
   - Framework: Other
   - Build Command: npm run build (auto)
   - Output Directory: public

3. Environment Variables (MUST SET):
   DATABASE_URL = postgresql://neondb_owner:npg_YfErWsIBK3D8@ep-royal-feather-aei4avdp-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET = playbeat-leadpulse-super-secret-1122
   (NO channel_binding!)

4. Deploy -> Wait

5. After deploy success:
   - Visit https://leado.vercel.app/api/health -> should return success:true
   - If success, seed DB:
     POST https://leado.vercel.app/api/auth/setup
     Body: { "email": "admin@playbeat.live", "password": "playbeat1122", "name": "Super Admin" }

   Or seed locally:
   DATABASE_URL="postgresql://...?sslmode=require" node src/seed.js

6. Login: https://leado.vercel.app/index.html -> admin@playbeat.live / playbeat1122

## If still fails, share Vercel log:
Vercel -> Project -> Deployments -> Click failed -> View Function Logs + Build Logs -> Copy error
