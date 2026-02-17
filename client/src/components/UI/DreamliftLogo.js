import React from 'react';

const DreamliftLogo = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    default: "w-8 h-8", 
    large: "w-12 h-12",
    xlarge: "w-16 h-16"
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer decorative border */}
        <circle
          cx="50"
          cy="50"
          r="48"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="3 2"
          opacity="0.8"
        />
        
        {/* Inner circle background */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="url(#backgroundGradient)"
          stroke="url(#goldGradient)"
          strokeWidth="1"
        />
        
        {/* Letter D */}
        <path
          d="M25 25 L25 75 L40 75 C50 75 58 67 58 57 L58 43 C58 33 50 25 40 25 Z M32 32 L40 32 C45 32 50 37 50 43 L50 57 C50 62 45 67 40 67 L32 67 Z"
          fill="url(#blueGradient)"
        />
        
        {/* Letter L with elegant curve */}
        <path
          d="M65 25 L65 67 L85 67 L85 75 L58 75 L58 25 Z"
          fill="url(#goldGradient)"
        />
        
        {/* Decorative stars */}
        <g fill="url(#goldGradient)" opacity="0.7">
          <path d="M20 15 L21 18 L24 18 L21.5 20 L22.5 23 L20 21 L17.5 23 L18.5 20 L16 18 L19 18 Z" />
          <path d="M80 12 L80.5 14 L82.5 14 L81 15.5 L81.5 17.5 L80 16.5 L78.5 17.5 L79 15.5 L77.5 14 L79.5 14 Z" />
          <path d="M85 85 L85.5 87 L87.5 87 L86 88.5 L86.5 90.5 L85 89.5 L83.5 90.5 L84 88.5 L82.5 87 L84.5 87 Z" />
        </g>
        
        {/* Elegant swirl accent */}
        <path
          d="M70 35 Q75 30 80 35 Q85 40 80 45 Q75 50 70 45"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
          
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          
          <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

export default DreamliftLogo;