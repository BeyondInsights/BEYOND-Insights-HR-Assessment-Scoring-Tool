export function calculateDimensionProgress(dimensionNumber: number): number {
  try {
    const dataKey = 'dimension' + dimensionNumber + '_data';
    const completeKey = 'dimension' + dimensionNumber + '_complete';
    
    const rawData = localStorage.getItem(dataKey);
    const isComplete = localStorage.getItem(completeKey);
    
    if (isComplete === 'true') return 100;
    if (!rawData) return 0;
    
    const dimData = JSON.parse(rawData);
    if (Object.keys(dimData).length === 0) return 0;
    
    const gridCounts = [0, 12, 17, 10, 10, 11, 12, 9, 12, 11, 20, 13, 8, 9];
    const gridCount = gridCounts[dimensionNumber];
    if (!gridCount) return 0;
    
    const gridKey = 'd' + dimensionNumber + 'a';
    const gridAnswers = dimData[gridKey] || {};
    const gridAnswered = Object.keys(gridAnswers).length;
    
    let completed = gridAnswered;
    let total = gridCount;
    
    const allKeys = Object.keys(dimData);
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      if (key !== gridKey && dimData[key] !== undefined && dimData[key] !== '') {
        completed++;
        total++;
      }
    }
    
    if (total === 0) return 0;
    const pct = Math.round((completed / total) * 100);
    return pct > 95 ? 95 : pct;
    
  } catch (e) {
    console.error('Progress calc error:', e);
    return 0;
  }
}
