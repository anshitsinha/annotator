import { getCollection } from "../../../lib/mongodb";

function objectArrayToCsv(rows, fields) {
  // simple CSV generator with quoting
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // escape quotes
    if (
      s.includes('"') ||
      s.includes(",") ||
      s.includes("\n") ||
      s.includes("\r")
    ) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const header = fields.join(",");
  const lines = [header];
  for (const r of rows) {
    const values = fields.map((f) => escape(r[f]));
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "json").toLowerCase();

    const col = await getCollection("annotations");
    const docs = await col.find({}).toArray();

    if (format === "csv") {
      // convert to flat CSV: filename, createdAt, updatedAt, annotations (as JSON string)
      const rows = docs.map((d) => ({
        filename: d.filename,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : "",
        annotations: JSON.stringify(d.annotations || []),
      }));
      const fields = ["filename", "createdAt", "updatedAt", "annotations"];
      const csv = objectArrayToCsv(rows, fields);
      return new Response(csv, {
        status: 200,
        headers: { "content-type": "text/csv; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify(docs), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    const publicMsg =
      process.env.NODE_ENV === "development"
        ? err.message
        : "Server error while listing annotations. Check server logs.";
    return new Response(JSON.stringify({ error: publicMsg }), {
      status: 500,
    });
  }
}
