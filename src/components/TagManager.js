import { useState } from "react";

export default function TagManager({ filePath, tags, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [localTags, setLocalTags] = useState(tags || []);

  const handleAddTag = () => {
    if (inputValue.trim() && !localTags.includes(inputValue.trim())) {
      const newTags = [...localTags, inputValue.trim()];
      setLocalTags(newTags);
      onSave(newTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = localTags.filter(tag => tag !== tagToRemove);
    setLocalTags(newTags);
    onSave(newTags);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddTag();
    }
  };

  return (
    <div className="mt-2">
      {isEditing ? (
        <div className="flex flex-wrap gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add tag..."
            className="text-xs border rounded px-2 py-1 w-24"
          />
          <button 
            onClick={handleAddTag}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          >
            Add
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="text-xs bg-gray-300 px-2 py-1 rounded"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {localTags.map(tag => (
            <span 
              key={tag} 
              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center"
            >
              {tag}
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add Tag
          </button>
        </div>
      )}
    </div>
  );
}
