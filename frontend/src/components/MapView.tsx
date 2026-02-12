'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Placeholder markers for demo
const markers = [
  { lat: 0.3476, lng: 32.5825, name: 'School Building - Uganda' },
  { lat: -1.2921, lng: 36.8219, name: 'Community Center - Kenya' },
  { lat: 2.0469, lng: 45.3182, name: 'Water Project - Somalia' },
  { lat: 6.5244, lng: 3.3792, name: 'Youth Program - Nigeria' },
];

export default function MapView() {
  return (
    <div className="rounded-xl overflow-hidden border border-green-100 h-[400px]">
      <MapContainer center={[5, 25]} zoom={3} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={icon}>
            <Popup>{m.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
