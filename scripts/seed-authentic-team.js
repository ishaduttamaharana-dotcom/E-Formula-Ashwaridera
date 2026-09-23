const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const TeamPageContent = require('../models/TeamPageContent');
const TeamMember = require('../models/TeamMember');

const seedAuthenticTeam = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Clean test copies / duplicates
  await TeamMember.deleteMany({ fullName: /Copy/i });
  await TeamMember.deleteMany({ _id: new mongoose.Types.ObjectId('6ab27ee63ee8f099c7f2befe') });

  // 2. Ensure authentic team members exist
  await TeamMember.updateOne(
    { fullName: 'Rohan Mehta' },
    {
      $set: {
        imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Team_Captain_jokdch.png',
        academicYear: 'Final Year',
        academicBranch: 'Mechanical Engineering',
        description: 'Leading the technical and strategic development of Ashwa Riders Formula Student Electric racing vehicle.',
        status: 'published',
        isVisible: true,
        order: 1
      }
    }
  );

  await TeamMember.updateOne(
    { fullName: 'Aarav Sharma' },
    {
      $set: {
        imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Vice_Captain_noclxg.png',
        academicYear: 'Third Year',
        academicBranch: 'Electrical Engineering',
        description: 'Overseeing powertrain integration, system telemetry, and project execution across engineering verticals.',
        status: 'published',
        isVisible: true,
        order: 2
      }
    }
  );

  await TeamMember.updateOne(
    { fullName: 'Vedant Ghodkande' },
    {
      $set: {
        imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Vice_Captain_noclxg.png',
        academicYear: 'Third Year',
        academicBranch: 'Electrical Engineering',
        description: 'Design and optimization of electric powertrain, motor controller calibration, and high-voltage safety.',
        status: 'published',
        isVisible: true,
        order: 3
      }
    }
  );

  await TeamMember.updateOne(
    { fullName: 'Dev Kulkarni' },
    {
      $set: {
        imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Team_Captain_jokdch.png',
        academicYear: 'Third Year',
        academicBranch: 'Electronics & Telecommunication',
        description: 'Lithium-ion battery pack architecture, BMS development, thermal management and tractive system safety.',
        status: 'published',
        isVisible: true,
        order: 4
      }
    }
  );

  // Mechanical Lead
  const mechExists = await TeamMember.findOne({ department: 'mechanical', isArchived: { $ne: true } });
  if (!mechExists) {
    await TeamMember.create({
      fullName: 'Aditya Verma',
      firstName: 'Aditya',
      lastName: 'Verma',
      position: 'Chassis & Suspension Lead',
      department: 'mechanical',
      categories: ['mechanical'],
      academicYear: 'Third Year',
      academicBranch: 'Mechanical Engineering',
      description: 'Chassis torsional rigidity optimization, double-wishbone suspension kinematics, and lightweight uprights design.',
      imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Team_Captain_jokdch.png',
      status: 'published',
      isVisible: true,
      order: 5
    });
  }

  // Management Lead
  const mgmtExists = await TeamMember.findOne({ department: 'management', isArchived: { $ne: true } });
  if (!mgmtExists) {
    await TeamMember.create({
      fullName: 'Ananya Deshmukh',
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      position: 'Operations & Sponsorship Lead',
      department: 'management',
      categories: ['management'],
      academicYear: 'Third Year',
      academicBranch: 'Computer Science & Engineering',
      description: 'Corporate partnerships, budget allocation, team logistics, media outreach, and Formula Bharat statutory compliance.',
      imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Vice_Captain_noclxg.png',
      status: 'published',
      isVisible: true,
      order: 6
    });
  }

  // Snapshot publishedVersion for all members
  const allMembers = await TeamMember.find();
  for (const m of allMembers) {
    m.publishedVersion = JSON.parse(JSON.stringify(m.toObject()));
    await m.save();
  }

  // 3. Restore TeamPageContent hero headline and config
  let doc = await TeamPageContent.findOne();
  if (doc) {
    doc.hero.headingLine1 = 'THE';
    doc.hero.headingHighlight = 'DRIVING FORCE';
    doc.hero.headingLine2 = 'BEHIND ASHWA RIDERS';
    doc.hero.eyebrow = 'FORMULA BHARAT — 2026 SEASON';
    doc.hero.description = 'A multidisciplinary team of engineers, designers, and innovators working together to build the future of motorsport.';
    doc.hero.desktopImageUrl = 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg';
    doc.hero.heroHeight = '55vh';
    doc.hero.overlayStrength = 70;
    doc.status = 'published';
    doc.lastPublishedAt = new Date();

    const snap = JSON.parse(JSON.stringify(doc.toObject()));
    doc.publishedVersion = snap;
    doc.draftVersion = snap;
    await doc.save();
    console.log('✅ TeamPageContent updated and published successfully.');
  }

  const finalMembers = await TeamMember.find({ isArchived: { $ne: true } }).sort({ order: 1 });
  console.log('Final active members count:', finalMembers.length);
  finalMembers.forEach(m => console.log(' -', m.fullName, '|', m.position, '|', m.department));

  await mongoose.disconnect();
  console.log('Done!');
};

seedAuthenticTeam().catch(err => {
  console.error(err);
  process.exit(1);
});
