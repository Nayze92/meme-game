# 🎭 Mème Game — Multijoueur

Jeu de mèmes multijoueur en temps réel.

## Stack

- **Frontend**: React + Vite + Fabric.js → Netlify
- **Backend**: Node.js + Express + Socket.io → Railway

## Lancer en local

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Déploiement

### Backend → Railway
1. Push le repo sur GitHub
2. Créer un nouveau projet Railway → déployer depuis GitHub → dossier `backend/`
3. Ajouter la variable d'env: `CLIENT_URL=https://ton-app.netlify.app`

### Frontend → Netlify
1. Créer un nouveau site Netlify → déployer depuis GitHub → dossier `frontend/`
2. Ajouter la variable d'env: `VITE_BACKEND_URL=https://ton-app.railway.app`
3. Build command: `npm run build`, Publish directory: `dist`
