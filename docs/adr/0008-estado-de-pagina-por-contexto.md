# ADR 0008 — Estado de página en un provider por contexto, no en props

- **Estado:** aceptada
- **Fecha de la decisión:** 2026-07-30 (Fase 3 de `PLAN_MEJORAS_2026-07.md`, tareas 3.1 y 3.2)

## Contexto

`ProjectsPage.tsx` tenía 551 líneas y `MessagesPage.tsx` 404. Cada una era un componente único que declaraba entre 6 y 8 `useState`, todos los handlers de CRUD, los memos de filtrado y estadísticas, y el markup completo: encabezado, franja de stats, formulario, barra de herramientas, tabla, panel de detalle y diálogos de confirmación.

El problema práctico no era estético. Para cambiar una columna de la tabla había que leer un archivo que también contenía la validación del formulario y la subida de imágenes. Y las piezas necesitan estado compartido de verdad: el botón "Eliminar" de una fila abre un diálogo que vive al final de la página, el asa de reordenamiento necesita saber si los filtros están activos, y el formulario se abre tanto desde el encabezado como desde la tecla `[n]` registrada por el layout.

Descomponer en componentes con props habría significado que la página siguiera siendo dueña de todo el estado y lo pasara hacia abajo — el mismo archivo grande, ahora con veinte props de plomería.

## Decisión

Cada página del admin es **composición pura**: declara el layout y nada más. El estado vive en un provider por página que publica un contexto.

```
pages/admin/ProjectsPage.tsx          28 líneas — sólo layout
pages/admin/projects/
  ProjectsProvider.tsx                dueño único del estado
  projectsContext.ts                  contexto + hook de acceso
  useProjectForm.ts  useProjectFilters.ts    hooks de estado
  projectForm.ts                      helpers puros, sin React
  ProjectsHeader  ProjectsStats  ProjectForm  ProjectFormPreview
  ProjectFilters  ProjectsTable  ReorderControls  ProjectsDialogs
```

`pages/admin/messages/` sigue la misma forma.

Reglas que definen el patrón:

1. **Ningún componente recibe props de estado.** Se permiten props que son datos propios de la instancia (`ReorderControls` recibe `index`, `MessageRow` recibe `msg`), nunca estado compartido ni setters.
2. **El contexto se agrupa por feature**, no por tipo: `{ filters, form, drag, deletion }`. No se usa la forma `{ state, actions, meta }` de la skill `composition-patterns` — ver *Alternativas descartadas*.
3. **El contexto y su hook van en un archivo `.ts` aparte** del provider. Si conviven, `react-refresh` no puede hacer fast-refresh del módulo. Es la misma razón por la que existe `adminContext.ts`.
4. **Los hooks devuelven objetos nuevos en cada render, sin memoizar.** Los handlers que se registran en un effect (`openCreate` en la tecla `[n]`) o que se usan como dependencia se desestructuran para tomar la referencia estable, nunca el objeto entero.
5. **La lógica pura sale a un módulo sin React** (`projectForm.ts`, `messageLinks.ts`), para poder testearla sin montar nada.

## Fundamento

1. **El estado compartido es real, no accidental.** Las piezas de estas páginas se necesitan entre sí de verdad; el contexto describe eso mejor que una cadena de props.
2. **Cada archivo se puede leer solo.** El más grande del refactor tiene 138 líneas. El criterio de aceptación de la fase era 250.
3. **El límite quedó verificable.** Los 203 tests siguieron pasando **sin modificar ninguno**, lo que prueba que el refactor no cambió comportamiento — que era la regla explícita de la fase.
4. **Un solo dueño del estado.** Antes había un único componente que era dueño de todo por acumulación; ahora es dueño por diseño, y se ve en un archivo de 86 líneas.

## Consecuencias

**Positivas:** archivos chicos y de responsabilidad única; la lógica pura es testeable aislada (así apareció `useDirtyForm`); agregar o mover una sección no toca lógica; el provider es el único lugar donde mirar para entender el estado de la página.

**Negativas:**

- **Más archivos.** 13 en `projects/`, 17 en `messages/`. Navegar el módulo requiere conocer la convención.
- **Costo en bundle:** +3,9 kB raw / +1,2 kB gzip por los límites de módulo y el contexto. Medido, no estimado.
- **El contexto sin memoizar re-renderiza a todos los consumidores** cuando la página re-renderiza. Es exactamente lo que pasaba antes (un componente único se re-renderizaba entero), así que no es una regresión — pero tampoco es una mejora, y si alguna vez se mide un problema de render, acá está la palanca.
- **Un footgun de referencias.** Los hooks devuelven objetos nuevos por render, así que poner `form` o `checks` en un array de dependencias rompe la estabilidad en silencio. Pasó dos veces durante la implementación (`MessagesProvider.runBulk` y `useProjectForm.openCreate`). La regla 4 existe por eso.

## Alternativas descartadas

- **Props (prop drilling).** Deja el estado en la página: el archivo grande no desaparece, sólo se le agrega plomería.
- **`{ state, actions, meta }`** — la forma que prescribe `state-context-interface` de la skill `composition-patterns`, marcada HIGH. Se descartó con fundamento: su valor declarado es la inyección de dependencias ("swap the provider, keep the UI"), y acá hay un provider por página sin ningún caso de uso que pida un segundo. Además agrupar por tipo separaría cosas cohesivas — los datos del formulario de sus propias acciones. El propio plan (§1.2, R5) había constatado que el problema de props booleanas que motiva esa skill no existe en este código.
- **Namespace con sintaxis punteada (`<Projects.Table />`).** Requiere un barrel file, y `bundle-barrel-imports` está marcado CRITICAL en `react-best-practices`. La cualidad de compound component la da la composición por contexto, que ya está; la sintaxis punteada sería cosmética.
- **Un state manager (Zustand, Redux).** El proyecto no tiene ninguno y no lo necesita: el estado es local a una página y muere con ella. Sumar una dependencia global para eso es desproporcionado.
- **`<TrashView>` como componente propio**, que el plan nombraba para 3.2. No existe tal cosa en este código: la papelera es un valor del filtro y comparte tabla, búsqueda y detalle. Lo que sí cambia son las acciones, y ahí se aplicó `patterns-explicit-variants`: `ActiveMessageActions` y `TrashedMessageActions`, dos componentes sin solape.
