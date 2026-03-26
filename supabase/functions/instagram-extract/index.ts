import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
      },
    });

    if (!resp.ok) {
      console.log('Image proxy fetch failed with status:', resp.status);
      return null;
    }

    const bytes = new Uint8Array(await resp.arrayBuffer());
    const contentType = (resp.headers.get('content-type') || 'image/jpeg').split(';')[0];
    return `data:${contentType};base64,${encodeBase64(bytes)}`;
  } catch (e) {
    console.log('Image proxy failed:', e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.trim().replace(/^@/, '');

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.instagram.com/',
      'X-IG-App-ID': '936619743392459',
      'X-ASBD-ID': '129477',
      'X-Requested-With': 'XMLHttpRequest',
    };

    let profileImageUrl = '';
    let profileName = cleanUsername;
    let postData: Record<string, unknown> | null = null;

    const stripEmojis = (value: string) => value
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{FE0F}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const feedResponse = await fetch(
        `https://www.instagram.com/api/v1/feed/user/${cleanUsername}/username/?count=1`,
        { headers },
      );

      if (feedResponse.ok) {
        const feedData = await feedResponse.json();
        const latestPost = feedData?.items?.[0];
        const postUser = latestPost?.user;
        const captionText = latestPost?.caption?.text || '';
        const hashtagMatches = captionText.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g) || [];
        const hashtags = hashtagMatches.slice(0, 5).map((tag: string) => tag.replace('#', ''));
        const cleanCaption = stripEmojis(
          captionText
            .replace(/#[a-zA-Z0-9_\u0600-\u06FF]+/g, '')
            .replace(/@[a-zA-Z0-9_.]+/g, '')
            .split('\n')[0] || ''
        ).slice(0, 80);

        const igArtist = latestPost?.clips_metadata?.original_sound_info?.ig_artist;
        const originalAudioTitle = latestPost?.clips_metadata?.original_sound_info?.original_audio_title;
        const music = igArtist?.username
          ? `${igArtist.username}${originalAudioTitle ? ` • ${stripEmojis(originalAudioTitle)}` : ''}`
          : originalAudioTitle
            ? stripEmojis(originalAudioTitle)
            : '';

        if (postUser) {
          profileImageUrl = postUser.hd_profile_pic_url_info?.url || postUser.profile_pic_url || '';
          profileName = postUser.full_name || cleanUsername;
        }

        if (latestPost) {
          postData = {
            likesCount: latestPost.like_count || 0,
            commentsCount: latestPost.comment_count || 0,
            caption: cleanCaption,
            hashtags: hashtags.length ? hashtags : undefined,
            location: latestPost.location?.name || '',
            music,
          };
        }
      }
    } catch (e) {
      console.log('Feed method failed:', e);
    }

    if (!profileImageUrl) {
      try {
        const response = await fetch(`https://www.instagram.com/${cleanUsername}/`, { headers });
        if (response.ok) {
          const html = await response.text();
          const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
          const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];

          if (ogImage) profileImageUrl = ogImage;
          if (ogTitle) {
            const nameMatch = ogTitle.match(/^(.+?)\s*\(@/);
            if (nameMatch) profileName = nameMatch[1].trim();
          }
        }
      } catch (e) {
        console.log('Profile fallback failed:', e);
      }
    }

    // Convert profile image to base64 to avoid CORS/hotlinking issues
    let profileImage = '';
    if (profileImageUrl) {
      const base64 = await imageToBase64(profileImageUrl);
      profileImage = base64 || profileImageUrl;
    }

    const result = {
      success: true,
      data: {
        username: cleanUsername,
        profileName,
        profileImage,
        ...(postData || {}),
      },
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Instagram extraction error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to extract Instagram data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
