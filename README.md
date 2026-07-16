# Virtual Meeting App (Prototype)

A simple front-end prototype for a virtual meeting app where participants are represented as avatars sitting in "chairs" — inspired by apps like Gather.town and Microsoft Mesh, with a Bitmoji-style avatar concept.

This is an early-stage prototype built with **vanilla HTML, CSS, and JavaScript** as a learning project before migrating to React.

## Features

- 🪑 **Meeting room layout** — participants displayed as avatar cards in a responsive grid
- 🎨 **Dynamic rendering** — participant data (name, avatar color) is rendered from a JS array, not hardcoded in HTML
- 🖱️ **Click to select** — clicking a chair toggles an "active" highlight state (green glow), simulating a "speaking" indicator
- 🎤 **Mute/Unmute** — each participant has a mute button that toggles between 🎤 and 🔇
- ➕ **Add Participant** — dynamically creates a new chair/avatar in the DOM without reloading the page
- ❌ **Leave Meeting** — ends the session, hides the meeting room, and displays a "You left the meeting" message

## Tech Stack

- HTML5
- CSS3 (Flexbox + Grid)
- Vanilla JavaScript (DOM manipulation, event listeners)

## Project Structure

```
virtual-meeting-app/
├── index.html      # Page structure (chairs, buttons, container)
├── style.css        # Layout, avatar styling, active/mute/leave button styles
├── script.js         # Dynamic data binding, click/mute/leave/add logic
└── README.md
```

## How to Run

1. Clone or download this repository
2. Open `index.html` directly in any modern browser (no build step or server required)

## Known Limitations

- Dynamically added participants (via "Add Participant") don't yet support click-to-select or mute functionality — this requires **event delegation**, which will be implemented in the React version instead.
- No real video/audio — avatars are static colored circles as placeholders.
- No backend — all data is local, dummy, and resets on page refresh.

## Roadmap

- [ ] Migrate this prototype into **React** (component-based structure: `<Chair />`, `<Avatar />`, `<MuteButton />`)
- [ ] Add real-time communication using **WebRTC**
- [ ] Add backend with **Spring Boot** (auth, room management, REST APIs)
- [ ] Add **WebSockets** for real-time state sync (chat, join/leave events)
- [ ] Explore **Three.js** or **Canvas** for richer avatar movement/customization
- [ ] Add STUN/TURN servers and a media server (e.g. LiveKit) for scalable video

## Status

🚧 Early-stage learning prototype — actively being built step by step.