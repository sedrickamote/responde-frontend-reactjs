/// <reference types="vite/client" />

declare module '*.geojson' {
    const value: {
        type: string;
        features: any[];
        [key: string]: any;
    };
    export default value;
}