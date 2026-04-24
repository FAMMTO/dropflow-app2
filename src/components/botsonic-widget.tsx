"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export function BotsonicWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const token =
    process.env.NEXT_PUBLIC_BOTSONIC_TOKEN ||
    "27997401-c91d-4764-88f7-bef13b121db2";

  // URL del iframe modificada con tu dominio de Vercel (dropflow-app2.vercel.app)
  const iframeUrl = `https://widget.botsonic.com/CDN/index.html?service-base-url=https%3A%2F%2Fapi-bot.writesonic.com&token=${token}&base-origin=https%3A%2F%2Fdropflow-app2.vercel.app&instance-name=Botsonic&standalone=true&page-url=https%3A%2F%2Fdropflow-app2.vercel.app`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[380px] h-[600px] max-h-[80vh] max-w-[calc(100vw-3rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="bg-slate-900 dark:bg-slate-950 p-3 flex justify-between items-center text-white border-b border-slate-800">
            <span className="font-medium text-sm">Asistente IA</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-slate-800 p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe 
            src={iframeUrl}
            className="w-full flex-1 border-none bg-white"
            allow="clipboard-read; clipboard-write; microphone"
          />
        </div>
      )}
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-all hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
