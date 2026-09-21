"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export const panelClass = "rounded-[18px] border-2 border-secondary bg-white p-5 sm:p-6";

export const inputClass =
  "h-11 w-full rounded-[10px] border-2 border-secondary/25 bg-white px-3.5 text-[0.9375rem] text-ink outline-none transition-colors focus-visible:border-secondary disabled:opacity-60";

export const textareaClass =
  "w-full rounded-[10px] border-2 border-secondary/25 bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-colors focus-visible:border-secondary disabled:opacity-60";

export const labelClass = "text-[0.8125rem] font-bold uppercase text-ink/70";

const buttonBase =
  "flex h-11 cursor-pointer items-center justify-center rounded-[10px] px-5 font-hand text-[1rem] uppercase leading-none transition-transform active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60";

// Экспортированы как строки отдельно от компонентов — нужны и на <button>
// (PrimaryButton и т.п.), и на <Link>: вложенный <button> внутри <a> невалиден.
export const primaryButtonClass = `${buttonBase} bg-ink text-white hover:scale-[1.01]`;
export const secondaryButtonClass = `${buttonBase} border-2 border-ink text-ink hover:bg-ink hover:text-white`;
export const dangerButtonClass = `${buttonBase} border-2 border-error text-error hover:bg-error hover:text-white`;

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`${primaryButtonClass} ${props.className ?? ""}`} />
  );
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`${secondaryButtonClass} ${props.className ?? ""}`}
    />
  );
}

export function DangerButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`${dangerButtonClass} ${props.className ?? ""}`} />
  );
}

export function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${textareaClass} ${props.className ?? ""}`} />;
}

export function CheckboxField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2.5 text-[0.9375rem] text-ink">
      <input type="checkbox" className="size-5 accent-secondary" {...props} />
      {label}
    </label>
  );
}

export function Notice({ tone, children }: { tone: "info" | "success" | "error"; children: ReactNode }) {
  const toneClass = {
    info: "border-secondary/40 bg-mist",
    success: "border-success bg-success/15",
    error: "border-error bg-error/10",
  }[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[10px] border-2 px-4 py-2.5 text-[0.9375rem] leading-6 text-ink ${toneClass}`}
    >
      {children}
    </div>
  );
}
