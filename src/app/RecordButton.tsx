import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";

/**
 * In-field microphone: records via MediaRecorder and hands the finished clip
 * to the same upload path as file uploads (POST /transcripts/audio). Audio
 * stays in memory — nothing is persisted client-side.
 */

function MicIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RecordButton({
  disabled,
  onRecorded,
  onError,
  style,
}: {
  disabled?: boolean;
  onRecorded: (file: File) => void;
  onError: (message: string) => void;
  style?: React.CSSProperties;
}) {
  const t = useT();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      // Unmount during a recording: drop the clip, release the microphone.
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
        recorder.stream.getTracks().forEach((track) => track.stop());
      }
    },
    [],
  );

  const start = async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError(t("mic.unsupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        setRecording(false);
        const type = recorder.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) onRecorded(new File([blob], `recording.${ext}`, { type }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      onError(t("mic.denied"));
    }
  };

  const stop = () => recorderRef.current?.stop();

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
      {recording && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            color: "var(--critical)",
            fontWeight: "var(--weight-semibold)",
            background: "var(--surface-card)",
            border: "1px solid var(--critical-border)",
            borderRadius: "var(--r-sm)",
            padding: "2px 6px",
          }}
        >
          {format(seconds)}
        </span>
      )}
      <button
        type="button"
        title={recording ? t("mic.stop") : t("mic.start")}
        aria-label={recording ? t("mic.stop") : t("mic.start")}
        disabled={disabled}
        onClick={recording ? stop : start}
        style={{
          appearance: "none",
          cursor: disabled ? "default" : "pointer",
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1.5px solid ${recording ? "var(--critical)" : "var(--border-strong)"}`,
          background: recording ? "var(--critical-tint)" : "var(--surface-card)",
          color: recording ? "var(--critical)" : "var(--text-tertiary)",
          opacity: disabled ? 0.5 : 1,
          transition: "background 120ms ease, border-color 120ms ease, color 120ms ease",
        }}
      >
        {recording ? (
          <span
            aria-hidden="true"
            style={{ width: 10, height: 10, borderRadius: 2, background: "var(--critical)" }}
          />
        ) : (
          <MicIcon />
        )}
      </button>
    </span>
  );
}
