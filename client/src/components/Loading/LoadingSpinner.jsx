import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = "Loading...", size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-brand-400 animate-spin`} />
      {text && <span className="text-sm font-medium text-slate-400">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
