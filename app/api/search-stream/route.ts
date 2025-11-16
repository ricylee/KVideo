/**
 * Streaming Search API Route
 * Returns results progressively as they become available
 * Searches up to 10 sources concurrently and validates videos immediately
 */

import { NextRequest } from 'next/server';
import { searchVideos } from '@/lib/api/client';
import { getSourceById } from '@/lib/api/video-sources';
import { checkVideoAvailability } from '@/lib/utils/source-checker';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { query, sources: sourceIds, page = 1 } = body;

        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Invalid query' })}\n\n`));
          controller.close();
          return;
        }

        // Get source configurations
        const sources = sourceIds
          .map((id: string) => getSourceById(id))
          .filter((source: any): source is NonNullable<typeof source> => source !== undefined);

        if (sources.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No valid sources' })}\n\n`));
          controller.close();
          return;
        }

        // Send initial progress
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          stage: 'searching',
          checkedSources: 0,
          totalSources: sources.length
        })}\n\n`));

        let checkedSourcesCount = 0;
        let totalVideosFound = 0;
        let checkedVideosCount = 0;
        const concurrency = 10; // Process 10 sources at a time

        // Process sources in batches of 10, but with streaming results
        for (let i = 0; i < sources.length; i += concurrency) {
          const sourceBatch = sources.slice(i, i + concurrency);
          
          // Process each source in the batch, search + check + send results immediately
          await Promise.all(
            sourceBatch.map(async (source: any) => {
              try {
                // Step 1: Search this source
                const result = await searchVideos(query.trim(), [source], page);
                checkedSourcesCount++;
                
                // Send search progress
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  stage: 'searching',
                  checkedSources: checkedSourcesCount,
                  totalSources: sources.length
                })}\n\n`));

                const videos = result[0]?.results || [];
                if (videos.length === 0) return;

                totalVideosFound += videos.length;

                // Step 2: Check videos from this source (in sub-batches of 10)
                const validatedVideos: any[] = [];
                
                for (let j = 0; j < videos.length; j += 10) {
                  const videoBatch = videos.slice(j, j + 10);
                  
                  // Check all 10 videos in parallel
                  const checkResults = await Promise.all(
                    videoBatch.map(async (video) => {
                      const isAvailable = await checkVideoAvailability(video);
                      checkedVideosCount++;
                      
                      // Send check progress after each video
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'progress', 
                        stage: 'checking',
                        checkedVideos: checkedVideosCount,
                        totalVideos: totalVideosFound
                      })}\n\n`));
                      
                      return isAvailable ? video : null;
                    })
                  );

                  // Collect validated videos from this sub-batch
                  const newValidated = checkResults.filter(v => v !== null);
                  validatedVideos.push(...newValidated);

                  // Step 3: Send validated videos IMMEDIATELY (don't wait for browser validation)
                  if (newValidated.length > 0) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      type: 'videos',
                      videos: newValidated,
                      checkedVideos: checkedVideosCount,
                      totalVideos: totalVideosFound
                    })}\n\n`));
                  }
                }

              } catch (error) {
                checkedSourcesCount++;
                
                // Send error progress
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  stage: 'searching',
                  checkedSources: checkedSourcesCount,
                  totalSources: sources.length
                })}\n\n`));
              }
            })
          );
        }

        // Send completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete',
          totalResults: checkedVideosCount,
          totalVideos: totalVideosFound
        })}\n\n`));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
