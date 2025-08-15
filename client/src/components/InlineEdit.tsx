import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Check, X, Loader2 } from "lucide-react";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  displayClassName?: string;
  isLoading?: boolean;
  canEdit?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  isEditing,
  onStartEdit,
  onCancel,
  placeholder = "Click to edit",
  multiline = false,
  className = "",
  displayClassName = "",
  isLoading = false,
  canEdit = true
}: InlineEditProps) {
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
  };

  const handleCancel = () => {
    setEditValue(value);
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!canEdit) {
    return (
      <span className={displayClassName}>
        {value || placeholder}
      </span>
    );
  }

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    
    return (
      <div className={`flex items-start gap-2 ${className}`}>
        <div className="flex-1">
          <InputComponent
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            className={multiline ? "min-h-[80px] resize-none" : ""}
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8 p-0 bg-stak-forest hover:bg-stak-forest/90"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group cursor-pointer ${className}`} onClick={onStartEdit}>
      <div className="flex items-center gap-2">
        <span className={`${displayClassName} ${!value ? 'text-gray-500 italic' : ''}`}>
          {value || placeholder}
        </span>
        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}