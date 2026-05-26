document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('mapa-general');
  if (!mapEl || typeof L === 'undefined') return;

  const puntos = (window.__REPORTES__ || []).filter((r) =>
    Number.isFinite(Number(r.latitud)) && Number.isFinite(Number(r.longitud))
  );

  const center = puntos.length > 0
    ? [Number(puntos[0].latitud), Number(puntos[0].longitud)]
    : [-21.5355, -64.7296];

  const mapa = L.map(mapEl.id).setView(center, puntos.length > 0 ? 13 : 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapa);

  const bounds = [];
  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  puntos.forEach((reporte) => {
    const lat = Number(reporte.latitud);
    const lng = Number(reporte.longitud);

    const popup = `
      <strong>${escapeHtml(reporte.titulo || 'Reporte')}</strong><br/>
      Estado: ${escapeHtml((reporte.estado || '').replace('_', ' '))}<br/>
      ${reporte.zona ? `Zona: ${escapeHtml(reporte.zona)}<br/>` : ''}
      <a href="/reportes/${encodeURIComponent(String(reporte.id || ''))}">Ver detalle</a>
    `;

    L.marker([lat, lng]).addTo(mapa).bindPopup(popup);
    bounds.push([lat, lng]);
  });

  if (bounds.length > 0) {
    mapa.fitBounds(bounds, { padding: [22, 22] });
  }
});
