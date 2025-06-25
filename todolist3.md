Phase 1: Game Structure and State Management
Objective: To create a proper game flow with different states, such as a main menu, gameplay, and a post-race screen.

To-Do List:

[x] Implement a Game State Manager:

Create a simple state machine to handle different parts of the game (e.g., MainMenu, Playing, Paused, GameOver).
This will replace the simple gameStarted boolean and allow for more complex game logic.
[x] Create a Main Menu:

Design a simple main menu that appears when the game loads.
Include a "Start Race" button that transitions the game to the Playing state.
You can also add other options here later, like "Settings" or "Select Car."
[x] Develop a "Race Over" Screen:

When the race is finished (e.g., after a certain number of laps), transition to a GameOver state.
Display the final race results, including the player's time and position.
Include a "Restart" or "Back to Main Menu" button.
Phase 2: UI/UX and Audio Enhancements
Objective: To create a more immersive and user-friendly experience.

To-Do List:

[x] Add a Minimap:

Create a 2D representation of the track and display the positions of the player and AI cars in real-time.
[x] Sound Effects:

Integrate basic sound effects for:
Engine sounds (idle, accelerating, max speed)
Collisions
Drifting
Crossing the finish line
[ ] On-Screen Notifications:

Display messages like "Wrong Way!" if the player is going in the wrong direction, or "Final Lap!"
Phase 3: Gameplay and Content Expansion
Objective: To add more variety and challenge to the game.

To-Do List:

[ ] Add Power-ups:

Create a PowerUp class with different types (e.g., Speed Boost, Shield).
Randomly spawn power-up items on the track for players to collect.
[ ] Improve AI Opponent Behavior:

Enhance the AI's pathfinding to make it more competitive.
Consider adding "rubber banding" to keep the race close.
[ ] More Detailed Environment:

Add more visual elements to the track, such as trees, grandstands, or different textures.
Implement a skybox for a more realistic sky.
Phase 4: Recently Completed
[x] Improved Car Movement and Physics:
Successfully refactored the car's physics to be more dynamic and less stiff.
Decoupled turning from forward velocity.
Implemented a more realistic friction and drift model. 