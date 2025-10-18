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

    const col = await getCollection("annotations");
    const now = new Date();
    const doc = {
      filename: body.filename,
      annotations: body.annotations,
      meta: body.meta || {},
      createdAt: now,
      updatedAt: now,
    };

    // upsert to prevent duplicates
    await col.updateOne(
      { filename: body.filename },
      { $set: doc },
      { upsert: true }
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
