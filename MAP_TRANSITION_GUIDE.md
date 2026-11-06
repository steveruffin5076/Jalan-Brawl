# Map Transition System Documentation

## Overview
The Map Transition System allows your game to unload the current map area and load a new one with a fade-to-black transition effect when the player crosses area boundaries.

## How It Works

### 1. **MapTransition System** (`src/systems/MapTransition.js`)
Handles the visual fade transition and area detection logic.

**Key Features:**
- **Fade-to-black overlay**: Creates a smooth visual transition
- **Area boundary detection**: Checks when player crosses into a new section
- **Transition timing**: Configurable 300ms fade in/out duration

**Main Methods:**
- `transitionToArea(nextAreaId, callback)`: Triggers transition with fade effects
- `checkAreaTransition(playerX, sections)`: Detects if player has crossed a boundary
- `reset()`: Cleans up transition state

### 2. **GameScene Integration**
The map transition system is integrated into the main game scene.

**Initialization (in `create()`):**
```javascript
this.mapTransition = new MapTransition(this);
this.currentAreaIndex = 0;
```

**Usage (in `update()`):**
```javascript
// Check for map area transition
if (!this.mapTransition.isTransitioning && this.stage.sections) {
  const nextSection = this.mapTransition.checkAreaTransition(this.player.x, this.stage.sections);
  if (nextSection) {
    this.mapTransition.transitionToArea(nextSection.id, (nextAreaId) => {
      this.unloadArea();
      this.loadArea(nextAreaId);
    });
    return;
  }
}
```

### 3. **Area Loading/Unloading**

#### `unloadArea()`
Clears all entities from the current area:
- Dismisses all enemies and clears the enemies array
- Destroys all breakables (crates, bins, etc.)
- Clears all pickups (health items, money, etc.)
- Resets the AI director to release claimed slots

#### `loadArea(areaId)`
Loads a new map area by ID:
- Finds the section matching the area ID
- Resets the wave manager to start fresh waves in the new area
- Positions the player appropriately within the new area
- Updates the area banner UI

### 4. **Stage Data Structure**
Areas are defined in `src/data/stage1.json` under the `sections` array:

```json
{
  "sections": [
    {
      "id": "pasar",
      "name": "Pasar Malam",
      "start": 0,
      "end": 1280,
      "triggerX": 1200,
      "waves": [...],
      "boss": null
    },
    {
      "id": "shophouse", 
      "name": "Shophouse",
      "start": 1280,
      "end": 2560,
      "triggerX": 2500,
      "waves": [...],
      "boss": null
    }
    // ... more sections
  ]
}
```

## Customization

### Transition Duration
Edit `MapTransition.js` to change the fade duration:
```javascript
// Currently 300ms fade in and 300ms fade out
this.scene.tweens.add({
  targets: this.fadeOverlay,
  alpha: 1,
  duration: 300,  // Change this value
  // ...
});
```

### Transition Detection
The `checkAreaTransition()` method checks if `playerX >= section.start`. You can modify the boundary check logic:
```javascript
if (playerX >= nextSection.start && playerX < nextSection.end) {
  // Customize boundary logic here
}
```

### Fade Overlay Appearance
Modify the fade overlay in `MapTransition.js`:
```javascript
this.fadeOverlay = this.scene.add.rectangle(
  DISPLAY.width / 2,
  DISPLAY.height / 2,
  DISPLAY.width,
  DISPLAY.height,
  0x000000,  // Change this to customize color (e.g., 0xff0000 for red)
  0
);
```

## Behavior

1. **Player moves right through stage**
2. **At section boundary**: Screen fades to black over 300ms
3. **During fade**: 
   - Current area is unloaded (enemies, items cleared)
   - New area is loaded (wave manager reset)
4. **After fade**: Screen fades back in over 300ms
5. **Continue gameplay** in the new area

## Debug/Testing

To disable transitions while testing, you can comment out the transition check in `GameScene.update()`:
```javascript
// Check for map area transition
// if (!this.mapTransition.isTransitioning && this.stage.sections) {
//   // ... transition code
// }
```

Or modify `MapTransition.js` to log when transitions occur:
```javascript
transitionToArea(nextAreaId, onTransitionComplete) {
  console.log(`Transitioning to area: ${nextAreaId}`);
  // ... rest of method
}
```

## Known Limitations

- Transitions currently only move right (positive direction)
- Wave manager resets on transition, so previously spawned waves are not resumed
- Player position is clamped to stay within area bounds

## Future Enhancements

Potential improvements:
- Support for left-direction transitions (for bidirectional level design)
- Custom transition effects (not just fade-to-black)
- Save player progress/score across area transitions
- Different transition triggers (defeat boss, find key, etc.)
- Audio fade-out/in during transitions
