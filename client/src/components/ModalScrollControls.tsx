/* Bitaxus modal controls: explicit, accessible vertical navigation for long operational forms. */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ModalScrollControls({ children, className = "" }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const sync = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    setCanScrollUp(node.scrollTop > 4);
    setCanScrollDown(node.scrollTop + node.clientHeight < node.scrollHeight - 4);
  }, []);

  useEffect(() => {
    sync();
    const node = scrollRef.current;
    if (!node) return;
    node.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync]);

  const move = (direction: "up" | "down") => {
    scrollRef.current?.scrollBy({ top: direction === "up" ? -260 : 260, behavior: "smooth" });
  };

  return <div className={`modal-scroll-shell ${className}`}>
    <button className="modal-scroll-arrow modal-scroll-arrow-up" type="button" onClick={() => move("up")} disabled={!canScrollUp} aria-label="Subir en el formulario"><ChevronUp size={15} /></button>
    <div className="modal-scroll-content" ref={scrollRef}>{children}</div>
    <button className="modal-scroll-arrow modal-scroll-arrow-down" type="button" onClick={() => move("down")} disabled={!canScrollDown} aria-label="Bajar en el formulario"><ChevronDown size={15} /></button>
  </div>;
}
