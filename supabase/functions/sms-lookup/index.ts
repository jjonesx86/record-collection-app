import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface Record {
  artist: string;
  album: string;
  year?: number;
}

function parseMessage(body: string): { artist?: string; album?: string; raw: string } {
  let text = body.trim();

  // Strip common question prefixes
  text = text.replace(/^(do you have|have you got|is there|do we have)\s+/i, '');
  text = text.replace(/[?!.]+$/, '').trim();

  // "album by artist"
  const byMatch = text.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { album: byMatch[1].trim(), artist: byMatch[2].trim(), raw: body };
  }

  // "artist - album"
  const dashMatch = text.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), album: dashMatch[2].trim(), raw: body };
  }

  // No separator found — use raw text for general search
  return { raw: body };
}

async function findRecord(artist?: string, album?: string, raw?: string): Promise<Record | null> {
  if (artist && album) {
    // Try artist + album match
    const { data } = await supabase
      .from('records')
      .select('artist, album, year')
      .ilike('artist', `%${artist}%`)
      .ilike('album', `%${album}%`)
      .limit(1);
    if (data?.[0]) return data[0];

    // Try swapped — in case artist and album order was reversed
    const { data: swapped } = await supabase
      .from('records')
      .select('artist, album, year')
      .ilike('artist', `%${album}%`)
      .ilike('album', `%${artist}%`)
      .limit(1);
    if (swapped?.[0]) return swapped[0];
  }

  // Fall back to general search across both fields using two separate queries
  // (avoids embedding user input in PostgREST filter string syntax)
  const term = (raw ?? '').trim();
  if (term) {
    const { data: artistData } = await supabase
      .from('records')
      .select('artist, album, year')
      .ilike('artist', `%${term}%`)
      .limit(1);
    if (artistData?.[0]) return artistData[0];

    const { data: albumData } = await supabase
      .from('records')
      .select('artist, album, year')
      .ilike('album', `%${term}%`)
      .limit(1);
    if (albumData?.[0]) return albumData[0];
  }

  return null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildTwiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new Response(xml, { headers: { 'Content-Type': 'text/xml' } });
}

Deno.serve(async (req) => {
  try {
    const formData = await req.formData();
    const smsBody = formData.get('Body')?.toString() ?? '';

    if (!smsBody.trim()) {
      return buildTwiml("Text me an album to look up. Try: \"Do you have [Album] by [Artist]?\"");
    }

    const parsed = parseMessage(smsBody);
    const record = await findRecord(parsed.artist, parsed.album, parsed.raw);

    let message: string;
    if (record) {
      const year = record.year ? ` (${record.year})` : '';
      message = `Yes! "${record.album}" by ${record.artist}${year} is in the collection.`;
    } else if (parsed.artist && parsed.album) {
      message = `No, "${parsed.album}" by ${parsed.artist} isn't in the collection.`;
    } else {
      message = `No match found for "${smsBody.trim()}". Try: "Do you have [Album] by [Artist]?"`;
    }

    return buildTwiml(message);
  } catch (err) {
    console.error(err);
    return buildTwiml('Something went wrong. Please try again.');
  }
});
