"use client";

import React, { useEffect, useRef, useState } from "react";
import outfitService from "@/services/outfit.service";

type Message = {
  id: string;
  text: string;
  from: "user" | "bot";
};

type OutfitCombo = {
  combo_name: string;
  items: Array<{ id: string; name: string; price?: string; reason?: string }>;
  size_advice?: string;
};

// Logo SVG AI Sparkle Hiện Đại thay cho Emoji cũ
const BotLogo = () => (
  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 text-white animate-pulse"
    >
      <path d="M11.645 2.091a.75.75 0 0 1 .71 0l7.5 4.135a.75.75 0 0 1 .404.661v8.226a.75.75 0 0 1-.404.661l-7.5 4.135a.75.75 0 0 1-.71 0l-7.5-4.135A.75.75 0 0 1 4 15.113V6.887a.75.75 0 0 1 .404-.661l7.5-4.135ZM12 4.195 5.5 7.781l6.5 3.585 6.5-3.585L12 4.195Zm6.5 4.732-6 3.31v6.868l6-3.31V8.927Zm-7.5 10.178v-6.869l-6-3.31v6.868l6 3.31Z" />
    </svg>
  </div>
);

export default function OutfitChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [combos, setCombos] = useState<OutfitCombo[] | null>(null);
  const pollRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn xuống khi có tin nhắn mới hoặc đang load
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, combos, loading]);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const addMessage = (text: string, from: "user" | "bot") => {
    setMessages((m) => [
      ...m,
      { id: String(Date.now()) + Math.random(), text, from },
    ]);
  };

  const renderCombos = (data: any) => {
    const list: OutfitCombo[] =
      data?.outfit_combos || data?.result?.outfit_combos || null;
    if (Array.isArray(list)) {
      setCombos(list as OutfitCombo[]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    addMessage(text, "user");
    setInput("");
    setLoading(true);
    setCombos(null);
    setProgress(0);

    try {
      const rid = await outfitService.createRequestId();
      setRequestId(rid);
      addMessage(
        "Đang tiếp nhận thông tin và phân tích vóc dáng của bạn...",
        "bot",
      );
      const res = await outfitService.sendQuery(rid, text);

      if (res?.natural_response) addMessage(res.natural_response, "bot");
      renderCombos(res);

      pollRef.current = window.setInterval(async () => {
        try {
          const p = await outfitService.getProgress(rid);
          const prog = typeof p?.progress === "number" ? p.progress : null;
          setProgress(prog);
          if (p?.finished_at || prog === 100) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            setLoading(false);
            setProgress(null);

            if (p?.outfit_combos || p?.natural_response) {
              if (p.natural_response) addMessage(p.natural_response, "bot");
              renderCombos(p);
            } else {
              try {
                const final = await outfitService.sendQuery(rid, text);
                if (final?.natural_response)
                  addMessage(final.natural_response, "bot");
                renderCombos(final);
              } catch (e) {}
            }
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 1500);
    } catch (err: any) {
      addMessage("Hệ thống gặp gián đoạn: " + (err?.message || err), "bot");
      setLoading(false);
      setProgress(null);
    }
  };

  const handleCancel = async () => {
    if (!requestId) return;
    try {
      await outfitService.cancel(requestId);
      addMessage("Đã hủy yêu cầu tìm kiếm trang phục.", "bot");
      setLoading(false);
      setProgress(null);
      if (pollRef.current) window.clearInterval(pollRef.current);
      setRequestId(null);
    } catch (e) {
      addMessage("Hủy không thành công.", "bot");
    }
  };

  return (
    <div aria-live="polite" className="font-sans antialiased">
      <div className="fixed right-6 bottom-6 z-50">
        {open ? (
          <div className="w-[400px] max-w-[calc(100vw-2rem)] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
            {/* Header Gradient quyến rũ hơn */}
            <div className="relative p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white shadow-md flex-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BotLogo />
                  <div>
                    <div className="font-bold text-sm tracking-wide">
                      Trợ Lý Phối Đồ AI
                    </div>
                    <div className="text-xs text-pink-100/90 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                      Sẵn sàng gợi ý style riêng cho bạn
                    </div>
                  </div>
                </div>

                <button
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
                  onClick={() => setOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Thanh Progress bar tinh tế ngay cạnh dưới Header */}
              {loading && progress !== null && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 to-emerald-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Vùng nội dung tin nhắn thoáng và sạch sẽ */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center text-xl dark:bg-slate-800">
                    ✨
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Xin chào bạn!
                  </p>
                  <p className="text-xs text-slate-400 max-w-[240px]">
                    Hãy chia sẻ chiều cao, cân nặng, vóc dáng hoặc phong cách
                    bạn muốn hướng tới nhé.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                      ${
                        m.from === "user"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-tl-none"
                      }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Giao diện hiển thị các Set đồ phối đẹp mắt */}
              {combos && combos.length > 0 && (
                <div className="space-y-4 pt-2">
                  {combos.map((c, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-100 dark:border-slate-700/60 rounded-2xl p-4 bg-white dark:bg-slate-800 shadow-md transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                        <span className="text-base">💡</span> {c.combo_name}
                      </div>

                      <div className="mt-3 space-y-3">
                        {c.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-start gap-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                          >
                            {/* Mockup Clothes Icon */}
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 text-purple-500 flex items-center justify-center flex-none border border-purple-100/50 dark:border-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9.813 15.904 9 21m3.625-5.096L13.5 21m-1.302-4.961a1.5 1.5 0 1 1-1.025-1.025 1.5 1.5 0 1 1 1.025 1.025ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {it.name}
                                </span>
                                {it.price && (
                                  <span className="text-[11px] font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/40 dark:text-pink-400 px-2 py-0.5 rounded-full flex-none">
                                    {it.price}đ
                                  </span>
                                )}
                              </div>
                              {it.reason && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                                  {it.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {c.size_advice && (
                        <div className="mt-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 flex items-start gap-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 p-2 rounded-xl">
                          <span className="flex-none">📏</span>
                          <div>
                            <span className="font-semibold">Tư vấn size:</span>{" "}
                            {c.size_advice}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area chuyên nghiệp */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-none">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-purple-400/50 transition-all">
                <input
                  className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-slate-100 focus:outline-none pl-1 py-1.5"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ví dụ: Nam, 1m75, phối đồ đi tiệc cưới..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className={`h-9 px-4 rounded-full text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm
                    ${
                      loading
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 active:scale-95"
                    }`}
                  onClick={handleSend}
                  disabled={loading}
                >
                  <span>{loading ? "Đang xử lý" : "Gợi ý"}</span>
                  {!loading && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925a1.5 1.5 0 0 0 1.094 1.04l4.215 1.054a.25.25 0 0 1 0 .485L4.787 11.8a1.5 1.5 0 0 0-1.094 1.04l-1.414 4.925a.75.75 0 0 0 .826.95l14.055-6a.75.75 0 0 0 0-1.382l-14.055-6Z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Vùng hiển thị tiến trình hủy hoặc trạng thái bên dưới */}
              {(progress !== null || requestId) && (
                <div className="flex items-center justify-between mt-2 px-2 text-[11px]">
                  <div className="text-slate-400 font-medium">
                    {progress !== null ? `Tiến trình: ${progress}%` : ""}
                  </div>
                  {requestId && loading && (
                    <button
                      className="text-red-500 font-semibold hover:underline flex items-center gap-0.5"
                      onClick={handleCancel}
                    >
                      🛑 Hủy yêu cầu
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Nút kích hoạt Chatbot dạng Tròn đồng điệu */
          <button
            title="Mở chatbot gợi ý phối đồ"
            onClick={() => setOpen(true)}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group relative"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-7 h-7 group-hover:rotate-12 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 21m3.625-5.096L13.5 21m-1.302-4.961a1.5 1.5 0 1 1-1.025-1.025 1.5 1.5 0 1 1 1.025 1.025ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></span>
          </button>
        )}
      </div>
    </div>
  );
}
