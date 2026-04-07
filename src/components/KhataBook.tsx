import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, Plus, MessageCircle, ArrowUpRight, ArrowDownRight, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface KhataCustomer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  balance: number;
  lastUpdated: string;
}

interface KhataTransaction {
  id: string;
  userId: string;
  customerId: string;
  amount: number;
  type: 'credit' | 'payment';
  date: string;
  description?: string;
}

export default function KhataBook() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(null);
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'credit' | 'payment'>('credit');
  const [txDesc, setTxDesc] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'khataCustomers'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KhataCustomer));
      // Sort by lastUpdated descending locally
      data.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      setCustomers(data);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedCustomer) return;
    const q = query(
      collection(db, 'khataTransactions'),
      where('userId', '==', user.uid),
      where('customerId', '==', selectedCustomer.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KhataTransaction));
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user, selectedCustomer]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCustomerName.trim()) return;
    
    try {
      await addDoc(collection(db, 'khataCustomers'), {
        userId: user.uid,
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        balance: 0,
        lastUpdated: new Date().toISOString()
      });
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err) {
      console.error("Error adding customer:", err);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCustomer || !txAmount) return;
    
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const dateStr = new Date().toISOString();
      
      // Add transaction
      await addDoc(collection(db, 'khataTransactions'), {
        userId: user.uid,
        customerId: selectedCustomer.id,
        amount,
        type: txType,
        date: dateStr,
        description: txDesc.trim()
      });

      // Update customer balance
      const newBalance = txType === 'credit' 
        ? selectedCustomer.balance + amount 
        : selectedCustomer.balance - amount;

      await updateDoc(doc(db, 'khataCustomers', selectedCustomer.id), {
        balance: newBalance,
        lastUpdated: dateStr
      });

      // Update local selected customer to reflect balance immediately
      setSelectedCustomer(prev => prev ? { ...prev, balance: newBalance, lastUpdated: dateStr } : null);

      setShowAddTransaction(false);
      setTxAmount('');
      setTxDesc('');
      setTxType('credit');
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  const sendReminder = (customer: KhataCustomer) => {
    if (!customer.phone) {
      alert("Please add a phone number for this customer first.");
      return;
    }
    const phone = customer.phone.replace(/\D/g, '');
    const text = `Namaste ${customer.name} ji,\nAapka Vyapar AI khata balance Rs. ${customer.balance} pending hai. Kripya jaldi bhugtan karein.\nDhanyawad!`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const totalUdhaar = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const totalAdvance = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);

  if (selectedCustomer) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
        </button>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
            {selectedCustomer.phone && <p className="text-gray-500">{selectedCustomer.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-2xl font-bold ${selectedCustomer.balance > 0 ? 'text-red-600' : selectedCustomer.balance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
              ₹{Math.abs(selectedCustomer.balance).toFixed(2)}
              <span className="text-sm font-normal ml-1">
                {selectedCustomer.balance > 0 ? '(Due)' : selectedCustomer.balance < 0 ? '(Advance)' : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setTxType('credit'); setShowAddTransaction(true); }}
            className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowUpRight className="w-5 h-5" /> Gave Credit (Udhaar)
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setTxType('payment'); setShowAddTransaction(true); }}
            className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowDownRight className="w-5 h-5" /> Received Payment
          </motion.button>
        </div>

        {showAddTransaction && (
          <form onSubmit={handleAddTransaction} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {txType === 'credit' ? 'Add Credit (Udhaar)' : 'Add Payment Received'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={e => setTxAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  value={txDesc}
                  onChange={e => setTxDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. 2 shirts"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddTransaction(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
              <button type="submit" className={`px-4 py-2 text-white rounded-lg font-medium ${txType === 'credit' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                Save Transaction
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Transaction History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No transactions yet.</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {tx.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.type === 'credit' ? 'Credit Given' : 'Payment Received'}</p>
                      <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleString()} {tx.description && `• ${tx.description}`}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.type === 'credit' ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{tx.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Digital Khata Book</h2>
          <p className="text-gray-600 mt-1">Manage your customer credits and payments easily.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddCustomer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Udhaar (To Collect)</p>
          <p className="text-3xl font-bold text-red-600">₹{totalUdhaar.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Advance (To Pay)</p>
          <p className="text-3xl font-bold text-green-600">₹{totalAdvance.toFixed(2)}</p>
        </div>
      </div>

      {showAddCustomer && (
        <form onSubmit={handleAddCustomer} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">New Customer</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input 
                type="text" 
                required
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Rahul Kumar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
              <input 
                type="tel" 
                value={newCustomerPhone}
                onChange={e => setNewCustomerPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddCustomer(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Save Customer</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Customer List
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No customers added yet. Add a customer to start tracking udhaar.</p>
            </div>
          ) : (
            customers.map(customer => (
              <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{customer.name}</h4>
                  {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={`font-bold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      ₹{Math.abs(customer.balance).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customer.balance > 0 ? 'Due' : customer.balance < 0 ? 'Advance' : 'Settled'}
                    </p>
                  </div>
                  {customer.balance > 0 && customer.phone && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); sendReminder(customer); }}
                      className="p-2 text-[#25D366] hover:bg-[#25D366]/10 rounded-full transition-colors"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
