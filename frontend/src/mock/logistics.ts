import type { InventoryItem, LogisticsOverview } from '@/types';

const now = new Date().toISOString();

export const MAITRI_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-001', stationId: 'maitri', itemName: 'Arctic Diesel', category: 'fuel',
    quantity: 38200, unit: 'L', consumptionRate: 2218, consumptionUnit: 'L/day',
    estimatedDaysRemaining: 17.2, reorderThreshold: 16800, status: 'warning',
  },
  {
    id: 'INV-002', stationId: 'maitri', itemName: 'Anti-freeze Glycol', category: 'technical',
    quantity: 3400, unit: 'L', consumptionRate: 12, consumptionUnit: 'L/week',
    estimatedDaysRemaining: 198, reorderThreshold: 500, status: 'normal',
  },
  {
    id: 'INV-003', stationId: 'maitri', itemName: 'Arctic Rations', category: 'food',
    quantity: 4260, unit: 'packs', consumptionRate: 30, consumptionUnit: 'packs/day',
    estimatedDaysRemaining: 142, reorderThreshold: 300, status: 'normal',
  },
  {
    id: 'INV-004', stationId: 'maitri', itemName: 'Food Supplies', category: 'food',
    quantity: 860, unit: 'kg', consumptionRate: 47.8, consumptionUnit: 'kg/day',
    estimatedDaysRemaining: 18, reorderThreshold: 200, status: 'warning',
  },
  {
    id: 'INV-005', stationId: 'maitri', itemName: 'Medical Supplies', category: 'medical',
    quantity: 94, unit: 'units', consumptionRate: 2.2, consumptionUnit: 'units/day',
    estimatedDaysRemaining: 42, reorderThreshold: 30, status: 'normal',
  },
  {
    id: 'INV-006', stationId: 'maitri', itemName: 'HVAC Filters', category: 'spares',
    quantity: 12, unit: 'units', consumptionRate: 1.33, consumptionUnit: 'units/day',
    estimatedDaysRemaining: 9, reorderThreshold: 6, status: 'warning',
  },
  {
    id: 'INV-007', stationId: 'maitri', itemName: 'Spare Turbine Fuel Injectors', category: 'spares',
    quantity: 2, unit: 'units', consumptionRate: 0, consumptionUnit: 'units/day',
    estimatedDaysRemaining: 0, reorderThreshold: 4, status: 'critical',
  },
  {
    id: 'INV-008', stationId: 'maitri', itemName: 'Potable Water', category: 'water',
    quantity: 12400, unit: 'L', consumptionRate: 120, consumptionUnit: 'L/day',
    estimatedDaysRemaining: 103, reorderThreshold: 2000, status: 'normal',
  },
  {
    id: 'INV-009', stationId: 'maitri', itemName: 'Lubricant Oil', category: 'technical',
    quantity: 420, unit: 'L', consumptionRate: 7, consumptionUnit: 'L/day',
    estimatedDaysRemaining: 60, reorderThreshold: 50, status: 'normal',
  },
];

export const MAITRI_LOGISTICS: LogisticsOverview = {
  inventory: MAITRI_INVENTORY,
  resupply: {
    vessel: 'Akademik Fedorov',
    etaDays: 24,
    status: 'EN ROUTE — ICE PACK DEPENDENT',
    fuelGapDays: 6.8,
  },
  fuelEnduranceDays: 17.2,
  fuelBurnLpd: 2218,
};

export const BHARATI_INVENTORY: InventoryItem[] = [
  {
    id: 'BHR-INV-001', stationId: 'bharati', itemName: 'Arctic Diesel', category: 'fuel',
    quantity: 44600, unit: 'L', consumptionRate: 1824, consumptionUnit: 'L/day',
    estimatedDaysRemaining: 24.1, reorderThreshold: 16800, status: 'normal',
  },
  {
    id: 'BHR-INV-002', stationId: 'bharati', itemName: 'Arctic Rations', category: 'food',
    quantity: 3800, unit: 'packs', consumptionRate: 25, consumptionUnit: 'packs/day',
    estimatedDaysRemaining: 152, reorderThreshold: 200, status: 'normal',
  },
  {
    id: 'BHR-INV-003', stationId: 'bharati', itemName: 'HVAC Filters', category: 'spares',
    quantity: 6, unit: 'units', consumptionRate: 1, consumptionUnit: 'units/day',
    estimatedDaysRemaining: 6, reorderThreshold: 8, status: 'warning',
  },
];

export const BHARATI_LOGISTICS: LogisticsOverview = {
  inventory: BHARATI_INVENTORY,
  resupply: {
    vessel: 'MV Svalbard',
    etaDays: 18,
    status: 'SCHEDULED',
    fuelGapDays: 0,
  },
  fuelEnduranceDays: 24.1,
  fuelBurnLpd: 1824,
};

export function getLogistics(stationId: string): LogisticsOverview {
  return stationId === 'maitri' ? MAITRI_LOGISTICS : BHARATI_LOGISTICS;
}
