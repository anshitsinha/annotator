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
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration || 0);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("durationchange", onDur);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("durationchange", onDur);
    };
  }, [videoRef]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
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
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  }

  return (
    <div className="w-full rounded bg-black/80 p-2">
      <div className="relative">
        <video ref={videoRef} src={src} className="w-full rounded" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => skip(-5)}
              className="px-2 py-1 bg-slate-700 text-white rounded"
            >
              -5s
            </button>
            <button
              onClick={togglePlay}
              className="px-3 py-1 bg-indigo-600 text-white rounded"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => skip(5)}
              className="px-2 py-1 bg-slate-700 text-white rounded"
            >
              +5s
            </button>
            <div className="flex-1 mx-2">
              <input
                type="range"
                min={0}
                max={100}
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={onSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/80 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
           
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/80">Speed</label>
              <select
                value={playbackRate}
                onChange={onRate}
                className="bg-transparent text-white/90"
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
              className="px-2 py-1 bg-slate-700 text-white rounded"
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
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded border bg-slate-50 dark:bg-slate-800 ${
        isDraggingOver ? "ring-2 ring-indigo-400" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="cursor-grab text-sm select-none">☰</div>
        <div className="text-sm font-mono">{token}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onMoveUp}
          title="Move up"
          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          title="Move down"
          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm"
        >
          ↓
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm"
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

  useEffect(() => {
    if (file) setFilename(file.name || "uploaded_video");
  }, [file]);

  // create and memoize object URL for the selected file so re-renders don't reset video
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
      // cleanup when component unmounts or file changes
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    };
  }, [file]);

  async function check() {
    if (!filename)
      return setStatus({ kind: "error", msg: "Please set filename" });
    setStatus({ kind: "loading", msg: "Checking..." });
    try {
      const res = await fetch(
        `/api/check?filename=${encodeURIComponent(filename)}`
      );
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
      // normalize target
      let target = to;
      if (target < 0) target = 0;
      if (target > arr.length - 1) target = arr.length - 1;
      const [item] = arr.splice(from, 1);
      // after removal, if from < to, insertion index decreases by 1
      const insertAt = from < target ? target : target;
      arr.splice(insertAt, 0, item);
      return arr;
    });
  }

  async function save() {
    if (!filename)
      return setStatus({ kind: "error", msg: "Please set filename" });
    setStatus({ kind: "loading", msg: "Saving..." });
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename, annotations }),
      });
      const j = await res.json();
      if (j.ok) setStatus({ kind: "success", msg: "Saved to DB" });
      else setStatus({ kind: "error", msg: j.error || "save failed" });
    } catch (err) {
      setStatus({ kind: "error", msg: err.message });
    }
  }

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 border rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-4">Video Annotator</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Video</label>
              <div className="flex gap-3">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="px-3 py-2 border rounded"
                />
                <input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="filename (required)"
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  onClick={check}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  Check
                </button>
              </div>
              <div className="mt-2">
                {status.kind === "loading" && (
                  <span className="text-sm text-gray-500">{status.msg}</span>
                )}
                {status.kind === "error" && (
                  <span className="text-sm text-red-500">{status.msg}</span>
                )}
                {status.kind === "success" && (
                  <span className="text-sm text-green-600">{status.msg}</span>
                )}
                {status.kind === "info" && (
                  <span className="text-sm text-blue-600">{status.msg}</span>
                )}
              </div>
            </div>

            {file && objectUrl && (
              <div className="mb-4">
                <VideoPlayer src={objectUrl} key={file.name} />
              </div>
            )}

            <div>
              <h2 className="font-medium mb-2">Annotations</h2>
              <div>
                {annotations.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No annotations yet
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
                          try {
                            const crt = document.createElement("div");
                            crt.style.padding = "4px 8px";
                            crt.style.background = "#111827";
                            crt.style.color = "#fff";
                            crt.style.borderRadius = "4px";
                            crt.textContent = a.token;
                            document.body.appendChild(crt);
                            e.dataTransfer.setDragImage(crt, 10, 10);
                            setTimeout(() => document.body.removeChild(crt), 0);
                          } catch (e) {}
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
          </div>

          <aside className="p-4 border-l">
            <h3 className="font-medium mb-2">Create token</h3>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  value={current.z1}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, z1: e.target.value }))
                  }
                  className="flex-1 px-2 py-1 border rounded"
                >
                  {labels.zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
                <select
                  value={current.z2}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, z2: e.target.value }))
                  }
                  className="flex-1 px-2 py-1 border rounded"
                >
                  {labels.zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <select
                  value={current.a1}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, a1: e.target.value }))
                  }
                  className="flex-1 px-2 py-1 border rounded"
                >
                  {labels.actors.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <select
                  value={current.a2}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, a2: e.target.value }))
                  }
                  className="flex-1 px-2 py-1 border rounded"
                >
                  {labels.actors.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={current.e}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, e: e.target.value }))
                  }
                  className="w-full px-2 py-1 border rounded"
                >
                  {labels.events.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={addToken}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded"
                >
                  Add token
                </button>
                <button
                  onClick={save}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
