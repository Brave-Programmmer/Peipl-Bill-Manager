import React from "react";
import { FiX, FiZap } from "react-icons/fi";

const ChatHeader = ({ onClose }) => (
  <div className="bg-gradient-to-r from-[#019b98] to-[#136664] text-white p-3 rounded-t-lg flex justify-between items-center">
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-white rounded-full"></div>
      <div className="text-sm font-medium">Phoenix AI Assistant</div>
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <FiX className="text-white" />
      </button>
    </div>
  </div>
);

export default ChatHeader;
