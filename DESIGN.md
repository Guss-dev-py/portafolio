---
name: Portfolio Augusto Freire
description: Portfolio one-page de fullstack developer con estética de terminal impresa sobre papel
colors:
  paper: "#f3efe5"
  paper-shade: "#ebe6d8"
  paper-deep: "#ddd6c2"
  paper-panel: "#e5dfd0"
  ink: "#161412"
  ink-soft: "#2b2722"
  ink-dim: "#4a463c"
  ink-mute: "#8c8676"
  hairline: "#b3ab95"
  sello-red: "#c1272d"
  status-open-green: "#1b8a3e"
  warn-amber: "#a55a00"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "clamp(48px, 7.5vw, 116px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.05
  title:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  serif-accent:
    fontFamily: "Newsreader, Georgia, serif"
    fontWeight: 400
    lineHeight: 1.25
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.14em"
rounded:
  none: "0"
spacing:
  u1: "8px"
  u2: "16px"
  u3: "24px"
  u4: "32px"
  u6: "48px"
  u8: "64px"
  u10: "80px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
  button-primary-hover:
    backgroundColor: "{colors.sello-red}"
    textColor: "{colors.paper}"
  link:
    textColor: "{colors.ink}"
  link-hover:
    textColor: "{colors.sello-red}"
---

# Design System: Portfolio Augusto Freire

## 1. Overview

**Creative North Star: "La Terminal Impresa"**

Una sesión de terminal compuesta con tipos de imprenta sobre papel: rigor digital con materialidad analógica. Todo el sitio habla en monospace (JetBrains Mono) como una terminal honesta, pero vive sobre un papel cálido con hairlines, reglas tipográficas y sellos de tinta, como un documento técnico impreso. La personalidad es **precisa, técnica y honesta**: lo que se ve es lo que hay, sin humo de marketing.

El sistema rechaza explícitamente: el template de portfolio genérico (fondo oscuro, gradientes violetas, cards idénticas), la agencia pretenciosa (scroll-hijack, animaciones que estorban) y el CV plano sin personalidad. El detalle de interacción es la prueba de habilidad: cada hover, press y transición demuestra el oficio que el texto declara.

**Key Characteristics:**
- Monospace como voz única; la serif (Newsreader itálica) es el único acento tipográfico, usado como firma
- Radius 0 en todo: esquinas duras de documento impreso
- Hairlines (`1px #b3ab95`) y reglas de tinta (`1px-2px #161412`) organizan el contenido en lugar de cards
- El Rojo Sello aparece poco y certifica
- Densidad media, escaneable en segundos por un recruiter

## 2. Colors: La Paleta del Documento

Papel cálido, tinta casi negra y un único acento rojo de sello; los estados usan verde y ámbar funcionales.

