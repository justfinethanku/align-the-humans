'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updatePromptAction, type UpdatePromptInput } from './actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PRESET_MODELS = [
  { value: 'z-ai/glm-5.2', label: 'GLM 5.2 — inexpensive, default' },
  { value: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
  { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
] as const;

const CUSTOM_MODEL_VALUE = '__custom__';

export interface PromptEditorData {
  slug: string;
  name: string;
  description: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
}

export interface PromptVersionHistoryItem {
  version: number;
  model: string;
  createdAt: string;
  changeNote: string | null;
}

interface PromptEditorProps {
  prompt: PromptEditorData;
  versions: PromptVersionHistoryItem[];
}

function formatVersionDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function PromptEditor({ prompt, versions }: PromptEditorProps) {
  const initialIsPreset = PRESET_MODELS.some((m) => m.value === prompt.model);

  const [name, setName] = useState(prompt.name);
  const [description, setDescription] = useState(prompt.description ?? '');
  const [modelSelect, setModelSelect] = useState(
    initialIsPreset ? prompt.model : CUSTOM_MODEL_VALUE
  );
  const [customModel, setCustomModel] = useState(initialIsPreset ? '' : prompt.model);
  const [temperature, setTemperature] = useState(String(prompt.temperature));
  const [maxTokens, setMaxTokens] = useState(String(prompt.maxTokens));
  const [systemPrompt, setSystemPrompt] = useState(prompt.systemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState(prompt.userPromptTemplate);
  const [isActive, setIsActive] = useState(prompt.isActive);
  const [changeNote, setChangeNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const resolvedModel = useMemo(() => {
    if (modelSelect === CUSTOM_MODEL_VALUE) {
      return customModel.trim();
    }
    return modelSelect;
  }, [customModel, modelSelect]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTemperature = Number(temperature);
    const parsedMaxTokens = Number(maxTokens);

    const input: UpdatePromptInput = {
      name: name.trim(),
      description: description.trim() || null,
      model: resolvedModel,
      temperature: parsedTemperature,
      maxTokens: parsedMaxTokens,
      systemPrompt: systemPrompt.trim(),
      userPromptTemplate: userPromptTemplate.trim(),
      isActive,
      changeNote: changeNote.trim() || undefined,
    };

    startTransition(async () => {
      const result = await updatePromptAction(prompt.slug, input);

      if (result.ok) {
        toast.success('Saved — live within ~5 minutes (cache TTL)');
        setChangeNote('');
        return;
      }

      toast.error(result.error);
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold text-zinc-100">Edit prompt</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="model">Model</Label>
              <Select value={modelSelect} onValueChange={setModelSelect}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.value} ({model.label})
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_MODEL_VALUE}>Custom…</SelectItem>
                </SelectContent>
              </Select>
              {modelSelect === CUSTOM_MODEL_VALUE && (
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="OpenRouter model slug, e.g. openai/gpt-4o"
                  className="font-mono text-sm"
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min={0}
                max={2}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={1}
                max={64000}
                step={1}
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System prompt</Label>
            <Textarea
              id="systemPrompt"
              rows={6}
              className="font-mono text-sm"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userPromptTemplate">User prompt template</Label>
            <Textarea
              id="userPromptTemplate"
              rows={18}
              className="font-mono text-sm"
              value={userPromptTemplate}
              onChange={(e) => setUserPromptTemplate(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              {'{{variable}} placeholders are substituted at call time — keep them intact.'}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive prompts fall back to the built-in seed version.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="changeNote">Change note (optional)</Label>
            <Input
              id="changeNote"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="What changed and why?"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">Version history</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {versions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No versions yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {versions.map((version) => (
                <div
                  key={version.version}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 text-sm"
                >
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Version</div>
                    <div className="text-foreground font-medium">v{version.version}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Model</div>
                    <div className="font-mono text-xs text-foreground">{version.model}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                    <div className="text-foreground">{formatVersionDate(version.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Change note</div>
                    <div className="text-foreground">
                      {version.changeNote?.trim() || '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}