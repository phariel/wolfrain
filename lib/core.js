var NodeCache = require('node-cache');

var wolfCache = new NodeCache();

var roomNumber = parseInt(10000 * Math.random(), 10);

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
    p0: {
        total: 9,
        roles: ["seer", "witch", "hunter", "villager", "villager", "guard", "wolf", "wolf", "wolf"],
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
    },
    p9: {
        total: 9,
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
    getRoomTypes: function () {
        return [9];
    },
    createRoom: function (number) {
        roomNumber++;
        var config;
        config = JSON.parse(JSON.stringify(preDefinedConfig["p" + number]));
        config.roles = config.roles.map(function (role) {
            return ROLES[role];
        });
        config = JSON.parse(JSON.stringify(config));
        config.roles = shuffle(config.roles);
        config.roles.forEach(function (v, i) {
            config.roles[i].seatNumber = i + 1;
        });
        setCache("roomconfig" + roomNumber, config);
        var seats = [];
        for (var j = 0; j < number; j++) {
            seats.push(false);
        }
        setCache("roomsitdown" + roomNumber, seats);
        setCache("roomready" + roomNumber, seats);
        return roomNumber;
    },
    getTotal: function (roomNumber) {
        var config = getCache("roomconfig" + roomNumber);

        return config ? config.total : 0;
    },
    getRole: function (roomNumber, seatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var ready = getCache("roomready" + roomNumber);
        if (!steps) {
            ready[seatNumber - 1] = true;
            setCache("roomready" + roomNumber, ready);
        }

        return config.roles[seatNumber - 1];
    },
    sitDown: function (roomNumber, seatNumber) {
        var roomSeats = getCache("roomsitdown" + roomNumber);
        if (roomSeats[seatNumber - 1]) {
            return false;
        } else {
            roomSeats[seatNumber - 1] = true;
            setCache("roomsitdown" + roomNumber, roomSeats);
            return true;
        }
    },
    getStartStatus: function (roomNumber) {
        var seats = getCache("roomsitdown" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var ready = getCache("roomready" + roomNumber);

        return {
            ready: ready,
            seats: seats,
            started: !!steps
        };
    },
    gameStart: function (roomNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        if (steps) {
            return {
                triggered: true
            };
        }
        var roomSeats = getCache("roomready" + roomNumber);
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
                dead: [],
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
        var config = getCache("roomconfig" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        config.roles.forEach(function (role) {
            if (role.life > deadLife) {
                seats.push(role.seatNumber);
            }
        });
        return {seats: seats, step: steps.step};
    },
    wolfKill: function (roomNumber, stepNumber, seatNumber) {
        var steps = getCache("roomsteps" + roomNumber);

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
        var config = getCache("roomconfig" + roomNumber);
        var witchRole = config.roles[witchSeatNumber - 1];
        var killedSeat = steps.actions[steps.step - 1].kill;

        if (witchRole.seatNumber === killedSeat && config.restrict &&
            config.restrict.witch && !config.restrict.witch.self) {
            return -1;
        }

        if (witchRole.potion === 1) {
            return killedSeat;
        } else {
            return 0;
        }
    },
    healWitch: function (roomNumber, witchSeatNumber, healSeatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var witchRole = config.roles[witchSeatNumber - 1];
        if (healSeatNumber > 0 && witchRole.potion === 1) {
            steps.actions[steps.step - 1].heal = healSeatNumber;
            witchRole.potion = 0;
        }
        setCache("roomconfig" + roomNumber, config);
        setCache("roomsteps" + roomNumber, steps);

        return {
            next: true
        }
    },

    poisonWitch: function (roomNumber, witchSeatNumber, poisonSeatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var witchRole = config.roles[witchSeatNumber - 1];
        if (poisonSeatNumber > 0 && witchRole.poison === 1) {
            steps.actions[steps.step - 1].poison = poisonSeatNumber;
            witchRole.poison = 0;
        }
        setCache("roomconfig" + roomNumber, config);
        setCache("roomsteps" + roomNumber, steps);

        return {
            next: true
        }
    },
    getRoleSeer: function (roomNumber, seatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var seatRole = config.roles[seatNumber - 1];
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
        var config = getCache("roomconfig" + roomNumber);
        var guardRole = config.roles[guardNumber - 1];
        var alives = this.getAlives(roomNumber);

        alives.seats.every(function (seat, i) {
            if (guardRole.lastGuard === seat) {
                alives.seats.splice(i, 1);
                return false;
            }
            return true;
        });
        return alives;
    },
    actionGuard: function (roomNumber, seatNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        steps.actions[steps.step - 1].guard = seatNumber;
        setCache("roomsteps" + roomNumber, steps);
    },
    calculateResult: function (roomNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var dead = {};
        var deadArr = [];

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

        if (dead.poison) {
            config.roles[dead.poison - 1].life = -1;
            deadArr.push(dead.poison);
        } else if (dead.kill) {
            var role = config.roles[dead.kill - 1];
            role.life = role.role === "hunter" ? 0 : -1;
            deadArr.push(dead.kill);
        }
        deadArr.sort(function (a, b) {
            return a - b;
        });

        steps.dead[steps.step - 1] = deadArr;
        setCache("roomconfig" + roomNumber, config);
        setCache("roomsteps" + roomNumber, steps);
    },
    getActionHunter: function (roomNumber, hunterSeatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var hunterRole = config.roles[hunterSeatNumber - 1];
        return hunterRole.life === 0 && hunterRole.shoot === 1 ? "可以发动技能" : "不能发动技能";
    },
    getDead: function (roomNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        var dead = steps.dead[steps.step - 1];
        var deadStr = "昨晚死亡的是{0}号玩家，排名不分先后";
        if (dead.length === 0) {
            deadStr = "昨晚平安夜";
        } else {
            deadStr = deadStr.replace("{0}", dead.join(","));
        }
        return deadStr;
    },
    getCache: getCache,
    setCache: setCache
};