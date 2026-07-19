//dummy data
const participants = [
    { name: "User 1", color: "#7289da" },
    { name: "User 2", color: "#43b581" },
    { name: "User 3", color: "#f04747" },
    { name: "User 4", color: "#faa61a" }
];

console.log(participants);

const chairs = document.querySelectorAll(".chair");
console.log(chairs);

chairs.forEach((chair, index) => {
    const participant = participants[index];

    const avatar = chair.querySelector(".avatar");
    const nameLabel = chair.querySelector(".participant-name");

    avatar.style.backgroundColor = participant.color;
    nameLabel.textContent = participant.name;

    chair.addEventListener("click", () => {
        chair.classList.toggle("active");
    })

    const muteBtn = chair.querySelector(".mute-btn");

    muteBtn.addEventListener("click", () => {
        event.stopPropagation();

        const isMuted = muteBtn.textContent === "🎤";

        if (isMuted) {
            muteBtn.textContent = "🔇";
        } else {
            muteBtn.textContent = "🎤";
        }
    })


})


const leavebtn = document.querySelector(".leave-btn");

leavebtn.addEventListener("click", () => {
    document.querySelector(".container").style.display = "none";
    document.body.innerHTML += "<h1 style='color: white; font-family: sans-serif;'>You left the meeting</h1>";
});

const addBtn = document.querySelector(".add-participant-btn");
let participantCount = participants.length;

addBtn.addEventListener("click" , () =>{
    participantCount++;

    const newChair = document.createElement("div");
    newChair.classList.add("chair");

    newChair.innerHTML = `
     <div class="avatar" style="background-color: #ffffff;"></div>
        <p class="participant-name">User ${participantCount}</p>
        <button class="mute-btn">🎤</button>
        `;

        document.querySelector(".container").appendChild(newChair);
        document.querySelector(".participant-count").textContent = `Total Participants: ${participantCount}`;

});

