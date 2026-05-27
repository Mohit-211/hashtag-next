import { useRef, useState } from "react";

export function useBrandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsOpen(true);
  };

  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 120);
  };

  const closeImmediately = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsOpen(false);
  };

  return { isOpen, open, scheduleClose, closeImmediately };
}