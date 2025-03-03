
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-accent">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse">加载中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <Outlet />;
};
