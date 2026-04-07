import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { GoogleGenAI } from '@google/genai';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, ScanLine } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

export default function BillScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      analyzeImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        analyzeImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Remove the data:image/jpeg;base64, part
      const base64Data = base64Image.split(',')[1];
      const mimeType = base64Image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Analyze this bill/invoice carefully. Extract the following information and present it clearly: 1. Total Amount 2. Tax/GST Amount 3. List of Items with prices. 4. Verify if the total calculation is correct based on the items and tax. Point out any discrepancies or potential fraud.',
            },
          ],
        },
      });

      setResult(response.text || 'No analysis result returned.');
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze the bill.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Smart Bill Scanner</h2>
        <p className="text-gray-600 mt-1">Scan or upload a bill to extract items, verify GST, and check totals.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Input */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden">
            {!image ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[3/4] flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-lg pointer-events-none"></div>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={capture}
                    className="bg-white text-gray-900 rounded-full p-4 shadow-lg transition-transform"
                  >
                    <Camera className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-800/80 text-white rounded-full p-4 shadow-lg transition-transform backdrop-blur-sm"
                  >
                    <Upload className="w-6 h-6" />
                  </motion.button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[3/4]">
                <img src={image} alt="Scanned Bill" className="w-full h-full object-contain" />
                <button
                  onClick={reset}
                  className="absolute top-4 right-4 bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
                >
                  Retake
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Analysis Result
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!image && !isAnalyzing && !result && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-12">
                <ScanLine className="w-12 h-12" />
                <p>Scan a bill to see the analysis here.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p>Analyzing bill details and verifying totals...</p>
              </div>
            )}

            {result && (
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{result}</ReactMarkdown>
                
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save to Khata
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
