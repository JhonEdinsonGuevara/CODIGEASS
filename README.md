# CODIGEASS

CODIGEASS es una aplicación educativa para aprender conceptos básicos de Python mediante lecciones y desafíos. Incluye registro de usuarios, inicio de sesión, una tienda y progreso independiente para cada cuenta.

Esta guía explica qué hay en el proyecto, cómo ejecutarlo, dónde se guarda la información y qué significa publicarlo en GitHub.

## Empezar aquí

### Lo que necesitas

- Windows y Visual Studio Code.
- Node.js **24 LTS o posterior**. Node.js ejecuta el servidor; `npm`, que se instala junto con Node.js, instala sus herramientas.
- Una conexión a Internet la primera vez que ejecutes `npm install`.

Si acabas de instalar Node.js, cierra y vuelve a abrir VS Code. En VS Code abre **Terminal → New Terminal** y comprueba que Node.js está disponible:

```powershell
node --version
npm --version
```

### Arrancar CODIGEASS

Abre la carpeta de este proyecto en VS Code. Desde la terminal integrada, en esa carpeta, ejecuta:

```powershell
npm install
npm start
```

- `npm install` descarga las bibliotecas necesarias y las registra en la carpeta local `node_modules`.
- `npm start` prepara una clave privada para esta computadora, crea la base de datos si aún no existe y pone en marcha el servidor.
- Cuando aparezca un mensaje que diga que CODIGEASS está disponible, abre **http://localhost:3000** en el navegador.
- Selecciona **Crear cuenta** para registrarte. Puedes crear otra cuenta con un nombre distinto para comprobar que tiene su propio progreso.
- Para detener el servidor, vuelve a la terminal y presiona **Ctrl+C**.

**Importante:** entra por `http://localhost:3000`. No abras los archivos `.html` directamente ni uses la extensión Live Server: esas opciones no conectan la página a las cuentas ni a la base de datos.

La primera ejecución crea un archivo `.env` con una clave aleatoria. Se guarda en tu computadora y está excluido de Git. No lo compartas ni lo subas a GitHub.

## Cómo se organiza el proyecto

```text
CODIGEASS/
├── public/                  Páginas y archivos que muestra el navegador
│   ├── index.html           Inicio y ruta de aprendizaje de Python
│   ├── cursos.html          Catálogo de cursos disponibles
│   ├── rutas.html           Enlace antiguo que redirige a Cursos
│   ├── desafio.html         Retos
│   ├── ligas.html           Tabla de liga de demostración
│   ├── tienda.html          Artículos que se pueden comprar con XP
│   ├── perfil.html          Estadísticas, logros y botón de reinicio
│   ├── login.html           Registro e inicio de sesión
│   ├── app.js               Conecta las páginas con el servidor
│   ├── auth.js              Controla los formularios de acceso
│   └── styles.css           Apariencia y diseño adaptable a móvil
├── src/
│   ├── game.js              Reglas de lecciones, vidas, XP, misión y tienda
│   └── game.test.js         Pruebas de las reglas del juego
├── scripts/
│   └── prepare-local-env.js Crea y comprueba la clave privada local
├── server.js                Servidor web, cuentas, sesiones y API
├── server.test.js           Pruebas del servidor y de las cuentas
├── package.json             Dependencias y comandos npm disponibles
├── package-lock.json        Versiones exactas instaladas por npm
├── .env.example             Ejemplo de variables para configurar el servidor
├── .gitignore               Impide incluir datos privados y archivos generados
└── README.md                Esta guía
```

Antes, los HTML y el CSS estaban en la raíz del proyecto. Ahora están bajo `public/`, que es la carpeta desde donde el servidor publica las páginas. Abre CODIGEASS desde el servidor, no desde los archivos movidos.

### Para qué sirve cada parte

- **`public/`** contiene la interfaz. `app.js` solicita al servidor el progreso y envía las respuestas de lecciones, desafíos y compras. `auth.js` envía los formularios de registro e inicio de sesión.
- **`server.js`** es el intermediario entre el navegador y la base de datos. Comprueba la sesión y recibe o guarda el progreso; el navegador no modifica directamente las cuentas.
- **`src/game.js`** define las respuestas correctas y valida las reglas del juego en el servidor.
- **`src/*.test.js` y `server.test.js`** verifican estas reglas y los flujos de registro, autenticación y guardado.
- **`package.json`** declara las bibliotecas y comandos. **`package-lock.json`** fija sus versiones para que `npm install` instale el mismo conjunto en otros equipos.
- **`.env`** contiene la clave privada de sesión local. No lo crees ni lo subas a GitHub manualmente; el proyecto lo prepara al iniciarse.
- **`node_modules/`** contiene las bibliotecas descargadas. La crea `npm install`; no es código del proyecto que haya que subir a GitHub.

## Cuentas y datos

CODIGEASS usa SQLite, una base de datos que guarda la información en archivos locales y no necesita que instales otro programa de base de datos. Node.js 24 proporciona el módulo SQLite utilizado por el servidor.

En Windows, la base de datos se crea por defecto aquí:

