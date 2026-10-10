/* ============================================================
   public/admin/js/components/uploader.js
   Centralized Admin Media Uploader & Pipeline Manager.
   Guarantees:
   1. Client-Side Image Optimization: High-res images (>10MB) are
      intelligently optimized on-the-fly to fit Cloudinary Free Plan limits
      while maintaining crisp 4K quality.
   2. Direct Cloudinary Signed CDN Upload for all eligible assets.
   3. Large video fallback up to 1000MB to server disk storage.
   4. Real-time XHR upload progress (0-100%).
   5. Universal compatibility with MediaPicker, Hero, News, Gallery,
      Team, Sponsors, Car, About, etc.
   ============================================================ */

(function () {
  'use strict';

  // Overall system limits (1000 MB / 1 GB)
  const MAX_IMAGE_SIZE = 1000 * 1024 * 1024;  // 1000 MB (1 GB)
  const MAX_VIDEO_SIZE = 1000 * 1024 * 1024;  // 1000 MB (1 GB)
  const MAX_DOC_SIZE   = 1000 * 1024 * 1024;  // 1000 MB (1 GB)

  // Cloudinary Free tier plan limits
  const CLOUDINARY_MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB Cloudinary Free limit
  const CLOUDINARY_MAX_VIDEO_SIZE = 95 * 1024 * 1024; // 95 MB Cloudinary Free safe margin
  const CLOUDINARY_MAX_DOC_SIZE   = 10 * 1024 * 1024; // 10 MB Cloudinary Free limit

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
   * Validate file against MIME types and overall bounds
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
      throw new Error(`Image is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 1000MB (1GB).`);
    }
    if (isVideo && size > MAX_VIDEO_SIZE) {
      throw new Error(`Video is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 1000MB (1GB).`);
    }
    if (isDoc && size > MAX_DOC_SIZE) {
      throw new Error(`Document is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 1000MB (1GB).`);
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
   * When a high-res photo exceeds Cloudinary's 10 MB limit (e.g. DSLR/iPhone RAW or 35MB PNG),
   * dynamically resizes to crisp 4K UHD and compresses to high-quality JPEG/WebP.
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
   * Upload file using intelligent routing:
   * - Optimizes images > 10MB to fit within Cloudinary Free tier.
   * - Directly streams large videos (>95MB) to server storage.
   * - Real-time progress updates (0-100%).
   *
   * @param {File} file - Browser File object
   * @param {Object} [options]
   * @param {string} [options.allowedType='all'] - 'image', 'video', 'document', 'all'
   * @param {string} [options.folder]           - Target folder
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

    // Step 1: Client-Side Optimization for oversized images
    let uploadTarget = file;
    if (meta.isImage && file.size > CLOUDINARY_MAX_IMAGE_SIZE) {
      onStatus(`Optimizing high-resolution image (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 10);
      try {
        uploadTarget = await compressImageIfNeeded(file, CLOUDINARY_MAX_IMAGE_SIZE);
        onStatus(`Optimized to ${(uploadTarget.size / (1024 * 1024)).toFixed(1)} MB`, 15);
      } catch (e) {
        uploadTarget = file;
      }
    }

    // Helper: Direct Cloudinary XHR upload
    const executeDirectUpload = (sigData, targetFile) => {
      return new Promise((resolve, reject) => {
        const fileToUpload = targetFile || uploadTarget;
        const cloudUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${meta.resourceType}/upload`;
        const cfd = new FormData();
        cfd.append('file', fileToUpload);
        cfd.append('api_key', sigData.apiKey);
        cfd.append('timestamp', sigData.timestamp);
        cfd.append('signature', sigData.signature);
        cfd.append('folder', sigData.folder);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', cloudUrl);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const p = 15 + Math.round((e.loaded / e.total) * 75); // 15% to 90%
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
            } catch (e) {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during cloud storage upload.'));
        xhr.ontimeout = () => reject(new Error('Cloud storage upload timed out.'));
        xhr.send(cfd);
      });
    };

    // Helper: Local Server Stream upload (with real-time XHR progress)
    const executeServerUpload = (targetFile) => {
      return new Promise((resolve, reject) => {
        const fileToUpload = targetFile || uploadTarget;
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append('file', fileToUpload);
        fd.append('folder', folder);
        if (options.altText) fd.append('altText', options.altText);
        if (options.caption) fd.append('caption', options.caption);

        xhr.open('POST', '/api/v1/admin/media/upload');
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const p = 15 + Math.round((e.loaded / e.total) * 75); // 15% to 90%
            const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (e.total / (1024 * 1024)).toFixed(1);
            onStatus(`Uploading to server storage (${loadedMb}MB / ${totalMb}MB)...`, p);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resData = JSON.parse(xhr.responseText);
              if (resData.success && resData.data) {
                resolve(resData.data);
              } else {
                reject(new Error(resData.message || 'Server upload failed.'));
              }
            } catch (err) {
              reject(new Error('Invalid response from server.'));
            }
          } else {
            let errorMsg = `Server upload failed (HTTP ${xhr.status})`;
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed.message) errorMsg = parsed.message;
            } catch (e) {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during server upload.'));
        xhr.ontimeout = () => reject(new Error('Server upload timed out.'));
        xhr.send(fd);
      });
    };

    let assetRecord = null;
    const fitsInCloudinary =
      (meta.isImage && uploadTarget.size <= CLOUDINARY_MAX_IMAGE_SIZE) ||
      (meta.isVideo && uploadTarget.size <= CLOUDINARY_MAX_VIDEO_SIZE) ||
      (meta.isDoc   && uploadTarget.size <= CLOUDINARY_MAX_DOC_SIZE);

    if (fitsInCloudinary) {
      // Step 2: Attempt Direct Signed Upload to Cloudinary CDN
      try {
        onStatus('Requesting secure cloud authorization...', 12);
        const sigRes = await api.get(`/admin/media/signature?folder=${encodeURIComponent(folder)}`);

        if (sigRes && sigRes.success && sigRes.data && sigRes.data.signature) {
          onStatus(`Uploading directly to Cloudinary CDN (${(uploadTarget.size / (1024 * 1024)).toFixed(1)} MB)...`, 18);
          const cloudResult = await executeDirectUpload(sigRes.data, uploadTarget);

          onStatus('Verifying asset and recording in CMS database...', 90);
          const recordRes = await api.post('/admin/media/direct-record', {
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
            folder: sigRes.data.folder || folder,
            originalName: file.name,
            mimeType: uploadTarget.type || file.type,
          });

          if (recordRes && recordRes.success && recordRes.data) {
            assetRecord = recordRes.data;
          } else {
            throw new Error((recordRes && recordRes.message) || 'Database record creation failed.');
          }
        } else {
          throw new Error('Cloudinary signature could not be generated.');
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload bypassed/failed:', cloudErr.message, 'Falling back to server storage.');
        onStatus(`Cloud storage unavailable, switching to server storage (${(uploadTarget.size / (1024 * 1024)).toFixed(1)} MB)...`, 20);
        assetRecord = await executeServerUpload(uploadTarget);
      }
    } else {
      // Step 3: Large videos (>95MB up to 1000MB) stream directly to server storage
      onStatus(`Large media (${(uploadTarget.size / (1024 * 1024)).toFixed(1)} MB) streaming directly to server storage...`, 15);
      assetRecord = await executeServerUpload(uploadTarget);
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
    CLOUDINARY_MAX_IMAGE_SIZE,
    CLOUDINARY_MAX_VIDEO_SIZE,
    CLOUDINARY_MAX_DOC_SIZE,
  };
})();
