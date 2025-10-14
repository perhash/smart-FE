import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { AddRiderDialog } from "@/components/admin/AddRiderDialog";
import { AssignRiderDialog } from "@/components/admin/AssignRiderDialog";

const Riders = () => {
  const riders = [
    { id: 1, name: "Ali Khan", phone: "+91 98765 43215", status: "active", deliveriesToday: 12 },
    { id: 2, name: "Ravi Kumar", phone: "+91 98765 43216", status: "active", deliveriesToday: 8 },
    { id: 3, name: "Sanjay Patel", phone: "+91 98765 43217", status: "inactive", deliveriesToday: 0 },
    { id: 4, name: "Mohammed Irfan", phone: "+91 98765 43218", status: "active", deliveriesToday: 15 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Riders</h1>
          <p className="text-muted-foreground">Manage delivery riders</p>
        </div>
        
        <div className="flex gap-2">
          <AddRiderDialog />
          <AssignRiderDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Riders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {riders.map((rider) => (
              <Link
                key={rider.id}
                to={`/admin/riders/${rider.id}`}
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{rider.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {rider.phone}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <Badge
                        variant={rider.status === "active" ? "default" : "secondary"}
                      >
                        {rider.status}
                      </Badge>
                      <p className="text-sm font-medium">
                        {rider.deliveriesToday} deliveries today
                      </p>
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

export default Riders;
