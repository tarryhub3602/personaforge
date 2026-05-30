# PersonaForge

Outil web qui génère **3 personas marketing détaillés** à partir de la description de votre produit, via **OpenAI gpt-5.4-mini**.

## Fonctionnalités

- Formulaire pour décrire votre produit / service
- Génération IA de 3 personas (prénom, âge, métier, frustrations, motivations, objections, citation)
- Premier persona visible gratuitement
- Personas 2 et 3 floutés avec overlay « Débloquer — 4€ »
- Interface sombre, violette et moderne

## Prérequis

- [Node.js](https://nodejs.org/) 18+
- Une clé API [OpenAI](https://platform.openai.com/api-keys)

## Installation

```bash
cd personaforge
npm install
cp .env.example .env.local
```

Éditez `.env.local` et ajoutez votre clé :

```
OPENAI_API_KEY=sk-...
```

## Lancement en local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Scripts

| Commande        | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Serveur de développement |
| `npm run build` | Build de production      |
| `npm run start` | Serveur de production    |
| `npm run lint`  | Vérification ESLint      |

## Structure

```
src/
├── app/
│   ├── api/generate/route.ts   # API OpenAI gpt-5.4-mini
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── PersonaGenerator.tsx
│   └── PersonaCard.tsx
└── types/
    └── persona.ts
```

## Déploiement

Compatible Vercel, Netlify ou tout hébergeur Node.js. Définissez la variable d'environnement `OPENAI_API_KEY` sur la plateforme.
