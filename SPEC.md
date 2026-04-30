# Avatar App - SPEC

Application Next.js 15 pour la génération de vidéos LipSync via l'API HeyGen.

## Stack Technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | TailwindCSS 4 |
| Auth | next-auth v5 (beta) |
| Database | SQLite via @libsql/client + drizzle-orm |
| Hash | bcryptjs |
| Runtime | Node.js 20 (Docker) |
| Deployment | Docker / Portainer |

## Structure du Projet

```
AvatarApp/
├── app/
│   ├── (auth)/login/page.tsx          # Page de connexion
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Layout avec sidebar
│   │   ├── dashboard/page.tsx          # Stats + tableau générations
│   │   ├── lip-sync/page.tsx           # LipSync (2 modes)
│   │   └── settings/page.tsx           # Configuration API key
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts # NextAuth handler
│   │   ├── settings/route.ts           # CRUD settings user
│   │   └── heygen/
│   │       ├── upload-audio/route.ts   # Upload audio → HeyGen
│   │       ├── create-talking-photo/route.ts  # Crée avatar depuis image
│   │       ├── generate-video/route.ts # Lance génération vidéo
│   │       ├── video-status/route.ts   # Poll statut vidéo
│   │       ├── avatars/route.ts        # Liste avatars disponibles
│   │       └── test-connection/route.ts # Test clé API
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Redirect → /login
│   └── globals.css                     # Styles globaux + thème
├── components/
│   ├── Sidebar.tsx                     # Navigation latérale
│   ├── DropZone.tsx                    # Drag & drop avec preview
│   ├── GenerateButton.tsx              # Bouton avec loading state
│   └── VideoResult.tsx                 # Player vidéo + actions
├── lib/
│   ├── db.ts                           # Connection SQLite (libsql)
│   ├── schema.ts                       # Schéma Drizzle (users, settings, generations)
│   ├── auth.ts                         # Configuration NextAuth
│   ├── heygen.ts                       # Client API HeyGen
│   └── utils.ts                        # Helpers (UUID, formatage)
├── middleware.ts                        # Protection routes protégées
├── seed.ts                              # Script de seed (user par défaut)
├── Dockerfile                           # Build multi-stage
├── docker-compose.yml                   # Config Portainer
├── next.config.ts                       # output: standalone
├── tailwind.config.ts                   # Thème dark
└── package.json
```

## Base de Données

### Tables

**users**
| Colonne | Type | Description |
|---|---|---|
| id | TEXT (PK) | UUID |
| email | TEXT (UNIQUE) | Email de connexion |
| password | TEXT | Hash bcrypt |
| name | TEXT | Nom affiché |
| created_at | INTEGER | Timestamp création |

**settings**
| Colonne | Type | Description |
|---|---|---|
| id | TEXT (PK) | UUID |
| user_id | TEXT (FK) | Référence users.id |
| heygen_api_key | TEXT | Clé API HeyGen chiffrée |
| updated_at | INTEGER | Timestamp mise à jour |

**generations**
| Colonne | Type | Description |
|---|---|---|
| id | TEXT (PK) | UUID |
| user_id | TEXT (FK) | Référence users.id |
| mode | TEXT | "avatar" ou "upload" |
| avatar_id | TEXT | ID avatar HeyGen (mode avatar) |
| audio_asset_id | TEXT | ID asset audio HeyGen |
| video_id | TEXT | ID vidéo HeyGen |
| video_url | TEXT | URL vidéo finale |
| status | TEXT | pending/processing/completed/failed |
| created_at | INTEGER | Timestamp création |
| completed_at | INTEGER | Timestamp fin |

## Authentification

- **Provider** : Credentials (email/password)
- **Session** : JWT (30 jours)
- **User par défaut** : `admin@example.com` / `admin123`
- **Protection** : middleware redirige `/login` si non authentifié sur `/dashboard/*`, `/lip-sync/*`, `/settings/*`

## API HeyGen

### Upload Audio
```
POST /api/heygen/upload-audio
Body: FormData { audio: File }
→ { asset_id: string }
```

### Create Talking Photo
```
POST /api/heygen/create-talking-photo
Body: FormData { image: File }
→ { talking_photo_id: string }
```

### Generate Video
```
POST /api/heygen/generate-video
Body: { avatarId?: string, talkingPhotoId?: string, audioAssetId: string }
→ { video_id: string }
```

### Video Status
```
GET /api/heygen/video-status?video_id=xxx
→ { status: string, video_url?: string, error?: string }
```

### List Avatars
```
GET /api/heygen/avatars
→ { avatars: [{ avatar_id, name, gender }] }
```

### Test Connection
```
POST /api/heygen/test-connection
Body: { apiKey: string }
→ { success: boolean, error?: string }
```

## Flow LipSync

### Mode Avatar ID
1. User entre un `avatar_id` HeyGen existant
2. Upload fichier audio → `upload.heygen.com/v1/asset`
3. Génération vidéo → `api.heygen.com/v2/video/generate` avec `use_avatar_iv_model: true`
4. Polling toutes les 5s → `api.heygen.com/v1/video_status.get`
5. Affichage résultat avec player inline

### Mode Upload Image
1. User upload une image + fichier audio
2. Upload audio → `upload.heygen.com/v1/asset`
3. Création talking photo → `api.heygen.com/v1/talking_photo/create`
4. Génération vidéo avec `talking_photo_id` + `use_avatar_iv_model: true`
5. Polling toutes les 5s jusqu'à completion
6. Affichage résultat

## Design System

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| `--color-bg` | `#0a0a0a` | Fond principal |
| `--color-surface` | `#141414` | Cards, sidebar |
| `--color-border` | `#262626` | Bordures |
| `--color-accent` | `#00D4FF` | Actions principales |
| `--color-accent-hover` | `#00b8dd` | Hover actions |
| `--color-text` | `#FFFFFF` | Texte principal |
| `--color-muted` | `#737373` | Texte secondaire |

### Typographie
- Font : **Inter** (Google Fonts)

### Composants
- **Sidebar** : 240px fixe, navigation + déconnexion
- **DropZone** : drag & drop + click, états idle/hover/uploading/uploaded, preview image/audio
- **GenerateButton** : loading state avec spinner
- **VideoResult** : player inline + download + copy URL + reset

## Docker

### Build
```dockerfile
Stage 1: deps (node:20-alpine + npm ci)
Stage 2: builder (copy deps + next build)
Stage 3: runner (standalone output + node server.js)
```

### docker-compose.yml
```yaml
services:
  avatar-app:
    build: .
    ports: ["3000:3000"]
    restart: unless-stopped
    volumes: [avatar-data:/app/data]
```

### Variables d'environnement
| Variable | Requis | Description |
|---|---|---|
| `AUTH_SECRET` | Oui | Secret JWT pour next-auth |
| `NEXTAUTH_URL` | Non | URL de l'app (default: http://localhost:3000) |

## Démarrage

### Local
```bash
npm install
npm run seed          # Crée user par défaut
cp .env.example .env  # Configure AUTH_SECRET
npm run dev           # http://localhost:3000
```

### Docker / Portainer
```bash
docker compose up -d --build
```

Stack dans Portainer :
1. Créer un stack depuis le repo GitHub
2. Configurer les variables d'environnement (`AUTH_SECRET`)
3. Déployer

## Credentials par défaut

| Email | Password |
|---|---|
| admin@example.com | admin123 |
