"use client";

import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { useToast } from "./use-toast";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: keyof OurFileRouter;
}

export const FileUpload = ({
  onChange,
  value,
  endpoint
}: FileUploadProps) => {
  const { toast } = useToast();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {value ? (
        <div className="flex flex-col items-center gap-4 w-full">
          {value.endsWith(".pdf") ? (
            <iframe
              src={value}
              className="w-full h-64 border rounded-lg"
            />
          ) : (
            <img
              src={value}
              alt="Upload"
              className="rounded-lg w-full h-64 object-cover"
            />
          )}
          <button
            onClick={() => onChange("")}
            className="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600"
          >
            Remove file
          </button>
        </div>
      ) : (
        <UploadDropzone<OurFileRouter, typeof endpoint>
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            if (res?.[0]?.url) {
              onChange(res[0].url);
              toast({
                title: "File uploaded successfully",
                description: "Your file has been uploaded.",
                variant: "default",
              });
            }
          }}
          onUploadError={(error: Error) => {
            toast({
              title: "Upload failed",
              description: error.message || "Something went wrong",
              variant: "destructive",
            });
          }}
          config={{ mode: "auto" }}
        />
      )}
    </div>
  );
};