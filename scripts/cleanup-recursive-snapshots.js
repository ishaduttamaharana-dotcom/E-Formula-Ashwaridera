const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const TeamPageContent = require('../models/TeamPageContent');
const TeamMember = require('../models/TeamMember');

const sanitizeMember = (raw) => {
  const clean = {
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    fullName: raw.fullName || '',
    position: raw.position || '',
    roleCategory: raw.roleCategory || '',
    department: (raw.department || 'mechanical').toLowerCase(),
    categories: raw.categories || [(raw.department || 'mechanical').toLowerCase()],
    academicYear: raw.academicYear || '',
    academicBranch: raw.academicBranch || '',
    description: raw.description || '',
    email: raw.email || '',
    linkedin: raw.linkedin || '#',
    github: raw.github || '#',
    instagram: raw.instagram || '',
    otherSocial: raw.otherSocial || '',
    imageUrl: raw.imageUrl || '',
    imageAlt: raw.imageAlt || raw.fullName || '',
    order: raw.order !== undefined ? raw.order : (raw.displayOrder || 0),
    isFeatured: Boolean(raw.isFeatured),
    isVisible: raw.isVisible !== false,
    status: raw.status || 'published',
  };
  return clean;
};

const cleanup = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const members = await TeamMember.find();
  for (const m of members) {
    const clean = sanitizeMember(m.toObject());
    
    // Set clean top-level fields
    Object.assign(m, clean);
    
    // Set clean snapshots (NO RECURSION)
    m.draftVersion = { ...clean };
    m.publishedVersion = { ...clean };
    
    m.markModified('draftVersion');
    m.markModified('publishedVersion');
    await m.save();
    console.log(`Cleaned ${m.fullName}: size now ${JSON.stringify(m.toObject()).length} bytes`);
  }

  // Also clean TeamPageContent
  const doc = await TeamPageContent.findOne();
  if (doc) {
    const raw = doc.toObject();
    const cleanDoc = {
      settings: raw.settings || {},
      hero: raw.hero || {},
      membersSection: raw.membersSection || {},
      filters: raw.filters || [],
      cta: raw.cta || {},
      status: raw.status || 'published',
      version: raw.version || 1,
      lastPublishedAt: raw.lastPublishedAt || new Date(),
      lastEditedAt: raw.lastEditedAt || new Date(),
    };
    doc.draftVersion = JSON.parse(JSON.stringify(cleanDoc));
    doc.publishedVersion = JSON.parse(JSON.stringify(cleanDoc));
    doc.markModified('draftVersion');
    doc.markModified('publishedVersion');
    await doc.save();
    console.log('Cleaned TeamPageContent');
  }

  await mongoose.disconnect();
  console.log('Finished cleanup successfully!');
};

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
