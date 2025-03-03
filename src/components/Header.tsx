
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-xl font-semibold">虚拟世界</Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <Button variant="outline" onClick={handleSignOut}>
              退出登录
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth">登录 / 注册</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
