"use client";

import { useState } from "react";

export function SavedNote({
  newsId,
  initialNote,
}: {
  newsId: string;
  initialNote: string;
}) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    setSaving(true);
    setDone(false);
    try {
      await fetch(`/api/saved/${newsId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_note: note }),
      });
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="메모 추가…"
        className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
      />
      <button
        onClick={save}
        disabled={saving}
        className="shrink-0 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {done ? "저장됨!" : "메모 저장"}
      </button>
    </div>
  );
}
