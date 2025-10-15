import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";

interface CreateOrderDialogProps {
  trigger?: React.ReactNode;
}

export function CreateOrderDialog({ trigger }: CreateOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [bottles, setBottles] = useState("");
  const [pricePerBottle, setPricePerBottle] = useState("90");
  const [selectedRider, setSelectedRider] = useState("");
  const [notes, setNotes] = useState("");
  const [customers, setCustomers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch customers and riders on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersResponse, ridersResponse] = await Promise.all([
          apiService.getCustomers(),
          apiService.getRiders()
        ]);

        if (customersResponse.success) {
          setCustomers(customersResponse.data);
        }
        if (ridersResponse.success) {
          setRiders(ridersResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load customers and riders');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    
    if (!bottles || parseInt(bottles) <= 0) {
      toast.error("Please enter valid quantity");
      return;
    }
    
    if (!selectedRider) {
      toast.error("Please assign a rider");
      return;
    }

    const totalAmount = parseInt(bottles) * parseInt(pricePerBottle);
    
    try {
      setSubmitting(true);
      
      // Create order with rider assignment
      const orderData = {
        customerId: selectedCustomer.id,
        riderId: selectedRider,
        totalAmount: totalAmount,
        notes: notes,
        priority: 'NORMAL'
      };

      const response = await apiService.createOrder(orderData);
      
      if (response.success) {
        toast.success(`Order created and assigned successfully! Total: RS ${totalAmount}`);
        
        // Send notification to rider
        await apiService.sendNotification({
          userId: selectedRider,
          title: 'New Order Assigned',
          message: `You have been assigned a new order for ${selectedCustomer.name}. Amount: RS ${totalAmount}`,
          type: 'ORDER_ASSIGNED',
          data: { orderId: response.data.id }
        });
        
        // Reset form
        setSelectedCustomer(null);
        setSearchQuery("");
        setBottles("");
        setPricePerBottle("90");
        setSelectedRider("");
        setNotes("");
        setOpen(false);
      } else {
        toast.error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Search for customer and fill in order details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Search */}
          <div className="space-y-2">
            <Label>Search Customer (by name or phone)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchQuery && !selectedCustomer && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
                {loading ? (
                  <p className="p-3 text-sm text-muted-foreground">Loading customers...</p>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setSearchQuery("");
                      }}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                        <Badge variant={customer.currentBalance < 0 ? "destructive" : "default"}>
                          {customer.currentBalance < 0 ? `RS ${Math.abs(customer.currentBalance)} due` : "Clear"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">No customers found</p>
                )}
              </div>
            )}
          </div>

          {/* Selected Customer Info */}
          {selectedCustomer && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  <p className="text-sm text-muted-foreground">Bottles: {selectedCustomer.bottleCount}</p>
                </div>
                <div className="text-right">
                  <Badge variant={selectedCustomer.currentBalance < 0 ? "destructive" : "default"}>
                    {selectedCustomer.currentBalance < 0 ? "Payable" : "Receivable"}
                  </Badge>
                  <p className="text-sm font-medium mt-1">RS {Math.abs(selectedCustomer.currentBalance)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setSelectedCustomer(null)}
              >
                Change Customer
              </Button>
            </div>
          )}

          {/* Order Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bottles">Bottle Quantity *</Label>
              <Input
                id="bottles"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={bottles}
                onChange={(e) => setBottles(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Bottle (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="1"
                placeholder="90"
                value={pricePerBottle}
                onChange={(e) => setPricePerBottle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Total Amount Display */}
          {bottles && pricePerBottle && (
            <div className="rounded-lg border bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="text-2xl font-bold">
                  RS {parseInt(bottles) * parseInt(pricePerBottle)}
                </span>
              </div>
            </div>
          )}

          {/* Rider Assignment */}
          <div className="space-y-2">
            <Label htmlFor="rider">Assign Rider *</Label>
            <Select value={selectedRider} onValueChange={setSelectedRider} required>
              <SelectTrigger id="rider">
                <SelectValue placeholder="Select a rider" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading riders...</SelectItem>
                ) : riders.length > 0 ? (
                  riders.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      <div className="flex items-center gap-2">
                        <span>{rider.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {rider.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-riders" disabled>No riders available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add delivery instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create & Assign Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
