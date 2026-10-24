
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    allocateGoalContributions
} from '../src/modules/goal-allocation.js';

test('fully funds goals when sufficient money is available', () => {
    const result = allocateGoalContributions({
        availableForGoals: 15000,
        goals: [
            { id: 'education', requiredContribution: 8000, priority: 1 },
            { id: 'home', requiredContribution: 5000, priority: 2 }
        ]
    });

    assert.equal(result.allocations[0].allocatedContribution, 8000);
    assert.equal(result.allocations[1].allocatedContribution, 5000);
    assert.equal(result.unallocatedAmount, 2000);
    assert.equal(result.requiresDecision, false);
});

test('allocates remaining money to lower-priority goals', () => {
    const result = allocateGoalContributions({
        availableForGoals: 10000,
        goals: [
            { id: 'education', requiredContribution: 8000, priority: 1 },
            { id: 'home', requiredContribution: 5000, priority: 2 }
        ]
    });

    assert.equal(result.allocations[0].allocatedContribution, 8000);
    assert.equal(result.allocations[0].shortfall, 0);

    assert.equal(result.allocations[1].allocatedContribution, 2000);
    assert.equal(result.allocations[1].shortfall, 3000);

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
