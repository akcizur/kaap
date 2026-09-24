# Dimple / KAAP

> Malé statické publikační rozhraní postavené na Vite + React + TypeScript, navržené pro minimalistický osobní publishing frontend a GitHub Pages.

**Repository:** akcizur/kaap  
**UI brand:** Dimple  
**package.json name:** dimple  
**GitHub Pages:** https://akcizur.github.io/kaap/  
**Website reference:** https://dimple.blog  
**Default branch:** main  
**Documented revision:** 91fc05c7682e574953f87a507ce9e33601679f21

---

## 1. Co projekt je

KAAP je malá klientská webová aplikace pro publikační rozhraní Dimple. Vše běží v prohlížeči a produkční výstup je statický.

Projekt aktuálně nemá:

- backend,
- databázi,
- API,
- CMS,
- server-side rendering,
- skutečnou newsletter integraci,
- Markdown/MDX renderer.

Obsah článků je přímo v TypeScript datech.

Hlavní technické části:

- Vite,
- React 19,
- TypeScript strict,
- Lucide React,
- Google Sans,
- MuseoModerno,
- ruční CSS,
- GitHub Actions,
- GitHub Pages.

---

## 2. Názvosloví

| Vrstva | Hodnota |
|---|---|
| repository | akcizur/kaap |
| package name | dimple |
| application brand | Dimple |
| website | dimple.blog |
| Pages site | /kaap/ |

Repository name a UI identity nejsou stejné. To je současný záměrný stav.

---

## 3. Stav projektu

Aktuální HEAD je commit:

91fc05c7682e574953f87a507ce9e33601679f21

Commit message:

Refine subnavbar as lightweight navbar

Tato dokumentace popisuje stav k tomuto revision. Při změnách architektury je nutné README znovu zkontrolovat.

---

## 4. Technologický stack

### Runtime

- React ^19.0.0
- React DOM ^19.0.0
- TypeScript ^5.7.0

### Build

- Vite ^8.0.5
- @vitejs/plugin-react ^6.0.0

### UI

- lucide-react ^1.47.0
- @fontsource/google-sans ^5.3.1
- @fontsource/patrick-hand ^5.3.0

### Development

- @types/node ^22.0.0
- @types/react ^19.0.0
- @types/react-dom ^19.0.0
- tailwindcss ^4.0.0
- @tailwindcss/vite ^4.0.0
- oxfmt ^0.2.0

### Důležitá poznámka k Tailwindu

Tailwind je v package.json, ale aktuální vite.config.ts nepřidává @tailwindcss/vite plugin. Současný vizuál je proto realizován ručním globálním CSS v public/styles.css.

**Aktuální styling authority = public/styles.css.**

---

## 5. Architektonický princip

Projekt je static-first.

Mentální model:

    index.html
        ↓
    src/main.tsx
        ↓
    src/App.tsx
        ├── posts
        ├── preferences
        ├── search
        ├── URL state
        ├── navbar state
        ├── PostCard
        ├── PostPage
        └── SettingsModal
                ↓
        public/styles.css

App.tsx je hlavní orchestrátor. Prezentační komponenty jsou malé a přijímají data přes props.

---

## 6. Root soubory

### index.html

HTML shell aplikace. Obsahuje:

- viewport,
- theme-color,
- description,
- title,
- styles.css,
- root #root,
- vstupní React modul.

### package.json

Definuje:

- package name,
- scripts,
- runtime dependencies,
- development dependencies.

### vite.config.ts

Definuje:

- React plugin,
- GitHub Pages base path,
- VITE_BASE_PATH override,
- vypnutí sourcemap pro build.

### tsconfig.json

Používá:

