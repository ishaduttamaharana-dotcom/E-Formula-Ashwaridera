// ============================================================
//  controllers/contentTypeController.js
//  Manages ContentType definitions (built-in and custom)
// ============================================================

const ContentType = require('../models/ContentType');

// Pre-seeded built-in system content types
const DEFAULT_CONTENT_TYPES = [
  {
    name: 'Hero Slides',
    singularName: 'Hero Slide',
    pluralName: 'Hero Slides',
    slug: 'hero_slide',
    icon: 'image',
    description: 'Main kinetic hero carousel slides and headlines',
    isSystem: true,
    sortOrder: 1,
    listColumns: ['title', 'status', 'featured', 'sortOrder', 'updatedAt'],
    fields: [
      { key: 'headline', label: 'Main Kinetic Headline', type: 'text', required: true, group: 'Content' },
      { key: 'subtitle', label: 'Subtitle / Tagline', type: 'text', group: 'Content' },
      { key: 'eyebrow', label: 'Eyebrow / Badge', type: 'text', group: 'Content' },
      { key: 'mediaType', label: 'Background Media Type', type: 'select', options: ['image', 'video'], defaultValue: 'image', group: 'Media' },
      { key: 'desktopMedia', label: 'Desktop Media URL', type: 'media', group: 'Media' },
      { key: 'mobileMedia', label: 'Mobile Image Override', type: 'media', group: 'Media' },
      { key: 'primaryCtaText', label: 'Primary Button Label', type: 'text', group: 'Buttons' },
      { key: 'primaryCtaUrl', label: 'Primary Button URL', type: 'text', group: 'Buttons' },
      { key: 'secondaryCtaText', label: 'Secondary Button Label', type: 'text', group: 'Buttons' },
      { key: 'secondaryCtaUrl', label: 'Secondary Button URL', type: 'text', group: 'Buttons' },
    ]
  },
  {
    name: 'Articles',
    singularName: 'Article',
    pluralName: 'Articles',
    slug: 'article',
    icon: 'newspaper',
    description: 'News articles, press releases, and blog posts',
    isSystem: true,
    sortOrder: 2,
    listColumns: ['title', 'category', 'status', 'publishedAt', 'updatedAt'],
    fields: [
      { key: 'title', label: 'Article Title', type: 'text', required: true, group: 'General' },
      { key: 'excerpt', label: 'Excerpt / Summary', type: 'textarea', group: 'General' },
      { key: 'author', label: 'Author Name', type: 'text', defaultValue: 'Ashwa Riders Team', group: 'General' },
      { key: 'category', label: 'Category', type: 'select', options: ['News', 'Events', 'Race Reports', 'Technical', 'General'], defaultValue: 'News', group: 'General' },
      { key: 'featuredImage', label: 'Featured Image', type: 'media', group: 'Media' },
      { key: 'content', label: 'Article Content (Rich Text)', type: 'rich_text', group: 'Content' },
    ]
  },
  {
    name: 'Gallery Items',
    singularName: 'Gallery Item',
    pluralName: 'Gallery Items',
    slug: 'gallery',
    icon: 'images',
    description: 'Photo and video gallery items and albums',
    isSystem: true,
    sortOrder: 3,
    listColumns: ['title', 'category', 'mediaType', 'status', 'updatedAt'],
    fields: [
      { key: 'title', label: 'Media Title', type: 'text', required: true, group: 'General' },
      { key: 'caption', label: 'Caption / Description', type: 'textarea', group: 'General' },
      { key: 'category', label: 'Gallery Category', type: 'select', options: ['Track', 'Workshop', 'Events', 'Car Detail', 'Team'], defaultValue: 'Track', group: 'General' },
      { key: 'mediaType', label: 'Media Type', type: 'select', options: ['image', 'video'], defaultValue: 'image', group: 'Media' },
      { key: 'mediaUrl', label: 'Media File', type: 'media', group: 'Media' },
      { key: 'galleryImages', label: 'Multi-Image Album', type: 'multi_image', group: 'Media' },
    ]
  },
  {
    name: 'Projects',
    singularName: 'Project',
    pluralName: 'Projects',
    slug: 'project',
    icon: 'rocket',
    description: 'Formula Student engineering projects and vehicle builds',
    isSystem: true,
    sortOrder: 4,
    listColumns: ['title', 'client', 'category', 'status', 'updatedAt'],
    fields: [
      { key: 'title', label: 'Project Name', type: 'text', required: true, group: 'General' },
      { key: 'client', label: 'Client / Competition', type: 'text', group: 'General' },
      { key: 'category', label: 'Category', type: 'select', options: ['Powertrain', 'Chassis', 'Aerodynamics', 'Electronics', 'Complete Vehicle'], defaultValue: 'Complete Vehicle', group: 'General' },
      { key: 'summary', label: 'Project Summary', type: 'textarea', group: 'General' },
      { key: 'coverImage', label: 'Cover Image', type: 'media', group: 'Media' },
      { key: 'projectUrl', label: 'External Project Link', type: 'text', group: 'Links' },
    ]
  },
  {
    name: 'Services',
    singularName: 'Service',
    pluralName: 'Services',
    slug: 'service',
    icon: 'wrench',
    description: 'Engineering and sponsorship service packages',
    isSystem: true,
    sortOrder: 5,
    listColumns: ['title', 'price', 'status', 'updatedAt'],
    fields: [
      { key: 'title', label: 'Service Name', type: 'text', required: true, group: 'General' },
      { key: 'shortDesc', label: 'Short Description', type: 'textarea', group: 'General' },
      { key: 'fullDesc', label: 'Full Description', type: 'rich_text', group: 'General' },
      { key: 'price', label: 'Pricing / Tier Label', type: 'text', group: 'General' },
      { key: 'icon', label: 'Icon Name', type: 'text', defaultValue: 'star', group: 'Design' },
      { key: 'image', label: 'Featured Image', type: 'media', group: 'Media' },
    ]
  },
  {
    name: 'Testimonials',
    singularName: 'Testimonial',
    pluralName: 'Testimonials',
    slug: 'testimonial',
    icon: 'quote-right',
    description: 'Sponsor and advisor feedback testimonials',
    isSystem: true,
    sortOrder: 6,
    listColumns: ['author', 'company', 'rating', 'status', 'updatedAt'],
    fields: [
      { key: 'author', label: 'Client / Sponsor Name', type: 'text', required: true, group: 'General' },
      { key: 'role', label: 'Position / Role', type: 'text', group: 'General' },
      { key: 'company', label: 'Company / Institution', type: 'text', group: 'General' },
      { key: 'quote', label: 'Testimonial Text', type: 'textarea', required: true, group: 'General' },
      { key: 'rating', label: 'Rating (1 to 5)', type: 'number', defaultValue: 5, group: 'General' },
      { key: 'avatar', label: 'Profile Photo', type: 'media', group: 'Media' },
    ]
  },
  {
    name: 'Team Members',
    singularName: 'Team Member',
    pluralName: 'Team Members',
    slug: 'team_member',
    icon: 'users',
    description: 'Team member profiles and department rosters',
    isSystem: true,
    sortOrder: 7,
    listColumns: ['title', 'role', 'department', 'status', 'sortOrder'],
    fields: [
      { key: 'title', label: 'Member Name', type: 'text', required: true, group: 'General' },
      { key: 'role', label: 'Team Role', type: 'text', required: true, group: 'General' },
      { key: 'department', label: 'Department', type: 'select', options: ['Leadership', 'Electrical', 'Mechanical', 'Powertrain', 'Autonomous', 'Corporate / Operations'], defaultValue: 'Mechanical', group: 'General' },
      { key: 'bio', label: 'Biography', type: 'textarea', group: 'General' },
      { key: 'photo', label: 'Member Photo', type: 'media', group: 'Media' },
      { key: 'email', label: 'Email Address', type: 'text', group: 'Contact' },
      { key: 'linkedin', label: 'LinkedIn Profile URL', type: 'text', group: 'Contact' },
    ]
  },
  {
    name: 'FAQs',
    singularName: 'FAQ',
    pluralName: 'FAQs',
    slug: 'faq',
    icon: 'question-circle',
    description: 'Frequently Asked Questions',
    isSystem: true,
    sortOrder: 8,
    listColumns: ['question', 'category', 'status', 'sortOrder'],
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true, group: 'General' },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true, group: 'General' },
      { key: 'category', label: 'Category', type: 'select', options: ['General', 'Sponsorship', 'Recruitment', 'Competition'], defaultValue: 'General', group: 'General' },
    ]
  },
  {
    name: 'Pages',
    singularName: 'Page',
    pluralName: 'Pages',
    slug: 'page',
    icon: 'file-alt',
    description: 'Custom site landing pages built with Visual Section Builder',
    isSystem: true,
    sortOrder: 9,
    listColumns: ['title', 'slug', 'status', 'updatedAt'],
    fields: [
      { key: 'title', label: 'Page Title', type: 'text', required: true, group: 'General' },
      { key: 'slug', label: 'Page URL Slug', type: 'text', required: true, group: 'General' },
      { key: 'subtitle', label: 'Header Subtitle', type: 'text', group: 'General' },
    ]
  },
  {
    name: 'Categories',
    singularName: 'Category',
    pluralName: 'Categories',
    slug: 'category',
    icon: 'tags',
    description: 'Taxonomy categories for organizing content',
    isSystem: true,
    sortOrder: 10,
    listColumns: ['title', 'slug', 'updatedAt'],
    fields: [
      { key: 'title', label: 'Category Name', type: 'text', required: true, group: 'General' },
      { key: 'slug', label: 'Category Slug', type: 'text', required: true, group: 'General' },
      { key: 'description', label: 'Description', type: 'textarea', group: 'General' },
    ]
  }
];

