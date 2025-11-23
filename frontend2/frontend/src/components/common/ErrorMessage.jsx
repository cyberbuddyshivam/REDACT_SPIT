import React from "react";
import { AlertCircle, XCircle } from "lucide-react";

const ErrorMessage = ({ message, onClose, type = "error" }) => {
  if (!message) return null;

  const styles = {
    error: "bg-rose-50 border-rose-200 text-rose-800",
    warning: "bg-orange-50 border-orange-200 text-orange-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-rose-600" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[type]} flex items-start gap-3`}>
      {icons[type]}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
