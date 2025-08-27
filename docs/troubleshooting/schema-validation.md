# Schema Validation Troubleshooting Guide

**Epic**: schema_documentation_completion_epic  
**Task**: schema_documentation_task5  
**Last Updated**: 2025-01-26

This guide provides comprehensive troubleshooting for common schema validation issues in the CityPee project.

## Quick Diagnostics

### Check Schema Health
```bash
# Run comprehensive schema integrity check
npm run validate:integrity

# Test schema performance
npm run validate:schemas

# Validate data against schemas
npm run validate:data
```

### CI Validation Check
```bash
# Run same validations as CI
npm run validate:schemas:ci
npm run validate:data:ci
```

## Common Issues and Solutions

### 1. Schema Compilation Errors

#### **Symptom**: `Failed to load schema` or `Schema compilation failed`
```
❌ geoJsonToilet.schema.json - SyntaxError: Unexpected token
```

**Causes**:
- Invalid JSON syntax in schema file
- Missing required schema properties
- Malformed schema structure

**Solutions**:
```bash
# 1. Check JSON syntax
npm run validate:integrity

# 2. Validate JSON manually
node -e "JSON.parse(require('fs').readFileSync('schemas/schema-name.json', 'utf8'))"

# 3. Common fixes:
# - Remove trailing commas
# - Escape quotes in strings  
# - Check bracket/brace matching
# - Ensure all string values are quoted
```

**Example Fix**:
```json
// ❌ Invalid
{
  "type": "object",
  "properties": {
    "name": "string",  // <- trailing comma
  }
}

// ✅ Valid  
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  }
}
```

### 2. Performance Issues

#### **Symptom**: `Schema validation exceeded 2ms target`
```
⚠️ geoJsonToilet.schema.json - slow compilation: 15.32ms avg
```

**Causes**:
- Complex nested schemas
- Large enum arrays
- Circular references
- Missing schema caching

**Solutions**:
```bash
# 1. Benchmark specific schema
npm run validate:schemas

# 2. Check cache utilization
node -e "
const { getSchemaCacheStats } = require('./src/lib/validation/schemas');
console.log(getSchemaCacheStats());
"

# 3. Performance optimization techniques:
# - Split complex schemas into smaller parts
# - Use schema references ($ref) for reused definitions
# - Limit enum array sizes
# - Enable schema caching in production
```

**Example Optimization**:
```json
// ❌ Slow - inline complex objects
{
  "type": "object", 
  "properties": {
    "geometry": {
      "type": "object",
      "properties": {
        "type": { "enum": ["Point", "LineString", "Polygon"] },
        "coordinates": { "type": "array" }
      }
    }
  }
}

// ✅ Fast - use $ref for reused definitions
{
  "type": "object",
  "properties": {
    "geometry": { "$ref": "#/definitions/Geometry" }
  },
  "definitions": {
    "Geometry": {
      "type": "object",
      "properties": {
        "type": { "enum": ["Point", "LineString", "Polygon"] },
        "coordinates": { "type": "array" }
      }
    }
  }
}
```

### 3. Data Validation Failures

#### **Symptom**: Data fails schema validation
```
❌ /features/0/properties/lat: must be number
❌ /geometry/coordinates: must be array
```

**Causes**:
- Data structure doesn't match schema
- Type mismatches (string vs number)
- Missing required properties
- Invalid enum values

**Solutions**:
```bash
# 1. Validate specific data file
node -e "
const { validateGeoJsonToilet } = require('./src/lib/validation/schemas');
const data = require('./data/toilets.geojson');
const result = validateGeoJsonToilet(data);
console.log(result.isValid ? '✅ Valid' : '❌ Invalid:', result.errors);
"

# 2. Check data structure
npm run validate:data

# 3. Common data fixes:
# - Ensure numeric values are numbers, not strings
# - Check required properties are present
# - Validate enum values against schema
# - Verify array structures match expected format
```

**Example Data Fix**:
```json
// ❌ Invalid data
{
  "type": "Feature",
  "geometry": {
    "type": "Point", 
    "coordinates": "[-0.1278, 51.5074]"  // <- string instead of array
  },
  "properties": {
    "lat": "51.5074"  // <- string instead of number
  }
}

// ✅ Valid data
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-0.1278, 51.5074]  // <- array of numbers
  },
  "properties": {
    "lat": 51.5074  // <- number
  }
}
```

### 4. CI Integration Issues

