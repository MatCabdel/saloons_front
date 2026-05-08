import * as L from 'leaflet';

// Expose L globally so leaflet plugins (markercluster) can find it
(window as any).L = L;

export { L };
