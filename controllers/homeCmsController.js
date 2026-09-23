// ============================================================
//  controllers/homeCmsController.js
//  CMS Handlers for Home Page (index.html) sections:
//    1. Hero Section (HomeHero -> home_hero)
//    2. Garage To Grid Cards (GarageCard -> garage_cards)
//    3. What's Happening News Cards (HomeNews -> home_news)
//    4. Statistics Counters (HomeStat -> home_statistics)
//    5. Sponsors Preview (HomeSponsor -> home_sponsors)
// ============================================================

const HomeHero                           = require('../models/HomeHero');
const GarageCard                         = require('../models/GarageCard');
const HomeNews                           = require('../models/HomeNews');
const HomeStat                           = require('../models/HomeStat');
const HomeSponsor                        = require('../models/HomeSponsor');
const { uploadVideoToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { sendSuccess, sendError }          = require('../utils/responseHelper');

// ============================================================
//  1. HERO SECTION
// ============================================================

const getHero = async (req, res, next) => {
  try {
    let hero = await HomeHero.findOne();
    if (!hero) {
      // Seed default hero record if empty
      hero = await HomeHero.create({});
    }
    return sendSuccess(res, 200, 'Hero section content retrieved.', hero);
  } catch (error) {
    next(error);
  }
};

const updateHero = async (req, res, next) => {
  try {
    const { badgeText, heading, subtitle, videoUrl, publicId, primaryBtnText, primaryBtnLink, secondaryBtnText, secondaryBtnLink } = req.body;

    let hero = await HomeHero.findOne();
    if (!hero) {
      hero = new HomeHero({});
    }

    if (badgeText !== undefined)        hero.badgeText        = badgeText.trim();
    if (heading !== undefined)          hero.heading          = heading.trim();
    if (subtitle !== undefined)         hero.subtitle         = subtitle.trim();
    if (videoUrl !== undefined)         hero.videoUrl         = videoUrl.trim();
    if (publicId !== undefined)         hero.publicId         = publicId.trim();
    if (primaryBtnText !== undefined)   hero.primaryBtnText   = primaryBtnText.trim();
    if (primaryBtnLink !== undefined)   hero.primaryBtnLink   = primaryBtnLink.trim();
    if (secondaryBtnText !== undefined) hero.secondaryBtnText = secondaryBtnText.trim();
    if (secondaryBtnLink !== undefined) hero.secondaryBtnLink = secondaryBtnLink.trim();

    await hero.save();

    return sendSuccess(res, 200, 'Hero section updated successfully.', hero);
  } catch (error) {
    next(error);
  }
};

const uploadHeroVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please select a video file to upload.');
    }

    const result = await uploadVideoToCloudinary(req.file.buffer, 'ashwa_hero_videos');

    return sendSuccess(res, 200, 'Video uploaded successfully to Cloudinary.', {
      videoUrl: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    return sendError(res, 500, `Video upload failed: ${error.message}`);
  }
};

// ============================================================
//  2. GARAGE TO GRID CARDS
// ============================================================

const getGarageCards = async (req, res, next) => {
  try {
    let cards = await GarageCard.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Garage cards retrieved.', cards);
  } catch (error) {
    next(error);
  }
};

const createGarageCard = async (req, res, next) => {
  try {
    const { title, description, imageUrl, publicId, buttonText, buttonLink, icon, order } = req.body;

    if (!title) {
      return sendError(res, 400, 'Card title is required.');
    }

    const card = await GarageCard.create({
      title:       title.trim(),
      description: description ? description.trim() : '',
      imageUrl:    imageUrl ? imageUrl.trim() : '',
      publicId:    publicId ? publicId.trim() : '',
      buttonText:  buttonText ? buttonText.trim() : '',
      buttonLink:  buttonLink ? buttonLink.trim() : '',
      icon:        icon || 'fas fa-wrench',
      order:       order !== undefined ? Number(order) : 0,
    });

    return sendSuccess(res, 201, 'Garage card created successfully.', card);
  } catch (error) {
    next(error);
  }
};

const updateGarageCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, publicId, buttonText, buttonLink, icon, order, isActive } = req.body;

    const updates = {};
    if (title !== undefined)       updates.title       = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (imageUrl !== undefined)    updates.imageUrl    = imageUrl.trim();
    if (publicId !== undefined)    updates.publicId    = publicId.trim();
    if (buttonText !== undefined)  updates.buttonText  = buttonText.trim();
    if (buttonLink !== undefined)  updates.buttonLink  = buttonLink.trim();
    if (icon !== undefined)        updates.icon        = icon.trim();
    if (order !== undefined)       updates.order       = Number(order);
    if (isActive !== undefined)    updates.isActive    = Boolean(isActive);

    const card = await GarageCard.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!card) return sendError(res, 404, 'Garage card not found.');

    return sendSuccess(res, 200, 'Garage card updated successfully.', card);
  } catch (error) {
    next(error);
  }
};

const deleteGarageCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const card = await GarageCard.findById(id);
    if (!card) return sendError(res, 404, 'Garage card not found.');

    if (card.publicId) {
      await deleteFromCloudinary(card.publicId);
    }
    await card.deleteOne();

    return sendSuccess(res, 200, 'Garage card deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  3. WHAT'S HAPPENING NEWS CARDS
// ============================================================

const getNews = async (req, res, next) => {
  try {
    const news = await HomeNews.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Home news articles retrieved.', news);
  } catch (error) {
    next(error);
  }
};

const createNewsCard = async (req, res, next) => {
  try {
    const { title, description, date, category, icon, imageUrl, publicId, buttonText, buttonLink, order } = req.body;

    if (!title) return sendError(res, 400, 'News title is required.');

    const article = await HomeNews.create({
      title:       title.trim(),
      description: description ? description.trim() : '',
      date:        date ? date.trim() : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      category:    category ? category.trim() : 'News',
      icon:        icon || 'fas fa-newspaper',
      imageUrl:    imageUrl ? imageUrl.trim() : '',
      publicId:    publicId ? publicId.trim() : '',
      buttonText:  buttonText ? buttonText.trim() : 'Read Article',
      buttonLink:  buttonLink ? buttonLink.trim() : 'blog.html',
      order:       order !== undefined ? Number(order) : 0,
    });

    return sendSuccess(res, 201, 'News article created successfully.', article);
  } catch (error) {
    next(error);
  }
};

const updateNewsCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, date, category, icon, imageUrl, publicId, buttonText, buttonLink, order, isActive } = req.body;

    const updates = {};
    if (title !== undefined)       updates.title       = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (date !== undefined)        updates.date        = date.trim();
    if (category !== undefined)    updates.category    = category.trim();
    if (icon !== undefined)        updates.icon        = icon.trim();
    if (imageUrl !== undefined)    updates.imageUrl    = imageUrl.trim();
    if (publicId !== undefined)    updates.publicId    = publicId.trim();
    if (buttonText !== undefined)  updates.buttonText  = buttonText.trim();
    if (buttonLink !== undefined)  updates.buttonLink  = buttonLink.trim();
    if (order !== undefined)       updates.order       = Number(order);
    if (isActive !== undefined)    updates.isActive    = Boolean(isActive);

    const article = await HomeNews.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!article) return sendError(res, 404, 'News article not found.');

    return sendSuccess(res, 200, 'News article updated successfully.', article);
  } catch (error) {
    next(error);
  }
};

const deleteNewsCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await HomeNews.findById(id);
    if (!article) return sendError(res, 404, 'News article not found.');

    if (article.publicId) {
      await deleteFromCloudinary(article.publicId);
    }
    await article.deleteOne();

    return sendSuccess(res, 200, 'News article deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  4. STATISTICS COUNTER STRIP
// ============================================================

const getStats = async (req, res, next) => {
  try {
    const stats = await HomeStat.find().sort({ order: 1 });
    return sendSuccess(res, 200, 'Home statistics retrieved.', stats);
  } catch (error) {
    next(error);
  }
};

const createStat = async (req, res, next) => {
  try {
    const { label, value, icon, order } = req.body;
    if (!label || value === undefined) return sendError(res, 400, 'Stat label and value are required.');

    const stat = await HomeStat.create({
      label: label.trim(),
      value: String(value).trim(),
      icon:  icon || 'fas fa-chart-bar',
      order: order !== undefined ? Number(order) : 0,
    });

    return sendSuccess(res, 201, 'Stat created successfully.', stat);
  } catch (error) {
    next(error);
  }
};

const updateStat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, value, icon, order } = req.body;

    const updates = {};
    if (label !== undefined) updates.label = label.trim();
    if (value !== undefined) updates.value = String(value).trim();
    if (icon !== undefined)  updates.icon  = icon.trim();
    if (order !== undefined) updates.order = Number(order);

    const stat = await HomeStat.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!stat) return sendError(res, 404, 'Stat counter not found.');

    return sendSuccess(res, 200, 'Stat counter updated successfully.', stat);
  } catch (error) {
    next(error);
  }
};

const deleteStat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stat = await HomeStat.findByIdAndDelete(id);
    if (!stat) return sendError(res, 404, 'Stat counter not found.');
    return sendSuccess(res, 200, 'Stat counter deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  5. PARTNERS / SPONSORS PREVIEW
// ============================================================

const getSponsors = async (req, res, next) => {
  try {
    const sponsors = await HomeSponsor.find().sort({ tier: 1, order: 1 });
    return sendSuccess(res, 200, 'Home sponsors retrieved.', sponsors);
  } catch (error) {
    next(error);
  }
};

const createSponsor = async (req, res, next) => {
  try {
    const { name, tier, imageUrl, publicId, websiteLink, icon, order } = req.body;
    if (!name) return sendError(res, 400, 'Sponsor name is required.');

    const sponsor = await HomeSponsor.create({
      name:        name.trim(),
      tier:        tier || 'Gold',
      imageUrl:    imageUrl ? imageUrl.trim() : '',
      publicId:    publicId ? publicId.trim() : '',
      websiteLink: websiteLink ? websiteLink.trim() : '#',
      icon:        icon || 'fas fa-crown',
      order:       order !== undefined ? Number(order) : 0,
    });

    return sendSuccess(res, 201, 'Sponsor logo created successfully.', sponsor);
  } catch (error) {
    next(error);
  }
};

const updateSponsor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, tier, imageUrl, publicId, websiteLink, icon, order } = req.body;

    const updates = {};
    if (name !== undefined)        updates.name        = name.trim();
    if (tier !== undefined)        updates.tier        = tier;
    if (imageUrl !== undefined)    updates.imageUrl    = imageUrl.trim();
    if (publicId !== undefined)    updates.publicId    = publicId.trim();
    if (websiteLink !== undefined) updates.websiteLink = websiteLink.trim();
    if (icon !== undefined)        updates.icon        = icon.trim();
    if (order !== undefined)       updates.order       = Number(order);

    const sponsor = await HomeSponsor.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!sponsor) return sendError(res, 404, 'Sponsor logo not found.');

    return sendSuccess(res, 200, 'Sponsor logo updated successfully.', sponsor);
  } catch (error) {
    next(error);
  }
};

const deleteSponsor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sponsor = await HomeSponsor.findById(id);
    if (!sponsor) return sendError(res, 404, 'Sponsor logo not found.');

    if (sponsor.publicId) {
      await deleteFromCloudinary(sponsor.publicId);
    }
    await sponsor.deleteOne();

    return sendSuccess(res, 200, 'Sponsor logo deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Hero
  getHero,
  updateHero,
  uploadHeroVideo,
  // Garage
  getGarageCards,
  createGarageCard,
  updateGarageCard,
  deleteGarageCard,
  // News
  getNews,
  createNewsCard,
  updateNewsCard,
  deleteNewsCard,
  // Stats
  getStats,
  createStat,
  updateStat,
  deleteStat,
  // Sponsors
  getSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
};
