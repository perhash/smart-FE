import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Phone, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
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

const RiderDashboard = () => {
  const [activeTab, setActiveTab] = useState("assigned");
  const [assignedDeliveries, setAssignedDeliveries] = useState<Order[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();


console.log(assignedDeliveries,"assignedDeliveries");
  useEffect(() => {
    const fetchRiderData = async () => {
      try {
        setLoading(true);
        const riderId = (user as any)?.riderProfile?.id || (user as any)?.profile?.id;
        if (!riderId) return;
        const response = await apiService.getRiderDashboard(riderId) as any;
        console.log(response,"response");
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
    };

    fetchRiderData();
    const interval = setInterval(fetchRiderData, 5000);
    return () => clearInterval(interval);
  }, [(user as any)?.riderProfile?.id, (user as any)?.profile?.id]);


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
