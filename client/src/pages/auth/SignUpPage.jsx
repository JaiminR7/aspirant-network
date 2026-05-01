import { SignUp } from "@clerk/clerk-react";

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
        forceRedirectUrl="/onboarding"
        appearance={{
          variables: {
            colorPrimary: "hsl(210, 100%, 50%)",
            colorBackground: "hsl(224, 71%, 4%)",
            colorText: "hsl(213, 31%, 91%)",
            colorInputBackground: "hsl(215, 28%, 17%)",
            colorInputText: "hsl(213, 31%, 91%)",
            colorTextSecondary: "hsl(215, 20%, 65%)",
            colorTextOnPrimaryBackground: "white",
            borderRadius: "1rem",
          },
          elements: {
            card: "bg-[#020617] border border-slate-800 shadow-2xl rounded-3xl p-4 md:p-6",
            headerTitle: "text-2xl font-black tracking-tight text-white",
            headerSubtitle: "text-slate-400 font-medium mb-4",
            socialButtonsBlockButton: "bg-slate-900 border-slate-800 hover:bg-slate-800 transition-all rounded-2xl h-12",
            socialButtonsBlockButtonText: "font-bold text-slate-200",
            socialButtonsIconButton: "bg-slate-900 border-slate-800 hover:bg-slate-800 transition-all rounded-2xl",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl font-bold shadow-lg shadow-blue-900/20 text-sm",
            formFieldInput: "bg-slate-900/50 border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-2xl px-4 py-3 transition-all text-white",
            formFieldLabel: "text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 ml-1",
            footer: "bg-transparent border-none p-0 mt-4",
            footerActionText: "text-slate-400 font-medium",
            footerActionLink: "text-blue-500 hover:text-blue-400 font-bold ml-1",
            dividerLine: "bg-slate-800",
            dividerText: "text-slate-500 text-[10px] uppercase font-black tracking-widest",
            formFieldAction: "text-blue-500 hover:text-blue-400 font-bold text-[10px] uppercase tracking-wider",
            identityPreviewText: "text-white font-bold",
            identityPreviewEditButton: "text-blue-500 hover:text-blue-400",
            internal: "hidden", // Hiding some internal clerk badges if possible
          },
        }}
      />
    </div>
  );
};

export default SignUpPage;
