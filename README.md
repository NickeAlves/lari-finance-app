# LariFinanceApp

Este proyecto se generó con [Angular CLI](https://github.com/angular/angular-cli) versión 21.2.16.

## Servidor de desarrollo

Para iniciar un servidor de desarrollo local, ejecuta:

```bash
ng serve
```

Cuando el servidor esté en marcha, abre el navegador y entra en `http://localhost:4200/`. La aplicación se recargará automáticamente cada vez que modifiques algún archivo fuente.

## Generación de código

Angular CLI incluye herramientas de generación de código. Para crear un componente nuevo, ejecuta:

```bash
ng generate component component-name
```

Para ver la lista completa de esquemas disponibles, como `components`, `directives` o `pipes`, ejecuta:

```bash
ng generate --help
```

## Compilación

Para compilar el proyecto, ejecuta:

```bash
ng build
```

Este comando compila el proyecto y guarda los artefactos en el directorio `dist/`. Por defecto, la compilación de producción optimiza la aplicación para mejorar rendimiento y velocidad.

## Variables de entorno

Copia `.env.example` a `.env` cuando quieras sobrescribir la configuración local:

```bash
cp .env.example .env
```

Las variables principales son:

- `API_BASE_URL`: URL base de la API. El frontend construye las rutas a partir de ella, como `${API_BASE_URL}/auth/login`, `${API_BASE_URL}/auth/register`, `${API_BASE_URL}/finance/calculate` y `${API_BASE_URL}/finance/rates`.
- `LARI_LOCALE` y `LARI_CURRENCY`: locale y moneda usados en los formateadores.
- `LARI_HERO_IMAGE_URL`: imagen que se muestra en la parte superior de la aplicación.
- `LARI_IVA_RATE`, `LARI_FIXED_EXPENSES_RATE`, `LARI_PRODUCTS_RATE`, `LARI_SALARY_RATE` y `LARI_ANNUAL_TAX_RESERVE_RATE`: porcentajes de cálculo.
- `APP_PORT`, `PORT` y `DOCKER_IMAGE`: configuración de Docker Compose/contenedor.

El archivo `public/env.js` se genera automáticamente con `npm start` y `npm run build`; en Docker se recrea al iniciar el contenedor a partir de las variables reales del entorno.

## Docker y Railway

Para ejecutar localmente con Docker Compose:

```bash
docker compose up --build
```

La aplicación estará disponible en el puerto definido por `APP_PORT`.

Para detener el contenedor:

```bash
docker compose down
```

En Railway, publica el repositorio con el `Dockerfile` en la raíz. Railway detecta el `Dockerfile` automáticamente e inyecta la variable `PORT`; Caddy usa ese puerto en tiempo de ejecución. Configura también `API_BASE_URL` y las variables `LARI_*` en el entorno de Railway cuando necesites cambiar endpoint, moneda, imagen o porcentajes sin modificar el código.

## Pruebas unitarias

Para ejecutar las pruebas unitarias con [Vitest](https://vitest.dev/), usa este comando:

```bash
ng test
```

## Pruebas end-to-end

Para ejecutar pruebas end-to-end (e2e), usa:

```bash
ng e2e
```

Angular CLI no incluye un framework end-to-end por defecto. Puedes elegir el que mejor se adapte a tus necesidades.

## Recursos adicionales

Para más información sobre Angular CLI, incluida la referencia detallada de comandos, visita la página [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
