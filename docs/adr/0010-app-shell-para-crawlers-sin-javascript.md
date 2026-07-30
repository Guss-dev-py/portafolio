# ADR 0010 — Un app shell en el HTML para los crawlers que no ejecutan JavaScript

- **Estado:** aceptada
- **Fecha de la decisión:** 2026-07-30

## Contexto

El sitio es una SPA de Vite: `index.html` trae un `<div id="root"></div>` vacío y todo el texto aparece recién cuando corre el bundle. Medido sobre el HTML de producción:

```
curl -s localhost:8080  ->  7.341 bytes, 0 caracteres de texto en el <body>
```

Lo único legible sin ejecutar JavaScript era el `<head>`: `title`, `meta description` y el JSON-LD estático. Fue el hallazgo dominante de la Fase 4 y quedó anotado como la recomendación de mayor impacto de todo el ciclo de mejoras.

Las fuerzas en juego:

- **Google no es el problema.** Renderiza JavaScript, así que los AI Overviews ven la página entera. El problema son ChatGPT, Perplexity y Claude, que leen el HTML crudo.
- **El objetivo declarado del sitio** (decisión 7 del ciclo, la que permitió los 8 crawlers de IA en `robots.txt`) es que a Augusto lo encuentren para trabajar, incluido el caso de un recruiter preguntándole a un asistente. Un `<body>` vacío hace que ese canal devuelva nada.
- **El contenido que esos crawlers necesitan es copy estable** — quién es, qué stack maneja, cómo contactarlo. No es dato vivo. El único dato vivo de la página pública es el índice de proyectos, que sale de la base.

## Decisión

**Un app shell de HTML plano, generado en tiempo de build desde `src/data/`, inyectado dentro de `#root`.**

- `frontend/vite/appShell.ts` arma el fragmento desde `data/profile.ts`, `data/skills.ts` y `data/contact.ts`.
- `frontend/vite/appShellPlugin.ts` lo inserta con el hook `transformIndexHtml`, sólo en `apply: 'build'`.
- **El plugin rompe el build** si no encuentra `<div id="root"></div>` con esa forma exacta. Un rename silencioso del contenedor devolvería el sitio a servir cero texto, y nadie se enteraría hasta la próxima auditoría.
- El shell **no se esconde**: se le da estilo con los tokens del sitio (`[data-app-shell]` en `index.css`).

Funciona porque `main.tsx` monta con `createRoot()`, no con `hydrateRoot()`: React **vacía el contenedor** en el primer render. No hay mismatch de hidratación posible y ningún visitante termina con el shell en pantalla.

Resultado medido: **0 → 462 caracteres** de texto en el `<body>` servido. (Fueron 1.452 en la primera versión; ver el recorte en Consecuencias.)

## Fundamento

1. **Es proporcional al problema.** Cero infraestructura nueva, cero costo en runtime, cero contenedores. El sitio público es una sola página.
2. **No puede desincronizarse de la copy.** Se genera desde los mismos módulos de `src/data/` que usa la app. Una copia escrita a mano en `index.html` habría envejecido en la primera edición.
3. **No es cloaking.** Es el mismo contenido que la app renderiza, en texto plano, y se le da forma en vez de ocultarlo. Esconderlo con `display: none` —texto visible sólo para crawlers— sí lo sería.
4. **El límite está declarado dentro del propio shell.** El índice de proyectos no puede vivir acá sin quedar viejo, así que el shell apunta explícitamente a `/llms.txt`, que es el canal en texto plano de ese dato.

## Consecuencias

**Positivas**

- Los crawlers sin JS leen nombre, rol, intro, stack completo, los tres enlaces de contacto y un puntero a `/llms.txt` para la biografía y el índice de proyectos.
- Un visitante con la red lenta y JavaScript todavía sin ejecutar ve **contenido legible** en vez de una pantalla en blanco. Es progressive enhancement real, no un efecto colateral.
- El `<h1>` existe en el HTML servido. Antes no había ninguno.

**Negativas**