#### **Symptom**: CI pipeline fails on schema validation
```
Schema validation step failed with exit code 1
```

**Causes**:
- Schema files missing in CI environment
- NPM dependency issues
- Different Node.js versions
- Environment-specific performance issues

**Solutions**:
```bash
# 1. Check CI-specific validation
npm run validate:schemas:ci
npm run validate:data:ci

# 2. Verify schema files are committed
git status schemas/

# 3. Check NPM dependencies
npm ci
npm ls ajv ajv-formats

# 4. Test in CI-like environment
NODE_ENV=test npm run validate:integrity
```

### 5. Schema Cache Issues

#### **Symptom**: Inconsistent validation performance
```
First validation: 25ms
Second validation: 1ms
```

**Causes**:
- Cache not warming properly
- Memory pressure clearing cache
- Multiple AJV instances

**Solutions**:
```bash
# 1. Check cache statistics
node -e "
const { getSchemaCacheStats } = require('./src/lib/validation/schemas');
console.log('Cache stats:', getSchemaCacheStats());
"

# 2. Clear and rebuild cache
node -e "
const { clearSchemaCache } = require('./src/lib/validation/schemas');
clearSchemaCache();
console.log('Cache cleared');
"

# 3. Warm up cache
npm run validate:schemas
```

## Error Message Reference

### AJV Error Types

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `required` | Missing required property | Add missing property to data |
| `type` | Wrong data type | Convert to expected type (string→number, etc.) |
| `enum` | Invalid enum value | Use one of the allowed values |
| `format` | Invalid format (email, date, etc.) | Fix format or update schema |
| `minimum/maximum` | Number out of range | Adjust value to be within bounds |
| `minLength/maxLength` | String length invalid | Adjust string length |
| `pattern` | Regex pattern mismatch | Fix string to match pattern |

### Schema Path Interpretation

AJV error paths use JSON Pointer format:
- `/properties/lat` = root.properties.lat
- `/features/0/geometry` = root.features[0].geometry  
- `/definitions/Point/type` = root.definitions.Point.type

## Performance Monitoring

### Performance Targets
- **Schema Compilation**: < 5ms average
- **Schema Validation**: < 2ms per validation
- **Cache Hit Rate**: > 90% for repeated validations

### Monitoring Commands
```bash
# Continuous performance monitoring
npm run validate:schemas -- --watch

# Performance benchmarking
node -e "
const { benchmarkSchemaValidation } = require('./src/lib/validation/schemas');
const testData = { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } };
console.log(benchmarkSchemaValidation(testData, 'geoJsonToilet', 100));
"
```

## Best Practices

### Schema Development
1. **Start Simple**: Begin with basic schema, add complexity gradually
2. **Test Early**: Validate schemas against real data during development
3. **Performance First**: Monitor compilation times as schemas grow
4. **Use References**: Leverage `$ref` for reused schema components

### Data Integration
1. **Validate at Boundaries**: Schema validate all external data
2. **Error Handling**: Implement graceful degradation for validation failures
3. **Performance Monitoring**: Track validation performance in production
4. **Cache Management**: Ensure schema cache is properly utilized

### CI/CD Integration
1. **Fail Fast**: Make schema validation a required CI step
2. **Performance Gates**: Set performance thresholds in CI
3. **Clear Reporting**: Provide actionable error messages
4. **Rollback Plan**: Have strategy for schema validation failures

## Getting Help

### Debug Mode
```bash
# Enable verbose validation output
DEBUG=schema:* npm run validate:data

# Manual schema debugging
node -e "
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, verbose: true });
const schema = require('./schemas/geoJsonToilet.schema.json');
const validate = ajv.compile(schema);
const data = {}; // your test data
const valid = validate(data);
console.log('Valid:', valid);
console.log('Errors:', validate.errors);
"
```

### Support Resources
- **Schema Documentation**: See `schemas/` directory for schema definitions
- **Validation Utilities**: Check `src/lib/validation/schemas.ts` for validation functions
- **Test Examples**: Review `tests/schemas/` for validation test patterns
- **Performance Tests**: See `tests/performance/schema_validation_benchmark_test.js`

### Contact Points
- **Schema Issues**: Review with validation service team
- **Performance Issues**: Check with performance optimization team  
- **CI Issues**: Consult DevOps team for pipeline problems
- **Data Issues**: Coordinate with data ingestion team

---

**Note**: This guide covers common issues. For complex schema problems, consider consulting the JSON Schema specification at https://json-schema.org/understanding-json-schema/