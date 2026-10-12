# Backend connection

The app uses the REST API configured by `EXPO_PUBLIC_API_URL`. Copy `.env.example` to `.env.local`, set the URL, and restart Expo with `npx expo start`.

## Local backend

This project includes a small local backend. Start it in one terminal:

```text
npm run backend
```

The local base URL is `http://localhost:3000`. The app is already configured to use it through `.env.local`.

For Expo Go on a physical phone, replace the URL in `.env.local` with the computer's LAN address, for example `http://192.168.1.25:3000`. Keep the phone and computer on the same network.

Expo exposes `EXPO_PUBLIC_` variables to the client bundle, so this value must be a public endpoint URL. Do not put private keys or secrets in the file.

The current client expects these endpoints:

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/api/devices` | — | `Device[]` or `{ "devices": Device[] }` |
| `GET` | `/api/sensors` | — | `SensorData` or `{ "data": SensorData }` |
| `PATCH` | `/api/devices/:id` | `{ "status": boolean }` | Any successful `2xx` response |

Each device needs `id`, `name`, and `status`. `type` and `icon` are optional. Sensor responses need numeric `temperature`, `humidity`, and `lightLevel` values.

When `EXPO_PUBLIC_API_URL` is not set, the app remains in local demo mode so the screens can still be previewed without a backend.
