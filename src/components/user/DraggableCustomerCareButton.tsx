import React, { useState, useEffect, useRef } from 'react';
import { Headphones, MessageCircle } from 'lucide-react';
import { api } from '../../services/api.js';

interface DraggableCustomerCareButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export const DraggableCustomerCareButton: React.FC<DraggableCustomerCareButtonProps> = ({
  onClick,
  unreadCount: propUnreadCount,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(propUnreadCount || 0);

  // Poll for admin unread replies
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res: any = await api.getSupportUnreadCount();
        if (isMounted && typeof res?.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      } catch {
        // ignore
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update when prop changes
  useEffect(() => {
    if (typeof propUnreadCount === 'number') {
      setUnreadCount(propUnreadCount);
    }
  }, [propUnreadCount]);

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('customer_care_btn_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return { x: -1, y: -1 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    moved: false,
  });

  // Calculate default position if not set
  useEffect(() => {
    if (position.x === -1 || position.y === -1) {
      const defaultX = Math.max(16, window.innerWidth - 76);
      const defaultY = Math.max(100, window.innerHeight - 150);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position.x, position.y]);

  // Keep within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (prev.x === -1) return prev;
        const maxX = window.innerWidth - 68;
        const maxY = window.innerHeight - 80;
        return {
          x: Math.min(Math.max(12, prev.x), maxX),
          y: Math.min(Math.max(60, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initX: position.x,
      initY: position.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }

    const maxX = window.innerWidth - 68;
    const maxY = window.innerHeight - 80;

    const newX = Math.min(Math.max(12, dragStartRef.current.initX + dx), maxX);
    const newY = Math.min(Math.max(60, dragStartRef.current.initY + dy), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (!dragStartRef.current.moved) {
      setUnreadCount(0);
      api.markSupportSeen().catch(() => {});
      onClick();
    } else {
      try {
        localStorage.setItem('customer_care_btn_pos', JSON.stringify(position));
      } catch {}
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
      moved: false,
    };
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragStartRef.current.moved = true;
      }

      const maxX = window.innerWidth - 68;
      const maxY = window.innerHeight - 80;

      const newX = Math.min(Math.max(12, dragStartRef.current.initX + dx), maxX);
      const newY = Math.min(Math.max(60, dragStartRef.current.initY + dy), maxY);

      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (!dragStartRef.current.moved) {
        setUnreadCount(0);
        api.markSupportSeen().catch(() => {});
        onClick();
      } else {
        try {
          localStorage.setItem('customer_care_btn_pos', JSON.stringify(position));
        } catch {}
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (position.x === -1) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className="select-none cursor-grab active:cursor-grabbing group animate-fadeIn"
      title="Customer Care - Click to chat (Drag to adjust position)"
    >
      <div className="relative">
        {/* Pulsing Golden Glow Ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#d99b26] to-[#f5c443] opacity-60 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse" />

        {/* Main Floating Button - Yellow/Gold Luxury Theme */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#997316] via-[#f5c443] to-[#ffd700] border-2 border-white/40 shadow-[0_8px_25px_rgba(245,196,67,0.4)] flex items-center justify-center text-black transition-all transform hover:scale-105 active:scale-95">
          <Headphones className="w-6 h-6 text-black drop-shadow-sm stroke-[2.5]" />

          {/* Unread Message Badge - ONLY SHOWN WHEN UNREAD ADMIN MESSAGES EXIST! */}
          {unreadCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#e52e2e] border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-bounce">
              {unreadCount}
            </div>
          )}

          {/* Active online green dot */}
          <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#1a1506]" />
        </div>

        {/* Floating Tooltip hint */}
        <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex items-center gap-1 bg-black/90 text-[10px] text-amber-200 px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap pointer-events-none backdrop-blur-md border border-amber-400/20">
          <MessageCircle className="w-3 h-3 text-[#f5c443]" />
          <span>24/7 VIP Support</span>
        </div>
      </div>
    </div>
  );
};
