# ✂️ Barbería — Sistema de Gestión

Sistema full-stack para gestión de turnos, clientes y promociones con integración de **WhatsApp Business API**.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11 + TypeScript |
| Base de datos | PostgreSQL 17 + TypeORM |
| Autenticación | JWT + Google OAuth 2.0 |
| Bot WhatsApp | Meta WhatsApp Business API |
| Frontend | Next.js 16 + Tailwind CSS v4 |

## Inicio Rápido

### 1. Levantar la base de datos

```bash
cp .env.example .env
docker-compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env 
npm install
npm run migration:run
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   
npm install
npm run dev
```

## URLs de Desarrollo

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |

## Módulos del Backend

- **Auth** — JWT + Google OAuth, refresh tokens, guards por rol
- **Users** — Gestión de staff (ADMIN / BARBER)
- **Clients** — Clientes invitados (sin cuenta)
- **Services** — Servicios editables desde el panel
- **Appointments** — Turnos con validación de disponibilidad
- **Promotions** — Crear, programar y enviar por WhatsApp
- **WhatsApp** — Webhook de Meta, intents automáticos

## Variables de Entorno Necesarias

Ver `backend/.env.example` y `frontend/.env.example` para la lista completa.
