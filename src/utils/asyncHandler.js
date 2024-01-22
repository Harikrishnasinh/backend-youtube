export const asyncHandler = (requestHandler) =>{
    (req,res,next) =>{
        Promise.resolve(requestHandler(request,response,next))
        .catch(error => next(error)) 
    }
}