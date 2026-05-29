export type TryOnSelectedProduct = {
  id: number;
  sanPhamId: number;
  tenSanPham: string;
  tenMauSac: string;
  tenKichThuoc: string;
  imageUrl: string;
  price: number;
  quantity: number;
};

const STORAGE_KEY = "try_on_selected_products";

const readItems = (): TryOnSelectedProduct[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TryOnSelectedProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeItems = (items: TryOnSelectedProduct[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const tryOnStorage = {
  getAll: readItems,
  setAll: writeItems,
  addItem: (item: TryOnSelectedProduct) => {
    const current = readItems();
    const existsIndex = current.findIndex((entry) => entry.id === item.id);
    if (existsIndex >= 0) {
      current[existsIndex] = item;
      writeItems(current);
      return current;
    }
    const next = [item, ...current];
    writeItems(next);
    return next;
  },
  removeItem: (id: number) => {
    const next = readItems().filter((item) => item.id !== id);
    writeItems(next);
    return next;
  },
  clear: () => writeItems([]),
};
