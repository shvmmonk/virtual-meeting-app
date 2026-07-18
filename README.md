# Virtual Meeting App (Prototype)

A simple front-end prototype for a virtual meeting app where participants are represented as avatars sitting in "chairs" — inspired by apps like Gather.town and Microsoft Mesh, with a Bitmoji-style avatar concept.

This is an early-stage prototype built with **vanilla HTML, CSS, and JavaScript** as a learning project before migrating to React.

## Original Idea / Vision

The core idea: since remote work has made online meetings extremely common, build an app where instead of a plain grid of video tiles, people are represented by **Bitmoji-style avatars sitting in chairs**, like a virtual office. It should feel more personal and less "boxed-in" than a standard video call grid — inspired by tools like Gather.town, Teamflow/Spatial, and Microsoft Mesh, but with a stronger focus on customizable, cartoon-style avatars.

Rough long-term picture of how it should feel:
- Users get a **personalized avatar** (Bitmoji/Memoji-like) instead of just a webcam tile
- Avatars **sit in chairs** in a virtual meeting room layout
- Meeting basics: mute/unmute, leave, add/remove participants, active speaker highlight
- Eventually: movement (walking between chairs/rooms), reactions, chat, and real audio/video — not just static avatars

## My Learning Plan

Current skill set going in: Java, HTML, CSS, JS, React (learning), and currently learning Spring Boot.

Approach: build this project hands-on, step by step (one small step at a time), and learn new concepts as they're needed by the project rather than front-loading all theory first — with some exceptions where skipping ahead is risky.

**React topics treated as must-learn before touching the React version of this project** (core of how the app will work):
- Components
- Props
- State (`useState`)
- Event Handling
- Lists and Keys (`.map()` rendering — directly needed for rendering the participants array)

**React topics okay to learn "on the fly" while building** (lower risk to pick up mid-project):
- CSS in React
- React Router DOM (needed later once there's a "Lobby" vs "Meeting Room" page)
- Conditional Rendering
- Forms & Controlled Components
- `useEffect` (needed later for things like fetching data on load)

Planned learning order once picking Spring Boot back up: Java + Spring Boot fundamentals in parallel with React, since the backend (auth, rooms, WebSockets) will eventually be built in Spring Boot.

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

## Future Improvements

### Frontend
- [ ] Migrate this prototype into **React** (component-based structure: `<Chair />`, `<Avatar />`, `<MuteButton />`, `<LeaveButton />`)
- [ ] Manage participants with `useState` instead of manual DOM manipulation
- [ ] Fix **event delegation** so dynamically added participants support click-to-select and mute (native React re-render will solve this automatically)
- [ ] Add a "Rejoin Meeting" option after leaving (instead of a dead-end message)
- [ ] Avatar customization screen (choose color/style, like Bitmoji)
- [ ] Explore **Three.js** or **Canvas** for richer avatar movement (e.g. dragging avatars between chairs, walking around a virtual room like Gather.town)
- [ ] Responsive layout for mobile/tablet screens
- [ ] "Raise hand" and emoji reaction features
- [ ] In-meeting text chat box

### Backend
- [ ] Build backend with **Spring Boot** — user auth (Spring Security + JWT), meeting/room CRUD APIs, invite links
- [ ] Add **WebSockets (STOMP)** for real-time sync — chat messages, join/leave events, mute status broadcast to all participants
- [ ] Use **Redis** to manage live session/room state efficiently

### Real-time Video/Audio
- [ ] Integrate **WebRTC** for actual peer-to-peer audio/video calling
- [ ] Set up **STUN/TURN servers** (e.g. coturn) so calls work across different networks
- [ ] Add a media server (**LiveKit** or **mediasoup**) once user count grows beyond what peer-to-peer WebRTC can handle

### Infrastructure / Deployment
- [ ] Containerize with Docker for easier deployment
- [ ] Deploy frontend + backend separately (e.g. Vercel/Netlify for frontend, Render/Railway for Spring Boot backend)
- [ ] Add basic analytics (meeting duration, participant count)

## Status

🚧 Early-stage learning prototype — actively being built step by step.