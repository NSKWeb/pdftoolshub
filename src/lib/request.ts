import { headers } from "next/headers";

export function getClientId(request?: Request): string {
  if (request) {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous"
    );
  }
  
  const headerList = headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "anonymous"
  );
}
