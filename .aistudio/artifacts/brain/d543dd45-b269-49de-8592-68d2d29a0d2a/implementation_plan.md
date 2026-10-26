# CORVUS v4.0.0-beta // REVAN — Identidad Visual Morada y Dorada

Actualización de la versión global de **CORVUS // EAW Modding Tool** a **`4.0.0-beta`** con el nombre en clave **`Revan`**, aplicando el nuevo diseño de insignia **Morado Imperial con Borde Dorado** (`v4.0.0-beta // REVAN`) en el elemento seleccionado del encabezado principal, el manifiesto de versión, el instalador táctico NSIS y los manuales de usuario.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario**:
> - **Formato exacto del badge de versión**: `v4.0.0-beta // REVAN`.
> - **Estilo visual del elemento seleccionado**: Fondo degradado morado profundo (`from-purple-950/90 via-purple-700/45 to-fuchsia-950/90`) con borde dorado brillante (`border-amber-400/90`), resplandor púrpura-ámbar y texto de alto contraste con acento dorado para `REVAN`.
> - **Alcance de sincronización**: Aplicar la nueva versión `4.0.0-beta` (`Revan`) y su estética morada/dorada en el **Header principal**, `package.json`, **Instalador Táctico NSIS** (tanto el modal interactivo como los bitmaps `.bmp`/`.png` y scripts `.nsh`) y **Manual de Usuario**.
> - **Versiones individuales de herramientas**: Se mantienen intactas dado que en este paso no se modifica la funcionalidad interna de ninguna herramienta individual.

---

## 1. Overview & Core Concept

- **What It Does**: Establece el inicio del ciclo **CORVUS 4.0.0 Beta**, bautizando la versión con el codename **Revan** e introduciendo una insignia distintiva en tonos morado oscuro/amatista y borde dorado inspirado en la iconografía de Darth Revan.
- **Target Audience / Persona**: Modders de *Star Wars: Empire at War* y *Forces of Corruption* que utilizan CORVUS en escritorio Windows (Electron/NSIS) o navegador.
- **Key Value**: Identifica visualmente la transición a la generación `4.0.0-beta // REVAN` de forma coherente en la barra superior, el instalador ejecutable y la documentación integrada.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Barra Superior (Elemento Seleccionado)**: El usuario visualiza junto al título `CORVUS // EAW Modding Tool` el nuevo badge morado con borde dorado mostrando `v4.0.0-beta // REVAN` con animación sutil de brillo metálico.
  2. **Instalador Táctico HUD & NSIS**: Al abrir el visor `Instalador` o ejecutar el instalador de Windows, el panel lateral (`164x314`), la cabecera (`150x57`) y los registros de instalación reflejan la versión `v4.0.0-beta // REVAN` con el nuevo esquema morado y dorado.
  3. **Manual de Usuario**: El pie de navegación lateral del manual y la documentación muestran la insignia morada/dorada `v4.0.0-beta // REVAN`.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: HUD Táctico Imperial / Sith-Jedi (*Revan Edition*) con contraste nítido y acabado metálico.
  - *Color Palette & Mood*:
    - Superficie del badge: Degradado morado (`#2e1065` → `#581c87` → `#3b0764`).
    - Borde y destellos: Dorado imperial (`#fbbf24` / `border-amber-400/90`) con sombra combinada `shadow-[0_0_12px_rgba(168,85,247,0.45),inset_0_0_8px_rgba(251,191,36,0.2)]`.
    - Tipografía interna: Monospace tabular (`font-mono font-bold tracking-widest`) en blanco lavanda (`text-purple-100`) con el codename `// REVAN` resaltado en ámbar dorado (`text-amber-300`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: SemVer válido en `package.json` con Codename en la interfaz**
  - *Chosen Approach*: Configurar `"version": "4.0.0-beta"` en el manifiesto del proyecto (cumpliendo el estándar SemVer exigido por `electron-builder` y NSIS) y renderizar `v4.0.0-beta // REVAN` en los componentes visuales y assets del instalador.
  - *Why*: Garantiza que el empaquetador de Electron y el auto-actualizador de GitHub Releases validen correctamente la versión sin errores de compilación.
- **Decision 2: Preservación estricta de las versiones de cada herramienta**
  - *Chosen Approach*: Mantener sin cambios las versiones individuales de las 13 herramientas (`Galaxia v2.7`, `GC v3.3`, `Historia v2.2`, `Unidades v1.4`, `HardPoints v1.1`, `TechTree v1.0`, `SFX v1.0`, `DAT v1.3`, `MTD v1.3`, `Diálogos v1.1`, `XML v2.1`, `LUA v2.2`, `Auditor v1.0`).
  - *Why*: Cumple la regla de aumentar únicamente la versión de una herramienta cuando se modifica dicha herramienta.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CORVUS v4.0.0-beta // REVAN IDENTITY                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Manifiesto SemVer: version = "4.0.0-beta" | codename = "REVAN"         │
└───────────────┬─────────────────────────────┬───────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│   UI React & Elemento Enfocado    │ │   Pipeline de Instalador NSIS     │
├───────────────────────────────────┤ ├───────────────────────────────────┤
│ • Header Badge (Focus Selector):  │ │ • Generador SVG → BMP 24-bit:     │
│   Fondo morado + borde dorado     │ │   Gradiente morado + borde dorado │
│   Texto: v4.0.0-beta // REVAN     │ │   en Sidebar (164x314) y Header   │
│ • Modal Instalador HUD:           │ │ • Scripts NSIS y Licencia:        │
│   Badge lateral morado/dorado     │ │   Cabeceras v4.0.0-beta // REVAN  │
│ • Modal Manual de Usuario:        │ │ • Documentación Markdown:         │
│   Sello de versión morado/dorado  │ │   Título y pie v4.0.0-beta REVAN  │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - **Header Version Badge**: Se aplica directamente sobre el contenedor seleccionado por el usuario (`header > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1)`), sustituyendo el gradiente plateado anterior por el gradiente morado profundo con borde dorado y añadiendo la etiqueta `// REVAN`.
  - **Regeneración de Assets Binarios NSIS**: El generador de iconos y bitmaps recompila automáticamente los recursos `.bmp` de 24 bits y `.png` con el nuevo gradiente `#purpleBadge` (`#3b0764` → `#6b21a8` → `#2e1065`) y borde `#fbbf24` mostrando `v4.0.0-beta // REVAN`.
