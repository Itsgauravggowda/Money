
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    allocateGoalContributions
} from '../src/modules/goal-allocation.js';

test('fully funds goals and preserves leftover money', () => {
    const result = allocateGoalContributions({
        availableForGoals: 15000,
        goals: [
            { id: 'education', requiredContribution: 8000, priority: 1 },
            { id: 'home', requiredContribution: 5000, priority: 2 }
        ]
    });

    assert.deepEqual(
        result.allocations.map(goal => goal.allocatedContribution),
        [8000, 5000]
    );
    assert.equal(result.unallocatedAmount, 2000);
    assert.equal(result.requiresDecision, false);
});

test('funds higher-priority goals before lower-priority goals', () => {
    const result = allocateGoalContributions({
        availableForGoals: 10000,
        goals: [
            { id: 'home', requiredContribution: 5000, priority: 2 },
            { id: 'education', requiredContribution: 8000, priority: 1 }
        ]
    });

    assert.equal(
        result.allocations.find(g => g.goalId === 'education').allocatedContribution,
        8000
    );
    assert.equal(
        result.allocations.find(g => g.goalId === 'home').allocatedContribution,
        2000
    );
    assert.equal(result.unallocatedAmount, 0);
});

test('partially funds a single goal when funds are insufficient', () => {
    const result = allocateGoalContributions({
        availableForGoals: 3000,
        goals: [
            { id: 'education', requiredContribution: 8000, priority: 1 }
        ]
    });

    assert.equal(result.allocations[0].allocatedContribution, 3000);
    assert.equal(result.allocations[0].shortfall, 5000);
    assert.equal(result.unallocatedAmount, 0);
    assert.equal(result.requiresDecision, false);
});

test('requests a decision when equal-priority goals cannot all be funded', () => {
    const result = allocateGoalContributions({
        availableForGoals: 10000,
        goals: [
            { id: 'education', requiredContribution: 8000, priority: 1 },
            { id: 'home', requiredContribution: 5000, priority: 1 }
        ]
    });

    assert.equal(result.requiresDecision, true);
    assert.equal(result.allocations[0].allocatedContribution, 0);
    assert.equal(result.allocations[1].allocatedContribution, 0);
    assert.equal(result.unallocatedAmount, 10000);
    assert.ok(result.decisionReason);
});

test('does not fund lower-priority goals while an equal-priority conflict needs a decision', () => {
    const result = allocateGoalContributions({
        availableForGoals: 10000,
        goals: [
            { id: 'education', requiredContribution: 8000, priority: 1 },
            { id: 'home', requiredContribution: 5000, priority: 1 },
            { id: 'travel', requiredContribution: 1000, priority: 2 }
        ]
    });

    assert.equal(result.requiresDecision, true);
    assert.equal(result.allocations[2].allocatedContribution, 0);
    assert.equal(result.unallocatedAmount, 10000);
});

test('retains higher-priority allocations when a later priority group needs a decision', () => {
    const result = allocateGoalContributions({
        availableForGoals: 15000,
        goals: [
            { id: 'education', requiredContribution: 5000, priority: 1 },
            { id: 'home', requiredContribution: 8000, priority: 2 },
            { id: 'travel', requiredContribution: 7000, priority: 2 }
        ]
    });

    assert.equal(result.requiresDecision, true);
    assert.equal(result.allocations[0].allocatedContribution, 5000);
    assert.equal(result.allocations[1].allocatedContribution, 0);
    assert.equal(result.allocations[2].allocatedContribution, 0);
    assert.equal(result.unallocatedAmount, 10000);
});

test('handles zero required contributions', () => {
    const result = allocateGoalContributions({
        availableForGoals: 5000,
        goals: [
            { id: 'funded-goal', requiredContribution: 0, priority: 1 },
            { id: 'education', requiredContribution: 3000, priority: 2 }
        ]
    });

    assert.equal(result.allocations[0].allocatedContribution, 0);
    assert.equal(result.allocations[1].allocatedContribution, 3000);
    assert.equal(result.unallocatedAmount, 2000);
});

test('handles no goals without allocating money', () => {
    const result = allocateGoalContributions({
        availableForGoals: 5000,
        goals: []
    });

    assert.deepEqual(result.allocations, []);
    assert.equal(result.unallocatedAmount, 5000);
    assert.equal(result.requiresDecision, false);
});

test('rejects negative available money', () => {
    assert.throws(
        () => allocateGoalContributions({
            availableForGoals: -100,
            goals: []
        }),
        /availableForGoals must be a non-negative number/
    );
});

test('rejects non-finite available money', () => {
    assert.throws(
        () => allocateGoalContributions({
            availableForGoals: Infinity,
            goals: []
        }),
        /availableForGoals must be a non-negative number/
    );
});

test('rejects duplicate goal IDs', () => {
    assert.throws(
        () => allocateGoalContributions({
            availableForGoals: 10000,
            goals: [
                { id: 'education', requiredContribution: 3000, priority: 1 },
                { id: 'education', requiredContribution: 2000, priority: 2 }
            ]
        }),
        /Duplicate goal id/
    );
});

test('rejects invalid contributions and priorities', () => {
    assert.throws(
        () => allocateGoalContributions({
            availableForGoals: 10000,
            goals: [
                { id: 'education', requiredContribution: -1, priority: 1 }
            ]
        }),
        /Invalid required contribution/
    );

    assert.throws(
        () => allocateGoalContributions({
            availableForGoals: 10000,
            goals: [
                { id: 'education', requiredContribution: 1000, priority: 0 }
            ]
        }),
        /priority.*must be a positive integer/i
    );
});

test('zero-contribution goals do not create a false funding conflict', () => {
    const result = allocateGoalContributions({
        availableForGoals: 3000,
        goals: [
            { id: 'already-funded', requiredContribution: 0, priority: 1 },
            { id: 'education', requiredContribution: 5000, priority: 1 }
        ]
    });

    assert.equal(result.requiresDecision, false);
    assert.equal(
        result.allocations.find(g => g.goalId === 'already-funded')
            .shortfall,
        0
    );
    assert.equal(
        result.allocations.find(g => g.goalId === 'education')
            .allocatedContribution,
        3000
    );
    assert.equal(
        result.allocations.find(g => g.goalId === 'education')
            .shortfall,
        2000
    );
});

test('zero-contribution goals do not hide a genuine funding conflict', () => {
    const result = allocateGoalContributions({
        availableForGoals: 3000,
        goals: [
            { id: 'already-funded', requiredContribution: 0, priority: 1 },
            { id: 'education', requiredContribution: 5000, priority: 1 },
            { id: 'home', requiredContribution: 4000, priority: 1 }
        ]
    });

    assert.equal(result.requiresDecision, true);
    assert.equal(result.unallocatedAmount, 3000);

    assert.equal(
        result.allocations.find(g => g.goalId === 'already-funded')
            .shortfall,
        0
    );

    assert.equal(
        result.allocations.find(g => g.goalId === 'education')
            .allocatedContribution,
        0
    );

    assert.equal(
        result.allocations.find(g => g.goalId === 'home')
            .allocatedContribution,
        0
    );
});

test('rejects null goals with a clear validation error', () => {
    assert.throws(
        () => allocateGoalContributions({
            availableForGoals: 1000,
            goals: [null]
        }),
        /Each goal must be an object/
    );
});
