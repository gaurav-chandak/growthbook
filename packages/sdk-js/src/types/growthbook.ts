/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GrowthBook } from "..";
import { ConditionInterface } from "./mongrule";

declare global {
  interface Window {
    _growthbook?: GrowthBook;
  }
}

export type FeatureRule<T = any> = {
  id?: string;
  condition?: ConditionInterface;
  force?: T;
  hashAttribute?: string;
  key?: string;
  seed?: string;
  exclusions?: Exclusion[];
  ranges?: Ranges;
  track?: TrackData;
  name?: string;
  phase?: string;
  variants?: Variant<T>[];

  /**
   * @deprecated
   */
  variations?: T[];
  /**
   * @deprecated
   */
  weights?: number[];
  /**
   * @deprecated
   */
  coverage?: number;
  /**
   * @deprecated
   */
  namespace?: [string, number, number];
};

export type Range = [number, number];
export type Ranges = Range[];

export interface Exclusion {
  seed: string;
  ranges: Ranges;
  attribute?: string;
  shouldTrack?: boolean;
}

export interface Variant<T> {
  value: T;
  ranges: Ranges;
  key?: string;
  name?: string;
}

export interface TrackData {
  hashAttribute: string;
  hashValue: string;
  bucket: number;
  value: any;

  experimentId: string;
  experimentName?: string;
  phase?: string;

  variationIndex: number;
  variationId?: string;
  variationName?: string;
}

export interface FeatureDefinition<T = any> {
  defaultValue?: T;
  rules?: FeatureRule<T>[];
}

export type FeatureResultSource =
  | "unknownFeature"
  | "defaultValue"
  | "force"
  | "override"
  | "experiment";

export interface FeatureResult<T = any> {
  value: T | null;
  source: FeatureResultSource;
  on: boolean;
  off: boolean;
  ruleId: string;
  experiment?: Experiment<T>;
  experimentResult?: Result<T>;
}

export type ExperimentStatus = "draft" | "running" | "stopped";

export type Experiment<T> = {
  key: string;
  /**
   * @deprecated
   */
  variations?: [T, T, ...T[]];
  /**
   * @deprecated
   */
  weights?: number[];
  condition?: ConditionInterface;
  /**
   * @deprecated
   */
  coverage?: number;
  include?: () => boolean;
  /**
   * @deprecated
   */
  namespace?: [string, number, number];
  force?: number;
  exclusions?: Exclusion[];
  variants?: Variant<T>[];
  seed?: string;
  name?: string;
  phase?: string;
  hashAttribute?: string;
  active?: boolean;
  /**
   * @deprecated
   */
  status?: ExperimentStatus;
  /**
   * @deprecated
   */
  url?: RegExp;
  /**
   * @deprecated
   */
  groups?: string[];
};

export type ExperimentOverride = {
  condition?: ConditionInterface;
  weights?: number[];
  active?: boolean;
  status?: ExperimentStatus;
  force?: number;
  coverage?: number;
  groups?: string[];
  namespace?: [string, number, number];
  url?: RegExp | string;
};

export interface Result<T> {
  value: T;
  variationId: number;
  variationKey?: string;
  variationName?: string;
  bucket?: number;
  inExperiment: boolean;
  hashUsed?: boolean;
  hashAttribute: string;
  hashValue: string;
  featureId: string | null;
}

export type Attributes = Record<string, any>;

export type RealtimeUsageData = {
  key: string;
  on: boolean;
};

export interface Context {
  enabled?: boolean;
  attributes?: Attributes;
  url?: string;
  features?: Record<string, FeatureDefinition>;
  forcedVariations?: Record<string, number>;
  log?: (msg: string, ctx: any) => void;
  qaMode?: boolean;
  enableDevMode?: boolean;
  /* @deprecated */
  disableDevTools?: boolean;
  trackingCallback?: (experiment: Experiment<any>, result: Result<any>) => void;
  onExperimentViewed?: (data: TrackData) => void;
  onFeatureUsage?: (key: string, result: FeatureResult<any>) => void;
  realtimeKey?: string;
  realtimeInterval?: number;
  /* @deprecated */
  user?: {
    id?: string;
    anonId?: string;
    [key: string]: string | undefined;
  };
  /* @deprecated */
  overrides?: Record<string, ExperimentOverride>;
  /* @deprecated */
  groups?: Record<string, boolean>;
  apiHost?: string;
  clientKey?: string;
  decryptionKey?: string;
}

export type SubscriptionFunction = (
  experiment: Experiment<any>,
  result: Result<any>
) => void;

export type JSONValue =
  | null
  | number
  | string
  | boolean
  | Array<JSONValue>
  | { [key: string]: JSONValue };

export type WidenPrimitives<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T;

export type FeatureDefinitions = Record<string, FeatureDefinition>;

export type FeatureApiResponse = {
  features?: FeatureDefinitions;
  dateUpdated?: string;
  encryptedFeatures?: string;
};

// Polyfills required for non-standard browser environments (ReactNative, Node, etc.)
// These are typed as `any` since polyfills like `node-fetch` are not 100% compatible with native types
export type Polyfills = {
  // eslint-disable-next-line
  fetch: any;
  // eslint-disable-next-line
  SubtleCrypto: any;
  // eslint-disable-next-line
  EventSource: any;
  localStorage: LocalStorageCompat;
};

export interface LocalStorageCompat {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

export type CacheSettings = {
  backgroundSync: boolean;
  cacheKey: string;
  staleTTL: number;
};

export type ApiHost = string;
export type ClientKey = string;
export type RepositoryKey = `${ApiHost}||${ClientKey}`;

export type LoadFeaturesOptions = {
  autoRefresh?: boolean;
  timeout?: number;
  skipCache?: boolean;
};

export type RefreshFeaturesOptions = {
  timeout?: number;
  skipCache?: boolean;
};
