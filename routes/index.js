var express = require('express');
var router = express.Router();
var core = require('../lib/core');

/* GET home page. */
router.get('/', function (req, res, next) {
    var dev = process.env.DEV;
    res.render(dev ? 'index' : 'index-release');
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

router.post('/getAdminVoices', function (req, res) {
    var roomNumber = req.param('roomNumber');
    res.json(core.getAdminVoices(roomNumber));
});

router.post('/getSkillList', function (req, res) {
    var roomNumber = req.param('roomNumber');
    var seatNumber = req.param('seatNumber');
    res.json(core.getActionList(roomNumber, seatNumber));
});

router.post('/castSkill', function (req, res) {
    var roomNumber = req.param('roomNumber');
    var selfSeatNumber = req.param('selfSeatNumber');
    var targetSeatNumbers = req.param('targetSeatNumbers');
    res.json(core.handleAction(roomNumber, selfSeatNumber, JSON.parse(targetSeatNumbers)));
});

router.post('/getNightEnd', function (req, res) {
    var roomNumber = req.param('roomNumber');
    res.json(core.getAdminNightEnd(roomNumber));
});

router.post('/getNightDead', function (req, res) {
    var roomNumber = req.param('roomNumber');
    res.json(core.getDead(roomNumber));
});

router.post('/getJudge', function (req, res) {
    var roomNumber = req.param('roomNumber');
    res.json(core.getJudge(roomNumber));
});

router.post('/setJudge', function (req, res) {
    var roomNumber = req.param('roomNumber');
    var seatNumber = req.param('seatNumber');
    res.json(core.setJudge(roomNumber, seatNumber));
});

module.exports = router;
