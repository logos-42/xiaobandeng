
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, User, Loader, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const { session, refreshSession } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear errors when switching tabs
  const handleTabChange = (value: string) => {
    setLoginError("");
    setSignupError("");
    setSignupSuccess(false);
    setNeedsEmailConfirmation(false);
  };

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
    setLoginError("");
    setNeedsEmailConfirmation(false);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check for the specific error about email confirmation
        if (error.message.includes("Email not confirmed")) {
          setNeedsEmailConfirmation(true);
        } else {
          setLoginError(error.message);
          toast({
            title: "登录失败",
            description: error.message,
            variant: "destructive",
          });
        }
      } else if (data?.session) {
        await refreshSession();
        toast({
          title: "登录成功",
          description: "欢迎回来！",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("登录错误:", error);
      setLoginError(error.message || "发生未知错误，请稍后重试");
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
    setSignupError("");
    setSignupSuccess(false);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email.split('@')[0], // Use part of email as username
          },
        },
      });

      if (error) {
        setSignupError(error.message);
        toast({
          title: "注册失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSignupSuccess(true);
        setNeedsEmailConfirmation(true);
        toast({
          title: "注册成功",
          description: "请检查您的电子邮箱以确认账户",
          variant: "success", // Using success variant
        });
        // Clear form
        setPassword("");
      }
    } catch (error: any) {
      console.error("注册错误:", error);
      setSignupError(error.message || "发生未知错误，请稍后重试");
      toast({
        title: "注册错误",
        description: "发生未知错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setLoginError("请输入您的电子邮箱地址");
      return;
    }

    setResendingConfirmation(true);
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setLoginError(error.message);
        toast({
          title: "重发确认邮件失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "确认邮件已发送",
          description: "请检查您的电子邮箱并点击确认链接",
          variant: "success",
        });
      }
    } catch (error: any) {
      console.error("重发确认邮件错误:", error);
      setLoginError(error.message || "发生未知错误，请稍后重试");
    } finally {
      setResendingConfirmation(false);
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
          
          <Tabs defaultValue="login" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-4 p-1">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">登录</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-2">
                  {loginError && !needsEmailConfirmation && (
                    <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {needsEmailConfirmation && (
                    <Alert variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Info className="h-4 w-4" />
                      <div className="flex flex-col gap-2">
                        <AlertDescription>您的电子邮箱尚未验证，请检查您的收件箱并点击确认链接</AlertDescription>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-fit text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800"
                          disabled={resendingConfirmation}
                          onClick={handleResendConfirmation}
                        >
                          {resendingConfirmation ? (
                            <span className="flex items-center">
                              <Loader className="mr-2 h-3 w-3 animate-spin" /> 发送中...
                            </span>
                          ) : (
                            "重新发送确认邮件"
                          )}
                        </Button>
                      </div>
                    </Alert>
                  )}
                  
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
                  {signupError && (
                    <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{signupError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {signupSuccess && (
                    <Alert variant="success" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>注册成功！请检查您的邮箱以验证您的账户。</AlertDescription>
                    </Alert>
                  )}
                  
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
