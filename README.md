# FINANCE Local

App personal para registrar nomina quincenal o mensual, gastos y calculos SAT editables. No usa servidor propio ni nube externa: los datos se guardan en el navegador de cada dispositivo.

## Usarla en otros dispositivos

La forma mas simple es publicarla con GitHub Pages.

1. Crea un repositorio en GitHub, por ejemplo `finance-local`.
2. Sube estos archivos al repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.webmanifest`
   - `sw.js`
   - `icon.svg`
3. En GitHub entra a `Settings > Pages`.
4. En `Build and deployment`, selecciona `Deploy from a branch`.
5. Elige la rama `main` y carpeta `/root`.
6. Guarda. GitHub te dara una URL parecida a `https://tuusuario.github.io/finance-local/`.

Abre esa URL en celular, tablet o computadora. En Android/Chrome o iPhone/Safari puedes usar la opcion del navegador para agregarla a la pantalla de inicio.

## Importante sobre tus datos

Cada navegador guarda sus propios datos. Si registras gastos en tu celular, no apareceran automaticamente en tu computadora.

Para mover tus datos:

1. En el dispositivo actual entra a `Datos`.
2. Pulsa `Exportar JSON`.
3. Guarda el archivo en un lugar privado.
4. En el otro dispositivo abre la app.
5. Entra a `Datos` y usa `Importar JSON`.

## Privacidad

No subas tus respaldos JSON a un repositorio publico. Si quieres guardarlos en GitHub, usa un repositorio privado.
