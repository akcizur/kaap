# Structure Map

## 1. Účel

Technická mapa aktuální implementace Dimple / KAAP. Popisuje existující soubory a skutečné datové toky; neplánované komponenty se zde neuvádějí jako hotové.

## 2. Root tree

```text
kaap/
├── .github/workflows/deploy-pages.yml
├── public/
│   ├── .nojekyll
│   └── styles.css
├── src/
│   ├── components/
│   │   ├── PostCard.tsx
│   │   └── PostPage.tsx
│   ├── config/viewModes.ts
│   ├── data/posts.ts
│   ├── hooks/usePreferences.ts
│   ├── motion/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── designRules.md
├── index.html
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

## 3. Ownership

| Soubor | Odpovědnost |
|---|---|
| `index.html` | HTML shell, základní metadata a načtení aplikace |
| `src/main.tsx` | fonty a React bootstrap |
| `src/App.tsx` | kompozice stránky, search, výběr článku a navbar controls |
| `src/components/PostCard.tsx` | prezentace položky v jednom ze čtyř layoutů |
| `src/components/PostPage.tsx` | detail článku |
| `src/config/viewModes.ts` | pořadí, ikony, popisky a CSS třídy layoutů |
| `src/data/posts.ts` | statická data šesti článků a typ Post |
| `src/hooks/usePreferences.ts` | theme a viewMode v React state + localStorage |
| `src/motion/index.ts` | sdílené motion presety, exkluzivní kanály, WAAPI a rušení animací |
| `public/styles.css` | globální CSS, tokeny, komponenty a responsive pravidla |
| `vite.config.ts` | React plugin a GitHub Pages base path |
| `.github/workflows/deploy-pages.yml` | build a deployment na GitHub Pages |

## 4. Dependency flow

```text
index.html
  └── src/main.tsx
       └── src/App.tsx
            ├── src/data/posts.ts
            ├── src/config/viewModes.ts
            ├── src/hooks/usePreferences.ts
            ├── components/PostCard.tsx
            └── components/PostPage.tsx
```

Globální stylesheet `public/styles.css` se načítá z HTML shellu; není importován jako CSS modul v React stromu.

## 5. App state

`App.tsx` vlastní:
- `searchOpen`
- `searchQuery`
- `selectedPostId`

`usePreferences()` vlastní:
- `theme`
- `viewMode`

Odvozené hodnoty:
- `selectedPost` — dohledání postu podle ID
- `filteredPosts` — klientský filtr datasetu

Newsletter nemá stav přihlášení ani submit handler. UI výslovně informuje, že integrace zatím není připojena.

## 6. Preferences a persistence

Storage keys:
- `dimple-theme`
- `dimple-view`

Theme se inicializuje z validní hodnoty localStorage, jinak z `prefers-color-scheme`, s fallbackem na light. View mode se načítá pouze tehdy, pokud odpovídá klíči v `VIEW_MODES`; fallback je list.

Zápis do localStorage probíhá v efektu hooku po změně preferences.

## 7. Post data

Aktuální typ:

```ts
type Post = {
  id: number
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
}
```

Dataset je statický v `src/data/posts.ts` a obsahuje šest položek. Neobsahuje slug, tagy ani plný obsah článku.

## 8. View modes

`src/config/viewModes.ts` definuje pořadí:
1. list
2. grid
3. magazine
4. compact

Konfigurace poskytuje ikonu, label, wrapper class a className karty. `App.tsx` nyní používá `VIEW_MODES[viewMode].containerClass` přímo na wrapperu seznamu; wrapper a prezentační režim karty tak sdílejí stejný zdroj konfigurace.

## 9. Search

Search je synchronní klientský filtr nad:
- title
- excerpt
- category
- date

Query se trimuje a převádí na lowercase. Neprohledává full text článku, protože dataset zatím žádný full text nemá. Česká diakritika zatím není normalizována.

## 10. Routing

Detail používá query parametr:

```text
/kaap/?post=1
```

Při inicializaci aplikace se ID načte z `window.location.search`. Karty jsou běžné anchor odkazy a back link vede na listing. `App.tsx` poslouchá `popstate` a při browser history změně synchronizuje vybrané ID.

Nejde o clean-slug routing ani o staticky generované HTML jednotlivých článků.

## 11. Newsletter

Newsletter provider ani backend nejsou nakonfigurovány. Formulář a simulovaný success stav byly odstraněny. Aktuální sekce pouze transparentně oznamuje, že email subscription není připojeno.

## 12. CSS

Jediný globální stylesheet je `public/styles.css`. Obsahuje:
- light/dark CSS variables,
- base styles,
- header a search panel,
- hero a post listing,
- čtyři layouty,
- newsletter a footer,
- detail článku,
- responsive pravidla.

## 13. Build a deployment

`vite.config.ts` vybírá base path v pořadí:
1. `VITE_BASE_PATH`
2. `GITHUB_ACTIONS` + název repozitáře
3. lokální `/`

GitHub Actions workflow reaguje na push do `main` a ruční spuštění. Používá Node 22, `npm install`, `npm run build`, upload `dist` a deploy GitHub Pages.

## 14. Aktuální limity

- Obsah je statický TypeScript dataset.
- Detail zobrazuje metadata a excerpt, nikoli plný článek.
- Search neprohledává body článku ani tagy.
- Routing používá `?post=id`.
- Newsletter není připojen ke službě.
- CSS zůstává globální.
- Tailwind balíčky jsou v dependencies, ale nejsou aktivovány ve Vite konfiguraci.
- Automatické testy a samostatný typecheck script zatím nejsou součástí package scripts.

## 15. Bezpečná místa pro změny

| Potřeba | Místo |
|---|---|
| přidání článku | `src/data/posts.ts` |
| změna datového modelu | `src/data/posts.ts` + consumers |
| nový layout | `src/config/viewModes.ts`, `PostCard.tsx`, CSS |
| theme token | `public/styles.css` |
| navbar/search | `src/App.tsx` |
| persistent preference | `src/hooks/usePreferences.ts` |
| detail článku | `src/components/PostPage.tsx` |
| base path | `vite.config.ts` |
| deployment | `.github/workflows/deploy-pages.yml` |

## 16. Dokumentační source of truth

- `README.md` — účel, stack a provoz projektu
- `designRules.md` — vizuální pravidla
- `structureMap.md` — skutečná technická struktura a datové toky

## 17. Motion framework

src/motion/index.ts je jediným runtime vlastníkem WAAPI animací.

- MOTION obsahuje route exit/enter a control icon timing.
- motionDirector spravuje exkluzivní route a single-flight control kanál.
- beginRoute() ruší aktivní motion a blokuje další control animace.
- endRoute() uklidí zbylé efekty a uvolní zámek.
- play() vrací cancellable MotionHandle.
- prefersReducedMotion() poskytuje společné rozhodnutí pro okamžitou variantu.

CSS tokeny v public/styles.css odpovídají stejné timing stupnici. Layout switch používá shared-element View Transitions a měřený FLIP fallback; zachovává scroll anchor bez reloadu.