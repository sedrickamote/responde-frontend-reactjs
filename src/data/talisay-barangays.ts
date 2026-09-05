// src/data/talisay-barangays.ts
import type { BarangayFeatureCollection } from '../types/geospatial';

export const talisayBarangays: BarangayFeatureCollection = {
    type: 'FeatureCollection',
    name: 'Talisay Barangays',
    description: 'Approximate barangay boundaries for Talisay, Batangas. Generated for demonstration purposes.',
    features: [
        {
            type: 'Feature',
            properties: { id: 1, name: 'Aya', centroid: [121.0094, 14.1046] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.007, 14.1028], [121.0103, 14.1019], [121.0121, 14.104], [121.0112, 14.1067], [121.0088, 14.1073], [121.0067, 14.1058], [121.007, 14.1028]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 2, name: 'Balas', centroid: [121.0134, 14.0916] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.011, 14.0898], [121.0143, 14.0889], [121.0161, 14.091], [121.0152, 14.0937], [121.0128, 14.0943], [121.0107, 14.0928], [121.011, 14.0898]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 3, name: 'Banga', centroid: [121.0064, 14.0996] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.004, 14.0978], [121.0073, 14.0969], [121.0091, 14.099], [121.0082, 14.1017], [121.0058, 14.1023], [121.0037, 14.1008], [121.004, 14.0978]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 4, name: 'Buco', centroid: [121.0164, 14.0866] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.014, 14.0848], [121.0173, 14.0839], [121.0191, 14.086], [121.0182, 14.0887], [121.0158, 14.0893], [121.0137, 14.0878], [121.014, 14.0848]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 5, name: 'Caloocan', centroid: [121.0264, 14.1086] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.024, 14.1068], [121.0273, 14.1059], [121.0291, 14.108], [121.0282, 14.1107], [121.0258, 14.1113], [121.0237, 14.1098], [121.024, 14.1068]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 6, name: 'Leynes', centroid: [121.0334, 14.1086] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.031, 14.1068], [121.0343, 14.1059], [121.0361, 14.108], [121.0352, 14.1107], [121.0328, 14.1113], [121.0307, 14.1098], [121.031, 14.1068]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 7, name: 'Miranda', centroid: [121.0294, 14.0886] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.027, 14.0868], [121.0303, 14.0859], [121.0321, 14.088], [121.0312, 14.0907], [121.0288, 14.0913], [121.0267, 14.0898], [121.027, 14.0868]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 8, name: 'Poblacion Barangay 1', centroid: [121.0224, 14.0976] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0212, 14.0964], [121.0236, 14.0958], [121.0248, 14.0976], [121.0236, 14.0988], [121.0212, 14.0982], [121.0206, 14.097], [121.0212, 14.0964]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 9, name: 'Poblacion Barangay 2', centroid: [121.0244, 14.0976] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0232, 14.0964], [121.0256, 14.0958], [121.0268, 14.0976], [121.0256, 14.0988], [121.0232, 14.0982], [121.0226, 14.097], [121.0232, 14.0964]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 10, name: 'Poblacion Barangay 3', centroid: [121.0224, 14.0996] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0212, 14.0984], [121.0236, 14.0978], [121.0248, 14.0996], [121.0236, 14.1008], [121.0212, 14.1002], [121.0206, 14.099], [121.0212, 14.0984]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 11, name: 'Poblacion Barangay 4', centroid: [121.0244, 14.0996] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0232, 14.0984], [121.0256, 14.0978], [121.0268, 14.0996], [121.0256, 14.1008], [121.0232, 14.1002], [121.0226, 14.099], [121.0232, 14.0984]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 12, name: 'Poblacion Barangay 5', centroid: [121.0234, 14.1016] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0222, 14.1004], [121.0246, 14.0998], [121.0258, 14.1016], [121.0246, 14.1028], [121.0222, 14.1022], [121.0216, 14.101], [121.0222, 14.1004]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 13, name: 'Poblacion Barangay 6', centroid: [121.0264, 14.0986] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0252, 14.0974], [121.0276, 14.0968], [121.0288, 14.0986], [121.0276, 14.0998], [121.0252, 14.0992], [121.0246, 14.098], [121.0252, 14.0974]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 14, name: 'Poblacion Barangay 7', centroid: [121.0254, 14.1006] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0242, 14.0994], [121.0266, 14.0988], [121.0278, 14.1006], [121.0266, 14.1018], [121.0242, 14.1012], [121.0236, 14.1], [121.0242, 14.0994]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 15, name: 'Poblacion Barangay 8', centroid: [121.0274, 14.0996] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.0262, 14.0984], [121.0286, 14.0978], [121.0298, 14.0996], [121.0286, 14.1008], [121.0262, 14.1002], [121.0256, 14.099], [121.0262, 14.0984]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 16, name: 'Quiling', centroid: [121.0364, 14.1116] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.034, 14.1098], [121.0373, 14.1089], [121.0391, 14.111], [121.0382, 14.1137], [121.0358, 14.1143], [121.0337, 14.1128], [121.034, 14.1098]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 17, name: 'Sampaloc', centroid: [121.0234, 14.0866] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.021, 14.0848], [121.0243, 14.0839], [121.0261, 14.086], [121.0252, 14.0887], [121.0228, 14.0893], [121.0207, 14.0878], [121.021, 14.0848]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 18, name: 'San Guillermo', centroid: [121.0114, 14.0866] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.009, 14.0848], [121.0123, 14.0839], [121.0141, 14.086], [121.0132, 14.0887], [121.0108, 14.0893], [121.0087, 14.0878], [121.009, 14.0848]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 19, name: 'Santa Maria', centroid: [121.0264, 14.0916] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.024, 14.0898], [121.0273, 14.0889], [121.0291, 14.091], [121.0282, 14.0937], [121.0258, 14.0943], [121.0237, 14.0928], [121.024, 14.0898]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 20, name: 'Tranca', centroid: [121.0314, 14.1046] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.029, 14.1028], [121.0323, 14.1019], [121.0341, 14.104], [121.0332, 14.1067], [121.0308, 14.1073], [121.0287, 14.1058], [121.029, 14.1028]]]
            }
        },
        {
            type: 'Feature',
            properties: { id: 21, name: 'Tumaway', centroid: [121.0034, 14.0786] },
            geometry: {
                type: 'Polygon',
                coordinates: [[[121.001, 14.0768], [121.0043, 14.0759], [121.0061, 14.078], [121.0052, 14.0807], [121.0028, 14.0813], [121.0007, 14.0798], [121.001, 14.0768]]]
            }
        }
    ]
};