import "server-only"

import type { Metal } from "@/lib/market/types"
import { metals } from "@/data/mock/metals"
import {
  metalDetailContent,
  type MetalDetailContent,
} from "@/data/mock/metal-details"
import { serverConfig } from "@/lib/config/env"

/*
  Content source seam (Phase 10, amendment 6). Owns CATALOGUE and EDITORIAL
  content — the metals catalogue and per-metal detail copy — and is kept strictly
  separate from `MarketProvider`, which owns quotes/history. A higher-level market
  service composes the two; this module never touches market data.

  The default `staticContentSource` is backed by the existing in-repo fixtures.
  Swapping in a CMS later means adding a source here and selecting it via
  CONTENT_SOURCE — no page or component change. Async by design so a real CMS
  (which is I/O-bound) drops in without reshaping callers.

  Scope note: catalogue + detail content are adopted now (consumed by the market
  service). Broader editorial (company, logistics FAQs, hero copy) still reads its
  config modules directly and can migrate here incrementally.
  TODO(cms): extend this interface + static source to cover FAQs and page copy.
*/
export interface ContentSource {
  getMetals(): Promise<Metal[]>
  getMetalBySlug(slug: string): Promise<Metal | undefined>
  getMetalDetailContent(slug: string): Promise<MetalDetailContent | undefined>
}

const staticContentSource: ContentSource = {
  async getMetals() {
    return metals
  },
  async getMetalBySlug(slug) {
    return metals.find((m) => m.slug === slug)
  },
  async getMetalDetailContent(slug) {
    return metalDetailContent[slug]
  },
}

/** Select the content source by validated config (default: static). */
export function getContentSource(): ContentSource {
  switch (serverConfig.contentSource) {
    case "static":
    default:
      return staticContentSource
  }
}
