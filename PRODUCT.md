# Product

## Register

brand

## Users
Recruiters y equipos técnicos de empresas evaluando a Augusto Freire para un puesto full-time de fullstack developer. Llegan con poco tiempo, escanean en segundos y deciden si vale una entrevista. Contexto secundario: el propio Augusto administra contenido (proyectos, mensajes, estado de disponibilidad) desde el panel `/admin`.

## Product Purpose
Portfolio personal one-page (Hero → Sobre mí → Proyectos → Contacto) que convierte visitas de recruiters en entrevistas. Éxito = el recruiter entiende el stack y el nivel en menos de un minuto, ve evidencia real (proyectos con código y demo) y manda un mensaje por el formulario. El indicador de disponibilidad (`work_status`) comunica si está abierto a ofertas sin necesidad de preguntar.

## Brand Personality
Preciso, técnico, honesto. La estética terminal-sobre-papel (JetBrains Mono, hairlines, sellos tipográficos, rojo tinta `#c1272d`) transmite rigor de ingeniería sin humo: lo que se ve es lo que hay. El tono evita el marketing inflado; habla en primera persona con claridad de changelog.

## Anti-references
- **Template de portfolio genérico**: fondo oscuro con gradientes violetas, cards idénticas, hero centrado con typewriter effect. Todo lo que grita "plantilla de IA".
- **Agencia pretenciosa**: scroll-hijack, animaciones que estorban la lectura, Awwwards-style sin contenido que lo justifique.
- **CV aburrido**: una página plana que solo lista skills sin personalidad ni evidencia.

## Design Principles
1. **El detalle de interacción es la prueba de habilidad**: la navegación y las interacciones de mouse (hover states, feedback de press, micro-detalles) deben demostrar el oficio que el texto declara.
2. **Evidencia antes que adjetivos**: cada claim de skill se respalda con un proyecto real, código visible o una interacción bien resuelta.
3. **Terminal honesto**: la metáfora de terminal/papel es el lenguaje de la marca; cada elemento nuevo se expresa en ese sistema (mono, hairlines, sellos), nunca en el dialecto genérico de SaaS.
4. **Rápido de escanear**: un recruiter decide en segundos; la jerarquía visual prioriza stack, disponibilidad y proyectos por sobre la prosa.
5. **El motion respeta la lectura**: las animaciones revelan y confirman, nunca interrumpen ni obligan a esperar.

## Accessibility & Inclusion
WCAG AA: contraste mínimo 4.5:1 en texto de cuerpo (3:1 en texto grande), `prefers-reduced-motion` respetado en todas las animaciones (ya implementado vía `useReducedMotion` y media queries), navegación completa por teclado (el admin ya tiene atajos; el sitio público debe mantener focus visible y orden lógico).
