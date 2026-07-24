# EduMeet Deployment Guide

## Table of Contents
- [Server (VPS) - PM2 + Nginx](#server-vps---pm2--nginx)
- [Server (VPS) - Docker](#server-vps---docker)
- [Frontend (Vercel)](#frontend-vercel)
- [Environment Variables Reference](#environment-variables-reference)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Server (VPS) - PM2 + Nginx

### Prerequisites
- Ubuntu 22.04+ VPS
- Node.js 20.x
- Nginx
- PM2 (`npm i -g pm2`)
- Git

### Step 1: Clone the repository
```bash
git clone https://github.com/your-org/edumeet.git /opt/edumeet
cd /opt/edumeet
```

### Step 2: Configure environment
```bash
cp server/.env.example server/.env
nano server/.env
```

Set production values:
```env
PORT=5000
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
JWT_SECRET=<generate-a-strong-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOG_FORMAT=combined
```

### Step 3: Install dependencies and build
```bash
cd server
npm ci
npm run build
```

### Step 4: Set up PM2
```bash
pm2 start dist/index.js --name edumeet-server
pm2 save
pm2 startup  # Follow the printed instructions to enable PM2 on reboot
```

### Step 5: Configure Nginx reverse proxy with SSL

Install Nginx and Certbot:
```bash
apt update && apt install nginx certbot python3-certbot-nginx -y
```

Copy the Nginx config:
```bash
cp server/nginx.conf /etc/nginx/sites-available/edumeet
ln -s /etc/nginx/sites-available/edumeet /etc/nginx/sites-enabled/
nano /etc/nginx/sites-available/edumeet  # Replace your-domain.com with your actual domain
nginx -t
systemctl reload nginx
```

Obtain SSL certificate:
```bash
certbot --nginx -d your-domain.com
```

### Step 6: Set up firewall
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

### Step 7: Monitor with PM2
```bash
pm2 monit                 # Real-time monitoring
pm2 logs edumeet-server   # View logs
pm2 status                # Process status
```

---

## Server (VPS) - Docker

### Prerequisites
- Docker and Docker Compose installed

### Deploy with Docker Compose
```bash
cd /opt/edumeet
docker compose up -d
```

Verify the container is healthy:
```bash
docker compose ps
curl http://localhost:5000/api/health
```

View logs:
```bash
docker compose logs -f
```

Stop and remove:
```bash
docker compose down
```

### With LiveKit (when available)
Uncomment the `livekit` service in `docker-compose.yml` and create a `livekit.yaml` config file:
```yaml
port: 7880
bind_addresses:
  - "0.0.0.0"
rtc:
  port_range_start: 7882
  port_range_end: 7882
  use_external_ip: true
keys:
  your-api-key: your-api-secret
```

### Build and run the Docker image manually
```bash
cd server
docker build -t edumeet-server .
docker run -d \
  --name edumeet-server \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  edumeet-server
```

---

## Vercel (Full-Stack — Frontend + API)

Deploy the **entire platform** (React frontend + Express API) as a single Vercel project.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/edumeet.git
git push -u origin main
```

### Step 2: Import in Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your GitHub repository
3. **Root Directory** stays at `./` (the root `vercel.json` handles everything)
4. **Framework Preset**: Vite (auto-detected from `client/vite.config.ts`)
5. Click **Deploy**

### Step 3: Set environment variables
In the Vercel project dashboard → **Settings → Environment Variables**, add:

#### Frontend (`VITE_*`)
| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://<your-project>.vercel.app/api` | Production |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAUAmPOlDJLuj92Ujy-8cbtz9CY5CVCPUA` | All |
| `VITE_FIREBASE_AUTH_DOMAIN` | `edumeet-a66b5.firebaseapp.com` | All |
| `VITE_FIREBASE_PROJECT_ID` | `edumeet-a66b5` | All |
| `VITE_FIREBASE_STORAGE_BUCKET` | `edumeet-a66b5.firebasestorage.app` | All |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `973384562260` | All |
| `VITE_FIREBASE_APP_ID` | `1:973384562260:web:e6641189bc6ae862465fc1` | All |
| `VITE_FIREBASE_DATABASE_URL` | `https://edumeet-a66b5-default-rtdb.europe-west1.firebasedatabase.app` | All |

#### Backend (Server)
| Variable | Value | Environment |
|----------|-------|-------------|
| `FIREBASE_PROJECT_ID` | `edumeet-a66b5` | All |
| `FIREBASE_DATABASE_URL` | `https://edumeet-a66b5-default-rtdb.europe-west1.firebasedatabase.app` | All |
| `FIREBASE_PRIVATE_KEY_BASE64` | *(see below)* | All |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@edumeet-a66b5.iam.gserviceaccount.com` | All |
| `CORS_ORIGINS` | `https://<your-project>.vercel.app` | All |
| `JWT_SECRET` | *(generate a random string)* | All |
| `NODE_ENV` | `production` | Production |

> **Getting `FIREBASE_PRIVATE_KEY_BASE64`:**  
> Encode your service account private key to base64:
> ```bash
> # On Windows (PowerShell):
> [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$(Get-Content server/.env | Select-String 'FIREBASE_PRIVATE_KEY' -Context 0,30 | % { $_ -replace 'FIREBASE_PRIVATE_KEY=', '' } )"))
>
> # Or copy the private key value (including BEGIN/END lines) and use:
> node -e "process.stdout.write(Buffer.from(require('fs').readFileSync('/dev/stdin','utf8'),'utf8').toString('base64'))" < key.pem
> ```

### Step 4: Deploy
Each push to `main` auto-deploys. To manually re-deploy:
```bash
npx vercel --prod
```

After deployment, your app will be live at:  
**`https://<your-project>.vercel.app`**

The API is available at:  
**`https://<your-project>.vercel.app/api/health`**

### Important: Apply Firebase RTDB Rules
After deployment, paste the contents of `firebase-database.rules.json` into:
Firebase Console → Realtime Database → Rules

### Deploying Frontend Only (separate project)
If you prefer to deploy just the frontend to Vercel and run the backend elsewhere:
1. Create a new Vercel project with **Root Directory** set to `client`
2. Set only the `VITE_*` environment variables
3. Set `VITE_API_URL` to your backend's URL

---

## Environment Variables Reference

### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | API server port |
| `NODE_ENV` | No | `development` | Environment mode (`development` / `production`) |
| `FIREBASE_PROJECT_ID` | **Yes** | — | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | **Yes** | — | Firebase Admin SDK private key (with real newlines) |
| `FIREBASE_PRIVATE_KEY_BASE64` | No | — | Base64-encoded alternative to `FIREBASE_PRIVATE_KEY` |
| `FIREBASE_CLIENT_EMAIL` | **Yes** | — | Firebase Admin SDK client email |
| `FIREBASE_DATABASE_URL` | **Yes** | — | Firebase Realtime Database URL |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration duration |
| `R2_ENDPOINT` | No | — | Cloudflare R2 S3-compatible endpoint URL |
| `R2_ACCESS_KEY_ID` | No | — | Cloudflare R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | No | — | Cloudflare R2 secret access key |
| `R2_BUCKET_NAME` | No | `zoom-classroom` | Cloudflare R2 bucket name |
| `R2_PUBLIC_URL` | No | — | Cloudflare R2 public base URL |
| `LIVEKIT_API_KEY` | No | — | LiveKit API key |
| `LIVEKIT_API_SECRET` | No | — | LiveKit API secret |
| `LIVEKIT_URL` | No | — | LiveKit server WebSocket URL (e.g. `wss://livekit.example.com`) |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL for CORS |
| `CORS_ORIGINS` | No | — | Comma-separated allowed origins (overrides `CLIENT_URL`) |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window in milliseconds (15 min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `LOG_FORMAT` | No | `dev` | Morgan log format (`dev` / `combined`) |

### Client (`client/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | `http://localhost:5000/api` | Backend API base URL |
| `VITE_FIREBASE_API_KEY` | **Yes** | — | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | — | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | — | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Yes** | — | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | — | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | **Yes** | — | Firebase app ID |
| `VITE_FIREBASE_DATABASE_URL` | **Yes** | — | Firebase Realtime Database URL |
| `VITE_LIVEKIT_URL` | No | — | LiveKit WebSocket URL |

---

## Production Checklist

- [ ] **HTTPS configured** — Nginx SSL with valid Let's Encrypt certificate
- [ ] **Firebase RTDB rules applied** — Run `firebase deploy --only database` with the rules in `firebase-database.rules.json`
- [ ] **Email verification enabled** — Enabled in Firebase Authentication settings
- [ ] **Rate limiting tuned** — Adjusted `RATE_LIMIT_MAX` for expected traffic levels
- [ ] **CORS origins set** — `CORS_ORIGINS` restricted to your frontend domain only
- [ ] **Logging configured** — `LOG_FORMAT=combined` for production
- [ ] **Monitoring set up** — PM2 metrics, uptime monitoring (e.g., UptimeRobot, Better Stack)
- [ ] **Backups configured** — Firebase RTDB backups (Firebase Console → Realtime Database → Backups)
- [ ] **SSL certificates valid** — Certbot auto-renewal active (`certbot renew --dry-run`)
- [ ] **Firewall enabled** — UFW active with only SSH and Nginx allowed
- [ ] **Docker healthcheck working** — Container health endpoint responds correctly
- [ ] **Secrets rotated** — JWT secret, Firebase private key unique per environment
- [ ] **Database indexes configured** — Firebase RTDB indexes for query performance

---

## Troubleshooting

### PM2 issues
| Problem | Solution |
|---------|----------|
| Server won't start | Check logs: `pm2 logs edumeet-server --lines 50` |
| Port already in use | `lsof -i :5000` then `kill <PID>` |
| PM2 not starting on reboot | Run `pm2 startup` again and verify the systemd service |

### Docker issues
| Problem | Solution |
|---------|----------|
| Container exits immediately | `docker logs edumeet-server` to see startup errors |
| Health check failing | Verify `/api/health` endpoint: `curl http://localhost:5000/api/health` |
| Port conflict | `docker compose down && docker compose up -d` or change host port |

### Nginx / SSL issues
| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | Server not running — check `pm2 status` or `docker compose ps` |
| SSL certificate expired | `certbot renew` then `systemctl reload nginx` |
| 413 Request Entity Too Large | Increase `client_max_body_size` in nginx config |

### Firebase issues
| Problem | Solution |
|---------|----------|
| Permission denied | Check Firebase RTDB rules are deployed and user is authenticated |
| Private key format errors | Ensure newlines are literal in `FIREBASE_PRIVATE_KEY`, not `\n` escape sequences |
| Auth failing in production | Verify `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PROJECT_ID` are correct |

### Vercel deployment issues
| Problem | Solution |
|---------|----------|
| Build fails | Check build logs in Vercel dashboard |
| API calls returning 404 | Verify `VITE_API_URL` points to your production server |
| Routing broken | Ensure `vercel.json` rewrites are present for SPA routing |
| Environment variables not applied | Re-deploy after adding them in Vercel dashboard |
