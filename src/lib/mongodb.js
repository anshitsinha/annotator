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
  clientPromise = client.connect();
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
