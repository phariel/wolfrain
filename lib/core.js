var NodeCache = require('node-cache');

var wolfCache = new NodeCache();

var roomNumber = 0;

var ROLES = {
    seer: {
        role: "seer",
        name: "预言家",
        life: 1,
        group: ["god"]
    },
    witch: {
        role: "witch",
        name: "女巫",
        potion: 1,
        poison: 1,
        life: 1,
        group: ["god"]
    },
    hunter: {
        role: "hunter",
        name: "猎人",
        life: 1,
        shoot: 1,
        group: ["god"]
    },
    idiot: {
        role: "idiot",
        name: "白痴",
        life: 1,
        group: ["god", "mortal"]
    },
    guard: {
        role: "guard",
        name: "守卫",
        life: 1,
        guard: 0,
        lastGuard: 0,
        group: ["god"]
    },
    wolf: {
        role: "wolf",
        name: "狼人",
        life: 1,
        group: ["wolf"]
    },
    villager: {
        role: "villager",
        name: "村民",
        life: 1,
        group: ["mortal"]
    }
};

var preDefinedConfig = {
    p9: {
        roles: ["seer", "witch", "hunter", "villager", "villager", "villager", "wolf", "wolf", "wolf"],
        vicDead: {
            mortal: 3,
            god: 3,
            wolf: 3
        },
        restrict: {
            witch: {
                self: true,
                double: false
            }
        },
        progress: ["wolf", "witch", "seer", "hunter"]
    }
};

function setCache(key, item) {
    wolfCache.set(key, JSON.stringify(item));
}

function getCache(key) {
    var item = wolfCache.get(key);
    if (item) {
        item = JSON.parse(item);
    }
    return item;
}

function shuffle(arr) {
    var res = [];
    for (var i = 0, len = arr.length; i < len; i++) {
        var j = Math.floor(Math.random() * arr.length);
        res[i] = arr[j];
        arr.splice(j, 1);
    }
    return res;
}

module.exports = {
    createRoom: function (number, cb) {
        roomNumber++;
        var config;
        switch (number) {
            case 9:
                config = JSON.parse(JSON.stringify(preDefinedConfig.p9));
                config.roles = config.roles.map(function (role) {
                    return ROLES[role];
                });
                config = JSON.parse(JSON.stringify(config));
        }
        config.roles = shuffle(config.roles);
        config.roles.forEach(function (v, i) {
            config.roles[i].seatNumber = i + 1;
        });
        setCache("roomroles" + roomNumber, config);
        var seats = [];
        for (var j = 0; j < number; j++) {
            seats.push(false);
        }
        setCache("roomsitdown" + roomNumber, seats);
        return roomNumber;
    },
    getRole: function (roomNumber, seatNumber) {
        var config = getCache("roomroles" + roomNumber);
        return config.roles[seatNumber - 1];
    },
    sitDown: function (roomNumber, seatNumber) {
        var roomSeats = getCache("roomsitdown" + roomNumber);
        roomSeats[seatNumber - 1] = true;
        setCache("roomsitdown" + roomNumber, roomSeats);
    },
    gameStart: function (roomNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        if (steps) {
            return {
                triggered: true
            };
        }
        var roomSeats = getCache("roomsitdown" + roomNumber);
        var passed = true;
        var notReady = [];

        roomSeats.forEach(function (seat, i) {
            if (!seat) {
                passed = false;
                notReady.push(i + 1);
            }
        });

        if (passed) {
            setCache("roomsteps" + roomNumber, {
                actions: [],
                step: 0
            });
        }

        return {
            started: passed,
            notReady: notReady
        }
    },
    getAlives: function (roomNumber, type) {
        var seats = [];
        var deadLife = type === "wolf" ? -1 : 0;
        var roles = getCache("roomroles" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        roles.roles.forEach(function (role) {
            if (role.life > deadLife) {
                seats.push(role.seatNumber);
            }
        });
        return {seats: seats, step: steps.step};
    },
    wolfKill: function (roomNumber, stepNumber, seatNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        var roles = getCache("roomroles" + roomNumber);

        if (steps.step !== stepNumber) {
            return {
                err: "step number not matched"
            };
        }
        steps.actions.push({
            type: "night",
            kill: seatNumber
        });
        steps.step++;
        setCache("roomsteps" + roomNumber, steps);

        return {
            next: true
        }
    },
    getKilledWitch: function (roomNumber, witchSeatNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        var roles = getCache("roomroles" + roomNumber);
        var witchRole = roles.roles[witchSeatNumber - 1];
        var killedSeat = steps.actions[steps.step - 1].kill;

        if (witchRole.seatNumber === killedSeat && roles.restrict &&
            roles.restrict.witch && !roles.restrict.witch.self) {
            return -1;
        }

        if (witchRole.potion === 1) {
            return killedSeat;
        } else {
            return 0;
        }
    },
    healWitch: function (roomNumber, witchSeatNumber, healSeatNumber) {
        var roles = getCache("roomroles" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var witchRole = roles.roles[witchSeatNumber - 1];
        if (healSeatNumber > 0 && witchRole.potion === 1) {
            steps.actions[steps.step - 1].heal = healSeatNumber;
            witchRole.potion = 0;
        }
        setCache("roomroles" + roomNumber, roles);
        setCache("roomsteps" + roomNumber, steps);

        return {
            next: true
        }
    },

    poisonWitch: function (roomNumber, witchSeatNumber, poisonSeatNumber) {
        var roles = getCache("roomroles" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var witchRole = roles.roles[witchSeatNumber - 1];
        if (poisonSeatNumber > 0 && witchRole.poison === 1) {
            steps.actions[steps.step - 1].poison = poisonSeatNumber;
            witchRole.poison = 0;
        }
        setCache("roomroles" + roomNumber, roles);
        setCache("roomsteps" + roomNumber, steps);

        return {
            next: true
        }
    },
    getRoleSeer: function (roomNumber, seatNumber) {
        var roles = getCache("roomroles" + roomNumber);
        var seatRole = roles.roles[seatNumber - 1];
        var group = seatRole.group;
        var good = true;

        group.forEach(function (item) {
            if (item === "wolf") {
                good = false;
            }
        });

        return good ? "好人" : "狼人";
    },
    getAlivesGuard: function (roomNumber, guardNumber) {
        var roles = getCache("roomroles" + roomNumber);
        var guardRole = roles.roles[guardNumber - 1];
        var alives = this.getAlives(roomNumber);
        alives.seats.every(function (seat, i) {
            if (guardRole.lastGuard === seat) {
                alives.seats.splice(i, 1);
                return false;
            }
            return true;
        });
    },
    actionGuard: function (roomNumber, seatNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        steps.actions[steps.step - 1].guard = seatNumber;
    },
    calculateResult: function (roomNumber) {
        var roles = getCache("roomroles" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var dead = {};
        var deadStr = "";

        var action = steps.actions[steps.step - 1];
        if (action.poison) {
            dead.poison = action.poison;
        }
        if (action.kill && action.heal !== action.kill && action.guard !== action.kill) {
            dead.kill = action.kill;
        }
        if (action.heal === action.guard) {
            dead.kill = action.guard;
        }
        if (dead.length === 0) {
            deadStr = "昨晚平安夜";
        } else {
            dead.forEach(function (deadSeat) {
                var role = roles.roles[deadSeat - 1];
                
            });
        }
    }
};