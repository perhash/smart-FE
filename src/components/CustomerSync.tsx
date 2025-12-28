import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerContext } from '@/contexts/CustomerContext';

/**
 * Component that syncs customers from API after user authentication
 * Only syncs for admin users (since riders don't need customer search)
 */
export const CustomerSync = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { syncCustomers, lastSync, loading } = useCustomerContext();

  useEffect(() => {
    // Only sync for authenticated admin users
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    // Sync customers if:
    // 1. Never synced before (lastSync is null)
    // 2. Last sync was more than 5 minutes ago (300000 ms)
    const shouldSync = !lastSync || (Date.now() - lastSync > 300000);

    if (shouldSync && !loading) {
      // Sync in background (don't block UI)
      syncCustomers().catch(error => {
        console.error('Background customer sync failed:', error);
        // Fail silently - cached data will still work
      });
    }
  }, [isAuthenticated, isAdmin, lastSync, loading, syncCustomers]);

  // This component doesn't render anything
  return null;
};

