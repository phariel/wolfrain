var express = require('express');
var router = express.Router();
var ui = require('../lib/ui');
var core = require('../lib/core');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index');
});

router.get('/createTypes', function (req, res, next) {
    res.json(core.getRoomTypes());
});

router.post('/createRoom', function (req, res) {
    var type = req.param('type');
    res.json({
        roomNumber: core.createRoom(type)
    });
});

router.post('/roomTotal', function (req, res, next) {
    var roomNumber = req.param('roomNumber');
    res.json({
        roomTotal: core.getTotal(roomNumber)
    });
});

router.post('/sitDown', function (req, res) {
    var roomNumber = req.param('roomNumber');
    var seatNumber = req.param('seatNumber');
    res.json({
        success: core.sitDown(roomNumber, seatNumber)
    });
});

router.post('/startStatus', function (req, res) {
    res.json(core.getStartStatus(req.param('roomNumber')));
});

router.post('/getSelfRole', function (req, res) {
    var roomNumber = req.param('roomNumber');
    var seatNumber = req.param('seatNumber');
    res.json(core.getRole(roomNumber, seatNumber));
});

router.post('/gameStart', function (req, res) {
    var roomNumber = req.param('roomNumber');
    res.json(core.gameStart(roomNumber));
});

module.exports = router;
