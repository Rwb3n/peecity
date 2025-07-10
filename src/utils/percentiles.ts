/**
 * Memory-efficient streaming percentile calculator using reservoir sampling
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task6
 * @tdd-phase REFACTOR
 */

export class StreamingPercentileCalculator {
  private reservoir: number[] = [];
  private count: number = 0;
  private maxSize: number;
  private sorted: boolean = false;

  constructor(reservoirSize: number = 10000) {
    this.maxSize = reservoirSize;
  }

  /**
   * Add a value to the calculator
   */
  add(value: number): void {
    this.count++;
    this.sorted = false;

    if (this.reservoir.length < this.maxSize) {
      // Reservoir not full, just add
      this.reservoir.push(value);
    } else {
      // Reservoir sampling algorithm
      const randomIndex = Math.floor(Math.random() * this.count);
      if (randomIndex < this.maxSize) {
        this.reservoir[randomIndex] = value;
      }
    }
  }

  /**
   * Get percentile value
   */
  getPercentile(percentile: number): number | null {
    if (this.reservoir.length === 0) {
      return null;
    }

    // Sort if needed
    if (!this.sorted) {
      this.reservoir.sort((a, b) => a - b);
      this.sorted = true;
    }

    const index = Math.floor((percentile / 100) * (this.reservoir.length - 1));
    return this.reservoir[index];
  }

  /**
   * Get multiple percentiles at once (more efficient)
   */
  getPercentiles(percentiles: number[]): { [key: string]: number | null } {
    const result: { [key: string]: number | null } = {};

    if (this.reservoir.length === 0) {
      percentiles.forEach(p => {
        result[`p${p}`] = null;
      });
      return result;
    }

    // Sort once for all percentiles
    if (!this.sorted) {
      this.reservoir.sort((a, b) => a - b);
      this.sorted = true;
    }

    percentiles.forEach(p => {
      const index = Math.floor((p / 100) * (this.reservoir.length - 1));
      result[`p${p}`] = this.reservoir[index];
    });

    return result;
  }

  /**
   * Get min, max, and average
   */
  getStatistics(): { min: number | null; max: number | null; avg: number | null; count: number } {
    if (this.reservoir.length === 0) {
      return { min: null, max: null, avg: null, count: 0 };
    }

    // Sort if needed
    if (!this.sorted) {
      this.reservoir.sort((a, b) => a - b);
      this.sorted = true;
    }

    const sum = this.reservoir.reduce((acc, val) => acc + val, 0);

    return {
      min: this.reservoir[0],
      max: this.reservoir[this.reservoir.length - 1],
      avg: sum / this.reservoir.length,
      count: this.count
    };
  }

  /**
   * Reset the calculator
   */
  reset(): void {
    this.reservoir = [];
    this.count = 0;
    this.sorted = false;
  }

  /**
   * Get current sample size
   */
  getSampleSize(): number {
    return this.reservoir.length;
  }

  /**
   * Get total count of values added
   */
  getTotalCount(): number {
    return this.count;
  }
}

// Global percentile calculators for different time windows
export const percentileCalculators = {
  '1h': new StreamingPercentileCalculator(1000),
  '24h': new StreamingPercentileCalculator(5000),
  '7d': new StreamingPercentileCalculator(10000),
  'all': new StreamingPercentileCalculator(20000)
};

// Background task to update percentiles
let updateInterval: NodeJS.Timeout | null = null;

export function startPercentileUpdates(intervalMs: number = 10000): void {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  updateInterval = setInterval(() => {
    // This would be called by the metrics service to update percentiles
    // For now, it's a placeholder for the update mechanism
  }, intervalMs);
}

export function stopPercentileUpdates(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

export function resetAllPercentileCalculators(): void {
  Object.values(percentileCalculators).forEach(calc => calc.reset());
}