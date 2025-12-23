import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiMessageCircle } from "react-icons/fi";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import QuickActions from "./QuickActions";
import MessageInput from "./MessageInput";

// Helper functions
const detectTopic = (message) => {
  const lower = message.toLowerCase();
  if (
    lower.includes("save") ||
    lower.includes("export") ||
    lower.includes("file")
  )
    return "files";
  if (lower.includes("print") || lower.includes("pdf")) return "printing";
  if (
    lower.includes("gst") ||
    lower.includes("tax") ||
    lower.includes("calculate")
  )
    return "calculations";
  if (
    lower.includes("item") ||
    lower.includes("product") ||
    lower.includes("add")
  )
    return "items";
  if (lower.includes("company") || lower.includes("info")) return "setup";
  return "general";
};

const detectIntent = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes("how to") || lower.includes("how do")) return "tutorial";
  if (lower.includes("what is") || lower.includes("explain"))
    return "explanation";
  if (
    lower.includes("problem") ||
    lower.includes("error") ||
    lower.includes("not working")
  )
    return "troubleshooting";
  if (lower.includes("can i") || lower.includes("is it possible"))
    return "capability";
  return "question";
};

const generateSmartResponse = (input, context) => {
  const lowerInput = input.toLowerCase();

  // Task execution
  if (
    lowerInput.includes("save") &&
    (lowerInput.includes("bill") || lowerInput.includes("invoice"))
  ) {
    return "💾 **Task Executed!**\nI'm saving your bill now... The save dialog should appear shortly.\n\nYou can also use Ctrl+S for quick saving anytime!";
  }

  if (
    lowerInput.includes("open") &&
    (lowerInput.includes("bill") || lowerInput.includes("invoice"))
  ) {
    return "📂 **Task Executed!**\nOpening file browser to select your bill...";
  }

  if (
    lowerInput.includes("generate") &&
    (lowerInput.includes("bill") || lowerInput.includes("invoice"))
  ) {
    return "✨ **Task Executed!**\nStarting a new bill for you...";
  }

  // Knowledge base responses
  if (lowerInput.includes("gst") || lowerInput.includes("tax")) {
    return "📊 **GST Information:**\n\n• **Standard GST Rates in India:**\n  - 0%: Essential items\n  - 5%: Common use items\n  - 12% and 18%: Standard rates\n  - 28%: Luxury items\n\n• **GST Calculation:**\n  GST Amount = (Original Cost × GST%) / 100\n  Total = Original Cost + GST Amount\n\nWould you like me to calculate GST for a specific amount?";
  }

  if (lowerInput.includes("print") || lowerInput.includes("pdf")) {
    return "🖨️ **Printing Options:**\n\n1. **Quick Print** (Ctrl+P):\n   - Prints with default settings\n   - Best for standard A4 printing\n\n2. **Print Preview** (Ctrl+Shift+P):\n   - Preview before printing\n   - Adjust margins and layout\n\n3. **Save as PDF** (Ctrl+Shift+S):\n   - Save as a professional PDF\n   - Preserves all formatting";
  }

  // Default response
  return "I'm Phoenix, your billing assistant! I can help you with:\n\n• Creating and managing bills\n• Saving and opening files\n• Printing invoices\n• Calculations and GST\n• Troubleshooting issues\n\nWhat would you like to know or do?";
};

const AIAssistant = ({
  onSaveBill,
  onOpenBill,
  onGenerateBill,
  onShowUserManual,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm Phoenix, your intelligent billing assistant! I can help you with:\n\n• Creating and managing bills\n• Saving and opening files\n• Printing invoices\n• Calculations and GST\n• Troubleshooting issues\n• Keyboard shortcuts\n\nI can also perform tasks for you - just ask!\n\nWhat would you like to know or do?",
      timestamp: new Date().toISOString(),
      isWelcome: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    currentTopic: null,
    userIntentions: [],
    previousQuestions: [],
  });
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track conversation context
  useEffect(() => {
    if (messages.length > 1) {
      const lastUserMessage = messages.filter((m) => m.role === "user").pop();
      if (lastUserMessage) {
        setConversationContext((prev) => ({
          previousQuestions: [
            ...prev.previousQuestions.slice(-3),
            lastUserMessage.content,
          ],
          currentTopic: detectTopic(lastUserMessage.content),
          userIntentions: [
            ...new Set([
              ...prev.userIntentions,
              detectIntent(lastUserMessage.content),
            ]),
          ],
        }));
      }
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!input.trim()) return;

      // Add user message
      const userMessage = {
        role: "user",
        content: input,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      // Simulate AI response
      setTimeout(
        () => {
          const response = generateSmartResponse(input, conversationContext);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: response,
              timestamp: new Date().toISOString(),
              context: conversationContext.currentTopic,
            },
          ]);
          setIsTyping(false);
        },
        800 + Math.random() * 400,
      );
    },
    [input, conversationContext],
  );

  const handleQuickAction = (prompt) => {
    setInput(prompt);
    // Small delay to allow state update before sending
    setTimeout(() => {
      const event = { preventDefault: () => {} };
      handleSendMessage(event);
    }, 100);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#019b98] text-white rounded-full shadow-lg hover:bg-[#017a77] transition-all duration-300 flex items-center justify-center hover:scale-110"
          aria-label="Open AI Assistant"
        >
          <FiMessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
      style={{ height: "70vh" }}
    >
      <ChatHeader onClose={() => setIsOpen(false)} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isTyping && <MessageBubble isTyping={true} />}
        <div ref={messagesEndRef} />
      </div>

      <QuickActions
        onActionSelect={handleQuickAction}
        conversationContext={conversationContext}
      />

      <MessageInput
        input={input}
        setInput={setInput}
        isTyping={isTyping}
        onSubmit={handleSendMessage}
      />
    </div>
  );
};

export default AIAssistant;
