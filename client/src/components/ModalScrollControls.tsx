/* Bitaxus modal controls: natural internal scrolling without a competing visual rail. */
import { type ReactNode } from "react";

export default function ModalScrollControls({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`modal-scroll-content ${className}`}>{children}</div>;
}
