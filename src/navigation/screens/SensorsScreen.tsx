import React from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useIoT } from '../../context/IoTContext';

export default function SensorsScreen() {
  const { sensors, sensorsLoading, refreshSensors } = useIoT();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sensors</Text>
      <Text style={styles.subtitle}>Monitor your environment</Text>

      <View style={styles.sensorCard}>
        <View style={styles.sensorHeader}>
          <Ionicons name="thermometer-outline" size={30} />
          <Text style={styles.sensorName}>Temperature</Text>
        </View>
        <Text style={styles.sensorValue}>{sensors.temperature}°C</Text>
        <Text style={styles.sensorDescription}>Current room temperature</Text>
      </View>

      <View style={styles.sensorCard}>
        <View style={styles.sensorHeader}>
          <Ionicons name="water-outline" size={30} />
          <Text style={styles.sensorName}>Humidity</Text>
        </View>
        <Text style={styles.sensorValue}>{sensors.humidity}%</Text>
        <Text style={styles.sensorDescription}>Current relative humidity</Text>
      </View>

      <View style={styles.sensorCard}>
        <View style={styles.sensorHeader}>
          <Ionicons name="sunny-outline" size={30} />
          <Text style={styles.sensorName}>Light Level</Text>
        </View>
        <Text style={styles.sensorValue}>{sensors.lightLevel} lux</Text>
        <Text style={styles.sensorDescription}>Current ambient light</Text>
      </View>

      <View style={styles.refreshSection}>
        {sensorsLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Refreshing sensors...</Text>
          </View>
        ) : (
          <Button title="Refresh Sensors" onPress={refreshSensors} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 25,
  },
  sensorCard: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#eeeeee',
    marginBottom: 15,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sensorName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  sensorValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
  },
  sensorDescription: {
    fontSize: 13,
    marginTop: 5,
  },
  refreshSection: {
    marginTop: 5,
    marginBottom: 20,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 10,
  },
});
