import { useState, useCallback } from 'react';

export const useModal = <T = any>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((payload?: T) => {
    if (payload) setData(payload);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setData(null), 300); // Đợi animation đóng modal xong mới clear data
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
  };
};