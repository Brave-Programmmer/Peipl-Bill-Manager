"use client";
import { useState, useEffect, useRef, memo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FiSend,
  FiX,
  FiMessageCircle,
  FiLoader,
  FiUser,
  FiZap,
} from "react-icons/fi";

export default function AIAssistant({
  onSaveBill,
  onOpenBill,
  onGenerateBill,
  onShowUserManual,
  billData,
  companyInfo,
  pdfPath,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "� **Welcome to Phoenix AI - Your Enhanced Billing Assistant!**\n\nI can help you with:\n\n💼 **Bill Management:**\n• Create professional bills instantly\n• Save and organize bills\n• Generate PDF invoices\n• Track bill history\n\n🧮 **Smart Calculations:**\n• GST calculations (CGST/SGST)\n• Multi-quantity support\n• Rate optimizations\n• Tax compliance\n\n🔧 **Advanced Features:**\n• Voice commands (coming soon)\n• Batch operations\n• Custom templates\n• Export to multiple formats\n\n⌨️ **Quick Actions:**\n• Type `save` to save current bill\n• Type `generate` to create PDF\n• Type `help` for more commands\n• Type `template` to use templates\n\n**What would you like to accomplish today?**",
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
    lastAction: null,
    billContext: {},
  });
  const [suggestions, setSuggestions] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [shortcuts, setShortcuts] = useState([]);
  const [learningMode, setLearningMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Topic detection functions
  const detectTopic = (message) => {
    const lower = message.toLowerCase();

    // Enhanced topic detection with better keyword matching
    const topicPatterns = {
      files: [
        "save",
        "export",
        "file",
        "download",
        "upload",
        "import",
        "json",
        "pdf",
      ],
      printing: ["print", "pdf", "export", "page", "margin", "layout"],
      calculations: [
        "gst",
        "tax",
        "calculate",
        "total",
        "amount",
        "subtotal",
        "discount",
        "rate",
      ],
      items: [
        "item",
        "product",
        "add",
        "remove",
        "quantity",
        "rate",
        "description",
      ],
      setup: [
        "company",
        "info",
        "business",
        "details",
        "settings",
        "configure",
      ],
      billing: ["bill", "invoice", "customer", "date", "number"],
      customer: ["customer", "client", "recipient", "buyer", "name", "address"],
    };

    // Score each topic based on keyword matches
    let topicScores = {};
    for (const [topic, keywords] of Object.entries(topicPatterns)) {
      topicScores[topic] = keywords.filter((kw) => lower.includes(kw)).length;
    }

    // Return topic with highest score, default to general
    const maxTopic = Object.entries(topicScores).reduce(
      (max, [topic, score]) => (score > max[1] ? [topic, score] : max),
      ["general", 0],
    );

    return maxTopic[1] > 0 ? maxTopic[0] : "general";
  };

  const detectIntent = (message) => {
    const lower = message.toLowerCase();

    // Enhanced intent detection with better patterns
    if (lower.match(/how\s+(to|do)/i) || lower.match(/guide|tutorial|step/i))
      return "tutorial";
    if (lower.match(/what\s+is|explain|describe/i)) return "explanation";
    if (lower.match(/problem|error|not working|issue|fail|bug/i))
      return "troubleshooting";
    if (lower.match(/can\s+i|is\s+it\s+possible|do\s+you\s+support/i))
      return "capability";
    if (lower.match(/help|assist|need|struggling/i)) return "request_help";
    if (lower.match(/why|reason|because/i)) return "explanation";
    if (lower.match(/quick|fast|easy|simple/i)) return "quick_answer";
    return "question";
  };

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

  const handleSendMessage = async (e) => {
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

    try {
      // If the user asks about analysis, call server-side Phoenix analyze API
      const lower = input.toLowerCase();
      const triggerKeywords = ["analyze"];
      const shouldCallServer = triggerKeywords.some((k) => lower.includes(k));

      if (shouldCallServer) {
        try {
          // send metadata with analysis request
          const analyzeMeta = {
            invoiceNo: billData?.billNumber || "",
            subtotal:
              typeof billData === "object" && billData.items
                ? billData.items.reduce(
                    (s, i) => s + (parseFloat(i.amount) || 0),
                    0,
                  )
                : undefined,
            grandTotal:
              typeof billData === "object"
                ? billData.total || undefined
                : undefined,
            gstin: companyInfo?.gst || billData?.customerGST || undefined,
            pdfPath: pdfPath || undefined,
          };

          const resp = await fetch("/api/phoenix-analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "analyze",
              meta: analyzeMeta,
              message: input,
            }),
          });
          const data = await resp.json();
          const responseText =
            data?.reply || data?.error || "No analysis available";
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: responseText,
              timestamp: new Date().toISOString(),
            },
          ]);
          setIsTyping(false);
          return;
        } catch (err) {
          console.error("Phoenix analyze API error:", err);
          // fall through to local response
        }
      }

      // Enhanced response with context awareness (local)
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
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "🤔 I'm having trouble processing your request right now. Could you try asking again?",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
      setIsTyping(false);
    }
  };

  // Enhanced AI response generator with context awareness and task execution
  const generateSmartResponse = (userInput, context) => {
    const lowerInput = userInput.toLowerCase();

    // Task detection patterns
    const taskPatterns = {
      saveBill: [
        "save bill",
        "save my bill",
        "export bill",
        "download bill",
        "save this bill",
      ],
      openBill: ["open bill", "load bill", "import bill", "open a bill"],
      generateBill: [
        "generate bill",
        "create bill",
        "make bill",
        "preview bill",
        "show bill",
      ],
      showManual: [
        "show manual",
        "open manual",
        "user manual",
        "help manual",
        "documentation",
      ],
    };

    // Check for task requests first
    for (const [task, patterns] of Object.entries(taskPatterns)) {
      if (patterns.some((pattern) => lowerInput.includes(pattern))) {
        const taskResponse = executeTask(task, userInput);
        if (taskResponse) return taskResponse;
      }
    }

    // Enhanced knowledge base with context-aware responses
    const knowledgeBase = {
      // Getting Started & Setup
      setup: [
        {
          patterns: [
            "getting started",
            "how to start",
            "first time",
            "new user",
          ],
          response:
            '🚀 **Getting Started Guide:**\n\n1. **Set up company info** - Click the hamburger menu (≡) and fill in your business details\n2. **Create your first bill** - The bill number auto-generates based on financial year\n3. **Add items** - Use the "+ Add Item" button in the items table\n4. **Generate bill** - Click "Generate Professional Bill" when ready\n5. **Save or print** - Export as JSON/PDF or print directly\n\n💡 **Pro tip:** Your company info is saved automatically for future bills!',
        },
        {
          patterns: ["company info", "company details", "business info"],
          response:
            "🏢 **Company Information Setup:**\n\nClick the hamburger menu (≡) in the top-left corner to:\n• Enter your company name and address\n• Add phone number and email\n• Set your GST number\n• Configure logo (if needed)\n\nThis information appears on all your bills and is saved for future use.",
        },
      ],

      // Bill Creation & Items
      items: [
        {
          patterns: ["add item", "new item", "add product", "create item"],
          response:
            '📦 **Adding Items to Your Bill:**\n\n1. Click **"+ Add Item"** in the items table\n2. Enter **description** (e.g., "Laptop Computer")\n3. Set **quantity** and **rate per unit**\n4. Choose **GST rate** (0%, 5%, 12%, 18%, or 28%)\n5. Click **"Add"** to save\n\n💡 **Tips:**\n• Use Tab to move between fields quickly\n• Items auto-calculate subtotals and GST\n• You can edit items by clicking the edit button',
        },
        {
          patterns: ["gst rate", "tax rate", "gst percentage"],
          response:
            "📊 **GST Rate Guide:**\n\n**Available rates:**\n• **0%** - Exempted goods (books, etc.)\n• **5%** - Essential items (food, medicine)\n• **12%** - Standard goods and services\n• **18%** - Most goods and services\n• **28%** - Luxury items and services\n\nThe system automatically calculates GST based on your selection.",
        },
      ],

      // File Operations
      files: [
        {
          patterns: ["save bill", "save as", "export bill"],
          response:
            '💾 **Saving Your Bill:**\n\n**Quick save:** Click "Save Bill" (💾) to export as JSON file\n**File format:** `.peiplbill` or `.json`\n**Location:** Choose where to save on your computer\n**Auto-naming:** Files are named with bill number and date\n\n💡 **Tip:** Use Ctrl+S for quick saving!\n\nOr just ask me: "Phoenix, save my bill" and I\'ll do it for you!',
        },
        {
          patterns: ["open bill", "load bill", "import bill"],
          response:
            '📂 **Opening Saved Bills:**\n\n1. Click **"Open Bill"** (📂) button\n2. Select your `.peiplbill` or `.json` file\n3. Bill loads with all data intact\n4. Continue editing or generate new bill\n\n💡 **Tip:** Use Ctrl+O for quick opening!\n\nOr ask me: "Phoenix, open a bill" and I\'ll open the file dialog for you!',
        },
        {
          patterns: ["file association", "associate files", "open with"],
          response:
            '🔗 **File Associations (Windows only):**\n\n1. Click **"Setup File Associations"** (🔗)\n2. Follow the prompts to associate `.peiplbill` files\n3. Double-click `.peiplbill` files to open in the app\n4. Makes it easy to open bills from File Explorer',
        },
      ],

      // Printing
      printing: [
        {
          patterns: ["print bill", "print invoice", "print preview"],
          response:
            '🖨️ **Printing Your Bill:**\n\n1. **Generate preview** - Click "Generate Professional Bill"\n2. **Open print dialog** - Use Ctrl+P (or Cmd+P on Mac)\n3. **Select printer** - Choose your printer from the list\n4. **Print settings** - Set paper size to A4, quality to high\n5. **Print** - Click print to get your professional invoice\n\n💡 **Tip:** The bill is formatted for A4 paper with proper margins!\n\nOr ask me: "Phoenix, generate my bill" and I\'ll start the process!',
        },
        {
          patterns: ["print settings", "printer settings", "print options"],
          response:
            "⚙️ **Print Settings Guide:**\n\n**Recommended settings:**\n• **Paper size:** A4\n• **Orientation:** Portrait\n• **Quality:** High\n• **Color:** Color (for best results)\n• **Margins:** Default\n\n**Advanced options:**\n• Scale to fit page\n• Print background colors\n• Headers and footers",
        },
      ],

      // Calculations
      calculations: [
        {
          patterns: ["calculate", "total", "amount", "subtotal", "math"],
          response:
            "🧮 **Automatic Calculations:**\n\nThe system calculates:\n• **Subtotal** = Quantity × Rate\n• **GST Amount** = Subtotal × GST Rate\n• **Total** = Subtotal + GST\n• **Grand Total** = Sum of all items\n\nEverything updates in real-time as you type!",
        },
        {
          patterns: ["discount", "reduce amount", "percentage off"],
          response:
            "💰 **Applying Discounts:**\n\n**Method 1 - Percentage discount:**\nReduce the rate field by the discount percentage\n\n**Method 2 - Fixed discount:**\nModify the total amount in the bill summary\n\n**Method 3 - Item discount:**\nAdjust individual item rates for specific discounts",
        },
      ],

      // Troubleshooting
      troubleshooting: [
        {
          patterns: ["error", "problem", "not working", "issue", "bug"],
          response:
            '🔧 **Troubleshooting Guide:**\n\n**Common issues & solutions:**\n• **Bill not saving?** - Check file permissions and try again\n• **Print not working?** - Ensure printer is connected and try Ctrl+P\n• **Calculations wrong?** - Verify quantities and rates are numbers\n• **App slow?** - Close other tabs and refresh the page\n\n💡 **Tip:** Use the User Manual (📚) for detailed help!\n\nOr ask me: "Phoenix, show user manual" for instant access!',
        },
        {
          patterns: ["slow", "lag", "performance", "loading"],
          response:
            "⚡ **Performance Tips:**\n\n**To improve speed:**\n• Close unnecessary browser tabs\n• Clear browser cache (Ctrl+Shift+R)\n• Use Chrome or Edge for best performance\n• Restart the app if needed\n• Large bills may take longer to process",
        },
      ],

      // Keyboard Shortcuts
      shortcuts: [
        {
          patterns: ["keyboard", "shortcut", "hotkey", "key"],
          response:
            "⌨️ **Keyboard Shortcuts:**\n\n**Essential shortcuts:**\n• **Ctrl+O** - Open bill file\n• **Ctrl+S** - Save current bill\n• **Ctrl+P** - Print bill\n• **Tab** - Move to next field\n• **Enter** - Submit forms\n• **Esc** - Close modals/fullscreen\n• **F11** - Toggle fullscreen mode\n\n💡 **Pro tip:** These work in most browsers!",
        },
      ],
    };

    // Check each category for matches
    for (const [category, responses] of Object.entries(knowledgeBase)) {
      const match = responses.find((item) =>
        item.patterns.some((pattern) => lowerInput.includes(pattern)),
      );
      if (match) {
        return match.response;
      }
    }

    // Context-aware responses based on conversation history
    if (
      context.previousQuestions.some((q) => q.toLowerCase().includes("gst"))
    ) {
      if (lowerInput.includes("rate") || lowerInput.includes("percentage")) {
        return "📊 Since we were discussing GST, here are the rates again:\n\n• 0% - Exempted goods\n• 5% - Essential items\n• 12% - Standard goods\n• 18% - Most services\n• 28% - Luxury items\n\nWhich rate would you like help with?";
      }
    }

    // Conversational responses
    if (lowerInput.includes("thank") || lowerInput.includes("thanks")) {
      return "You're very welcome! 😊 Feel free to ask if you need help with anything else. Is there another billing question I can assist with?";
    }

    if (
      lowerInput.includes("bye") ||
      lowerInput.includes("goodbye") ||
      lowerInput.includes("see you")
    ) {
      return "👋 Goodbye! Don't hesitate to come back if you need help with your billing. Have a great day!";
    }

    if (lowerInput.includes("help") || lowerInput.includes("what can you do")) {
      return '🤖 **I can help you with:**\n\n• Creating and managing bills\n• Adding items and setting GST rates\n• Saving and opening bill files\n• Printing professional invoices\n• Understanding calculations\n• Troubleshooting issues\n• Learning keyboard shortcuts\n\n**I can also perform tasks for you!**\n\nTry asking:\n• "Phoenix, save my bill"\n• "Phoenix, open a bill"\n• "Phoenix, generate my bill"\n• "Phoenix, show user manual"\n\nWhat specific area would you like help with?';
    }

    // Default response with intelligent suggestions
    const suggestions = [];
    if (lowerInput.length < 10)
      suggestions.push('Try asking "how to save a bill" or "how to add items"');
    if (!lowerInput.includes("?"))
      suggestions.push('Questions work best - try adding "how" or "what"');
    suggestions.push(
      "I can help with billing, GST, printing, and file operations",
    );

    return `🤔 I want to help, but I'm not sure I understood your question about "${userInput}".\n\n${suggestions.join("\n")}\n\nCould you rephrase or ask about:\n• Bill creation and items\n• GST and calculations\n• Saving and printing\n• Troubleshooting issues\n\nOr ask me to perform a task like "Phoenix, save my bill"!`;
  };

  // Task execution function
  const executeTask = (taskType, userInput) => {
    switch (taskType) {
      case "saveBill":
        if (onSaveBill) {
          setTimeout(() => onSaveBill(), 500);
          return "💾 **Task Executed!**\n\nI'm saving your bill now... The save dialog should appear shortly.\n\nYou can also use Ctrl+S for quick saving anytime!";
        }
        return '💾 **Save Bill Task:**\n\nI\'d love to save your bill for you! However, I need permission to access the save functionality.\n\nFor now, please use the "Save Bill" button (💾) in the main interface, or press Ctrl+S.';

      case "openBill":
        if (onOpenBill) {
          setTimeout(() => onOpenBill(), 500);
          return "📂 **Task Executed!**\n\nI'm opening the file dialog for you to select a bill... The open dialog should appear shortly.\n\nYou can also use Ctrl+O for quick opening!";
        }
        return '📂 **Open Bill Task:**\n\nI\'d love to open a bill for you! However, I need permission to access the file dialog.\n\nFor now, please use the "Open Bill" button (📂) in the main interface, or press Ctrl+O.';

      case "generateBill":
        if (onGenerateBill) {
          setTimeout(() => onGenerateBill(), 500);
          return '📄 **Task Executed!**\n\nI\'m generating your professional bill now... The preview should appear shortly.\n\nYou can also click the "Generate Professional Bill" button anytime!';
        }
        return '📄 **Generate Bill Task:**\n\nI\'d love to generate your bill for you! However, I need permission to access the bill generation functionality.\n\nFor now, please use the "Generate Professional Bill" button in the main interface.';

      case "showManual":
        if (onShowUserManual) {
          setTimeout(() => onShowUserManual(), 500);
          return '📚 **Task Executed!**\n\nI\'m opening the user manual for you... The manual should appear shortly.\n\nYou can also click the "User Manual" button (📚) anytime!';
        }
        return '📚 **User Manual Task:**\n\nI\'d love to show you the user manual! However, I need permission to access the manual functionality.\n\nFor now, please use the "User Manual" button (📚) in the main interface.';

      default:
        return null;
    }
  };

  // Enhanced quick action buttons with context awareness
  const getQuickActions = () => {
    const baseActions = [
      { text: "Save my bill", prompt: "save my bill" },
      { text: "Open a bill", prompt: "open a bill" },
      { text: "Generate bill", prompt: "generate bill" },
      { text: "Show manual", prompt: "show manual" },
    ];

    // Add context-specific actions
    if (conversationContext.currentTopic === "calculations") {
      baseActions.push({
        text: "GST rates",
        prompt: "What are the GST rates?",
      });
    }
    if (conversationContext.currentTopic === "files") {
      baseActions.push({
        text: "File formats",
        prompt: "What file formats can I save as?",
      });
    }
    if (conversationContext.currentTopic === "printing") {
      baseActions.push({
        text: "Print settings",
        prompt: "What print settings should I use?",
      });
    }

    return baseActions.slice(0, 4); // Limit to 4 actions
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-96 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-gray-200 animate-fade-in">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-[#019b98] to-[#136664] text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FiZap className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Phoenix AI</h3>
                <p className="text-white/80 text-sm">Billing assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close assistant"
            >
              <FiX className="text-white" />
            </button>
          </div>

          {/* Messages with enhanced styling */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-[#019b98] text-white rounded-br-none"
                      : message.isError
                        ? "bg-red-50 border border-red-200 text-red-800 rounded-bl-none"
                        : message.isWelcome
                          ? "bg-blue-50 border border-blue-200 text-blue-800 rounded-bl-none"
                          : "bg-white border border-gray-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className="text-xs mt-1 opacity-60 text-right">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 w-fit">
                <div className="w-2 h-2 bg-[#019b98] rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-[#019b98] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#019b98] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Quick Actions */}
          <div className="px-4 pt-3 pb-2 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap gap-2 mb-2">
              {getQuickActions().map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInput(action.prompt)}
                  className="text-xs bg-gradient-to-r from-[#019b98]/10 to-[#136664]/10 hover:from-[#019b98]/20 hover:to-[#136664]/20 text-[#019b98] px-3 py-2 rounded-full transition-all duration-200 border border-[#019b98]/20"
                >
                  {action.text}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 bg-white"
          >
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about billing..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:border-transparent transition-all"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-[#019b98] text-white p-2 rounded-lg hover:bg-[#017a77] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {isTyping ? <FiLoader className="animate-spin" /> : <FiSend />}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              💡 Try asking "Phoenix, save my bill" or "Phoenix, generate my
              bill" or "How to add GST?"
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#019b98] text-white rounded-full shadow-lg hover:bg-[#017a77] transition-all duration-300 flex items-center justify-center hover:scale-110"
          aria-label="Open AI Assistant"
        >
          <FiMessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
