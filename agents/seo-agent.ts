#!/usr/bin/env node
/**
 * SEO Agent - Static Borough Page Generator
 * 
 * @doc refs docs/architecture-spec.md#seo-agent
 * 
 * Generates static borough pages with SEO metadata, structured data,
 * and sitemap/robots.txt for improved search engine visibility.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ToiletFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    name: string;
    hours: string;
    accessible: boolean;
    fee: boolean | number;
    source: string;
    last_verified_at: string;
    verified_by: string;
    borough?: string;
  };
}

export interface ToiletCollection {
  type: 'FeatureCollection';
  features: ToiletFeature[];
  metadata: {
    generated_at: string;
    generated_by: string;
    source: string;
    count: number;
  };
}

export interface BoroughData {
  name: string;
  slug: string;
  toilets: ToiletFeature[];
  count: number;
}

export interface SEOConfig {
  inputFile: string;
  outputDirectory: string;
  publicDirectory: string;
  baseUrl: string;
  sitemapPath: string;
  robotsPath: string;
}

export interface TemplateConfig {
  baseUrl: string;
  brandName: string;
  dataSource: string;
  updateFrequency: string;
}

/**
 * Template for generating Next.js metadata
 */
export class MetadataTemplateBuilder {
  constructor(private config: TemplateConfig) {}

  build(borough: BoroughData): string {
    return `export const metadata: Metadata = {
  title: 'Public Toilets in ${borough.name}, London | ${this.config.brandName}',
  description: 'Find ${borough.count} public toilets in ${borough.name}, London. Free and accessible toilet locations with opening hours and accessibility information.',
  openGraph: {
    title: 'Public Toilets in ${borough.name}, London',
    description: 'Find ${borough.count} public toilets in ${borough.name}, London. Free and accessible toilet locations.',
    type: 'website',
    url: '${this.config.baseUrl}/borough/${borough.slug}',
  },
  twitter: {
    card: 'summary',
    title: 'Public Toilets in ${borough.name}, London',
    description: 'Find ${borough.count} public toilets in ${borough.name}, London.',
  },
};`;
  }
}

/**
 * Template for generating structured data (JSON-LD)
 */
export class StructuredDataTemplateBuilder {
  constructor(private config: TemplateConfig) {}

  build(borough: BoroughData): object {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": `Public Toilets in ${borough.name}, London`,
      "description": `Find ${borough.count} public toilets in ${borough.name}, London. Free and accessible toilet locations with opening hours.`,
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": borough.toilets.map((toilet, index) => ({
          "@type": "LocalBusiness",
          "name": toilet.properties.name,
          "description": "Public toilet facility",
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": toilet.geometry.coordinates[1],
            "longitude": toilet.geometry.coordinates[0]
          },
          "openingHours": toilet.properties.hours,
          "isAccessibleForFree": !toilet.properties.fee,
          "amenityFeature": toilet.properties.accessible ? [{"@type": "LocationFeatureSpecification", "name": "Wheelchair accessible"}] : [],
          "additionalType": "RestRoom"
        }))
      }
    };
  }
}

/**
 * Template for generating toilet list items
 */
export class ToiletListTemplateBuilder {
  private formatFeeText(fee: boolean | number): string {
    return fee ? 'Paid' : 'free';
  }

  private formatAccessibilityText(accessible: boolean): string {
    return accessible ? 'Wheelchair accessible' : 'Not wheelchair accessible';
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  build(toilets: ToiletFeature[]): string {
    return toilets.map(toilet => {
      const feeText = this.formatFeeText(toilet.properties.fee);
      const accessibleText = this.formatAccessibilityText(toilet.properties.accessible);
      const verifiedDate = this.formatDate(toilet.properties.last_verified_at);
      
      return `    <div className="toilet-item border p-4 rounded-lg">
      <h3 className="text-lg font-semibold">${toilet.properties.name}</h3>
      <p className="text-gray-600">Hours: ${toilet.properties.hours}</p>
      <p className="text-gray-600">${feeText} • ${accessibleText}</p>
      <p className="text-sm text-gray-500">Verified: ${verifiedDate}</p>
    </div>`;
    }).join('\n\n');
  }
}

/**
 * Template for generating navigation breadcrumbs
 */
export class BreadcrumbTemplateBuilder {
  build(borough: BoroughData): string {
    return `      <nav className="mb-6 text-sm">
        <a href="/" className="text-blue-600 hover:underline">Home</a>
        <span className="mx-2">›</span>
        <span className="text-gray-600">Borough</span>
        <span className="mx-2">›</span>
        <span className="font-semibold">${borough.name}</span>
      </nav>`;
  }
}

/**
 * Template for generating page content sections
 */
export class ContentSectionTemplateBuilder {
  constructor(private config: TemplateConfig) {}

