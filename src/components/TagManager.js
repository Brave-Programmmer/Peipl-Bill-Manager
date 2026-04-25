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
    const newTags = localTags.filter((tag) => tag !== tagToRemove);
    setLocalTags(newTags);
    onSave(newTags);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddTag();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue("");
    }
  };

  return (
    <div className="mt-3">
      {isEditing
        ? <div className="flex flex-wrap items-center gap-2 p-3 bg-bg-alt rounded-lg border border-border-subtle animate-fade-in">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="w-full text-sm bg-surface border border-border-light rounded-md px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTag}
                disabled={
                  !inputValue.trim() || localTags.includes(inputValue.trim())
                }
                className="btn btn-primary btn-sm"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setInputValue("");
                }}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        : <div className="flex flex-wrap gap-2">
            {localTags.length === 0
              ? <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors px-3 py-1 rounded-md hover:bg-bg-alt"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add tags
                </button>
              : <>
                  {localTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-soft text-primary border border-primary-muted rounded-md text-sm font-medium animate-fade-in group hover:bg-primary hover:text-text-inverse transition-all"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-primary/60 hover:text-primary group-hover:text-inherit transition-colors p-0.5 rounded hover:bg-white/20"
                        title={`Remove "${tag}"`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-bg-alt"
                    title="Add another tag"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </>}
          </div>}
    </div>
  );
}
