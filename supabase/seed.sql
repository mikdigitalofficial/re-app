-- Replace this UUID with an existing auth.users.id from your Supabase project before running.
-- select id, email from auth.users;

do $$
declare
  demo_user uuid := '00000000-0000-0000-0000-000000000000';
begin
  insert into public.agents (user_id, name, role, phone, avatar, monthly_target) values
    (demo_user, 'Maya Khan', 'Off-plan Specialist', '+971501112233', 'MK', 6),
    (demo_user, 'Omar Faris', 'Luxury Broker', '+971502224455', 'OF', 5),
    (demo_user, 'Leena Shah', 'Investment Advisor', '+971503336677', 'LS', 7)
  on conflict do nothing;

  insert into public.leads (user_id, name, phone, email, nationality, budget, property_type, area_preference, source, status, assigned_agent, notes, last_contacted, hot_score, closings_value, campaign_name, ad_set, ad_name, platform, timeline, language, utm_source, synced_at, first_response_at, ad_spend) values
    (demo_user, 'Rashid Al Nuaimi', '+971551234567', 'rashid@example.com', 'UAE', 4200000, 'Villa', 'Dubai Hills Estate', 'Property Finder', 'Negotiation', 'Maya Khan', 'Cash buyer. Wants 4BR villa and family community.', '2026-04-25', 92, 165000, 'Dubai Hills Villa Buyers Q2', 'UAE Nationals High Intent', '4BR Family Villa Carousel', 'Property Finder CSV', '0-30 days', 'Arabic', 'property_finder', '2026-04-18 09:12:00+04', '2026-04-18 09:17:00+04', 1200),
    (demo_user, 'Elena Petrova', '+971589991010', 'elena@example.com', 'Russia', 1850000, 'Off-plan', 'Business Bay', 'Meta Ads', 'Viewing Booked', 'Leena Shah', 'Investor. Interested in payment plan and yield.', '2026-04-26', 78, null, 'Business Bay Off-plan Investors', 'Russian Investors', 'Payment Plan Lead Form', 'Facebook Instant Form', '30-60 days', 'English', 'facebook', '2026-04-22 14:22:00+04', '2026-04-22 14:27:00+04', 430),
    (demo_user, 'Amit Mehta', '+971526667788', 'amit@example.com', 'India', 950000, 'Apartment', 'JVC', 'Google Ads', 'Contacted', 'Omar Faris', 'First-time buyer. Needs mortgage estimate.', '2026-04-24', 57, null, 'JVC Ready Apartments Search', 'Mortgage Buyers', 'Ready Apartment Extension', 'Google Lead Form', '60-90 days', 'English', 'google', '2026-04-21 11:04:00+04', '2026-04-21 11:26:00+04', 310)
  on conflict do nothing;

  insert into public.campaign_performance (user_id, platform, source, campaign_name, ad_set, spend, leads, closed_won, revenue, reporting_date) values
    (demo_user, 'Property Finder CSV', 'Property Finder', 'Dubai Hills Villa Buyers Q2', 'UAE Nationals High Intent', 1200, 1, 1, 165000, '2026-04-26'),
    (demo_user, 'Facebook Instant Form', 'Meta Ads', 'Business Bay Off-plan Investors', 'Russian Investors', 430, 1, 0, 0, '2026-04-26'),
    (demo_user, 'Google Lead Form', 'Google Ads', 'JVC Ready Apartments Search', 'Mortgage Buyers', 310, 1, 0, 0, '2026-04-26')
  on conflict do nothing;

  insert into public.whatsapp_templates (user_id, name, body) values
    (demo_user, 'New inquiry', 'Hi {{name}}, thanks for your inquiry. I have noted your {{propertyType}} requirement in {{areaPreference}} with a budget of AED {{budget}}. I can send you the best matching options now.'),
    (demo_user, 'Viewing reminder', 'Hi {{name}}, quick reminder for your viewing. I will share the location and available timing. Please confirm if WhatsApp is the best way to coordinate.'),
    (demo_user, 'Price drop alert', 'Hi {{name}}, a strong option in {{areaPreference}} just had a price update. It fits your AED {{budget}} range and may move quickly. Shall I send details?'),
    (demo_user, 'Re-engagement', 'Hi {{name}}, checking in. Are you still exploring {{propertyType}} options in Dubai? I can send a fresh shortlist based on today''s market.')
  on conflict do nothing;

  insert into public.offplan_launches (user_id, project, developer, area, launch_date, starting_price, inventory, status) values
    (demo_user, 'Aurelia Residences', 'Emaar', 'Dubai Hills Estate', '2026-05-03', 1650000, '1-3BR Apartments', 'EOI Open'),
    (demo_user, 'Marina Crown Collection', 'Select Group', 'Dubai Marina', '2026-05-12', 2200000, '2BR, 3BR, Penthouses', 'Teaser'),
    (demo_user, 'Creek Horizon Villas', 'Sobha', 'Dubai Creek Harbour', '2026-04-20', 3900000, 'Townhouses, Villas', 'Launched')
  on conflict do nothing;
end $$;
