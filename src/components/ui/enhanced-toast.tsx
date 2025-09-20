import { useEffect, useRef } from 'react';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function EnhancedToaster() {
  const { toasts, dismiss } = useToast();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, toastId: string) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent, toastId: string) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check for swipe gesture (minimum distance and maximum time)
    const minSwipeDistance = 50;
    const maxSwipeTime = 500;

    if (deltaTime < maxSwipeTime) {
      // Swipe up to dismiss
      if (deltaY < -minSwipeDistance && Math.abs(deltaX) < minSwipeDistance) {
        dismiss(toastId);
      }
      // Swipe left or right to dismiss
      else if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        dismiss(toastId);
      }
    }

    touchStartRef.current = null;
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            onTouchStart={(e) => handleTouchStart(e, id)}
            onTouchEnd={(e) => handleTouchEnd(e, id)}
            className="cursor-pointer select-none"
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}