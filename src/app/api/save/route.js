import { getCollection } from "../../../lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.filename || !body.annotations) {
      return new Response(
        JSON.stringify({ error: "filename and annotations required" }),
        { status: 400 }
      );
    }
    let col;
    try {
      col = await getCollection("annotations");
    } catch (dbErr) {
      console.error("DB connection error in /api/save:", dbErr);
      return new Response(
        JSON.stringify({
          error: "DB connection failed: " + (dbErr.message || String(dbErr)),
        }),
        { status: 500 }
      );
    }
    // by default do not overwrite existing annotations to avoid accidental uploads
    const existing = await col.findOne({ filename: body.filename });
    const now = new Date();
    const doc = {
      filename: body.filename,
      annotations: body.annotations,
      meta: body.meta || {},
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    // If client explicitly passes { force: true } allow overwrite, otherwise reject
    if (existing && !body.force) {
      return new Response(
        JSON.stringify({ error: "annotation already exists", exists: true }),
        { status: 409 }
      );
    }

    await col.updateOne(
      { filename: body.filename },
      { $set: doc },
      { upsert: true }
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Unexpected /api/save error:", err);
    // Avoid leaking sensitive connection info in production. Return detailed
    // message only in development, otherwise send a generic DB error.
    const publicMsg =
      process.env.NODE_ENV === "development"
        ? err.message || String(err)
        : "Database connection failed. Check server logs and MONGODB_URI.";
    return new Response(JSON.stringify({ error: publicMsg }), {
      status: 500,
    });
  }
}
