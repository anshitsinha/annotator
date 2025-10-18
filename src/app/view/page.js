"use client";

import { useEffect, useState } from "react";

export default function ViewPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/list");
        const j = await res.json();
        setItems(j || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 border rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Annotations</h1>
          <div className="flex gap-2">
            <a
              className="px-3 py-2 bg-indigo-600 text-white rounded"
              href="/api/list?format=csv"
            >
              Download CSV
            </a>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div>No annotations found</div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <div
                key={it._id}
                className="p-3 border rounded bg-slate-50 dark:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono">{it.filename}</div>
                    <div className="text-sm text-gray-500">
                      Updated: {it.updatedAt}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(it.annotations, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
