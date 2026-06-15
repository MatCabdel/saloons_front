import { SaloonType } from './saloonModel';

export type SaloonBrowseFilter = 'ALL' | 'CHAUD' | SaloonType;

export const MAX_DISTANCE_METERS = 25000;

export const SALOON_FILTER_TABS: { value: SaloonBrowseFilter; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CHAUD', label: 'Populaire' },
  { value: 'BAR', label: 'Bar' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'LOISIRS', label: 'Loisirs' },
  { value: 'DISCO', label: 'Disco' },
  // Filtre masqué temporairement, la logique TRAVAIL reste disponible.
  // { value: 'TRAVAIL', label: 'Travail' },
];

export function toSaloonTypeFilter(filter: SaloonBrowseFilter): SaloonType | null {
  return filter === 'ALL' || filter === 'CHAUD' ? null : filter;
}
