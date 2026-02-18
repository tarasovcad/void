"use client";

import React from "react";
import {AnimatePresence, motion} from "framer-motion";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import {Button} from "@/components/coss-ui/button";
import {Badge} from "@/components/coss-ui/badge";

export type TagsInputProps = {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  maxTags?: number;
  /** Max characters per tag after normalization (trim + collapse spaces). */
  maxTagLength?: number;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  /** If provided, a hidden input will be rendered (comma-separated). */
  name?: string;
};

const DEFAULT_MAX_TAGS = 8;
const DEFAULT_MAX_TAG_LENGTH = 64;

type Tag = string;

const FAKE_SUGGESTIONS = ["banana", "apple", "appear", "hello world"] as const;

function clampString(input: string, maxLen: number) {
  return input.length > maxLen ? input.slice(0, maxLen) : input;
}

function normalizeTag(raw: string, maxTagLength: number): Tag {
  // Allow multi-word tags. Users can type/paste commas or newlines; we strip those defensively here.
  const normalized = raw
    .replace(/[,|\n|\r]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return clampString(normalized, maxTagLength);
}

function splitRawTags(raw: string, maxTagLength: number): Tag[] {
  // Split on commas/newlines; keep it intentionally simple and predictable.
  return raw
    .split(/[,|\n|\r]/g)
    .map((t) => normalizeTag(t, maxTagLength))
    .filter(Boolean);
}

function buildInlineSuggestion({
  inputValue,
  tags,
}: {
  inputValue: string;
  tags: Tag[];
}): string | null {
  // Suggest based on the *typed* prefix (including spaces).
  // Example: "hello " suggests "hello world" (suffix "world"), but "hel " suggests nothing.
  const q = inputValue.toLowerCase();
  if (!q.trim()) return null;

  const match = FAKE_SUGGESTIONS.find((w) => w.startsWith(q));
  if (!match) return null;
  if (match.toLowerCase() === q) return null;

  const existing = new Set(tags.map((t) => t.toLowerCase()));
  if (existing.has(match.toLowerCase())) return null;
  return match;
}

function useControllableTags({
  value,
  defaultValue,
  onValueChange,
}: Pick<TagsInputProps, "value" | "defaultValue" | "onValueChange">) {
  const isControlled = value !== undefined;
  const [uncontrolledTags, setUncontrolledTags] = React.useState<Tag[]>(defaultValue ?? []);
  const tags = (isControlled ? value : uncontrolledTags) ?? [];

  const setTags = React.useCallback(
    (next: Tag[]) => {
      if (!isControlled) setUncontrolledTags(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return {tags, setTags};
}

function AddIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2C8.27613 2 8.5 2.22386 8.5 2.5V7.5H13.5C13.7761 7.5 14 7.72387 14 8C14 8.27613 13.7761 8.5 13.5 8.5H8.5V13.5C8.5 13.7761 8.27613 14 8 14C7.72387 14 7.5 13.7761 7.5 13.5V8.5H2.5C2.22386 8.5 2 8.27613 2 8C2 7.72387 2.22386 7.5 2.5 7.5H7.5V2.5C7.5 2.22386 7.72387 2 8 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.00016 1.33334C4.31826 1.33334 1.3335 4.3181 1.3335 8C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667C11.682 14.6667 14.6668 11.6819 14.6668 8C14.6668 4.3181 11.682 1.33334 8.00016 1.33334ZM6.66683 7.33334C6.66683 7.0572 6.8907 6.83334 7.16683 6.83334H8.00016C8.2763 6.83334 8.50016 7.0572 8.50016 7.33334V10.8333C8.50016 11.1095 8.2763 11.3333 8.00016 11.3333C7.72403 11.3333 7.50016 11.1095 7.50016 10.8333V7.83334H7.16683C6.8907 7.83334 6.66683 7.60947 6.66683 7.33334ZM8.00016 4.83334C7.72403 4.83334 7.50016 5.0572 7.50016 5.33334C7.50016 5.60948 7.72403 5.83334 8.00016 5.83334C8.2763 5.83334 8.50016 5.60948 8.50016 5.33334C8.50016 5.0572 8.2763 4.83334 8.00016 4.83334Z"
        fill="var(--muted-foreground)"
      />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.05806 2.05806C2.30214 1.81398 2.69787 1.81398 2.94194 2.05806L6 5.1161L9.05805 2.05806C9.30215 1.81398 9.69785 1.81398 9.94195 2.05806C10.186 2.30214 10.186 2.69787 9.94195 2.94194L6.8839 6L9.94195 9.05805C10.186 9.30215 10.186 9.69785 9.94195 9.94195C9.69785 10.186 9.30215 10.186 9.05805 9.94195L6 6.8839L2.94194 9.94195C2.69787 10.186 2.30214 10.186 2.05806 9.94195C1.81398 9.69785 1.81398 9.30215 2.05806 9.05805L5.1161 6L2.05806 2.94194C1.81398 2.69787 1.81398 2.30214 2.05806 2.05806Z"
        fill="currentColor"
      />
    </svg>
  );
}

const TagsInput = ({
  value,
  defaultValue = [],
  onValueChange,
  maxTags = DEFAULT_MAX_TAGS,
  maxTagLength = DEFAULT_MAX_TAG_LENGTH,
  placeholder = "Add tags...",
  label = "Add Tags",
  disabled = false,
  name,
}: TagsInputProps) => {
  const {tags, setTags} = useControllableTags({value, defaultValue, onValueChange});

  const [inputValue, setInputValue] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const inputId = React.useId();
  const helpId = React.useId();

  const suggestion = React.useMemo(
    () => buildInlineSuggestion({inputValue, tags}),
    [inputValue, tags],
  );
  const canAddMore = tags.length < maxTags;

  const commitRawInput = React.useCallback(
    (raw: string) => {
      const parts = splitRawTags(raw, maxTagLength);
      if (parts.length === 0) return;
      if (!canAddMore) return;

      const existing = new Set(tags.map((t) => t.toLowerCase()));
      const toAdd: Tag[] = [];
      let sawDuplicate = false;
      for (const t of parts) {
        const key = t.toLowerCase();
        if (existing.has(key)) {
          sawDuplicate = true;
          continue;
        }
        toAdd.push(t);
        existing.add(key);
        if (tags.length + toAdd.length >= maxTags) break;
      }

      if (toAdd.length === 0) {
        // If user tried to add a duplicate (e.g. "ascii" vs "AScii"),
        // treat it as a no-op submit but clear the input.
        if (sawDuplicate) {
          setInputValue("");
          inputRef.current?.focus();
        }
        return;
      }
      setTags([...tags, ...toAdd]);
      setInputValue("");

      // Keep typing flow smooth.
      inputRef.current?.focus();
    },
    [canAddMore, maxTagLength, maxTags, setTags, tags],
  );

  const removeTagAt = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= tags.length) return;
      const next = tags.slice(0, index).concat(tags.slice(index + 1));
      setTags(next);
      inputRef.current?.focus();
    },
    [setTags, tags],
  );

  const ghostVisible = !disabled && Boolean(suggestion) && inputValue.trim().length > 0;
  const normalizedForSubmit = normalizeTag(inputValue, maxTagLength);
  const canSubmit = !disabled && canAddMore && normalizedForSubmit.length > 0;

  const acceptSuggestion = React.useCallback(() => {
    if (!suggestion) return;
    const next = suggestion;
    setInputValue(next);
    // Ensure caret lands at the end after state update.
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(next.length, next.length));
  }, [suggestion]);

  const onInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      // Allow accepting the "ghost" suggestion with Tab / ArrowRight when the caret is at the end.
      if (
        ghostVisible &&
        (e.key === "Tab" || e.key === "ArrowRight") &&
        e.currentTarget.selectionStart === inputValue.length &&
        e.currentTarget.selectionEnd === inputValue.length
      ) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        commitRawInput(inputValue);
        return;
      }

      if (e.key === "Backspace" && inputValue.length === 0 && tags.length > 0) {
        e.preventDefault();
        removeTagAt(tags.length - 1);
      }
    },
    [
      acceptSuggestion,
      commitRawInput,
      disabled,
      ghostVisible,
      inputValue,
      removeTagAt,
      tags.length,
    ],
  );

  const onInputPaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      const text = e.clipboardData?.getData("text");
      if (!text) return;
      if (!/[,\n\r]/.test(text)) return;
      e.preventDefault();
      commitRawInput(text);
    },
    [commitRawInput, disabled],
  );

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-2">
      <label htmlFor={inputId} className="flex items-center gap-1 text-sm font-medium">
        {label} <span className="text-muted-foreground">(max {maxTags})</span>
        <InfoIcon />
      </label>
      <div className="space-y-3">
        <InputGroup>
          <div className="relative w-full">
            {ghostVisible ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center px-[calc(--spacing(3)-1px)] text-base leading-8.5 whitespace-pre sm:text-sm sm:leading-7.5">
                {/* Ghost suggestion overlay:
                    We render "typed" + "suggested suffix" behind the input while making the input
                    text transparent. This keeps caret/selection behavior native & consistent. */}
                <span className="text-foreground">{inputValue}</span>
                <span className="text-muted-foreground/72">
                  {suggestion!.slice(inputValue.length)}
                </span>
              </div>
            ) : null}
            <InputGroupInput
              id={inputId}
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onInputKeyDown}
              onPaste={onInputPaste}
              placeholder={placeholder}
              type="text"
              className="w-full"
              disabled={disabled}
              aria-disabled={disabled}
              aria-describedby={helpId}
              style={
                ghostVisible
                  ? ({
                      // When ghost is visible we hide the real text (keeping caret visible).
                      color: "transparent",
                      caretColor: "var(--foreground)",
                    } as React.CSSProperties)
                  : undefined
              }
            />
          </div>
          <InputGroupAddon align="inline-end">
            <Button
              size="icon-xs"
              variant="outline"
              disabled={!canSubmit}
              onClick={() => commitRawInput(inputValue)}>
              <AddIcon />
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <div id={helpId} className="sr-only">
          Type a tag and press Enter or comma to add. Paste comma/newline-separated tags to add
          multiple.
        </div>
        {name ? <input type="hidden" name={name} value={tags.join(",")} /> : null}

        <AnimatePresence initial={false}>
          {tags.length > 0 ? (
            <motion.div
              className="flex flex-wrap gap-1"
              layout
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: "auto"}}
              exit={{opacity: 0, height: 0}}
              transition={{duration: 0.2, ease: "easeInOut"}}>
              <AnimatePresence initial={false} mode="popLayout">
                {tags.map((tag, idx) => (
                  <motion.div
                    key={tag.toLowerCase()}
                    layout
                    initial={{opacity: 0, scale: 0.8, filter: "blur(4px)"}}
                    animate={{opacity: 1, scale: 1, filter: "blur(0px)"}}
                    exit={{opacity: 0, scale: 0.8, filter: "blur(4px)"}}
                    transition={{duration: 0.2, ease: "easeOut"}}>
                    <Badge size="md" variant="outline" className="bg-muted gap-0!">
                      {tag}
                      <button
                        type="button"
                        className="text-foreground/70 hover:text-foreground cursor-pointer p-1"
                        onClick={() => removeTagAt(idx)}
                        aria-label={`Remove tag ${tag}`}
                        disabled={disabled}>
                        <RemoveIcon />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TagsInput;
