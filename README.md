# CORVUS // EAW Modding Tool

Suite avanzada de modding para **Star Wars: Empire at War / Forces of Corruption** con editores visuales y de código para Galaxia, Rutas Comerciales, Campañas, Textos (`.DAT`), Iconos (`.MTD`), Eventos de Historia (`Story XML`), Diálogos, Unidades (`XML`) y Scripts (`LUA`).

---

## Requisitos Previos

1. **Node.js (v20 o superior LTS recomendado)**: [Descargar desde nodejs.org](https://nodejs.org/)
2. **Windows 10 / 11 (64-bit)** para generar el instalador `.exe` NSIS de Windows.

---

## Icono Oficial e Instalador Propio Personalizado (NSIS)

El proyecto cuenta con un **sistema de generación automática de iconos e instalador táctico (`generate_icon.js`)** que se ejecuta automáticamente antes de compilar:

- **Icono Oficial de la UI (`public/icon.svg`, `public/icon.png`, `public/icon.ico`)**:
  - Reproduce fielmente el emblema oficial de la interfaz de **CORVUS** (cuadrado táctico cyan `#06b6d4` con resplandor y rombo interior oscuro `#020617` rotado a 45°).
  - El archivo `public/icon.ico` se genera en **formato multi-resolución (16×16, 32×32, 48×48, 64×64, 128×128 y 256×256 px)** para verse con máxima nitidez en la barra de tareas, el Explorador de Windows, el acceso directo del Escritorio y el instalador `.exe`.
- **Instalador Propio NSIS (`build/installer.nsh` y `build/LICENSE.txt`)**:
  - **Banner lateral (`public/installerSidebar.bmp`, 164×314 BMP 24-bit)** y **cabecera superior (`public/installerHeader.bmp`, 150×57 BMP 24-bit)** con estética HUD táctica de CORVUS, lista de módulos y el icono oficial.
  - **Asistente en Español (`language: 1034`)** con pantalla de bienvenida, información/licencia de la suite (`build/LICENSE.txt`), selector de carpeta de instalación, creación de accesos directos en Escritorio y Menú Inicio (`CORVUS Modding`), registro en Windows y ejecución automática al finalizar.

Si en algún momento deseas regenerar manualmente los iconos y banners del instalador:
```bash
npm run generate:assets
```

---

## Paso a Paso: Compilar el Instalador Ejecutable (`.exe`) con Electron

### 1. Descargar y descomprimir el proyecto
Descarga el código fuente desde AI Studio (botón **Download App** / **Export ZIP**) o clona tu repositorio de GitHub y descomprímelo en una carpeta de tu PC (por ejemplo: `C:\Proyectos\corvus-eaw-modding-tool`).

### 2. Instalar las dependencias
Abre una terminal (**PowerShell** o **CMD**) dentro de la carpeta del proyecto y ejecuta:

```bash
npm install
```

### 3. (Opcional) Probar la aplicación en modo Escritorio antes de empaquetar
Si quieres abrir la ventana nativa de Electron rápidamente con su nuevo icono antes de crear el instalador:

```bash
npm run electron:preview
```

### 4. Generar el Instalador Propio de Windows (`.exe`)
Para generar los iconos/banners, compilar la aplicación web de producción (`dist/`) y empaquetarla en el instalador personalizado NSIS:

```bash
npm run electron:build:win
```

### 5. Recoger el ejecutable final
Una vez termine el proceso, se habrá creado la carpeta **`release/`** en la raíz del proyecto con:
- **`CORVUS-EAW-Modding-Tool-Setup-3.0.0.exe`**: Tu instalador propio personalizado con el icono oficial de la UI, banners tácticos laterales/superiores, licencia en español y selector de ruta de instalación.
- **`win-unpacked/`**: Carpeta con la versión portable descomprimida (`CORVUS // EAW Modding Tool.exe`) lista para ejecutar directamente sin instalar.

---

## Publicación Automática de Actualizaciones en GitHub Releases (Opcional)

El proyecto ya incluye soporte integrado para **`electron-updater`** apuntando a `LordRevan2/corvus-eaw-modding-tool`:
1. Configura tu token de GitHub en PowerShell:
   ```powershell
   $env:GH_TOKEN="tu_token_personal_de_github"
   ```
2. Ejecuta:
   ```bash
   npm run electron:publish
   ```
   Esto subirá el instalador `.exe` y el archivo `latest.yml` a GitHub Releases para que los usuarios reciban avisos automáticos de actualización dentro de la app.
