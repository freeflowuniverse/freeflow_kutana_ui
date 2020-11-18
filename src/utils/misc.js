import { capitalize } from 'lodash/string';

export const getTitle = () =>
    location.host
        .split('.')
        .splice(-3, 2)
        .reverse()
        .map(capitalize)
        .map(h => {
            switch (h) {
                case 'Localhost:8080':
                    return 'Dev Env';
                case 'Threefold':
                    return 'ThreeFold';
                default:
                    return h;
            }
        })
        .join(' ');
