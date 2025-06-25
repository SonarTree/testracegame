Prompt for AI Assistant:
Hello! I want to implement a major new feature in my 3D racing game: selectable maps. This will require a new map selection screen and modifications to the game's structure to load and play different tracks.

Please follow these steps carefully to ensure the new code integrates well with the existing project structure.

Step 1: Create the Map Data Structure

Create a new file at src/game/maps.ts.
In this file, define and export a type called TrackConfig that matches the structure of the config.track object in src/config.ts.
Define and export a type called MapConfig with the following properties:
id: string (e.g., 'classic_circuit')
name: string (e.g., 'Classic Circuit')
thumbnail: string (path to an image, e.g., '/thumbnails/classic.png')
trackConfig: TrackConfig
Create and export an array named maps of type MapConfig[]. Populate it with at least two map objects.
The first object should use the existing track values from src/config.ts.
The second object should be a new map with a different name and modified trackConfig values (e.g., a larger radius and a narrower width).
Step 2: Update the Game State

In src/game/GameState.ts, add a new state to the GameState object: MAP_SELECTION: 'MAP_SELECTION'.
Step 3: Update the UI

In index.html:
Inside the <div id="ui">, add a new container for the map selection menu, right after the main-menu div. It should look like this:
HTML

<div id="map-selection-menu" class="hidden" data-testid="map-selection-menu">
    <h1>Select a Map</h1>
    <ul id="map-list"></ul>
    <button id="start-race-button">Start Race</button>
    <button id="back-to-main-menu-button">Back</button>
</div>
In src/ui/GameUI.ts:
Export the new buttons: startRaceButton and backToMainMenuButton.
Create a new function showMapSelectionMenu() that hides the other menus (main-menu, game-hud, race-over) and shows the map-selection-menu.
Create a new function populateMapList(maps: any[]). This function should:
Get the map-list element.
Clear any existing content.
Loop through the maps array and create an <li> element for each map. The <li> should have its dataset.mapId set to the map's id and its innerText to the map's name.
Append each <li> to the map-list.
Add a click event listener to each <li>. When clicked, it should remove a 'selected' class from all other list items and add it to the clicked one.
Step 4: Refactor Track Creation

In src/game/Track.ts, modify the createTrack function.
It should now accept a trackConfig: TrackConfig object as an argument instead of using the global config.track.
Update the function body to use the properties from the passed trackConfig object (e.g., trackConfig.radius, trackConfig.width).
Step 5: Integrate Logic into Game.ts

In src/Game.ts:
Import the new maps array and MapConfig type from src/game/maps.ts.
Import the new UI functions and buttons from src/ui/GameUI.ts.
Add a new private property to the Game class: private selectedMapId: string | null = null;.
Modify Game Flow:
In the setState method, add a case for GameState.MAP_SELECTION. This case should call showMapSelectionMenu() and populateMapList(maps).
In the init method, change the startButton event listener. Instead of calling this.startGame(), it should now call this.setState(GameState.MAP_SELECTION).
Implement New Logic:
In the init method, add event listeners for the new buttons:
backToMainMenuButton should call this.setState(GameState.MAIN_MENU).
startRaceButton should check if this.selectedMapId is set. If it is, it should call a new method this.startRace().
Add an event listener to the map-list element. Use event delegation to listen for clicks on the <li> elements. When an <li> is clicked, get its dataset.mapId and store it in this.selectedMapId.
Create the new startRace method. This method will:
Find the complete map object from the maps array using this.selectedMapId.
Crucially, it will perform the logic that is currently in init for creating the track and placing the cars. You will need to move the calls to createTrack, createTrees, and the entity creation for the player and AI into this new method.
Pass the selected map's trackConfig to the createTrack function.
Reset race and lap timers.
Finally, call this.setState(GameState.PLAYING).
Cleanup init:
Since track and car creation are now in startRace, remove them from the init method. init should now only set up the scene, lights, renderer, and initial UI state. 