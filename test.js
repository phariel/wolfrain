var core = require('./lib/core');

var roomNumber = core.createRoom(9);

var step;

var witchSeatNumber;
var seerSeatNumber;

core.sitDown(roomNumber, 1);
core.sitDown(roomNumber, 2);
core.sitDown(roomNumber, 3);
core.sitDown(roomNumber, 4);
core.sitDown(roomNumber, 5);
core.sitDown(roomNumber, 6);
core.sitDown(roomNumber, 7);
core.sitDown(roomNumber, 8);
core.sitDown(roomNumber, 9);

console.log("===test role===");
var testrole = core.getRole(roomNumber, 3);
console.log("seat 3 is: " + testrole.name);

for (var i = 0; i < 9; i++) {
    var role = core.getRole(roomNumber, i + 1);
    if (role.role === "witch") {
        witchSeatNumber = role.seatNumber;
    }
}

var gameStart = core.gameStart(roomNumber);

console.log(gameStart);

console.log("===wolf===");
var getAlives = core.getAlives(roomNumber, "wolf");
step = getAlives.step;
console.log("Alive: ");
console.log(getAlives);
console.log("kill "+witchSeatNumber);
core.wolfKill(roomNumber, step, witchSeatNumber);
console.log("==witch===");
var lastKill = core.getKilledWitch(roomNumber, witchSeatNumber);
console.log("Last killed: " + lastKill);
if (lastKill > 0) {
    console.log("heal");
    core.healWitch(roomNumber, witchSeatNumber, lastKill);
}

console.log("===seer===");
var getAlives2 = core.getAlives(roomNumber);
console.log("Alive2: ");
console.log(getAlives2);