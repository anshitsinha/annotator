"use client";

import { useEffect, useRef, useState } from "react";
import labels from "../../lib/labels.json";

function formatTime(s) {
  if (!isFinite(s)) return "0:00";
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  const min = Math.floor(s / 60);
  return `${min}:${sec}`;
}

function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoInfo, setVideoInfo] = useState({
    width: 0,
    height: 0,
    aspectRatio: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration || 0);
    const onLoaded = () => {
      setVideoInfo({
        width: v.videoWidth,
        height: v.videoHeight,
        aspectRatio: v.videoWidth / v.videoHeight,
      });
      setError(null);
    };
    const onError = (e) => {
      console.error("Video error:", e);
      setError(
        "Failed to load video. The file may be corrupted or in an unsupported format."
      );
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("error", onError);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onError);
    };
  }, [videoRef]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch((err) => {
        console.error("Play failed:", err);
        setError("Playback failed: " + err.message);
      });
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function skip(sec) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
  }

  function onSeek(e) {
    const v = videoRef.current;
    if (!v) return;
    const pct = Number(e.target.value);
    v.currentTime = (pct / 100) * (v.duration || 0);
  }

  function onVolume(e) {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    setVolume(val);
  }

  function onRate(e) {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.playbackRate = val;
    setPlaybackRate(val);
  }

  function enterFullscreen() {
    const el = containerRef.current || videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  }

  // Calculate responsive video dimensions
  const getVideoStyle = () => {
    if (!videoInfo.width || !videoInfo.height) return {};

    // For unusual aspect ratios like 1920x2160, limit maximum height
    const maxHeight = 600;
    const calculatedHeight = Math.min(videoInfo.height, maxHeight);
    const calculatedWidth =
      (calculatedHeight / videoInfo.height) * videoInfo.width;

    return {
      width: "100%",
      height: "auto",
      maxHeight: `${maxHeight}px`,
      objectFit: "contain",
    };
  };

  return (
    <div className="w-full rounded bg-black/80 p-2" ref={containerRef}>
      <div className="relative">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-white p-4 rounded">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">Video Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={src}
          className="w-full rounded"
          style={getVideoStyle()}
          preload="metadata"
          playsInline
          controls={false} // We're using custom controls
        />

        {/* Video info badge */}
        {videoInfo.width > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {videoInfo.width}×{videoInfo.height} (
            {videoInfo.aspectRatio.toFixed(2)})
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => skip(-5)}
              className="px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
            >
              -5s
            </button>
            <button
              onClick={togglePlay}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => skip(5)}
              className="px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
            >
              +5s
            </button>

            <div className="flex-1 min-w-[100px] mx-2">
              <input
                type="range"
                min={0}
                max={100}
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={onSeek}
                className="w-full"
                disabled={!duration}
              />
              <div className="flex justify-between text-xs text-white/80 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-white/80">Vol</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={onVolume}
                className="w-16"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-white/80">Speed</label>
              <select
                value={playbackRate}
                onChange={onRate}
                className="bg-slate-800 text-white/90 rounded px-1 py-0.5 text-sm"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                  <option key={r} value={r}>
                    {r}x
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={enterFullscreen}
              className="px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
            >
              ⤢
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnotationItem({
  token,
  idx,
  onDelete,
  onMoveUp,
  onMoveDown,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  isDraggingOver,
}) {
  return (
    <li
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded border bg-slate-50 dark:bg-slate-800 transition-all ${
        isDraggingOver
          ? "ring-2 ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
          : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="cursor-grab text-sm select-none hover:text-indigo-600">
          ☰
        </div>
        <div className="text-sm font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border">
          {token}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onMoveUp}
          title="Move up"
          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          title="Move down"
          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          ↓
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export default function AnnotatePage() {
  const [file, setFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [filename, setFilename] = useState("");
  const [status, setStatus] = useState({ kind: "idle", msg: "" });
  const [annotations, setAnnotations] = useState([]);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [current, setCurrent] = useState({
    z1: "FC",
    z2: "FC",
    a1: "V",
    a2: "E",
    e: "STOP",
  });
  const [pendingForce, setPendingForce] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Supported video formats
  const supportedFormats = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
    "video/3gpp",
    "video/mpeg",
  ];

  const supportedExtensions = [
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".3gp",
    ".mpeg",
    ".mpg",
  ];

  useEffect(() => {
    if (file) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setFilename(nameWithoutExt);
    }
  }, [file]);

  // Create object URL for the selected file
  useEffect(() => {
    if (!file) {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Error revoking object URL:", e);
      }
    };
  }, [file]);

  // Handle file selection with validation
  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;

    // Check if file is a video
    const isVideo = selectedFile.type.startsWith("video/");
    const hasSupportedExtension = supportedExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!isVideo && !hasSupportedExtension) {
      setStatus({
        kind: "error",
        msg: "Please select a video file (MP4, MOV, AVI, MKV, WebM, etc.)",
      });
      return;
    }

    // No client-side size limit; very large files may be slow to open in the browser.

    if (selectedFile.size === 0) {
      setStatus({ kind: "error", msg: "File is empty" });
      return;
    }

    setFile(selectedFile);
    setStatus({
      kind: "success",
      msg: `File selected: ${selectedFile.name} (${(
        selectedFile.size /
        (1024 * 1024)
      ).toFixed(2)}MB)`,
    });
    setAnnotations([]); // Reset annotations for new file
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  async function check() {
    if (!filename) {
      return setStatus({ kind: "error", msg: "Please set filename" });
    }
    setStatus({ kind: "loading", msg: "Checking..." });
    try {
      const res = await fetch(
        `/api/check?filename=${encodeURIComponent(filename)}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const j = await res.json();
      if (j.annotated) {
        setStatus({ kind: "info", msg: `Already annotated (${j.source})` });
        if (j.doc && j.doc.annotations) setAnnotations(j.doc.annotations || []);
      } else {
        setStatus({ kind: "success", msg: "Not annotated yet" });
      }
    } catch (err) {
      setStatus({ kind: "error", msg: err.message });
    }
  }

  function addToken() {
    const token = `<${current.z1}→${current.z2} : ${current.a1}→${current.a2} : ${current.e}>`;
    setAnnotations((a) => [...a, { token, ...current }]);
  }

  function removeToken(idx) {
    setAnnotations((a) => a.filter((_, i) => i !== idx));
  }

  function moveAnnotation(from, to) {
    setAnnotations((prev) => {
      const arr = [...prev];
      if (from < 0 || from >= arr.length) return arr;
      let target = to;
      if (target < 0) target = 0;
      if (target > arr.length - 1) target = arr.length - 1;
      const [item] = arr.splice(from, 1);
      const insertAt = from < target ? target : target;
      arr.splice(insertAt, 0, item);
      return arr;
    });
  }

  async function saveWithPossibleForce() {
    if (!filename) {
      return setStatus({ kind: "error", msg: "Please set filename" });
    }

    setStatus({
      kind: "loading",
      msg: pendingForce ? "Overwriting..." : "Saving...",
    });

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename,
          annotations,
          force: pendingForce,
        }),
      });

      const j = await res.json();
      if (res.status === 200 && j.ok) {
        setStatus({
          kind: "success",
          msg: pendingForce ? "Overwritten in DB" : "Saved to DB",
        });
        setPendingForce(false);
      } else if (res.status === 409 && j.exists) {
        setStatus({
          kind: "error",
          msg: "Annotation already exists. Click Save again to overwrite.",
        });
        setPendingForce(true);
      } else {
        setStatus({ kind: "error", msg: j.error || "Save failed" });
      }
    } catch (err) {
      setStatus({ kind: "error", msg: err.message });
    }
  }

  return (
    <div className="min-h-screen p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2 text-indigo-700 dark:text-indigo-400">
          Video Annotator
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Upload and annotate videos with custom tokens
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">
                Video Upload
              </label>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.3gp,.mpeg,.mpg"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="text-4xl">🎬</div>
                  <div>
                    <div className="text-lg font-medium mb-1">
                      {isDragging
                        ? "Drop video here"
                        : "Click to upload or drag and drop"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Supports MP4, MOV, AVI, MKV, WebM, 3GP, MPEG
                    </div>
                  </div>
                </div>
              </div>

              {/* Filename and Check Section */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Filename (without extension)
                  </label>
                  <input
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Enter filename for annotation"
                    className="w-full px-4 py-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={check}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!filename.trim()}
                  >
                    Check Annotation Status
                  </button>
                </div>

                {/* Status Message */}
                <div className="min-h-[24px]">
                  {status.kind === "loading" && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      {status.msg}
                    </div>
                  )}
                  {status.kind === "error" && (
                    <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                      {status.msg}
                    </div>
                  )}
                  {status.kind === "success" && (
                    <div className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                      {status.msg}
                    </div>
                  )}
                  {status.kind === "info" && (
                    <div className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                      {status.msg}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video Player */}
            {file && objectUrl && (
              <div className="mb-6">
                <VideoPlayer src={objectUrl} key={file.name} />
              </div>
            )}

            {/* Annotations List */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span>Annotations</span>
                {annotations.length > 0 && (
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm px-2 py-1 rounded-full">
                    {annotations.length}
                  </span>
                )}
              </h2>

              {annotations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-2xl mb-2">📝</div>
                  <div>No annotations yet</div>
                  <div className="text-sm mt-1">
                    Create tokens using the panel on the right
                  </div>
                </div>
              ) : (
                <ul
                  className="space-y-2"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(annotations.length);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData("text/plain");
                    const from = Number(data);
                    if (!Number.isNaN(from))
                      moveAnnotation(from, annotations.length - 1);
                    setDraggingIdx(null);
                    setDragOverIdx(null);
                  }}
                >
                  {annotations.map((a, i) => (
                    <AnnotationItem
                      key={`${a.token}-${i}`}
                      token={a.token}
                      idx={i}
                      onDelete={() => removeToken(i)}
                      onMoveUp={() => moveAnnotation(i, Math.max(0, i - 1))}
                      onMoveDown={() =>
                        moveAnnotation(
                          i,
                          Math.min(annotations.length - 1, i + 1)
                        )
                      }
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(i));
                        setDraggingIdx(i);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverIdx(i);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData("text/plain");
                        const from = Number(data);
                        if (!Number.isNaN(from)) moveAnnotation(from, i);
                        setDraggingIdx(null);
                        setDragOverIdx(null);
                      }}
                      isDraggingOver={dragOverIdx === i}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Token Creation Sidebar */}
          <aside className="bg-slate-50 dark:bg-slate-900 rounded-lg p-5 border">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span>Create Token</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                Beta
              </span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Zone Transition
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={current.z1}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, z1: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {labels.zones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-500">→</span>
                  <select
                    value={current.z2}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, z2: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {labels.zones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Actor Transition
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={current.a1}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, a1: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {labels.actors.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-500">→</span>
                  <select
                    value={current.a2}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, a2: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {labels.actors.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event</label>
                <select
                  value={current.e}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, e: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {labels.events.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="bg-white dark:bg-slate-800 border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Preview</div>
                <div className="font-mono text-sm bg-gray-100 dark:bg-slate-900 p-2 rounded border">
                  {`<${current.z1}→${current.z2} : ${current.a1}→${current.a2} : ${current.e}>`}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={addToken}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>+</span>
                  Add Token to List
                </button>

                <button
                  onClick={saveWithPossibleForce}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    pendingForce
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  disabled={annotations.length === 0}
                >
                  {pendingForce ? "⚠️ Overwrite Save" : "💾 Save Annotations"}
                </button>

                <a
                  href="/view"
                  className="block w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-center"
                >
                  📋 View Annotations
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
