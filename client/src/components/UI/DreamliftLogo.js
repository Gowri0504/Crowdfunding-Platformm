import React from 'react';
import DreamliftLogoImage from '../../assets/Dreamlift Logo.png';

const DreamliftLogo = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    default: "w-8 h-8",
    large: "w-12 h-12",
    xlarge: "w-16 h-16"
  };

  return (
    <img
      src={DreamliftLogoImage}
      alt="DreamLift Logo"
      className={`${sizeClasses[size]} ${className} object-contain`}
    />
  );
};

export default DreamliftLogo;