  buildHeader(borough: BoroughData): string {
    return `      <h1 className="text-3xl font-bold mb-4">Public Toilets in ${borough.name}</h1>
      <p className="text-gray-600 mb-6">
        ${borough.count} public toilet${borough.count === 1 ? '' : 's'} found in ${borough.name}, London
      </p>`;
  }

  buildFooter(): string {
    return `      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">About This Data</h3>
        <p className="text-sm text-gray-600">
          This information is sourced from ${this.config.dataSource} and updated ${this.config.updateFrequency}. 
          Please verify opening hours and accessibility before visiting.
        </p>
      </div>`;
  }
}

/**
 * Main page template builder that orchestrates all components
 */
export class BoroughPageTemplateBuilder {
  private metadataBuilder: MetadataTemplateBuilder;
  private structuredDataBuilder: StructuredDataTemplateBuilder;
  private toiletListBuilder: ToiletListTemplateBuilder;
  private breadcrumbBuilder: BreadcrumbTemplateBuilder;
  private contentSectionBuilder: ContentSectionTemplateBuilder;

  constructor(config: TemplateConfig) {
    this.metadataBuilder = new MetadataTemplateBuilder(config);
    this.structuredDataBuilder = new StructuredDataTemplateBuilder(config);
    this.toiletListBuilder = new ToiletListTemplateBuilder();
    this.breadcrumbBuilder = new BreadcrumbTemplateBuilder();
    this.contentSectionBuilder = new ContentSectionTemplateBuilder(config);
  }

  build(borough: BoroughData): string {
    const metadata = this.metadataBuilder.build(borough);
    const structuredData = this.structuredDataBuilder.build(borough);
    const toiletsList = this.toiletListBuilder.build(borough.toilets);
    const breadcrumbs = this.breadcrumbBuilder.build(borough);
    const header = this.contentSectionBuilder.buildHeader(borough);
    const footer = this.contentSectionBuilder.buildFooter();

    return `import { Metadata } from 'next';

${metadata}

export default function ${borough.name.replace(/\s+/g, '')}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(${JSON.stringify(structuredData, null, 2)})
        }}
      />
      
${breadcrumbs}

${header}

      <h2 className="text-2xl font-semibold mb-4">Available Facilities</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
${toiletsList}
      </div>

${footer}
    </div>
  );
}`;
  }
}

/**
 * SEO Agent main class
 */
export class SEOAgent {
  private config: SEOConfig;
  private templateConfig: TemplateConfig;
  private pageTemplateBuilder: BoroughPageTemplateBuilder;

  constructor(config: Partial<SEOConfig> = {}) {
    this.config = {
      inputFile: config.inputFile || path.join(process.cwd(), 'data', 'toilets.geojson'),
      outputDirectory: config.outputDirectory || path.join(process.cwd(), 'src', 'app', 'borough'),
      publicDirectory: config.publicDirectory || path.join(process.cwd(), 'public'),
      baseUrl: config.baseUrl || process.env.BASE_URL || 'https://citypee.com',
      sitemapPath: config.sitemapPath || path.join(process.cwd(), 'public', 'sitemap.xml'),
      robotsPath: config.robotsPath || path.join(process.cwd(), 'public', 'robots.txt')
    };

    this.templateConfig = {
      baseUrl: this.config.baseUrl,
      brandName: 'CityPee',
      dataSource: 'OpenStreetMap',
      updateFrequency: 'regularly'
    };

    this.pageTemplateBuilder = new BoroughPageTemplateBuilder(this.templateConfig);
  }

  /**
   * Load and validate toilet data from GeoJSON file
   */
  private loadToiletData(): ToiletCollection {
    if (!fs.existsSync(this.config.inputFile)) {
      throw new Error('No toilet data found');
    }

    const fileContent = fs.readFileSync(this.config.inputFile, 'utf8');
    let data: any;
    
    try {
      data = JSON.parse(fileContent);
    } catch (error) {
      throw new Error('Invalid GeoJSON');
    }

    if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('Invalid GeoJSON');
    }

