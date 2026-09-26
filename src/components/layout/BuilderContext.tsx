"use client";

import { createContext, useCallback, useContext } from "react";

export type BuilderMode = "app" | "preview";

interface BuilderContextValue {
  mode: BuilderMode;
  /** "/app" for signed-in users, "/preview" for the public demo. */
  basePath: string;
}

const BuilderContext = createContext<BuilderContextValue>({ mode: "app", basePath: "/app" });

export const BuilderContextProvider = BuilderContext.Provider;

export function useBuilder(): BuilderContextValue {
  return useContext(BuilderContext);
}

/** Builds links that stay inside the current area, e.g. `href("/tiers")` → "/preview/tiers". */
export function useBuilderHref(): (path: string) => string {
  const { basePath } = useBuilder();
  return useCallback((path: string) => `${basePath}${path}`, [basePath]);
}
