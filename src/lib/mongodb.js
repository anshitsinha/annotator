import { MongoClient } from "mongodb";

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

const uri = process.env.MONGODB_URI;

if (!client) {
  client = new MongoClient(uri);
  // wrap connect to show clearer errors for malformed URIs
  clientPromise = client.connect().catch((err) => {
    // common Mongo URI error: must include protocol and host
    const hint = /Invalid connection string|Invalid URI|must have host/.test(
      err.message
    )
      ? "MongoDB URI appears invalid. Ensure it contains protocol and host (example: mongodb+srv://user:pass@cluster0.example.mongodb.net)."
      : null;
    try {
      // try to parse host for debugging (without credentials)
      const u = new URL(uri);
      const maskedHost = u.host ? u.host : "unknown-host";
      console.error(
        `MongoClient.connect failed for host=${maskedHost}:`,
        err.message
      );
    } catch (parseErr) {
      console.error(
        "MongoClient.connect failed; could not parse URI host",
        parseErr.message
      );
    }
    const e = new Error((hint ? hint + " " : "") + err.message);
    e.stack = err.stack;
    throw e;
  });
}

export async function getDb(dbName = "annotator") {
  await clientPromise;
  return client.db(dbName);
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

export default clientPromise;
