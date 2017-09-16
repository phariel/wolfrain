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
    var btnEnter = elRoom.find('.btn-enter');
    var elResultCreate = elRoom.find('.result-create');
    var typeButton = '<button class="btn btn-type-create"></button>';
    var seatButton = '<button class="btn btn-seat"></button>';
    var elRoomTitle = elSeats.find('.room-title-number');

    var elSit = $('.btn-sit');

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
        var elSeatItems = elSeats.find('.btn-seat');
        $.ajax({
            url: '/startstatus',
            method: 'POST',
            data: {
                roomNumber: room
            },
            success: function (data) {
                if (data.seats) {
                    data.seats.forEach(function (seatReady, i) {
                        if (seatReady) {
                            elSeatItems.eq(i).addClass('btn-success');
                        }
                    });
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
                    } else {

                    }
                }
            });
        }
    });
});