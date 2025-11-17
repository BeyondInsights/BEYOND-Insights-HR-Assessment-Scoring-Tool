/**
 * Calculate accurate progress for dimension sections
 * Properly counts grid items AND follow-up questions
 */

export function calculateDimensionProgress(dimensionNumber: number): number {
  const dimData = JSON.parse(localStorage.getItem(`dimension${dimensionNumber}_data`) || '{}');
  const complete = localStorage.getItem(`dimension${dimensionNumber}_complete`) === 'true';
  
  if (complete) return 100;
  if (Object.keys(dimData).length === 0) return 0;
  
  // Define expected items per dimension
  const DIMENSION_CONFIGS = {
    1: { gridKey: 'd1a', gridItems: 12, followUps: ['d1_1', 'd1_2', 'd1_4a', 'd1_4b', 'd1_5', 'd1_6'], other: ['d1aa', 'd1b'] },
    2: { gridKey: 'd2a', gridItems: 17, followUps: [], other: ['d2aa', 'd2b'] },
    3: { gridKey: 'd3a', gridItems: 10, followUps: ['d3_1', 'd3_1a'], other: ['d3aa', 'd3b'] },
    4: { gridKey: 'd4a', gridItems: 10, followUps: ['d4_1a', 'd4_1b'], other: ['d4aa', 'd4b'] },
    5: { gridKey: 'd5a', gridItems: 11, followUps: [], other: ['d5aa', 'd5b'] },
    6: { gridKey: 'd6a', gridItems: 12, followUps: ['d6_2'], other: ['d6aa', 'd6b'] },
    7: { gridKey: 'd7a', gridItems: 9, followUps: [], other: ['d7aa', 'd7b'] },
    8: { gridKey: 'd8a', gridItems: 12, followUps: [], other: ['d8aa', 'd8b'] },
    9: { gridKey: 'd9a', gridItems: 11, followUps: [], other: ['d9aa', 'd9b'] },
    10: { gridKey: 'd10a', gridItems: 19, followUps: [], other: ['d10aa', 'd10b'] },
    11: { gridKey: 'd11a', gridItems: 13, followUps: ['d11_1'], other: ['d11aa', 'd11b'] },
    12: { gridKey: 'd12a', gridItems: 8, followUps: ['d12_1', 'd12_2'], other: ['d12aa', 'd12b'] },
    13: { gridKey: 'd13a', gridItems: 9, followUps: ['d13_1'], other: ['d13aa', 'd13b'] }
  };
  
  const config = DIMENSION_CONFIGS[dimensionNumber as keyof typeof DIMENSION_CONFIGS];
  if (!config) return 0;
  
  let completedItems = 0;
  let totalItems = 0;
  
  // Count grid items (most important)
  const gridAnswers = dimData[config.gridKey] || {};
  const gridComplete = Object.keys(gridAnswers).length;
  completedItems += gridComplete;
  totalItems += config.gridItems;
  
  // Count follow-ups (conditional, so only count if they should appear)
  // For now, count all potential follow-ups as part of total
  config.followUps.forEach(key => {
    if (dimData[key]) completedItems++;
  });
  totalItems += config.followUps.length;
  
  // Count other fields (location indicator, text input)
  config.other.forEach(key => {
    if (dimData[key]) completedItems++;
  });
  totalItems += config.other.length;
  
  // Calculate percentage
  const percentage = Math.round((completedItems / totalItems) * 100);
  
  // Cap at 95% if not complete, to show there's still something left
  return Math.min(percentage, 95);
}
