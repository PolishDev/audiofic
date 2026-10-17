import { ulid } from 'ulid';

/**
 * Standard ULID generator for the application.
 * Generates 26-character, lexicographically sortable, time-ordered, URL-safe identifiers.
 */
export const generateId = (): string => ulid();
