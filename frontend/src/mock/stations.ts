import type { Station } from '@/types';

export const STATIONS: Station[] = [
  {
    id: 'maitri',
    code: 'MAI',
    name: 'Maitri Base (MAI-01)',
    region: 'Schirmacher Oasis',
    latitude: -70.7658,
    longitude: 11.7358,
    elevationM: 117,
    status: 'warning',
    healthScore: 87,
    lastSync: new Date(Date.now() - 8000).toISOString(),
  },
  {
    id: 'bharati',
    code: 'BHR',
    name: 'Bharati Base (BHR-02)',
    region: 'Larsemann Hills',
    latitude: -69.4,
    longitude: 76.19,
    elevationM: 48,
    status: 'operational',
    healthScore: 91,
    lastSync: new Date(Date.now() - 12000).toISOString(),
  },
];
