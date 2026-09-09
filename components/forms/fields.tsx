"use client"

import type { ReactNode } from "react"
import { Controller } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, type SelectOption } from "@/components/ui/select"

/*
  Form field primitives (amendment 2: reuse primitives, not a form DSL). Each
  form composes these explicitly with its own `register`/`control` and errors.
  Native controls throughout; the taxonomy Select is the only custom control.

  `register`/`control` are typed loosely so one set of primitives works with any
  form's strongly-typed RHF instance (RHF's generics are invariant). The forms
  themselves stay fully typed.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyRegister = any
type AnyControl = any

function describedBy(id: string, hasHint: boolean, hasError: boolean) {
  return (
    cn(hasHint && `${id}-hint`, hasError && `${id}-error`) || undefined
  )
}

/* A numbered section (fieldset/legend) so long single-page forms stay scannable
   (amendment 1). */
export function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <fieldset className="border-t border-border pt-6">
      <legend className="mb-4 flex items-baseline gap-2">
        <span className="text-label uppercase tracking-label tabular-nums text-muted-foreground">
          {String(step).padStart(2, "0")}
        </span>
        <span className="text-h4 font-semibold text-foreground">{title}</span>
      </legend>
      {description ? (
        <p className="-mt-2 mb-4 text-body-s text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="grid gap-4">{children}</div>
    </fieldset>
  )
}

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-s font-medium text-foreground">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-negative">
              {" "}
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-body-s text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-body-s text-negative">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextField({
  name,
  label,
  register,
  error,
  required,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  hint,
}: {
  name: string
  label: string
  register: AnyRegister
  error?: string
  required?: boolean
  type?: string
  autoComplete?: string
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "url"
  placeholder?: string
  hint?: string
}) {
  return (
    <Field id={name} label={label} required={required} hint={hint} error={error}>
      <Input
        id={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, !!hint, !!error)}
        {...register(name)}
      />
    </Field>
  )
}

export function TextareaField({
  name,
  label,
  register,
  error,
  required,
  rows,
  hint,
  placeholder,
}: {
  name: string
  label: string
  register: AnyRegister
  error?: string
  required?: boolean
  rows?: number
  hint?: string
  placeholder?: string
}) {
  return (
    <Field id={name} label={label} required={required} hint={hint} error={error}>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, !!hint, !!error)}
        {...register(name)}
      />
    </Field>
  )
}

export function SelectField({
  name,
  label,
  control,
  error,
  required,
  options,
  placeholder,
  hint,
}: {
  name: string
  label: string
  control: AnyControl
  error?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
  hint?: string
}) {
  const items: SelectOption[] = placeholder
    ? [{ value: "", label: placeholder }, ...options]
    : options
  return (
    <Field id={name} label={label} required={required} hint={hint} error={error}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            id={name}
            ariaLabel={label}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            options={items}
            invalid={!!error}
            describedBy={describedBy(name, !!hint, !!error)}
            className="w-full"
          />
        )}
      />
    </Field>
  )
}

export function CheckboxField({
  name,
  register,
  error,
  label,
  description,
}: {
  name: string
  register: AnyRegister
  error?: string
  label: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="flex items-start gap-3 text-body-s text-foreground"
      >
        <Checkbox
          id={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, !!description, !!error)}
          {...register(name)}
        />
        <span>
          {label}
          {description ? (
            <span id={`${name}-hint`} className="mt-0.5 block text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p id={`${name}-error`} className="pl-7 text-body-s text-negative">
          {error}
        </p>
      ) : null}
    </div>
  )
}
