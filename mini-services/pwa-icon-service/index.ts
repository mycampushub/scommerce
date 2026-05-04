import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PWA icon sizes required for different devices
const PWA_ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Modern fashion e-commerce logo prompt
const LOGO_PROMPT = 'Modern minimalist fashion e-commerce logo, shopping bag icon, elegant design, pink and white gradient, professional, clean lines, suitable for app icon, high quality';

const OUTPUT_DIR = path.join(__dirname, '../../public/icons');

class PWAIconGenerator {
  private zai: any = null;

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }

  async generateIcon(size: number, filename: string): Promise<string> {
    try {
      const sizeStr = `${size}x${size}`;
      console.log(`Generating ${filename} (${sizeStr})...`);

      const response = await this.zai.images.generations.create({
        prompt: LOGO_PROMPT,
        size: sizeStr as any,
      });

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      
      const outputPath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(outputPath, buffer);

      console.log(`✓ Generated ${filename} (${buffer.length} bytes)`);
      return outputPath;
    } catch (error: any) {
      console.error(`✗ Failed to generate ${filename}:`, error.message);
      throw error;
    }
  }

  async generateAllIcons(): Promise<void> {
    await this.initialize();
    
    console.log('Starting PWA icon generation...\n');
    console.log(`Output directory: ${OUTPUT_DIR}\n`);

    const results = [];
    for (const icon of PWA_ICON_SIZES) {
      try {
        const path = await this.generateIcon(icon.size, icon.name);
        results.push({ success: true, size: icon.size, path });
      } catch (error) {
        results.push({ success: false, size: icon.size, error: (error as Error).message });
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('PWA Icon Generation Summary:');
    console.log('='.repeat(50));
    
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;
    
    console.log(`Total: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed icons:');
      results.filter((r: any) => !r.success).forEach((r: any) => {
        console.log(`  - ${r.size}x${r.size}: ${r.error}`);
      });
    }

    console.log(`\nIcons saved to: ${OUTPUT_DIR}`);
  }
}

// Generate all icons when script is run
const generator = new PWAIconGenerator();
generator.generateAllIcons().catch(console.error);
