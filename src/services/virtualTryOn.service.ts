const VTO_API_BASE = (
  // process.env.NEXT_PUBLIC_VTO_API_BASE_URL || 
  "https://walk-outmatch-umpire.ngrok-free.dev/api/v1"
).replace(/\/+$/, "");

const requestJson = async (input: RequestInfo | URL, init: RequestInit) => {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw await res.json();
  }
  return await res.json();
};

export const virtualTryOnService = {
  checkPerson: async (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    return await requestJson(`${VTO_API_BASE}/check/person`, {
      method: "POST",
      body: formData,
    });
  },

  createRequestId: async () => {
    return await requestJson(`${VTO_API_BASE}/virtual-try-on/request-id`, {
      method: "POST",
    });
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

    return await requestJson(`${VTO_API_BASE}/virtual-try-on/process`, {
      method: "POST",
      body: formData,
    });
  },

  getProgress: async (requestId: string) => {
    return await requestJson(`${VTO_API_BASE}/virtual-try-on/progress/${requestId}`, {
      method: "GET",
    });
  },

  cancel: async (requestId: string) => {
    return await requestJson(`${VTO_API_BASE}/virtual-try-on/cancel/${requestId}`, {
      method: "POST",
    });
  },

  getResultUrl: (fileName: string) =>
    `${VTO_API_BASE}/virtual-try-on/result/${fileName}`,
};