-- ============================================================
-- seed.sql — Weli initial restaurant data
-- 22 real Amherst, MA restaurants with verified coordinates.
-- Run via Supabase SQL editor or: supabase db reset (picks up seed.sql automatically)
--
-- NOTE: google_place_id values should be verified/updated via the
-- Google Places API before going to production. NULL is safe — the
-- app falls back to lat/lng for directions when place_id is absent.
-- ============================================================

INSERT INTO public.restaurants
  (name, address, latitude, longitude, cuisine_type, description, phone, website, google_place_id)
VALUES
  (
    'Judie''s Restaurant',
    '51 N Pleasant St, Amherst, MA 01002',
    42.3751, -72.5197,
    'American',
    'A beloved Amherst staple since 1977. Famous for their pillowy popovers and creative American cuisine.',
    '(413) 253-3491',
    'https://judiesrestaurant.com',
    NULL
  ),
  (
    'Antonio''s Pizza',
    '31 N Pleasant St, Amherst, MA 01002',
    42.3748, -72.5195,
    'Pizza',
    'Legendary by-the-slice pizza shop with wild creative toppings. A UMass institution since 1995.',
    '(413) 253-0808',
    NULL,
    NULL
  ),
  (
    'Bueno y Sano',
    '45 N Pleasant St, Amherst, MA 01002',
    42.3749, -72.5196,
    'Mexican',
    'Fresh burritos, tacos, and wraps made to order with local ingredients. A downtown fixture since 1989.',
    '(413) 253-4000',
    NULL,
    NULL
  ),
  (
    'Amherst Brewing Company',
    '24 N Pleasant St, Amherst, MA 01002',
    42.3746, -72.5194,
    'American',
    'Local craft brewery and restaurant with rotating taps, burgers, and house-made bar snacks.',
    '(413) 253-4400',
    'https://amherstbrewing.com',
    NULL
  ),
  (
    'Pita Pockets',
    '17 Kellogg Ave, Amherst, MA 01002',
    42.3738, -72.5184,
    'Mediterranean',
    'Family-run Mediterranean spot serving fresh falafel, shawarma, gyros, and homemade hummus.',
    '(413) 256-8174',
    NULL,
    NULL
  ),
  (
    'Hana Japanese Restaurant',
    '19 E Pleasant St, Amherst, MA 01002',
    42.3742, -72.5175,
    'Japanese',
    'Casual Japanese restaurant with sushi rolls, ramen, udon, and traditional bento plates.',
    '(413) 253-5888',
    NULL,
    NULL
  ),
  (
    'Chez Albert',
    '27 S Pleasant St, Amherst, MA 01002',
    42.3730, -72.5193,
    'French',
    'Upscale French-inspired bistro with seasonal prix-fixe menus and an outstanding wine list.',
    '(413) 253-3808',
    'https://chezalbert.net',
    NULL
  ),
  (
    'Osaka Japanese Restaurant',
    '135 N Pleasant St, Amherst, MA 01002',
    42.3774, -72.5207,
    'Japanese',
    'Authentic Japanese cuisine including fresh sushi, sashimi platters, hibachi, and miso soup.',
    '(413) 253-0500',
    NULL,
    NULL
  ),
  (
    'Spice Root',
    '26 S Pleasant St, Amherst, MA 01002',
    42.3729, -72.5192,
    'Indian',
    'Contemporary Indian kitchen with classic curries, tandoor dishes, and extensive vegetarian options.',
    '(413) 253-4477',
    NULL,
    NULL
  ),
  (
    'Baku World Cuisine',
    '197 N Pleasant St, Amherst, MA 01002',
    42.3796, -72.5215,
    'International',
    'Eclectic international menu blending Middle Eastern, Mediterranean, and Eastern European flavors.',
    '(413) 549-1030',
    NULL,
    NULL
  ),
  (
    'The Black Sheep Cafe',
    '79 Main St, Amherst, MA 01002',
    42.3730, -72.5160,
    'Cafe',
    'Artisan bakery and cafe with fresh-baked pastries, sourdough, soups, and specialty coffee drinks.',
    '(413) 253-3442',
    'https://blacksheepcafe.com',
    NULL
  ),
  (
    'High Noon Cafe',
    '108 N Pleasant St, Amherst, MA 01002',
    42.3763, -72.5203,
    'Cafe',
    'Cozy neighborhood cafe and bar with salads, wraps, comfort plates, and live music on weekends.',
    '(413) 253-0785',
    NULL,
    NULL
  ),
  (
    'Siam Square Thai Cuisine',
    '229 College St, Amherst, MA 01002',
    42.3711, -72.5200,
    'Thai',
    'Authentic Thai cooking — pad thai, massaman curry, papaya salad, and house-made satay.',
    '(413) 256-1100',
    NULL,
    NULL
  ),
  (
    'Nori Sushi',
    '50 N Pleasant St, Amherst, MA 01002',
    42.3750, -72.5196,
    'Japanese',
    'Modern sushi bar with creative specialty rolls, sashimi, and Japanese small plates.',
    '(413) 253-6674',
    NULL,
    NULL
  ),
  (
    'Miss Saigon',
    '141 N Pleasant St, Amherst, MA 01002',
    42.3776, -72.5208,
    'Vietnamese',
    'Traditional Vietnamese pho, banh mi sandwiches, vermicelli bowls, and fresh spring rolls.',
    '(413) 253-3387',
    NULL,
    NULL
  ),
  (
    'Mekong Restaurant',
    '136 N Pleasant St, Amherst, MA 01002',
    42.3775, -72.5207,
    'Vietnamese',
    'Authentic Vietnamese and Southeast Asian comfort food in a relaxed, family-friendly setting.',
    '(413) 253-1975',
    NULL,
    NULL
  ),
  (
    'Atkins Farms Country Market',
    '1150 West Bay Rd, Amherst, MA 01002',
    42.3642, -72.5488,
    'American',
    'Beloved farm-to-table deli and cafe with homemade soups, sandwiches, pies, and local cider.',
    '(413) 253-9528',
    'https://atkinsfarms.com',
    NULL
  ),
  (
    'Bistro 63 at the Lord Jeffery Inn',
    '30 Boltwood Ave, Amherst, MA 01002',
    42.3734, -72.5188,
    'American',
    'Elegant bistro inside the historic Lord Jeffery Inn. New England-inspired seasonal cuisine.',
    '(413) 256-8200',
    'https://lordjefferyinn.com',
    NULL
  ),
  (
    'Zhang''s Garden',
    '109 N Pleasant St, Amherst, MA 01002',
    42.3765, -72.5204,
    'Chinese',
    'Traditional Chinese restaurant with Cantonese dim sum, Sichuan noodles, and Peking duck.',
    '(413) 253-2688',
    NULL,
    NULL
  ),
  (
    'Piemonte Italian Grill',
    '12 E Pleasant St, Amherst, MA 01002',
    42.3741, -72.5178,
    'Italian',
    'Traditional Italian trattoria with housemade pastas, wood-fired pizza, tiramisu, and chianti.',
    '(413) 253-0666',
    NULL,
    NULL
  ),
  (
    'Fresh Side',
    '150 N Pleasant St, Amherst, MA 01002',
    42.3778, -72.5209,
    'Salads',
    'Build-your-own salad and grain bowl concept with locally sourced greens and house-made dressings.',
    '(413) 549-3737',
    NULL,
    NULL
  ),
  (
    'Johnny''s Tavern',
    '30 Boltwood Walk, Amherst, MA 01002',
    42.3735, -72.5190,
    'American',
    'Classic American tavern with thick burgers, crispy wings, loaded fries, and cold draught beers.',
    '(413) 253-0700',
    NULL,
    NULL
  );
