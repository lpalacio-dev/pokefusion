# ⚡ PokéFusion

App Angular 21 que fusiona 3 Pokémon para crear uno nuevo con nombre, tipos, stats y movimientos únicos. Proyecto desarrollado como reto técnico para Enacment.

**Demo:** _[https://pokefusion-1b499.firebaseapp.com/]_
**Repo:** _[https://github.com/lpalacio-dev/pokefusion]_

---

## Índice

1. [Reto elegido y alcance](#1-reto-elegido-y-alcance)
2. [Instalación y ejecución](#2-instalación-y-ejecución)
3. [Despliegue](#3-despliegue)
4. [Arquitectura y dependencias](#4-arquitectura-y-dependencias)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Estado y navegación](#6-estado-y-navegación)
7. [Decisiones técnicas](#7-decisiones-técnicas)
8. [Escalabilidad y mantenimiento](#8-escalabilidad-y-mantenimiento)
9. [Seguridad y validaciones](#9-seguridad-y-validaciones)
10. [Rendimiento](#10-rendimiento)
11. [Accesibilidad](#11-accesibilidad)
12. [Uso de IA](#12-uso-de-ia)
13. [Limitaciones y siguientes pasos](#13-limitaciones-y-siguientes-pasos)

---

## 1. Reto elegido y alcance

**Mini-proyecto:** PokéFusion (PokeAPI)

**Objetivo:** Fusionar 3 Pokémon para crear uno nuevo con nombre, tipos, stats y 1–2 movimientos derivados de los padres.

**Funcionalidades implementadas:**
- Búsqueda de Pokémon con autocomplete y debounce (300ms)
- Botón "Aleatorizar" que selecciona 3 Pokémon al azar y fusiona automáticamente
- Botón "Re-fusionar" que genera una nueva combinación con los mismos padres (moves y stats varían)
- Tarjeta de resultado con sprites, tipos con color, barras de stats y movimientos
- Guardado de fusiones favoritas en `localStorage`
- Vista de favoritos con opción de eliminar (modal de confirmación)
- Estados de carga, vacío y error en todos los flujos

**Toque propio:** Botón "Re-fusionar" — cada llamada produce stats con variación aleatoria de ±15% y moves distintos, haciendo cada fusión única incluso con los mismos padres.

**Supuestos:**
- Sin autenticación — los favoritos son locales al dispositivo/navegador.
- Se usan solo los primeros 2 moves que devuelve PokeAPI por Pokémon.
- El rango de Pokémon disponibles es Gen 1–9 (IDs 1–1025).
- La estimación calórica no aplica a este mini-proyecto.

---

## 2. Instalación y ejecución

**Requisitos:**
- Node.js LTS (22.x recomendado)
- Angular CLI v21

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/pokefusion.git
cd pokefusion

# Instalar dependencias
npm install

# Levantar servidor de desarrollo
ng serve

# Abrir en el navegador
http://localhost:4200
```

> No se requiere ningún archivo `.env` ni credenciales externas. La app solo consume la API pública de PokeAPI (sin API key) y persiste en `localStorage`.

---

## 3. Despliegue

**Requisitos:**
- Firebase CLI instalado: `npm install -g firebase-tools`
- Haber corrido `firebase login` y tener acceso al proyecto

```bash
# Build de producción
ng build

# Deploy a Firebase Hosting
firebase deploy --only hosting
```

El archivo `firebase.json` está configurado con rewrite `** → /index.html` para el correcto funcionamiento como SPA.

---

## 4. Arquitectura y dependencias

### Estructura de carpetas

```
src/app/
├── core/
│   ├── models/               # Interfaces de dominio (Pokemon, Fusion, PokemonStat)
│   └── services/
│       ├── poke-api.service.ts       # HTTP a PokeAPI, búsqueda y aleatorización
│       ├── fusion-logic.service.ts   # Algoritmo puro de fusión (sin HTTP, sin storage)
│       ├── local-storage.service.ts  # Persistencia de favoritos en localStorage
│       └── type-colors.ts            # Mapa tipo Pokémon → clase DaisyUI badge
│
├── features/
│   ├── fusion/               # Feature principal (lazy-loaded)
│   │   ├── fusion.component.ts       # Smart component orquestador
│   │   └── components/
│   │       ├── pokemon-search/       # Autocomplete con debounce
│   │       ├── fusion-card/          # Tarjeta de resultado
│   │       └── fusion-stats/         # Barras de stats
│   └── favorites/            # Feature favoritos (lazy-loaded)
│       └── favorites.component.ts
│
└── shared/
    ├── components/
    │   ├── loading-spinner/
    │   ├── empty-state/
    │   └── error-banner/
    └── pipes/
        └── capitalize.pipe.ts
```

### Rutas

| Ruta | Componente | Lazy |
|---|---|---|
| `/` | Redirect → `/fusion` | — |
| `/fusion` | FusionComponent | ✅ |
| `/favorites` | FavoritesComponent | ✅ |
| `/**` | Redirect → `/fusion` | — |

### Dependencias principales

| Paquete | Versión | Uso |
|---|---|---|
| `@angular/core` | 21.x | Framework principal |
| `tailwindcss` | 3.x | Utilidades CSS |
| `daisyui` | 4.x | Componentes UI (tema synthwave) |
| `rxjs` | 7.x | Reactividad en servicios HTTP |

> **Nota:** `@angular/fire` y `firebase` fueron instalados pero **no se usan** en la versión final (ver sección de decisiones técnicas). Pueden removerse con `npm uninstall @angular/fire firebase`.

---

## 5. Modelo de datos

### Interfaces TypeScript

```typescript
interface PokemonStat {
  name: string;   // 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'
  base: number;   // 1–255
}

interface Pokemon {
  id: number;
  name: string;
  types: string[];       // máx 2
  stats: PokemonStat[];  // exactamente 6
  moves: string[];       // primeros 2 de PokeAPI
  spriteUrl: string;     // official artwork con fallback a sprite frontal
}

interface Fusion {
  id?: string;           // asignado por crypto.randomUUID() al guardar
  name: string;          // generado por algoritmo de sílabas
  types: string[];       // máx 2, derivados de los 3 padres
  stats: PokemonStat[];  // promedio ± variación aleatoria ±15%
  moves: string[];       // exactamente 2, sin duplicados
  parents: string[];     // exactamente 3 nombres
  spriteUrls: string[];  // exactamente 3 URLs
  createdAt: Date | string;
}
```

### Persistencia en localStorage

```
Key: "pokefusion_favorites"
Value: JSON.stringify(Fusion[])  // array ordenado, más reciente primero
```

Las fusiones se almacenan como array serializado. El `LocalStorageService` usa un `BehaviorSubject` interno para que los componentes reciban actualizaciones reactivas mediante `Observable`, igual que lo haría Firestore en tiempo real.

### Nota sobre Firestore (no implementado en producción)

Se preparó el archivo `firestore.rules` con validaciones de estructura por si se migra en el futuro. Las reglas validan tipos de campo, tamaños de array y ausencia de campos extra para prevenir inyección de datos.

---

## 6. Estado y navegación

### Estrategia de estado

Se usa **Angular Signals** para todo el estado local de los componentes. No se implementó una solución de estado global (NgRx, Akita) dado el alcance del reto.

```
FusionComponent
  ├── selectedPokemons = signal<[Pokemon|null, Pokemon|null, Pokemon|null]>
  ├── fusionResult     = signal<Fusion | null>
  ├── loadingState     = signal<'idle'|'loading'|'success'|'error'>
  ├── saveState        = signal<'idle'|'saving'|'saved'|'error'>
  ├── isRandomizing    = signal<boolean>
  └── canFuse          = computed(() => todos los slots !== null)

FavoritesComponent
  ├── favorites    = signal<Fusion[]>
  ├── loadingState = signal<'loading'|'success'|'error'>
  ├── pendingDelete = signal<Fusion | null>
  └── isDeleting   = signal<boolean>
```

### Lazy loading

Ambas features (`/fusion` y `/favorites`) se cargan con `loadComponent` en las rutas, lo que genera chunks separados en el build. El chunk de `/favorites` solo se descarga cuando el usuario navega a esa ruta por primera vez.

### Navegación reactiva

`routerLinkActive` en el navbar aplica la clase `btn-active` automáticamente según la ruta activa. El `title` de cada ruta actualiza el `<title>` del documento sin necesidad del servicio `Title`.

---

## 7. Decisiones técnicas

**Angular Signals en lugar de RxJS para estado local**
Los Signals son la API recomendada en Angular 17+ para reactividad en componentes. Son más simples de leer, no requieren `async pipe` ni `subscribe` manual, y el compilador puede optimizar el change detection. RxJS se reservó para los flujos HTTP donde `switchMap`, `debounceTime` y `forkJoin` son insustituibles.

**`localStorage` en lugar de Firestore**
La versión más reciente de `@angular/fire` (v20) no es compatible con Angular 21 al momento del desarrollo. Intentar forzar la instalación con `--legacy-peer-deps` causó errores de SDK en runtime relacionados con el injection context de Angular. Se decidió migrar a `localStorage` para entregar una app funcional y estable dentro del tiempo del reto. La interfaz del servicio (`getFavorites`, `saveFusion`, `deleteFavorite`) se mantuvo idéntica para facilitar la migración futura.

**`FusionLogicService` como servicio puro**
Separar el algoritmo de fusión de los servicios HTTP y de persistencia permite testarlo de forma unitaria sin mocks. Recibe exactamente `[Pokemon, Pokemon, Pokemon]` como tupla TypeScript, lo que garantiza en tiempo de compilación que siempre lleguen 3 elementos.

**`mousedown` en lugar de `click` en el autocomplete**
El evento `blur` del input se dispara antes que `click` en las opciones del dropdown, lo que cerraría la lista antes de registrar la selección. `mousedown` ocurre antes del `blur`, resolviendo esta condición de carrera sin necesidad de `preventDefault` ni timeouts largos.

**Debounce en búsqueda + filtro local**
PokeAPI no expone un endpoint de búsqueda parcial. La estrategia elegida carga los primeros 200 nombres en un solo request y filtra localmente, evitando N llamadas HTTP mientras el usuario escribe. El `debounceTime(300)` + `distinctUntilChanged()` + `switchMap` aseguran que solo se haga el fetch de detalle cuando el query se estabiliza.

---

## 8. Escalabilidad y mantenimiento

**Migración de localStorage a Firestore**
Dado que `LocalStorageService` expone la misma interfaz que el `FirestoreService` original, migrar es reemplazar la implementación sin tocar los componentes. Solo requiere actualizar el archivo del servicio y agregar los providers de Firebase en `app.config.ts` cuando `@angular/fire` soporte Angular 21.

**Agregar autenticación**
Con Firestore se podría agregar `Auth` de Firebase para que cada usuario tenga su propia colección `/users/{uid}/fusions`. El `FirestoreService` recibiría el `uid` del usuario autenticado para construir la ruta de la colección.

**Más algoritmos de fusión**
`FusionLogicService` es el único archivo a modificar para cambiar las reglas de naming, ponderación de stats o selección de moves. Está completamente desacoplado de la UI y de la persistencia.

**Separación de capas**
`core/` contiene toda la lógica de negocio y acceso a datos. `features/` contiene solo componentes de presentación y orquestación. `shared/` contiene componentes reutilizables sin lógica de negocio. Esta separación permite escalar cada capa de forma independiente.

**Paginación de favoritos**
Con `localStorage` no hay paginación — se cargan todos los favoritos. Al migrar a Firestore se puede agregar `limit(20)` y `startAfter(lastDoc)` al query sin cambiar la interfaz del servicio.

---

## 9. Seguridad y validaciones

**Sin credenciales expuestas**
La app no consume ninguna API que requiera API key. PokeAPI es completamente pública. No existe archivo `.env` con secretos en el repositorio.

**`localStorage` y datos sensibles**
Los datos guardados (nombres de fusiones, stats, sprites URLs) son completamente públicos y no contienen información personal. No se almacena ningún dato de usuario.

**`firestore.rules` (preparado para migración futura)**
Se incluye el archivo `firestore.rules` con validaciones de estructura que se activarían al migrar a Firestore:
- `hasAll` + `hasOnly` para verificar que el documento tiene exactamente los campos esperados
- Validación de tipos (`string`, `list`, `timestamp`) por campo
- Validación de tamaños fijos en arrays (3 padres, 6 stats, 2 moves)
- `allow update: if false` — las fusiones son inmutables una vez guardadas

**Inputs y XSS**
Los datos de PokeAPI se muestran interpolados en templates Angular (`{{ }}`), que escapan HTML automáticamente. No se usa `innerHTML` en ningún componente.

**Dependencias**
No se usan librerías de pago ni sin licencia open source. Se evitaron versiones con vulnerabilidades conocidas verificando con `npm audit` post-instalación.

---

## 10. Rendimiento

**Debounce en búsqueda (300ms)**
Evita llamadas HTTP en cada keystroke. Solo se hace el fetch de detalle cuando el query se estabiliza por 300ms. `switchMap` cancela el request previo si llega uno nuevo antes de que resuelva.

**`forkJoin` para requests paralelos**
`getRandomPokemons(3)` hace las 3 llamadas a PokeAPI en paralelo, no secuencialmente. El tiempo de respuesta es el del request más lento, no la suma de los tres.

**Sprites con `loading="lazy"`**
Los sprites en `FusionCardComponent` usan `loading="lazy"` para diferir la carga de imágenes fuera del viewport.

**Artwork oficial con fallback**
Se prioriza el sprite de alta resolución (`official-artwork`) con doble fallback (sprite frontal → placeholder), sin afectar el tiempo de carga inicial.

**Lazy loading de features**
Los chunks de `/fusion` y `/favorites` se cargan bajo demanda. El bundle inicial solo contiene el shell (`AppComponent` + router).

**`track` en `@for`**
Todos los bucles `@for` usan expresiones de track correctas (`track $index` para primitivos que pueden repetirse, `track fusion.id` para objetos con identificador único) para evitar re-creación innecesaria de nodos DOM.

---

## 11. Accesibilidad

- Todos los `<img>` de sprites tienen `alt` descriptivo (`"Sprite de Charizard"`)
- Todos los inputs tienen `aria-label` y `id` asociado a su `<label>`
- El autocomplete implementa el patrón ARIA combobox: `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`
- Las opciones del dropdown tienen `role="option"` y `aria-selected`
- Navegación completa por teclado en el autocomplete: `ArrowUp`, `ArrowDown`, `Enter`, `Escape`
- Las barras de progreso de stats tienen `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- El spinner de carga tiene `role="status"` y `aria-live="polite"`
- El modal de confirmación tiene `role="alertdialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`
- Foco visible habilitado (no se removió el outline por defecto de DaisyUI)
- Tema synthwave verificado con contraste suficiente para texto principal sobre fondos base

---

## 12. Uso de IA

- **Scaffolding y estructura inicial:** Se usó IA para generar la estructura de carpetas, los modelos TypeScript (`Pokemon`, `Fusion`, `PokemonStat`), el skeleton de los servicios y la configuración de `tsconfig.json` con path aliases. Esto aceleró la fase de setup de ~2h a ~20min, permitiendo enfocar el tiempo en la lógica de negocio y la UX.

- **Algoritmo de fusión:** Se le pidió a la IA una propuesta para el naming por sílabas y la derivación de tipos por frecuencia. La lógica de sílabas se aceptó con ajustes: se agregó el manejo de nombres con guión (`mr-mime`) y el fallback para nombres de una sola sílaba (`mew`, `ditto`). La variación aleatoria de ±15% en stats fue una sugerencia propia no contemplada en el plan original.

- **Sugerencias aceptadas vs. reescritas:** Se aceptaron directamente la estructura de `forkJoin` para requests paralelos, el uso de `mousedown` sobre `click` en el autocomplete y la estrategia de `BehaviorSubject` en `LocalStorageService`. Se reescribió manualmente el template de `FusionCardComponent` para ajustar la jerarquía visual y el sistema de colores por tipo, ya que la propuesta inicial era demasiado genérica.

- **Riesgos detectados y mitigación:** La búsqueda local de 200 Pokémon podría ser lenta en conexiones lentas — se mitigó con `debounceTime` y limitando los resultados del dropdown a 10. El algoritmo de naming puede generar nombres sin sentido en Pokémon con nombres muy cortos — se añadió un fallback de longitud mínima y un límite de 12 caracteres. Los moves duplicados causaron errores `NG0955` en Angular 21 — se corrigió filtrando candidatos antes de la selección aleatoria.

- **Problema crítico no anticipado:** `@angular/fire` v20 no es compatible con Angular 21. La instalación forzada con `--legacy-peer-deps` generó el warning `Calling Firebase APIs outside of an Injection context` y errores de red bloqueados por ad-blockers. Se decidió migrar a `localStorage` para garantizar entrega funcional. La interfaz del servicio se diseñó para que la migración futura a Firestore sea un cambio de implementación, no de contrato.

- **Prompts utilizados:** El enfoque fue conversacional e iterativo: primero se pidió la planificación completa antes de escribir código, luego se solicitó fase por fase con contexto acumulado. Los prompts más efectivos fueron los que incluían el stack exacto (`Angular 21`, `Signals`, `DaisyUI synthwave`) y el output esperado (`"solo el servicio, sin tocar los componentes"`). Se evitó pegar logs completos — solo se compartieron los mensajes de error relevantes.

- **Lecciones aprendidas:** Verificar compatibilidad de versiones de dependencias críticas antes de comenzar el desarrollo es el paso más importante y el más fácil de omitir bajo presión de tiempo. La IA acelera significativamente el scaffold y la resolución de errores conocidos, pero el criterio de qué aceptar, qué ajustar y qué descartar requiere revisión humana en cada paso.

- **Siguientes mejoras con IA:** Usar IA para generar los unit tests de `FusionLogicService` (es un servicio puro, ideal para testing), generar descripciones en lenguaje natural de cada fusión ("Esta fusión combina la velocidad de X con la defensa de Y..."), y explorar la generación de un sprite combinado con canvas.

---

## 13. Limitaciones y siguientes pasos

**Limitaciones actuales:**
- Los favoritos son locales al navegador — no se sincronizan entre dispositivos
- Sin autenticación — cualquier usuario que acceda al dispositivo puede ver y eliminar los favoritos
- La búsqueda carga 200 Pokémon en cada query (sin caché entre búsquedas)
- El algoritmo de naming produce resultados inconsistentes en nombres muy cortos o con caracteres especiales
- No hay paginación en favoritos — si el usuario guarda muchas fusiones, todas se renderizan a la vez

**Siguientes pasos:**
- Migrar a Firestore cuando `@angular/fire` soporte Angular 21 oficialmente
- Agregar autenticación con Firebase Auth (Google Sign-In)
- Implementar caché HTTP con `HttpInterceptor` para evitar re-fetching de Pokémon ya consultados
- Agregar unit tests a `FusionLogicService` y `LocalStorageService`
- Mejorar el algoritmo de naming con una tabla de sílabas por idioma
- Agregar descripción generada de la fusión ("Esta criatura...")
- Implementar virtual scroll en favoritos si la colección crece
- Agregar filtros en favoritos por tipo o por nombre de padre