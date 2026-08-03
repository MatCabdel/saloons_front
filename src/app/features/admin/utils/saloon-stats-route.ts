export function saloonStatsRoute(saloonId: number): (string | number)[] {
  return ['/dashboard/saloons', saloonId, 'stats'];
}
