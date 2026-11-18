# Ravi Y.T. — Portfolio

A one-page portfolio built with **Next.js 16** (App Router) and **Tailwind CSS 4**. The look is bright and Japanese-inspired: washi paper, vermilion seals, sakura and seigaiha waves. The site is available in English, Brazilian Portuguese and Spanish.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
npm run lint
```

## Structure

```
src/
  app/                 layout (fonts, metadata), page, globals.css (design tokens, textures, card shapes)
  i18n/                dictionaries.ts (EN / PT-BR / ES copy), LanguageProvider (localStorage-backed)
  data/                works.generated.ts (image sizes), works.ts (titles, Japan collection, hero reel)
  components/
    sections/          Hero, Impact, About, JapanCollection, Works, Motion, Experience, Projects, Toolkit
    canvas/            SakuraCanvas, EnsoCanvas, InkTrail, ToolSphere (Canvas 2D effects)
    Header, Footer, LanguageSwitcher, Flags, Logo, Lightbox, WorkCard, LoopVideo, motion (Reveal/Tilt/CountUp)
public/
  works/               portfolio images (copied from ../docs/projects)
  profile/             portrait photos
  media/               stock textures, images and video; see media/credits.json
```

## Editing content

- **Text** for all three languages is in `src/i18n/dictionaries.ts`. Every language has the same keys.
- **Adding a work:** place the image under `public/works/<category>/`, then add an entry to `src/data/works.generated.ts` with its pixel `w`/`h`. Override its title in `titleOverrides` in `works.ts` if needed.
- **Colours and textures** are tokens in the `@theme` block of `globals.css`.

## Media licensing

All stock media in `public/media` comes from Unsplash, Pexels or Mixkit, under licenses that allow commercial use. Authors and source URLs are listed in `public/media/credits.json`.
