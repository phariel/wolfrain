var core = require('./lib/core');

var roomNumber = core.createRoom(0);

console.log("===房间: {0}===".replace("{0}", roomNumber));

var step;

var witchSeatNumber;
var guardSeatNumber;
var hunterSeatNumber;

core.sitDown(roomNumber, 1);
core.sitDown(roomNumber, 2);
core.sitDown(roomNumber, 3);
core.sitDown(roomNumber, 4);
core.sitDown(roomNumber, 5);
core.sitDown(roomNumber, 6);
core.sitDown(roomNumber, 7);
core.sitDown(roomNumber, 8);
core.sitDown(roomNumber, 9);

console.log("===测试角色===");
var testrole = core.getRole(roomNumber, 3);
console.log("seat 3 is: " + testrole.name);

for (var i = 0; i < 9; i++) {
    var role = core.getRole(roomNumber, i + 1);
    if (role.role === "witch") {
        witchSeatNumber = role.seatNumber;
    }
    if (role.role === "guard") {
        guardSeatNumber = role.seatNumber;
    }
    if (role.role === "hunter") {
        hunterSeatNumber = role.seatNumber;
    }
}

var gameStart = core.gameStart(roomNumber);

console.log(gameStart);

console.log("===狼人===");
var getAlives = core.getAlives(roomNumber, "wolf");
step = getAlives.step;
console.log("狼人请刀人: ");
console.log(getAlives);
console.log("狼刀: " + hunterSeatNumber);
core.wolfKill(roomNumber, step, hunterSeatNumber);
console.log("==女巫===");
var lastKill = core.getKilledWitch(roomNumber, witchSeatNumber);
console.log("这个人死了，你要救吗: " + lastKill);
if (lastKill > 0) {
    console.log("救");
    core.healWitch(roomNumber, witchSeatNumber, lastKill);
}

console.log("===预言家===");
var getAlivesSeer = core.getAlives(roomNumber);
console.log("预言家你要验谁: ");
console.log(getAlivesSeer);
console.log("验：" + witchSeatNumber);
var seerResult = core.getRoleSeer(roomNumber, witchSeatNumber);
console.log(seerResult);

console.log("===守卫===");
var getAlivesGuard = core.getAlivesGuard(roomNumber, guardSeatNumber);
console.log("守卫你要守谁: ");
console.log(getAlivesGuard);
core.actionGuard(roomNumber, hunterSeatNumber);
console.log("守: " + hunterSeatNumber);
core.calculateResult(roomNumber);

console.log("===猎人===");
var actionHunter = core.getActionHunter(roomNumber, hunterSeatNumber);
console.log(actionHunter);

console.log("===结算===");
var finalResult = core.getDead(roomNumber);
console.log(finalResult);