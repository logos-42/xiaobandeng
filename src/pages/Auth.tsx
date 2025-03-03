
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, User, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If user is already logged in, redirect to home page
  if (session) {
    return <Navigate to="/" />;
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "登录失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "登录成功",
          description: "欢迎回来！",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("登录错误:", error);
      toast({
        title: "登录错误",
        description: "发生未知错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast({
          title: "注册失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "注册成功",
          description: "请检查您的电子邮箱以确认账户",
        });
      }
    } catch (error) {
      console.error("注册错误:", error);
      toast({
        title: "注册错误",
        description: "发生未知错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 bg-gradient-to-br from-background to-accent">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">虚拟世界</h1>
          <p className="text-muted-foreground mt-2">探索无限可能的AI虚拟世界</p>
        </div>
        
        <Card className="border-none shadow-lg backdrop-blur-sm bg-white/80 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-center">欢迎回来</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              登录或注册以继续探索
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 p-1">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">登录</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">电子邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* You can add a "Remember me" checkbox here if needed */}
                    </div>
                    <div>
                      <a href="#" className="text-sm font-medium text-primary hover:underline">
                        忘记密码?
                      </a>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pt-0">
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-200 hover:translate-y-[-2px]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader className="mr-2 h-4 w-4 animate-spin" /> 登录中...
                      </span>
                    ) : (
                      "登录"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-sm font-medium">电子邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-sm font-medium">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password-signup"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pt-0">
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-200 hover:translate-y-[-2px]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader className="mr-2 h-4 w-4 animate-spin" /> 注册中...
                      </span>
                    ) : (
                      "注册"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="px-6 pb-6 pt-2 text-center text-sm text-muted-foreground">
            <p>继续使用代表您同意我们的<a href="#" className="font-medium text-primary hover:underline">服务条款</a>和<a href="#" className="font-medium text-primary hover:underline">隐私政策</a></p>
          </div>
        </Card>
      </div>
    </div>
  );
}
