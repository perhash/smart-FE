import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Dashboard API
  async getDashboardStats() {
    return this.request(API_ENDPOINTS.DASHBOARD_STATS);
  }

  async getRecentActivities() {
    return this.request(API_ENDPOINTS.DASHBOARD_ACTIVITIES);
  }

  // Orders API
  async getOrders(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`${API_ENDPOINTS.ORDERS}${params}`);
  }

  async getOrderById(id: string) {
    return this.request(API_ENDPOINTS.ORDER_BY_ID(id));
  }

  async createOrder(orderData: any) {
    return this.request(API_ENDPOINTS.ORDERS, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: string, status: string, riderId?: string) {
    return this.request(API_ENDPOINTS.ORDER_BY_ID(id), {
      method: 'PATCH',
      body: JSON.stringify({ status, riderId }),
    });
  }

  // Customers API
  async getCustomers(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`${API_ENDPOINTS.CUSTOMERS}${params}`);
  }

  async getCustomerById(id: string) {
    return this.request(API_ENDPOINTS.CUSTOMER_BY_ID(id));
  }

  async updateCustomer(id: string, customerData: any) {
    return this.request(API_ENDPOINTS.CUSTOMER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomerStatus(id: string, isActive: boolean) {
    return this.request(API_ENDPOINTS.CUSTOMER_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async createCustomer(customerData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CUSTOMERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();
      console.log('Raw API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Service Error:', error);
      throw error;
    }
  }

  // Riders API
  async getRiders() {
    return this.request(API_ENDPOINTS.RIDERS);
  }

  async getRiderById(id: string) {
    return this.request(API_ENDPOINTS.RIDER_BY_ID(id));
  }

  async getRiderDashboard(riderId: string) {
    return this.request(API_ENDPOINTS.RIDER_DASHBOARD(riderId));
  }

  async createRider(riderData: any) {
    return this.request(API_ENDPOINTS.RIDERS, {
      method: 'POST',
      body: JSON.stringify(riderData),
    });
  }

  async updateRider(id: string, riderData: any) {
    return this.request(API_ENDPOINTS.RIDER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(riderData),
    });
  }

  async updateRiderStatus(id: string, isActive: boolean) {
    return this.request(`${API_ENDPOINTS.RIDER_BY_ID(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteRider(id: string) {
    return this.request(API_ENDPOINTS.RIDER_BY_ID(id), {
      method: 'DELETE',
    });
  }

  // Payments API
  async getPayments(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`${API_ENDPOINTS.PAYMENTS}${params}`);
  }

  async updatePaymentStatus(id: string, paymentData: any) {
    return this.request(API_ENDPOINTS.PAYMENT_BY_ID(id), {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  }

  // Connection test
  async testConnection() {
    return this.request(API_ENDPOINTS.TEST);
  }

  async healthCheck() {
    return this.request(API_ENDPOINTS.HEALTH);
  }
}

export const apiService = new ApiService();
