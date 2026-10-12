import { Device, SensorData } from '../navigation/models/IoTModels';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export const apiConfig = {
  baseUrl: apiUrl ?? '',
  enabled: Boolean(apiUrl),
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiDevice = Omit<Device, 'icon'> & {
  icon?: Device['icon'];
};

const defaultIcons: Record<number, Device['icon']> = {
  1: 'bulb-outline',
  2: 'sync-outline',
  3: 'lock-closed-outline',
  4: 'man-outline',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiUrl) {
    throw new ApiError('Backend URL is not configured.');
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const responseText = await response.text();
  let body: unknown = undefined;

  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      body = responseText;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status);
  }

  return body as T;
}

function unwrapList<T>(body: unknown, key: string): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }

  if (typeof body === 'object' && body !== null) {
    const value = (body as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      return value as T[];
    }

    const data = (body as Record<string, unknown>).data;
    if (Array.isArray(data)) {
      return data as T[];
    }
  }

  throw new ApiError(`The backend returned an invalid ${key} response.`);
}

function normalizeDevice(value: ApiDevice): Device {
  const id = Number(value.id);

  if (!Number.isFinite(id) || typeof value.name !== 'string') {
    throw new ApiError('The backend returned an invalid device.');
  }

  return {
    id,
    name: value.name,
    type: typeof value.type === 'string' ? value.type : 'Smart Device',
    icon: value.icon ?? defaultIcons[id] ?? 'hardware-chip-outline',
    status: Boolean(value.status),
  };
}

function normalizeSensors(body: unknown): SensorData {
  const value =
    typeof body === 'object' && body !== null && 'data' in body
      ? (body as Record<string, unknown>).data
      : body;
  const sensors =
    typeof value === 'object' && value !== null && 'sensors' in value
      ? (value as Record<string, unknown>).sensors
      : value;

  if (
    typeof sensors !== 'object' ||
    sensors === null ||
    typeof (sensors as Record<string, unknown>).temperature !== 'number' ||
    typeof (sensors as Record<string, unknown>).humidity !== 'number' ||
    typeof (sensors as Record<string, unknown>).lightLevel !== 'number'
  ) {
    throw new ApiError('The backend returned invalid sensor data.');
  }

  return sensors as SensorData;
}

export const api = {
  async getDevices(): Promise<Device[]> {
    const body = await request<unknown>('/api/devices');
    return unwrapList<ApiDevice>(body, 'devices').map(normalizeDevice);
  },

  async getSensors(): Promise<SensorData> {
    return normalizeSensors(await request<unknown>('/api/sensors'));
  },

  async setDeviceStatus(id: number, status: boolean): Promise<void> {
    await request(`/api/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
