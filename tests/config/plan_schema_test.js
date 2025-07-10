const fs = require('fs');
const path = require('path');

describe('plan schema validation', () => {
  const plansDir = path.resolve(__dirname, '../../plans');
  
  it('should validate plan_0003.txt epic structure', () => {
    const planPath = path.join(plansDir, 'plan_0003.txt');
    expect(fs.existsSync(planPath)).toBe(true);
    
    const raw = fs.readFileSync(planPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
    
    const plan = JSON.parse(raw);
    expect(plan).toHaveProperty('id', '0003');
    expect(plan).toHaveProperty('goal');
    expect(plan).toHaveProperty('tasks');
    expect(Array.isArray(plan.tasks)).toBe(true);
    
    // Validate all tasks are EPIC type
    plan.tasks.forEach(task => {
      expect(task).toHaveProperty('type', 'EPIC');
      expect(task).toHaveProperty('plan_ref');
      expect(task).toHaveProperty('status');
      expect(task.plan_ref).toMatch(/\.txt$/);
    });
  });

  it('should validate referenced child plans exist', () => {
    const planPath = path.join(plansDir, 'plan_0003.txt');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    
    plan.tasks.forEach(task => {
      const childPlanPath = path.join(plansDir, task.plan_ref);
      expect(fs.existsSync(childPlanPath)).toBe(true);
      
      // Validate child plan structure
      const childPlan = JSON.parse(fs.readFileSync(childPlanPath, 'utf8'));
      expect(childPlan).toHaveProperty('tasks');
      expect(Array.isArray(childPlan.tasks)).toBe(true);
      
      // Validate TDD cycle in child plans
      const taskTypes = childPlan.tasks.map(t => t.type);
      expect(taskTypes).toContain('TEST_CREATION');
      expect(taskTypes).toContain('IMPLEMENTATION');
      expect(taskTypes).toContain('REFACTORING');
    });
  });
});