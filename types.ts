export type SimType = 'jawwy' | 'sawa' | 'multi';
export type TransactionType = SimType | 'issue' | 'device';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Transaction {
  id: number;
  date: string;
  type: TransactionType;
  amount: number;
  quantity: number;
}

export interface StockLog {
  id: number;
  date: string;
  type: SimType;
  quantity: number;
  action: 'add' | 'return_company' | 'to_damaged' | 'recover' | 'flush';
}

export interface FuelLog {
  id: number;
  date: string;
  fuelType: '91' | '95' | 'diesel';
  amount: number;
  liters: number;
  km: number;
}

export interface StockState {
  jawwy: number;
  sawa: number;
  multi: number;
}

export interface PriceConfig {
  jawwy: [number, number, number]; // Tier 1, 2, 3
  sawa: [number, number, number];  // Tier 1, 2, 3
  multi: [number, number, number]; // Tier 1, 2, 3
}

export interface Settings {
  name: string;
  weeklyTarget: number;
  theme: 'light' | 'dark';
  preferredFuelType: '91' | '95' | 'diesel';
  priceConfig: PriceConfig;
}

// Data specific to a single user (Isolated)
export interface UserData {
  transactions: Transaction[];
  stock: StockState;
  damaged: StockState;
  stockLogs: StockLog[];
  fuelLogs: FuelLog[];
  settings: Settings;
  lastSync?: string; // Timestamp of last cloud sync
}

export interface DataContextType extends UserData {
  users: User[]; // List of all users (available to check login)
  currentUser: User | null;
  
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (id: number) => void;
  
  addTransaction: (type: TransactionType, amount: number, quantity: number) => void;
  removeTransaction: (id: number) => void;
  updateStock: (type: SimType, quantity: number, action: StockLog['action']) => void;
  addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  removeFuelLog: (id: number) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  importData: (json: string) => boolean;
  exportData: () => string;
  saveNow: () => void; // Manual save trigger
  
  // Cloud Sync
  isSyncing: boolean;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
}