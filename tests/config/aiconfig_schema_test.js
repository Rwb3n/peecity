const fs = require('fs');
const path = require('path');

describe('aiconfig.json schema', () => {
  const configPath = path.resolve(__dirname, '../../aiconfig.json');

  it('should exist', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('should contain required top-level keys', () => {
    if (!fs.existsSync(configPath)) {
      throw new Error('aiconfig.json does not exist');
    }
    const raw = fs.readFileSync(configPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
    const config = JSON.parse(raw);
    const requiredKeys = [
      'architecture',
      'tech_stack',
      'development_standards',
      'project_structure',
      'testing',
      'validated_patterns',
      'g'
    ];
    requiredKeys.forEach(key => {
      expect(config).toHaveProperty(key);
    });
    expect(typeof config.g).toBe('number');
    expect(config.g).toBeGreaterThanOrEqual(0);
  });

  it('should include EPIC task type in development standards', () => {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    
    expect(config.development_standards).toHaveProperty('task_types');
    expect(Array.isArray(config.development_standards.task_types)).toBe(true);
    expect(config.development_standards.task_types).toContain('EPIC');
    
    const expectedTaskTypes = [
      'TEST_CREATION',
      'IMPLEMENTATION', 
      'REFACTORING',
      'DIAGNOSTIC_TEST_CREATION',
      'EPIC'
    ];
    expectedTaskTypes.forEach(taskType => {
      expect(config.development_standards.task_types).toContain(taskType);
    });
  });

  it('should have epic management configuration in validated patterns', () => {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    
    expect(config.validated_patterns).toHaveProperty('epic_management');
    const epicConfig = config.validated_patterns.epic_management;
    
    expect(epicConfig).toHaveProperty('master_plan');
    expect(epicConfig).toHaveProperty('child_plan_pattern');
    expect(epicConfig).toHaveProperty('epic_task_type');
    expect(epicConfig).toHaveProperty('epic_fields');
    
    expect(epicConfig.epic_task_type).toBe('EPIC');
    expect(Array.isArray(epicConfig.epic_fields)).toBe(true);
    expect(epicConfig.epic_fields).toContain('plan_ref');
    expect(epicConfig.epic_fields).toContain('status');
  });
}); 