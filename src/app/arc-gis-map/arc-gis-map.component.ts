import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { loadModules } from "esri-loader";
import { Observable, Subscription } from 'rxjs'
import { NewPoints } from '../add-points-dialog/new-points.model';
import { NewFeature, FeatureAttributes, FeatureGeometry } from '../arc-gis-map/new-feature.model';
import { EasyTrackFeatureService } from '../easy-track-feature.service'

@Component({
  selector: 'app-arc-gis-map',
  templateUrl: './arc-gis-map.component.html',
  styleUrls: ['./arc-gis-map.component.less']
})
export class ArcGisMapComponent implements OnInit {

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  private map: any;
  private view: any;
  private featureLayer: any;
  private graphicsLayer: any;

  private addPointsSubscription: Subscription;
  @Input() events: Observable<NewPoints>;

  private queryChangedSubscription: Subscription;
  @Input() queries: Observable<string>;

  private followMeChangedSubscription: Subscription;
  @Input() follows: Observable<boolean>;
  private followInterval: any;

  constructor(
    private featureService: EasyTrackFeatureService) { }
  
  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [Map, MapView] = await loadModules(["esri/Map", "esri/views/MapView"]);

      // Configure the Map
      const mapProperties = {
        basemap: "streets"
      };

      this.map = new Map(mapProperties);

      const lastPosition = this.featureService.getLastPosition();

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: lastPosition && lastPosition.longitude && lastPosition.latitude ? [lastPosition.longitude, lastPosition.latitude] : [0.1278, 51.5074],
        zoom: 10,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      if (!this.featureService.isLoggedIn()) {
        await this.featureService.generateToken().toPromise();
      }

      await this.addEasyTrackFeatureLayer();

      await this.addEasyTrackGraphicsLayer();

    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  async addEasyTrackFeatureLayer() {
    const self = this;

    const [FeatureLayer, esriId] = await loadModules(["esri/layers/FeatureLayer", "esri/identity/IdentityManager"]);

    esriId.registerToken({
      expires: this.featureService.getExpires().getTime(),
      server: "https://www.arcgis.com/sharing/rest",
      token: this.featureService.getToken()
    });

    this.featureLayer = new FeatureLayer({
      url: "https://services2.arcgis.com/MqHf9wrWjblgLZWc/arcgis/rest/services/easytrack/FeatureServer/0",
      outFields: ["*"], 
      renderer: {
        type: "simple",                    // autocasts as new SimpleRenderer()
        symbol: {                          // autocasts as new SimpleMarkerSymbol()
          type: "simple-marker",
          color: [226, 119, 40],  // orange
          outline: {              
						color: [255, 255, 255], // white
            width: 1
          }
        }
      },
      popupTemplate: {                     // autocasts as new PopupTemplate()
        title: "{projectName} | {ID} | {pointDescription}",
        content: [{
          type: "fields",
          fieldInfos: [
            {
              fieldName: "ID",
              label: "ID",
              visible: true
            },
            {
              fieldName: "projectName",
              label: "Project Name",
              visible: true
            },
            {
              fieldName: "projectDescription",
              label: "Project Description",
              visible: true
            },
            {
              fieldName: "pointDescription",
              label: "Point Description",
              visible: true
            },
            {
              fieldName: "northing",
              label: "Northing",
              visible: true
            },
            {
              fieldName: "easting",
              label: "Easting",
              visible: true
            },
            {
              fieldName: "elevation",
              label: "Elevation",
              visible: true
            },
            {
              fieldName: "ObjectID",
              label: "Object ID",
              visible: true
            }
          ]
        }]
      }
    });
    
    this.map.add(this.featureLayer);

    // this.view.whenLayerView(this.featureLayer).then(function(layerView){
    //   layerView.watch("updating", function(val){
    //     if(!val){  // wait for the layer view to finish updating
    //       layerView.queryFeatures().then(function(results){
    //         console.log(results);  // prints all the client-side features to the console
    //         if (results.features.length) {
    //           self.moveMapTo(results.features.map(feature => { return { geometry: { x: feature.geometry.longitude, y: feature.geometry.latitude}}}), self.view);
    //         }
    //       });
    //     }
    //   });
    // });
  }

  async addEasyTrackGraphicsLayer() {
    var self = this;

    const [GraphicsLayer] = await loadModules(["esri/layers/GraphicsLayer"]);

    this.graphicsLayer = new GraphicsLayer();
		this.map.add(this.graphicsLayer);

    this.featureService.getPosition()
        .then(location => {
          self.moveMapToCenter([location.longitude, location.latitude]);
          self.updateCurrentLocation(location.longitude, location.latitude);
        });
  }

