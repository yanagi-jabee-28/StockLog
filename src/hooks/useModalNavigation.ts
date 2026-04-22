import { useEffect } from 'react';

/**
 * Hook to handle closing modals with Escape key and mobile Back gesture.
 */
export function useModalNavigation(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Handle Mobile Back Gesture (Android etc.)
    // We push a state so the back button pops it instead of leaving the app
    const modalState = { modalOpen: true };
    window.history.pushState(modalState, '');

    const handlePopState = () => {
      // When user swipes back or presses hardware back button
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      
      // If we are closing the modal but NOT via popstate (e.g. click close button),
      // we should remove the added state from history to keep it clean.
      // We check if the current state is the one we pushed.
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
