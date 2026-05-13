const HEYGEN_API_BASE = "https://api.heygen.com";
const HEYGEN_UPLOAD_BASE = "https://upload.heygen.com";

function getHeaders(apiKey: string): HeadersInit {
  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

export async function uploadAudio(
  apiKey: string,
  audioBuffer: ArrayBuffer,
  filename: string
): Promise<{ asset_id: string }> {
  const response = await fetch(`${HEYGEN_UPLOAD_BASE}/v1/asset`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "audio/mpeg",
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen audio upload failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  // HeyGen wraps response in { code, data: { id, name, ... } }
  const assetId = data.data?.id || data.data?.asset_id || data.asset_id;
  if (!assetId) {
    throw new Error(`No asset_id in response: ${JSON.stringify(data)}`);
  }
  return { asset_id: assetId };
}

export async function createTalkingPhoto(
  apiKey: string,
  imageBase64: string
): Promise<{ talking_photo_id: string }> {
  const response = await fetch(`${HEYGEN_API_BASE}/v1/talking_photo/create`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      image_base64: imageBase64,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen create talking photo failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const tpId = data.data?.talking_photo_id || data.data?.id || data.talking_photo_id;
  if (!tpId) {
    throw new Error(`No talking_photo_id in response: ${JSON.stringify(data)}`);
  }
  return { talking_photo_id: tpId };
}

export async function listAvatarLooks(
  apiKey: string,
  ownership: "public" | "private" = "private"
): Promise<{ avatars: Array<{ id: string; name: string; preview_image_url: string | null; supported_api_engines: string[] }> }> {
  const response = await fetch(`${HEYGEN_API_BASE}/v3/avatars/looks?ownership=${ownership}&limit=50`, {
    method: "GET",
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen list avatar looks failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const looks = data.data || [];
  return {
    avatars: looks.map((look: any) => ({
      id: look.id,
      name: look.name,
      preview_image_url: look.preview_image_url || null,
      supported_api_engines: look.supported_api_engines || [],
    })),
  };
}

export async function generateVideoV3(
  apiKey: string,
  options: {
    avatarId: string;
    audioAssetId: string;
    engine?: "avatar_iv" | "avatar_v";
  }
): Promise<{ video_id: string }> {
  const engine = options.engine || "avatar_iv";

  const response = await fetch(`${HEYGEN_API_BASE}/v3/videos`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      type: "avatar",
      avatar_id: options.avatarId,
      audio_asset_id: options.audioAssetId,
      engine: { type: engine },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen generate video v3 failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const videoId = data.data?.video_id || data.video_id;
  if (!videoId) {
    throw new Error(`No video_id in response: ${JSON.stringify(data)}`);
  }
  return { video_id: videoId };
}

export async function generateVideoWithTalkingPhoto(
  apiKey: string,
  options: {
    talkingPhotoId: string;
    audioAssetId: string;
  }
): Promise<{ video_id: string }> {
  const response = await fetch(`${HEYGEN_API_BASE}/v2/video/generate`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "talking_photo",
            talking_photo_id: options.talkingPhotoId,
            use_avatar_iv_model: true,
          },
          voice: {
            type: "audio",
            audio_asset_id: options.audioAssetId,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen generate video (talking photo) failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const videoId = data.data?.video_id || data.data?.id || data.video_id;
  if (!videoId) {
    throw new Error(`No video_id in response: ${JSON.stringify(data)}`);
  }
  return { video_id: videoId };
}

export async function getVideoStatus(
  apiKey: string,
  videoId: string
): Promise<{ status: string; video_url?: string; error?: string }> {
  const response = await fetch(
    `${HEYGEN_API_BASE}/v1/video_status.get?video_id=${videoId}`,
    {
      method: "GET",
      headers: { "x-api-key": apiKey },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen video status failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const result = data.data || data;
  return {
    status: result.status,
    video_url: result.video_url,
    error: result.error,
  };
}

export async function testConnection(apiKey: string): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    const cleanKey = apiKey.trim();

    const response = await fetch(`${HEYGEN_API_BASE}/v1/video_status.get?video_id=test`, {
      method: "GET",
      headers: { "x-api-key": cleanKey },
    });

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: "Clé API refusée par HeyGen. Vérifiez qu'elle est correcte et active." };
    }

    if (response.status === 400) {
      return { success: true, warning: "API accessible (video_id de test invalide, c'est normal)." };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur de connexion" };
  }
}
