import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaUser } from 'react-icons/fa';

const LoginSuccessPopup = ({ show, user, onComplete }) => {
  const [stage, setStage] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (show) {
      // Reset avatar error state when popup shows
      setAvatarError(false);
      
      const timer1 = setTimeout(() => setStage(1), 500);
      const timer2 = setTimeout(() => setStage(2), 1500);
      const timer3 = setTimeout(() => {
        setStage(0);
        onComplete();
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: stage >= 1 ? 1 : 0 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-4xl text-green-500" />
              </div>
            </motion.div>

            {/* Welcome Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: stage >= 1 ? 0 : 20, opacity: stage >= 1 ? 1 : 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600 mb-4">
                Hello, {user?.name || 'User'}!
              </p>
            </motion.div>

            {/* User Avatar */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: stage >= 2 ? 1 : 0, 
                rotate: stage >= 2 ? 0 : -180 
              }}
              transition={{ type: "spring", delay: 0.6 }}
              className="flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {user?.avatar && !avatarError ? (
                  <img 
                    src={user.avatar.url || user.avatar} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <FaUser className="text-2xl text-blue-500" />
                )}
              </div>
            </motion.div>

            {/* Loading Bar */}
            <motion.div
              className="mt-6 h-1 bg-gray-200 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 1 ? 1 : 0 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                initial={{ width: "0%" }}
                animate={{ width: stage >= 2 ? "100%" : "0%" }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginSuccessPopup;