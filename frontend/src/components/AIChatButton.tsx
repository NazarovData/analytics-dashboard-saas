import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIChat } from '@/components/AIChat'

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 flex items-center justify-center transition-all hover:scale-110"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              AI Помощник
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChat 
              analyticsData={null} 
              isOpen={true} 
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
