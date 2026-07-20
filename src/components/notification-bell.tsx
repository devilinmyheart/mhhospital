import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications.functions";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listMyNotifications(),
    refetchInterval: 30_000,
  });
  const markFn = useServerFn(markNotificationRead);
  const markAllFn = useServerFn(markAllNotificationsRead);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const markOne = useMutation({ mutationFn: (id: string) => markFn({ data: { id } }), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => markAllFn(), onSuccess: invalidate });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = data.filter((n: any) => !n.read_at).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative border border-border px-2.5 py-2 hover:bg-accent"
        aria-label="Notifications"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-emergency text-emergency-foreground text-[9px] font-mono flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="mono-label">NOTIFICATIONS</div>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="text-[10px] font-mono uppercase text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {data.length === 0 ? (
            <div className="p-6 text-xs text-muted-foreground text-center">No notifications</div>
          ) : (
            data.map((n: any) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold">{n.title}</div>
                    {!n.read_at && <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                  {n.body && <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{n.body}</div>}
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </>
              );
              const cls = `block px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-accent ${!n.read_at ? "bg-primary/5" : ""}`;
              const handleClick = () => { if (!n.read_at) markOne.mutate(n.id); setOpen(false); };
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={handleClick} className={cls}>{inner}</Link>
              ) : (
                <button key={n.id} onClick={handleClick} className={cls + " w-full text-left"}>{inner}</button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
