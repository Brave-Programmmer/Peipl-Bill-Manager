import React from "react";

const QuickActions = ({ onActionSelect, conversationContext }) => {
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
    <div className="px-4 pt-3 pb-2 border-t border-gray-200 bg-white">
      <div className="flex flex-wrap gap-2 mb-2">
        {getQuickActions().map((action, index) => (
          <button
            key={index}
            onClick={() => onActionSelect(action.prompt)}
            className="text-xs bg-gradient-to-r from-[#019b98]/10 to-[#136664]/10 hover:from-[#019b98]/20 hover:to-[#136664]/20 text-[#019b98] px-3 py-2 rounded-full transition-all duration-200 border border-[#019b98]/20"
          >
            {action.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
