// Player Heat Map Component for Football Stars App
// Visualizes player movement and positioning using heat map overlays

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  G, 
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';
import { PlayerHeatMapData, PositionData } from '../../types/analytics';

interface PlayerHeatMapProps {
  heatMapData: PlayerHeatMapData;
  showPlayerName?: boolean;
  showZoneStats?: boolean;
  width?: number;
  height?: number;
  opacity?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_WIDTH = screenWidth - 40;
const DEFAULT_HEIGHT = (DEFAULT_WIDTH * 1.6); // FIFA pitch ratio

export default function PlayerHeatMap({
  heatMapData,
  showPlayerName = true,
  showZoneStats = true,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  opacity = 0.7,
}: PlayerHeatMapProps) {
  
  // Process heat map data into grid zones for visualization
  const heatMapGrid = useMemo(() => {
    const gridSize = 20; // 20x20 grid
    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    
    // Accumulate position intensity in grid cells
    heatMapData.positions.forEach(position => {
      const gridX = Math.floor((position.x / 100) * (gridSize - 1));
      const gridY = Math.floor((position.y / 100) * (gridSize - 1));
      
      if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
        grid[gridY][gridX] += position.intensity;
      }
    });
    
    // Normalize grid values
    const maxValue = Math.max(...grid.flat());
    if (maxValue > 0) {
      grid.forEach(row => {
        row.forEach((cell, index) => {
          row[index] = cell / maxValue;
        });
      });
    }
    
    return grid;
  }, [heatMapData.positions]);

  // Get color for heat intensity
  const getHeatColor = (intensity: number): string => {
    if (intensity < 0.1) return 'transparent';
    if (intensity < 0.3) return 'rgba(255, 255, 0, 0.3)'; // Yellow
    if (intensity < 0.6) return 'rgba(255, 165, 0, 0.4)'; // Orange
    if (intensity < 0.8) return 'rgba(255, 69, 0, 0.5)';  // Red-Orange
    return 'rgba(255, 0, 0, 0.6)'; // Red
  };

  // Get position color based on player position
  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'GK': return '#FF5722';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  // Calculate average position
  const averagePosition = useMemo(() => {
    if (heatMapData.positions.length === 0) return { x: 50, y: 50 };
    
    const totalX = heatMapData.positions.reduce((sum, pos) => sum + pos.x, 0);
    const totalY = heatMapData.positions.reduce((sum, pos) => sum + pos.y, 0);
    
    return {
      x: totalX / heatMapData.positions.length,
      y: totalY / heatMapData.positions.length,
    };
  }, [heatMapData.positions]);

  const cellWidth = width / 20;
  const cellHeight = height / 20;

