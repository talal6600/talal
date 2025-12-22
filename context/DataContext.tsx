import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { DataContextType, FuelLog, Settings, SimType, StockLog, StockState, Transaction, TransactionType, User, UserData } from '../types';
import { USERS_KEY, SESSION_KEY, DATA_PREFIX, API_URL } from '../constants';

// --- DEFAULTS ---

const defaultAdmin: User = {
  id: 1,
  username: 'talal',
  password: '00966',
  name: 'المدير طلال',
  role: 'admin'
};

const defaultUser: User = {
  id: 2,
  username: 'khaled',
  password: '2030',
  name: 'المندوب خالد',
  role: 'user'
};

const getInitialUserData = (): UserData => ({
  transactions: [],
  stock: { jawwy: 0, sawa: 0, multi: 0 },
  damaged: { jawwy: 0, sawa: 0, multi: 0 },
  stockLogs: [],
  fuelLogs: [],
  settings: { 
      name: 'المندوب', 
      weeklyTarget: 3000, 
      theme: 'light', 
      preferredFuelType: '91',
      priceConfig: {
          jawwy: [30, 25, 20],
          sawa: [28, 24, 20],
          multi: [28, 24, 20]
      }
  },
});

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global State (Users List) - Added Khaled to defaults
  const [users, setUsers] = useState<User[]>([defaultAdmin, defaultUser]);
  
  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // User Data State (Isolated)
  const [userData, setUserData] = useState<UserData>(getInitialUserData());
  
  // Flags
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false); 
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref to track if the initial cloud load has happened to prevent overwriting cloud with empty local state on first load
  const hasSyncedOnce = useRef(false);

  // --- Helpers ---

  const readUserDataFromStorage = (username: string): UserData => {
      const key = DATA_PREFIX + username;
      const savedData = localStorage.getItem(key);
      const initial = getInitialUserData();
      
      if (savedData) {
          try {
              const parsed = JSON.parse(savedData);
              // Handle legacy settings without priceConfig
              const mergedSettings = { ...initial.settings, ...parsed.settings };
              
              // Ensure all price configs exist (merge deep)
              if (!mergedSettings.priceConfig) mergedSettings.priceConfig = initial.settings.priceConfig;
              if (!mergedSettings.priceConfig.multi) mergedSettings.priceConfig.multi = initial.settings.priceConfig.multi;

              return { 
                  ...initial, 
                  ...parsed, 
                  settings: mergedSettings
              };
          } catch (e) {
              console.error("Failed to parse user data", e);
              return initial;
          }
      }
      return {
          ...initial,
          settings: { ...initial.settings, name: username }
      };
  };

  // 1. Load Users & Session
  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_KEY);
    // Initialize with defaults, but if local storage has data, merge or use it
    let loadedUsers = [defaultAdmin, defaultUser];

    if (savedUsers) {
        try {
            const parsed = JSON.parse(savedUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Ensure Khaled exists even if loading from old localStorage
                if (!parsed.find((u: User) => u.username === 'khaled')) {
                    parsed.push(defaultUser);
                }
                loadedUsers = parsed;
            }
        } catch (e) { console.error("Error loading users", e); }
    }
    setUsers(loadedUsers);

    const savedSessionUsername = localStorage.getItem(SESSION_KEY);
    if (savedSessionUsername) {
        const user = loadedUsers.find(u => u.username === savedSessionUsername);
        if (user) {
            const userSpecificData = readUserDataFromStorage(user.username);
            setUserData(userSpecificData);
            setIsDataReady(true);
            setCurrentUser(user);
        }
    }

    setIsLoaded(true);
  }, []);

  // 2. Persist Users
  useEffect(() => {
      if (isLoaded) {
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
  }, [users, isLoaded]);

  // 3. Persist User Data (Local Storage)
  useEffect(() => {
      if (isLoaded && currentUser && isDataReady) {
          const key = DATA_PREFIX + currentUser.username;
          localStorage.setItem(key, JSON.stringify(userData));
      }
  }, [userData, currentUser, isLoaded, isDataReady]);


  // --- CLOUD SYNC ---

  const syncToCloud = async (): Promise<boolean> => {
      if (!currentUser) return false;
      setIsSyncing(true);
      try {
          const payload = {
              username: currentUser.username,
              data: { ...userData, lastSync: new Date().toISOString() },
              // IMPORTANT: If admin, we sync the globalUsers list too so other devices can find it
              globalUsers: currentUser.role === 'admin' ? users : undefined
          };

          // FIX: Use text/plain to avoid CORS preflight issues with Google Apps Script
          await fetch(API_URL, {
              method: 'POST',
              headers: {
                  'Content-Type': 'text/plain;charset=utf-8',
              },
              body: JSON.stringify(payload)
          });
          
          setUserData(prev => ({ ...prev, lastSync: new Date().toISOString() }));
          return true;
      } catch (e) {
          console.error("Cloud upload failed", e);
          return false;
      } finally {
          setIsSyncing(false);
      }
  };

  const syncFromCloud = async (): Promise<boolean> => {
      if (!currentUser) return false;
      setIsSyncing(true);
      try {
          // FIX: Add timestamp to URL to prevent browser caching (Cache Busting)
          const response = await fetch(`${API_URL}?username=${currentUser.username}&t=${new Date().getTime()}`);
          const json = await response.json();
          
          if (json.error) {
              console.warn("User not found on cloud");
              return false;
          }

          // Handle Global Users update (for Admin syncing across devices)
          if (json.globalUsers && Array.isArray(json.globalUsers) && currentUser.role === 'admin') {
               setUsers(prev => {
                   // Merge logic if needed, or replace. Here we replace to keep sync.
                   // Ensure default user stays or is included in the cloud list
                   return json.globalUsers;
               });
          }

          if (json && (json.transactions || json.data)) {
              const dataToLoad = json.data || json;
              // Ensure settings merge correctly with defaults
              const initial = getInitialUserData();
              const mergedSettings = { ...initial.settings, ...dataToLoad.settings };
               
              // Deep merge price config
              if (!mergedSettings.priceConfig) mergedSettings.priceConfig = initial.settings.priceConfig;
              if (!mergedSettings.priceConfig.multi) mergedSettings.priceConfig.multi = initial.settings.priceConfig.multi;

              setUserData(prev => ({
                  ...prev,
                  ...dataToLoad,
                  settings: mergedSettings
              }));
              hasSyncedOnce.current = true;
              return true;
          }
          return false;
      } catch (e) {
          console.error("Cloud download failed", e);
          return false;
      } finally {
          setIsSyncing(false);
      }
  };

  // --- Auto-Sync on App Open / Device Switch ---
  useEffect(() => {
      if (currentUser && isLoaded) {
          // Force fetch from cloud when app opens to ensure PC matches Phone
          console.log("Checking for cloud updates...");
          syncFromCloud();
      }
  }, [currentUser, isLoaded]);


  // --- Methods ---

  const login = async (username: string, pass: string): Promise<boolean> => {
      // 1. Check Local Storage first
      let currentUsersList = users;
      const storedUsers = localStorage.getItem(USERS_KEY);
      if (storedUsers) {
          try { currentUsersList = JSON.parse(storedUsers); setUsers(currentUsersList); } catch(e) {}
      }

      let user = currentUsersList.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
      
      // 2. If NOT found locally, Check Cloud (Fetch from 'talal' / Admin account)
      if (!user) {
          console.log("User not found locally, checking cloud...");
          try {
             // FIX: Add timestamp to prevent caching when looking up new users
             // We fetch the main admin 'talal' data because it contains the globalUsers list
             const response = await fetch(`${API_URL}?username=talal&t=${new Date().getTime()}`);
             const json = await response.json();
             
             if (json && json.globalUsers && Array.isArray(json.globalUsers)) {
                 const cloudUsers = json.globalUsers as User[];
                 // Try to find the user in the cloud list
                 const cloudUser = cloudUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
                 
                 if (cloudUser) {
                     // Found! Update local users list and proceed
                     console.log("User found in cloud!");
                     user = cloudUser;
                     const newUsersList = [...currentUsersList.filter(u => u.username !== 'talal'), ...cloudUsers]; 
                     // Deduplicate based on username
                     const uniqueUsers = Array.from(new Map(newUsersList.map(item => [item.username, item])).values());
                     
                     setUsers(uniqueUsers);
                     localStorage.setItem(USERS_KEY, JSON.stringify(uniqueUsers));
                 }
             }
          } catch (e) {
              console.error("Failed to fetch users from cloud", e);
          }
      }

      if (user) {
          const userSpecificData = readUserDataFromStorage(user.username);
          setUserData(userSpecificData);
          setIsDataReady(true);
          setCurrentUser(user);
          localStorage.setItem(SESSION_KEY, user.username);
          // Trigger an immediate fetch from cloud for this specific user data
          setTimeout(() => syncFromCloud(), 100); 
          return true;
      }
      return false;
  };

  const logout = () => {
      setIsDataReady(false);
      hasSyncedOnce.current = false;
      localStorage.removeItem(SESSION_KEY); 
      setCurrentUser(null);
      setUserData(getInitialUserData()); 
  };

  const addUser = (userInputs: Omit<User, 'id'>) => {
      if (users.some(u => u.username.toLowerCase() === userInputs.username.toLowerCase())) {
          alert('اسم المستخدم موجود مسبقاً');
          return;
      }
      const newUser = { ...userInputs, id: Date.now() };
      setUsers(prev => [...prev, newUser]);
      // Note: The useEffect will trigger syncToCloud automatically when 'users' changes
  };

  const deleteUser = (id: number) => {
      if (id === 1 || id === 2) { // Prevent deleting default Admin and default User Khaled
          alert('لا يمكن حذف المستخدمين الأساسيين');
          return;
      }
      const userToDelete = users.find(u => u.id === id);
      if (userToDelete) {
          localStorage.removeItem(DATA_PREFIX + userToDelete.username);
      }
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  const saveNow = () => {
      if (currentUser && isDataReady) {
          const key = DATA_PREFIX + currentUser.username;
          localStorage.setItem(key, JSON.stringify(userData));
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          syncToCloud(); // Force cloud sync on manual save
      }
  };

  // --- AUTO SAVE EFFECT ---
  useEffect(() => {
    if (!currentUser || !isDataReady) return;

    const autoSaveTimer = setTimeout(() => {
        console.log("Auto-saving to cloud...");
        syncToCloud();
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
    
    // CRITICAL FIX: Added 'users' to dependency array. 
    // Now when admin adds a user, this effect fires, and syncToCloud uploads the new 'users' list.
  }, [
      userData.transactions, 
      userData.stock, 
      userData.damaged, 
      userData.stockLogs, 
      userData.fuelLogs, 
      userData.settings,
      users, 
      currentUser
  ]);


  // --- Data Operations ---

  const addTransaction = (type: TransactionType, amount: number, quantity: number) => {
    const newTx: Transaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type,
      amount,
      quantity,
    };
    setUserData(prev => {
      const newStock = { ...prev.stock };
      // Only deduct stock for SimTypes, not for 'issue' or 'device'
      if (type === 'jawwy' || type === 'sawa' || type === 'multi') {
          newStock[type] -= quantity;
      }
      return { ...prev, transactions: [newTx, ...prev.transactions], stock: newStock };
    });
  };

  const removeTransaction = (id: number) => {
    setUserData(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;
      const newStock = { ...prev.stock };
      if (tx.type === 'jawwy' || tx.type === 'sawa' || tx.type === 'multi') {
          newStock[tx.type] += tx.quantity; 
      }
      return { ...prev, transactions: prev.transactions.filter(t => t.id !== id), stock: newStock };
    });
  };

  const updateStock = (type: SimType, quantity: number, action: StockLog['action']) => {
    setUserData(prev => {
      const newStock = { ...prev.stock };
      const newDamaged = { ...prev.damaged };
      
      if (action === 'add') newStock[type] += quantity;
      else if (action === 'return_company') newStock[type] -= quantity;
      else if (action === 'to_damaged') { newStock[type] -= quantity; newDamaged[type] += quantity; }
      else if (action === 'recover') { newDamaged[type] -= quantity; newStock[type] += quantity; }
      else if (action === 'flush') { newDamaged[type] -= quantity; }

      const log: StockLog = {
        id: Date.now(),
        date: new Date().toISOString(),
        type,
        quantity,
        action,
      };

      return { ...prev, stock: newStock, damaged: newDamaged, stockLogs: [log, ...prev.stockLogs] };
    });
  };

  const addFuelLog = (log: Omit<FuelLog, 'id'>) => {
    setUserData(prev => ({ ...prev, fuelLogs: [{ ...log, id: Date.now() }, ...prev.fuelLogs] }));
  };

  const removeFuelLog = (id: number) => {
    setUserData(prev => ({ ...prev, fuelLogs: prev.fuelLogs.filter(f => f.id !== id) }));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setUserData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  };

  // --- Export / Import ---

  const importData = (json: string): boolean => {
    try {
      let parsed;
      try { parsed = JSON.parse(json); } 
      catch { try { parsed = JSON.parse(atob(json)); } catch(e) { return false; } }

      if (parsed.globalUsers && Array.isArray(parsed.globalUsers)) {
          if (currentUser?.role === 'admin') {
              setUsers(parsed.globalUsers);
              localStorage.setItem(USERS_KEY, JSON.stringify(parsed.globalUsers));
          }
      }

      if (parsed.data || (parsed.transactions && Array.isArray(parsed.transactions))) {
        const dataToLoad = parsed.data || parsed;
        const initial = getInitialUserData();
        setUserData({ ...initial, ...dataToLoad, settings: { ...initial.settings, ...dataToLoad.settings } });
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const exportData = () => {
      if (currentUser?.role === 'admin') {
          return JSON.stringify({
              meta: { type: 'full_backup', date: new Date().toISOString() },
              globalUsers: users,
              data: userData
          });
      }
      return JSON.stringify(userData);
  };

  if (!isLoaded) return null;

  return (
    <DataContext.Provider value={{
      ...userData,
      users,
      currentUser,
      login,
      logout,
      addUser,
      deleteUser,
      addTransaction,
      removeTransaction,
      updateStock,
      addFuelLog,
      removeFuelLog,
      updateSettings,
      importData,
      exportData,
      saveNow,
      isSyncing,
      syncToCloud,
      syncFromCloud
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};