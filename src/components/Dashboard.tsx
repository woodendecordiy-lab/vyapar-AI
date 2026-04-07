import { ArrowRight, Calculator, ScanLine, FileAudio, BookOpen, CreditCard, Lock } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { isSubscribed } = useAuth();
  const { requirePremium } = useOutletContext<{ requirePremium: () => void }>();

  const handleProClick = (e: React.MouseEvent) => {
    if (!isSubscribed) {
      e.preventDefault();
      requirePremium();
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-gray-900">Welcome to Vyapar AI</h2>
        <p className="text-gray-600 mt-1">Your smart assistant for billing and calculations.</p>
      </motion.div>

      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={item}>
          <Link 
            to="/calculator"
            className="group block h-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-blue-100 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">
              FREE
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Calculator</h3>
            <p className="text-gray-600 text-sm mb-4">
              Speak natural language math commands in Hindi or English and get instant results.
            </p>
            <div className="flex items-center text-blue-600 text-sm font-medium mt-auto">
              Try it now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link 
            to={isSubscribed ? "/scanner" : "#"}
            onClick={handleProClick}
            className="group block h-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-purple-100 relative overflow-hidden"
          >
            {!isSubscribed && (
              <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> PRO
              </div>
            )}
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Bill Scanner</h3>
            <p className="text-gray-600 text-sm mb-4">
              Scan physical bills to automatically extract items, verify totals, and check GST.
            </p>
            <div className="flex items-center text-purple-600 text-sm font-medium mt-auto">
              {isSubscribed ? 'Try it now' : 'Unlock Feature'} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link 
            to={isSubscribed ? "/generator" : "#"}
            onClick={handleProClick}
            className="group block h-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-green-100 relative overflow-hidden"
          >
            {!isSubscribed && (
              <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> PRO
              </div>
            )}
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileAudio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice-to-Bill</h3>
            <p className="text-gray-600 text-sm mb-4">
              Speak out invoice details to automatically generate a structured PDF bill.
            </p>
            <div className="flex items-center text-green-600 text-sm font-medium mt-auto">
              {isSubscribed ? 'Try it now' : 'Unlock Feature'} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link 
            to={isSubscribed ? "/khata" : "#"}
            onClick={handleProClick}
            className="group block h-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-orange-100 relative overflow-hidden"
          >
            {!isSubscribed && (
              <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> PRO
              </div>
            )}
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Khata</h3>
            <p className="text-gray-600 text-sm mb-4">
              Track customer udhaar, record payments, and send WhatsApp reminders.
            </p>
            <div className="flex items-center text-orange-600 text-sm font-medium mt-auto">
              {isSubscribed ? 'Try it now' : 'Unlock Feature'} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link 
            to="/subscription"
            className="group block h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-white"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Vyapar AI Pro</h3>
            <p className="text-blue-100 text-sm mb-4">
              Upgrade to Pro for unlimited bills, voice calculations, and premium support.
            </p>
            <div className="flex items-center text-white text-sm font-medium mt-auto">
              {isSubscribed ? 'Manage Subscription' : 'Upgrade Now'} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
