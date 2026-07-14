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

chairs.forEach((chair , index) => {
    const participant = participants[index];

    const avatar = chair.querySelector(".avatar");
    const nameLabel = chair.querySelector(".participant-name");

    avatar.style.backgroundColor = participant.color;
    nameLabel.textContent = participant.name;

    chair.addEventListener("click" , () =>{
        chair.classList.toggle("active");
    })

    const muteBtn = chair.querySelector(".mute-btn");

    muteBtn.addEventListener("click" , () => {
        event.stopPropagation();

        const isMuted = muteBtn.textContent === "🎤";

        if(isMuted){
            muteBtn.textContent = "🔇";
        } else{
            muteBtn.textContent = "🎤";
        }
    })
})

