export class NewFeature {
    attributes: FeatureAttributes;
    geometry: FeatureGeometry;
}

export class FeatureAttributes {
    projectName: string;
    projectDescription: string;
    pointDescription: string;
    northing: string;
    easting: string;
    elevation: string;
    ID: string;
}

export class FeatureGeometry {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}