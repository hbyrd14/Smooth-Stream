import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CalendarPlus } from "lucide-react";

export default function IntakeConfirmation() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Request Submitted</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Thank you! Your event details have been securely transmitted to our production team. 
                We will review your requirements and be in touch shortly.
              </p>
            </div>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/intake">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Submit Another
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
