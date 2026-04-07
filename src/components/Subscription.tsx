/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Check, Loader2, CreditCard, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../firebase';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Subscription() {
  const { user, isSubscribed: contextIsSubscribed } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(contextIsSubscribed);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSubscribed(contextIsSubscribed);
  }, [contextIsSubscribed]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 text-center py-12">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Vyapar AI Pro</h2>
        <p className="text-gray-600 max-w-md mx-auto">Please sign in to subscribe to Pro features and manage your account.</p>
        <button 
          onClick={signInWithGoogle} 
          className="inline-flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-8 py-4 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    );
  }

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const orderData = await response.json();
      
      if (orderData.error) {
        throw new Error(orderData.error);
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Vyapar AI Pro",
        description: "Monthly Subscription",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            setVerifying(true);
            const verifyRes = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + 1);
              
              await updateDoc(doc(db, 'users', user.uid), {
                isSubscribed: true,
                subscriptionEndDate: endDate.toISOString()
              });
              
              setIsSubscribed(true);
            } else {
              setError("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            setError("An error occurred while verifying your payment.");
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response.error.description);
      });
      rzp.open();

    } catch (err: any) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to initiate checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-gray-600 font-medium">Verifying your payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Vyapar AI Pro</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Upgrade to Pro to unlock unlimited bills, voice calculations, and digital khata entries for your business.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 max-w-md mx-auto">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-blue-600 text-white text-center">
          <h3 className="text-xl font-semibold mb-2">Monthly Plan</h3>
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl font-bold">₹499</span>
            <span className="text-blue-200">/month</span>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <ul className="space-y-4">
            {[
              'Unlimited Voice Calculations',
              'Unlimited Smart Bill Scans',
              'Unlimited Khata Customers',
              'WhatsApp Reminders',
              'Priority Support'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-gray-700">
                <div className="bg-blue-100 text-blue-600 rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <div className="pt-6 border-t border-gray-100">
            {isSubscribed ? (
              <div className="bg-green-50 text-green-700 rounded-xl p-4 text-center font-medium flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                You are subscribed to Pro!
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {loading ? 'Processing...' : 'Subscribe Now'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
