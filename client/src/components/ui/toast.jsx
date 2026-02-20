import * as React from "react";
import { X } from "lucide-react";

const ToastContext = React.createContext({});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 3000);

    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ id, title, description, variant = "default", onClose }) => {
  const variants = {
    default: "bg-white border-gray-200",
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  const iconColors = {
    default: "text-gray-600",
    success: "text-emerald-600",
    error: "text-red-600",
    warning: "text-yellow-600",
  };

  return (
    <div
      className={`${variants[variant]} border rounded-lg shadow-lg p-4 min-w-[300px] animate-in slide-in-from-right duration-300`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && (
            <div className={`font-semibold mb-1 ${iconColors[variant]}`}>
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm text-gray-600">{description}</div>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
