import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { indexedDBService, IndexedDBService, Customer } from '@/services/indexedDB';
import { apiService } from '@/services/api';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  syncing: boolean;
  lastSync: number | null;
  searchCustomers: (query: string) => Promise<Customer[]>;
  getCustomerBalance: (customerId: string) => Promise<number>;
  syncCustomers: () => Promise<void>;
  refreshCustomer: (customerId: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerContext must be used within CustomerProvider');
  }
  return context;
};

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  // Initialize IndexedDB and load cached customers
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!IndexedDBService.isAvailable()) {
          console.warn('IndexedDB is not available');
          setLoading(false);
          return;
        }

        await indexedDBService.init();
        
        // Load cached customers
        const cachedCustomers = await indexedDBService.getAllCustomers();
        setCustomers(cachedCustomers);
        
        // Get last sync timestamp
        const timestamp = await indexedDBService.getLastSyncTimestamp();
        setLastSync(timestamp);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Sync customers from API
  const syncCustomers = useCallback(async () => {
    if (syncing) return;
    
    try {
      setSyncing(true);
      const response = await apiService.getCustomers();
      
      if ((response as any)?.success) {
        const apiCustomers = (response as any).data.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          whatsapp: customer.whatsapp,
          houseNo: customer.houseNo,
          streetNo: customer.streetNo,
          area: customer.area,
          city: customer.city,
          address: customer.address,
          bottleCount: customer.bottleCount,
          avgDaysToRefill: customer.avgDaysToRefill,
          isActive: customer.isActive,
          // Don't store balance from sync - fetch fresh on selection
          currentBalance: undefined,
          balanceLastUpdated: undefined,
        }));

        // Store in IndexedDB
        if (IndexedDBService.isAvailable()) {
          await indexedDBService.storeCustomers(apiCustomers);
        }

        // Update state
        setCustomers(apiCustomers);
        setLastSync(Date.now());
      }
    } catch (error) {
      console.error('Error syncing customers:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Search customers with fallback
  const searchCustomers = useCallback(async (query: string): Promise<Customer[]> => {
    if (!query.trim()) {
      return customers;
    }

    const trimmedQuery = query.trim();
    
    // Only search if query is at least 2 characters (avoid too many API calls)
    if (trimmedQuery.length < 2) {
      return [];
    }

    try {
      // Step 1: Search IndexedDB first (fast)
      let localResults: Customer[] = [];
      if (IndexedDBService.isAvailable()) {
        localResults = await indexedDBService.searchCustomers(trimmedQuery);
        
        // If we found results locally, return them immediately
        if (localResults.length > 0) {
          return localResults;
        }
      }

      // Step 2: Determine if we should fallback to API
      // Always fallback to API unless cache was JUST synced (within 30 seconds)
      // This ensures we check for new customers most of the time
      const cacheIsVeryFresh = 
        lastSync && 
        customers.length > 0 && 
        (Date.now() - lastSync < 30000); // 30 seconds

      // Only skip API call if cache was JUST synced (within 30 seconds)
      // Otherwise, always fallback to ensure we catch new customers
      if (cacheIsVeryFresh) {
        // Cache was just synced, trust the empty result
        return [];
      }

      // Step 3: Fallback to database search
      try {
        const response = await apiService.searchCustomers(trimmedQuery);
        
        if ((response as any)?.success) {
          const apiResults = (response as any).data.map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            houseNo: customer.houseNo,
            streetNo: customer.streetNo,
            area: customer.area,
            city: customer.city,
            address: customer.address,
            bottleCount: customer.bottleCount,
            avgDaysToRefill: customer.avgDaysToRefill,
            isActive: customer.isActive,
            currentBalance: customer.currentBalance,
            balanceLastUpdated: Date.now(),
          }));

          // Add newly found customers to IndexedDB (self-healing)
          if (IndexedDBService.isAvailable() && apiResults.length > 0) {
            for (const customer of apiResults) {
              await indexedDBService.upsertCustomer(customer);
            }
          }

          // Update local state if new customers found
          if (apiResults.length > 0) {
            setCustomers(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const newCustomers = apiResults.filter(c => !existingIds.has(c.id));
              return [...prev, ...newCustomers];
            });
          }

          return apiResults;
        }

        // If API returns empty array, return empty (no customers found)
        return [];
      } catch (apiError) {
        console.error('Error in fallback search:', apiError);
        // If API fails, return empty array (graceful degradation)
        return [];
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }, [customers, lastSync]);

  // Get customer balance (fetch fresh from API)
  const getCustomerBalance = useCallback(async (customerId: string): Promise<number> => {
    try {
      const response = await apiService.getCustomerById(customerId);
      
      if ((response as any)?.success) {
        const customer = (response as any).data;
        const balance = parseFloat(customer.currentBalance || 0);

        // Update balance in IndexedDB
        if (IndexedDBService.isAvailable()) {
          await indexedDBService.updateCustomerBalance(customerId, balance);
        }

        // Update local state
        setCustomers(prev =>
          prev.map(c =>
            c.id === customerId
              ? { ...c, currentBalance: balance, balanceLastUpdated: Date.now() }
              : c
          )
        );

        return balance;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching customer balance:', error);
      // Return cached balance if available
      const cachedCustomer = customers.find(c => c.id === customerId);
      return cachedCustomer?.currentBalance || 0;
    }
  }, [customers]);

  // Refresh a single customer from API
  const refreshCustomer = useCallback(async (customerId: string) => {
    try {
      const response = await apiService.getCustomerById(customerId);
      
      if ((response as any)?.success) {
        const apiCustomer = (response as any).data;
        const updatedCustomer: Customer = {
          id: apiCustomer.id,
          name: apiCustomer.name,
          phone: apiCustomer.phone,
          whatsapp: apiCustomer.whatsapp,
          houseNo: apiCustomer.houseNo,
          streetNo: apiCustomer.streetNo,
          area: apiCustomer.area,
          city: apiCustomer.city,
          address: apiCustomer.address,
          bottleCount: apiCustomer.bottleCount,
          avgDaysToRefill: apiCustomer.avgDaysToRefill,
          isActive: apiCustomer.isActive,
          currentBalance: parseFloat(apiCustomer.currentBalance || 0),
          balanceLastUpdated: Date.now(),
        };

        // Update IndexedDB
        if (IndexedDBService.isAvailable()) {
          await indexedDBService.upsertCustomer(updatedCustomer);
        }

        // Update local state
        setCustomers(prev =>
          prev.map(c => (c.id === customerId ? updatedCustomer : c))
        );
      }
    } catch (error) {
      console.error('Error refreshing customer:', error);
    }
  }, []);

  const value: CustomerContextType = {
    customers,
    loading,
    syncing,
    lastSync,
    searchCustomers,
    getCustomerBalance,
    syncCustomers,
    refreshCustomer,
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};

