import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "HAEMADEATDAWNADMIN";
const STORAGE_KEY = "admin_authenticated";

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export const AdminPasswordGate = ({ children }: AdminPasswordGateProps) => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem(STORAGE_KEY);
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      toast.success("Access granted");
    } else {
      toast.error("Incorrect password");
      setPassword("");
    }
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-subtle)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <Card className="p-8" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}>
            <div className="flex flex-col items-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Admin Access
                </h1>
                <p className="text-muted-foreground">
                  Enter the password to access the admin panel
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                  autoFocus
                />
                <Button type="submit" className="w-full">
                  Unlock Admin Panel
                </Button>
              </form>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
