import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, TruckIcon, Package } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { apiService } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, ridersRes] = await Promise.all([
          apiService.getOrderById(id as string) as any,
          apiService.getRiders() as any,
        ]);
        if (orderRes?.success) {
          setOrder(orderRes.data);
        }
        if (ridersRes?.success) {
          setRiders(ridersRes.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAssign = async () => {
    if (!selectedRider) return;
    try {
      setAssigning(true);
      const res = await apiService.updateOrderStatus(id as string, 'ASSIGNED', selectedRider) as any;
      if (res?.success) {
        setOrder(res.data);
      }
    } finally {
      setAssigning(false);
    }
  };

  const timeline = [
    { status: "Created", time: "09:00 AM", completed: true },
    { status: "Assigned", time: "09:15 AM", completed: true },
    { status: "In Transit", time: "-", completed: false },
    { status: "Delivered", time: "-", completed: false },
  ];

  if (loading || !order) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order #{order.id.slice(-4)}</h1>
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
              <p className="font-medium">{[order.customer.houseNo, order.customer.streetNo, order.customer.area, order.customer.city].filter(Boolean).join(' ')}</p>
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
            {order.rider ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.rider.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.rider.phone}</p>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No rider assigned</p>
                <div className="flex gap-2 items-center">
                  <Select value={selectedRider} onValueChange={setSelectedRider}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Select rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {riders.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssign} disabled={!selectedRider || assigning}>Assign</Button>
                </div>
              </div>
            )}
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
            <span className="font-medium">{order.numberOfBottles} bottles</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price per bottle</span>
            <span className="font-medium">-</span>
          </div>
          
          {/* Current Order Amount */}
          <div className="flex justify-between text-lg font-bold border-t pt-4">
            <span>Current Order Amount</span>
            <span>RS. {order.totalAmount}</span>
          </div>

          {/* Pending Balance */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending Balance</span>
            <div className="text-right">
              <Badge variant={(order.customer?.currentBalance ?? 0) < 0 ? "destructive" : "default"}>
                {(order.customer?.currentBalance ?? 0) < 0 ? "Payable" : (order.customer?.currentBalance ?? 0) > 0 ? "Receivable" : 'Clear'}
              </Badge>
              <p className="text-sm font-semibold mt-1">
                RS. {Math.abs(order.customer?.currentBalance ?? 0)}
              </p>
            </div>
          </div>

          {/* Total for Admin Understanding */}
          <div className="flex justify-between text-xl font-bold border-t-2 border-primary pt-4 bg-primary/5 p-3 rounded-lg">
            <span>Total for Admin</span>
            <span className="text-primary">
              RS. {(() => {
                const currentOrderAmount = order.totalAmount ?? 0;
                const customerBalance = order.customer?.currentBalance ?? 0;
                if (customerBalance < 0) {
                  // Payable - subtract from order amount
                  return currentOrderAmount - Math.abs(customerBalance);
                } else if (customerBalance > 0) {
                  // Receivable - add to order amount
                  return currentOrderAmount + customerBalance;
                } else {
                  // Clear balance - no adjustment
                  return currentOrderAmount;
                }
              })()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {(() => {
              const customerBalance = order.customer?.currentBalance ?? 0;
              if (customerBalance < 0) {
                return `Order amount minus payable balance`;
              } else if (customerBalance > 0) {
                return `Order amount plus receivable balance`;
              } else {
                return `No balance adjustment needed`;
              }
            })()}
          </p>
          
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
