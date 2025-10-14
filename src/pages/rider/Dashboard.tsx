import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Phone, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { apiService } from "@/services/api";

const RiderDashboard = () => {
  const [activeTab, setActiveTab] = useState("assigned");
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiderData = async () => {
      try {
        setLoading(true);
        // Using a mock rider ID for now - in real app this would come from auth
        const response = await apiService.getRiderDashboard("rider-123");
        
        if (response.success) {
          setAssignedDeliveries(response.data.assignedDeliveries);
          setCompletedDeliveries(response.data.completedDeliveries);
        }
      } catch (error) {
        console.error('Error fetching rider data:', error);
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
                    <p className="font-bold text-lg">₹{delivery.amount}</p>
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
                    <p className="font-bold text-lg">₹{delivery.amount}</p>
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
