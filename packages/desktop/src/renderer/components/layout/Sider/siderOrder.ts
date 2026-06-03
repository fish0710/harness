/**
 * Generic helpers for persisting and sorting items by stored order.
 * Used by TeamTabsContext to preserve teammate tab order.
 */

const STORE_SIDER_ORDER_KEY = 'sider-order';

export const readStoredSiderOrder = (key?: string): string[] => {
  try {
    const raw = localStorage.getItem(key ?? STORE_SIDER_ORDER_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const writeStoredSiderOrder = (key: string, ids: string[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // ignore
  }
};

export const sortSiderItemsByStoredOrder = <T>(params: {
  items: T[];
  storedOrder: string[];
  getId: (item: T) => string;
}): T[] => {
  const { items, storedOrder, getId } = params;
  const orderMap = new Map(storedOrder.map((id, index) => [id, index]));
  return [...items].toSorted((a, b) => {
    const aOrder = orderMap.get(getId(a));
    const bOrder = orderMap.get(getId(b));
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    return 0;
  });
};
