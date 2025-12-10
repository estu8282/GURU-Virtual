import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MoreVertical, Phone, Video } from 'lucide-react';
import { Message } from './types';
import { generateResponseScript, generateSpeechFromScript, initializeChat } from './services/geminiService';
import { AudioPlayer } from './components/AudioPlayer';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>(''); // 'Nulis naskah...' or 'Rekam suara...'
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
    // Welcome message
    const welcomeId = Date.now().toString();
    setMessages([{
      id: welcomeId,
      sender: 'ai',
      text: 'Halo, ini Pak ARIESS! Mau belajar apa hari ini? Tulis aja pertanyaannya santai kayak di WA ya.',
      timestamp: new Date(),
      // We don't generate audio for the initial static message to save tokens/load time, 
      // or we could text-to-speech this too. For now, text fallback.
      audioData: undefined 
    }]);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');
    const userMsgId = Date.now().toString();

    // Add user message
    const newMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    setLoadingStep('Pak ARIESS sedang mengetik...');

    try {
      // 1. Generate Script
      const script = await generateResponseScript(userText);
      setLoadingStep('Pak ARIESS sedang merekam suara...');
      
      // 2. Generate Audio
      const audioBuffer = await generateSpeechFromScript(script);

      // 3. Add AI Message
      const aiMsgId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMsgId,
        sender: 'ai',
        text: script, // We store the script but hide it visually or show it in a "transcript"
        audioData: audioBuffer as any, // Hacking type slightly as we pass Buffer not ArrayBuffer to player
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
      // Error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Waduh, koneksi Pak ARIESS putus-putus nih. Coba tanya lagi ya?',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 font-sans">
      {/* Mobile-first Container (max-w-md like a phone) */}
      <div className="w-full max-w-md bg-[#e5ddd5] flex flex-col h-screen shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <header className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shadow-md z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <img 
              src="https://picsum.photos/id/64/100/100" 
              alt="Pak ARIESS" 
              className="w-10 h-10 rounded-full border border-white/30"
            />
            <div>
              <h1 className="font-bold text-lg leading-tight">Pak ARIESS</h1>
              <p className="text-xs text-white/80">Online • Guru Virtual SMP</p>
            </div>
          </div>
          <div className="flex gap-4">
             <Video size={20} className="opacity-80" />
             <Phone size={20} className="opacity-80" />
             <MoreVertical size={20} className="opacity-80" />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-50">
          
          {/* Encryption Notice */}
          <div className="flex justify-center my-4">
             <div className="bg-[#fff5c4] text-gray-800 text-[10px] px-3 py-1 rounded-lg shadow-sm text-center max-w-[80%]">
               🔒 Pesan dan panggilan terenkripsi secara end-to-end. Tidak ada seorang pun di luar chat ini, termasuk WhatsApp, yang dapat membaca atau mendengarkannya.
             </div>
          </div>

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-lg p-2 shadow-sm relative ${
                  msg.sender === 'user' 
                    ? 'bg-[#d9fdd3] rounded-tr-none' 
                    : 'bg-white rounded-tl-none'
                }`}
              >
                {/* User Message: Text */}
                {msg.sender === 'user' && (
                  <p className="text-sm text-gray-800 px-1 pb-1">{msg.text}</p>
                )}

                {/* AI Message: Audio Player or Fallback Text */}
                {msg.sender === 'ai' && (
                  <div>
                    {msg.audioData ? (
                      <div className="py-1">
                        <AudioPlayer audioBuffer={msg.audioData as unknown as AudioBuffer} />
                        {/* Optional: Show script as a hidden transcript/details if needed */}
                         {/* For debugging or accessibility, un-comment below */}
                         {/* <p className="text-[10px] text-gray-500 mt-2 italic border-t pt-1">Transcript: {msg.text}</p> */}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 px-1 pb-1">{msg.text}</p>
                    )}
                  </div>
                )}
                
                {/* Timestamp */}
                <div className={`text-[10px] text-gray-500 mt-1 flex items-center gap-1 justify-end`}>
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {msg.sender === 'user' && (
                     <span className="text-blue-500">✓✓</span> 
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
               <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    {loadingStep === 'Pak ARIESS sedang merekam suara...' ? (
                       <Mic size={16} className="text-teal-500 animate-bounce" />
                    ) : (
                       <div className="flex gap-1">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                       </div>
                    )}
                    <span className="text-xs text-gray-500 italic">{loadingStep}</span>
                  </div>
               </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white px-2 py-2 flex items-center gap-2 z-10 sticky bottom-0">
          <div className="bg-gray-100 flex-1 rounded-full px-4 py-2 flex items-center border border-gray-200 focus-within:ring-2 focus-within:ring-teal-500/50">
             <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ketik pesan..."
                className="bg-transparent border-none outline-none w-full text-sm text-gray-800 placeholder-gray-500"
                disabled={isLoading}
             />
          </div>
          <button 
             onClick={handleSendMessage}
             disabled={isLoading || !inputValue.trim()}
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                inputValue.trim() 
                ? 'bg-[#008069] text-white hover:bg-[#006a55] shadow-md transform hover:scale-105' 
                : 'bg-gray-200 text-gray-400 cursor-default'
             }`}
          >
             {inputValue.trim() ? <Send size={20} className="ml-0.5" /> : <Mic size={20} />}
          </button>
        </div>

      </div>
    </div>
  );
};

export default App;