  ngOnInit() : void {
    var self = this;
    this.initializeMap();

    this.addPointsSubscription = this.events.subscribe((data: NewPoints) => {
      this.addFeatures(data, this.map, this.view).then(features => this.moveMapTo(features, this.view));
    });

    this.queryChangedSubscription = this.queries.subscribe((query: string) => {
      this.setFeatureLayerFilter(query);
    });

    this.followMeChangedSubscription = this.follows.subscribe((follow: boolean) => {
      this.followInterval && clearInterval(this.followInterval);
      if (follow) {
        this.followInterval = setInterval(() => {
          this.featureService.getPosition()
            .then(location => {
              self.updateCurrentLocation(location.longitude, location.latitude);
            });
        }, 10000)
      }
    });
  }

  ngOnDestroy() : void {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
    this.addPointsSubscription.unsubscribe();
    this.queryChangedSubscription.unsubscribe();
    this.followMeChangedSubscription.unsubscribe();
  }

  private async addFeatures(data: NewPoints, map: any, view: any) {
    console.log("Adding features");

    const [coordinateFormatter] = await loadModules(["esri/geometry/coordinateFormatter"]);

    await coordinateFormatter.load();

    const features = data.fileContent.split('\n').filter(line => line != null && line.length).map((line, i) => {
    
      console.log(`Data: ${line}`);
      const lineParts = line.split(',');
      const id = lineParts[0];
      const northing = lineParts[1];
      const northingInteger = northing.indexOf('.') ? northing.split('.')[0] : northing;
      const easting = lineParts[2];
      const eastingInteger = easting.indexOf('.') ? easting.split('.')[0] : easting;
      const elevation = lineParts[3];
      const description = lineParts[4];

      const utmCoordinates = `${data.utmZone}U ${eastingInteger} ${northingInteger}`;
      console.log(`Point in UTM Coordinates: ${utmCoordinates}`);

      const point = coordinateFormatter.fromUtm(utmCoordinates, null, "latitude-band-indicators");
      console.log(point);

      const feature = new NewFeature();
      feature.attributes = new FeatureAttributes();
      feature.attributes.ID = id;
      feature.attributes.projectName = data.name;
      feature.attributes.projectDescription = data.description;
      feature.attributes.pointDescription = description;
      feature.attributes.northing = northing;
      feature.attributes.easting = easting;
      feature.attributes.elevation = elevation;
      feature.geometry = new FeatureGeometry(point.longitude, point.latitude);
      
      return feature;
    });

    const result = await this.featureService.addFeatures(features).toPromise();
    console.log(result);

    return features;
  }

  private moveMapToCenter(center, duration = 5000, zoom = 12) {
    var opts = {
      duration: duration  // Duration of animation
    };
    
    this.view.goTo({
      center: center,
      zoom: zoom
    }, opts);
  }

  private async moveMapTo(features: NewFeature[], view, duration = 5000, zoom = 12) {

    const [Graphic] = await loadModules(["esri/Graphic"]);

    var opts = {
      duration: duration  // Duration of animation
    };
    
    view.goTo({
      target: features.map(feature => new Graphic({
        geometry: {
          type: "point",
          longitude: feature.geometry.x,
          latitude: feature.geometry.y
        }
      })),
      zoom: zoom
    }, opts);
  }

  private setFeatureLayerFilter(query: string) {
    this.featureLayer.definitionExpression = !query ? '' : `pointDescription LIKE '%${query}%' OR projectName LIKE '%${query}%' OR projectDescription LIKE '%${query}%' OR ID LIKE '%${query}%'`;
  }

  private async updateCurrentLocation(longitude, latitude) {
    const [Graphic] = await loadModules(["esri/Graphic"]);

    let point = {
      type: "point",
      longitude: longitude,
      latitude: latitude
    };

    let simpleMarkerSymbol = {
      type: "simple-marker",
      color: "#3f51b5",  // blue
      outline: {
          color: [255, 255, 255], // white
          width: 1
      }
    };
    
    let popupTemplate = {
      title: "Me",
      content: "I am here!"
    };

    let pointGraphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol,
      popupTemplate: popupTemplate
    });

    this.graphicsLayer.removeAll();
    this.graphicsLayer.add(pointGraphic);
    console.log("adding a point done");
  }
}
