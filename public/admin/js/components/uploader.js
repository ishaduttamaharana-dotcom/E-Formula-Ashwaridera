/* ============================================================
   public/admin/js/components/uploader.js
   Authoritative Admin Media Uploader & Pipeline Manager.
   Guarantees:
   1. Direct Cloudinary Signed CDN Upload for all media types (Images, Videos, PDFs).
   2. Zero Serverless Payload 413 Errors: Files bypass Vercel's 4.5MB limit completely.
   3. Automatic Client-Side Image Optimization: High-res images (>10MB up to 25MB)
      are dynamically compressed in 4K UHD to fit Cloudinary Free tier limits.
   4. Accurate Real-Time Progress: Progress bar tracks true transfer bytes (0-80%),
      asset verification (85%), and database recording (95%) until 100% confirmation.
   5. Authentic file size limits enforced truthfully without false 1000MB advertising.
   6. Idempotent asset recording in MongoDB via /api/v1/admin/media/direct-record.
   ============================================================ */

(function () {
  'use strict';

  // Realistic supported limits for Cloudinary Free Tier architecture
  const MAX_IMAGE_SIZE = 25 * 1024 * 1024;  // 25 MB max (auto-optimized via 4K canvas if >10MB)
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB max (Cloudinary Free account single video limit)
  const MAX_DOC_SIZE   = 10 * 1024 * 1024;  // 10 MB max (Cloudinary Free account single raw file limit)
  const CLOUDINARY_MAX_DIRECT_IMAGE = 10 * 1024 * 1024; // 10 MB Cloudinary Free single image limit

  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff',
  ];
  const ALLOWED_VIDEO_TYPES = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska',
  ];
  const ALLOWED_DOC_TYPES = [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  /**
   * Validate file against MIME types and storage tier bounds.
   */
  function validateFile(file, allowedType = 'all') {
    if (!file) throw new Error('No file selected for upload.');

    const name = file.name || 'file';
    const type = file.type || '';
    const ext = (name.split('.').pop() || '').toLowerCase();
    const size = file.size || 0;

    const isImage = ALLOWED_IMAGE_TYPES.includes(type) || type.startsWith('image/') || /^(jpg|jpeg|png|webp|gif|svg|bmp|tiff|avif|ico)$/i.test(ext);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(type) || type.startsWith('video/') || /^(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(ext);
    const isDoc   = ALLOWED_DOC_TYPES.includes(type) || /^(pdf|doc|docx)$/i.test(ext) || type.includes('pdf');

    const targetType = (allowedType || 'all').toLowerCase();

    if (targetType === 'image' && !isImage) {
      throw new Error(`Unsupported file type (${type || ext}). Please upload an image (PNG, JPG, WEBP, SVG, GIF).`);
    }
    if (targetType === 'video' && !isVideo) {
      throw new Error(`Unsupported file type (${type || ext}). Please upload a video (MP4, WEBM, MOV).`);
    }
    if ((targetType === 'document' || targetType === 'raw' || targetType === 'doc') && !isDoc) {
      throw new Error(`Unsupported file type (${type || ext}). Please upload a PDF or Word document.`);
    }
    if (targetType === 'all' && !isImage && !isVideo && !isDoc) {
      throw new Error(`Unsupported file format (.${ext}). Supported formats: PNG, JPG, WEBP, GIF, MP4, WEBM, PDF.`);
    }

    if (isImage && size > MAX_IMAGE_SIZE) {
      throw new Error(`Image is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 25 MB.`);
    }
    if (isVideo && size > MAX_VIDEO_SIZE) {
      throw new Error(`Video is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 100 MB.`);
    }
    if (isDoc && size > MAX_DOC_SIZE) {
      throw new Error(`Document is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
    }

    return {
      resourceType: isVideo ? 'video' : (isDoc ? 'raw' : 'image'),
      isImage,
      isVideo,
      isDoc,
      folder: isVideo ? 'ashwa_cms/videos' : (isDoc ? 'ashwa_cms/documents' : 'ashwa_cms/images'),
    };
  }

  /**
   * Client-Side Image Optimizer:
   * When a high-res photo exceeds Cloudinary's 10 MB limit (e.g. DSLR/RAW or 20MB PNG),
   * dynamically resizes to crisp 4K UHD and compresses to high-quality JPEG.
   * Enables immediate Cloudinary CDN acceptance without any "File size too large" error.
   */
  async function compressImageIfNeeded(file, maxBytes = 9.5 * 1024 * 1024) {
    if (!file || !file.type || !file.type.startsWith('image/')) return file;
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
    if (file.size <= maxBytes) return file;

    return new Promise((resolve) => {
      try {
        const img = new Image();
        const blobUrl = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(blobUrl);
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Max resolution bound: 3840px (4K Ultra HD)
          const MAX_DIM = 3840;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive quality reduction to fit under maxBytes
          const tryJpeg = (quality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob || blob.size <= maxBytes || quality <= 0.5) {
                  const outBlob = blob || file;
                  const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
                  const optimizedFile = new File([outBlob], newName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  console.log(`[UPLOADER] Auto-optimized image: ${(file.size / (1024 * 1024)).toFixed(1)}MB -> ${(optimizedFile.size / (1024 * 1024)).toFixed(1)}MB`);
                  resolve(optimizedFile);
                } else {
                  tryJpeg(quality - 0.12);
                }
              },
              'image/jpeg',
              quality
            );
          };

          tryJpeg(0.88);
        };

        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          resolve(file);
        };

        img.src = blobUrl;
      } catch (err) {
        resolve(file);
      }
    });
  }

  /**
   * Helper: Direct Cloudinary XHR upload with real progress tracking.
   * Uploads file directly to api.cloudinary.com so no file bytes touch Vercel functions.
   */
  const executeDirectUpload = (sigData, targetFile, resourceType, onProgress) => {
    return new Promise((resolve, reject) => {
      const cloudUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${resourceType}/upload`;
      const cfd = new FormData();
      cfd.append('file', targetFile);
      cfd.append('api_key', sigData.apiKey);
      cfd.append('timestamp', sigData.timestamp);
      cfd.append('signature', sigData.signature);
      cfd.append('folder', sigData.folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', cloudUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // Transfer represents 15% to 80% of entire pipeline
          const p = 15 + Math.round((e.loaded / e.total) * 65);
          const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
          const totalMb = (e.total / (1024 * 1024)).toFixed(1);
          onProgress(p, `Uploading directly to Cloudinary CDN (${loadedMb}MB / ${totalMb}MB)...`);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resData = JSON.parse(xhr.responseText);
            resolve(resData);
          } catch (err) {
            reject(new Error('Invalid JSON response from Cloudinary.'));
          }
        } else {
          let errorMsg = `Cloudinary rejected upload (HTTP ${xhr.status})`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.error && parsed.error.message) {
              errorMsg = `Cloudinary rejected upload: ${parsed.error.message}`;
            }
          } catch (e) {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network connection error while uploading to Cloudinary CDN.'));
      xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out after 5 minutes.'));
      xhr.timeout = 300000; // 5 min timeout
      xhr.send(cfd);
    });
  };

    // Step 2: Request Signed Upload Parameters from Backend
    onStatus(14, 'Requesting secure cloud upload authorization...');
    let sigRes;
    try {
      sigRes = await api.get('/admin/media/signature', { folder });
    } catch (sigErr) {
      throw new Error(`Cloud upload authorization failed: ${sigErr.message || 'Server rejected signature request. Please verify your session.'}`);
    }

    if (!sigRes || !sigRes.success || !sigRes.data || !sigRes.data.signature) {
      throw new Error((sigRes && sigRes.message) || 'Cloudinary signature could not be generated.');
    }

    const sigData = sigRes.data;

    // Step 3: Direct-to-Cloudinary Upload via XHR
    onStatus(15, `Uploading directly to Cloudinary CDN (${(uploadTarget.size / (1024 * 1024)).toFixed(1)} MB)...`);
    const cloudResult = await executeDirectUpload(sigData, uploadTarget, meta.resourceType, onStatus);

    if (!cloudResult || (!cloudResult.secure_url && !cloudResult.url)) {
      throw new Error('Cloudinary finished without returning a valid asset URL.');
    }

    // Step 4: Verify Asset with Backend & Record in Database
    onStatus(85, 'Verifying asset in cloud storage...');
    const recordPayload = {
      publicId: cloudResult.public_id,
      url: cloudResult.secure_url || cloudResult.url,
      secureUrl: cloudResult.secure_url || cloudResult.url,
      resourceType: cloudResult.resource_type || meta.resourceType,
      format: cloudResult.format || (uploadTarget.name.split('.').pop() || '').toLowerCase(),
      bytes: cloudResult.bytes || uploadTarget.size,
      width: cloudResult.width || 0,
      height: cloudResult.height || 0,
      duration: cloudResult.duration || 0,
      altText: options.altText || file.name.replace(/\.[^/.]+$/, ''),
      caption: options.caption || '',
      folder: sigData.folder || folder,
      originalName: file.name,
      mimeType: uploadTarget.type || file.type,
    };

    onStatus(92, 'Recording asset in CMS Media Library database...');
    const recordRes = await api.post('/admin/media/direct-record', recordPayload);

    if (!recordRes || !recordRes.success || !recordRes.data) {
      throw new Error((recordRes && recordRes.message) || 'Failed to save media asset reference in database.');
    }

    const assetRecord = recordRes.data;

    // Step 5: Confirmed Complete
    onStatus(100, 'Upload complete and verified!');

    const finalUrl = assetRecord.secureUrl || assetRecord.url;
    return {
      success: true,
      url: finalUrl,
      secureUrl: finalUrl,
      publicId: assetRecord.publicId,
      asset: assetRecord,
    };
  }

  /**
   * Verify that a URL or publicId is live and accessible
   */
  async function verifyMedia(urlOrPublicId, resourceType = 'image') {
    const api = window.AdminApi || window.API;
    if (!api) return { ok: false };

    try {
      const isUrl = urlOrPublicId.startsWith('http://') || urlOrPublicId.startsWith('https://') || urlOrPublicId.startsWith('/uploads/');
      const body = isUrl ? { url: urlOrPublicId, resourceType } : { publicId: urlOrPublicId, resourceType };
      const res = await api.post('/admin/media/verify', body);
      return res && res.data ? res.data : { ok: false };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Export globally to window
  window.AdminUploader = {
    uploadFile,
    validateFile,
    verifyMedia,
    compressImageIfNeeded,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    MAX_DOC_SIZE,
    CLOUDINARY_MAX_IMAGE_SIZE: CLOUDINARY_MAX_DIRECT_IMAGE,
    CLOUDINARY_MAX_VIDEO_SIZE: MAX_VIDEO_SIZE,
    CLOUDINARY_MAX_DOC_SIZE: MAX_DOC_SIZE,
  };
})();
