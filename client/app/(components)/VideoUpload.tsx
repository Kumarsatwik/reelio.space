"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/hooks/use-toast";

const STEPS = ["upload", "uploading", "merging", "processing", "done"] as const;
type Step = (typeof STEPS)[number];

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const { user } = useAuthStore();

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for S3 multipart

  const initiateUpload = async (file: File) => {
    try {
      const response = await api.post("/upload/initiate", {
        fileName: `${user?.userId}___${Date.now()}___${file.name}`,
        fileType: file.type,
      });
      return response.data.uploadId;
    } catch (error) {
      console.error("Failed to initiate upload:", error);
      throw error;
    }
  };

  const uploadChunk = async (
    chunk: Blob,
    partNumber: number,
    uploadId: string
  ) => {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("partNumber", partNumber.toString());

    const response = await api.post(`/upload/part/${uploadId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.part;
  };

  const completeUpload = async (uploadId: string) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("userId", user?.userId || "");
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    console.log("completeUpload", formData);

    const response = await api.post(`/upload/complete/${uploadId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setCurrentStep("uploading");

    try {
      // Initiate multipart upload
      const uploadId = await initiateUpload(file);
      setUploadId(uploadId);

      const chunks: Blob[] = [];
      for (let start = 0; start < file.size; start += CHUNK_SIZE) {
        chunks.push(file.slice(start, start + CHUNK_SIZE));
      }

      // Track upload progress
      const totalChunks = chunks.length;
      let uploadedChunks = 0;

      // Upload chunks sequentially with progress
      for (const chunk of chunks) {
        await uploadChunk(chunk, ++uploadedChunks, uploadId);
        setProgress((prev) => {
          const newProgress = (uploadedChunks / totalChunks) * 100;
          return Math.min(newProgress, 100);
        });
      }

      // Complete the multipart upload
      await completeUpload(uploadId);
      setCurrentStep("done");

      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setThumbnail(null);
      setCategory("");
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.error,
      });
      if (uploadId) {
        try {
          await api.delete(`/upload/abort/${uploadId}`);
        } catch (abortError) {
          console.error("Failed to abort upload:", abortError);
        }
      }
    } finally {
      setUploading(false);
      // Only reset progress if not completed successfully
      if (currentStep !== "done") {
        setProgress(0);
      }
      setUploadId(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Input
          id="file"
          type="file"
          accept="video/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            setFile(selectedFile);
            if (selectedFile) {
              setTitle(selectedFile.name);
            }
          }}
          className="hidden"
        />
        <Label htmlFor="file" className="cursor-pointer">
          {file ? (
            <p className="mt-2 text-sm text-gray-500">{file.name}</p>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Click to upload or drag and drop your video file
              </p>
            </>
          )}
        </Label>
      </div>
      <div>
        <Label htmlFor="title">Video Title</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Video Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="thumbnail">Video Thumbnail</Label>
        <Input
          id="thumbnail"
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
        />
        {thumbnail && (
          <p className="mt-2 text-sm text-gray-500">
            Selected: {thumbnail.name}
          </p>
        )}
      </div>

      {(uploading || progress > 0) && (
        <div className="w-full bg-gray-200 rounded-full transition-all duration-300">
          <div
            className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          >
            {progress.toFixed(2)}%
          </div>
        </div>
      )}
      <Button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Video"}
      </Button>
    </form>
  );
}