```text
C:\Users\<tu-usuario>\.codigeass\codigeass.sqlite
```

La carpeta `.codigeass` está fuera del repositorio. En la base se guardan:

- Los nombres de usuario, únicos sin distinguir mayúsculas y minúsculas.
- Las contraseñas en forma de hash seguro. El servidor no guarda ni devuelve la contraseña original.
- El progreso de cada cuenta: XP, vidas, lecciones y desafíos completados, racha, misión diaria, artículos y sesiones.

El progreso de una cuenta no se mezcla con el de otra. Se guarda en SQLite incluso cuando apagas el servidor. Para respaldar tu progreso, haz una copia de la carpeta `.codigeass` **con el servidor detenido**. No copies esa base al repositorio público.

Los nombres de usuario deben tener entre 3 y 64 caracteres: letras, números, puntos, guiones bajos, guiones o `@`; no admiten espacios. Las contraseñas deben tener al menos 10 caracteres. El proyecto no verifica que un nombre con `@` sea una dirección de correo ni pide un correo para recuperar contraseñas. Si reinicias el progreso desde Perfil, se borran el XP, las compras y las actividades de esa cuenta; la cuenta se conserva.

En el servidor local, puedes volver a intentar registrarte sin esperar un período de bloqueo. Los intentos de inicio de sesión siguen limitados para proteger las cuentas. Si publicas la aplicación, el registro también queda limitado para reducir el abuso.

Para explicar o presentar las tablas y sus relaciones en clase, consulta el [modelo entidad-relación de CODIGEASS](./MODELO_DATOS.md).

## Qué puedes hacer en la aplicación

- Explorar el catálogo público de los seis cursos: Python, HTML, CSS, JavaScript, Java y C#. Para iniciar lecciones y guardar el progreso debes iniciar sesión o crear una cuenta. Cada curso puede iniciarse sin completar otro.
- Elegir las lecciones de un curso en cualquier orden; cada curso guarda sus avances de forma independiente en la misma cuenta.
- Resolver tres desafíos de programación.
- Ganar XP; la misión diaria da XP adicional al completar dos actividades en el día.
- Perder una vida cuando una respuesta es incorrecta. Se recupera una vida cada 30 minutos mientras el servidor está funcionando o cuando consultas el progreso después de que pase ese tiempo.
- Gastar XP para rellenar las vidas, activar doble XP por una hora o desbloquear el avatar Code Ninja y el título Cyber Dev.
- Cerrar sesión desde el menú lateral.
- Consultar estadísticas y logros en Perfil.

El catálogo se llama Cursos. Cada curso tiene ejercicios introductorios para practicar sus conceptos básicos; el contenido no pretende ser un curso completo ni un compilador de código. La página antigua `rutas.html` redirige a `cursos.html`. La tabla de Ligas también es una demostración: no compara las cuentas entre sí ni se actualiza como clasificación compartida.

## Comandos útiles

En la terminal de VS Code:

```powershell
npm start
```

Inicia el servidor. Mantén esa terminal abierta mientras usas la página.

```powershell
npm test
```

Ejecuta las pruebas automáticas. Actualmente comprueba las respuestas, recompensas, compras, vidas, sesiones, separación del progreso entre dos usuarios y algunos límites del servidor. Todas las pruebas deben terminar con `pass` y `fail 0`.

```powershell
npm install
```

Instala o restaura las bibliotecas declaradas en `package-lock.json`. Normalmente basta ejecutarlo una vez después de clonar el repositorio.

## GitHub y publicación en Internet

Subir el proyecto a GitHub guarda y comparte el **código**; no hace que la aplicación funcione públicamente. GitHub Pages no ejecuta este servidor de Node.js.

Antes de subir cambios, abre **Source Control** en VS Code y confirma que no aparezcan `.env`, `node_modules` ni archivos `.sqlite` o `.db`. El archivo `.gitignore` excluye estos datos, además de las claves temporales de SQLite.

Para que otras personas usen sus propias cuentas a través de Internet, será necesario publicar el servidor en un servicio que ejecute Node.js y ofrezca almacenamiento persistente para SQLite. En producción se necesita HTTPS y una clave `SESSION_SECRET` privada del servicio de alojamiento; no se debe publicar `.env` ni una base de datos con cuentas reales. La tabla de ligas, la recuperación de contraseñas y las otras rutas requerirán trabajo adicional.

## Si algo no funciona

- **`node` o `npm` no se reconoce:** cierra y vuelve a abrir VS Code después de instalar Node.js. Comprueba `node --version`.
- **No se abre la página:** confirma que `npm start` sigue ejecutándose y visita `http://localhost:3000`.
- **Aparece un error de módulos faltantes:** ejecuta `npm install` en la carpeta que contiene `package.json`.
- **La página no inicia sesión:** comprueba que el servidor siga en marcha y que no estés abriendo `login.html` desde una ruta `file:///` o con Live Server.
- **Olvidaste la contraseña:** esta versión no tiene recuperación. Deberás crear otra cuenta; para conservar datos existentes, no borres ni reemplaces la base de datos.
