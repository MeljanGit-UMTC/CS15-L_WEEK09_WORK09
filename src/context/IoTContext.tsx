import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Device, SensorData } from '../navigation/models/IoTModels';
import { api, apiConfig } from '../services/api';

const devices: Device[] = [
    {
        id: 1,
        name: 'Living Room Bulb',
        type: 'Smart Light',
        icon: 'bulb-outline' as const,
        status: true,
    },
    {
        id: 2,
        name: 'Bedroom Fan',
        type: 'Smart Fan',
        icon: 'sync-outline' as const,
        status: false,
    },
    {
        id: 3,
        name: 'Front Door Lock',
        type: 'Smart Lock',
        icon: 'lock-closed-outline' as const,
        status: true,
    },
    {
        id: 4,
        name: 'Rhenz',
        type: 'Human',
        icon: "man-outline",
        status: false,
    }
];

type IoTContextType = {
    devices: Device[];
    sensors: SensorData;
    sensorsLoading: boolean;
    refreshSensors: () => Promise<void>;
    gatewayConnected: boolean;
    updatingDevices: Record<number, boolean>;
    toggleDevice: (id: number, value: boolean) => Promise<void>;
    setGatewayConnected: (connected: boolean) => void;
    backendConfigured: boolean;
    connectionError: string | null;
};

const IoTContext = createContext<IoTContextType | undefined>(
    undefined
);

export function IoTProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    const [deviceList, setDeviceList] = useState<Device[]>(devices);
    const [deviceStatus, setDeviceStatus] = useState(
        devices.reduce((acc, device) => {
            acc[device.id] = device.status;

            return acc;
        }, {} as Record<number, boolean>)
    );
    

    // Shared Gateway connection
    const [sensors, setSensors] = useState<SensorData>({
        temperature: 28,
        humidity: 65,
        lightLevel: 720,
    });
    const [sensorsLoading, setSensorsLoading] = useState(false);
    const [updatingDevices, setUpdatingDevices] = useState<Record<number, boolean>>({});
    const [gatewayConnected, setGatewayConnectedState] = useState(!apiConfig.enabled);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const syncFromBackend = useCallback(async () => {
        if (!apiConfig.enabled) {
            return;
        }

        setSensorsLoading(true);
        setConnectionError(null);

        try {
            const [remoteDevices, remoteSensors] = await Promise.all([
                api.getDevices(),
                api.getSensors(),
            ]);

            setDeviceList(remoteDevices);
            setDeviceStatus(
                remoteDevices.reduce((status, device) => {
                    status[device.id] = device.status;
                    return status;
                }, {} as Record<number, boolean>)
            );
            setSensors(remoteSensors);
            setGatewayConnectedState(true);
        } catch (error) {
            setGatewayConnectedState(false);
            setConnectionError(error instanceof Error ? error.message : 'Unable to reach the backend.');
        } finally {
            setSensorsLoading(false);
        }
    }, []);

    useEffect(() => {
        void syncFromBackend();
    }, [syncFromBackend]);

    const refreshSensors = async () => {
        if (sensorsLoading) {
            return;
        }

        setSensorsLoading(true);
        setConnectionError(null);

        if (apiConfig.enabled) {
            try {
                setSensors(await api.getSensors());
                setGatewayConnectedState(true);
            } catch (error) {
                setGatewayConnectedState(false);
                setConnectionError(error instanceof Error ? error.message : 'Unable to reach the backend.');
            } finally {
                setSensorsLoading(false);
            }
            return;
        }

        // Simulate retrieving fresh readings without blocking the UI.
        setTimeout(() => {
            setSensors({
                temperature: Math.round((20 + Math.random() * 12) * 10) / 10,
                humidity: Math.round(40 + Math.random() * 41),
                lightLevel: Math.round(300 + Math.random() * 721),
            });
            setSensorsLoading(false);
        }, 1000);
    };

    const toggleDevice = async (
        id: number,
        value: boolean
    ) => {

        if (!gatewayConnected || updatingDevices[id]) {
            return;
        }

        setUpdatingDevices((current) => ({
            ...current,
            [id]: true,
        }));

        try {
            if (apiConfig.enabled) {
                await api.setDeviceStatus(id, value);
            } else {
                await new Promise((resolve) => setTimeout(resolve, 55));
            }

            setDeviceStatus((current) => ({
                ...current,
                [id]: value,
            }));
        } catch (error) {
            setGatewayConnectedState(false);
            setConnectionError(error instanceof Error ? error.message : 'Unable to update the device.');
        } finally {
            setUpdatingDevices((current) => ({
                ...current,
                [id]: false,
            }));
        }

    };

    const updatedDevices = deviceList.map((device) => ({
        ...device,
        status: deviceStatus[device.id],
    }));

    const setGatewayConnected = (connected: boolean) => {
        if (!connected) {
            setGatewayConnectedState(false);
            return;
        }

        if (apiConfig.enabled) {
            void syncFromBackend();
            return;
        }

        setGatewayConnectedState(true);
    };

    return (
        <IoTContext.Provider
            value={{
                devices: updatedDevices,
                sensors,
                sensorsLoading,
                refreshSensors,
                toggleDevice,
                gatewayConnected,
                updatingDevices,
                setGatewayConnected,
                backendConfigured: apiConfig.enabled,
                connectionError,
            }}
        >
            {children}
        </IoTContext.Provider>
    );
}

export function useIoT() {

    const context = useContext(IoTContext);

    if (!context) {
        throw new Error(
            'useIoT must be used inside IoTProvider'
        );
    }

    return context;
}
