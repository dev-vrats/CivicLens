"use client";
import { useState, useCallback } from "react";

export interface UseImgBBUploadResult {
  upload: (file: File) => Promise<string | null>;
  progress: number;
  downloadURL: string | null;
  uploading: boolean;
  error: string | null;
  reset: () => void;
}

export function useImgBBUpload(): UseImgBBUploadResult {
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setDownloadURL(null);
    setUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      reset();
      setUploading(true);
      setProgress(10); // show immediate feedback

      try {
        // Convert file to base64 (ImgBB accepts base64 without the data: prefix)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the "data:image/...;base64," prefix
            resolve(result.split(",")[1]);
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        setProgress(40);

        const formData = new FormData();
        formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!);
        formData.append("image", base64);
        formData.append(
          "name",
          `civiclens_${Date.now()}`
        );

        setProgress(60);

        const res = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
        });

        setProgress(90);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || `ImgBB responded with status ${res.status}`
          );
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data?.error?.message || "ImgBB upload failed");
        }

        // Use the display URL (permanent, direct link)
        const url: string = data.data.display_url ?? data.data.url;
        setDownloadURL(url);
        setProgress(100);
        setUploading(false);
        return url;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Image upload failed. Try again.";
        setError(msg);
        setUploading(false);
        setProgress(0);
        return null;
      }
    },
    [reset]
  );

  return { upload, progress, downloadURL, uploading, error, reset };
}