### Primary
- **Rojo Sello** (#c1272d): como el sello de tinta de un documento oficial: aparece poco y certifica. Hover de links, acciones destructivas, estado "ocupado", énfasis puntual. Nunca decorativo en superficies grandes.

### Neutral
- **Papel** (#f3efe5): fondo base de toda la página.
- **Papel Sombra** (#ebe6d8) y **Papel Profundo** (#ddd6c2): capas de papel para paneles y zonas alternas; hacen profundidad sin sombras.
- **Tinta** (#161412): texto principal, reglas, bordes fuertes. Nunca negro puro.
- **Tinta Suave** (#2b2722) / **Tinta Tenue** (#4a463c): jerarquía de texto secundario.
- **Tinta Muda** (#8c8676): metadatos; usar solo en tamaños grandes o junto a texto de apoyo (contraste límite).
- **Hairline** (#b3ab95): divisores finos, el esqueleto silencioso de la composición.

### Tertiary
- **Verde Disponible** (#1b8a3e): exclusivo del estado semántico "open to work".
- **Ámbar Aviso** (#a55a00): advertencias.

### Named Rules
**La Regla del Sello.** El Rojo Sello certifica, no decora: aparece en menos del 5% de cualquier pantalla (un hover, un estado, una firma). Si una sección entera se tiñe de rojo, está mal usado.

**La Regla del Papel.** El tema es uno solo (papel claro) en todo el sitio público; ninguna sección invierte a oscuro salvo el footer, que actúa como contratapa de tinta.

## 3. Typography

**Display Font:** JetBrains Mono (con fallback ui-monospace)
**Body Font:** JetBrains Mono
**Serif Accent:** Newsreader (Georgia fallback), solo itálica como firma

**Character:** una sola familia mono en todos los niveles transmite rigor de terminal; la jerarquía se construye con peso y escala, no con cambios de familia. La Newsreader itálica es la firma manuscrita sobre el documento: aparece en el apellido del hero y en énfasis editoriales puntuales.

### Hierarchy
- **Display** (800, clamp(48px → 116px), 1.05, -0.045em): exclusivo del nombre en el hero.
- **Headline** (700, 32-36px, 1.05): títulos de sección.
- **Title** (600, 22px, 1.25): subtítulos y nombres de proyecto.
- **Body** (400, 13px, 1.5): prosa; máximo ~70ch de línea.
- **Label** (500, 10-11px, 0.08-0.14em, uppercase): metadatos de la barra de registro y etiquetas técnicas.

### Named Rules
**La Regla de la Firma.** La serif itálica nunca es texto funcional: solo firma (apellido, énfasis editorial de una palabra). Si hay más de una frase en serif por pantalla, sobra.

## 4. Elevation

**Plano con sellos.** Todo es plano por defecto: la profundidad la hacen las capas de papel (#f3efe5 → #ebe6d8 → #ddd6c2) y las hairlines, no las sombras. La sombra stamp (dura, sin blur, como un sello desplazado) es estructural y está reservada a los elementos que "se despegan" del papel: la ventana de terminal del hero, diálogos, toasts.

### Shadow Vocabulary
- **Stamp** (`box-shadow: 4px 4px 0 #161412`): elementos despegados estándar.
- **Stamp grande** (`box-shadow: 8px 8px 0 #161412`): la ventana de terminal del hero y overlays mayores.

### Named Rules
**La Regla del Sello Desplazado.** Ninguna sombra tiene blur. Si un elemento necesita profundidad sutil, usa una capa de papel más oscura, no una sombra suave.

## 5. Components

Los componentes se sienten **táctiles y mecánicos**: como teclas físicas, respuesta inmediata, press perceptible, cero floatiness. Transiciones cortas (80-200ms) con easing simple.

### Buttons
- **Shape:** esquinas duras (radius 0)
- **Primary:** fondo Tinta, texto Papel; hover invierte a Rojo Sello; press con `scale(0.97)` inmediato
- **Ghost:** borde de regla (1px Tinta), fondo transparente; hover rellena con Papel Sombra

### Links
- Subrayado siempre visible (1px, offset 3px); hover engrosa a 2px y tiñe de Rojo Sello. El link nunca se distingue solo por color.

### Inputs (formulario de contacto)
- Label arriba en Label uppercase; borde hairline que pasa a regla de Tinta en focus; error en Rojo Sello debajo del campo. Radius 0.

### Terminal Window (hero)
- Marco de regla con barra de título mono y sombra Stamp grande. Es la pieza central de la marca; no replicar su tratamiento en otros contenedores.

### Filas de lista (proyectos, contacto)
- Sin cards: filas separadas por hairlines que se desplazan (translateX) y tiñen de fondo al hover, solo en dispositivos con puntero fino.

### Toast
- Panel de papel con borde de regla completo (2px en el color de estado), sombra Stamp; entra desde el borde y se descarta táctilmente.

## 6. Do's and Don'ts

**Do:**
- Organizar con hairlines, reglas y espacio; las cards son la excepción, no el default
- Responder a cada press con feedback inmediato (`scale(0.97)`, 80-160ms)
- Gatear los hovers con `@media (hover: hover) and (pointer: fine)`
- Respetar `prefers-reduced-motion` en toda animación
- Mantener WCAG AA: cuerpo ≥4.5:1 contra el papel

**Don't:**
- No usar `border-left`/`border-right` gruesos como acento lateral (tell de IA); el acento es borde completo o tinte de fondo
- No animar propiedades de layout (`padding`, `width`, `height`); solo `transform` y `opacity`
- No introducir radius, gradientes ni sombras con blur
- No agregar una segunda familia tipográfica funcional; la serif es solo firma
- No teñir secciones enteras de Rojo Sello ni inventar acentos nuevos por sección
