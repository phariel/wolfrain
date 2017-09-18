require(['jquery', 'bootstrap'], function ($, bs) {
    var elRoom = $('.room');
    var elSeats = $('.seats');
    var elRoomBtn = elRoom.find('.room-btn');
    var btnRoomCreate = elRoomBtn.find('.btn-room-create');
    var btnRoomEnter = elRoomBtn.find('.btn-room-enter');
    var elRoomCreate = elRoom.find('.room-create');
    var elRoomCreateGroup = elRoomCreate.find('.btn-group');
    var elRoomEnter = elRoom.find('.room-enter');
    var btnCreate = elRoom.find('.btn-create');
    var elInputEnter = elRoom.find('.enter-number');
    var btnEnter = elRoom.find('.btn-enter');
    var elResultCreate = elRoom.find('.result-create');
    var typeButton = '<button class="btn btn-type-create"></button>';
    var seatButton = '<button class="btn btn-seat"></button>';
    var elRoomTitle = $('.room-title-number');
    var elSeatTitle = $('.seat-title-number');
    var elAlert = $('#alert-dialog');
    var elAlertBody = elAlert.find('.modal-body');

    var elSit = $('.btn-sit');
    var btnRole = $('.btn-role');
    var btnStart = $('.btn-start');
    var btnSkill = $('.btn-skill');
    var btnLastNight = $('.btn-last-night');
    var btnJudge = $('.btn-judge');
    var elSkill = $('.skill-area');

    var audios = {
        'enter-night': '/_audios/enter-night.m4a',
        'enter-day': '/_audios/enter-day.m4a',
        'wolf-start': '/_audios/wolf-start.m4a',
        'wolf-end': '/_audios/wolf-end.m4a',
        'witch-start': '/_audios/witch-start.m4a',
        'witch-end': '/_audios/witch-end.m4a',
        'seer-start': '/_audios/seer-start.m4a',
        'seer-end': '/_audios/seer-end.m4a',
        'guard-start': '/_audios/guard-start.m4a',
        'guard-end': '/_audios/guard-end.m4a',
        'hunter-start': '/_audios/hunter-start.m4a',
        'hunter-end': '/_audios/hunter-end.m4a'
    };

    var tagRed = '<span class="text-red">{0}</span>';
    var tagGreen = '<span class="text-green">{0}</span>';
    var tagBlue = '<span class="text-blue">{0}</span>';

    var witchTemplate = '<div class="skill skill-witch">' +
        '<h3 class="skill-title">女巫请开始操作</h3>' +
        '<div class="skill-row"><label>使用解药: </label><select class="form-control heal target"/></div>' +
        '<div class="skill-row"><label>使用毒药: </label><select class="form-control poison target"/></div>' +
        '<div class="skill-row"><label class="witch-error"></label></div>' +
        '<div class="skill-footer"><button class="btn btn-danger skill-okay">确认</button>' +
        '<button class="btn skill-cancel">取消</button></div>' +
        '</div>';

    var skillTemplate = '<div class="skill">' +
        '<h3 class="skill-title"></h3>' +
        '<div class="skill-row"><select class="form-control target"/></div>' +
        '<div class="skill-footer"><button class="btn btn-danger skill-okay">确认</button>' +
        '<button class="btn skill-cancel">取消</button></div>' +
        '</div>';

    var createType;
    var seat = 0;
    var startStatusInterval;
    var getAdminVoicesInterval;
    var getAdminNightEndInterval;
    var roomStarted;

    $('.loading').addClass('none');
    elRoom.removeClass('none');

    function setStorage(key, value) {
        localStorage.setItem(key, value);
    }

    function getStorage(key) {
        return localStorage.getItem(key);
    }

    function playVoices(name, nextName) {
        var voice = new Audio(audios[name]);
        if (nextName) {
            $(voice).one('ended', function () {
                setTimeout(function () {
                    new Audio(audios[nextName]).play();
                }, 2000);
            })
        }
        voice.play();
    }

    function initSeat() {
        var roomNumber = getStorage('room');
        var admin = getStorage('admin');
        var state = getStorage('state');
        var started;

        if (state) {
            state = JSON.parse(state);
            if (state[roomNumber]) {
                elSeatTitle.text(state[roomNumber].seat);
                started = state[roomNumber].started;
                btnRole.removeClass('none');
            }
        }

        if (started) {
            elSeats.addClass('none');
            btnSkill.removeClass('none');

            if (admin === roomNumber) {
                btnStart.addClass('none');
                clearInterval(getAdminVoicesInterval);
                getAdminVoicesInterval = setInterval(function () {
                    $.ajax({
                        url: '/getAdminVoices',
                        method: 'POST',
                        data: {
                            roomNumber: roomNumber
                        },
                        success: function (data) {
                            if (data.length > 0) {
                                playVoices(data[0], data[1]);
                            }
                        }
                    });
                }, 2000);

                clearInterval(getAdminNightEndInterval);
                getAdminNightEndInterval = setInterval(function () {
                    $.ajax({
                        url: '/getNightEnd',
                        method: 'POST',
                        data: {
                            roomNumber: roomNumber
                        },
                        success: function (data) {
                            if (data && data.ended) {
                                btnLastNight.removeClass('none');
                                btnJudge.removeClass('none');
                            }
                        }
                    });
                }, 2000);
            }


        } else {
            if (admin === roomNumber) {
                btnStart.removeClass('none');
            }

            elRoomTitle.text(roomNumber);
            if (roomNumber) {
                $.ajax({
                    url: '/roomTotal',
                    method: 'POST',
                    data: {
                        roomNumber: roomNumber
                    },
                    success: function (data) {
                        var total = data.roomTotal;
                        for (var i = 0; i < total; i++) {
                            elSeats.append($(seatButton).text(i + 1).data('seat', i + 1));
                        }
                        elRoom.addClass('none');
                        elSeats.removeClass('none');
                    }
                });
            }
            clearInterval(startStatusInterval);
            startStatusInterval = setInterval(getStartStatus, 1000);
        }

    }

    function getStartStatus() {
        var room = getStorage('room');
        var admin = getStorage('admin');
        var state = getStorage('state');
        if (state) {
            state = JSON.parse(state);
        } else {
            state = {};
        }
        var elSeatItems = elSeats.find('.btn-seat');
        $.ajax({
            url: '/startstatus',
            method: 'POST',
            data: {
                roomNumber: room
            },
            success: function (data) {
                if (data.started) {
                    if (!roomStarted) {
                        clearInterval(startStatusInterval);
                        roomStarted = true;
                        if (!state[room]) {
                            state[room] = {};
                        }
                        state[room].started = true;
                        setStorage('state', JSON.stringify(state));
                        initSeat();
                    }
                } else {
                    if (data.seats) {
                        data.seats.forEach(function (seatSit, i) {
                            if (data.ready[i]) {
                                elSeatItems.eq(i).addClass('btn-success').removeClass('btn-info');
                            } else if (seatSit) {
                                elSeatItems.eq(i).addClass('btn-info');
                            }
                        });
                    }
                    if (room === admin) {
                        btnStart.toggleClass('none', data.started);
                    }
                }

            }
        });
    }

    $.ajax({
        url: '/createTypes',
        method: 'GET',
        success: function (data) {
            data.forEach(function (type) {
                elRoomCreateGroup.append($(typeButton).text(type + "人").data("type", type));
            });
        }
    });

    elRoomCreateGroup.on('click', '.btn-type-create', function () {
        createType = $(this).data('type');
        elResultCreate.text('选择的是：' + createType + '人');
    });

    btnRoomCreate.on('click', function () {
        elRoomBtn.addClass('none');
        elRoomCreate.removeClass('none');
    });

    btnCreate.on('click', function () {
        if (!createType) {
            elResultCreate.text('还未选择');
        } else {
            $.ajax({
                url: '/createRoom',
                method: 'POST',
                data: {
                    type: createType
                },
                success: function (data) {
                    setStorage('room', data.roomNumber);
                    setStorage('admin', data.roomNumber);
                    initSeat();
                }
            });
        }
    });

    elSeats.on('click', '.btn-seat', function () {
        var state = getStorage('state');
        var room = getStorage('room');
        if (state) {
            state = JSON.parse(state);
            if (state[room]) {
                seat = state[room].seat;
            } else {
                seat = 0;
            }
        } else {
            seat = 0;
        }

        if (seat > 0) {
            elSit.addClass('none');

            return;
        }
        var el = $(this);
        elSit.removeClass('none');

        if (el.hasClass('btn-success')) {
            seat = 0;
        } else {
            seat = el.data('seat');
        }
    });

    elSit.on('click', function () {
        if (seat > 0) {
            var room = getStorage('room');
            var stateCache = getStorage('state');
            if (!stateCache) {
                stateCache = {};
            } else {
                stateCache = JSON.parse(stateCache);
            }

            if (!stateCache[room]) {
                stateCache[room] = {};
            }

            $.ajax({
                url: '/sitdown',
                method: 'POST',
                data: {
                    roomNumber: room,
                    seatNumber: seat
                },
                success: function (data) {
                    if (data.success) {
                        elSit.addClass('none');
                        stateCache[room].seat = seat;
                        setStorage('state', JSON.stringify(stateCache));
                        elSeatTitle.text(seat);
                        btnRole.removeClass('none');
                    } else {
                        elAlertBody.html(tagRed.replace('{0}', '坐下失败，是否坐错？'));
                        elAlert.modal('show');
                    }
                }
            });
        }
    });

    btnRoomEnter.on('click', function () {
        elRoomBtn.addClass('none');
        elRoomEnter.removeClass('none');
    });

    btnEnter.on('click', function () {
        var roomNumber = elInputEnter.val();
        $.ajax({
            url: '/roomTotal',
            method: 'POST',
            data: {
                roomNumber: roomNumber
            },
            success: function (data) {
                if (data && data.roomTotal > 0) {
                    elRoomEnter.addClass('none');
                    setStorage('room', roomNumber);
                    initSeat();
                } else {
                    elAlertBody.html(tagRed.replace('{0}', "没有这个房间！"));
                    elAlert.modal('show');
                }
            }
        });
    });
    btnRole.on('click', function () {
        var room = getStorage('room');
        var state = getStorage('state');
        var seat;
        if (state) {
            state = JSON.parse(state);
            seat = state[room].seat;
        }
        $.ajax({
            url: '/getSelfRole',
            method: 'POST',
            data: {
                roomNumber: room,
                seatNumber: seat
            },
            success: function (data) {
                var nameStr;
                if (data.role === 'wolf') {
                    nameStr = tagRed.replace('{0}', data.name);
                } else {
                    nameStr = tagGreen.replace('{0}', data.name);
                }

                elAlertBody.html('你的身份：' + nameStr);
                elAlert.modal('show');
            }
        });
    });
    btnStart.on('click', function () {
        var room = getStorage('room');
        var state = getStorage('state');
        if (state) {
            state = JSON.parse(state);
        } else {
            state = {};
        }

        $.ajax({
            url: '/gameStart',
            method: 'POST',
            data: {
                roomNumber: room
            },
            success: function (data) {
                if (!data.started) {
                    elAlertBody.html(tagRed.replace('{0}', '还有人没有看身份'));
                    elAlert.modal('show');
                } else {
                    if (!state[room]) {
                        state[room] = {};
                    }
                    state[room].started = true;
                    setStorage('state', JSON.stringify(state));
                    initSeat();
                }
            }
        });
    });
    btnLastNight.on('click', function () {
        var room = getStorage('room');
        $.ajax({
            url: '/getNightDead',
            method: 'POST',
            data: {
                roomNumber: room
            },
            success: function (data) {
                if (data && data.result) {
                    elAlertBody.html(tagRed.replace('{0}', data.result));
                    elAlert.modal('show');
                }
            }
        });
    });
    btnJudge.on('click', function () {
        var room = getStorage('room');
        $.ajax({
            url: '/getJudge',
            method: 'POST',
            data: {
                roomNumber: room
            },
            success: function (data) {
                if (data && data.seats) {
                    var elTemp = $(skillTemplate);
                    var elTarget = elTemp.find('.target');

                    data.seats.forEach(function (seat) {
                        elTarget.append('<option value="' + seat + '">' + seat + '号</option>');
                    });
                    elTemp.find('.skill-cancel').on('click', function () {
                        elSkill.html('');
                    });

                    elTemp.find('.skill-okay').on('click', function () {
                        $.ajax({
                            url: '/setJudge',
                            method: 'POST',
                            data: {
                                roomNumber: room,
                                seatNumber: parseInt(elTarget.val(), 10)
                            },
                            success: function () {
                                elSkill.html('');
                            }
                        });
                    });

                    elSkill.html(elTemp);
                }
            }
        });
    });
    btnSkill.on('click', function () {
        elSkill.html('');
        var room = getStorage('room');
        var state = getStorage('state');
        var seat;
        if (state) {
            state = JSON.parse(state);
            if (state[room]) {
                seat = state[room].seat;
            }
        }

        if (room && seat) {
            $.ajax({
                url: '/getSkillList',
                method: 'POST',
                data: {
                    roomNumber: room,
                    seatNumber: seat
                },
                success: function (data) {
                    if (data.judge) {
                        var judgeResult = '';
                        var roleItem = '<div>{0}号身份: {1}</div>';
                        var actionItem = '<div>{0}: {1}号</div>';
                        if (data.roles) {
                            data.roles.forEach(function (role) {
                                judgeResult += roleItem.replace('{0}', role.seatNumber).replace('{1}', role.name);
                            });
                        }
                        if (data.action) {
                            Object.keys(data.action).forEach(function (action) {
                                if (action === 'kill') {
                                    judgeResult += actionItem.replace('{0}', '狼刀').replace('{1}', data.action[action]);
                                }
                                if (action === 'heal') {
                                    judgeResult += actionItem.replace('{0}', '解药').replace('{1}', data.action[action]);
                                }
                                if (action === 'poison') {
                                    judgeResult += actionItem.replace('{0}', '毒药').replace('{1}', data.action[action]);
                                }
                                if (action === 'guard') {
                                    judgeResult += actionItem.replace('{0}', '守护').replace('{1}', data.action[action]);
                                }
                            });
                        }

                        elSkill.html(judgeResult);

                        return;
                    }

                    btnSkill.addClass('none');
                    var role = data.role;
                    var elTemp;
                    switch (role) {
                        case 'none':
                            btnSkill.removeClass('none');
                            break;
                        case 'witch':
                            elTemp = $(witchTemplate);
                            var elHeal = elTemp.find('.heal.target');
                            var elPoison = elTemp.find('.poison.target');
                            var elError = elTemp.find('.witch-error');
                            var errorMsg = '';
                            var healList = data.list[0];
                            var poisonList = data.list[1];
                            var restrict = data.restrict;

                            elHeal.append('<option value="0" selected>不救</option>');
                            elPoison.append('<option value="0" selected>不动作</option>');
                            if (restrict && restrict.double === false) {
                                elHeal.on('change', function () {
                                    if (parseInt($(this).val(), 10) !== 0) {
                                        elPoison.attr('disabled', 'disabled');
                                    } else {
                                        elPoison.removeAttr('disabled');
                                    }
                                });
                            }

                            switch (healList) {
                                case 0:
                                    elHeal.attr('disabled');
                                    errorMsg += "解药用完了。";
                                    break;
                                case -1:
                                    elHeal.attr('disabled');
                                    errorMsg += "昨晚死的是自己，不能自救。";
                                    break;
                                default:
                                    elHeal.append('<option value="' + healList + '">' + healList + '号</option>');
                            }

                            switch (poisonList) {
                                case 0:
                                    elPoison.attr('disabled');
                                    errorMsg += "毒药用完了。";
                                    break;
                                default:
                                    poisonList.seats.forEach(function (seat) {
                                        elPoison.append('<option value="' + seat + '">' + seat + '号</option>');
                                    });
                            }

                            elError.text(errorMsg);

                            elTemp.find('.skill-cancel').on('click', function () {
                                elSkill.html('');
                                btnSkill.removeClass('none');
                            });
                            elTemp.find('.skill-okay').on('click', function () {
                                var seatNumbers = [];

                                seatNumbers.push(elHeal.attr('disabled') === 'disabled' ? 0 : parseInt(elHeal.val(), 10));
                                seatNumbers.push(elPoison.attr('disabled') === 'disabled' ? 0 : parseInt(elPoison.val(), 10));

                                $.ajax({
                                    url: '/castSkill',
                                    method: 'POST',
                                    data: {
                                        roomNumber: room,
                                        selfSeatNumber: seat,
                                        targetSeatNumbers: JSON.stringify(seatNumbers)
                                    },
                                    success: function (data) {
                                        elSkill.html('');
                                        btnSkill.removeClass('none');
                                        if (data && data.result) {
                                            elAlertBody.text(elTarget.val() + '号: ' + tagBlue.replace('{0}', data.result));
                                        }
                                    }
                                });
                            });
                            elSkill.html(elTemp);


                            break;
                        case 'hunter':
                            btnSkill.removeClass('none');
                            var hunterResult = data.list[0].result;
                            hunterResult = hunterResult.replace('\[', '<span class="text-green">').replace('\]', '</span>').replace('\{', '<span class="text-red">').replace('\}', '</span>');
                            elAlertBody.html(hunterResult);
                            elAlert.modal('show');
                            break;
                        default:
                            var title;
                            elTemp = $(skillTemplate);
                            var elTarget = elTemp.find('.target');

                            switch (role) {
                                case 'wolf':
                                    title = '狼人请猎杀: ';
                                    elTarget.append('<option value="0" selected>不动作</option>');
                                    break;
                                case 'seer':
                                    title = '预言家请验人: ';
                                    break;
                                case 'guard':
                                    title = '守卫请守人: ';
                                    elTarget.append('<option value="0" selected>不动作</option>');
                                    break;
                            }

                            elTemp.find('.skill-title').text(title);

                            data.list[0].seats.forEach(function (seat) {
                                elTarget.append('<option value="' + seat + '">' + seat + '号</option>');
                            });

                            elTemp.find('.skill-cancel').on('click', function () {
                                elSkill.html('');
                                btnSkill.removeClass('none');
                            });
                            elTemp.find('.skill-okay').on('click', function () {
                                $.ajax({
                                    url: '/castSkill',
                                    method: 'POST',
                                    data: {
                                        roomNumber: room,
                                        selfSeatNumber: seat,
                                        targetSeatNumbers: JSON.stringify([parseInt(elTarget.val(), 10)])
                                    },
                                    success: function (data) {
                                        elSkill.html('');
                                        btnSkill.removeClass('none');
                                        if (data && data.result) {
                                            elAlertBody.text(elTarget.val() + '号: ' + tagBlue.replace('{0}', data.result));
                                            elAlert.modal('show');
                                        }
                                    }
                                });
                            });
                            elSkill.html(elTemp);
                    }
                }
            });
        }
    });
});