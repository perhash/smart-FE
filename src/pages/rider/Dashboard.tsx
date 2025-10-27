import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Phone, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Droplet } from "lucide-react";

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

const RiderDashboard = () => {
  const [activeTab, setActiveTab] = useState("assigned");
  const [assignedDeliveries, setAssignedDeliveries] = useState<Order[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const { user } = useAuth();
  const riderId = (user as any)?.riderProfile?.id || (user as any)?.profile?.id;
  const riderName = (user as any)?.riderProfile?.name || (user as any)?.profile?.name || "Rider";

  const fetchRiderData = useCallback(async () => {
    try {
      setLoading(true);
      if (!riderId) return;
      const response = await apiService.getRiderDashboard(riderId) as any;
      if (response?.success) {
        const assigned = (response.data?.assignedDeliveries || []) as any[];
        const rank = (p?: string) => (p === 'high' ? 0 : p === 'normal' ? 1 : p === 'medium' ? 1 : 2);
        assigned.sort((a, b) => {
          const ar = rank(a.priority);
          const br = rank(b.priority);
          if (ar !== br) return ar - br;
          return (a.id || '').localeCompare(b.id || '');
        });
        setAssignedDeliveries(assigned);
        setCompletedDeliveries(response.data?.completedDeliveries || []);
      }
    } catch (error) {
      console.error('Error fetching rider data:', error);
      setAssignedDeliveries([]);
      setCompletedDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    if (!riderId) return;
    fetchRiderData();

    const channelName = `rider-orders-${riderId}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `riderId=eq.${riderId}` },
        (payload) => fetchRiderData())
      .subscribe();

    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [riderId, fetchRiderData]);

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Section - Blue Gradient Header */}
        <div className="bg-gradient-to-br from-cyan-900 via-cyan-500 to-cyan-900 p-6 space-y-6 h-[300px]">
          {/* Welcome Section */}
          <div className="flex items-center gap-4">
            {/* Profile Circle */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Droplet className="h-8 w-8 text-cyan-600" fill="currentColor" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Welcome {riderName}</h1>
              <p className="text-sm text-white/90 mt-1">You have {assignedDeliveries.length} pending deliveries</p>
            </div>
          </div>

          {/* Metrics - 3 Rounded Boxes */}
          <div className="grid grid-cols-3 gap-3">
            {/* Today */}
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-3 border border-white/30">
              <div className="flex flex-col items-center justify-center">
                <Package className="h-6 w-6 text-white mb-2" />
                <p className="text-2xl font-bold text-white">{assignedDeliveries.length + completedDeliveries.length}</p>
                <p className="text-xs text-white/80">Today</p>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-3 border  border-white/30">
              <div className="flex flex-col items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white mb-2" />
                <p className="text-2xl font-bold text-white">{completedDeliveries.length}</p>
                <p className="text-xs text-white/80">Done</p>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-3 border border-white/30">
              <div className="flex flex-col items-center justify-center">
                <Clock className="h-6 w-6 text-white mb-2" />
                <p className="text-2xl font-bold text-white">{assignedDeliveries.length}</p>
                <p className="text-xs text-white/80">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - White Background with Tabs */}
        {/* Bottom Section - White Glassy Tabs Area */}
        <div className="bg-white rounded-t-3xl -mt-10 p-6 min-h-[calc(100vh-300px)] overflow-y-auto shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Toggle Bar */}
            <div className="flex rounded-full border bg-black/20 backdrop-blur-sm shadow-black/70 shadow-inner-sm   p-1 mb-6 shadow-inner">
              <button
                onClick={() => setActiveTab("assigned")}
                className={`flex-1 py-3 px-4 rounded-full font-medium text-sm transition-all duration-300 ${activeTab === "assigned"
                    ? "bg-cyan-600 text-white shadow-md scale-[1.02]"
                    : "text-cyan-700 hover:bg-white/60"
                  }`}
              >
                Assigned ({assignedDeliveries.length})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`flex-1 py-3 px-4 rounded-full font-medium text-sm transition-all duration-300 ${activeTab === "completed"
                    ? "bg-green-600 text-white shadow-md scale-[1.02]"
                    : "text-cyan-700 hover:bg-white/60"
                  }`}
              >
                Completed ({completedDeliveries.length})
              </button>
            </div>

            {/* Assigned Deliveries */}
            {activeTab === "assigned" && (
              <div className="space-y-3">
                {assignedDeliveries.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No assigned deliveries</p>
                  </div>
                ) : (
                  assignedDeliveries.map((delivery) => (
                    <Link
                      key={delivery.originalId}
                      to={`/rider/orders/${delivery.originalId}`}
                    >
                      <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl p-4 border border-cyan-100 hover:shadow-lg transition-all duration-300 active:scale-[0.99]">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900">{delivery.id}</p>
                              <Badge className="bg-cyan-100 text-cyan-700">
                                Assigned
                              </Badge>
                            </div>
                            <p className="font-semibold text-gray-800">
                              {delivery.customer}
                            </p>
                            <p className="text-sm text-gray-500">{delivery.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-cyan-700">
                              RS. {delivery.amount}
                            </p>
                            <p className="text-sm text-gray-500">
                              {delivery.bottles} bottles
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-600" />
                          <span className="line-clamp-2">
                            {delivery.address || "Address not available"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Completed Deliveries */}
            {activeTab === "completed" && (
              <div className="space-y-3">
                {completedDeliveries.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No completed deliveries</p>
                  </div>
                ) : (
                  completedDeliveries.map((delivery) => (
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
                                Completed
                              </Badge>
                            </div>
                            <p className="font-semibold text-gray-800">
                              {delivery.customer}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-700">
                              RS. {delivery.amount}
                            </p>
                            <Badge className="bg-green-100 text-green-700 mt-1">
                              Paid
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                          <span className="line-clamp-2">
                            {delivery.address || "Address not available"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </Tabs>
        </div>

      </div>

      {/* Desktop Layout - Expanded Version */}
      <div className="hidden md:block max-w-7xl mx-auto px-6">
        {/* Top Section */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-700 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <Droplet className="h-12 w-12 text-cyan-600" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Welcome {riderName}</h1>
              <p className="text-xl text-white/90 mt-2">You have {assignedDeliveries.length} pending deliveries</p>
            </div>
          </div>

          {/* Metrics - Expanded for Desktop */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center mb-3">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <p className="text-4xl font-bold text-white">{assignedDeliveries.length + completedDeliveries.length}</p>
                <p className="text-sm text-white/80 mt-1">Total Today</p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center mb-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-4xl font-bold text-white">{completedDeliveries.length}</p>
                <p className="text-sm text-white/80 mt-1">Completed</p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center mb-3">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <p className="text-4xl font-bold text-white">{assignedDeliveries.length}</p>
                <p className="text-sm text-white/80 mt-1">Pending</p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center mb-3">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <p className="text-4xl font-bold text-white">RS. {completedDeliveries.reduce((sum, d) => sum + (d.amount || 0), 0)}</p>
                <p className="text-sm text-white/80 mt-1">Earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - White Background */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-cyan-100">
          <div className="flex rounded-full border-2 border-cyan-100 bg-cyan-50 p-1 mb-8 w-fit mx-auto">
            <button
              onClick={() => setActiveTab("assigned")}
              className={`px-8 py-3 rounded-full font-medium transition-all ${activeTab === "assigned"
                  ? "bg-white text-cyan-700 shadow-md"
                  : "text-cyan-600"
                }`}
            >
              Assigned ({assignedDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-8 py-3 rounded-full font-medium transition-all ${activeTab === "completed"
                  ? "bg-white text-green-700 shadow-md"
                  : "text-cyan-600"
                }`}
            >
              Completed ({completedDeliveries.length})
            </button>
          </div>

          {/* Delivery List */}
          {activeTab === "assigned" && (
            <div className="grid gap-4 grid-cols-2">
              {assignedDeliveries.length === 0 ? (
                <div className="col-span-2 text-center py-16">
                  <Package className="h-20 w-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg text-gray-500">No assigned deliveries</p>
                </div>
              ) : (
                assignedDeliveries.map((delivery) => (
                  <Link key={delivery.originalId} to={`/rider/orders/${delivery.originalId}`}>
                    <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl p-6 border border-cyan-100 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-gray-900">{delivery.id}</p>
                            <Badge className="bg-cyan-100 text-cyan-700">Assigned</Badge>
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
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-sm text-gray-500">{delivery.bottles} bottles</p>
                          <p className="font-bold text-xl text-cyan-700">RS. {delivery.amount}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div className="grid gap-4 grid-cols-2">
              {completedDeliveries.length === 0 ? (
                <div className="col-span-2 text-center py-16">
                  <CheckCircle className="h-20 w-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg text-gray-500">No completed deliveries</p>
                </div>
              ) : (
                completedDeliveries.map((delivery) => (
                  <Link key={delivery.originalId} to={`/rider/orders/${delivery.originalId}`}>
                    <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-6 border border-green-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-gray-900">{delivery.id}</p>
                            <Badge className="bg-green-600 text-white">Completed</Badge>
                          </div>
                          <p className="font-semibold text-gray-800">{delivery.customer}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-2">{delivery.address || 'Address not available'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Badge className="bg-green-100 text-green-700">Paid</Badge>
                          <p className="font-bold text-xl text-green-700">RS. {delivery.amount}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
