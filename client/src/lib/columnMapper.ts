/**
 * Advanced column mapping system
 * Handles automatic and manual column mapping with validation
 */

import { ColumnMapping, FormatDetectionResult } from './formatDetector';

export interface MappingProfile {
  name: string;
  format: string;
  mappings: Record<string, string>;
  createdAt: Date;
  usageCount: number;
}

export interface ColumnMappingConfig {
  itemCode: string | null;
  description: string | null;
  unit: string | null;
  quantity: string | null;
  unitPrice: string | null;
  totalPrice?: string | null;
  category?: string | null;
  wbsCode?: string | null;
  notes?: string | null;
}

export interface MappingResult {
  config: ColumnMappingConfig;
  confidence: number;
  requiresReview: boolean;
  reviewItems: string[];
}

/**
 * Create mapping profile from detection result
 */
export function createMappingProfile(
  detectionResult: FormatDetectionResult,
  profileName?: string
): MappingProfile {
  const mappings: Record<string, string> = {};

  for (const col of detectionResult.columnMappings) {
    if (col.detectedType !== 'unknown' && col.confidence > 0.5) {
      mappings[col.detectedType] = col.originalName;
    }
  }

  return {
    name: profileName || `${detectionResult.format}-${Date.now()}`,
    format: detectionResult.format,
    mappings,
    createdAt: new Date(),
    usageCount: 0,
  };
}

/**
 * Apply mapping profile to convert raw data
 */
export function applyMapping(
  rawData: Record<string, any>,
  config: ColumnMappingConfig
): Record<string, any> {
  const mapped: Record<string, any> = {};

  // Map required fields
  if (config.itemCode && config.itemCode in rawData) {
    mapped.itemCode = rawData[config.itemCode];
  }

  if (config.description && config.description in rawData) {
    mapped.description = rawData[config.description];
  }

  if (config.unit && config.unit in rawData) {
    mapped.unit = rawData[config.unit];
  }

  if (config.quantity && config.quantity in rawData) {
    mapped.quantity = parseFloat(rawData[config.quantity]) || 0;
  }

  if (config.unitPrice && config.unitPrice in rawData) {
    mapped.unitPrice = parseFloat(rawData[config.unitPrice]) || 0;
  }

  // Calculate total price if not provided
  if (!config.totalPrice && mapped.quantity && mapped.unitPrice) {
    mapped.totalPrice = mapped.quantity * mapped.unitPrice;
  } else if (config.totalPrice && config.totalPrice in rawData) {
    mapped.totalPrice = parseFloat(rawData[config.totalPrice]) || 0;
  }

  // Map optional fields
  if (config.category && config.category in rawData) {
    mapped.category = rawData[config.category];
  }

  if (config.wbsCode && config.wbsCode in rawData) {
    mapped.wbsCode = rawData[config.wbsCode];
  }

  if (config.notes && config.notes in rawData) {
    mapped.notes = rawData[config.notes];
  }

  return mapped;
}

/**
 * Suggest best mapping based on available columns
 */
