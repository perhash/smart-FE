import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Droplet, TruckIcon, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import { ConnectionTest } from "@/components/ConnectionTest";
import { ErrorTest } from "@/components/ErrorTest";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <Droplet className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold text-foreground">Smart Supply</h1>
        </div>
        
        <p className="text-xl text-muted-foreground">
          Modern Water Delivery Management System
        </p>

        {/* Connection Test */}
        <div className="w-full max-w-4xl">
          <ConnectionTest />
        </div>

        {/* Error Test */}
        <div className="w-full max-w-4xl">
          <ErrorTest />
        </div>

        <div className="grid gap-6 md:grid-cols-2 pt-8">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <UserCog className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-3">Admin Portal</h2>
            <p className="text-muted-foreground mb-6">
              Manage customers, riders, orders, and track all deliveries
            </p>
            <Link to="/admin">
              <Button className="w-full" size="lg">
                Access Admin Dashboard
              </Button>
            </Link>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <TruckIcon className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-3">Rider Portal</h2>
            <p className="text-muted-foreground mb-6">
              View assigned deliveries and manage order completions
            </p>
            <Link to="/rider">
              <Button className="w-full" size="lg" variant="outline">
                Access Rider Dashboard
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
