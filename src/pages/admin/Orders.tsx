import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { CreateOrderDialog } from "@/components/admin/CreateOrderDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/services/api";

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiService.getOrders(statusFilter === "all" ? undefined : statusFilter) as any;
        if (response?.success) {
          setOrders(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to mock data
        setOrders([
          { id: "#1234", customer: "Ramesh Kumar", bottles: 5, amount: 450, status: "assigned", rider: "Ali Khan", date: "2024-01-15", paid: false },
          { id: "#1235", customer: "Priya Sharma", bottles: 3, amount: 270, status: "delivered", rider: "Ravi Kumar", date: "2024-01-15", paid: true },
          { id: "#1236", customer: "Vikram Singh", bottles: 7, amount: 630, status: "created", rider: "Not assigned", date: "2024-01-15", paid: false },
          { id: "#1237", customer: "Anjali Patel", bottles: 4, amount: 360, status: "delivered", rider: "Ali Khan", date: "2024-01-14", paid: false },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const filteredOrders = [...orders]
    .sort((a: any, b: any) => {
      // Unassigned first
      const aUnassigned = (a.rider === 'Not assigned');
      const bUnassigned = (b.rider === 'Not assigned');
      if (aUnassigned !== bUnassigned) return aUnassigned ? -1 : 1;
      const orderRank = (p?: string) => p === 'high' ? 0 : p === 'normal' || p === 'medium' ? 1 : p === 'low' ? 2 : 1;
      const ar = orderRank(a.priority);
      const br = orderRank(b.priority);
      if (ar !== br) return ar - br;
      // FIFO within same priority by created date if available, else keep as-is
      if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage all delivery orders</p>
        </div>
        
        <CreateOrderDialog />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <CardTitle>All Orders</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredOrders.map((order: any) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.originalId || order.id.replace('#', '')}`}
                className="block"
              >
                <Card className={`${order.paid ? 'bg-green-50 hover:bg-green-50/80' : 'hover:bg-muted/50'} transition-colors`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.id}</p>
                          <Badge variant={order.status === "delivered" ? "default" : order.status === "assigned" ? "secondary" : "outline"}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">Rider: {order.rider}</p>
                          {/* Chips row */}
                          <div className="flex items-center gap-2 pt-1">
                            {order.priority && (
                              <span className={`px-2 py-0.5 text-xs rounded-md ${
                                order.priority === 'high' ? 'bg-red-100 text-red-700' :
                                (order.priority === 'normal' || order.priority === 'medium') ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>{order.priority}</span>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded-md ${order.status ==="delivered" ? 'bg-green-200 text-green-800' : 'bg-rose-100 text-rose-700'}`}>
                              {order.status === "delivered" ? 'Paid' : 'unpaid'}
                            </span>
                          </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <p className="font-medium">{order.bottles} bottles</p>
                        <p className="text-lg font-bold">RS. {order.amount}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                        {/* Assign button for unassigned */}
                        {order.rider === 'Not assigned' && (
                          <div className="pt-2">
                            <Link to={`/admin/orders/${order.originalId || order.id.replace('#','')}`}>
                              <Badge className="cursor-pointer" variant="destructive">Assign</Badge>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
