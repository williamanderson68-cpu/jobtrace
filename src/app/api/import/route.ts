import { NextResponse } from "next/server";
import { runJobImport } from "../../../lib/job-importer";

export async function GET() {
  const result = await runJobImport();

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