    return data as ToiletCollection;
  }

  /**
   * Extract borough from coordinates or properties
   */
  private extractBorough(toilet: ToiletFeature): string {
    // Use explicit borough property if available
    if (toilet.properties.borough) {
      return toilet.properties.borough.toLowerCase().replace(/\s+/g, '-');
    }

    // Fallback: simple coordinate-based borough detection for London
    const [lng, lat] = toilet.geometry.coordinates;
    
    // Very simplified borough detection based on coordinates
    // This is just for demo purposes - real implementation would use proper GIS
    if (lat > 51.52 && lng > -0.15 && lng < -0.12) return 'camden';
    if (lat > 51.495 && lat < 51.505 && lng > -0.135 && lng < -0.12) return 'westminster';
    if (lat > 51.5 && lng > -0.08) return 'tower-hamlets';
    
    return 'other';
  }

  /**
   * Group toilets by borough
   */
  private groupToiletsByBorough(toilets: ToiletFeature[]): BoroughData[] {
    const boroughMap = new Map<string, ToiletFeature[]>();

    toilets.forEach(toilet => {
      const borough = this.extractBorough(toilet);
      if (!boroughMap.has(borough)) {
        boroughMap.set(borough, []);
      }
      boroughMap.get(borough)!.push(toilet);
    });

    return Array.from(boroughMap.entries()).map(([slug, toilets]) => ({
      name: this.formatBoroughName(slug),
      slug,
      toilets,
      count: toilets.length
    }));
  }

  /**
   * Format borough slug to display name
   */
  private formatBoroughName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate Next.js page component for a borough using template system
   */
  private generateBoroughPageComponent(borough: BoroughData): string {
    return this.pageTemplateBuilder.build(borough);
  }

  /**
   * Generate sitemap.xml
   */
  private generateSitemap(boroughs: BoroughData[]): string {
    const urls = [
      `  <url>
    <loc>${this.config.baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
      ...boroughs.map(borough => `  <url>
    <loc>${this.config.baseUrl}/borough/${borough.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  }

  /**
   * Generate robots.txt
   */
  private generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

Sitemap: ${this.config.baseUrl}/sitemap.xml`;
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Update template configuration
   */
  public updateTemplateConfig(config: Partial<TemplateConfig>): void {
    this.templateConfig = { ...this.templateConfig, ...config };
    this.pageTemplateBuilder = new BoroughPageTemplateBuilder(this.templateConfig);
  }

  /**
   * Get current template configuration
   */
  public getTemplateConfig(): TemplateConfig {
    return { ...this.templateConfig };
  }

  /**
   * Main function to generate borough pages
   */
  async generateBoroughPages(): Promise<void> {
    // Load toilet data
    const toiletData = this.loadToiletData();
    
    // Group toilets by borough
    const boroughs = this.groupToiletsByBorough(toiletData.features);
    
    // Ensure output directories exist
    this.ensureDirectory(this.config.outputDirectory);
    this.ensureDirectory(this.config.publicDirectory);
    
    // Generate borough pages
    for (const borough of boroughs) {
      const boroughDir = path.join(this.config.outputDirectory, borough.slug);
      this.ensureDirectory(boroughDir);
      
      const pageContent = this.generateBoroughPageComponent(borough);
      const pageFile = path.join(boroughDir, 'page.tsx');
      
      fs.writeFileSync(pageFile, pageContent);
    }
    
    // Generate sitemap
    const sitemapContent = this.generateSitemap(boroughs);
    fs.writeFileSync(this.config.sitemapPath, sitemapContent);
    
    // Generate robots.txt
    const robotsContent = this.generateRobotsTxt();
    fs.writeFileSync(this.config.robotsPath, robotsContent);
  }
}

/**
 * Export for testing and CLI usage
 */
export const generateBoroughPages = async (): Promise<void> => {
  const agent = new SEOAgent();
  await agent.generateBoroughPages();
};

/**
 * CLI execution
 */
if (require.main === module) {
  generateBoroughPages()
    .then(() => {
      console.log('✅ SEO agent completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ SEO agent failed:', error.message);
      process.exit(1);
    });
}