const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

describe('Voting', function () {
    /** WorkflowStatus Enum ===========================================================================================================================*/

    const WorkflowStatus = Object.freeze({
        RegisteringVoters: 0,
        ProposalsRegistrationStarted: 1,
        ProposalsRegistrationEnded: 2,
        VotingSessionStarted: 3,
        VotingSessionEnded: 4,
        VotesTallied: 5,
    });

    /** General fixture ===============================================================================================================================*/

    const fixtureInitialization = async () => {
        const [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const Voting = await ethers.getContractFactory('Voting');
        const voting = await Voting.deploy();

        return { voting, owner, addr1, addr2, addrs };
    };

    /** Unit tests ===================================================================================================================================*/

    describe('Unit testing', function () {
        /** Fixtures */

        const fixtureStartPropositionsRegistering = async () => {
            const { voting, owner, addr1, addr2, addrs } = await fixtureInitialization();

            await voting.connect(owner).addVoter(addr1.address);
            await voting.connect(owner).startProposalsRegistering();

            return { voting, owner, addr1, addr2, addrs };
        };

        const fixtureStartVoting = async () => {
            const { voting, owner, addr1, addr2, addrs } = await fixtureStartPropositionsRegistering();

            await voting.connect(addr1).addProposal('Alyra');
            await voting.connect(owner).endProposalsRegistering();
            await voting.connect(owner).startVotingSession();

            return { voting, owner, addr1, addr2, addrs };
        };

        const fixtureStartVotingAndVote = async () => {
            const { voting, owner, addr1, addr2, addrs } = await fixtureStartVoting();

            await voting.connect(addr1).setVote(1);

            return { voting, owner, addr1, addr2, addrs };
        };

        /** Tests */

        describe('Deployment', function () {
            it('should be the owner who deployed the contract', async function () {
                const { voting, owner } = await loadFixture(fixtureInitialization);

                expect(await voting.owner()).to.equal(owner.address);
            });
        });

        describe('Getters', function () {
            describe('getVoter', function () {
                it('should revert with String when called from a non voter', async function () {
                    const { voting, owner } = await loadFixture(fixtureInitialization);

                    expect(
                        voting.connect(owner).getVoter('0x0000000000000000000000000000000000000000'),
                    ).to.be.revertedWith(`You're not a voter!`);
                });

                it('should return a Voter structure when called by a voter', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);
                    await voting.connect(owner).addVoter(addr1.address);
                    const voter = [true, false, BigInt(0)];

                    expect(await voting.connect(addr1).getVoter(addr1.address)).to.eql(voter);
                });
            });

            describe('getOneProposal', function () {
                it('should revert with String when called from a non voter', async function () {
                    const { voting, owner } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(owner).getOneProposal(0)).to.be.revertedWith(`You're not a voter!`);
                });

                it('should revert with panic code 0x32 when accessing to an out-of-bounds or negative index', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);
                    await voting.connect(owner).addVoter(addr1.address);
                    const proposal = [false, BigInt(0)];

                    expect(voting.connect(addr1).getOneProposal(0)).to.be.revertedWithPanic(0x32);
                });

                it('should return a proposal when called by a voter with a valid index', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartPropositionsRegistering);
                    const proposal = ['GENESIS', BigInt(0)];

                    expect(await voting.connect(addr1).getOneProposal(0)).to.eql(proposal);
                });
            });
        });

        describe('General contract methods', function () {
            describe('addVoter', function () {
                it('should revert if not called by the owner', async function () {
                    const { voting, addr1 } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(addr1).addVoter(addr1.address)).to.be.revertedWith(
                        'Ownable: caller is not the owner',
                    );
                });

                it('should revert if voters registration is not open', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartPropositionsRegistering);

                    expect(voting.connect(owner).addVoter(addr1.address)).to.be.revertedWith(
                        'Voters registration is not open yet',
                    );
                });

                it('should revert if the voter is already registered', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);
                    await voting.connect(owner).addVoter(addr1.address);

                    expect(voting.connect(owner).addVoter(addr1.address)).to.be.revertedWith('Already registered');
                });

                it('should add a voter when called by the owner', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);
                    await voting.connect(owner).addVoter(addr1.address);
                    const voter = [true, false, BigInt(0)];

                    expect(await voting.connect(addr1).getVoter(addr1.address)).to.eql(voter);
                });

                it('should emit a VoterRegistered event on success', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(owner).addVoter(addr1.address))
                        .to.emit(voting, 'VoterRegistered')
                        .withArgs(addr1.address);
                });
            });

            describe('addProposal', function () {
                it('should revert if not called by a voter', async function () {
                    const { voting, owner } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(owner).addProposal('Alyra')).to.be.revertedWith(`You're not a voter!`);
                });

                it('should revert if proposals registration is not open', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);
                    await voting.connect(owner).addVoter(addr1.address);

                    expect(voting.connect(addr1).addProposal('Alyra')).to.be.revertedWith(
                        'Proposals are not allowed yet',
                    );
                });

                it('should revert if proposition is empty', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartPropositionsRegistering);

                    expect(voting.connect(addr1).addProposal('')).to.be.revertedWith(
                        'Vous ne pouvez pas ne rien proposer',
                    );
                });

                it('should add a proposal when called by a voter', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartPropositionsRegistering);
                    await voting.connect(addr1).addProposal('Alyra');
                    const proposal = ['Alyra', BigInt(0)];

                    expect(await voting.connect(addr1).getOneProposal(1)).to.eql(proposal);
                });

                it('should emit a ProposalRegistered event on success', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartPropositionsRegistering);

                    expect(voting.connect(addr1).addProposal('GENESIS'))
                        .to.emit(voting, 'ProposalRegistered')
                        .withArgs(1);
                });
            });

            describe('setVote', function () {
                it('should revert if not called by a voter', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(owner).setVote(0)).to.be.revertedWith(`You're not a voter!`);
                });

                it('should revert if id is out of bounds', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartVoting);

                    expect(voting.connect(addr1).setVote(3)).to.be.revertedWith('Proposal not found');
                });

                it('should revert if voter already voted', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartVotingAndVote);

                    expect(voting.connect(addr1).setVote(1)).to.be.revertedWith('You have already voted');
                });

                it('should revert if voting session is not started', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);
                    await voting.connect(owner).addVoter(addr1.address);

                    expect(voting.connect(addr1).setVote(0)).to.be.revertedWith('Voting session havent started yet');
                });

                it('should emit a Voted event on success', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartVoting);

                    expect(voting.connect(addr1).setVote(1)).to.emit(voting, 'Voted').withArgs(addr1.address, 1);
                });

                it('should increment the vote count of a proposition', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartVotingAndVote);
                    const proposal = ['Alyra', BigInt(1)];

                    expect(await voting.connect(addr1).getOneProposal(1)).to.eql(proposal);
                });

                it('should set the hadVoted property of the user struc to true', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartVotingAndVote);
                    const voter = await voting.connect(addr1).getVoter(addr1.address);

                    expect(voter.hasVoted).to.be.true;
                });

                it('should set the votedProposalId property of the user struct to the id of the voted proposal', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartVotingAndVote);
                    const voter = await voting.connect(addr1).getVoter(addr1.address);

                    expect(voter.votedProposalId).to.be.equal(1);
                });
            });

            describe('tallyVotes', function () {
                it('should revert if not called by the owner', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartVotingAndVote);

                    expect(voting.connect(addr1).tallyVotes()).to.be.revertedWith(`Ownable: caller is not the owner`);
                });

                it('should revert if voting session has not ended', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVoting);

                    expect(voting.connect(owner).tallyVotes()).to.be.revertedWith(
                        'Current status is not voting session ended',
                    );
                });

                it('should emit a WorkflowStatusChange event on success', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVotingAndVote);
                    await voting.connect(owner).endVotingSession();

                    expect(await voting.connect(owner).tallyVotes())
                        .to.emit(voting, 'WorkflowStatusChange')
                        .withArgs(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
                });

                it('should have definied workflowStatus to VotesTallied', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVotingAndVote);
                    await voting.connect(owner).endVotingSession();
                    await voting.connect(owner).tallyVotes();

                    expect(await voting.workflowStatus()).to.be.equal(WorkflowStatus.VotesTallied);
                });

                it('should set winningProposalID with the winning proposal id', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVotingAndVote);
                    await voting.connect(owner).endVotingSession();
                    await voting.connect(owner).tallyVotes();

                    expect(await voting.winningProposalID()).to.be.equal(1);
                });
            });
        });

        describe('Workflow states handling methods', function () {
            describe('startProposalRegistering', function () {
                it('should revert if not called by the owner', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(addr1).startProposalsRegistering()).to.be.revertedWith(
                        `Ownable: caller is not the owner`,
                    );
                });

                it('should revert if proposals registration has already started', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartPropositionsRegistering);

                    expect(voting.connect(owner).startProposalsRegistering()).to.be.revertedWith(
                        'Registering proposals cant be started now',
                    );
                });

                it('should create a default proposition', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureStartPropositionsRegistering);

                    expect(await voting.connect(addr1).getOneProposal(0)).to.eql(['GENESIS', BigInt(0)]);
                });

                it('should emit a WorkflowStatusChange event on success', async function () {
                    const { voting, owner } = await loadFixture(fixtureInitialization);
                    expect(await voting.connect(owner).startProposalsRegistering())
                        .to.emit(voting, 'WorkflowStatusChange')
                        .withArgs(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
                });

                it('should have defined workflowStatus to the ProposalsRegistrationStarted state', async function () {
                    const { voting, owner } = await loadFixture(fixtureInitialization);
                    await voting.connect(owner).startProposalsRegistering();
                    expect(await voting.workflowStatus()).to.be.equal(WorkflowStatus.ProposalsRegistrationStarted);
                });
            });

            describe('endProposalsRegistering', function () {
                it('should revert if not called by the owner', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(addr1).endProposalsRegistering()).to.be.revertedWith(
                        `Ownable: caller is not the owner`,
                    );
                });

                it('should revert if proposals registration has not started', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVoting);

                    expect(voting.connect(owner).endProposalsRegistering()).to.be.revertedWith(
                        'Registering proposals havent started yet',
                    );
                });

                it('should emit a WorkflowStatusChange event on success', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartPropositionsRegistering);
                    expect(await voting.connect(owner).endProposalsRegistering())
                        .to.emit(voting, 'WorkflowStatusChange')
                        .withArgs(
                            WorkflowStatus.ProposalsRegistrationStarted,
                            WorkflowStatus.ProposalsRegistrationEnded,
                        );
                });

                it('should have defined workflowStatus to the ProposalsRegistrationEnded state', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartPropositionsRegistering);
                    await voting.connect(owner).endProposalsRegistering();
                    expect(await voting.workflowStatus()).to.be.equal(WorkflowStatus.ProposalsRegistrationEnded);
                });
            });

            describe('startVotingSession', function () {
                it('should revert if not called by the owner', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(addr1).startVotingSession()).to.be.revertedWith(
                        `Ownable: caller is not the owner`,
                    );
                });

                it('should revert if voting session has already started', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVoting);

                    expect(voting.connect(owner).startVotingSession()).to.be.revertedWith(
                        'Registering proposals phase is not finished',
                    );
                });

                it('should emit a WorkflowStatusChange event on success', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartPropositionsRegistering);
                    await voting.connect(owner).endProposalsRegistering();
                    expect(await voting.connect(owner).startVotingSession())
                        .to.emit(voting, 'WorkflowStatusChange')
                        .withArgs(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
                });

                it('should have defined workflowStatus to the VotingSessionStarted state', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVoting);
                    // await voting.connect(owner).startVotingSession();
                    expect(await voting.workflowStatus()).to.be.equal(WorkflowStatus.VotingSessionStarted);
                });
            });

            describe('endVotingSession', function () {
                it('should revert if not called by the owner', async function () {
                    const { voting, owner, addr1 } = await loadFixture(fixtureInitialization);

                    expect(voting.connect(addr1).endVotingSession()).to.be.revertedWith(
                        `Ownable: caller is not the owner`,
                    );
                });

                it('should revert if ending session has already occured', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVoting);
                    await voting.connect(owner).endVotingSession();

                    expect(voting.connect(owner).endVotingSession()).to.be.revertedWith(
                        'Voting session havent started yet',
                    );
                });

                it('should emit a WorkflowStatusChange event on success', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVotingAndVote);

                    expect(await voting.connect(owner).endVotingSession())
                        .to.emit(voting, 'WorkflowStatusChange')
                        .withArgs(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
                });

                it('should have defined workflowStatus to the VotingSessionEnded state', async function () {
                    const { voting, owner } = await loadFixture(fixtureStartVoting);
                    await voting.connect(owner).endVotingSession();
                    expect(await voting.workflowStatus()).to.be.equal(WorkflowStatus.VotingSessionEnded);
                });
            });
        });
    });

    /** E2E tests ===================================================================================================================================*/

    describe('E2E testing', function () {
        /** Fixtures */

        const fixtureCompleteVoteSession = async () => {
            const { voting, owner, addr1, addr2, addrs } = await fixtureInitialization();

            await voting.connect(owner).addVoter(addr1.address);
            await voting.connect(owner).addVoter(addr2.address);
            await voting.connect(owner).startProposalsRegistering();
            await voting.connect(addr1).addProposal('Alyra1');
            await voting.connect(addr2).addProposal('Alyra2');
            await voting.connect(owner).endProposalsRegistering();
            await voting.connect(owner).startVotingSession();
            await voting.connect(addr1).setVote(1);
            await voting.connect(addr2).setVote(2);
            await voting.connect(owner).endVotingSession();
            await voting.connect(owner).tallyVotes();

            return { voting, owner, addr1, addr2, addrs };
        };

        /** Tests */

        describe('Voting process', function () {
            it('should have an uninitialized winningProposalID (equal 0)', async function () {
                const { voting } = await loadFixture(fixtureInitialization);

                expect(await voting.winningProposalID()).to.be.equal(0);
            });

            it('should have RegisteringVoters as workflowStatus just after deployement', async function () {
                const { voting } = await loadFixture(fixtureInitialization);

                expect(await voting.workflowStatus()).to.be.equal(WorkflowStatus.RegisteringVoters);
            });

            it('should have VotesTallied as workflowStatus once vote session is over', async function () {
                const { voting, owner, addr1, addr2 } = await loadFixture(fixtureCompleteVoteSession);

                expect(await voting.workflowStatus()).to.be.equal(WorkflowStatus.VotesTallied);
            });

            it('should handle equality: first biggest vote is the winningProposalID', async function () {
                const { voting, owner, addr1, addr2 } = await loadFixture(fixtureCompleteVoteSession);

                expect(await voting.winningProposalID()).to.be.equal(1);
            });
        });
    });
});
