# API Contract

Base URL for local development: `http://localhost:4000`

## Health

### `GET /health`

Response:

```json
{
  "status": "ok",
  "service": "uwt-devtools-api"
}
```

## Tickets

### `POST /tickets`

Request:

```json
{
  "title": "Checkout total is stale",
  "description": "Customer sees a stale total after removing a coupon."
}
```

Response `201`:

```json
{
  "id": "ticket-example",
  "title": "Checkout total is stale",
  "description": "Customer sees a stale total after removing a coupon.",
  "status": "created",
  "logs": ["Ticket accepted by the API and stored in memory."],
  "report": null,
  "createdAt": "2026-05-22T00:00:00.000Z",
  "updatedAt": "2026-05-22T00:00:00.000Z"
}
```

### `GET /tickets/:id`

Response `200`: the full ticket object.

Response `404`: `{ "error": "Ticket not found: <id>" }`

### `POST /tickets/:id/run`

Starts the synchronous placeholder AI service and updates the in-memory ticket.

Response:

```json
{
  "ticket": {
    "id": "ticket-example",
    "status": "report_ready",
    "logs": ["Placeholder workflow messages live here."],
    "report": {
      "title": "Placeholder report: Checkout total is stale"
    }
  },
  "result": {
    "status": "report_ready",
    "summary": "Drafted a placeholder investigation plan.",
    "logs": ["Ticket parser extracted symptoms."],
    "report": {
      "title": "Placeholder report: Checkout total is stale"
    }
  }
}
```

The real response includes the full ticket fields and report note arrays described in the shared schemas.

### `GET /tickets/:id/status`

Response:

```json
{
  "id": "ticket-example",
  "status": "report_ready",
  "logs": ["Ticket and agent activity messages."],
  "updatedAt": "2026-05-22T00:01:00.000Z"
}
```

### `GET /tickets/:id/report`

Response before a run:

```json
{
  "id": "ticket-example",
  "status": "created",
  "report": null
}
```

Response after a run: the same shape with the report object filled in.
