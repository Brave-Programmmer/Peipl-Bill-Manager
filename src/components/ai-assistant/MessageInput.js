import React from "react";
import { FiSend, FiLoader } from "react-icons/fi";

const MessageInput = ({ input, setInput, isTyping, onSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
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
        💡 Try asking "Phoenix, save my bill" or "Phoenix, generate my bill" or
        "How to add GST?"
      </div>
    </form>
  );
};

export default MessageInput;
