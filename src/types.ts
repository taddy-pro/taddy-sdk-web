export type TEvent = 'dom-ready' | 'ready' | TCustomEvent | string;

export type TCustomEvent = 'custom1' | 'custom2' | 'custom3' | 'custom4';

export type TIdentifier = number | string;

export type THeaders = Record<string, string>;

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type TResponse = {
  result?: any;
  error?: string;
  code?: number;
};

export interface ITask {
  id: TIdentifier;
  title: string;
  description: string;
  image: string;
  link: string;
}

export interface IGetTasksOptions {
  limit?: number;
  autoImpressions?: boolean;
}

export interface TaddyConfig {
  apiUrl?: string;
  debug?: boolean;
}

export interface TelegramUserDto {
  id: number | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  premium?: boolean | null;
  gender?: string | null;
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
  onClosed(): void;
}
