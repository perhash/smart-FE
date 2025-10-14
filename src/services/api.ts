const API_BASE_URL = 'http://localhost:5000/api';

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
    return this.request('/dashboard/stats');
  }

  async getRecentActivities() {
    return this.request('/dashboard/activities');
  }

  // Orders API
  async getOrders(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/orders${params}`);
  }

  async getOrderById(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: string, status: string, riderId?: string) {
    return this.request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, riderId }),
    });
  }

  // Customers API
  async getCustomers(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/customers${params}`);
  }

  async getCustomerById(id: string) {
    return this.request(`/customers/${id}`);
  }

  async updateCustomer(id: string, customerData: any) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomerStatus(id: string, isActive: boolean) {
    return this.request(`/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async createCustomer(customerData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
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
    return this.request('/riders');
  }

  async getRiderById(id: string) {
    return this.request(`/riders/${id}`);
  }

  async getRiderDashboard(riderId: string) {
    return this.request(`/riders/${riderId}/dashboard`);
  }

  // Payments API
  async getPayments(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/payments${params}`);
  }

  async updatePaymentStatus(id: string, paymentData: any) {
    return this.request(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  }

  // Connection test
  async testConnection() {
    return this.request('/test');
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
