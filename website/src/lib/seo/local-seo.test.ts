import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GURGAON_ZONES,
  GURGAON_LOCATIONS,
  APPLIANCE_SERVICES,
  getLocationBySlug,
  getZoneById,
  getApplianceBySlug,
  getNearbyLocations,
  generateLocalSeoMeta,
  generateLocationFaqs,
} from './gurgaon-locations';

test('Gurgaon SEO Dataset Integrity', async (t) => {
  await t.test('All 9 zones are properly defined', () => {
    assert.equal(GURGAON_ZONES.length, 9);
    const zoneNumbers = GURGAON_ZONES.map((z) => z.zoneNumber);
    assert.deepEqual(zoneNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  await t.test('Exactly 188 unique locations are compiled', () => {
    assert.equal(GURGAON_LOCATIONS.length, 188);
    const slugs = new Set(GURGAON_LOCATIONS.map((l) => l.slug));
    assert.equal(slugs.size, 188, 'All 188 locations must have unique slugs');
  });

  await t.test('All 9 appliance services are defined with required attributes', () => {
    assert.equal(APPLIANCE_SERVICES.length, 9);
    APPLIANCE_SERVICES.forEach((service) => {
      assert.ok(service.id, 'Service must have an id');
      assert.ok(service.name, 'Service must have a name');
      assert.ok(service.slug, 'Service must have a slug');
      assert.ok(service.startingPrice > 0, 'Service startingPrice must be positive');
      assert.ok(service.warranty, 'Service must have warranty text');
      assert.ok(service.commonIssues.length >= 3, 'Must have at least 3 common issues');
      assert.ok(service.subServices.length >= 3, 'Must have at least 3 sub-services');
      assert.ok(service.faqTemplates.length >= 1, 'Must have FAQ templates');
    });
  });

  await t.test('Slug resolution works with aliases and direct slugs', () => {
    // Sector 23 with suffix
    const locWithSuffix = getLocationBySlug('sector-23-gurgaon');
    assert.ok(locWithSuffix);
    assert.equal(locWithSuffix.name, 'Sector 23');

    // Sector 23 bare alias
    const locWithAlias = getLocationBySlug('sector-23');
    assert.ok(locWithAlias);
    assert.equal(locWithAlias.slug, 'sector-23-gurgaon');

    // Palam Vihar
    const pv = getLocationBySlug('palam-vihar');
    assert.ok(pv);
    assert.equal(pv.zoneId, 'zone-1');

    // DLF Phase 1
    const dlf1 = getLocationBySlug('dlf-phase-1');
    assert.ok(dlf1);
    assert.equal(dlf1.zoneId, 'zone-3');
  });

  await t.test('Nearby locations cross-linking generates at least 3 items', () => {
    const loc = GURGAON_LOCATIONS[0];
    const nearby = getNearbyLocations(loc, 4);
    assert.ok(nearby.length >= 3);
    assert.ok(!nearby.some((n) => n.slug === loc.slug), 'Nearby should not include self');
  });

  await t.test('Metadata generator produces valid title, description, and canonical URL', () => {
    const loc = getLocationBySlug('sector-23-gurgaon')!;
    const meta = generateLocalSeoMeta({ location: loc, path: `/service-areas/${loc.slug}` });
    assert.ok(meta.title.includes('Sector 23, Gurgaon'));
    assert.ok(meta.description.includes('Sector 23, Gurgaon'));
    assert.ok(meta.canonicalUrl.includes('/service-areas/sector-23-gurgaon'));
  });

  await t.test('Service + Location Metadata generator produces high-intent targeted tags', () => {
    const loc = getLocationBySlug('palam-vihar')!;
    const app = getApplianceBySlug('ac-repair')!;
    const meta = generateLocalSeoMeta({ location: loc, appliance: app, path: `/service-areas/${loc.slug}/${app.slug}` });
    assert.ok(meta.title.includes('AC Repair'));
    assert.ok(meta.title.includes('Palam Vihar, Gurgaon'));
    assert.ok(meta.description.includes('₹199'));
    assert.ok(meta.canonicalUrl.includes('/service-areas/palam-vihar/ac-repair'));
  });

  await t.test('FAQ generator interpolates location name dynamically', () => {
    const loc = getLocationBySlug('dlf-phase-5')!;
    const faqs = generateLocationFaqs(loc);
    assert.ok(faqs.length >= 3);
    faqs.forEach((faq) => {
      assert.ok(faq.q.includes('DLF Phase 5') || faq.a.includes('DLF Phase 5'));
    });
  });
});
