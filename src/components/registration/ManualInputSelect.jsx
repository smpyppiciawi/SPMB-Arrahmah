import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ManualInputSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder, 
  disabled,
  allowManual = true 
}) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const handleManualSubmit = () => {
    if (manualValue.trim()) {
      onValueChange(manualValue.trim());
      setManualValue("");
      setShowManualInput(false);
    }
  };

  if (showManualInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="Ketik manual..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleManualSubmit();
            }
          }}
          autoFocus
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleManualSubmit}
          disabled={!manualValue.trim()}
        >
          OK
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowManualInput(false);
            setManualValue("");
          }}
        >
          Batal
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {allowManual && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowManualInput(true)}
          title="Input manual"
        >
          <Plus size={16} />
        </Button>
      )}
    </div>
  );
}