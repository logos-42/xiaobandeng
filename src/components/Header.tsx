
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User } from "lucide-react";

export const Header = () => {
  const { session, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "已退出登录",
      description: "您已成功退出登录",
    });
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            VW
          </div>
          <span>虚拟世界</span>
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{session.user?.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>退出</span>
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="group">
              <Link to="/auth" className="flex items-center gap-1.5">
                <User className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>登录 / 注册</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
