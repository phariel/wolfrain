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

    var createType;
    var seat = 0;
    var startStatusInterval;

    function setStorage(key, value) {
        window.localStorage.setItem(key, value);
    }

    function getStorage(key) {
        return window.localStorage.getItem(key);
    }

    function initSeat() {
        var roomNumber = getStorage('room');
        var admin = getStorage('admin');
        var seat = getStorage('seat');
        if (seat) {
            seat = JSON.parse(seat);
            if (seat[roomNumber]) {
                elSeatTitle.text(seat[roomNumber]);
                btnRole.removeClass('none');
            }
        }

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
        var seatCache = getStorage('seat');
        if (seatCache) {
            seatCache = JSON.parse(seatCache);
        }
        var room = getStorage('room');
        if (seatCache) {
            seat = seatCache[room];
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
            var seatCache = getStorage('seat');
            if (!seatCache) {
                seatCache = {};
            } else {
                seatCache = JSON.parse(seatCache);
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
                        seatCache[room] = seat;
                        setStorage('seat', JSON.stringify(seatCache));
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
        var seat = getStorage('seat');
        if (seat) {
            seat = JSON.parse(seat);
            seat = seat[room];
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
                }
            }
        });
    });
});