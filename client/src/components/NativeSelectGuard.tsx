import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

type OpenSelect = {
  element: HTMLSelectElement;
  rect: DOMRect;
};

export function NativeSelectGuard() {
  const [openSelect, setOpenSelect] = useState<OpenSelect | null>(null);

  useEffect(() => {
    const open = (element: HTMLSelectElement) => {
      if (element.disabled) return;
      element.focus({ preventScroll: true });
      setOpenSelect({ element, rect: element.getBoundingClientRect() });
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const select = target?.closest("select");
      if (select instanceof HTMLSelectElement) {
        event.preventDefault();
        event.stopPropagation();
        open(select);
        return;
      }
      if (!target?.closest(".native-select-guard")) setOpenSelect(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        open(target);
      }
      if (event.key === "Escape") setOpenSelect(null);
    };

    const reposition = () => setOpenSelect(current => current ? { ...current, rect: current.element.getBoundingClientRect() } : null);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, []);

  if (!openSelect) return null;

  const { element, rect } = openSelect;
  const options = Array.from(element.options);
  const close = () => setOpenSelect(null);
  const choose = (value: string) => {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    close();
  };

  return (
    <div
      className="native-select-guard"
      role="listbox"
      aria-label={element.getAttribute("aria-label") || element.labels?.[0]?.textContent || "Opciones"}
      style={{ left: rect.left, top: rect.bottom + 6, width: rect.width }}
    >
      <div className="native-select-guard-head"><ChevronDown size={14} /> Selecciona una opción</div>
      {options.map(option => {
        const selected = option.value === element.value;
        return (
          <button
            key={`${option.value}-${option.index}`}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={option.disabled}
            className={selected ? "selected" : ""}
            onClick={() => choose(option.value)}
          >
            <span>{option.label || option.text}</span>
            {selected && <Check size={14} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
