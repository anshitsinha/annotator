// View page - Update to show relations
"use client";

import { useEffect, useState } from "react";

export default function ViewPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/list");
        const j = await res.json();
        // API may return an error object when DB connection fails
        if (!res.ok) {
          console.error("/api/list error:", j);
          // show as empty list but surface message to user via itemsError
          setItems([]);
          setErrorMsg(j && j.error ? j.error : "Failed to load annotations");
        } else if (!Array.isArray(j)) {
          // defensive: if API returned unexpected payload, convert or show empty
          console.warn("/api/list returned non-array payload", j);
          setItems([]);
          setErrorMsg("Unexpected response from server");
        } else {
          setItems(j || []);
          setErrorMsg("");
        }
      } catch (e) {
        console.error(e);
        setErrorMsg(e.message || String(e));
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
        ) : errorMsg ? (
          <div className="text-sm text-red-600">Error: {errorMsg}</div>
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
                      Updated: {new Date(it.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {/* Annotations Section */}
                <div className="mt-3">
                  <h3 className="font-semibold text-sm mb-2">Annotations:</h3>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded border">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(it.annotations, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Relations Section */}
                {it.relations && it.relations.length > 0 && (
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm mb-2">Relations:</h3>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded border">
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(it.relations, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}