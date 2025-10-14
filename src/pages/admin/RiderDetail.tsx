import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const RiderDetail = () => {
  const { id } = useParams();

  const rider = {
    id,
    name: "Ali Khan",
    phone: "+91 98765 43215",
    status: "active",
    totalDeliveries: 234,
    deliveriesToday: 12,
  };

  const deliveries = [
    { id: "#1234", customer: "Ramesh Kumar", address: "Green Park", status: "completed", amount: 450 },
    { id: "#1235", customer: "Priya Sharma", address: "Blue Heights", status: "completed", amount: 270 },
    { id: "#1236", customer: "Vikram Singh", address: "Rose Garden", status: "pending", amount: 600 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/riders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{rider.name}</h1>
          <p className="text-muted-foreground">Rider Details</p>
        </div>
        <Button variant="outline">Assign Order</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={rider.status === "active" ? "default" : "secondary"} className="text-lg px-4 py-2">
              {rider.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today's Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rider.deliveriesToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rider.totalDeliveries}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{rider.phone}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{delivery.id} - {delivery.customer}</p>
                    <p className="text-sm text-muted-foreground">{delivery.address}</p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <p className="font-medium">₹{delivery.amount}</p>
                    <Badge variant={delivery.status === "completed" ? "default" : "secondary"}>
                      {delivery.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiderDetail;
