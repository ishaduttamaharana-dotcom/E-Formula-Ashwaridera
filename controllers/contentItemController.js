// ============================================================
//  controllers/contentItemController.js
//  Universal Content Item Controller managing any ContentType
// ============================================================

const ContentItem = require('../models/ContentItem');
const ContentType = require('../models/ContentType');
const ContentRevision = require('../models/ContentRevision');
const ActivityLog = require('../models/ActivityLog');

// Helper to record activity logs
async function logActivity(req, action, resourceType, resourceId, details) {
  try {
    await ActivityLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'System Admin',
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

// GET /api/v1/content-items/:contentType — Public published content items
exports.getPublicContentItems = async (req, res, next) => {
  try {
    const { contentType } = req.params;
    const { category, tag, search, sort = 'sortOrder', order = 'asc', limit = 50, page = 1 } = req.query;

    const filter = { contentType, status: 'published', active: true };

    if (category) filter.categories = category;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'fields.headline': { $regex: search, $options: 'i' } },
        { 'fields.subtitle': { $regex: search, $options: 'i' } },
        { 'fields.excerpt': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const total = await ContentItem.countDocuments(filter);
    const items = await ContentItem.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Expose publishedVersion or fallback to active fields
    const data = items.map(item => {
      const pub = item.publishedVersion || item.toObject();
      return {
        _id: item._id,
        id: item._id,
        contentType: item.contentType,
        title: pub.title || item.title,
        slug: item.slug,
        featured: item.featured,
        sortOrder: item.sortOrder,
        fields: pub.fields || item.fields,
        sections: pub.sections || item.sections,
        media: pub.media || item.media,
        categories: item.categories,
        tags: item.tags,
        seo: pub.seo || item.seo,
        publishedAt: item.publishedAt || item.updatedAt,
      };
    });

    res.json({
      success: true,
      count: data.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit) || 1,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/content-items/:contentType — Admin list items with draft/publish status
exports.getAdminContentItems = async (req, res, next) => {
  try {
    const { contentType } = req.params;
    const { status, category, search, sort = 'sortOrder', order = 'asc', page = 1, limit = 20 } = req.query;

    const filter = { contentType };
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.categories = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'fields.headline': { $regex: search, $options: 'i' } },
        { 'fields.author': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const total = await ContentItem.countDocuments(filter);
    const items = await ContentItem.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: items.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit) || 1,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/content-items/:contentType/:id — Get single item by ID
exports.getContentItemById = async (req, res, next) => {
  try {
    const item = await ContentItem.findOne({ _id: req.params.id, contentType: req.params.contentType });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Content item not found.' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/admin/content-items/:contentType — Create new content item
exports.createContentItem = async (req, res, next) => {
  try {
    const { contentType } = req.params;
    const { title, slug, fields, sections, media, categories, tags, seo, featured, sortOrder, status = 'draft' } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Item title is required.' });
    }

    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const item = await ContentItem.create({
      contentType,
      title,
      slug: cleanSlug,
      status,
      featured: Boolean(featured),
      sortOrder: Number(sortOrder) || 0,
      fields: fields || {},
      sections: sections || [],
      media: media || [],
      categories: categories || [],
      tags: tags || [],
      seo: seo || {},
      lockVersion: 1,
      createdBy: req.user ? req.user.email : 'admin',
      updatedBy: req.user ? req.user.email : 'admin',
    });

    await logActivity(req, 'CREATE', contentType, item._id, `Created ${contentType}: "${title}"`);

    res.status(201).json({ success: true, data: item, message: 'Content item created.' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/admin/content-items/:contentType/:id — Save Draft or Publish item
exports.updateContentItem = async (req, res, next) => {
  try {
    const { contentType, id } = req.params;
    const { title, slug, fields, sections, media, categories, tags, seo, featured, sortOrder, status, lockVersion, publish } = req.body;

    const item = await ContentItem.findOne({ _id: id, contentType });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Content item not found.' });
    }

    // Optimistic Concurrency Control
    if (lockVersion !== undefined && item.lockVersion > lockVersion) {
      return res.status(409).json({
        success: false,
        message: 'Conflict Detected: This record has been updated by another user. Please refresh and re-apply changes.',
        currentVersion: item.lockVersion,
      });
    }

    if (title !== undefined) item.title = title;
    if (slug !== undefined) item.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (fields !== undefined) item.fields = fields;
    if (sections !== undefined) item.sections = sections;
    if (media !== undefined) item.media = media;
    if (categories !== undefined) item.categories = categories;
    if (tags !== undefined) item.tags = tags;
    if (seo !== undefined) item.seo = seo;
    if (featured !== undefined) item.featured = Boolean(featured);
    if (sortOrder !== undefined) item.sortOrder = Number(sortOrder);
    
    item.lockVersion += 1;
    item.updatedBy = req.user ? req.user.email : 'admin';

    // If explicit Publish action requested
    if (publish || status === 'published') {
      item.status = 'published';
      item.publishedAt = new Date();
      item.publishedVersion = {
        title: item.title,
        fields: item.fields,
        sections: item.sections,
        media: item.media,
        seo: item.seo,
      };

      // Create Content Revision snapshot
      if (req.user && req.user._id) {
        await ContentRevision.create({
          resourceId: String(item._id),
          resourceType: contentType,
          version: item.lockVersion,
          data: item.toObject(),
          author: req.user._id,
          authorName: req.user.name || 'System Admin',
          authorEmail: req.user.email || 'admin@ashwariders.com',
          action: 'PUBLISH',
          summary: `Published: "${item.title}"`,
        });
      }

      await logActivity(req, 'PUBLISH', contentType, item._id, `Published ${contentType}: "${item.title}"`);
    } else {
      if (status !== undefined) item.status = status;
      await logActivity(req, 'UPDATE', contentType, item._id, `Updated draft ${contentType}: "${item.title}"`);
    }

    await item.save();

    res.json({
      success: true,
      data: item,
      message: publish ? 'Content published successfully.' : 'Draft saved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/admin/content-items/:contentType/:id/duplicate — One-click item duplication
exports.duplicateContentItem = async (req, res, next) => {
  try {
    const { contentType, id } = req.params;
    const item = await ContentItem.findOne({ _id: id, contentType });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Original item not found.' });
    }

    const copyTitle = `${item.title} (Copy)`;
    const copySlug = `${item.slug || 'copy'}-copy-${Date.now().toString().slice(-4)}`;

    const duplicated = await ContentItem.create({
      contentType: item.contentType,
      title: copyTitle,
      slug: copySlug,
      status: 'draft',
      featured: item.featured,
      sortOrder: item.sortOrder + 1,
      fields: JSON.parse(JSON.stringify(item.fields || {})),
      sections: JSON.parse(JSON.stringify(item.sections || [])),
      media: JSON.parse(JSON.stringify(item.media || [])),
      categories: [...(item.categories || [])],
      tags: [...(item.tags || [])],
      seo: JSON.parse(JSON.stringify(item.seo || {})),
      lockVersion: 1,
      createdBy: req.user ? req.user.email : 'admin',
      updatedBy: req.user ? req.user.email : 'admin',
    });

    await logActivity(req, 'DUPLICATE', contentType, duplicated._id, `Duplicated from "${item.title}"`);

    res.status(201).json({ success: true, data: duplicated, message: 'Item duplicated successfully.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/admin/content-items/:contentType/:id — Delete item
exports.deleteContentItem = async (req, res, next) => {
  try {
    const { contentType, id } = req.params;
    const item = await ContentItem.findOneAndDelete({ _id: id, contentType });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Content item not found.' });
    }

    await logActivity(req, 'DELETE', contentType, id, `Deleted ${contentType}: "${item.title}"`);

    res.json({ success: true, message: 'Content item deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/admin/content-items/:contentType/bulk — Bulk action (publish, unpublish, delete)
exports.bulkContentItemAction = async (req, res, next) => {
  try {
    const { contentType } = req.params;
    const { ids, action } = req.body; // action: 'publish', 'unpublish', 'delete'

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid array of record IDs is required.' });
    }

    if (action === 'delete') {
      await ContentItem.deleteMany({ _id: { $in: ids }, contentType });
      await logActivity(req, 'BULK_DELETE', contentType, null, `Bulk deleted ${ids.length} items.`);
      return res.json({ success: true, message: `Successfully deleted ${ids.length} items.` });
    }

    if (action === 'publish') {
      const items = await ContentItem.find({ _id: { $in: ids }, contentType });
      for (const item of items) {
        item.status = 'published';
        item.publishedAt = new Date();
        item.publishedVersion = {
          title: item.title,
          fields: item.fields,
          sections: item.sections,
          media: item.media,
          seo: item.seo,
        };
        await item.save();
      }
      await logActivity(req, 'BULK_PUBLISH', contentType, null, `Bulk published ${ids.length} items.`);
      return res.json({ success: true, message: `Successfully published ${ids.length} items.` });
    }

    if (action === 'unpublish') {
      await ContentItem.updateMany({ _id: { $in: ids }, contentType }, { $set: { status: 'draft' } });
      await logActivity(req, 'BULK_UNPUBLISH', contentType, null, `Bulk unpublished ${ids.length} items.`);
      return res.json({ success: true, message: `Successfully unpublished ${ids.length} items.` });
    }

    res.status(400).json({ success: false, message: 'Invalid bulk action.' });
  } catch (err) {
    next(err);
  }
};
