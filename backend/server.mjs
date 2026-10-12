import http from 'node:http';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.BACKEND_HOST ?? '0.0.0.0';

const devices = [
  {
    id: 1,
    name: 'Living Room Bulb',
    type: 'Smart Light',
    icon: 'bulb-outline',
    status: true,
  },
  {
    id: 2,
    name: 'Bedroom Fan',
    type: 'Smart Fan',
    icon: 'sync-outline',
    status: false,
  },
  {
    id: 3,
    name: 'Front Door Lock',
    type: 'Smart Lock',
    icon: 'lock-closed-outline',
    status: true,
  },
  {
    id: 4,
    name: 'Rhenz',
    type: 'Human',
    icon: 'man-outline',
    status: false,
  },
];

const sensors = {
  temperature: 28,
  humidity: 65,
  lightLevel: 720,
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/devices') {
    sendJson(response, 200, { devices });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/sensors') {
    sendJson(response, 200, sensors);
    return;
  }

  const deviceMatch = url.pathname.match(/^\/api\/devices\/(\d+)$/);
  if (request.method === 'PATCH' && deviceMatch) {
    try {
      const device = devices.find((item) => item.id === Number(deviceMatch[1]));
      const body = await readJson(request);

      if (!device) {
        sendJson(response, 404, { message: 'Device not found.' });
        return;
      }

      if (typeof body.status !== 'boolean') {
        sendJson(response, 400, { message: 'status must be a boolean.' });
        return;
      }

      device.status = body.status;
      sendJson(response, 200, { device });
      return;
    } catch (error) {
      sendJson(response, 400, {
        message: error instanceof Error ? error.message : 'Invalid request.',
      });
      return;
    }
  }

  sendJson(response, 404, { message: 'Route not found.' });
});

server.listen(port, host, () => {
  console.log(`IoT backend listening at http://localhost:${port}`);
  console.log(`LAN access is available on port ${port} when using a device on the same network.`);
});
