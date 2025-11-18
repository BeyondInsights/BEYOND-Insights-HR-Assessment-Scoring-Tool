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
    
    // Grid items per dimension
    const gridCounts = [0, 12, 17, 10, 10, 11, 12, 9, 12, 11, 20, 13, 8, 9];
    const gridCount = gridCounts[dimensionNumber];
    if (!gridCount) return 0;
    
    const gridKey = 'd' + dimensionNumber + 'a';
    const gridAnswers = dimData[gridKey] || {};
    const gridAnswered = Object.keys(gridAnswers).length;
    
    // Grid represents 90% of progress
    const gridProgress = (gridAnswered / gridCount) * 90;
    
    // Check if there are any other fields answered
    let hasOtherAnswers = false;
    const allKeys = Object.keys(dimData);
    for (let i = 0; i < allKeys.length; i++) {
      if (allKeys[i] !== gridKey && dimData[allKeys[i]] !== undefined && dimData[allKeys[i]] !== '') {
        hasOtherAnswers = true;
        break;
      }
    }
    
    // Add 10% if grid is complete and other questions answered
    let bonus = 0;
    if (gridAnswered === gridCount && hasOtherAnswers) {
      bonus = 10;
    }
    
    const total = Math.round(gridProgress + bonus);
    return total;
    
  } catch (e) {
    console.error('Progress error:', e);
    return 0;
  }
}