- **El shell se ve durante la carga.** Medido: ~100 ms en un equipo rápido, ~1,1 s con el CPU a 8×. Por eso está estilado y no oculto. En un equipo muy lento hay un cambio visible de la versión en texto a la versión completa.
- 🔴 **Cuesta LCP, y no es poco.** Medido en la Fase 6.2 con Lighthouse 13.4.1, 3 corridas por configuración contra el stack Docker:

  | Configuración | Performance móvil | LCP |
  |---|---|---|
  | Sin app shell | 91–93 | ~2.507 ms |
  | Shell completo (1.452 caracteres) | 88–89 | ~3.047 ms |
  | **Shell recortado (462 caracteres)** | **88–91** | **~2.951 ms** |

  El mecanismo: el navegador pinta el shell, React vacía el contenedor y repinta, y se registra un candidato de LCP más tardío. **Recortar el contenido recuperó sólo ~100 ms de los ~540**: el costo es que el shell exista, no su tamaño. Los ~450 ms restantes son intrínsecos al enfoque.

  Se recortó igual —el shell quedó en identidad, stack, contacto y un puntero a `/llms.txt`— porque el contenido enfocado es lo que un crawler sin JS necesita, y la bio larga ya vive en `llms.txt`. `vite/__tests__/appShell.test.ts` tiene ahora un **techo** de longitud, no sólo un piso: si alguien vuelve a inflarlo, el test lo frena antes de que aparezca en Lighthouse.
- ⚠️ **Lighthouse no premia esta decisión.** La categoría `agentic-browsing` da **100 con y sin** app shell, porque Lighthouse ejecuta JavaScript y mide el DOM ya renderizado. El beneficio del shell —crawlers que *no* ejecutan JS— es invisible para la herramienta, mientras que su costo sí se ve. Cualquiera que mire sólo el informe de Lighthouse va a concluir que el shell no sirve para nada; esta nota existe para que eso no pase.
- **`profile.biography`, `profile.goals` y `profile.aspirationSector` quedaron sin ningún consumidor** al recortar el shell. `profile.ts` no tiene importadores React —su único importador era `vite/appShell.ts`— así que esos tres campos son hoy datos muertos. Anotado en la auditoría de 6.6.
- **El flash es siempre en tema claro.** `useTheme` escribe `data-theme` desde JavaScript, así que un visitante con tema oscuro ve el shell en papel. Ya pasaba antes con la pantalla en blanco; el shell lo vuelve visible.
- **El índice de proyectos sigue sin ser legible sin JS.** Es el límite aceptado de esta decisión.

**Mitigación**

- El estilo de `[data-app-shell]` usa los tokens del sitio, así que el momento intermedio se lee como la página cargando.
- La guarda del plugin convierte cualquier rotura futura en un build rojo, no en una regresión silenciosa.

## Alternativas descartadas

| Opción | Por qué no |
|---|---|
| **Migrar a Next.js** | SSR de verdad, pero reescribe el frontend entero y da vuelta los ADR 0001, 0002, 0008 y 0009. Desproporcionado para una sola página pública. |
| **Prerender en build con headless chrome** | Captura todo, incluido el listado de proyectos. Pero el build pasaría a necesitar la API y la base arriba, y la foto queda vieja apenas se edita un proyecto desde el admin. |
| **Render dinámico para bots** (nginx detecta el user-agent y lo manda a un renderizador headless) | Siempre fresco y completo, pero cuesta un quinto contenedor con chromium residente, memoria e invalidación de cache. Google lo trata como parche, no como solución. |
| **Meter el shell en `<noscript>`** | Cero riesgo de flash, y es el elemento semánticamente correcto. Se descartó porque varios extractores de contenido descartan `<noscript>` al parsear — justo los lectores para los que existe esto. |

## Revisión

Reevaluar si el índice de proyectos pasa a ser contenido que tiene que estar sí o sí en el HTML servido, o si el sitio deja de ser una sola página pública. En cualquiera de los dos casos la opción a mirar es **render dinámico para bots**, no la migración a Next.js.
