const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        console.log("asyncHandler next type:", typeof next);
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    }
}

export { asyncHandler };