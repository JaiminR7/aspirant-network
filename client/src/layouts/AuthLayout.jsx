import { Sparkles } from "lucide-react";

const AuthLayout = ({ children, title, subtitle, footer }) => {
  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-r border-border relative">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-gradient">Aspirant Network</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
            {title || (
              <>
                Welcome back to your <br />
                <span className="text-primary">learning journey.</span>
              </>
            )}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            {subtitle || "Sign in to access your dashboard, connect with your circle, and continue growing with your community."}
          </p>
          
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 xl:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Aspirant Network</span>
          </div>

          <div className="bg-card border border-border shadow-xl rounded-[2rem] p-6 xl:p-8 relative">
            {children}
          </div>

          {footer && (
            <div className="mt-8">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
