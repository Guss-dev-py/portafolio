/**
 * Datos del perfil que consume el app shell (`vite/appShell.ts`), el HTML de
 * respaldo para los crawlers que no ejecutan JavaScript.
 *
 * Este módulo **no tiene consumidores React**: la copy que ve el visitante vive
 * en el JSX de `AboutSection`. Se le sacaron `biography`, `goals` y
 * `aspirationSector` en la auditoría de la Fase 6.6 — quedaron sin ningún
 * consumidor al recortar el shell, y la biografía completa vive en
 * `public/llms.txt`. Ver el ADR 0010.
 */
export const profile = {
  name: "Augusto",
  lastName: "Freire",
  role: "FullStack Developer | Python · Express.js · React · Node.js · PostgreSQL · Linux · APIs",
  intro:
    "Apasionado por construir soluciones digitales limpias, escalables y con buena experiencia de usuario.",
};
