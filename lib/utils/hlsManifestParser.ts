/**
 * HLS Manifest Parser Utility
 * Parses m3u8 manifests and extracts segment information
 */

export interface Segment {
    url: string;
    duration: number;
    startTime: number;
}

export async function parseHLSManifest(src: string): Promise<Segment[]> {
    const response = await fetch(src);
    if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status}`);
    }
    const manifestText = await response.text();

    const lines = manifestText.split('\n');
    const segments: Segment[] = [];
    const baseUrl = src.substring(0, src.lastIndexOf('/') + 1);
    let currentSegmentDuration = 0;
    let currentStartTime = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#EXTINF:')) {
            const durationStr = trimmed.substring(8).split(',')[0];
            currentSegmentDuration = parseFloat(durationStr);
        } else if (trimmed && !trimmed.startsWith('#')) {
            // Use URL API to resolve relative paths correctly against the manifest URL
            // This handles cases where baseUrl might end with / and segment starts with /
            const segmentUrl = new URL(trimmed, src).toString();
            segments.push({
                url: segmentUrl,
                duration: currentSegmentDuration,
                startTime: currentStartTime
            });
            currentStartTime += currentSegmentDuration;
        }
    }

    return segments;
}