  return (
    <View style={styles.container}>
      {/* Player Name Header */}
      {showPlayerName && (
        <View style={styles.header}>
          <View style={[styles.positionBadge, { backgroundColor: getPositionColor(heatMapData.position) }]}>
            <Text style={styles.positionText}>{heatMapData.position}</Text>
          </View>
          <Text style={styles.playerName}>{heatMapData.playerName}</Text>
          <View style={styles.intensityBadge}>
            <Text style={styles.intensityText}>
              {(heatMapData.positions.reduce((sum, pos) => sum + pos.intensity, 0) / heatMapData.positions.length).toFixed(1)}
            </Text>
            <Text style={styles.intensityLabel}>AVG</Text>
          </View>
        </View>
      )}

      <View style={styles.pitchContainer}>
        <Svg width={width} height={height} style={styles.pitch}>
          {/* Pitch background */}
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="#2E7D32"
            stroke="#FFFFFF"
            strokeWidth="2"
            rx="8"
          />
          
          {/* Center line */}
          <Line
            x1="5"
            y1={height / 2}
            x2={width - 5}
            y2={height / 2}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          
          {/* Center circle */}
          <Circle
            cx={width / 2}
            cy={height / 2}
            r={height * 0.13}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          
          {/* Penalty areas */}
          <Rect
            x={(width - width * 0.647) / 2}
            y="0"
            width={width * 0.647}
            height={height * 0.171}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <Rect
            x={(width - width * 0.647) / 2}
            y={height - height * 0.171}
            width={width * 0.647}
            height={height * 0.171}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Heat map grid */}
          {heatMapGrid.map((row, rowIndex) =>
            row.map((intensity, colIndex) => (
              <Rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex * cellWidth}
                y={rowIndex * cellHeight}
                width={cellWidth}
                height={cellHeight}
                fill={getHeatColor(intensity)}
                opacity={opacity}
              />
            ))
          )}

          {/* Average position marker */}
          <Circle
            cx={(averagePosition.x / 100) * width}
            cy={(averagePosition.y / 100) * height}
            r="8"
            fill={getPositionColor(heatMapData.position)}
            stroke="#FFFFFF"
            strokeWidth="3"
            opacity="0.9"
          />
          
          {/* Average position label */}
          <Circle
            cx={(averagePosition.x / 100) * width}
            cy={(averagePosition.y / 100) * height}
            r="15"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="3,3"
            opacity="0.7"
          />
        </Svg>
      </View>

      {/* Zone Statistics */}
      {showZoneStats && (
        <View style={styles.zoneStats}>
          <Text style={styles.zoneStatsTitle}>Zone Distribution</Text>
          <View style={styles.zoneStatsRow}>
            <View style={styles.zoneStat}>
              <Text style={styles.zonePercentage}>{heatMapData.zones.defensive}%</Text>
              <Text style={styles.zoneLabel}>Defensive</Text>
              <View style={[styles.zoneBar, { backgroundColor: '#2196F3' }]}>
                <View 
                  style={[
                    styles.zoneBarFill, 
                    { width: `${heatMapData.zones.defensive}%`, backgroundColor: '#1976D2' }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.zoneStat}>
              <Text style={styles.zonePercentage}>{heatMapData.zones.middle}%</Text>
              <Text style={styles.zoneLabel}>Middle</Text>
              <View style={[styles.zoneBar, { backgroundColor: '#4CAF50' }]}>
                <View 
                  style={[
                    styles.zoneBarFill, 
                    { width: `${heatMapData.zones.middle}%`, backgroundColor: '#388E3C' }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.zoneStat}>
              <Text style={styles.zonePercentage}>{heatMapData.zones.attacking}%</Text>
              <Text style={styles.zoneLabel}>Attacking</Text>
              <View style={[styles.zoneBar, { backgroundColor: '#FF9800' }]}>
                <View 
                  style={[
                    styles.zoneBarFill, 
                    { width: `${heatMapData.zones.attacking}%`, backgroundColor: '#F57C00' }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Movement Statistics */}
      <View style={styles.movementStats}>
        <Text style={styles.movementStatsTitle}>Movement Analysis</Text>
        <View style={styles.movementStatsGrid}>
          <View style={styles.movementStat}>
            <Text style={styles.movementValue}>
              {(heatMapData.movementStats.distanceCovered / 1000).toFixed(1)}km
            </Text>
            <Text style={styles.movementLabel}>Distance</Text>
          </View>
          
          <View style={styles.movementStat}>
            <Text style={styles.movementValue}>
              {heatMapData.movementStats.averageSpeed.toFixed(1)} km/h
            </Text>
            <Text style={styles.movementLabel}>Avg Speed</Text>
          </View>
          
          <View style={styles.movementStat}>
            <Text style={styles.movementValue}>
              {heatMapData.movementStats.maxSpeed.toFixed(1)} km/h
            </Text>
            <Text style={styles.movementLabel}>Max Speed</Text>
          </View>
          
          <View style={styles.movementStat}>
            <Text style={styles.movementValue}>
              {heatMapData.movementStats.sprints}
            </Text>
            <Text style={styles.movementLabel}>Sprints</Text>
          </View>
        </View>
      </View>

      {/* Heat Map Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Heat Intensity</Text>
        <View style={styles.legendBar}>
          <View style={[styles.legendSegment, { backgroundColor: 'rgba(255, 255, 0, 0.3)' }]} />
          <View style={[styles.legendSegment, { backgroundColor: 'rgba(255, 165, 0, 0.4)' }]} />
          <View style={[styles.legendSegment, { backgroundColor: 'rgba(255, 69, 0, 0.5)' }]} />
          <View style={[styles.legendSegment, { backgroundColor: 'rgba(255, 0, 0, 0.6)' }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendLabel}>Low</Text>
          <Text style={styles.legendLabel}>High</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionBadge: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  intensityBadge: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  intensityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E676',
  },
  intensityLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pitchContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pitch: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
  },
  zoneStats: {
    marginBottom: 20,
  },
  zoneStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  zoneStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoneStat: {
    flex: 1,
    marginHorizontal: 4,
  },
  zonePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  zoneLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 6,
  },
  zoneBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  zoneBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  movementStats: {
    marginBottom: 20,
  },
  movementStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  movementStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  movementStat: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  movementValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 4,
  },
  movementLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  legend: {
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  legendBar: {
    flexDirection: 'row',
    width: 120,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  legendSegment: {
    flex: 1,
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
  },
  legendLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});