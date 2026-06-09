// Force using the external outfit AI service URL from env
const OUTFIT_API_BASE = (process.env.NEXT_PUBLIC_OUTFIT_API_URL || "https://matchbook-unafraid-glitzy.ngrok-free.dev/api/v1/outfits").replace(/\/+$/, "");

const createRequestId = async (): Promise<string> => {
  const res = await fetch(`${OUTFIT_API_BASE}/request-id`, {
    method: "POST",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Không lấy được request_id: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.request_id || data.requestId || "";
};

type OutfitProgressResponse = {
  status?: string;
  stage?: string;
  progress?: number;
  result?: unknown;
  error?: string | null;
  [key: string]: unknown;
};

const sendQuery = async (request_id: string, user_query: string): Promise<unknown> => {
  const payload = { request_id, user_query };
  const res = await fetch(`${OUTFIT_API_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Outfit API error: ${res.status} ${txt}`);
  }
  return await res.json();
};

const getProgress = async (request_id: string): Promise<OutfitProgressResponse> => {
  const res = await fetch(`${OUTFIT_API_BASE}/progress/${encodeURIComponent(request_id)}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Không thể lấy tiến độ: ${res.status} ${txt}`);
  }
  return await res.json();
};

const cancel = async (request_id: string): Promise<unknown> => {
  const res = await fetch(`${OUTFIT_API_BASE}/cancel/${encodeURIComponent(request_id)}`, {
    method: "POST",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cancel failed: ${res.status} ${txt}`);
  }
  return await res.json();
};

const outfitService = {
  createRequestId,
  sendQuery,
  getProgress,
  cancel,
};

export default outfitService;
