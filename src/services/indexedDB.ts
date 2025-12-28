// IndexedDB service for customer data caching

const DB_NAME = 'SmartSupplyDB';
const DB_VERSION = 1;
const CUSTOMER_STORE = 'customers';
const SYNC_METADATA_STORE = 'syncMetadata';

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  houseNo?: string;
  streetNo?: string;
  area?: string;
  city?: string;
  address?: string;
  bottleCount?: number;
  avgDaysToRefill?: number;
  isActive?: boolean;
  currentBalance?: number;
  balanceLastUpdated?: number; // timestamp
}

interface SyncMetadata {
  key: 'lastSync';
  value: number; // timestamp
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create customers object store
        if (!db.objectStoreNames.contains(CUSTOMER_STORE)) {
          const customerStore = db.createObjectStore(CUSTOMER_STORE, { keyPath: 'id' });
          customerStore.createIndex('name', 'name', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('whatsapp', 'whatsapp', { unique: false });
          customerStore.createIndex('houseNo', 'houseNo', { unique: false });
        }

        // Create sync metadata store
        if (!db.objectStoreNames.contains(SYNC_METADATA_STORE)) {
          db.createObjectStore(SYNC_METADATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Store customers in IndexedDB
  async storeCustomers(customers: Customer[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([CUSTOMER_STORE], 'readwrite');
    const store = transaction.objectStore(CUSTOMER_STORE);

    // Clear existing data
    await store.clear();

    // Add all customers
    const promises = customers.map(customer => store.put(customer));
    await Promise.all(promises);

    // Update sync timestamp
    await this.updateSyncTimestamp();
  }

  // Add or update a single customer
  async upsertCustomer(customer: Customer): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([CUSTOMER_STORE], 'readwrite');
    const store = transaction.objectStore(CUSTOMER_STORE);
    await store.put(customer);
  }

  // Search customers locally
  async searchCustomers(query: string): Promise<Customer[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([CUSTOMER_STORE], 'readonly');
    const store = transaction.objectStore(CUSTOMER_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const customers = request.result as Customer[];
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
          resolve(customers);
          return;
        }

        const filtered = customers.filter(customer => {
          const name = (customer.name || '').toLowerCase();
          const phone = (customer.phone || '').toLowerCase();
          const whatsapp = (customer.whatsapp || '').toLowerCase();
          const houseNo = (customer.houseNo || '').toLowerCase();
          const address = (customer.address || '').toLowerCase();

          return (
            name.includes(lowerQuery) ||
            phone.includes(lowerQuery) ||
            whatsapp.includes(lowerQuery) ||
            houseNo.includes(lowerQuery) ||
            address.includes(lowerQuery)
          );
        });

        resolve(filtered);
      };
    });
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([CUSTOMER_STORE], 'readonly');
    const store = transaction.objectStore(CUSTOMER_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([CUSTOMER_STORE], 'readonly');
    const store = transaction.objectStore(CUSTOMER_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  // Update customer balance
  async updateCustomerBalance(id: string, balance: number): Promise<void> {
    const customer = await this.getCustomerById(id);
    if (customer) {
      customer.currentBalance = balance;
      customer.balanceLastUpdated = Date.now();
      await this.upsertCustomer(customer);
    }
  }

  // Clear all customers
  async clearCustomers(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([CUSTOMER_STORE], 'readwrite');
    const store = transaction.objectStore(CUSTOMER_STORE);
    await store.clear();
  }

  // Update sync timestamp
  private async updateSyncTimestamp(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([SYNC_METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_METADATA_STORE);
    await store.put({ key: 'lastSync', value: Date.now() });
  }

  // Get last sync timestamp
  async getLastSyncTimestamp(): Promise<number | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([SYNC_METADATA_STORE], 'readonly');
    const store = transaction.objectStore(SYNC_METADATA_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get('lastSync');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as SyncMetadata | undefined;
        resolve(result?.value || null);
      };
    });
  }

  // Check if IndexedDB is available
  static isAvailable(): boolean {
    return 'indexedDB' in window;
  }
}

export const indexedDBService = new IndexedDBService();
export { IndexedDBService };
export type { Customer };

