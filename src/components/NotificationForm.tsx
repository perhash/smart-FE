import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

const NotificationForm = () => {
  const [riderId, setRiderId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('ORDER_ASSIGNED');
  const [loading, setLoading] = useState(false);
  const [riders, setRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(true);

  // Fetch riders on component mount
  useEffect(() => {
    const fetchRiders = async () => {
      try {
        setLoadingRiders(true);
        const response = await apiService.getRiders();
        
        if (response.success) {
          console.log('Riders data:', response.data);
          setRiders(response.data);
        } else {
          toast.error('Failed to load riders');
        }
      } catch (error) {
        console.error('Error fetching riders:', error);
        toast.error('Failed to load riders');
      } finally {
        setLoadingRiders(false);
      }
    };

    fetchRiders();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!riderId || !title || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    console.log('Sending notification to rider ID:', riderId);
    console.log('Notification data:', { userId: riderId, title, message, type });

    setLoading(true);
    
    try {
      const response = await apiService.sendNotification({
        userId: riderId,
        title,
        message,
        type,
        data: { timestamp: new Date().toISOString() }
      });
      
      if (response.success) {
        toast.success('Notification sent successfully!');
        setTitle('');
        setMessage('');
        setRiderId(''); // Reset rider selection
      } else {
        toast.error(response.message || 'Failed to send notification');
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Send Notification</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="riderId">Select Rider</Label>
            <Select 
              value={riderId} 
              onValueChange={(value) => {
                console.log('Selected rider ID:', value);
                setRiderId(value);
              }} 
              disabled={loadingRiders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingRiders ? "Loading riders..." : "Select a rider"} />
              </SelectTrigger>
              <SelectContent>
                {riders.map((rider) => {
                  console.log('Rider item:', rider);
                  return (
                    <SelectItem key={rider.id} value={rider.userId}>
                      {rider.name} ({rider.phone})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {riderId && (
              <p className="text-xs text-muted-foreground">
                Selected Rider ID: {riderId}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORDER_ASSIGNED">Order Assigned</SelectItem>
                <SelectItem value="ORDER_DELIVERED">Order Delivered</SelectItem>
                <SelectItem value="PAYMENT_RECEIVED">Payment Received</SelectItem>
                <SelectItem value="SYSTEM_UPDATE">System Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Notification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationForm;
