"use client";

import React from "react";

export default function Markdown({ content }: { content: string }) {
  return (
    <div
      className="max-w-full overflow-x-auto prose prose-invert"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
