"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import api from "@/services/api";

const STEPS=['uploading','merging','processing','done'] as const;
type Step = (typeof STEPS)[number]

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<Step>("uploading");

  const CHUNK_SIZE = 2 * 1024 * 1024; // 5 MB

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setCurrentStep("uploading");

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = Date.now().toString(); // Unique ID for the file

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("fileId", fileId);
      formData.append("chunkIndex", i.toString());
      formData.append("totalChunks", totalChunks.toString());

      console.log("formData", formData);

      if (i === totalChunks - 1) {
        formData.append("isFinalChunk", "true");
      }

      try {
        const response = await api.post("/upload/chunk", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.status) {
          const currentProgress = ((i + 1) / totalChunks) * 100;
          setProgress(currentProgress);
        } else {
          throw new Error("Chunk upload failed");
        }
      } catch (error) {
        console.error("Error uploading chunk:", error);
        alert("Failed to upload video. Please try again.");
        setUploading(false);
        return;
      }
    }

    alert("Video uploaded successfully!");
    setFile(null);
    setTitle("");
    setDescription("");
    setUploading(false);
    setProgress(0);
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
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full">
          <div
            className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
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
