"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiNavigation,
  FiCrosshair,
  FiClock,
} from "react-icons/fi";
import Loading from "@/components/ui/Loading";
import { cuaHangService } from "@/services/common.service";
import { CuaHang } from "@/types";
import {
  RouteSummary,
  StoreMapItem,
  UserLocation,
} from "@/components/ui/StoresMap";

const StoresMap = dynamic(() => import("@/components/ui/StoresMap"), {
  ssr: false,
  loading: () => <div className="h-130 rounded-2xl bg-section animate-pulse" />,
});

function parseCoordinates(
  store: CuaHang,
): { latitude: number; longitude: number } | null {
  if (
    typeof store.latitude === "number" &&
    typeof store.longitude === "number"
  ) {
    return { latitude: store.latitude, longitude: store.longitude };
  }

  if (!store.viTri || !store.viTri.includes(",")) return null;

  const parts = store.viTri.split(",");
  const latitude = Number(parts[0]?.trim());
  const longitude = Number(parts[1]?.trim());

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return { latitude, longitude };
}

export default function GuestStoresPage() {
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await cuaHangService.getAll();
        setStores(Array.isArray(data) ? data : []);
      } catch {
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const storesWithCoords = useMemo<StoreMapItem[]>(() => {
    return stores
      .map((store) => {
        const coords = parseCoordinates(store);
        if (!coords) return null;

        return {
          id: store.id,
          tenCuaHang: store.tenCuaHang,
          diaChi: store.diaChi,
          soDienThoai: store.soDienThoai,
          email: store.email,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      })
      .filter((store): store is StoreMapItem => store !== null);
  }, [stores]);

  const nearestStore = useMemo(() => {
    if (!userLocation || storesWithCoords.length === 0) return null;

    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const distanceInKm = (from: UserLocation, to: StoreMapItem) => {
      const earthRadius = 6371;
      const deltaLat = toRadians(to.latitude - from.latitude);
      const deltaLng = toRadians(to.longitude - from.longitude);
      const lat1 = toRadians(from.latitude);
      const lat2 = toRadians(to.latitude);

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.sin(deltaLng / 2) *
          Math.sin(deltaLng / 2) *
          Math.cos(lat1) *
          Math.cos(lat2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return earthRadius * c;
    };

    return storesWithCoords.reduce<{
      store: StoreMapItem;
      distanceKm: number;
    } | null>((closest, store) => {
      const distanceKm = distanceInKm(userLocation, store);
      if (!closest || distanceKm < closest.distanceKm) {
        return { store, distanceKm };
      }

      return closest;
    }, null);
  }, [storesWithCoords, userLocation]);

  const requestUserLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(currentLocation);
        setIsLocating(false);
      },
      (error) => {
        setLocationError(
          error.message || "Không thể lấy vị trí hiện tại của bạn.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const selectNearestStore = () => {
    if (!nearestStore) return;
    setSelectedStoreId(nearestStore.store.id);
  };

  if (loading) return <Loading />;

  return (
    <>
      <section className="bg-section py-8 text-center">
        <h1 className="text-3xl font-extrabold text-foreground mb-1">
          Hệ thống cửa hàng
        </h1>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Cửa hàng</span>
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-subtle rounded-2xl p-5">
            <h2 className="text-lg font-bold text-foreground">
              Danh sách cửa hàng
            </h2>
            <p className="text-sm text-muted mt-1">
              Tổng cộng: {stores.length} cửa hàng
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={requestUserLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 rounded-lg border border-subtle px-3 py-2 text-sm font-medium text-foreground hover:border-accent/40 disabled:opacity-60"
              >
                <FiCrosshair />
                {isLocating ? "Đang lấy vị trí..." : "Lấy vị trí của tôi"}
              </button>

              <button
                type="button"
                onClick={selectNearestStore}
                disabled={!nearestStore}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                <FiNavigation />
                Tìm cửa hàng gần nhất
              </button>
            </div>

            {locationError && (
              <p className="mt-2 text-sm text-red-500">{locationError}</p>
            )}

            {nearestStore && (
              <p className="mt-2 text-sm text-muted">
                Gần nhất:{" "}
                <span className="font-semibold text-foreground">
                  {nearestStore.store.tenCuaHang}
                </span>{" "}
                ({nearestStore.distanceKm.toFixed(2)} km)
              </p>
            )}

            {selectedStoreId && routeSummary && (
              <div className="mt-3 rounded-xl bg-section px-3 py-2 text-sm text-muted">
                <p className="flex items-center gap-2">
                  <FiNavigation />
                  Quãng đường: {routeSummary.distanceKm.toFixed(2)} km
                </p>
                <p className="mt-1 flex items-center gap-2">
                  <FiClock />
                  Thời gian dự kiến: {Math.ceil(
                    routeSummary.durationMinutes,
                  )}{" "}
                  phút
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
            {stores.length === 0 && (
              <div className="bg-card border border-subtle rounded-2xl p-6 text-center text-muted">
                Không có cửa hàng nào.
              </div>
            )}

            {stores.map((store) => {
              const coords = parseCoordinates(store);

              return (
                <article
                  key={store.id}
                  className={`bg-card border rounded-2xl p-5 transition ${
                    selectedStoreId === store.id
                      ? "border-accent shadow-[0_0_0_1px_rgba(36,99,235,0.25)]"
                      : "border-subtle hover:border-accent/40"
                  }`}
                >
                  <h3 className="font-semibold text-foreground text-base mb-2">
                    {store.tenCuaHang}
                  </h3>

                  <div className="space-y-2 text-sm text-muted">
                    <p className="flex items-start gap-2">
                      <FiMapPin className="mt-0.5 shrink-0" />
                      <span>{store.diaChi || "Chưa có địa chỉ"}</span>
                    </p>

                    {store.soDienThoai && (
                      <p className="flex items-center gap-2">
                        <FiPhone className="shrink-0" />
                        <span>{store.soDienThoai}</span>
                      </p>
                    )}

                    {store.email && (
                      <p className="flex items-center gap-2">
                        <FiMail className="shrink-0" />
                        <span>{store.email}</span>
                      </p>
                    )}

                    <p className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                      <FiNavigation className="shrink-0" />
                      <span>
                        {coords
                          ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
                          : "Chưa có tọa độ"}
                      </span>
                    </p>

                    {coords && (
                      <button
                        type="button"
                        onClick={() => setSelectedStoreId(store.id)}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-subtle px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent/40"
                      >
                        <FiNavigation />
                        Chỉ đường đến đây
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-card border border-subtle rounded-2xl p-3">
            {storesWithCoords.length > 0 ? (
              <StoresMap
                stores={storesWithCoords}
                selectedStoreId={selectedStoreId}
                userLocation={userLocation}
                onSelectStore={setSelectedStoreId}
                onRouteSummaryChange={setRouteSummary}
              />
            ) : (
              <div className="h-130 rounded-2xl bg-section flex items-center justify-center text-muted text-sm">
                Không có dữ liệu tọa độ để hiển thị bản đồ.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
