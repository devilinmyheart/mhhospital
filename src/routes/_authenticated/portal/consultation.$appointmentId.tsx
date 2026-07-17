import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { getAppointmentById } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal-shell";
import { toast } from "sonner";

const qo = (appointmentId: string) =>
  queryOptions({
    queryKey: ["portal", "consultation", appointmentId],
    queryFn: () => getAppointmentById({ data: { appointmentId } }),
  });

const searchSchema = z.object({
  session: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_authenticated/portal/consultation/$appointmentId")({
  validateSearch: zodValidator(searchSchema),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(qo(params.appointmentId)),
  component: Consultation,
});

function Consultation() {
  const { appointmentId } = Route.useParams();
  const { session: sessionParam } = Route.useSearch();
  const { data: appt } = useSuspenseQuery(qo(appointmentId));
  const roomId = (appt as any).session_token ?? appointmentId;
  const sessionMismatch = sessionParam !== "" && sessionParam !== roomId;
  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal/consultation/${appointmentId}?session=${roomId}`
    : "";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [joined]);

  useEffect(() => {
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setJoined(true);
    } catch (e: any) {
      toast.error(e?.message || "Unable to access camera/microphone");
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setJoined(false);
  };

  const toggleMic = () => {
    const on = !micOn;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = on));
    setMicOn(on);
  };
  const toggleCam = () => {
    const on = !camOn;
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = on));
    setCamOn(on);
  };

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const scheduled = new Date(appt.scheduled_at);
  const minsToStart = Math.round((scheduled.getTime() - Date.now()) / 60000);
  const isVideo = appt.mode === "video";
  const canJoin = appt.status === "booked" && isVideo && minsToStart <= 15;

  return (
    <PortalShell scope="patient">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">CONSULTATION / VIDEO_ROOM</div>
        <h1 className="text-2xl font-bold tracking-tight">Video consultation</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-card border border-border">
          <div className="aspect-video bg-black relative">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!joined && (
              <div className="absolute inset-0 grid place-items-center text-center p-6">
                <div>
                  <div className="mono-label text-muted-foreground mb-3">ROOM_ID · {String(roomId).slice(0, 8).toUpperCase()}</div>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {isVideo
                      ? canJoin
                        ? "Camera and microphone will start when you join."
                        : `Room opens 15 min before your appointment (${scheduled.toLocaleString()}).`
                      : "This appointment is in-person. No video room available."}
                  </p>
                </div>
              </div>
            )}
            {joined && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emergency animate-pulse" />
                <span className="font-mono text-xs text-white bg-black/60 px-2 py-1">LIVE · {mmss}</span>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-wrap items-center gap-2 border-t border-border">
            {!joined ? (
              <button
                onClick={startStream}
                disabled={!canJoin}
                className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              >
                JOIN VIDEO VISIT
              </button>
            ) : (
              <>
                <button onClick={toggleMic} className={`px-3 py-2 text-xs font-mono border ${micOn ? "border-border hover:bg-accent" : "border-emergency text-emergency"}`}>
                  {micOn ? "MIC ON" : "MIC OFF"}
                </button>
                <button onClick={toggleCam} className={`px-3 py-2 text-xs font-mono border ${camOn ? "border-border hover:bg-accent" : "border-emergency text-emergency"}`}>
                  {camOn ? "CAMERA ON" : "CAMERA OFF"}
                </button>
                <button onClick={stopStream} className="ml-auto bg-emergency text-emergency-foreground px-4 py-2 text-xs font-semibold">
                  END VISIT
                </button>
              </>
            )}
          </div>
        </div>

        <aside className="bg-card border border-border p-4 space-y-4 text-sm">
          <div>
            <div className="mono-label mb-1">PHYSICIAN</div>
            <div className="font-semibold">{(appt.doctors as any)?.full_name}</div>
            <div className="text-xs text-muted-foreground">{(appt.doctors as any)?.title}</div>
          </div>
          <div>
            <div className="mono-label mb-1">DEPARTMENT</div>
            <div>{(appt.departments as any)?.name}</div>
          </div>
          <div>
            <div className="mono-label mb-1">SCHEDULED</div>
            <div className="font-mono text-xs">{scheduled.toLocaleString()}</div>
          </div>
          <div>
            <div className="mono-label mb-1">STATUS</div>
            <div className="uppercase text-xs">{appt.status}</div>
          </div>
          {appt.reason && (
            <div>
              <div className="mono-label mb-1">REASON</div>
              <p className="text-xs text-muted-foreground">{appt.reason}</p>
            </div>
          )}
          {isVideo && (
            <div>
              <div className="mono-label mb-1">SESSION LINK</div>
              {sessionMismatch && (
                <div className="text-[11px] text-emergency mb-1">Link token doesn't match — verify with your provider.</div>
              )}
              <div className="font-mono text-[10px] break-all bg-muted p-2 border border-border">{joinUrl}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(joinUrl).then(
                    () => toast.success("Session link copied"),
                    () => toast.error("Unable to copy link"),
                  );
                }}
                className="mt-2 w-full border border-border px-3 py-1.5 text-[11px] font-mono uppercase hover:bg-accent"
              >
                Copy join link
              </button>
            </div>
          )}
          <Link to="/portal/appointments" className="block text-xs mono-label text-primary hover:underline">
            ← BACK TO APPOINTMENTS
          </Link>
        </aside>
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground max-w-2xl">
        This is a secure preview of your video visit room. Your camera and microphone stream stay on your device until the physician joins. If you have technical issues, call the front desk.
      </p>
    </PortalShell>
  );
}
