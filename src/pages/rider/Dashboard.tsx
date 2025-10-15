import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Phone, CheckCircle, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import NotificationButton from "@/components/NotificationButton";

const RiderDashboard = () => {
  const [activeTab, setActiveTab] = useState("assigned");
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, isConnected, joinRoom } = useWebSocket();
  const { 
    isSupported: pushSupported, 
    permission: pushPermission, 
    isSubscribed: pushSubscribed, 
    isLoading: pushLoading,
    requestPermission: requestPushPermission,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    showTestNotification
  } = usePushNotifications();

  useEffect(() => {
    const fetchRiderData = async () => {
      try {
        setLoading(true);
        
        // Get current user (rider) from auth
        const currentUser = apiService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'RIDER') {
          toast.error('Invalid rider access');
          return;
        }

        // Fetch orders and notifications
        const [ordersResponse, notificationsResponse] = await Promise.all([
          apiService.getOrders(),
          apiService.getNotifications()
        ]);
        
        if (ordersResponse.success) {
          const allOrders = ordersResponse.data;
          
          // Filter orders assigned to this rider
          const assignedOrders = allOrders.filter(order => 
            order.rider === currentUser.profile?.name && 
            (order.status === 'assigned' || order.status === 'in_progress')
          );
          
          const completedOrders = allOrders.filter(order => 
            order.rider === currentUser.profile?.name && 
            order.status === 'delivered'
          );

          setAssignedDeliveries(assignedOrders);
          setCompletedDeliveries(completedOrders);
        }

        if (notificationsResponse.success) {
          const riderNotifications = notificationsResponse.data.filter(notification => 
            notification.userId === currentUser.id
          );
          setNotifications(riderNotifications);
          setUnreadCount(riderNotifications.filter(n => !n.isRead).length);
        }
      } catch (error) {
        console.error('Error fetching rider data:', error);
        toast.error('Failed to load data');
        // Fallback to mock data
        setAssignedDeliveries([
          {
            id: "#1236",
            customer: "Vikram Singh",
            phone: "+91 98765 43212",
            address: "123, Rose Garden, Sector 20",
            bottles: 7,
            amount: 630,
            paymentStatus: "unpaid",
          },
          {
            id: "#1238",
            customer: "Suresh Reddy",
            phone: "+91 98765 43220",
            address: "456, Blue Heights, Sector 18",
            bottles: 4,
            amount: 360,
            paymentStatus: "unpaid",
          },
        ]);
        setCompletedDeliveries([
          {
            id: "#1234",
            customer: "Ramesh Kumar",
            phone: "+91 98765 43210",
            address: "123, Green Park, Sector 15",
            bottles: 5,
            amount: 450,
            paymentStatus: "paid",
          },
          {
            id: "#1235",
            customer: "Priya Sharma",
            phone: "+91 98765 43211",
            address: "789, White House, Sector 12",
            bottles: 3,
            amount: 270,
            paymentStatus: "paid",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRiderData();
  }, []);

  // Join WebSocket room when user is authenticated
  useEffect(() => {
    const currentUser = apiService.getCurrentUser();
    console.log('🔍 Current user:', currentUser);
    console.log('🔍 WebSocket connected:', isConnected);
    
    if (currentUser && isConnected) {
      console.log(`🚀 Joining room: rider-${currentUser.id}`);
      joinRoom(currentUser.id, currentUser.role);
    }
  }, [isConnected, joinRoom]);

  // Setup push notifications for riders
  useEffect(() => {
    const setupPushNotifications = async () => {
      if (pushSupported && pushPermission === 'default') {
        const granted = await requestPushPermission();
        if (granted) {
          await subscribeToPush();
        }
      } else if (pushSupported && pushPermission === 'granted' && !pushSubscribed) {
        await subscribeToPush();
      }
    };

    setupPushNotifications();
  }, [pushSupported, pushPermission, pushSubscribed, requestPushPermission, subscribeToPush]);

  // Real-time event listeners
  useEffect(() => {
    if (!socket) {
      console.log('❌ No socket available for event listeners');
      return;
    }

    console.log('🎧 Setting up WebSocket event listeners');

    const handleNewOrder = (order) => {
      console.log('📦 New order received via WebSocket:', order);
      toast.success(`New order assigned: ${order.customer?.name || 'Unknown Customer'}`);
      
      // Add to assigned deliveries
      setAssignedDeliveries(prev => [order, ...prev]);
    };

    const handleOrderUpdate = (data) => {
      console.log('🔄 Order update received via WebSocket:', data);
      // Refresh data when order status changes
      fetchRiderData();
    };

    const handleNewNotification = (notification) => {
      console.log('🔔 New notification received via WebSocket:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.info(notification.title);
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-updated', handleOrderUpdate);
    socket.on('new-notification', handleNewNotification);

    return () => {
      console.log('🧹 Cleaning up WebSocket event listeners');
      socket.off('new-order', handleNewOrder);
      socket.off('order-updated', handleOrderUpdate);
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket]);

  const fetchRiderData = async () => {
    try {
      setLoading(true);
      
      // Get current user (rider) from auth
      const currentUser = apiService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'RIDER') {
        toast.error('Invalid rider access');
        return;
      }

      // Fetch orders and notifications
      const [ordersResponse, notificationsResponse] = await Promise.all([
        apiService.getOrders(),
        apiService.getNotifications()
      ]);
      
      if (ordersResponse.success) {
        const allOrders = ordersResponse.data;
        
        // Filter orders assigned to this rider
        const assignedOrders = allOrders.filter(order => 
          order.rider === currentUser.profile?.name && 
          (order.status === 'assigned' || order.status === 'in_progress')
        );
        
        const completedOrders = allOrders.filter(order => 
          order.rider === currentUser.profile?.name && 
          order.status === 'delivered'
        );

        setAssignedDeliveries(assignedOrders);
        setCompletedDeliveries(completedOrders);
      }

      if (notificationsResponse.success) {
        const riderNotifications = notificationsResponse.data.filter(notification => 
          notification.userId === currentUser.id
        );
        setNotifications(riderNotifications);
        setUnreadCount(riderNotifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching rider data:', error);
      toast.error('Failed to load data');
      // Fallback to mock data
      setAssignedDeliveries([
        {
          id: "#1236",
          customer: "Vikram Singh",
          phone: "+91 98765 43212",
          address: "123, Rose Garden, Sector 20",
          bottles: 7,
          amount: 630,
          paymentStatus: "unpaid",
        },
        {
          id: "#1238",
          customer: "Suresh Reddy",
          phone: "+91 98765 43220",
          address: "456, Blue Heights, Sector 18",
          bottles: 4,
          amount: 360,
          paymentStatus: "unpaid",
        },
      ]);
      setCompletedDeliveries([
        {
          id: "#1234",
          customer: "Ramesh Kumar",
          phone: "+91 98765 43210",
          address: "123, Green Park, Sector 15",
          bottles: 5,
          amount: 450,
          paymentStatus: "paid",
        },
        {
          id: "#1235",
          customer: "Priya Sharma",
          phone: "+91 98765 43211",
          address: "789, White House, Sector 12",
          bottles: 3,
          amount: 270,
          paymentStatus: "paid",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hi, Ali! 👋</h1>
          <p className="text-muted-foreground">You have {assignedDeliveries.length} pending deliveries today</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationButton />
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
           {pushSupported && (
             <div className="flex items-center gap-2">
               <Button
                 size="sm"
                 variant={pushSubscribed ? "default" : "outline"}
                 onClick={pushSubscribed ? unsubscribeFromPush : subscribeToPush}
                 disabled={pushLoading}
               >
                 {pushLoading ? "..." : pushSubscribed ? "Unsubscribe" : "Subscribe"}
               </Button>
             </div>
           )}
        </div>
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
            <Card key={delivery.id}>
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
                    <p className="font-bold text-lg">RS {delivery.amount}</p>
                    <p className="text-sm text-muted-foreground">{delivery.bottles} bottles</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{delivery.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{delivery.phone}</span>
                  </div>
                </div>

                <Link to={`/rider/orders/${delivery.id.replace('#', '')}`}>
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
            <Card key={delivery.id} className="bg-muted/30">
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
                    <p className="font-bold text-lg">RS {delivery.amount}</p>
                    <Badge variant="default" className="mt-1">Paid</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{delivery.address}</span>
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
