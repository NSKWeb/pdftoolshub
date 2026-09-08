"use client";

import { useEffect, useState } from "react";
// In a real project, we would use swagger-ui-react, but we'll use a simple iframe or div approach if needed.
// For now, let's just point to where it would be.

export default function ApiDocs() {
  return (
    <div className="h-screen w-full bg-white">
      <iframe 
        src="https://petstore.swagger.io/?url=/api/docs/swagger.json" 
        className="w-full h-full border-none"
      />
    </div>
  );
}
