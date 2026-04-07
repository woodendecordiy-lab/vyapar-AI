import { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Mic, Square, Loader2, FileText, Download, MessageCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'motion/react';

interface BillItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface BillData {
  customerName: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
}

export default function VoiceToBillGenerator() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or failed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: 'audio/webm',
              }
            },
            "Extract the invoice details from this audio. The user is speaking in Hindi, English, or Hinglish. Identify the customer name, phone number (if any), and the items with their quantities and prices. Calculate the total for each item, the subtotal, add a 5% tax, and calculate the grand total."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                customerName: { type: Type.STRING, description: "Name of the customer" },
                customerPhone: { type: Type.STRING, description: "Phone number of the customer, if mentioned" },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Item name" },
                      quantity: { type: Type.NUMBER, description: "Quantity" },
                      price: { type: Type.NUMBER, description: "Price per unit" },
                      total: { type: Type.NUMBER, description: "Total price for this item" }
                    },
                    required: ["name", "quantity", "price", "total"]
                  }
                },
                subtotal: { type: Type.NUMBER, description: "Sum of all item totals" },
                tax: { type: Type.NUMBER, description: "5% tax amount" },
                grandTotal: { type: Type.NUMBER, description: "Subtotal + tax" }
              },
              required: ["customerName", "items", "subtotal", "tax", "grandTotal"]
            }
          }
        });

        if (response.text) {
          const parsedData = JSON.parse(response.text) as BillData;
          setBillData(parsedData);
        } else {
          throw new Error("Failed to generate bill data.");
        }
      };
    } catch (err: any) {
      console.error("Error processing audio:", err);
      setError(err.message || "Failed to process voice input.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = () => {
    if (!billData) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Customer: ${billData.customerName}`, 14, 32);
    if (billData.customerPhone) {
      doc.text(`Phone: ${billData.customerPhone}`, 14, 40);
    }
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, billData.customerPhone ? 48 : 40);

    // Table
    const tableColumn = ["Item", "Quantity", "Price", "Total"];
    const tableRows = billData.items.map(item => [
      item.name,
      item.quantity.toString(),
      `Rs. ${item.price.toFixed(2)}`,
      `Rs. ${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: billData.customerPhone ? 55 : 47,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60;
    
    // Summary
    doc.text(`Subtotal: Rs. ${billData.subtotal.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Tax (5%): Rs. ${billData.tax.toFixed(2)}`, 14, finalY + 18);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: Rs. ${billData.grandTotal.toFixed(2)}`, 14, finalY + 28);

    doc.save(`Invoice_${billData.customerName.replace(/\\s+/g, '_')}.pdf`);
  };

  const shareOnWhatsApp = () => {
    if (!billData) return;
    
    // Generate PDF first so they have it downloaded
    generatePDF();

    let text = `*INVOICE SUMMARY*\\n\\n`;
    text += `Customer: ${billData.customerName}\\n`;
    text += `Date: ${new Date().toLocaleDateString()}\\n\\n`;
    text += `*Items:*\\n`;
    billData.items.forEach(item => {
      text += `- ${item.name} x${item.quantity} (Rs. ${item.price}) = Rs. ${item.total}\\n`;
    });
    text += `\\nSubtotal: Rs. ${billData.subtotal.toFixed(2)}\\n`;
    text += `Tax: Rs. ${billData.tax.toFixed(2)}\\n`;
    text += `*Grand Total: Rs. ${billData.grandTotal.toFixed(2)}*\\n\\n`;
    text += `Please find the detailed PDF invoice attached (downloaded to your device).`;

    const phone = billData.customerPhone ? billData.customerPhone.replace(/\\D/g, '') : '';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Voice-to-Bill Generator</h2>
        <p className="text-gray-600 mt-1">Speak out the customer name and items to automatically generate an invoice.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Recording */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="mb-8 relative">
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-blue-100 text-blue-600 shadow-[0_0_0_16px_rgba(59,130,246,0.1)] animate-pulse' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {isProcessing ? (
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </div>
          </div>

          <div className="space-y-4 w-full">
            {!isRecording && !isProcessing ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startRecording}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </motion.button>
            ) : isRecording ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5 fill-current" />
                Stop & Generate Bill
              </motion.button>
            ) : (
              <button disabled className="w-full bg-gray-100 text-gray-400 px-8 py-4 rounded-full font-medium text-lg flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Audio...
              </button>
            )}
            
            <p className="text-sm text-gray-500">
              {isRecording 
                ? "Listening... e.g. 'Customer is Rahul, 2 shirts for 500 each, 1 pant for 1000'" 
                : isProcessing 
                  ? "Extracting details..." 
                  : "Click to start recording invoice details."}
            </p>
          </div>
        </div>

        {/* Right Column: Generated Bill */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Generated Invoice
          </h3>

          {!billData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 py-12">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="text-center px-4">Your generated bill will appear here after processing.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900 text-lg">{billData.customerName}</p>
                {billData.customerPhone && (
                  <p className="text-sm text-gray-600">{billData.customerPhone}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto mb-6">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">Item</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">₹{item.price}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{billData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax (5%)</span>
                  <span>₹{billData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Grand Total</span>
                  <span>₹{billData.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generatePDF}
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={shareOnWhatsApp}
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
