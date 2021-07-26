const jsonResponse =
  (statusCode) =>
  (data = {}) => ({
    headers: {
      'Content-Type': 'application/json',
    },
    statusCode,
    body: JSON.stringify(data),
  });

const success = jsonResponse(200);

const successNoContent = {
  statusCode: 204,
};

const badRequest = jsonResponse(400);

const notFound = jsonResponse(404);

module.exports = {
  success,
  successNoContent,
  badRequest,
  notFound,
};
