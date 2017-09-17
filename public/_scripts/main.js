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
    var elRoomTitle = elSeats.find('.room-title-number');
    var elSeatTitle = elSeats.find('.seat-title-number');
    var elAlert = $('#alert-dialog');
    var elAlertBody = elAlert.find('.modal-body');

    var elSit = $('.btn-sit');
    var btnRole = $('.btn-role');
    var btnStart = $('.btn-start');
    var btnSkill = $('.btn-skill');
    var elSkill = $('.skill-area');

    var witchTemplate = '<div class="skill skill-witch">' +
        '<h3 class="skill-title"></h3>' +
        '<div class="skill-row"><label>使用解药: </label><select class="form-control heal target"/></div>' +
        '<div class="skill-row"><label>使用毒药: </label><select class="form-control poison target"/></div>' +
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

    function setStorage(key, value) {
        localStorage.setItem(key, value);
    }

    function getStorage(key) {
        return localStorage.getItem(key);
    }

    function playVoices(name, nextName) {
        var voice = $('#audio-' + name);
        if (nextName) {
            voice.one('ended', function () {
                $('#audio-' + nextName)[0].play();
            })
        }

        voice[0].play();
    }

    function initSeat() {
        var roomNumber = getStorage('room');
        var admin = getStorage('admin');
        var state = getStorage('state');
        var started;

        $.ajax({
            url: '/debug',
            method: 'POST',
            data: {
                roomNumber: roomNumber
            },
            success: function (data) {

            }
        });

        if (state) {
            state = JSON.parse(state);
            if (state[roomNumber]) {
                elSeatTitle.text(state[roomNumber].seat);
                started = state[roomNumber].started;
                btnRole.removeClass('none');
            }
        }

        if (started) {
            clearInterval(startStatusInterval);
            elSeats.addClass('none');
            btnSkill.removeClass('none');

            if (admin === roomNumber) {
                btnStart.addClass('none');
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
                            elSeats.append($(seatButton).text(i + 1 + '号').data('seat', i + 1));
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
        var elSeatItems = elSeats.find('.btn-seat');
        $.ajax({
            url: '/startstatus',
            method: 'POST',
            data: {
                roomNumber: room
            },
            success: function (data) {
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
        if (state) {
            state = JSON.parse(state);
        }
        var room = getStorage('room');
        if (state) {
            if (state[room]) {
                seat = state[room].seat;
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
                        elAlertBody.text('坐下失败，是否坐错？');
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
                    setStorage('room', roomNumber);
                    initSeat();
                } else {
                    elAlertBody.text("没有这个房间！");
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
                elAlertBody.text('你的身份：' + data.name);
                elAlert.modal('show');
            }
        });
    });
    btnStart.on('click', function () {
        var room = getStorage('room');
        var state = getStorage('state');
        if (state) {
            state = JSON.parse(state);
        }

        $.ajax({
            url: '/gameStart',
            method: 'POST',
            data: {
                roomNumber: room
            },
            success: function (data) {
                if (!data.started) {
                    elAlertBody.text('还有人没有看身份');
                    elAlert.modal('show');
                } else {
                    state[room].started = true;
                    setStorage('state', JSON.stringify(state));
                    initSeat();
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
                    var role = data.role;
                    switch (role) {
                        case 'none':
                            break;
                        case 'witch':
                            break;
                        case 'hunter':
                            break;
                        default:
                            var title;

                            switch (role) {
                                case 'wolf':
                                    title = '狼人请猎杀: ';
                                    break;
                                case 'seer':
                                    title = '预言家请验人: ';
                                    break;
                                case 'guard':
                                    title = '守卫请守人: ';
                                    break;
                            }

                            var elTemp = $(skillTemplate);
                            var elTarget = elTemp.find('.target');
                            elTemp.find('.skill-title').text(title);
                            elTarget.append('<option value="0" selected>不动作</option>');
                            data.list[0].seats.forEach(function (seat) {
                                elTarget.append('<option value="' + seat + '">' + seat + '号</option>');
                            });

                            elTemp.find('.skill-cancel').on('click', function () {
                                elSkill.html('');
                            });
                            elTemp.find('.skill-okay').on('click', function () {
                                $.ajax({
                                    url: '/castSkill',
                                    method: 'POST',
                                    data: {
                                        roomNumber: room,
                                        selfSeatNumber: seat,
                                        targetSeatNumbers: JSON.stringify([elTarget.val()])
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
        }
    });
});