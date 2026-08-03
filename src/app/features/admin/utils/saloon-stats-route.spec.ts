import { saloonStatsRoute } from './saloon-stats-route';

describe('saloonStatsRoute', () => {
  it('builds the unique admin detail route for a saloon', () => {
    expect(saloonStatsRoute(42)).toEqual(['/dashboard/saloons', 42, 'stats']);
  });
});
