import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface PerformanceTrackerProps {
  data: {
    goals?: number[];
    assists?: number[];
  };
}

export const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({ data }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const goalsData = data.goals || [0, 2, 1, 3, 2, 4];
  const assistsData = data.assists || [1, 1, 2, 1, 3, 2];
  
  const maxValue = Math.max(...goalsData, ...assistsData);
  const chartHeight = 150;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Trend</Text>
      
      <View style={styles.chart}>
        <View style={styles.chartContent}>
          {months.map((month, index) => (
            <View key={month} style={styles.monthColumn}>
              <View style={styles.barsContainer}>
                <View 
                  style={[
                    styles.bar,
                    styles.goalsBar,
                    {
                      height: (goalsData[index] / maxValue) * chartHeight,
                    }
                  ]}
                />
                <View 
                  style={[
                    styles.bar,
                    styles.assistsBar,
                    {
                      height: (assistsData[index] / maxValue) * chartHeight,
                    }
                  ]}
                />
              </View>
              <Text style={styles.monthLabel}>{month}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Goals</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.info }]} />
          <Text style={styles.legendText}>Assists</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  chart: {
    height: 200,
    marginBottom: 16,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  monthColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 150,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  goalsBar: {
    backgroundColor: Colors.success,
  },
  assistsBar: {
    backgroundColor: Colors.info,
  },
  monthLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});