/**
 * Removes control and invisible formatting characters (keeping newlines and tabs)
 * from user-entered text before it is rendered or written to a PDF.
 */
export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[​-‏‪-‮⁠-⁩﻿]/g, "");
}
