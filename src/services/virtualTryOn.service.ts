const VTO_API_BASE = (
  process.env.NEXT_PUBLIC_VTO_API_BASE_URL ||
  "http://127.0.0.1:8001/api/v1"
).replace(/\/+$/, "");

const VTO_API_KEY = process.env.NEXT_PUBLIC_VTO_API_KEY || "";

const withApiKey = (headers?: HeadersInit) => ({
  ...(headers || {}),
  ...(VTO_API_KEY ? { "x-api-key": VTO_API_KEY } : {}),
});

export const virtualTryOnService = {
  checkPerson: async (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(`${VTO_API_BASE}/check/person`, {
      method: "POST",
      headers: withApiKey(),
      body: formData,
    });

    if (!res.ok) {
      throw await res.json();
    }

    return await res.json();
  },

  createRequestId: async () => {
    const res = await fetch(`${VTO_API_BASE}/virtual-try-on/request-id`, {
      method: "POST",
      headers: withApiKey(),
    });

    if (!res.ok) {
      throw await res.json();
    }

    return await res.json();
  },

  process: async (params: {
    requestId: string;
    personFile: File;
    garmentFile: File;
    category?: "tops" | "bottoms" | "one-pieces";
  }) => {
    const formData = new FormData();
    formData.append("request_id", params.requestId);
    formData.append("person_img", params.personFile);
    formData.append("garment_img", params.garmentFile);
    formData.append("category", params.category || "bottoms");

    const res = await fetch(`${VTO_API_BASE}/virtual-try-on/process`, {
      method: "POST",
      headers: withApiKey(),
      body: formData,
    });

    if (!res.ok) {
      throw await res.json();
    }

    return await res.json();
  },

  getProgress: async (requestId: string) => {
    const res = await fetch(`${VTO_API_BASE}/virtual-try-on/progress/${requestId}`, {
      method: "GET",
      headers: withApiKey(),
    });

    if (!res.ok) {
      throw await res.json();
    }

    return await res.json();
  },

  cancel: async (requestId: string) => {
    const res = await fetch(`${VTO_API_BASE}/virtual-try-on/cancel/${requestId}`, {
      method: "POST",
      headers: withApiKey(),
    });

    if (!res.ok) {
      throw await res.json();
    }

    return await res.json();
  },

  getResultUrl: (fileName: string) =>
    `${VTO_API_BASE}/virtual-try-on/result/${fileName}`,
};
