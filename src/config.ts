export const config = {
    vehicle: {
        wheelBase: 1.5,
        maxSteer: Math.PI / 6,
        enginePower: 0.01,
        brakingForce: 0.02,
        friction: 0.99,
        turnSpeed: 0.05,
        restitution: 0.4,
    },
    camera: {
        shakeIntensity: 0.2,
        shakeDecay: 0.9,
    },
    track: {
        radius: 35,
        width: 10,
        wallSegments: 64,
        wallHeight: 2,
        wallThickness: 1,
        wallTubeRadius: 0.5,
    },
    race: {
        laps: 3,
    },
    // Add other settings as we refactor
}; 