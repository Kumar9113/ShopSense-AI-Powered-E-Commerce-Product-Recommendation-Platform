// Storage service (Supabase Storage)
//
// This replaces the old Firebase / Google Cloud Storage upload helper that
// used to live inline in src/app/admin-view/add-product/page.js
// (initializeApp + getStorage + uploadBytesResumable + getDownloadURL).
//
// Images are still uploaded directly from the browser (same architecture as
// before with Firebase), so this uses the public anon Supabase client from
// "@/lib/supabase". No secret keys are used here.

import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "images";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

// Keep this in sync with whatever limit the UI / product requirements need.
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const createUniqueFileName = (file) => {
  const timeStamp = Date.now();
  const randomStringValue = Math.random().toString(36).substring(2, 12);
  const originalName = file?.name || "upload";

  // Preserve the original extension where possible.
  const lastDotIndex = originalName.lastIndexOf(".");
  const extension =
    lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : "";
  const baseName =
    lastDotIndex !== -1
      ? originalName.substring(0, lastDotIndex)
      : originalName;

  const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");

  return `${safeBaseName}-${timeStamp}-${randomStringValue}${extension}`;
};

const validateImageFile = (file) => {
  if (!file) {
    throw new Error("No file was provided for upload");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Unsupported file type. Please upload a JPEG, PNG, WEBP, GIF or SVG image."
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Image is too large. Maximum allowed size is ${
        MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
      }MB.`
    );
  }
};

/**
 * Uploads an image to Supabase Storage and returns its public URL along
 * with the storage path (the path is what you need later to delete the
 * file safely).
 *
 * @param {File} file - the image file selected by the user
 * @param {string} folder - logical folder/prefix inside the bucket, e.g. "ecommerce"
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadImage(file, folder = "ecommerce") {
  validateImageFile(file);

  const fileName = createUniqueFileName(file);
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    if (
      uploadError.message?.toLowerCase().includes("bucket not found") ||
      uploadError.statusCode === "404"
    ) {
      throw new Error(
        `Supabase storage bucket "${STORAGE_BUCKET}" was not found. Create it in the Supabase Dashboard → Storage → New Bucket.`
      );
    }
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const url = getImageUrl(filePath);

  if (!url) {
    throw new Error("Image uploaded, but generating its public URL failed.");
  }

  return { url, path: filePath };
}

/**
 * Returns the public URL for a given storage path in the configured bucket.
 * (The bucket is public, matching the previous Firebase Storage behavior
 * where getDownloadURL() returned a publicly loadable URL.)
 */
export function getImageUrl(filePath) {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

/**
 * Deletes an image from Supabase Storage given its storage path
 * (e.g. "ecommerce/my-file-123.jpg"), NOT the full public URL.
 * Not currently wired into any UI/API route (the previous Firebase
 * implementation did not support deleting images either), but provided
 * here so it can be used safely if that feature is added later.
 */
export async function deleteImage(filePath) {
  if (!filePath) {
    throw new Error("No storage path was provided for deletion");
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }

  return true;
}

/**
 * Given a Supabase public URL previously stored in the database, derive the
 * storage path that can be passed to deleteImage(). Returns null if the URL
 * doesn't look like it belongs to the configured bucket.
 */
export function getPathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.substring(index + marker.length);
}
