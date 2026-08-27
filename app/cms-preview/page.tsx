import type { Metadata } from "next";
import { CmsPreviewPage, cmsPreviewMetadata } from "@/src/components/cms-preview-page";

export const metadata: Metadata = cmsPreviewMetadata;

export default function CmsPreview({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <CmsPreviewPage searchParams={searchParams} />;
}
