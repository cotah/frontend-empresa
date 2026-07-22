"use client";

/** Campos de formulário compartilhados entre o onboarding e as Configurações. */

export function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] text-muted-foreground">
        {label}
        {required && <span className="text-primary"> *</span>}
        {optional && <span className="opacity-60"> · {optional}</span>}
      </label>
      {children}
    </div>
  );
}

export function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border p-2">
      <input
        type="color"
        value={value}
        onChange={onChange}
        className="h-7 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={label}
      />
      <div className="min-w-0">
        <div className="font-mono text-[10px] text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-[10px]">{value}</div>
      </div>
    </div>
  );
}
