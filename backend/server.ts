import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const PORT = 3001;

app.use(cors() as unknown as RequestHandler);
app.use(express.json());

interface AnalysisRequest {
  url: string;
}

// User-Agent masking to look like a browser
const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

// Helper to unescape JSON-style slashes (https:\/\/ -> https://)
const unescapeUrl = (str: string): string => {
  return str.replace(/\\\//g, '/');
};

app.post('/api/analyze', async (req: any, res: any) => {
  const { url } = req.body as AnalysisRequest;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    console.log(`[Analyze] Fetching ${url}...`);
    
    // 1. Fetch Page Content
    // We add the Referer header to mimic a natural navigation, which helps with some sites (like terabox)
    const headers = { ...BASE_HEADERS, 'Referer': url };
    
    const response = await axios.get(url, { 
      headers, 
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400 
    });
    
    const html = response.data;
    // The final URL might be different if redirects happened (e.g., 1024terabox -> terabox)
    const finalUrl = response.request?.res?.responseUrl || url;
    console.log(`[Analyze] Resolved to: ${finalUrl}`);

    const $ = cheerio.load(html);

    // 2. Extract Metadata
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(finalUrl).hostname;
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

    // Strategy C: Script Regex (Enhanced for JSON blobs with escaped slashes)
    if (!streamUrl) {
      const scriptContent = $('script').text();
      
      // Regex matches https:// or https:\/\/ followed by chars until a quote or space, ending in .mp4 or .m3u8
      // Note: We use a non-greedy match for the protocol separator to handle both / and \/
      const broadRegex = /https?:\\?\/\\?\/[^"'\s<>]+\.(?:mp4|m3u8)/gi;
      
      const matches = scriptContent.match(broadRegex);
      
      if (matches && matches.length > 0) {
        // Find the first match that isn't the input URL itself (avoid recursion loops)
        for (const match of matches) {
           const cleaned = unescapeUrl(match);
           if (cleaned !== url && cleaned !== finalUrl) {
               streamUrl = cleaned;
               break;
           }
        }
      }
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
        error: `Could not detect a direct video stream from ${new URL(finalUrl).hostname}. The site may use encrypted DRM, blobs, or require authentication.`
      });
    }

  } catch (error: any) {
    console.error('[Analyze Error]', error.message);
    const statusCode = error.response ? error.response.status : 500;
    return res.status(statusCode).json({ 
      success: false, 
      error: `Failed to analyze URL: ${error.message}` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});