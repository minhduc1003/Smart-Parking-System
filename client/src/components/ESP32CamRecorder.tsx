"use client";
import React, { useEffect, useRef, useState } from "react";

const ESP32CamRecorder = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = "http://172.20.10.4/"; // MJPEG stream từ ESP32-CAM
    img.crossOrigin = "anonymous";

    img.onload = function draw() {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(draw);
    };

    const stream = canvas.captureStream(15);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    };

    mediaRecorder.start();
    setRecording(true);

    return () => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, []);

  return (
    <div className="space-y-2 absolute top-0 left-0 w-full h-full">
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="rounded-xl shadow-lg"
      />
      <p className="text-green-600 absolute top-0 left-[-510px]">
        🔴 Đang ghi lại camera từ ESP32-CAM...
      </p>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={`esp32cam_record_${Date.now()}.webm`}
          className="text-blue-600 underline absolute top-10 left-[-510px]"
        >
          📥 Tải video đã ghi
        </a>
      )}
    </div>
  );
};

export default ESP32CamRecorder;
