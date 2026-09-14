
# VERCEL DEPLOYMENT FIX - Lead Employee Engine

## Common Errors & Fixes

### Error 1: Prisma - Can't find DATABASE_URL or channel_binding error
FIX: Your Neon URL has `channel_binding=require` which Prisma 5.14 doesn't support well on Vercel.
Solution: Remove `channel_binding=require` from DATABASE_URL in Vercel env:

Go to Vercel Dashboard -> Your Project -> Settings -> Environment Variables
Set:
DATABASE_URL = postgresql://neondb_owner:npg_YfErWsIBK3D8@ep-royal-feather-aei4avdp-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

(Remove &channel_binding=require)

### Error 2: Prisma Client not generated
FIX: Added `postinstall: npx prisma generate` and `vercel-build: npx prisma generate && npx prisma migrate deploy`
Vercel will auto-run postinstall.

### Error 3: Socket.io not working on Vercel serverless
FIX: Created src/app.js (Express app without http server) and api/index.js wrapper.
Vercel serverless doesn't support persistent WebSocket the same way, so calling will use Mock mode (works) or you need to deploy calling to separate service like Railway for full WebRTC.

### Error 4: Function size too large
FIX: Added .vercelignore to exclude node_modules from static.

### Error 5: 500 - Can't reach database
FIX: Ensure Vercel env has:
DATABASE_URL (without channel_binding)
JWT_SECRET=<set-a-random-secret>
SUPER_ADMIN_EMAIL=<set-admin-email>
SUPER_ADMIN_PASSWORD=<set-a-strong-password>

### Error 6: Prisma migrate fails on Vercel
FIX: Run migrate deploy manually once via Vercel CLI:
vercel env pull .env.local
npx prisma migrate deploy
node src/seed.js

## How to Deploy with a Vercel Token

Set the token in your local environment and revoke it after use at https://vercel.com/account/tokens:

`$env:VERCEL_TOKEN = "<your-vercel-token>"`

1. Install Vercel CLI: npm i -g vercel
2. Login: `vercel login` or pass `--token $env:VERCEL_TOKEN`
3. In project folder: vercel --prod
4. When asked env, set DATABASE_URL without channel_binding
5. Deploy

Or push to GitHub and import to Vercel dashboard:
- Go to vercel.com/new
- Import https://github.com/uzzirulzz-cyber/lead-employee-engin
- Add env vars, Deploy

## After Deploy Success
1. Go to https://your-app.vercel.app/api/health -> should return success:true
2. Go to https://your-app.vercel.app/ -> landing
3. Go to https://your-app.vercel.app/index.html -> login admin@playbeat.live / playbeat1122
4. Seed Neon if not seeded: vercel --prod --exec "node src/seed.js" or via Vercel CLI

## If Still Errors
Share Vercel deployment log - click deployment -> View Logs
Common log: "PrismaClientInitializationError" = DATABASE_URL wrong
Fix: remove channel_binding, ensure sslmode=require
