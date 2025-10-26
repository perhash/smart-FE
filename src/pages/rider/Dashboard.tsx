import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Phone, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { supabase } from "@/lib/supabase";

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

  const fetchRiderData = useCallback(async () => {
    try {
      setLoading(true);
      if (!riderId) return;
      const response = await apiService.getRiderDashboard(riderId) as any;
      console.log('Fetched rider data:', response);
      if (response?.success) {
        const assigned = (response.data?.assignedDeliveries || []) as any[];
        // Sort: high, normal, low then FIFO (by string id fallback)
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
      // Set empty arrays on error
      setAssignedDeliveries([]);
      setCompletedDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    console.log('🔄 useEffect running, riderId:', riderId);
    
    if (!riderId) {
      console.warn('⚠️ No riderId, skipping subscription');
      return;
    }

    // Fetch initial data
    console.log('📥 Fetching initial rider data...');
    fetchRiderData();

    // Set up Supabase real-time subscription for this rider's orders
    console.log('🔧 Setting up real-time subscription for rider:', riderId);
    console.log('🌐 Supabase client URL:', supabase.supabaseUrl);
    
    const channelName = `rider-orders-${riderId}`;
    console.log('📺 Creating channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('🔔🔔🔔 PAYLOAD RECEIVED ON RIDER DASHBOARD! 🔔🔔🔔');
          console.log('📦 Full Payload:', JSON.stringify(payload, null, 2));
          console.log('📦 Event Type:', payload.eventType);
          console.log('📦 New record:', payload.new);
          console.log('📦 Order rider ID:', payload.new?.riderId);
          console.log('📦 Our rider ID:', riderId);
          
          // Check if this order is for this rider
          const orderRiderId = payload.new?.riderId;
          console.log('🔍 Comparing rider IDs:', orderRiderId, '===', riderId);
          
          if (orderRiderId === riderId) {
            console.log('✅ This order is for this rider - refetching data!');
            fetchRiderData();
          } else {
            console.log('⏭️ Not for this rider, ignoring');
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [RIDER] Subscription status: ${status}`);
        console.log('📡 Channel:', channelName);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RIDER] Successfully subscribed to INSERT events on orders table!');
          console.log('👀 [RIDER] Now waiting for new orders to be created...');
          console.log('🔎 [RIDER] Current rider ID in subscription:', riderId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [RIDER] Channel error - Check Supabase Realtime settings!');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [RIDER] Connection timed out');
        } else if (status === 'CLOSED') {
          console.error('❌ [RIDER] Connection closed');
        }
      });

    console.log('🔗 Channel reference stored');
    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up subscription...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [riderId, fetchRiderData]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hi, Ali! 👋</h1>
        <p className="text-muted-foreground">You have {assignedDeliveries.length} pending deliveries today</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignedDeliveries.length + completedDeliveries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{completedDeliveries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{assignedDeliveries.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assigned">Assigned ({assignedDeliveries.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedDeliveries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4 mt-4">
          {assignedDeliveries.map((delivery) => (
            <Card key={delivery.originalId}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{delivery.id}</p>
                      <Badge variant="secondary">Assigned</Badge>
                    </div>
                    <p className="font-medium">{delivery.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">RS. {delivery.amount}</p>
                    <p className="text-sm text-muted-foreground">{delivery.bottles} bottles</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{delivery.address || 'Address not available'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{delivery.phone}</span>
                  </div>
                </div>

                <Link to={`/rider/orders/${delivery.originalId}`}>
                  <Button className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Delivered
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedDeliveries.map((delivery) => (
            <Card key={delivery.originalId} className="bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{delivery.id}</p>
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                    <p className="font-medium">{delivery.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">RS. {delivery.amount}</p>
                    <Badge variant="default" className="mt-1">Paid</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{delivery.address || 'Address not available'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiderDashboard;
