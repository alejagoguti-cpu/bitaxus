import { ChevronDown, Check } from "lucide-react";
import { ReactNode, useEffect, useId, useRef, useState } from "react";

export interface BrandedSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface BrandedSelectProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: BrandedSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function BrandedSelect({
  value = "",
  onChange,
  onBlur,
  options,
  placeholder = "Selecciona una opción",
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
}: BrandedSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onBlur]);

  const choose = (nextValue: string) => {
    onChange(nextValue);
    onBlur?.();
    setOpen(false);
  };

  return (
    <div className="branded-select" ref={rootRef}>
      <button
        type="button"
        className={`branded-select-trigger ${className}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={selected ? "" : "branded-select-placeholder"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div id={listboxId} className="branded-select-options" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              key={option.value}
              className={`branded-select-option ${option.value === value ? "selected" : ""}`}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
