"use client";

import {
  BrowserQRCodeReader,
  type IScannerControls,
} from "@zxing/browser";
import { useEffect, useRef } from "react";

export function QrScanner({
  onDecoded,
  onError,
}: {
  onDecoded: (value: string) => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const decodedRef = useRef(false);

  useEffect(() => {
    const reader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 150,
    });
    let controls: IScannerControls | undefined;
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (!cancelled && result && !decodedRef.current) {
          decodedRef.current = true;
          controls?.stop();
          onDecoded(result.getText());
        }
      })
      .then((scannerControls) => {
        controls = scannerControls;
        if (cancelled) controls.stop();
      })
      .catch(() => {
        if (!cancelled) {
          onError(
            "Camera access failed. Allow camera permission and try again.",
          );
        }
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onDecoded, onError]);

  return (
    <div className="scanner-viewport">
      <video
        aria-label="QR camera preview"
        muted
        playsInline
        ref={videoRef}
      />
      <span className="scanner-viewport__corner scanner-viewport__corner--one" />
      <span className="scanner-viewport__corner scanner-viewport__corner--two" />
      <span className="scanner-viewport__corner scanner-viewport__corner--three" />
      <span className="scanner-viewport__corner scanner-viewport__corner--four" />
      <p>Hold the employee badge inside the frame</p>
    </div>
  );
}
