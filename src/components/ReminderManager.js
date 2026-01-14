import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ReminderManager({ reminders, setReminders, files, trackingData, onSave }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState({
    filePath: "",
    dueDate: "",
    note: ""
  });

  // Check for upcoming reminders
  useEffect(() => {
    const checkReminders = () => {
      const today = new Date();
      reminders.forEach(reminder => {
        const dueDate = new Date(reminder.dueDate);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 3 && diffDays >= 0 && !reminder.notified) {
          const file = files.find(f => f.path === reminder.filePath);
          if (file) {
            toast(`Reminder: ${file.name} is due on ${dueDate.toDateString()}`, {
              icon: '⏰',
              duration: 6000,
            });
            
            // Mark as notified
            const updatedReminders = reminders.map(r => 
              r.id === reminder.id ? {...r, notified: true} : r
            );
            setReminders(updatedReminders);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately on mount
    
    return () => clearInterval(interval);
  }, [reminders, files]);

  const handleAddReminder = () => {
    if (newReminder.filePath && newReminder.dueDate) {
      const reminder = {
        id: Date.now(),
        ...newReminder,
        notified: false
      };
      
      setReminders([...reminders, reminder]);
      setNewReminder({ filePath: "", dueDate: "", note: "" });
      setIsAdding(false);
      onSave();
      toast.success("Reminder added successfully!");
    }
  };

  const handleDeleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
    onSave();
    toast.success("Reminder deleted!");
  };

  const getFileDisplayName = (filePath) => {
    const file = files.find(f => f.path === filePath);
    return file ? file.name : "Unknown File";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 w-80">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Reminders</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isAdding ? "Cancel" : "+ Add"}
          </button>
        </div>

        {isAdding && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <select
              value={newReminder.filePath}
              onChange={(e) => setNewReminder({...newReminder, filePath: e.target.value})}
              className="w-full mb-2 px-2 py-1 border rounded"
            >
              <option value="">Select a file</option>
              {files.map(file => (
                <option key={file.path} value={file.path}>{file.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={newReminder.dueDate}
              onChange={(e) => setNewReminder({...newReminder, dueDate: e.target.value})}
              className="w-full mb-2 px-2 py-1 border rounded"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={newReminder.note}
              onChange={(e) => setNewReminder({...newReminder, note: e.target.value})}
              className="w-full mb-2 px-2 py-1 border rounded"
            />
            <button
              onClick={handleAddReminder}
              className="w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Reminder
            </button>
          </div>
        )}

        <div className="max-h-60 overflow-y-auto">
          {reminders.length === 0 ? (
            <p className="text-gray-500 text-sm">No reminders set</p>
          ) : (
            reminders.map(reminder => {
              const file = files.find(f => f.path === reminder.filePath);
              const dueDate = new Date(reminder.dueDate);
              const today = new Date();
              const diffTime = dueDate - today;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              return (
                <div 
                  key={reminder.id} 
                  className={`p-2 mb-2 rounded border ${
                    diffDays < 0 
                      ? "bg-red-50 border-red-200" 
                      : diffDays <= 3 
                        ? "bg-yellow-50 border-yellow-200" 
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-sm truncate">{getFileDisplayName(reminder.filePath)}</p>
                      <p className="text-xs text-gray-500">
                        Due: {dueDate.toLocaleDateString()}
                        {diffDays < 0 ? " (Overdue)" : diffDays === 0 ? " (Today)" : ` (${diffDays} days)`}
                      </p>
                      {reminder.note && (
                        <p className="text-xs text-gray-600 mt-1">{reminder.note}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
