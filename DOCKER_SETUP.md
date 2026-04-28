# Guía de Docker Compose

Este proyecto está configurado para ejecutarse con Docker Compose y contiene tres servicios principales:

## Servicios

1. **Backend (NestJS)** (puerto 3001)
   - API REST
   - Contenedor: `barberia_backend`
   - Hot reload habilitado en desarrollo
   - Se conecta a PostgreSQL (Neon u otro proveedor)

2. **Frontend (Next.js)** (puerto 3000)
   - Aplicación web
   - Contenedor: `barberia_frontend`
   - Hot reload habilitado en desarrollo

## Configuración Inicial

1. Copia el archivo `.env.example` a `.env` y ajusta las variables según sea necesario:
   ```bash
   cp .env.example .env
   ```

2. Completa las credenciales de tu base de datos (ej: Neon DB):
   - `DB`: URL de conexión completa
   - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`

3. Para producción, cambia al menos:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` (si usas OAuth)
   - `WHATSAPP_*` variables (si usas WhatsApp)

## Comandos Útiles

### Iniciar los servicios
```bash
docker-compose up
```

### Iniciar en segundo plano
```bash
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Detener los servicios
```bash
docker-compose down
```

### Detener y limpiar (sin volúmenes ya que usamos BD externa)
```bash
docker-compose down --remove-orphans
```

### Reconstruir imágenes
```bash
docker-compose build
```

### Reconstruir sin caché
```bash
docker-compose build --no-cache
```

## URLs de Acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |

## Arquitectura

```
┌─────────────┐      ┌──────────────┐      ┌──────────────────┐
│  Frontend   │─────>│   Backend    │─────>│  PostgreSQL      │
│ (Next.js)   │      │  (NestJS)    │      │ (Neon / Local)   │
│ :3000       │      │  :3001       │      │                  │
└─────────────┘      └──────────────┘      └──────────────────┘
```

## Desarrollo

Los volúmenes están configurados para hot reload:

- **Backend**: `./backend/src` se sincroniza con el contenedor, permitiendo que cambios se reflejen automáticamente
- **Frontend**: `./frontend` se sincroniza, habilitando hot reload de Next.js

## Troubleshooting

### El backend no conecta a la BD
- Verifica la URL de conexión en `DB` de `.env`
- Asegúrate de que las credenciales son correctas
- Chequea los logs: `docker-compose logs backend`

### El frontend no ve el backend
- Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurado a `http://localhost:3001`
- Asegúrate de que el backend está corriendo en el puerto 3001

### Puertos ocupados
Si los puertos están ocupados, puedes cambiarlos en `docker-compose.yml`:
```yaml
ports:
  - 'NUEVO_PUERTO:PUERTO_CONTENEDOR'
```

## Variables de Entorno

Ver `.env.example` para la lista completa. Crea un `.env` local para desarrollo.

## Notas

- No incluyas `.env` en git (está en `.gitignore`)
- En producción, usa secretos reales para `JWT_SECRET` y `JWT_REFRESH_SECRET`
- Para OAuth de Google, obtén credenciales en Google Cloud Console
- Para WhatsApp, obtén credenciales en Meta Business Platform
- La base de datos se conecta a través de una URL de conexión remota (ej: Neon DB)
