"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
}

/** Enter 또는 쉼표로 태그 추가, X로 삭제하는 입력 컴포넌트 */
export function TagInput({ value, onChange, placeholder, max }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim().replace(/,$/, "");
    if (!t) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    if (max && value.length >= max) return;
    onChange([...value, t]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`${tag} 삭제`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length > 0) {
            remove(value[value.length - 1]);
          }
        }}
        placeholder={placeholder}
      />
    </div>
  );
}
