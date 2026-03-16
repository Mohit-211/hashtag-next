// components/product/customization/UploadImageBox.tsx

"use client";

import { Upload } from "lucide-react";

export default function UploadImageBox() {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Upload Your Image</p>

      <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 cursor-pointer">
        <Upload className="h-6 w-6 text-muted-foreground" />

        <p className="text-sm text-muted-foreground">
          Drag & drop or click to upload
        </p>
      </div>
    </div>
  );
}
