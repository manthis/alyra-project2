describe('Voting', function () {
    const contractHelper = async () => {
        const [owner, addr1, addr2, ...addrs] = ethers.getSigners();
        const Voting = await ethers.getContractFactory('Voting');
        const voting = await Voting.deploy();

        return { voting, owner, addr1, addr2, addrs };
    };

    describe('Unit testing', function () {
        describe('Deployment', function () {});
        describe('Getters', function () {});
        describe('Registration', function () {});
        describe('Proposals', function () {});
        describe('Voting', function () {});
        describe('Tallying', function () {});
        describe('Workflow Statuses', function () {});
    });

    describe('E2e testing', function () {
        describe('Whole voting process testing', function () {});
    });
});
