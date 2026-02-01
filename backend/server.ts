import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const PORT = 3001;

app.use(cors() as any);
app.use(express.json());

interface AnalysisRequest {
  url: string;
}

// User-Agent masking to look like a browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

app.post('/api/analyze', async (req: any, res: any) => {
  const { url } = req.body as AnalysisRequest;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    console.log(`[Analyze] Fetching ${url}...`);
    
    // 1. Fetch Page Content
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // 2. Extract Metadata
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;
    const poster = $('meta[property="og:image"]').attr('content');

    // 3. Heuristic Extraction Strategies
    let streamUrl: string | undefined;
    let contentType: string | null = null;

    // Strategy A: Open Graph Video (Best for social media/news)
    const ogVideo = $('meta[property="og:video"]').attr('content');
    const ogVideoSecure = $('meta[property="og:video:secure_url"]').attr('content');
    const twitterStream = $('meta[name="twitter:player:stream"]').attr('content');

    if (ogVideoSecure && (ogVideoSecure.includes('.mp4') || ogVideoSecure.includes('.m3u8'))) {
      streamUrl = ogVideoSecure;
    } else if (ogVideo && (ogVideo.includes('.mp4') || ogVideo.includes('.m3u8'))) {
      streamUrl = ogVideo;
    } else if (twitterStream) {
      streamUrl = twitterStream;
    }

    // Strategy B: HTML5 <video> tags
    if (!streamUrl) {
      const videoSrc = $('video').attr('src');
      const sourceSrc = $('video source').attr('src');
      
      if (videoSrc && (videoSrc.startsWith('http') || videoSrc.startsWith('//'))) {
        streamUrl = videoSrc;
      } else if (sourceSrc && (sourceSrc.startsWith('http') || sourceSrc.startsWith('//'))) {
        streamUrl = sourceSrc;
      }
    }

    // Strategy C: Script Regex (Last resort for JSON blobs)
    if (!streamUrl) {
      // Look for .mp4 or .m3u8 urls inside script tags
      const scriptContent = $('script').text();
      const mp4Regex = /https?:\/\/[^"'\s]+\.mp4/g;
      const m3u8Regex = /https?:\/\/[^"'\s]+\.m3u8/g;
      
      const mp4Match = scriptContent.match(mp4Regex);
      const m3u8Match = scriptContent.match(m3u8Regex);

      if (mp4Match && mp4Match.length > 0) streamUrl = mp4Match[0];
      if (!streamUrl && m3u8Match && m3u8Match.length > 0) streamUrl = m3u8Match[0];
    }

    // 4. Validate and Finalize
    if (streamUrl) {
      // Fix protocol relative URLs
      if (streamUrl.startsWith('//')) {
        streamUrl = 'https:' + streamUrl;
      }

      // Determine Content Type based on extension
      if (streamUrl.includes('.m3u8')) contentType = 'application/x-mpegURL';
      else if (streamUrl.includes('.webm')) contentType = 'video/webm';
      else contentType = 'video/mp4';

      return res.json({
        success: true,
        data: {
          url: streamUrl,
          contentType,
          title,
          description,
          siteName,
          poster
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Could not detect a direct public video stream. The site may use DRM, complex encryption, or authentication.'
      });
    }

  } catch (error: any) {
    console.error('[Analyze Error]', error.message);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to analyze URL: ${error.message}` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});