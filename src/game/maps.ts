import { config } from '../config'

export interface TrackConfig {
  radius: number
  width: number
  wallSegments: number
  wallHeight: number
  wallThickness: number
  wallTubeRadius: number
}

export interface MapConfig {
  id: string
  name: string
  thumbnail: string
  trackConfig: TrackConfig
}

export const maps: MapConfig[] = [
  {
    id: 'classic_circuit',
    name: 'Classic Circuit',
    thumbnail: '/thumbnails/classic.png',
    trackConfig: config.track,
  },
  {
    id: 'windy_shores',
    name: 'Windy Shores',
    thumbnail: '/thumbnails/windy.png',
    trackConfig: {
      ...config.track,
      radius: 50,
      width: 8,
    },
  },
] 