# 🎓 StudyAI – PWA de Révision Intelligente

Une application web progressive (PWA) complète et clé en main pour aider les étudiants à réviser intelligemment grâce à l'IA.

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| **Planificateur IA** | Génère un calendrier de révision personnalisé basé sur tes examens et disponibilités |
| **Mode Grand Écran** | Résumé structuré, glossaire et concepts clés générés par IA à partir de tes PDFs |
| **Mode Micro-Learning** | Flashcards interactives (flip) + mini-quiz QCM/Vrai-Faux pour sessions courtes |
| **Mode Crash Test** | Examen blanc chronométré avec correction et feedback détaillé par l'IA |
| **Mode Hors-ligne** | Télécharge tes cours dans IndexedDB, révise sans connexion, sync automatique des scores |
| **PWA Installable** | Icônes, manifest, Service Workers — installable sur iOS et Android |

---

## 🛠️ Stack Technique

- **Frontend** : Next.js 14 (App Router) + TypeScript
- **Style** : Tailwind CSS (Mobile-First)
- **Auth & BDD** : Supabase (Row Level Security)
- **Stockage PDFs** : Supabase Storage
- **IA** : Groq API (Llama-3-70b-8192)
- **PWA** : next-pwa (Service Worker + Cache API)
- **Offline** : IndexedDB via `idb`
- **Déploiement** : Vercel (CI/CD auto depuis GitHub)

---

## 🚀 Déploiement en 5 étapes

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Dans **SQL Editor**, colle et exécute le contenu de `supabase/migrations/001_initial_schema.sql`
3. Dans **Storage** → **New bucket** :
   - Nom : `course-pdfs`
   - Public : ✅ oui
   - Ajoute les politiques de sécurité (commentées en bas du fichier SQL)
4. Récupère tes clés dans **Project Settings > API** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Obtenir une clé API Groq

1. Va sur [console.groq.com](https://console.groq.com)
2. **API Keys** → **Create API Key**
3. Copie la clé (`gsk_...`) → `GROQ_API_KEY`

### 3. Cloner et configurer localement

```bash
git clone https://github.com/TON_USERNAME/studyai-pwa.git
cd studyai-pwa

# Copier le template des variables d'environnement
cp .env.local.example .env.local

# Remplir .env.local avec tes vraies valeurs
```

### 4. Lancer en développement

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 5. Déployer sur Vercel

1. Push le repo sur GitHub
2. Va sur [vercel.com](https://vercel.com) → **Import Project** → sélectionne ton repo
3. Dans **Environment Variables**, ajoute les 3 variables suivantes :

| Variable | Description | Où trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de ton projet Supabase | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | Supabase → Project Settings → API |
| `GROQ_API_KEY` | Clé API Groq (Llama-3) | console.groq.com → API Keys |

4. Clique **Deploy** → Vercel build et déploie automatiquement ✅

---

## 📁 Structure du Projet

```
studyai-pwa/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # Icônes PWA (à générer)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (fonts, providers)
│   │   ├── globals.css         # Styles globaux Tailwind
│   │   ├── auth/
│   │   │   ├── login/          # Page de connexion
│   │   │   └── register/       # Page d'inscription
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Accueil dashboard (stats)
│   │   │   ├── courses/        # Liste + détail des cours
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Hub des 3 modes
│   │   │   │       ├── flashcards/     # Micro-Learning
│   │   │   │       └── exam/           # Crash Test
│   │   │   ├── planner/        # Planificateur d'étude
│   │   │   └── offline/        # Cours téléchargés
│   │   └── api/
│   │       ├── courses/        # POST (upload + IA), GET
│   │       │   └── [id]/exam/  # POST (générer), grade/
│   │       └── planner/        # POST (générer planning)
│   ├── components/
│   │   ├── ui/                 # DashboardNav
│   │   ├── revision/           # GrandEcranPanel, FlashcardDeck, QuizPanel, ExamPanel
│   │   ├── planner/            # PlannerForm, PlannerCalendar
│   │   └── pwa/                # DownloadOfflineButton, PWAInstallPrompt
│   ├── lib/
│   │   ├── supabase/           # client.ts, server.ts, middleware.ts
│   │   ├── groq/               # client.ts (toutes les fonctions IA)
│   │   └── db/                 # indexeddb.ts, sync.ts
│   ├── hooks/                  # useAuth, useOnlineStatus, useOfflineCourses…
│   └── types/                  # index.ts (tous les types TypeScript)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local.example          # Template des variables d'environnement
├── next.config.js              # Config Next.js + PWA
├── tailwind.config.ts
├── vercel.json                 # Config déploiement Vercel
└── README.md
```

---

## 🎨 Générer les icônes PWA

Les icônes sont référencées dans `public/manifest.json`. Tu peux les générer depuis ton logo :

```bash
# Avec sharp (npm) – place ton logo dans public/logo.png
npx sharp-cli --input public/logo.png --output public/icons/icon-192x192.png resize 192 192
npx sharp-cli --input public/logo.png --output public/icons/icon-512x512.png resize 512 512
# ... répéter pour toutes les tailles dans manifest.json
```

Ou utilise [realfavicongenerator.net](https://realfavicongenerator.net) pour générer toutes les tailles automatiquement.

---

## 🔐 Variables d'Environnement Vercel

Configure ces variables dans **Vercel > Settings > Environment Variables** :

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGciO...
GROQ_API_KEY                    = gsk_live_...
```

> ⚠️ Ne préfixe **jamais** `GROQ_API_KEY` avec `NEXT_PUBLIC_` — elle ne doit pas être exposée côté client.

---

## 🧠 Architecture IA (Groq)

Tous les appels IA sont centralisés dans `src/lib/groq/client.ts` :

| Fonction | Description | Modèle |
|---|---|---|
| `generateCourseAnalysis()` | Résumé HTML + glossaire + concepts | llama3-70b-8192 |
| `generateFlashcards()` | 20 flashcards recto/verso | llama3-70b-8192 |
| `generateQuiz()` | 10 questions QCM/Vrai-Faux | llama3-70b-8192 |
| `generateExam()` | Examen blanc complet chronométré | llama3-70b-8192 |
| `gradeExam()` | Correction + feedback personnalisé | llama3-70b-8192 |
| `generateStudyPlan()` | Calendrier de révision sur N semaines | llama3-70b-8192 |

---

## 📱 Capacités PWA

- **Manifest** : `public/manifest.json` (name, icons, theme_color, shortcuts)
- **Service Worker** : généré par `next-pwa` au build
- **Cache API** : fichiers statiques + PDFs Supabase Storage
- **IndexedDB** : cours hors-ligne (PDF Blob + JSON), scores en attente
- **Background Sync** : les scores hors-ligne sont synchronisés à la reconnexion
- **Install Prompt** : banner natif sur Android + iOS (via `beforeinstallprompt`)

---

## 📊 Schéma Base de Données

```
profiles        → id, email, full_name, avatar_url
courses         → id, user_id, title, subject, pdf_url, summary, glossary, flashcards, quiz_questions
exams           → id, user_id, subject, exam_date
study_plans     → id, user_id, plan_data (JSONB), weeks_count, daily_hours, rest_days
quiz_scores     → id, user_id, course_id, mode, score, total, feedback, synced
```

Toutes les tables ont **Row Level Security (RLS)** activé — les utilisateurs ne voient que leurs propres données.

---

## 🤝 Contribution

1. Fork le repo
2. Crée ta branche : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m 'feat: ajouter ma feature'`
4. Push : `git push origin feature/ma-feature`
5. Ouvre une Pull Request

---

## 📄 Licence

CC 4.0
