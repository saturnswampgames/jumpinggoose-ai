# JUMPINGGOOSE n8n on Render

This folder contains the minimal Docker setup for deploying n8n on Render.

## Render Settings

- Service type: Web Service
- Runtime: Docker
- Dockerfile path: `render/Dockerfile`
- Port: `5678`

## Required Environment Variables

Set these in Render > Service > Environment:

```env
N8N_HOST=YOUR_RENDER_SERVICE.onrender.com
N8N_PORT=5678
N8N_LISTEN_ADDRESS=0.0.0.0
N8N_PROTOCOL=https
WEBHOOK_URL=https://YOUR_RENDER_SERVICE.onrender.com/
N8N_EDITOR_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com/
N8N_SECURE_COOKIE=true
N8N_ENCRYPTION_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
GENERIC_TIMEZONE=Asia/Kolkata
TZ=Asia/Kolkata
DB_TYPE=sqlite
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```

Generate an encryption key locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Persistence

Render Free services use an ephemeral filesystem. For stable n8n data, add a Render persistent disk mounted at:

```text
/home/node/.n8n
```

Without a disk, workflows and credentials can disappear after redeploys/restarts.

## After Deploy

1. Open the Render URL.
2. Create the n8n owner account.
3. Create the OpenRouter credential named `OpenRouter account`.
4. Import `JumpingGoose_TextAgency_n8n_Workflow_RENDER_IMPORT.json`.
5. Re-select `OpenRouter account` on AI HTTP nodes if n8n asks.
6. Activate/publish the workflow.

Webhook:

```text
https://YOUR_RENDER_SERVICE.onrender.com/webhook/jumpinggoose-text-agency
```
