var NodeCache = require('node-cache');

var wolfCache = new NodeCache();

var roomNumber = parseInt(10000 * Math.random(), 10);

var debug = false;

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
        progress: ["night", "wolf", "witch", "seer", "hunter", "day"]
    },
    p11: {
        total: 11,
        roles: ["seer", "witch", "hunter", "idiot", "villager", "villager", "villager", "wolf", "wolf", "wolf", "wolf"],
        vicDead: {
            mortal: 4,
            god: 4,
            wolf: 4
        },
        restrict: {
            witch: {
                self: false,
                double: false
            }
        },
        progress: ["night", "wolf", "witch", "seer", "hunter", "day"]
    },
    p12: {
        total: 12,
        roles: ["seer", "witch", "hunter", "idiot", "villager", "villager", "villager", "villager", "wolf", "wolf", "wolf", "wolf"],
        vicDead: {
            mortal: 5,
            god: 5,
            wolf: 4
        },
        restrict: {
            witch: {
                self: false,
                double: false
            }
        },
        progress: ["night", "wolf", "witch", "seer", "hunter", "day"]
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
        var list = [];
        Object.keys(preDefinedConfig).forEach(function (key) {
            list.push(preDefinedConfig[key].total);
        });
        return list;
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

        if (debug) {
            (function (that) {
                var item;
                var config = getCache("roomconfig" + roomNumber);
                if (config.total === 9) {
                    for (var i = 0; i < 9; i++) {
                        item = config.roles[i];
                        if (item.role === 'hunter') {
                        } else {
                            that.sitDown(roomNumber, i + 1);
                            that.getRole(roomNumber, i + 1);
                        }
                    }
                }
                if (config.total === 12) {
                    for (var j = 0; j < 12; j++) {
                        item = config.roles[j];
                        if (item.role === 'hunter') {
                        } else {
                            that.sitDown(roomNumber, j + 1);
                            that.getRole(roomNumber, j + 1);
                        }
                    }
                }
            })(this);
        }

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
            setCache('roomprogress' + roomNumber, {});
            setCache('roomvoices' + roomNumber, []);
            this.enterNight(roomNumber);
        }

        if (debug) {
            var config = getCache("roomconfig" + roomNumber);
            var roles = config.roles;
            var witch;
            var hunter;
            var guard;
            var that = this;

            if (config.total === 9) {
                roles.forEach(function (role) {
                    if (role.role === 'witch') {
                        witch = role.seatNumber;
                    }
                    if (role.role === 'hunter') {
                        hunter = role.seatNumber;
                    }
                });

                setTimeout(function () {
                    that.wolfKill(roomNumber, witch);
                }, 1000);
                setTimeout(function () {
                    that.actionWitch(roomNumber, witch, [witch, hunter]);
                }, 2000);
                setTimeout(function () {
                    that.getRoleSeer(roomNumber, 1);
                }, 3000);
            }

            if (config.total === 12) {
                roles.forEach(function (role) {
                    if (role.role === 'witch') {
                        witch = role.seatNumber;
                    }
                    if (role.role === 'hunter') {
                        hunter = role.seatNumber;
                    }
                });
                setTimeout(function () {
                    that.wolfKill(roomNumber, hunter);
                }, 1000);
                setTimeout(function () {
                    that.actionWitch(roomNumber, witch, [0, witch]);
                }, 2000);
                setTimeout(function () {
                    that.getRoleSeer(roomNumber, 1);
                }, 3000);
            }
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
    wolfKill: function (roomNumber, seatNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);

        steps.actions[steps.step - 1].kill = seatNumber;
        progress[steps.step - 1].wolf = true;

        setCache("roomsteps" + roomNumber, steps);
        setCache("roomprogress" + roomNumber, progress);

        this.setAdminVoices('wolf');

        return {
            success: true
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
            success: true
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
            success: true
        }
    },
    actionWitch: function (roomNumber, witchSeatNumber, targetSeatNumbers) {
        var steps = getCache("roomsteps" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);

        this.healWitch(roomNumber, witchSeatNumber, targetSeatNumbers[0]);
        this.poisonWitch(roomNumber, witchSeatNumber, targetSeatNumbers[1]);

        progress[steps.step - 1].witch = true;

        setCache("roomprogress" + roomNumber, progress);

        this.setAdminVoices('witch');

        return {
            success: true
        }
    },
    getRoleSeer: function (roomNumber, seatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);
        var seatRole = config.roles[seatNumber - 1];
        var group = seatRole.group;
        var good = true;
        var that = this;

        group.forEach(function (item) {
            if (item === "wolf") {
                good = false;
            }
        });

        progress[steps.step - 1].seer = true;

        setCache("roomprogress" + roomNumber, progress);

        setTimeout(function () {
            that.setAdminVoices('seer');
        }, 2000);

        return {result: good ? "好人" : "狼人"};
    },
    getAlivesGuard: function (roomNumber, selfSeatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var guardRole = config.roles[selfSeatNumber - 1];
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
    actionGuard: function (roomNumber, selfSeatNumber, targetSeatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);
        var queue = config.progress;
        var guard = config.roles[selfSeatNumber - 1];
        var isNextDay;
        var that = this;

        steps.actions[steps.step - 1].guard = targetSeatNumber;
        guard.lastGuard = targetSeatNumber;

        progress[steps.step - 1].guard = true;

        queue.forEach(function (item, i) {
            if (item === 'guard') {
                if (queue[i + 1] === 'day') {
                    isNextDay = true;
                }
            }
        });

        setCache("roomsteps" + roomNumber, steps);

        if (isNextDay) {
            this.calculateResult(roomNumber);
            progress[steps.step - 1].day = true;
        }

        setCache("roomprogress" + roomNumber, progress);

        that.setAdminVoices('guard');

        return {
            success: true
        }
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
        if (action.heal && action.guard && action.heal === action.guard) {
            dead.kill = action.guard;
        }

        if (dead.kill) {
            var role = config.roles[dead.kill - 1];
            role.life = role.role === "hunter" ? 0 : -1;
            deadArr.push(dead.kill);
        }

        if (dead.poison) {
            config.roles[dead.poison - 1].life = -1;
            deadArr.push(dead.poison);
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
        return hunterRole.life === 0 && hunterRole.shoot === 1 ? "[可以]发动技能" : "{不能}发动技能";
    },
    handleActionHunter: function (roomNumber, hunterSeatNumber) {
        this.calculateResult(roomNumber);
        var config = getCache("roomconfig" + roomNumber);
        var queue = config.progress;
        var hunterRole = config.roles[hunterSeatNumber - 1];
        var steps = getCache("roomsteps" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);
        var that = this;

        progress[steps.step - 1].hunter = true;

        queue.forEach(function (item, i) {
            if (item === 'hunter') {
                if (queue[i + 1] === 'day') {
                    progress[steps.step - 1].day = true;
                }
            }
        });

        setCache("roomprogress" + roomNumber, progress);

        setTimeout(function () {
            that.setAdminVoices('hunter');
        }, 2000);

        return {
            result: this.getActionHunter(roomNumber, hunterSeatNumber)
        }
    },
    getDead: function (roomNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        var dead = steps.dead[steps.step - 1];
        var deadStr = "昨晚死亡的是{0}号玩家";
        if (dead.length === 0) {
            deadStr = "昨晚平安夜";
        } else {
            deadStr = deadStr.replace("{0}", dead.join(","));
            if (dead.length > 1) {
                deadStr += ', 排名不分先后';
            }
        }
        return {
            result: deadStr
        };
    },
    getAdminVoices: function (roomNumber) {
        var voices = getCache('roomvoices' + roomNumber);
        var result = voices;
        if (voices.length > 0) {
            setCache('roomvoices' + roomNumber, []);
        }
        return result;
    },
    setAdminVoices: function (progress) {
        var config = getCache("roomconfig" + roomNumber);
        var queue = config.progress;
        var voices = [];
        var next;

        queue.forEach(function (key, i) {
            if (key === progress && i !== queue.length - 1) {
                next = i + 1;
            }
        });

        var pushVoices = function (voice, first) {
            if (voice === 'night' || voice === 'day') {
                voice = 'enter-' + voice;
            } else {
                voice = voice + (first ? '-end' : '-start');
            }
            voices.push(voice);
        };

        pushVoices(progress, true);

        if (next) {
            pushVoices(queue[next]);
        }

        setCache('roomvoices' + roomNumber, voices);
    },
    enterNight: function (roomNumber) {
        var steps = getCache("roomsteps" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);

        steps.step++;
        steps.actions.push({
            type: "night"
        });
        progress[steps.step - 1] = {night: true};

        setCache("roomsteps" + roomNumber, steps);
        setCache("roomprogress" + roomNumber, progress);

        this.setAdminVoices('night');
    },
    handleAction: function (roomNumber, selfSeatNumber, targetSeatNumbers) {
        var config = getCache("roomconfig" + roomNumber);
        var returnResult;
        switch (config.roles[selfSeatNumber - 1].role) {
            case 'wolf':
                returnResult = this.wolfKill(roomNumber, targetSeatNumbers[0]);
                break;
            case 'witch':
                returnResult = this.actionWitch(roomNumber, selfSeatNumber, targetSeatNumbers);
                break;
            case 'seer':
                returnResult = this.getRoleSeer(roomNumber, targetSeatNumbers[0]);
                break;
            case 'guard':
                returnResult = this.actionGuard(roomNumber, selfSeatNumber, targetSeatNumbers[0]);
                break;
        }
        return returnResult;
    },
    getActionList: function (roomNumber, seatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var roleItem = config.roles[seatNumber - 1];
        var role = roleItem.role;
        var queue = config.progress;

        if (roleItem.judge) {
            return {
                judge: true,
                roles: config.roles,
                action: steps.actions[steps.step - 1]
            }
        } else {
            if (progress[steps.step - 1][role] === true) {
                role = 'none';
            }

            queue.every(function (queueItem, i) {
                var index;
                if (queueItem === role) {
                    index = i - 1;
                    if (queue[index] && !progress[steps.step - 1][queue[index]]) {
                        role = 'none';
                        return false;
                    }
                }
                return true;
            });

            var returnResult = {
                role: role,
                list: []
            };
            switch (returnResult.role) {
                case 'wolf':
                    returnResult.list.push(this.getAlives(roomNumber, 'wolf'));
                    break;

                case 'witch':
                    returnResult.list.push(this.getKilledWitch(roomNumber, seatNumber));
                    returnResult.list.push(roleItem.poison > 0 ? this.getAlives(roomNumber) : 0);
                    returnResult.restrict = config.restrict && config.restrict.witch;
                    break;
                case 'seer':
                    returnResult.list.push(this.getAlives(roomNumber));
                    break;
                case 'hunter':
                    returnResult.list.push(this.handleActionHunter(roomNumber, seatNumber));
                    break;
                case 'guard':
                    returnResult.list.push(this.getAlivesGuard(roomNumber, seatNumber));
                    break;
            }
            return returnResult;
        }


    },
    getAdminNightEnd: function (roomNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var progress = getCache("roomprogress" + roomNumber);
        var steps = getCache("roomsteps" + roomNumber);
        var queue = config.progress;
        var ended = true;

        queue.forEach(function (item) {
            if (!progress || !progress[steps.step - 1] || !progress[steps.step - 1][item]) {
                ended = false;
            }
        });

        return {
            ended: ended
        };
    },
    getJudge: function (roomNumber) {
        var config = getCache("roomconfig" + roomNumber);
        var list = [];
        config.roles.forEach(function (role) {
            if (role.life < 1) {
                list.push(role.seatNumber);
            }
        });
        return {
            seats: list
        }
    },
    setJudge: function (roomNumber, seatNumber) {
        var config = getCache("roomconfig" + roomNumber);
        config.roles[seatNumber - 1].judge = true;
        setCache("roomconfig" + roomNumber, config);
        return {
            success: true
        };
    }
};