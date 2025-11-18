export function calculateDimensionProgress(dimensionNumber: number): number {
  const dimData = JSON.parse(localStorage.getItem(`dimension${dimensionNumber}_data`) || '{}');
  const complete = localStorage.getItem(`dimension${dimensionNumber}_complete`) === 'true';
  
  if (complete) return 100;
  if (Object.keys(dimData).length === 0) return 0;
  
  const GRID_COUNTS: Record<number, number> = {
    1: 12, 2: 17, 3: 10, 4: 10, 5: 11, 6: 12, 7: 9,
    8: 12, 9: 11, 10: 20, 11: 13, 12: 8, 13: 9
  };
  
  const gridCount = GRID_COUNTS[dimensionNumber];
  if (!gridCount) return 0;
  
  const gridKey = `d${dimensionNumber}a`;
  const gridAnswers = dimData[gridKey] || {};
  const gridAnswered = Object.keys(gridAnswers).length;
  
  let completedItems = gridAnswered;
  let totalItems = gridCount;
  
  Object.keys(dimData).forEach(key => {
    if (key !== gridKey && dimData[key] !== undefined && dimData[key] !== '') {
      completedItems++;
      totalItems++;
    }
  });
  
  if (totalItems === 0) return 0;
  const percentage = Math.round((completedItems / totalItems) * 100);
  
  return Math.min(percentage, 95);
}
