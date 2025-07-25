export type TEvent = 'dom-ready' | 'ready' | CustomEvent | string;

export type CustomEvent = 'custom1' | 'custom2' | 'custom3' | 'custom4';

export type Identifier = number | string;

export type THeaders = Record<string, string>;

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type TResponse = {
  result?: any;
  error?: string;
  code?: number;
};

export interface FeedItem {
  id: Identifier;
  uid: Identifier;
  title: string;
  description: string;
  image: string;
  type: 'bot' | 'app';
  link: string;
  status: 'new' | 'pending' | 'completed' | 'claimed' | 'unknown';
}

export interface ExchangeFeedOptions {
  limit?: number;
  imageFormat?: 'png' | 'jpg' | 'webp';
  autoImpressions?: boolean;
  showCompleted?: boolean;
}

export interface TaddyConfig {
  apiUrl?: string;
  debug?: boolean;
  disableExternalProviders?: boolean;
  disablePlaymaticProvider?: boolean;
  disableTeleAdsProvider?: boolean;
}

export interface TelegramUser {
  id: number | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  premium?: boolean | null;
  gender?: 'male' | 'female' | null;
  source?: string | null;
  language?: string | null;
  birthDate?: string | null;
}

export interface Ad {
  id: string;
  title: string | null;
  description: string | null;
  image: string | null;
  video: string | null;
  icon: string | null;
  text: string | null;
  button: string | null;
  link: string;
}

export interface InterstitialConfig {
  onClosed?(): void;
  onViewThrough?(id?: string): void;
}

export enum EFormat {
  BotMessage = 'bot-ad',
  Task = 'app-task',
  Interstitial = 'app-interstitial',
}
