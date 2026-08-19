/* Bitaxus design reminder: premium fintech utility, coral accent on ink, compact Manrope/DM Sans typography, no native-scrollbar dependency. */
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

type HorizontalScrollHintProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export default function HorizontalScrollHint({
  children,
  className = "",
  label = "Desliza para ver más",
}: HorizontalScrollHintProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
    const nextCanScroll = maxScroll > 2;
    setCanScroll(nextCanScroll);
    setAtStart(element.scrollLeft <= 2);
    setAtEnd(!nextCanScroll || element.scrollLeft >= maxScroll - 2);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    updateState();
    element.addEventListener("scroll", updateState, { passive: true });
    const observer = new ResizeObserver(updateState);
    observer.observe(element);
    Array.from(element.children).forEach((child) => observer.observe(child));
    window.addEventListener("resize", updateState);
    return () => {
      element.removeEventListener("scroll", updateState);
      observer.disconnect();
      window.removeEventListener("resize", updateState);
    };
  }, [updateState]);

  const move = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "right" ? 240 : -240,
      behavior: "smooth",
    });
  };

  return (
    <div className={`horizontal-scroll-hint ${canScroll ? "has-overflow" : ""} ${className}`}>
      <div className="horizontal-scroll-viewport" ref={scrollRef} tabIndex={0}>
        {children}
      </div>
      {canScroll && (
        <div className={`scroll-hint-overlay ${atEnd ? "is-end" : ""}`} aria-live="polite">
          <button type="button" className="scroll-hint-arrow" onClick={() => move("left")} disabled={atStart} aria-label="Desplazar tabla a la izquierda">
            <ChevronLeft size={14} />
          </button>
          <span className="scroll-hint-label"><MoveHorizontal size={14} /> {atEnd ? "Fin de la tabla" : label}</span>
          <button type="button" className="scroll-hint-arrow" onClick={() => move("right")} disabled={atEnd} aria-label="Desplazar tabla a la derecha">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export { HorizontalScrollHint };
