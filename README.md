# NotifyHub

Real-time notification system built with Node.js, RabbitMQ, and WebSocket. Supports multi-channel delivery (email, push, websocket) with message queuing and notification templates.

## Architecture

```
Client  --->  REST API  --->  RabbitMQ Queues  --->  Workers  --->  Channel Delivery
                                                                    ├── Email (mock)
WebSocket <─────────────────────────────────────────────────────────├── Push (mock)
  Client                                                            └── WebSocket (real-time)
```

Notifications are published to channel-specific RabbitMQ queues (`notifications.email`, `notifications.push`, `notifications.websocket`). Worker consumers pick them up and dispatch to the appropriate delivery service. WebSocket clients receive notifications in real-time.

## Tech Stack

- **Node.js** with ES Modules
- **Express** — REST API
- **RabbitMQ** (amqplib) — message queuing
- **ws** — WebSocket server
- **Docker Compose** — containerized setup

## Quick Start

### With Docker (recommended)

```bash
docker-compose up --build
```

App runs on `http://localhost:3002`, RabbitMQ management UI on `http://localhost:15672` (guest/guest).

### Local Development

Requires RabbitMQ running locally on port 5672.

```bash
cp .env.example .env
npm install
npm run dev
```

## API Reference

### Notifications

#### Send Notification

```
POST /api/notifications
Content-Type: application/json

{
  "userId": "user-123",
  "channel": "email",
  "title": "Welcome",
  "message": "Welcome to the platform!",
  "data": { "link": "https://example.com" }
}
```

Channel must be one of: `email`, `push`, `websocket`.

Optionally pass `templateId` to use a notification template — the template body will be rendered with `data` values substituted for `{{placeholders}}`.

#### List Notifications

```
GET /api/notifications
GET /api/notifications?userId=user-123
GET /api/notifications?userId=user-123&status=delivered&channel=email
```

#### Get Notification

```
GET /api/notifications/:id
```

#### Mark as Read

```
PATCH /api/notifications/:id/read
```

### Templates

#### Create Template

```
POST /api/templates
Content-Type: application/json

{
  "name": "welcome-email",
  "subject": "Welcome, {{name}}!",
  "body": "Hi {{name}}, thanks for joining. Your account ID is {{accountId}}.",
  "channel": "email"
}
```

#### List Templates

```
GET /api/templates
```

#### Get Template

```
GET /api/templates/:id
```

#### Update Template

```
PUT /api/templates/:id
Content-Type: application/json

{
  "name": "welcome-email-v2",
  "body": "Updated body with {{name}}"
}
```

#### Delete Template

```
DELETE /api/templates/:id
```

### WebSocket

Connect to receive real-time notifications:

```
ws://localhost:3002/ws?userId=user-123
```

Messages received:

```json
{ "type": "connected", "userId": "user-123" }
{ "type": "notification", "data": { "id": "...", "title": "...", "message": "..." } }
```

### Health Check

```
GET /health
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3002` | HTTP server port |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | RabbitMQ connection string |
| `RABBITMQ_USER` | `guest` | RabbitMQ user (docker-compose) |
| `RABBITMQ_PASS` | `guest` | RabbitMQ password (docker-compose) |

## Project Structure

```
src/
├── index.js                  Entry point
├── config/rabbitmq.js        RabbitMQ connection + retry logic
├── routes/
│   ├── notifications.js      Notification CRUD + send
│   └── templates.js          Template CRUD
├── services/
│   ├── queueService.js       Publish/consume from RabbitMQ
│   ├── emailService.js       Mock email delivery
│   ├── pushService.js        Mock push delivery
│   └── websocketService.js   Real-time WebSocket delivery
├── models/
│   ├── Notification.js       In-memory notification store
│   └── Template.js           In-memory template store
├── middleware/
│   └── errorHandler.js       Global error handler
└── workers/
    └── notificationWorker.js Queue consumers
```