// Seed default content types on server initialization
exports.seedDefaultContentTypes = async () => {
  try {
    for (const typeData of DEFAULT_CONTENT_TYPES) {
      await ContentType.findOneAndUpdate(
        { slug: typeData.slug },
        { $setOnInsert: typeData },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error('Error seeding default content types:', err.message);
  }
};

// GET /api/v1/content-types — List all registered content types
exports.getContentTypes = async (req, res, next) => {
  try {
    const types = await ContentType.find().sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, count: types.length, data: types });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/content-types/:slug — Get content type details
exports.getContentTypeBySlug = async (req, res, next) => {
  try {
    const type = await ContentType.findOne({ slug: req.params.slug });
    if (!type) {
      return res.status(404).json({ success: false, message: `Content type '${req.params.slug}' not found.` });
    }
    res.json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/admin/content-types — Create custom content type
exports.createContentType = async (req, res, next) => {
  try {
    const { name, singularName, pluralName, slug, icon, description, fields, features } = req.body;
    
    if (!name || !singularName || !pluralName) {
      return res.status(400).json({ success: false, message: 'Name, singularName, and pluralName are required.' });
    }

    const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const existing = await ContentType.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: `Content type with slug '${cleanSlug}' already exists.` });
    }

    const contentType = await ContentType.create({
      name,
      singularName,
      pluralName,
      slug: cleanSlug,
      icon: icon || 'folder',
      description: description || '',
      isSystem: false,
      fields: fields || [],
      features: features || {},
    });

    res.status(201).json({ success: true, data: contentType, message: 'Custom content type created successfully.' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/admin/content-types/:slug — Update content type schema
exports.updateContentType = async (req, res, next) => {
  try {
    const contentType = await ContentType.findOne({ slug: req.params.slug });
    if (!contentType) {
      return res.status(404).json({ success: false, message: `Content type '${req.params.slug}' not found.` });
    }

    const allowedUpdates = ['name', 'singularName', 'pluralName', 'icon', 'description', 'fields', 'features', 'listColumns', 'sortOrder'];
    allowedUpdates.forEach(key => {
      if (req.body[key] !== undefined) contentType[key] = req.body[key];
    });

    await contentType.save();
    res.json({ success: true, data: contentType, message: 'Content type schema updated.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/admin/content-types/:slug — Delete custom content type
exports.deleteContentType = async (req, res, next) => {
  try {
    const contentType = await ContentType.findOne({ slug: req.params.slug });
    if (!contentType) {
      return res.status(404).json({ success: false, message: `Content type '${req.params.slug}' not found.` });
    }

    if (contentType.isSystem) {
      return res.status(403).json({ success: false, message: 'System content types cannot be deleted.' });
    }

    await contentType.deleteOne();
    res.json({ success: true, message: `Content type '${req.params.slug}' deleted.` });
  } catch (err) {
    next(err);
  }
};
