import React from "react";

const MessageBubble = ({ message, isTyping }) => {
  if (isTyping) {
    return (
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
    );
  }

  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] p-3 mb-2 rounded-lg ${
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
  );
};

export default MessageBubble;
