"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Keyword {
  id: string;
  term: string;
  sources: string[];
  language: string;
  is_active: boolean;
}
export interface Group {
  id: string;
  category: string;
  name: string;
  sort_order: number;
  keywords: Keyword[];
}

const SOURCES: { key: string; label: string }[] = [
  { key: "naver", label: "네이버" },
  { key: "gnews", label: "GNews" },
  { key: "rss", label: "RSS" },
];
const CATEGORIES: { key: string; label: string }[] = [
  { key: "competitor", label: "경쟁사" },
  { key: "industry", label: "업계 동향" },
  { key: "product", label: "제품·기술" },
  { key: "general", label: "일반" },
];

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error?.message ?? "요청에 실패했어요.");
  }
  return res.json().catch(() => null);
}

export function KeywordManager({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("competitor");
  const [newGroupName, setNewGroupName] = useState("");

  function run(fn: () => Promise<void>) {
    setError(null);
    fn().catch((e) => setError(e instanceof Error ? e.message : "오류"));
  }

  function patchGroup(id: string, patch: Partial<Group>) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function addKeyword(group: Group) {
    const term = (drafts[group.id] ?? "").trim();
    if (!term) return;
    run(async () => {
      const kw = await api("/api/keywords", "POST", {
        group_id: group.id,
        term,
      });
      patchGroup(group.id, { keywords: [...group.keywords, kw] });
      setDrafts((d) => ({ ...d, [group.id]: "" }));
    });
  }

  function deleteKeyword(group: Group, kw: Keyword) {
    run(async () => {
      await api(`/api/keywords/${kw.id}`, "DELETE");
      patchGroup(group.id, {
        keywords: group.keywords.filter((k) => k.id !== kw.id),
      });
    });
  }

  function toggleSource(group: Group, kw: Keyword, source: string) {
    const sources = kw.sources.includes(source)
      ? kw.sources.filter((s) => s !== source)
      : [...kw.sources, source];
    run(async () => {
      const updated = await api(`/api/keywords/${kw.id}`, "PUT", { sources });
      patchGroup(group.id, {
        keywords: group.keywords.map((k) => (k.id === kw.id ? updated : k)),
      });
    });
  }

  function toggleActive(group: Group, kw: Keyword) {
    run(async () => {
      const updated = await api(`/api/keywords/${kw.id}`, "PUT", {
        is_active: !kw.is_active,
      });
      patchGroup(group.id, {
        keywords: group.keywords.map((k) => (k.id === kw.id ? updated : k)),
      });
    });
  }

  function deleteGroup(group: Group) {
    run(async () => {
      await api(`/api/keyword-groups/${group.id}`, "DELETE");
      setGroups((gs) => gs.filter((g) => g.id !== group.id));
    });
  }

  function saveRename(group: Group) {
    const name = editName.trim();
    if (!name) return;
    run(async () => {
      await api(`/api/keyword-groups/${group.id}`, "PUT", { name });
      patchGroup(group.id, { name });
      setEditing(null);
    });
  }

  function addGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    run(async () => {
      const g = await api("/api/keyword-groups", "POST", {
        category: newCategory,
        name,
      });
      setGroups((gs) => [...gs, g]);
      setNewGroupName("");
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            {editing === group.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-40"
                  onKeyDown={(e) => e.key === "Enter" && saveRename(group)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => saveRename(group)}
                  aria-label="저장"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <CardTitle className="flex items-center gap-2 text-base">
                {group.name}
                <button
                  onClick={() => {
                    setEditing(group.id);
                    setEditName(group.name);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="이름 변경"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </CardTitle>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteGroup(group)}
              aria-label="그룹 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.keywords.length === 0 && (
              <p className="text-sm text-muted-foreground">키워드가 없어요.</p>
            )}
            {group.keywords.map((kw) => (
              <div
                key={kw.id}
                className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5"
              >
                <span
                  className={`text-sm ${kw.is_active ? "" : "text-muted-foreground line-through"}`}
                >
                  {kw.term}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {SOURCES.map((s) => {
                    const on = kw.sources.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        onClick={() => toggleSource(group, kw, s.key)}
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          on
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => toggleActive(group, kw)}
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      kw.is_active
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {kw.is_active ? "활성" : "비활성"}
                  </button>
                  <button
                    onClick={() => deleteKeyword(group, kw)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="키워드 삭제"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input
                value={drafts[group.id] ?? ""}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [group.id]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && addKeyword(group)}
                placeholder="키워드 추가 후 Enter"
                className="h-9"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => addKeyword(group)}
                aria-label="키워드 추가"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 새 그룹 추가 */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-6">
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGroup()}
            placeholder="새 그룹 이름"
            className="h-9 flex-1"
          />
          <Button onClick={addGroup} className="h-9">
            <Plus className="mr-1 h-4 w-4" />
            그룹 추가
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
