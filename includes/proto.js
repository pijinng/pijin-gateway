const caller = require('grpc-caller');

const PijinRPC = caller(
  `${process.env.PIJIN_SERVICE_IP}:${process.env.PIJIN_SERVICE_PORT}`,
  process.env.PIJIN_PROTO_LOCATION,
  'Pijin',
);
console.info(
  `Listening to PijinRPC at ${process.env.PIJIN_SERVICE_IP}:${process.env.PIJIN_SERVICE_PORT}`,
);

const AuthRPC = caller(
  `${process.env.AUTH_SERVICE_IP}:${process.env.AUTH_SERVICE_PORT}`,
  process.env.AUTH_PROTO_LOCATION,
  'Auth',
);
console.info(
  `Listening to AuthRPC at ${process.env.AUTH_SERVICE_IP}:${process.env.AUTH_SERVICE_PORT}`,
);

module.exports = { PijinRPC, AuthRPC };
