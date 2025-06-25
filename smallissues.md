Hello! I have a few issues and feature requests for our 3D racing game. Please address the following items, paying close attention to the file paths and implementation details provided.

1. Bug Report: Screen Shake on Wall Collision
Issue: The screen shake effect that occurs when crashing into a wall continues for as long as the car is touching the wall, instead of being a single, impactful shake on the initial collision. The shake should happen once on impact and then decay.
File to Modify: src/ecs/systems/CollisionSystem.ts
Analysis: In the CollisionSystem.ts file, the cameraShakeIntensity is continuously set every frame that the car is outside the track's bounds. This is causing the repeating shake effect.
Required Change:
Introduce a new boolean property to the PhysicsComponent (in src/ecs/components/PhysicsComponent.ts) called isColliding, initialized to false.
In CollisionSystem.ts, modify the collision detection logic. When a car first collides with the wall (i.e., when isColliding is false), set cameraShakeIntensity, push the TRACK_COLLISION event, and set isColliding to true.
If the car is still colliding in subsequent frames (i.e., isColliding is already true), do not set the cameraShakeIntensity or push the event again.
When the car is no longer colliding (it's back within the track bounds), set isColliding back to false.
2. Bug Report: Final Lap Audio
Issue: The "finish line" sound plays every time the player crosses the finish line. I want a sound to play only when the player completes the final lap and finishes the race.
Files to Modify: src/Game.ts and src/ecs/systems/LapSystem.ts
Analysis: The handleLapEvents method in Game.ts plays the finishline sound on every 'LAP_COMPLETED' event. The 'FINAL_LAP' event only triggers a notification.
Required Change:
In LapSystem.ts, when the race is over (lapTracker.lap === config.race.laps), instead of just pushing a GAME_STATE_CHANGE event, create a new event type called 'RACE_FINISHED'.
In Game.ts, modify the handleLapEvents method:
Keep the existing logic for 'LAP_COMPLETED' to play the regular 'finishline' sound on normal laps.
Add a new case for 'RACE_FINISHED'. In this case, play a more triumphant sound (you can reuse 'finishline' for now, but this change makes it easy to add a different sound later) and then change the game state to GameState.RACE_OVER.
3. Feature Request: Realistic Acceleration and Max Speed
Issue: The car's acceleration feels too fast, and there's no maximum speed limit.
Files to Modify: src/ecs/systems/PhysicsSystem.ts and src/config.ts
Required Changes:
Slower Acceleration:
In src/config.ts, reduce the enginePower value in the vehicle configuration. A value of 0.005 would be a good starting point to make the acceleration slower and more realistic.
Max Speed:
In src/ecs/systems/PhysicsSystem.ts, after the speed is updated with acceleration and friction, add a check to cap the speed.
The speed displayed in the UI is speed * 100. To cap the speed at 40 km/h, the internal speed value should be capped at 0.4.
Implement this by adding a line like: physics.speed = Math.max(-0.4, Math.min(0.4, physics.speed)); after the friction is applied. This will clamp the speed between -0.4 (for reverse) and 0.4 (for forward).
4. Feature Request: Limit Engine Sound Volume
Issue: The engine sound's volume increases with speed, which is great, but it can get excessively loud at high speeds.
File to Modify: src/Game.ts
Analysis: The engine volume is calculated in the update method with the line: const engineVolume = Math.max(0.1, Math.abs(playerPhysics.speed) / 0.2);. This calculation has no upper limit.
Required Change:
In src/Game.ts, modify the engine volume calculation to cap the maximum volume. A good upper limit would be 1.0 (100% volume).
Change the line to: const engineVolume = Math.min(1.0, Math.max(0.1, Math.abs(playerPhysics.speed) / 0.2));. This uses Math.min to ensure the calculated volume never exceeds 1.0. 