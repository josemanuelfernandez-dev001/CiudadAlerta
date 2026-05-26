CiudadAlerta

## Scripts de ejecución

En `/ciudadalerta/package.json` quedaron definidos:

- `npm run dev`: inicia la app en modo desarrollo (con recarga usando `node --watch`).
- `npm run start`: inicia la app en modo producción.

## Variables de entorno mínimas

Crear `ciudadalerta/.env` con:

```env
SESSION_SECRET=GENERATE_SECURE_RANDOM_STRING_MIN_32_CHARS
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=TU_SERVICE_ROLE_KEY
PORT=3000
```

## Inicializar base de datos en Supabase

Se agregó el script:

- `/ciudadalerta/supabase/init_supabase.sql`

Incluye:

- Tablas requeridas por la app: `usuarios`, `categorias`, `reportes`, `fotos_reporte`, `historial_estados`, `votos`, `notificaciones`.
- Índices y políticas RLS base para producción.
- Datos de ejemplo (usuarios ficticios, categorías, reportes y notificaciones).
- Creación/configuración del bucket `fotos-reportes`.

### Cómo ejecutarlo

1. Abrir **Supabase Dashboard → SQL Editor**.
2. Copiar y ejecutar el contenido de `ciudadalerta/supabase/init_supabase.sql`.
3. Verificar que existan tablas y que el bucket `fotos-reportes` esté creado.

## Bucket Supabase para imágenes (producción)

El script configura el bucket `fotos-reportes` con:

- `public = true` (necesario para usar `getPublicUrl` como en el código actual).
- Límite de tamaño: `5 MB`.
- MIME types permitidos: `image/jpeg`, `image/png`, `image/webp`.

### Rutas sugeridas para objetos

Para estandarizar archivos en producción, se sugiere usar:

- `reportes/{usuario_id}/{reporte_id}/{timestamp}_{uuid}.jpg`

La política de inserción sobre `storage.objects` exige que inicie con `reportes/...` para clientes autenticados (service role no se ve afectado).
