import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AuthError } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case "Invalid login credentials":
        return "邮箱或密码错误，请重试";
      case "Email not confirmed":
        return "请先验证您的邮箱";
      default:
        return error.message;
    }
  };

  return (
    <div className="container mx-auto max-w-md p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">情绪炼金术</h1>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'rgb(124 58 237)',
                  brandAccent: 'rgb(109 40 217)'
                }
              }
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: '邮箱',
                password_label: '密码',
                button_label: '登录',
              },
              sign_up: {
                email_label: '邮箱',
                password_label: '密码',
                button_label: '注册',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Auth;