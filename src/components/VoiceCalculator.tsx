import { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Mic, Square, Loader2, AlertCircle, Calculator as CalcIcon, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Calculation {
  id: string;
  transcript: string;
  result: string;
}

export default function VoiceCalculator() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<Calculation[]>([]);
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
            "You are a smart calculator for a shopkeeper. The user will speak a math problem in Hindi, English, or Hinglish (e.g., '5 mein 5 jod aur 7 jod' or '150 plus 200'). Transcribe exactly what they asked, and then calculate the final numerical result. Return a JSON object with 'transcript' and 'result'."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcript: { type: Type.STRING, description: "What the user said" },
                result: { type: Type.STRING, description: "The calculated numerical answer" }
              },
              required: ["transcript", "result"]
            }
          }
        });

        if (response.text) {
          const parsedData = JSON.parse(response.text);
          const newCalc: Calculation = {
            id: Date.now().toString(),
            transcript: parsedData.transcript,
            result: parsedData.result
          };
          setHistory(prev => [newCalc, ...prev]);
          
          // Speak the result using browser TTS
          const utterance = new SpeechSynthesisUtterance(parsedData.result);
          utterance.lang = 'hi-IN';
          window.speechSynthesis.speak(utterance);
        } else {
          throw new Error("Failed to calculate.");
        }
      };
    } catch (err: any) {
      console.error("Error processing audio:", err);
      setError(err.message || "Failed to process voice input.");
    } finally {
      setIsProcessing(false);
    }
  };

  const replayAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Voice-to-Text Calculator</h2>
        <p className="text-gray-600 mt-1">Speak your math problems naturally and see the text and result instantly.</p>
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
                Start Listening
              </motion.button>
            ) : isRecording ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5 fill-current" />
                Stop & Calculate
              </motion.button>
            ) : (
              <button disabled className="w-full bg-gray-100 text-gray-400 px-8 py-4 rounded-full font-medium text-lg flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating...
              </button>
            )}
            
            <p className="text-sm text-gray-500">
              {isRecording 
                ? "Listening... e.g. '500 mein se 120 minus karo'" 
                : isProcessing 
                  ? "Processing your calculation..." 
                  : "Click to start the voice calculator."}
            </p>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <CalcIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Calculation History</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <CalcIcon className="w-12 h-12 opacity-20" />
                <p className="text-center">Your calculations will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((calc) => (
                  <div key={calc.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-gray-600 text-sm font-medium">"{calc.transcript}"</p>
                      <button 
                        onClick={() => replayAudio(calc.result)}
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                        title="Hear Result"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-500 text-sm">Result</span>
                      <span className="text-2xl font-bold text-gray-900">{calc.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
