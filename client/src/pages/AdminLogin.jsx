import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const ADMIN_DEMO_PASSWORD = "123456";

const AdminLogin = ({ onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === ADMIN_DEMO_PASSWORD) {
      localStorage.setItem("adminAccess", "true");
      setError("");
      onSuccess?.();
      return;
    }

    setError("Incorrect password");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Admin Access
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter Admin Password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full">
            Unlock Admin Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
