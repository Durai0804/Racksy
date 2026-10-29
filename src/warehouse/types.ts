export type StockStatus = 'EMPTY' | 'LOW' | 'NORMAL' | 'NEAR_CAPACITY' | 'CRITICAL';
export type MovementType = 'ADD' | 'REMOVE';

export interface ProductDto {
  sku: string;
  name: string;
  category: string;
}

export interface WarehouseContainer {
  shelfId: string;
  columnCode: string;
  level: number;
  product: ProductDto;
  currentStock: number;
  maxCapacity: number;
  occupancyPercentage: number;
  availableCapacity: number;
  status: StockStatus;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  type: MovementType;
  quantity: number;
  resultingStock: number;
  note: string | null;
  occurredAt: string;
}

export interface StockChangeRequest {
  quantity: number;
  note?: string;
}

export interface ApiErrorBody {
  title?: string;
  detail?: string;
  message?: string;
}
