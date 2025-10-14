import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, TruckIcon, Package } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const OrderDetail = () => {
  const { id } = useParams();

  const order = {
    id: `#${id}`,
    customer: {
      name: "Ramesh Kumar",
      phone: "+91 98765 43210",
      address: "123, Green Park, Sector 15",
    },
    rider: {
      name: "Ali Khan",
      phone: "+91 98765 43215",
    },
    bottles: 5,
    pricePerBottle: 90,
    totalAmount: 450,
    status: "assigned",
    paymentStatus: "unpaid",
    date: "2024-01-15",
    notes: "Deliver before 10 AM",
  };

  const timeline = [
    { status: "Created", time: "09:00 AM", completed: true },
    { status: "Assigned", time: "09:15 AM", completed: true },
    { status: "In Transit", time: "-", completed: false },
    { status: "Delivered", time: "-", completed: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order {order.id}</h1>
          <p className="text-muted-foreground">Order Details</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
            {order.status}
          </Badge>
          <Badge variant={order.paymentStatus === "paid" ? "default" : "destructive"}>
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.customer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{order.customer.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Rider Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{order.rider.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.rider.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">{order.bottles} bottles</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price per bottle</span>
            <span className="font-medium">₹{order.pricePerBottle}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-4">
            <span>Total Amount</span>
            <span>₹{order.totalAmount}</span>
          </div>
          {order.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((step, index) => (
              <div key={step.status} className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${step.completed ? "" : "text-muted-foreground"}`}>
                    {step.status}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
