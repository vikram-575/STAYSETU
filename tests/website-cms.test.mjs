import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_WEBSITE_CONTENT } from '../src/lib/website-content.ts'

describe('Website CMS & Live Content Management', () => {
  it('should have all 8 top-level sections configured in default content', () => {
    assert.ok(DEFAULT_WEBSITE_CONTENT.announcement, 'Announcement bar must be present')
    assert.ok(DEFAULT_WEBSITE_CONTENT.hero, 'Hero section must be present')
    assert.ok(DEFAULT_WEBSITE_CONTENT.trust, 'Trust section must be present')
    assert.ok(DEFAULT_WEBSITE_CONTENT.cities, 'Popular cities must be present')
    assert.ok(DEFAULT_WEBSITE_CONTENT.whyChooseUs, 'Why Choose Us must be present')
    assert.ok(DEFAULT_WEBSITE_CONTENT.ownerCta, 'Owner CTA must be present')
    assert.ok(DEFAULT_WEBSITE_CONTENT.softwarePage, 'Software page must be present')
    assert.ok(DEFAULT_WEBSITE_CONTENT.footer, 'Footer must be present')
  })

  it('should have valid announcement bar configuration', () => {
    const ann = DEFAULT_WEBSITE_CONTENT.announcement
    assert.equal(typeof ann.enabled, 'boolean')
    assert.ok(ann.text.length > 0)
    assert.ok(ann.linkUrl.length > 0)
  })

  it('should have complete Hero section with 4 stats and quick chips', () => {
    const hero = DEFAULT_WEBSITE_CONTENT.hero
    assert.ok(hero.headline.length > 0)
    assert.ok(hero.highlightText.length > 0)
    assert.ok(hero.subtitle.length > 0)
    assert.equal(hero.stats.length, 4, 'Hero should provide 4 primary trust stat counters')
    assert.ok(hero.quickChips.length >= 5, 'Hero should provide quick search filter chips')
  })

  it('should have 4 Trust & Value Pillars with verified copy', () => {
    const trust = DEFAULT_WEBSITE_CONTENT.trust
    assert.equal(trust.cards.length, 4, 'Must have 4 value pillar cards')
    trust.cards.forEach((card) => {
      assert.ok(card.title.length > 0)
      assert.ok(card.description.length > 0)
      assert.ok(card.badge.length > 0)
    })
  })

  it('should have popular cities with valid prices and localities', () => {
    const cities = DEFAULT_WEBSITE_CONTENT.cities.cities
    assert.ok(cities.length >= 5, 'Should support at least 5 top metro cities')
    cities.forEach((c) => {
      assert.ok(c.name.length > 0)
      assert.ok(c.startingPrice > 0)
      assert.ok(c.listingCount > 0)
      assert.ok(c.image.startsWith('http'))
    })
  })

  it('should have comparison table rows with broker vs PGSetu contrasts', () => {
    const comp = DEFAULT_WEBSITE_CONTENT.whyChooseUs
    assert.ok(comp.rows.length >= 4)
    comp.rows.forEach((row) => {
      assert.ok(row.feature.length > 0)
      assert.ok(row.traditional.length > 0)
      assert.ok(row.pgSetu.length > 0)
    })
    assert.equal(comp.stats.length, 4)
  })

  it('should have complete Owner CTA banner configuration', () => {
    const cta = DEFAULT_WEBSITE_CONTENT.ownerCta
    assert.ok(cta.title.length > 0)
    assert.ok(cta.bulletPoints.length >= 3)
    assert.ok(cta.primaryBtnText.length > 0)
    assert.ok(cta.secondaryBtnLink.length > 0)
  })

  it('should have ERP software page modules, pricing tiers, FAQs, and testimonials', () => {
    const sw = DEFAULT_WEBSITE_CONTENT.softwarePage
    assert.ok(sw.modules.length >= 6, 'Must include key ERP modules (billing, electricity, etc.)')
    assert.equal(sw.pricingTiers.length, 3, 'Must include Starter, Growth, and Enterprise pricing')
    assert.ok(sw.faqs.length >= 4, 'Must include FAQs')
    assert.ok(sw.testimonials.length >= 2, 'Must include customer testimonials')
  })

  it('should have comprehensive footer contact details and social media links', () => {
    const footer = DEFAULT_WEBSITE_CONTENT.footer
    assert.ok(footer.phone.length > 0)
    assert.ok(footer.email.includes('@'))
    assert.ok(footer.address.length > 0)
    assert.ok(footer.copyrightText.includes('PGSetu'))
    assert.ok(footer.socialLinks.whatsapp?.length > 0)
  })
})
