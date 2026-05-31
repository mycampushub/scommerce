import { Database } from 'bun:sqlite';

const db = new Database('db/custom.db');

try {
  // Check homepage_settings for brands section
  const brandSettings = db.query('SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1').get('brands');

  console.log('Brand settings:', JSON.stringify(brandSettings, null, 2));

  if (!brandSettings) {
    console.log('No brand settings found, creating default...');

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'brands-settings',
      'brands',
      1,
      5000,
      10,
      now,
      now
    );

    console.log('✓ Created brand settings');
  } else {
    console.log(`isEnabled: ${brandSettings.isEnabled}, autoPlay: ${brandSettings.autoPlay}`);
  }

  // Update to ensure brands section is enabled
  db.prepare('UPDATE homepage_settings SET isEnabled = 1 WHERE sectionName = ?').run('brands');

  console.log('✓ Updated brands section to enabled');

  // Verify all homepage sections
  const allSettings = db.query('SELECT sectionName, isEnabled FROM homepage_settings ORDER BY sectionName').all();

  console.log('\nAll homepage sections:');
  allSettings.forEach((s: any) => {
    const status = s.isEnabled ? '✓ Enabled' : '✗ Disabled';
    console.log(`  ${status}: ${s.sectionName}`);
  });

} catch (e: any) {
  console.error('Error:', e.message);
} finally {
  db.close();
}