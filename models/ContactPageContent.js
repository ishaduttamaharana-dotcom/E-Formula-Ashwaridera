// ============================================================
//  models/ContactPageContent.js
//  Mongoose Schema for Contact Page Control Center (singleton)
//  Controls:
//    01. HEADER / HERO (Settings, Hero headings, background image,
//        overlay, and telemetry statistics)
//    02. OPEN CHANNELS (Contact channels, status, actionable links,
//        and transmission form configuration)
//    03. FIND US (Map configuration, coordinates, and workshop info)
//    04. FOOTER (Shared reference)
//  Includes atomic Draft / Publish versioning snapshots.
// ============================================================

const mongoose = require('mongoose');

const contactPageContentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastPublishedAt: {
      type: Date,
      default: Date.now,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
    settings: {
      pageTitle: {
        type: String,
        default: 'Ashwa Riders — Contact / Race Control',
        trim: true,
      },
      seoTitle: {
        type: String,
        default: 'Contact & Race Control | Ashwa Riders Formula Student Electric',
        trim: true,
      },
      seoDescription: {
        type: String,
        default: 'Get in touch with Ashwa Riders Formula Student Electric team. Channels for sponsorship, recruitment, media, and workshop visits.',
        trim: true,
      },
      ogImageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784491291/IMG_0234_1_csal4p.jpg',
        trim: true,
      },
      canonicalUrl: {
        type: String,
        default: 'contact.html',
        trim: true,
      },
      visible: {
        type: Boolean,
        default: true,
      },
    },
    heroSection: {
      visible: {
        type: Boolean,
        default: true,
      },
      bgImageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784491291/IMG_0234_1_csal4p.jpg',
        trim: true,
      },
      overlayStrength: {
        type: Number,
        default: 0.72,
        min: 0,
        max: 1,
      },
      eyebrow: {
        type: String,
        default: 'RACE CONTROL — OPEN FREQUENCY',
        trim: true,
      },
      heading: {
        type: String,
        default: 'TALK TO ASHWA RIDERS',
        trim: true,
      },
      headingHighlight: {
        type: String,
        default: 'ASHWA RIDERS',
        trim: true,
      },
      description: {
        type: String,
        default: 'Sponsorship, recruitment, media, or just a question about the car — pick a channel below or send a transmission straight to the pit box.',
        trim: true,
      },
      stats: [
        {
          id: { type: String, required: true },
          value: { type: String, required: true, trim: true },
          label: { type: String, required: true, trim: true },
          order: { type: Number, default: 1 },
          enabled: { type: Boolean, default: true },
        },
      ],
    },
    channelsSection: {
      visible: {
        type: Boolean,
        default: true,
      },
      eyebrow: {
        type: String,
        default: 'OPEN CHANNELS',
        trim: true,
      },
      heading: {
        type: String,
        default: 'PICK A FREQUENCY',
        trim: true,
      },
      headingHighlight: {
        type: String,
        default: 'FREQUENCY',
        trim: true,
      },
      description: {
        type: String,
        default: 'Every channel is monitored by the team. Choose whichever gets to the right people fastest.',
        trim: true,
      },
      sideNote: {
        type: String,
        default: 'Message us through any channel — everything routes to the same pit box.',
        trim: true,
      },
      channels: [
        {
          id: { type: String, required: true },
          channelNumber: { type: String, default: '01', trim: true },
          type: {
            type: String,
            trim: true,
            default: 'EMAIL',
          },
          name: { type: String, required: true, trim: true },
          secondaryValue: { type: String, default: '', trim: true },
          description: { type: String, default: '', trim: true },
          status: { type: String, default: 'MONITORED', trim: true },
          icon: { type: String, default: 'fas fa-envelope', trim: true },
          actionUrl: { type: String, default: '', trim: true },
          order: { type: Number, default: 1 },
          published: { type: Boolean, default: true },
        },
      ],
      formSettings: {
        eyebrow: {
          type: String,
          default: 'TRANSMIT MESSAGE',
          trim: true,
        },
        frequencyLabel: {
          type: String,
          default: 'FREQ 88.6 MHz',
          trim: true,
        },
        title: {
          type: String,
          default: 'TRANSMIT MESSAGE',
          trim: true,
        },
        nameLabel: {
          type: String,
          default: 'CALLSIGN (NAME)',
          trim: true,
        },
        namePlaceholder: {
          type: String,
          default: 'Your full name',
          trim: true,
        },
        emailLabel: {
          type: String,
          default: 'RETURN FREQUENCY (EMAIL)',
          trim: true,
        },
        emailPlaceholder: {
          type: String,
          default: 'you@example.com',
          trim: true,
        },
        channelLabel: {
          type: String,
          default: 'CHANNEL',
          trim: true,
        },
        channelPlaceholder: {
          type: String,
          default: 'Select a subject...',
          trim: true,
        },
        channelOptions: [
          {
            id: { type: String, required: true },
            label: { type: String, required: true, trim: true },
            value: { type: String, required: true, trim: true },
            enabled: { type: Boolean, default: true },
            order: { type: Number, default: 1 },
          },
        ],
        messageLabel: {
          type: String,
          default: 'MESSAGE',
          trim: true,
        },
        messagePlaceholder: {
          type: String,
          default: 'Tell us how we can help...',
          trim: true,
        },
        submitButtonText: {
          type: String,
          default: 'TRANSMIT MESSAGE',
          trim: true,
        },
        footnote: {
          type: String,
          default: 'All transmissions received within 24 hours, Mon–Sat',
          trim: true,
        },
        successMessage: {
          type: String,
          default: 'Message received — pit box will reply within 24 hours.',
          trim: true,
        },
        errorMessage: {
          type: String,
          default: 'Transmission failed. Please verify your details or use direct frequency.',
          trim: true,
        },
      },
    },
    findUsSection: {
      visible: {
        type: Boolean,
        default: true,
      },
      eyebrow: {
        type: String,
        default: 'FIND US',
        trim: true,
      },
      heading: {
        type: String,
        default: 'THE PIT LANE',
        trim: true,
      },
      headingHighlight: {
        type: String,
        default: 'PIT LANE',
        trim: true,
      },
      description: {
        type: String,
        default: 'Our workshop at St. Vincent Pallotti College of Engineering & Technology, Nagpur, where our electric Formula car gets built, tested, and race-prepped.',
        trim: true,
      },
      map: {
        provider: {
          type: String,
          default: 'google_embed',
          trim: true,
        },
        embedUrl: {
          type: String,
          default: 'https://www.google.com/maps?q=St.+Vincent+Pallotti+College+of+Engineering+and+Technology,+Gavsi+Manapur,+Wardha+Road,+Nagpur,+Maharashtra+441108&output=embed',
          trim: true,
        },
        latitude: {
          type: String,
          default: '21.0047',
          trim: true,
        },
        longitude: {
          type: String,
          default: '79.0476',
          trim: true,
        },
        zoom: {
          type: Number,
          default: 15,
        },
        locationName: {
          type: String,
          default: 'E-FORMULA ASHWA RIDERS WORKSHOP',
          trim: true,
        },
      },
      workshop: {
        name: {
          type: String,
          default: 'E-FORMULA ASHWA RIDERS WORKSHOP',
          trim: true,
        },
        address: {
          type: String,
          default: 'Ashwa Riders Garage, SVPCET Campus, Wardha Road, Nagpur 441108',
          trim: true,
        },
        coordinates: {
          type: String,
          default: '21.0047°N / 79.0476°E',
          trim: true,
        },
        access: {
          type: String,
          default: 'By Appointment',
          trim: true,
        },
        hours: {
          type: String,
          default: 'Mon–Sat, 9:00 AM – 7:00 PM IST',
          trim: true,
        },
        visitorInstructions: {
          type: String,
          default: 'Coming to visit? Reach out on Channel 01 or 03 first so the team can walk you through the garage.',
          trim: true,
        },
      },
    },
    draftVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    collection: 'contact_page_contents',
    timestamps: true,
  }
);

const ContactPageContent = mongoose.model('ContactPageContent', contactPageContentSchema);

module.exports = ContactPageContent;
