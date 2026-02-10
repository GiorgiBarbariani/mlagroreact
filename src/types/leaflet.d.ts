import 'leaflet';
import 'leaflet-draw';

declare module 'leaflet' {
  namespace GeometryUtil {
    function geodesicArea(latlngs: L.LatLng[]): number;
  }

  namespace Control {
    interface DrawConstructorOptions {
      position?: string;
      draw?: any;
      edit?: any;
    }

    class Draw extends Control {
      constructor(options?: DrawConstructorOptions);
    }
  }

  namespace Draw {
    namespace Event {
      const CREATED: string;
      const EDITED: string;
      const DELETED: string;
      const DRAWSTART: string;
      const DRAWSTOP: string;
      const DRAWVERTEX: string;
      const EDITSTART: string;
      const EDITMOVE: string;
      const EDITRESIZE: string;
      const EDITVERTEX: string;
      const EDITSTOP: string;
      const DELETESTART: string;
      const DELETESTOP: string;
    }
  }
}

declare module 'leaflet-geometryutil' {
  export = L;
}