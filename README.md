# Dulcinea Club Web

Aplicación web para la gestión de entradas, tickets y notificaciones de Telegram para Dulcinea Club.

## Tecnologías

- Next.js 13
- TypeScript
- Tailwind CSS
- Supabase
- Telegram Bot API

## Variables de entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=tu_chat_id_admin
TELEGRAM_ALLOWED_ADMIN_IDS=123456789
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
```

## Despliegue

La app está preparada para desplegarse en Vercel conectando el repositorio de GitHub.
