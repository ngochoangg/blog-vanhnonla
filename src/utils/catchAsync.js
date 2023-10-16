
/**
 * Async function catching to handler errors 
 * @param {Function} fn whole Asynchonus function of controllers
 * @returns response to client result or readable error if any
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };