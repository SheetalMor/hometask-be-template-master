const {Job, Contract, Profile, sequelize, Op} = require('./../model');

const getAllUnpaidJobs = async (user) => {
    let userQuery = (user.type === 'client') ? '$Contract.ClientId$' : '$Contract.ContractorId$';
    const jobs = await Job.findAll({
        where: {
            '$Contract.status$': 'in_progress',
            paid: { [Op.not]: true},
            [userQuery]: user.id,
        },
        include: [
            {model: Contract, attributes: []}
        ]
    }).catch(err => {
        throw new Error('Jobs not found')
    });
    return jobs;
}

const payForJob = async (jobId, client) => {
    return await sequelize.transaction(async (t) => {

        // find job, contractor details
        const job = await Job.findOne({
            where: {
                id: jobId,
                paid: { [Op.not]: true},
                '$Contract.ClientId$': client.id,
            },
            include: [
                {model: Contract, include: [ {model: Profile, as: 'Contractor', lock: true}]}
            ]
        }, { transaction: t });

        if(!job) throw new Error('Job not found');
        if (client.balance < job.price) throw new Error('Insufficient balance for the job, Please deposite money in your account first.');

        // deduct balance from client
        await Profile.update({
            balance: (client.balance - job.price),
        },{
            where: {id: client.id},
            transaction: t 
        })

        // add balance to contractor
        await Profile.update({
            balance: (job.Contract.Contractor.balance + job.price)
        }, {
            where: {id: job.Contract.ContractorId},
            transaction: t
        })

        // mark job as paid
        Job.update({
            paid: true,
            paymentDate: Date.now()
        },{
            where: {id: jobId}
        })

        // if the control reaches here, it means the transaction is a success
        return;
    }).catch(err => {
        // rollback automatically
        throw new Error('Payment failed: ', err);
    });
}

module.exports = {
    getAllUnpaidJobs,
    payForJob
}