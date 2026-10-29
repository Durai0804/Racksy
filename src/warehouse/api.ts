import type { ApiErrorBody, StockChangeRequest, StockMovement, WarehouseContainer } from './types';

const API_ROOT = '/api/warehouse/containers';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    let body: ApiErrorBody = {};
    try { body = await response.json() as ApiErrorBody; } catch { /* API may return an empty error body. */ }
    throw new Error(body.detail ?? body.message ?? body.title ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const warehouseApi = {
  list: () => request<WarehouseContainer[]>(''),
  detail: (shelfId: string) => request<WarehouseContainer>(`/${encodeURIComponent(shelfId)}`),
  movements: (shelfId: string) => request<StockMovement[]>(`/${encodeURIComponent(shelfId)}/movements`),
  addStock: (shelfId: string, payload: StockChangeRequest) => request<WarehouseContainer>(`/${encodeURIComponent(shelfId)}/stock/add`, { method: 'POST', body: JSON.stringify(payload) }),
  removeStock: (shelfId: string, payload: StockChangeRequest) => request<WarehouseContainer>(`/${encodeURIComponent(shelfId)}/stock/remove`, { method: 'POST', body: JSON.stringify(payload) }),
};
