const route = require('express').Router();
const controller = require('../controllers/controller');
const middleware = require('../middlewares/middleware');

route.post('/become-node', controller.becomeNode);
route.post('/register-new-node', controller.registerNewNode);
route.get('/check-node-status', controller.checkNodeStatus);
route.post('/new-wallet', controller.newWallet);
route.post('/register-new-wallet', controller.registerNewWallet);
route.post('/wallet-login', controller.walletLogin);
route.post('/transfer', middleware.checkMoneyAndLegitimacy, controller.transfer);
route.post('/transaction-start', controller.transactionStart);
route.put('/transaction-approve', controller.transactionApprove);
route.get('/check-connection', controller.checkConnection);

module.exports = route;      