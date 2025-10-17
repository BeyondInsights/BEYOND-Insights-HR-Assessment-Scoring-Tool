export function getOfferedStatus(dimensionNumber: number): string {
  switch (dimensionNumber) {
    case 3:
      return "Currently provide to managers";
    case 12:
      return "Currently measure / track";
    default:
      return "Currently offer";
  }
}

export function hasAnyOffered(dimensionData: any, dimensionNumber: number): boolean {
  const offeredStatus = getOfferedStatus(dimensionNumber);
  return Object.values(dimensionData || {}).some(
    (status) => status === offeredStatus
  );
}
