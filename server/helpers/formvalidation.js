const Joi = require('joi')

module.exports = {
    validateBody: (schema) => {
        return (req, res, next) => {
            const result = Joi.validate(req.body, schema)
            if (result.error) {
                return res.status(400).json(result.error)
            }

            if (!req.value) { req.value = {} }
            req.value['body'] = result.value
            next()
        }
    },
    schemas: {
        signupSchema: Joi.object().keys({
            username: Joi.string().alphanum().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
        }),
        signinSchema: Joi.object().keys({
            usernameOrEmail: Joi.alternatives([
                Joi.string().alphanum().min(3).max(30).required(),
                Joi.string().email().required()
            ]),
            password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
        }),
        usernameSchema: Joi.object().keys({
            username: Joi.string().alphanum().min(3).max(30).required(),
        }),
        emailSchema: Joi.object().keys({
            email: Joi.string().email().required()
        }),
        passwordSchema: Joi.object().keys({
            password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
        }),
        groupSchema: Joi.object().keys({
            ['group-name']: Joi.string().alphanum().min(3).max(30).required(),
            ['user-id']: Joi.any()
        }),
        // nameSchema: Joi.object().keys({
        //     name: Joi.string().alphanum().min(3).max(30).required()
        // })
    }
}