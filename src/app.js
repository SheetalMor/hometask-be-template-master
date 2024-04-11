const express = require('express');
const bodyParser = require('body-parser');
const {sequelize, Op} = require('./model')
const {getProfile} = require('./middleware/getProfile');
const app = express();
app.use(bodyParser.json());
app.set('models', sequelize.models)
const contractControllers = require('./controllers/contracts');
const jobControllers = require('./controllers/jobs');
const balancesControllers = require('./controllers/balances');
const adminControllers = require('./controllers/admin');

/**
 * FIXED!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const {id} = req.params;
    await contractControllers.getUserContractById(id, req.profile.id)
        .then(contracts => res.json(contracts))
        .catch(err => {
            res.status(404).end()
        });
});

/**
 * @returns All non-terminated contracts belonging to a user
 */
app.get('/contracts', getProfile, async (req, res) => {
    await contractControllers.getAllActiveContracts(req.profile.id)
        .then(contracts => res.json(contracts))
        .catch(err => {
            res.status(404).end()
        });
});

/**
 * @returns All unpaid jobs belonging to a user for active contracts
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
    await jobControllers.getAllUnpaidJobs(req.profile)
        .then(jobs => res.json(jobs))
        .catch(err => {
            res.status(404).end()
        });
});

/**
 * @returns Client pays to contractor for the job if client balance is atleast equal to job price
 */
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    const {job_id} = req.params;
    await jobControllers.payForJob(job_id, req.profile)
        .then(() => res.json('Success'))
        .catch(err => {
            res.status(422).send({error: err.toString()}).end();
        })
});

/**
 * @returns Adds money to client account with one time limit not exceeding 25% of total amount pending to be paid for all jobs
 */
app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
    const clientId = req.params.userId;
    const depositAmount = parseFloat(req.body.deposit || 0);
    if (depositAmount <= 0) return res.status(400).end();

    await balancesControllers.addMoneyToProfileBalance(depositAmount, clientId)
        .then(() => res.json('Success'))
        .catch(err => {
            res.status(422).send({error: err.toString()}).end();
        })
})

/**
 * @returns best-profession, which earned most money 
 */
app.get('/admin/best-profession', getProfile, async (req, res) => {
    const {start, end} = req.query;
    if (!start || !end) return res.status(400).end();
    await adminControllers.getBestProfessionByDate(decodeURIComponent(start), decodeURIComponent(end))
        .then(bestProfession => res.json(bestProfession))
        .catch(err => {
            res.status(422).send({error: err.toString()}).end();
        })
})

/**
 * @returns list of best clients, who paid the most
 */
app.get('/admin/best-clients', getProfile, async (req, res) =>{
    const {start, end, limit} = req.query;
    if (!start || !end) return res.status(400).end();
    await adminControllers.getBestClientsByDateAndLimit(decodeURIComponent(start), decodeURIComponent(end), limit)
        .then(bestClients => res.json(bestClients))
        .catch(err => {
            res.status(422).send({error: err.toString()}).end();
        })
})

module.exports = app;
