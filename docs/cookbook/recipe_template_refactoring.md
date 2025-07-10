---
id: recipe-template-refactoring
title: "Recipe: Template Refactoring"
description: "Template system refactoring patterns for modular and maintainable code architecture"
version: 1.0.0
last_updated: "2025-07-09"
category: cookbook
---
# Recipe: Template System Refactoring Pattern

**@doc refs docs/architecture-spec.md#seo-agent**

## Overview

This recipe demonstrates how to refactor large template generation methods into modular, reusable template builders following SOLID principles.

## Problem

Large template generation methods (200+ lines) that mix multiple concerns:
- Metadata generation
- Structured data creation  
- HTML template building
- Content formatting
- String concatenation

## Solution

Extract template generation into specialized builder classes using the Template Method pattern.

## Implementation Pattern

### 1. Define Template Configuration Interface

```typescript
export interface TemplateConfig {
  baseUrl: string;
  brandName: string;
  dataSource: string;
  updateFrequency: string;
}
```

### 2. Create Specialized Template Builders

```typescript
export class MetadataTemplateBuilder {
  constructor(private config: TemplateConfig) {}
  
  build(data: DataType): string {
    // Single responsibility: metadata generation
  }
}

export class StructuredDataTemplateBuilder {
  constructor(private config: TemplateConfig) {}
  
  build(data: DataType): object {
    // Single responsibility: JSON-LD structured data
  }
}

export class ContentTemplateBuilder {
  private formatters = {
    formatFeeText: (fee: boolean | number) => fee ? 'Paid' : 'free',
    formatDate: (date: string) => new Date(date).toLocaleDateString()
  };
  
  build(data: DataType): string {
    // Single responsibility: content formatting
  }
}
```

### 3. Create Orchestrating Template Builder

```typescript
export class MainTemplateBuilder {
  private metadataBuilder: MetadataTemplateBuilder;
  private structuredDataBuilder: StructuredDataTemplateBuilder;
  private contentBuilder: ContentTemplateBuilder;

  constructor(config: TemplateConfig) {
    this.metadataBuilder = new MetadataTemplateBuilder(config);
    this.structuredDataBuilder = new StructuredDataTemplateBuilder(config);
    this.contentBuilder = new ContentTemplateBuilder();
  }

  build(data: DataType): string {
    const metadata = this.metadataBuilder.build(data);
    const structuredData = this.structuredDataBuilder.build(data);
    const content = this.contentBuilder.build(data);
    
    return this.assembleTemplate(metadata, structuredData, content);
  }
}
```

### 4. Update Main Service Class

```typescript
export class ServiceClass {
  private templateBuilder: MainTemplateBuilder;

  constructor(config: ServiceConfig) {
    const templateConfig = this.createTemplateConfig(config);
    this.templateBuilder = new MainTemplateBuilder(templateConfig);
  }

  public updateTemplateConfig(config: Partial<TemplateConfig>): void {
    this.templateConfig = { ...this.templateConfig, ...config };
    this.templateBuilder = new MainTemplateBuilder(this.templateConfig);
  }

  private generateTemplate(data: DataType): string {
    return this.templateBuilder.build(data);
  }
}
```

## Benefits

1. **Single Responsibility**: Each builder has one concern
2. **Open/Closed**: Easy to extend with new template types
3. **Dependency Inversion**: Builders depend on abstractions
4. **Testability**: Each builder can be unit tested independently
5. **Maintainability**: Changes to one template don't affect others
6. **Reusability**: Template builders can be reused across services

## Testing Strategy

```typescript
describe('Template Builders', () => {
  const templateConfig = {
    baseUrl: 'https://example.com',
    brandName: 'TestApp',
    dataSource: 'TestSource',
    updateFrequency: 'daily'
  };

  describe('MetadataTemplateBuilder', () => {
    it('should generate correct metadata structure', () => {
      const builder = new MetadataTemplateBuilder(templateConfig);
      const result = builder.build(mockData);
      expect(result).toContain('TestApp');
      expect(result).toContain('https://example.com');
    });
  });

  describe('MainTemplateBuilder', () => {
    it('should orchestrate all builders correctly', () => {
      const builder = new MainTemplateBuilder(templateConfig);
      const result = builder.build(mockData);
      expect(result).toContain('metadata');
      expect(result).toContain('structured data');
      expect(result).toContain('content');
    });
  });
});
```

## When to Use

- Template generation methods exceed 100 lines
- Multiple template concerns mixed in single method
- Need for configurable template parts
- Template logic needs unit testing
- Multiple services need similar templates

## Anti-Patterns to Avoid

- Creating builders for simple single-line templates
- Over-engineering with excessive abstraction layers
- Breaking template cohesion across too many files
- Ignoring performance implications of object creation

## Validation

After refactoring:
1. All existing tests should continue to pass
2. Template output should be identical to pre-refactor
3. Code coverage should maintain or improve
4. Cyclomatic complexity should decrease
5. Class size should be reduced