export function suggestMapping(
  availableColumns: string[],
  detectionResult: FormatDetectionResult
): MappingResult {
  const config: ColumnMappingConfig = {
    itemCode: null,
    description: null,
    unit: null,
    quantity: null,
    unitPrice: null,
  };

  const reviewItems: string[] = [];
  let totalConfidence = 0;
  let mappedCount = 0;

  for (const col of detectionResult.columnMappings) {
    if (!availableColumns.includes(col.originalName)) continue;

    if (col.detectedType === 'itemCode') {
      config.itemCode = col.originalName;
      totalConfidence += col.confidence;
      mappedCount++;
    } else if (col.detectedType === 'description') {
      config.description = col.originalName;
      totalConfidence += col.confidence;
      mappedCount++;
    } else if (col.detectedType === 'unit') {
      config.unit = col.originalName;
      totalConfidence += col.confidence;
      mappedCount++;
    } else if (col.detectedType === 'quantity') {
      config.quantity = col.originalName;
      totalConfidence += col.confidence;
      mappedCount++;
    } else if (col.detectedType === 'unitPrice') {
      config.unitPrice = col.originalName;
      totalConfidence += col.confidence;
      mappedCount++;
    } else if (col.detectedType === 'totalPrice') {
      config.totalPrice = col.originalName;
    } else if (col.detectedType === 'category') {
      config.category = col.originalName;
    } else if (col.detectedType === 'wbsCode') {
      config.wbsCode = col.originalName;
    } else if (col.detectedType === 'notes') {
      config.notes = col.originalName;
    }

    // Flag low confidence mappings for review
    if (col.confidence < 0.7 && col.detectedType !== 'unknown') {
      reviewItems.push(`${col.originalName} (${col.detectedType}) - Low confidence: ${(col.confidence * 100).toFixed(0)}%`);
    }
  }

  // Check for missing required fields
  const requiredFields: (keyof ColumnMappingConfig)[] = ['itemCode', 'description', 'quantity', 'unitPrice'];
  for (const field of requiredFields) {
    if (!config[field]) {
      reviewItems.push(`Missing required field: ${field}`);
    }
  }

  const confidence = mappedCount > 0 ? totalConfidence / mappedCount : 0;
  const requiresReview = confidence < 0.8 || reviewItems.length > 0;

  return {
    config,
    confidence,
    requiresReview,
    reviewItems,
  };
}

/**
 * Merge multiple mapping suggestions
 */
export function mergeMappings(
  ...mappings: ColumnMappingConfig[]
): ColumnMappingConfig {
  const merged: ColumnMappingConfig = {
    itemCode: null,
    description: null,
    unit: null,
    quantity: null,
    unitPrice: null,
  };

  for (const mapping of mappings) {
    if (!merged.itemCode && mapping.itemCode) merged.itemCode = mapping.itemCode;
    if (!merged.description && mapping.description) merged.description = mapping.description;
    if (!merged.unit && mapping.unit) merged.unit = mapping.unit;
    if (!merged.quantity && mapping.quantity) merged.quantity = mapping.quantity;
    if (!merged.unitPrice && mapping.unitPrice) merged.unitPrice = mapping.unitPrice;
    if (!merged.totalPrice && mapping.totalPrice) merged.totalPrice = mapping.totalPrice;
    if (!merged.category && mapping.category) merged.category = mapping.category;
    if (!merged.wbsCode && mapping.wbsCode) merged.wbsCode = mapping.wbsCode;
    if (!merged.notes && mapping.notes) merged.notes = mapping.notes;
  }

  return merged;
}

/**
 * Save mapping profile to local storage
 */
export function saveMappingProfile(profile: MappingProfile): void {
  const profiles = loadMappingProfiles();
  const index = profiles.findIndex((p) => p.name === profile.name);

  if (index >= 0) {
    profiles[index] = profile;
  } else {
    profiles.push(profile);
  }

  localStorage.setItem('boq_mapping_profiles', JSON.stringify(profiles));
}

/**
 * Load mapping profiles from local storage
 */
export function loadMappingProfiles(): MappingProfile[] {
  const stored = localStorage.getItem('boq_mapping_profiles');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get most used mapping profile
 */
export function getMostUsedProfile(): MappingProfile | null {
  const profiles = loadMappingProfiles();
  return profiles.length > 0 ? profiles.reduce((a, b) => (a.usageCount > b.usageCount ? a : b)) : null;
}

/**
 * Delete mapping profile
 */
export function deleteMappingProfile(profileName: string): void {
  const profiles = loadMappingProfiles();
  const filtered = profiles.filter((p) => p.name !== profileName);
  localStorage.setItem('boq_mapping_profiles', JSON.stringify(filtered));
}

/**
 * Validate mapping configuration
 */
export function validateMapping(config: ColumnMappingConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.itemCode) errors.push('Item Code column is required');
  if (!config.description) errors.push('Description column is required');
  if (!config.quantity) errors.push('Quantity column is required');
  if (!config.unitPrice) errors.push('Unit Price column is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
