import { NextResponse } from 'next/server';
import { ADULT_SOURCES } from '@/lib/api/adult-sources';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category') || ''; // Format: "sourceId:typeId" or just "typeId" or empty
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        // Parse category parameter which might contain multiple sources
        // Format: "source1:id1,source2:id2" or just "typeId" (legacy)
        const sourceMap = new Map<string, string>(); // sourceId -> typeId

        if (categoryParam) {
            const parts = categoryParam.split(',');
            parts.forEach(part => {
                if (part.includes(':')) {
                    const [sId, tId] = part.split(':');
                    sourceMap.set(sId, tId);
                } else {
                    // Legacy format: just typeId, assume first enabled source
                    const firstSource = ADULT_SOURCES.find(s => s.enabled);
                    if (firstSource) {
                        sourceMap.set(firstSource.id, part);
                    }
                }
            });
        }

        // Determine which sources to fetch
        // If specific sources requested via category, use those
        // Otherwise (e.g. "Recommend"), use all enabled sources
        let targetSources = [];
        if (sourceMap.size > 0) {
            targetSources = ADULT_SOURCES.filter(s => sourceMap.has(s.id) && s.enabled);
        } else {
            targetSources = ADULT_SOURCES.filter(s => s.enabled);
        }

        if (targetSources.length === 0) {
            return NextResponse.json({ videos: [], error: 'No enabled sources' }, { status: 500 });
        }

        // Fetch from all target sources concurrently
        const fetchPromises = targetSources.map(async (source) => {
            try {
                const url = new URL(source.baseUrl);
                url.searchParams.set('ac', 'detail');
                url.searchParams.set('pg', page.toString());

                // Set category parameter if specific type requested for this source
                if (sourceMap.has(source.id)) {
                    url.searchParams.set('t', sourceMap.get(source.id)!);
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

                const response = await fetch(url.toString(), {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    },
                    next: { revalidate: 1800 }, // Cache for 30 minutes
                });

                clearTimeout(timeoutId);

                if (!response.ok) return [];

                const data = await response.json();
                return (data.list || []).map((item: any) => ({
                    vod_id: item.vod_id,
                    vod_name: item.vod_name,
                    vod_pic: item.vod_pic,
                    vod_remarks: item.vod_remarks,
                    type_name: item.type_name,
                    source: source.id,
                }));
            } catch (error) {
                console.error(`Failed to fetch from ${source.name}:`, error);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);

        // Interleave results: [A1, B1, C1, A2, B2, C2, ...]
        const interleavedVideos = [];
        const maxLen = Math.max(...results.map(r => r.length));

        for (let i = 0; i < maxLen; i++) {
            for (let j = 0; j < results.length; j++) {
                if (results[j][i]) {
                    interleavedVideos.push(results[j][i]);
                }
            }
        }

        // Apply limit after interleaving
        // Note: Since we fetch 'limit' from EACH source, the total could be huge
        // We should slice the final result. However, 'limit' param usually means per page.
        // If we want consistent pagination, we should return all fetched items (limit * sources)
        // But to respect the client's requested limit roughly, we can slice.
        // Actually, for "load more" to work properly with multiple sources, 
        // we should probably return everything we fetched for this "page" index.

        return NextResponse.json({ videos: interleavedVideos });
    } catch (error) {
        console.error('Category content error:', error);
        return NextResponse.json(
            { videos: [], error: 'Failed to fetch category content' },
            { status: 500 }
        );
    }
}
