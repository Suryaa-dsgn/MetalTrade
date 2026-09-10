import "server-only"

import { serverConfig } from "@/lib/config/env"

/*
  Upload service seam (Phase 10, amendment 5). Storage stays DISABLED in this
  phase: there is deliberately NO presign endpoint and no storage client. This is
  only the extension point a real, approved upload provider would implement
  (selected via UPLOAD_PROVIDER), behind a security policy that does not yet
  exist. The Phase 8 attachment UI remains a non-uploading shell; no file is
  transmitted or stored.
*/
export interface UploadService {
  readonly name: string
  isEnabled(): boolean
  /** Human-readable status for accurate UI copy. */
  describe(): string
}

const disabledUploadService: UploadService = {
  name: "disabled",
  isEnabled: () => false,
  describe: () =>
    "File uploads are not enabled in this environment. Attachments are not transmitted or stored.",
}

export function getUploadService(): UploadService {
  switch (serverConfig.uploadProvider) {
    case "disabled":
    default:
      return disabledUploadService
  }
}
