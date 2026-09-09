"use client"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { CloseIcon, PlusControlIcon } from "@/components/ui/icon"

/*
  Attachment UI SHELL ONLY (amendment 4). Selected files are held in local state
  purely to preview the interaction — they are NOT added to the form values and
  are NEVER sent to the mocked server action. No malware-scanning or storage is
  implied; a secure upload service arrives in Phase 10.
*/
type PickedFile = { name: string; size: number }

export function AttachmentField() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<PickedFile[]>([])

  return (
    <div>
      <p className="text-body-s font-medium text-foreground">
        Documents (optional)
      </p>
      <p id="attachment-note" className="mt-1 text-body-s text-muted-foreground">
        Selected files are not uploaded or submitted in this development phase. A
        secure upload service is added later — do not attach confidential
        documents here yet.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []).map((f) => ({
            name: f.name,
            size: f.size,
          }))
          setFiles((prev) => [...prev, ...picked])
          e.target.value = ""
        }}
      />

      <div className="mt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-describedby="attachment-note"
          onClick={() => inputRef.current?.click()}
        >
          <PlusControlIcon className="size-4" />
          Add files
        </Button>
      </div>

      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-body-s"
            >
              <span className="min-w-0 truncate">
                {file.name}{" "}
                <span className="text-muted-foreground">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setFiles((prev) => prev.filter((_, i) => i !== index))
                }
                className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <CloseIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
