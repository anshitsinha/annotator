// check.js - Update to handle relations
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { getCollection } from "../../../lib/mongodb";

const CSV_PATH =
  process.env.CSV_FILE_PATH ||
  path.join(process.cwd(), "annotations_export.csv");

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return new Response(JSON.stringify({ error: "filename required" }), {
        status: 400,
      });
    }

    // First check MongoDB if annotation exists
    try {
      const col = await getCollection("annotations");
      const exists = await col.findOne({ filename });
      if (exists) {
        // include the stored document for the UI
        return new Response(
          JSON.stringify({ 
            annotated: true, 
            source: "mongodb", 
            doc: exists 
          }),
          { status: 200 }
        );
      }
    } catch (err) {
      // ignore DB errors and fallback to CSV check
      console.error("DB check failed", err.message);
    }

    // Fallback: check CSV file if present
    if (!fs.existsSync(CSV_PATH)) {
      return new Response(
        JSON.stringify({ annotated: false, source: "none" }),
        { status: 200 }
      );
    }

    const csvText = fs.readFileSync(CSV_PATH, "utf8");
    const parsed = Papa.parse(csvText, { header: true });
    const rows = parsed.data || [];
    const found = rows.find((r) => {
      // common CSV header names that might contain filename
      const candidates = [
        "filename",
        "file",
        "video",
        "video_name",
        "videoFilename",
      ];
      for (const c of candidates) {
        if (r[c] && r[c] === filename) return true;
      }
      return false;
    });

    return new Response(JSON.stringify({ annotated: !!found, source: "csv" }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    const publicMsg =
      process.env.NODE_ENV === "development"
        ? err.message
        : "Server error while checking annotations. Check server logs.";
    return new Response(JSON.stringify({ error: publicMsg }), {
      status: 500,
    });
  }
}