const {Job, Contract, Profile, sequelize, Op} = require('./../model');

const addMoneyToProfileBalance = async (depositAmount, clientId) => {
    return await sequelize.transaction(async (t) => {
        const client = await Profile.findOne({
            where: { id: clientId},
        });
        const jobQueryCondition = {
            paid: { [Op.not]: true},
            '$Contract.ClientId$': clientId,
        };
        const jobsToPay = await Job.findAll({
            where: jobQueryCondition,
            include: [
                {model: Contract},
            ],
            attributes: {
                include: [
                    [ sequelize.literal('(SELECT SUM(price) FROM Jobs)'), 'sumOfPrice' ]
                ]
            }
        }, { transaction: t });
        const totalPriceToPayForJobs = await Job.sum('price', { 
                where: jobQueryCondition, 
                include: [
                    {model: Contract},
                ],
            }, { transaction: t });

        if(!client || !jobsToPay) throw new Error('No data found');

        if (depositAmount > 0.25*totalPriceToPayForJobs) throw new Error('You can only deposit 25% of total price of jobs to be paid');

        await Profile.update({
            balance: client.balance + parseFloat(depositAmount)
        }, {
            where: {id: clientId},
            transaction: t
        })

        return;
    }).catch(err => {
        throw new Error(err.toString());
    });
}

module.exports = {
    addMoneyToProfileBalance,
}