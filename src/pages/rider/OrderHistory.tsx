import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Package, MapPin, Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

interface Order {
  id: string;
  originalId: string;
  customer: string;
  phone: string;
  bottles: number;
  amount: number;
  status: string;
  priority: string;
  rider: string;
  date: string;
  paid: boolean;
  paidAmount: number;
  paymentStatus: string;
  address?: string;
}

// Helper function to get payment status badge
const getPaymentStatusBadge = (status?: string) => {
  const paymentStatus = status?.toUpperCase();
  switch (paymentStatus) {
    case 'PAID':
      return { text: 'PAID', className: 'bg-green-100 text-green-700' };
    case 'NOT_PAID':
      return { text: 'NOT PAID', className: 'bg-red-100 text-red-700' };
    case 'PARTIAL':
      return { text: 'PARTIAL', className: 'bg-orange-100 text-orange-700' };
    case 'OVERPAID':
      return { text: 'OVERPAID', className: 'bg-purple-100 text-purple-700' };
    case 'REFUND':
      return { text: 'REFUND', className: 'bg-blue-100 text-blue-700' };
    default:
      return { text: 'NOT PAID', className: 'bg-red-100 text-red-700' };
  }
};

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const riderId = (user as any)?.riderProfile?.id || (user as any)?.profile?.id;
  const navigate = useNavigate();

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date();
    switch (filter) {
      case 'today':
        return {
          startDate: new Date(today.setHours(0, 0, 0, 0)).toISOString().split('T')[0],
          endDate: new Date(today.setHours(23, 59, 59, 999)).toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      if (!riderId) return;

      const { startDate, endDate } = getDateRange();
      const response = await apiService.getOrders({
        riderId,
        startDate,
        endDate,
        page,
        limit: itemsPerPage
      }) as any;

      if (response?.success) {
        // Sort by date descending (latest first - LIFO)
        const sortedOrders = (response.data || []).sort((a: Order, b: Order) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setOrders(sortedOrders);
        
        // Calculate total pages (assuming we have total count, otherwise use length)
        const totalCount = response.total || sortedOrders.length;
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [riderId, filter, page]);

  const filterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-cyan-900 via-cyan-500 to-cyan-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <Link to="/rider">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Order History</h1>
                <p className="text-sm text-white/90">Your delivery history</p>
              </div>
            </div>
            
            {/* Filter Icon */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Filter className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-0">
                <div className="p-2">
                  <p className="px-3 py-2 text-sm font-semibold text-gray-700">Filter by</p>
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value as any);
                        setPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        filter === option.value
                          ? 'bg-cyan-100 text-cyan-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-t-3xl -mt-10 p-6 min-h-[calc(100vh-300px)]">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((delivery) => (
                <Link
                  key={delivery.originalId}
                  to={`/rider/orders/${delivery.originalId}`}
                >
                  <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-4 border border-green-100 hover:shadow-lg transition-all duration-300 active:scale-[0.99]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900">{delivery.id}</p>
                          <Badge className="bg-green-600 text-white">
                            {delivery.status === 'delivered' ? 'Completed' : delivery.status}
                          </Badge>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {delivery.customer}
                        </p>
                        <p className="text-sm text-gray-500">{delivery.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-700">
                          RS. {delivery.amount}
                        </p>
                        <Badge className={getPaymentStatusBadge(delivery.paymentStatus).className + " mt-1"}>
                          {getPaymentStatusBadge(delivery.paymentStatus).text}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start justify-between text-sm mb-2">
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span className="line-clamp-1 text-xs">
                          {delivery.address || "Address not available"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <p className="text-xs">{new Date(delivery.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        {delivery.bottles} bottles
                      </p>
                      <p className="text-xs text-gray-600">
                        Paid: <span className="font-semibold text-green-600">RS. {delivery.paidAmount || 0}</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                onClick={handlePreviousPage}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <Button
                onClick={handleNextPage}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-700 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/rider">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-white">Order History</h1>
                <p className="text-xl text-white/90 mt-2">Your complete delivery history</p>
              </div>
            </div>
            
            {/* Filter Icon */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Filter className="h-10 w-10" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-0">
                <div className="p-2">
                  <p className="px-3 py-2 text-sm font-semibold text-gray-700">Filter by</p>
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value as any);
                        setPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        filter === option.value
                          ? 'bg-cyan-100 text-cyan-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="col-span-2 text-center py-16">
              <Package className="h-20 w-20 mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-500">No orders found</p>
            </div>
          ) : (
            orders.map((delivery) => (
              <Link key={delivery.originalId} to={`/rider/orders/${delivery.originalId}`}>
                <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-gray-900">{delivery.id}</p>
                        <Badge className="bg-green-600 text-white">
                          {delivery.status === 'delivered' ? 'Completed' : delivery.status}
                        </Badge>
                      </div>
                      <p className="font-semibold text-gray-800 mb-1">{delivery.customer}</p>
                      <p className="text-sm text-gray-500">{delivery.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-2">{delivery.address || 'Address not available'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(delivery.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="text-xl font-bold text-green-700">RS. {delivery.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bottles</p>
                        <p className="font-semibold">{delivery.bottles}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Paid</p>
                        <p className="font-semibold text-green-600">RS. {delivery.paidAmount || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <Badge className={getPaymentStatusBadge(delivery.paymentStatus).className}>
                          {getPaymentStatusBadge(delivery.paymentStatus).text}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              onClick={handlePreviousPage}
              disabled={page === 1}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>
            <p className="text-gray-700 font-medium">
              Page {page} of {totalPages}
            </p>
            <Button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