- ES2020 target,
- moduleResolution Bundler,
- JSX react-jsx,
- strict true,
- noEmit,
- alias @/* → ./src/*.

### .gitignore

Ignoruje build artefakty, node_modules, lokální environment files, Vite temporaries, logy a další vývojové soubory.

---

## 7. src/main.tsx

Bootstrap vrstva.

Jejím úkolem je pouze namountovat React aplikaci do #root.

Nemá obsahovat:

- data model,
- search logic,
- routing,
- persistentní preference,
- UI orchestrace.

---

## 8. src/App.tsx

App.tsx je centrální state + composition layer.

Vlastní zejména:

### State

- email,
- subscribed,
- language,
- scale,
- settingsOpen,
- searchOpen,
- searchQuery,
- hoveredNavItem,
- selectedPostId.

### Derived state

- selectedPost,
- filteredPosts,
- subbarItem,
- showSubbar.

### Effects

- synchronizace document lang,
- popstate listener,
- Escape listener pro settings,
- focus search inputu.

### Event behavior

- otevření search,
- otevření settings,
- subscribe,
- změna preference,
- práce s nav hover/focus.

---

## 9. Data: src/data/posts.ts

Aktuální model:

    type Post = {
      id: number
      title: string
      excerpt: string
      category: string
      date: string
      readTime: string
    }

Pole znamenají:

| Pole | Účel |
|---|---|
| id | identifikace postu |
| title | title |
| excerpt | perex |
| category | tematická skupina |
| date | zobrazované datum |
| readTime | délka čtení |

Aktuálně je zde 6 postů.

Kategorie:

- Craft,
- Strategy,
- Writing,
- Ideas,
- Process.

### Content limit

Model neobsahuje body nebo rich content. Detail postu proto zobrazuje pouze metadata + excerpt.

---

## 10. PostCard.tsx

PostCard je hlavní renderer seznamu postů.

Je řízen propem mode.

### List

- title,
- excerpt,
- metadata,
- category,
- date,
- read time.

### Grid

- category,
- title,
- excerpt,
- date,
- card surface.

### Magazine

- první post = featured,
- ostatní posty = jednodušší editorial rows.

### Compact

- category,
- title,
- date,
- truncation.

Každý post je anchor s query parametrem ?post=<id>.

---

## 11. View mode configuration

Soubor:

src/config/viewModes.ts

Definuje:

- ViewMode union,
- VIEW_MODE_ORDER,
- VIEW_MODES,
- label,
- icon,
- class metadata.

Aktuální pořadí:

1. List
2. Grid
3. Magazine
4. Compact

PostCard potom podle mode zvolí konkrétní markup.

---

## 12. PostPage.tsx

Post detail je záměrně malý.

Obsah:

1. Back to posts,
2. category,
3. date,
4. title,
5. read time,
6. divider,
7. excerpt.

Není zde:

- markdown parsing,
- MDX,
- full article body,
- comments,
- author system,
- related posts.

---

## 13. SettingsModal.tsx

Settings modal ovládá:

### View Mode

List / Grid / Magazine / Compact

### Language

EN / CZ

### Theme

Light / Dark

### UI Scale

90 / 100 / 110

Modal se zavírá přes:

- X,
- klik na backdrop,
- Escape,
- Done.

Aktivní volba používá is-active + check ikonku.

---

## 14. Preferences

Hook:

src/hooks/usePreferences.ts

Aktuálně persistuje pouze:

- theme,
- viewMode.

Storage keys:

    dimple-theme
    dimple-view

Theme initialization:

1. localStorage,
2. prefers-color-scheme,
3. light fallback.

View mode initialization:

1. validní localStorage value,
2. list fallback.

Language a scale se dnes nepersistují.

---

## 15. Theme

Theme je řízena atributem data-theme.

Light a dark používají stejné CSS classes, mění se tokeny.

### Light základ

- bg #fff
- surface #fafafa
- surface-strong #f5f5f5
- text #171717
- text-muted #525252
- text-soft #737373
- text-faint #a3a3a3
- border #ebebeb
- accent #000

### Dark základ

- bg #0a0a0a
- surface #0d0d0d
- surface-strong #141414
- text #f5f5f5
- text-muted #a3a3a3
- text-soft #737373
- text-faint #525252
- border #1f1f1f
- accent #fff

Design je záměrně monochromatický.

---

## 16. Typografie

### Google Sans

Primary font pro:

- brand,
- headings,
- body,
- navigation,
- controls,
- forms.

### MuseoModerno

Secondary font pro:

- data,
- category,
- kickers,
- metadata,
- editorial notes.

MuseoModerno není alternativní body font. Je to metadata/signature layer.

---

## 17. Layout

Hlavní max-width:

768px

Používají jej:

- header-inner,
- main-content,
- footer-inner,
- nav-subbar-inner,
- search-row.

Design je proto úzký editorial column, ne široký dashboard.

### Desktop reference

- header 56px,
- horizontal padding 24px,
- main vertical padding 48px,
- hero margin-bottom 40px,
- post gap 36px,
- newsletter margin-top 64px.

### Mobile ≤640px

- horizontal padding 16px,
- controls 32 × 32px,
- main top 36px,
- main bottom 44px.

---

## 18. Contextual navbar

Aktuální hlavička má:

### Main navbar

- Dimple brand,
- settings,
- search,
- GitHub,
- website,
- mail.

### Contextual subbar

Obsah se mění podle hoveredNavItem.

Možné položky:

- settings,
- search,
- github,
- website,
- mail.

Settings subbar rychle přepíná:

- view mode,
- theme,
- language,
- scale,
- More.

Search subbar obsahuje search input.

External link subbary zobrazují kontext a link.

---

## 19. Search

Search je čistě klientský.

Query se:

1. trim(),
2. převede lowercase,
3. porovnává přes includes().

Prohledávají se:

- title,
- excerpt,
- category,
- date.

filteredPosts je memoized.

Při nulovém výsledku se zobrazí empty-search state.

---

## 20. Routing

Projekt nepoužívá React Router.

Používá query-param:

    /kaap/?post=1

Resolve:

    URLSearchParams
      ↓
    post
      ↓
    Number
      ↓
    selectedPostId
      ↓
    posts.find()

Když se post najde, renderuje se PostPage. Jinak listing.

App poslouchá popstate pro synchronizaci browser history.

Pro současný jeden detail route je to dostatečné. Při větším route systému je lepší zavést explicitní routing layer.

---

## 21. Newsletter

Newsletter je front-end demonstrace.

Flow:

    email
      ↓
    native email validation
      ↓
    submit
      ↓
    setSubscribed(true)
      ↓
    success UI

Neodesílá se žádný request.

Neexistuje:

- mailing provider,
- API,
- subscriber database,
- persistentní subscription.

---

## 22. Accessibility

Aktuálně jsou použity:

- aria-label,
- aria-expanded,
- aria-controls,
- aria-pressed,
- role dialog,
- aria-modal,
- focus-visible,
- Escape,
- semantic header/nav/main/article/footer.

### Co ještě není kompletní

- focus trap v modalu,
- automatický focus do modalu,
- návrat focusu na původní trigger,
- skutečné i18n,
- full article semantics.

---

## 23. CSS architecture

Hlavní stylesheet:

public/styles.css

Přibližná struktura:

1. root tokens,
2. dark theme,
3. global base,
4. header,
5. main content,
6. posts,
7. view modes,
8. newsletter,
9. footer,
10. modal,
11. search,
12. utilities,
13. post detail,
14. responsive,
15. contextual subbar.

CSS je globální.

Nová třída musí být dostatečně specifická, aby náhodou nezasahovala jiné části.

---

## 24. UI scale

Aplikace podporuje:

- 90%,
- 100%,
- 110%.

Aktuální implementace používá CSS zoom na celém .app subtree.

Nové komponenty musí fungovat při všech třech hodnotách.

Scale se dnes nepersistuje.

---

## 25. Responsive

Breakpoints:

- 980px,
- 640px.

### ≤980px

Header actions mohou horizontálně scrollovat.

### ≤640px

- menší header,
- menší controls,
- menší main padding,
- zjednodušený subbar,
- helper texty mohou zmizet,
- newsletter se zmenší.

---

## 26. GitHub Pages

Workflow:

.github/workflows/deploy-pages.yml

Spouštění:

- push na main,
- workflow_dispatch.

Build:

    checkout
      ↓
    Node 22
      ↓
    npm install
      ↓
    npm run build
      ↓
    configure-pages
      ↓
    upload dist

Deploy:

    actions/deploy-pages@v4

Permissions:

- contents read,
- pages write,
- id-token write.

---

## 27. Vite base path

vite.config.ts používá:

- VITE_BASE_PATH pokud je nastaven,
- jinak GitHub Actions + název repository,
- lokálně /.

Pro repository akcizur/kaap tak GitHub Pages build míří na:

/kaap/

To je důležitá část deployment konfigurace.

---

## 28. .nojekyll

public/.nojekyll je prázdný marker.

Vite jej kopíruje do dist/.nojekyll.

---

## 29. Development

Instalace:

    pnpm install

nebo:

    npm install

Development:

    pnpm dev

Build:

    pnpm build

Preview:

    pnpm preview

Format:

    npm run format

CI aktuálně používá npm install.

---

## 30. Package manager

Repozitář nemá lockfile v aktuální stromové mapě a package.json nepřipíná packageManager field.

Proto:

- lokálně lze použít npm nebo pnpm,
- CI používá npm,
- budoucí lockfile změna musí jít společně s úpravou CI.

---

## 31. Kam sahat při změnách

| Potřeba | Místo |
|---|---|
| nový post | src/data/posts.ts |
| změna Post modelu | src/data/posts.ts + consumers |
| nový view mode | viewModes.ts + PostCard.tsx + CSS |
| theme token | public/styles.css |
| navbar action | App.tsx |
| settings option | SettingsModal.tsx + App.tsx |
| persistent preference | usePreferences.ts |
| detail postu | PostPage.tsx |
| build/base path | vite.config.ts |
| deployment | .github/workflows/deploy-pages.yml |
| page metadata | index.html |

---

## 32. Aktuální limity

### Content

Statický dataset.

### Detail

Excerpt bez body.

### Search

Substring filter.

### Newsletter

Lokální success state.

### Language

State + document lang, nikoli plná lokalizace.

### Preferences

Persistentní pouze theme a viewMode.

### Routing

Query-param post detail.

### Styling

Globální CSS.

### Tailwind

Instalovaný, ale aktuálně neaktivní jako styling engine.

---

## 33. Co zachovat

Bez vědomého redesignu zachovej:

- 768px content column,
- monochromatickou paletu,
- Google Sans + MuseoModerno,
- 56px header,
- contextual subbar,
- malé ikony,
- tenké borders,
- minimum shadows,
- editorial whitespace,
- static-first deployment.

---

## 34. Growth path

Při růstu lze přidat:

### Content layer

Markdown, MDX, JSON nebo GitHub-backed content.

### Rich Post

- slug,
- body,
- tags,
- author,
- publishedAt,
- updatedAt,
- canonical URL,
- image,
- related posts.

### Search

Build-time nebo indexed client search.

### Localization

Centrální translation source.

### Routing

Explicitní routing layer.

Důležité: tyto věci nejsou součástí současné implementace.

---

## 35. Change checklist

    [ ] install
    [ ] build
    [ ] desktop
    [ ] mobile
    [ ] light
    [ ] dark
    [ ] List
    [ ] Grid
    [ ] Magazine
    [ ] Compact
    [ ] search
    [ ] ?post=N
    [ ] Back to posts
    [ ] Settings
    [ ] Escape
    [ ] keyboard focus
    [ ] 90%
    [ ] 100%
    [ ] 110%
    [ ] GitHub Pages path

---

## 36. Dokumentační sada

- README.md = co projekt je a jak funguje
- designRules.md = jak má projekt vypadat
- structureMap.md = kde co žije a jak data tečou

Tyto tři soubory tvoří dokumentační source of truth projektu.

---

## 37. Repository

https://github.com/akcizur/kaap
