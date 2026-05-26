document.addEventListener('DOMContentLoaded', () => {
    const mapEl = document.getElementById('mapa');
    if (!mapEl || typeof L === 'undefined') return;

    const puntos = (window.__REPORTES__ || []).filter(r =>
        Number.isFinite(Number(r.latitud)) && Number.isFinite(Number(r.longitud))
    );

    const center = puntos.length > 0
        ? [Number(puntos[0].latitud), Number(puntos[0].longitud)]
        : [-21.5355, -64.7296];

    const mapa = L.map('mapa').setView(center, puntos.length > 0 ? 13 : 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa);

    puntos.forEach((reporte) => {
        const lat = Number(reporte.latitud);
        const lng = Number(reporte.longitud);
        const popup = `
      <strong>${reporte.titulo || 'Reporte'}</strong><br/>
      ${reporte.zona || ''}<br/>
      Estado: ${(reporte.estado || '').replace('_', ' ')}
    `;
        L.marker([lat, lng]).addTo(mapa).bindPopup(popup);
    });
});
