import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATS_FILE = join(__dirname, 'stats.json');

/**
 * StatsTracker - Tracks global statistics persistently
 */
class StatsTracker {
  constructor() {
    this.stats = {
      totalAnalyses: 0,
      totalRequests: 0,
      lastUpdated: null
    };
    this.initialized = false;
  }

  /**
   * Initialize stats from file
   */
  async init() {
    if (this.initialized) return;
    
    try {
      if (existsSync(STATS_FILE)) {
        const data = await readFile(STATS_FILE, 'utf-8');
        this.stats = JSON.parse(data);
        console.log('Loaded stats:', this.stats);
      } else {
        console.log('No stats file found, starting fresh');
        await this.save();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Continue with default stats
    }
    
    this.initialized = true;
  }

  /**
   * Save stats to file
   */
  async save() {
    try {
      this.stats.lastUpdated = new Date().toISOString();
      await writeFile(STATS_FILE, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  /**
   * Increment total analyses count
   */
  async incrementAnalyses() {
    this.stats.totalAnalyses++;
    await this.save();
  }

  /**
   * Increment total requests count (including failed ones)
   */
  async incrementRequests() {
    this.stats.totalRequests++;
    await this.save();
  }

  /**
   * Get current stats
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton instance
export const statsTracker = new StatsTracker();
