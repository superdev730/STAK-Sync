import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { compressImage, validateImageFile } from "@/utils/imageCompression";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  autoCompressImages?: boolean; // New option to enable automatic image compression
  compressionQuality?: number; // Image compression quality (0-1)
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 52428800, // 50MB default - much larger for iPhone photos
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  autoCompressImages = true, // Enable compression by default
  compressionQuality = 0.8, // Good balance of quality vs size
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("file-added", async (file) => {
        // Auto-compress images if enabled
        if (autoCompressImages && file.type.startsWith('image/')) {
          try {
            console.log("🖼️ Compressing image:", file.name);
            
            // Create a File object from the Uppy file
            const originalFile = file.data as File;
            const compressed = await compressImage(originalFile, 1200, 900, compressionQuality);
            
            // Convert base64 to blob
            const response = await fetch(compressed);
            const blob = await response.blob();
            
            // Update the file with compressed version
            uppy.setFileState(file.id, {
              data: blob,
              size: blob.size
            });
            
            console.log(`🖼️ Image compressed: ${Math.round(((originalFile.size - blob.size) / originalFile.size) * 100)}% size reduction`);
          } catch (error) {
            console.error("Failed to compress image:", error);
            // Continue with original file if compression fails
          }
        }
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}