/* ============================================================
   public/admin/js/components/uploader.js
   Centralized Admin Media Uploader & Pipeline Manager.
   Guarantees:
   1. Large files & videos bypass Vercel 4.5MB body limit via direct signed Cloudinary upload.
   2. Real-time XHR upload progress (0-100%).
   3. Verification of storage asset before database persistence.
   4. Explicit error categorization (no silent fake fallbacks).
   5. Usable universally by MediaPicker, Hero, News, Gallery, Team, Sponsors, Car, etc.
   ============================================================ */

(function () {
  'use strict';

  const MAX_IMAGE_SIZE = 50 * 1024 * 1024;    // 50 MB
  const MAX_VIDEO_SIZE = 1000 * 1024 * 1024;  // 1000 MB (1 GB)
  const MAX_DOC_SIZE   = 100 * 1024 * 1024;   // 100 MB
  const VERCEL_PAYLOAD_LIMIT = 4.2 * 1024 * 1024; // 4.2 MB safe cutoff

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
   * Validate file against MIME types and size bounds
   */
  function validateFile(file, allowedType = 'all') {
    if (!file) throw new Error('No file selected for upload.');

    const name = file.name || 'file';
    const type = file.type || '';
    const ext = (name.split('.').pop() || '').toLowerCase();
    const size = file.size || 0;

    let isImage = ALLOWED_IMAGE_TYPES.includes(type) || type.startsWith('image/') || /^(jpg|jpeg|png|webp|gif|svg|bmp|tiff)$/i.test(ext);
    let isVideo = ALLOWED_VIDEO_TYPES.includes(type) || type.startsWith('video/') || /^(mp4|webm|ogg|mov|avi|mkv)$/i.test(ext);
    let isDoc = ALLOWED_DOC_TYPES.includes(type) || /^(pdf|doc|docx)$/i.test(ext);

    if (allowedType === 'image' && !isImage) {
      throw new Error(`Unsupported file type (${type || ext}). Please upload an image (PNG, JPG, WEBP, SVG, GIF).`);
    }
    if (allowedType === 'video' && !isVideo) {
      throw new Error(`Unsupported file type (${type || ext}). Please upload a video (MP4, WEBM, MOV).`);
    }
    if (allowedType === 'document' && !isDoc) {
      throw new Error(`Unsupported file type (${type || ext}). Please upload a PDF or Word document.`);
    }

    if (isImage && size > MAX_IMAGE_SIZE) {
      throw new Error(`Image is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 50MB.`);
    }
    if (isVideo && size > MAX_VIDEO_SIZE) {
      throw new Error(`Video is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 1000MB (1GB).`);
    }
    if (isDoc && size > MAX_DOC_SIZE) {
      throw new Error(`Document is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 100MB.`);
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
   * Upload file using direct signed upload to Cloudinary (with fallback to server stream for small files).
   *
   * @param {File} file - Browser File object
   * @param {Object} [options]
   * @param {string} [options.allowedType='all'] - 'image', 'video', 'document', 'all'
   * @param {string} [options.folder]           - Target Cloudinary folder
   * @param {string} [options.altText]          - Optional alt text
   * @param {string} [options.caption]          - Optional caption
   * @param {function} [options.onProgress]     - (percent: number, statusText: string) => void
   * @returns {Promise<{ success: boolean, url: string, secureUrl: string, publicId: string, asset: object }>}
   */
  async function uploadFile(file, options = {}) {
    const onProgress = options.onProgress || (() => {});
    const onStatus = (statusText, pct) => {
      onProgress(pct, statusText);
    };

    onStatus('Validating file...', 5);
    const meta = validateFile(file, options.allowedType || 'all');
    const folder = options.folder || meta.folder;
    const api = window.AdminApi || window.API;

    if (!api) {
      throw new Error('Admin API client not initialized.');
    }

    const isLargeFile = file.size > VERCEL_PAYLOAD_LIMIT;
    const forceDirect = isLargeFile || meta.isVideo;

    // Helper: Direct to Cloudinary XHR upload
    const executeDirectUpload = (sigData) => {
      return new Promise((resolve, reject) => {
        const cloudUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${meta.resourceType}/upload`;
        const cfd = new FormData();
        cfd.append('file', file);
        cfd.append('api_key', sigData.apiKey);
        cfd.append('timestamp', sigData.timestamp);
        cfd.append('signature', sigData.signature);
        cfd.append('folder', sigData.folder);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', cloudUrl);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const p = 10 + Math.round((e.loaded / e.total) * 75); // 10% to 85%
            const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (e.total / (1024 * 1024)).toFixed(1);
            onStatus(`Uploading to cloud storage (${loadedMb}MB / ${totalMb}MB)...`, p);
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
                errorMsg = parsed.error.message;
              }
            } catch (e) {
              // ignore
            }
            reject(new Error(`Storage upload failed: ${errorMsg}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during direct storage upload. Check internet connection.'));
        xhr.ontimeout = () => reject(new Error('Storage upload timed out. Please retry.'));
        xhr.send(cfd);
      });
    };

    let assetRecord = null;

    // Step 1: Attempt Direct Signed Upload (required for large files/videos, preferred for all)
    try {
      onStatus('Requesting secure upload authorization...', 10);
      const sigRes = await api.get(`/admin/media/signature?folder=${encodeURIComponent(folder)}`);

      if (sigRes && sigRes.success && sigRes.data && sigRes.data.signature) {
        onStatus(`Uploading directly to cloud storage (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 15);
        const cloudResult = await executeDirectUpload(sigRes.data);

        onStatus('Verifying asset and recording in CMS database...', 90);
        const recordRes = await api.post('/admin/media/direct-record', {
          publicId: cloudResult.public_id,
          url: cloudResult.secure_url || cloudResult.url,
          secureUrl: cloudResult.secure_url || cloudResult.url,
          resourceType: cloudResult.resource_type || meta.resourceType,
          format: cloudResult.format || (file.name.split('.').pop() || '').toLowerCase(),
          bytes: cloudResult.bytes || file.size,
          width: cloudResult.width || 0,
          height: cloudResult.height || 0,
          duration: cloudResult.duration || 0,
          altText: options.altText || file.name.replace(/\.[^/.]+$/, ''),
          caption: options.caption || '',
          folder: sigRes.data.folder || folder,
          originalName: file.name,
          mimeType: file.type,
        });

        if (recordRes && recordRes.success && recordRes.data) {
          assetRecord = recordRes.data;
        } else {
          throw new Error((recordRes && recordRes.message) || 'Database record creation failed.');
        }
      } else {
        throw new Error((sigRes && sigRes.message) || 'Could not obtain upload authorization.');
      }
    } catch (directErr) {
      if (forceDirect) {
        // Cannot fallback to serverless stream if file exceeds 4.5MB or is video
        throw new Error(directErr.message || 'Direct upload to Cloudinary failed.');
      }

      // Step 2: Fallback to Server Streaming only if file <= 4.2MB
      onStatus(`Direct upload unavailable, attempting server stream (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 30);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      if (options.altText) fd.append('altText', options.altText);
      if (options.caption) fd.append('caption', options.caption);

      const streamRes = await api.post('/admin/media/upload', fd);
      if (streamRes && streamRes.success && streamRes.data) {
        assetRecord = streamRes.data;
      } else {
        throw new Error((streamRes && streamRes.message) || 'Server upload stream failed.');
      }
    }

    onStatus('Upload complete and verified!', 100);

    const finalUrl = assetRecord.secureUrl || assetRecord.url;
    if (!finalUrl) {
      throw new Error('Pipeline error: no usable URL returned after upload.');
    }

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
      const isUrl = urlOrPublicId.startsWith('http://') || urlOrPublicId.startsWith('https://');
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
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    MAX_DOC_SIZE,
  };
})();
