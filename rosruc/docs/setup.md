# Setup

## Requirements

- Node.js and npm for the React app and Express API
- Python 3 for the current command line AI placeholder
- Docker Compose only if using the starter container path

## Install

From the project root:

```sh
cp .env.example .env
cd backend
npm install
cd ../frontend
npm install
```

## Run Without Docker

Terminal one:

```sh
cd backend
npm run dev
```

Terminal two:

```sh
cd frontend
npm run dev
```

The default frontend URL is `http://localhost:5173` and the default backend URL is `http://localhost:4000`.

## Run The Python Placeholder

```sh
python3 backend/ai/main.py
```

## Optional Docker Starter

```sh
docker compose up
```

The compose file favors quick local setup over production image builds.
