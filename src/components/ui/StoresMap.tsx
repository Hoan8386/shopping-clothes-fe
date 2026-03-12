"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface StoreMapItem {
  id: number;
  tenCuaHang: string;
  diaChi: string;
  soDienThoai: string;
  email: string;
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface RouteSummary {
  distanceKm: number;
  durationMinutes: number;
}

interface StoresMapProps {
  stores: StoreMapItem[];
  selectedStoreId?: number | null;
  userLocation?: UserLocation | null;
  onSelectStore?: (storeId: number) => void;
  onRouteSummaryChange?: (summary: RouteSummary | null) => void;
}

interface OsrmRouteResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }[];
}

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const userIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitToStores({ stores }: { stores: StoreMapItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (stores.length === 0) return;
    if (stores.length === 1) {
      map.setView([stores[0].latitude, stores[0].longitude], 15);
      return;
    }

    const bounds = L.latLngBounds(
      stores.map(
        (store) => [store.latitude, store.longitude] as [number, number],
      ),
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, stores]);

  return null;
}

function FitToRoute({
  route,
  selectedStore,
  userLocation,
}: {
  route: [number, number][];
  selectedStore?: StoreMapItem;
  userLocation?: UserLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [40, 40] });
      return;
    }

    if (userLocation && selectedStore) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        [selectedStore.latitude, selectedStore.longitude],
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, route, selectedStore, userLocation]);

  return null;
}

export default function StoresMap({
  stores,
  selectedStoreId,
  userLocation,
  onSelectStore,
  onRouteSummaryChange,
}: StoresMapProps) {
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  const selectedStore = useMemo(
    () => stores.find((item) => item.id === selectedStoreId),
    [selectedStoreId, stores],
  );

  useEffect(() => {
    const fetchRoute = async () => {
      if (!selectedStore || !userLocation) {
        setRoutePath([]);
        onRouteSummaryChange?.(null);
        return;
      }

      const url =
        `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${selectedStore.longitude},${selectedStore.latitude}` +
        "?overview=full&geometries=geojson";

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch route");

        const data: OsrmRouteResponse = await response.json();
        const firstRoute = data.routes?.[0];

        if (!firstRoute) {
          setRoutePath([]);
          onRouteSummaryChange?.(null);
          return;
        }

        setRoutePath(
          firstRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        );
        onRouteSummaryChange?.({
          distanceKm: firstRoute.distance / 1000,
          durationMinutes: firstRoute.duration / 60,
        });
      } catch {
        setRoutePath([]);
        onRouteSummaryChange?.(null);
      }
    };

    fetchRoute();
  }, [onRouteSummaryChange, selectedStore, userLocation]);

  return (
    <MapContainer
      center={[10.7769, 106.7009]}
      zoom={12}
      style={{ height: "520px", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        >
          <Popup>
            <p className="text-sm font-semibold">Vị trí của bạn</p>
          </Popup>
        </Marker>
      )}
      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.latitude, store.longitude]}
          eventHandlers={{
            click: () => onSelectStore?.(store.id),
          }}
        >
          <Popup>
            <div className="space-y-1 min-w-45">
              <p className="font-semibold text-sm">{store.tenCuaHang}</p>
              <p className="text-xs text-gray-600">{store.diaChi}</p>
              {store.soDienThoai && (
                <p className="text-xs">SĐT: {store.soDienThoai}</p>
              )}
              {store.email && <p className="text-xs">Email: {store.email}</p>}
              <button
                type="button"
                onClick={() => onSelectStore?.(store.id)}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Chọn cửa hàng này
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      {routePath.length > 0 && (
        <Polyline
          positions={routePath}
          pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.8 }}
        />
      )}
      <FitToStores stores={stores} />
      <FitToRoute
        route={routePath}
        selectedStore={selectedStore}
        userLocation={userLocation}
      />
    </MapContainer>
  );
}
