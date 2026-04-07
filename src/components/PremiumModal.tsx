import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
              <p className="text-gray-600 mb-8">Unlock this feature and get access to all Pro tools for your business.</p>

              <div className="space-y-4 text-left mb-8 bg-gray-50 p-4 rounded-2xl">
                {[
                  'Smart Bill Scanner',
                  'Voice Bill Generator',
                  'Digital Khata Book',
                  'Unlimited Usage'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1 shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose();
                  navigate('/subscription');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Subscribe Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
