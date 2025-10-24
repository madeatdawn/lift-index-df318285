import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export const AdminPasswordGate = ({ children }: AdminPasswordGateProps) => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-subtle)" }}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
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
                  Admin Access Required
                </h1>
                <p className="text-muted-foreground">
                  You need admin privileges to access this page
                </p>
              </div>

              <div className="w-full space-y-3">
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Sign In as Admin
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                  Back to Quiz
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
