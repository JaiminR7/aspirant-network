import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

const Admin = () => {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(
    localStorage.getItem("adminAccess") === "true",
  );

  const handleUnlock = () => {
    setHasAccess(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAccess");
    setHasAccess(false);
    navigate("/", { replace: true });
  };

  if (!hasAccess) {
    return <AdminLogin onSuccess={handleUnlock} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default Admin;
