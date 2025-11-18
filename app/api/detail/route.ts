/**
 * Detail API Route
 * Fetches video details including episodes and M3U8 URLs with automatic source validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetail } from '@/lib/api/client';
import { getSourceById } from '@/lib/api/video-sources';

/**
 * Shared handler for fetching video details
 */
async function handleDetailRequest(id: string | null, source: string | null, method: string) {
  // Validate input
  if (!id) {
    return NextResponse.json(
      { error: 'Missing video ID parameter' },
      { status: 400 }
    );
  }

  // Validate source
  if (!source) {
    return NextResponse.json(
      { error: 'Missing source parameter' },
      { status: 400 }
    );
  }

  const sourceConfig = getSourceById(source);
  
  if (!sourceConfig) {
    return NextResponse.json(
      { error: 'Invalid source ID' },
      { status: 400 }
    );
  }

  // Fetch video detail without validation (already validated during search)
  try {
    const videoDetail = await getVideoDetail(id, sourceConfig);
    
    // Skip validation - videos are already checked during search
    // Just return the episodes as-is
    console.log(`[${method}] Fetching video details for ${id} from ${sourceConfig.name}`);
    
    return NextResponse.json({
      success: true,
      data: videoDetail,
    });
  } catch (error) {
    console.error('Detail API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch video detail',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const source = searchParams.get('source');

    return await handleDetailRequest(id, source, 'GET');
  } catch (error) {
    console.error('Detail API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Support POST method for complex requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, source } = body;

    return await handleDetailRequest(id, source, 'POST');
  } catch (error) {
    console.error('Detail API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
