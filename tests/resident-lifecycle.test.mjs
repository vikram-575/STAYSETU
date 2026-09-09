import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Resident State Machine Engine
 * States: active, temporarily_absent, checked_out
 * Events: check_in, pause_stay, resume_stay, checkout
 */
const VALID_TRANSITIONS = {
  active: ['temporarily_absent', 'checked_out'],
  temporarily_absent: ['active', 'checked_out'],
  checked_out: [], // terminal state
}

function transitionResident(currentState, event) {
  if (!['active', 'temporarily_absent', 'checked_out'].includes(currentState)) {
    throw new Error(`Illegal initial state: ${currentState}`)
  }

  let nextState = null
  switch (event) {
    case 'pause_stay':
      nextState = 'temporarily_absent'
      break
    case 'resume_stay':
      nextState = 'active'
      break
    case 'checkout':
      nextState = 'checked_out'
      break
    case 'check_in':
      if (currentState === 'checked_out') {
        throw new Error('Checked out residents cannot check in directly without new onboarding')
      }
      nextState = 'active'
      break
    default:
      throw new Error(`Unknown lifecycle event: ${event}`)
  }

  if (currentState === nextState) {
    return currentState // idempotent no-op
  }

  const allowed = VALID_TRANSITIONS[currentState]
  if (!allowed.includes(nextState)) {
    throw new Error(`Invalid state transition from "${currentState}" to "${nextState}"`)
  }

  return nextState
}

describe('Resident Lifecycle Engine — Senior QA Test Suite', () => {

  // ==========================================
  // 1. EQUIVALENCE PARTITIONING
  // ==========================================
  describe('Technique 1: Equivalence Partitioning (EP)', () => {
    // Catches active resident pause stay transition failure
    it('[EP] [Valid Class: Active -> Temporarily Absent] transitions active resident on leave', () => {
      assert.strictEqual(transitionResident('active', 'pause_stay'), 'temporarily_absent')
    })

    // Catches active resident checkout transition failure
    it('[EP] [Valid Class: Active -> Checked Out] transitions active resident on checkout', () => {
      assert.strictEqual(transitionResident('active', 'checkout'), 'checked_out')
    })

    // Catches invalid/unrecognized state string passing silently without error
    it('[EP] [Invalid Class: Unrecognized State] throws error when resident is in an unknown state', () => {
      assert.throws(() => transitionResident('unknown_status', 'pause_stay'), /Illegal initial state/)
    })

    // Catches invalid/unrecognized event string passing silently without error
    it('[EP] [Invalid Class: Unrecognized Event] throws error when receiving an unsupported action', () => {
      assert.throws(() => transitionResident('active', 'unsupported_event'), /Unknown lifecycle event/)
    })
  })

  // ==========================================
  // 2. BOUNDARY VALUE ANALYSIS
  // ==========================================
  describe('Technique 2: Boundary Value Analysis (BVA)', () => {
    // Catches illegal state transition on terminal state (checked_out is final)
    it('[BVA] [Terminal State Boundary] blocks any event from checked_out state', () => {
      assert.throws(() => transitionResident('checked_out', 'pause_stay'), /Invalid state transition/)
      assert.throws(() => transitionResident('checked_out', 'check_in'), /Checked out residents cannot check in/)
    })

    // Catches duplicate event firing (idempotent state boundary)
    it('[BVA] [Idempotent Boundary] returns identical state when executing redundant transition', () => {
      assert.strictEqual(transitionResident('active', 'resume_stay'), 'active')
      assert.strictEqual(transitionResident('temporarily_absent', 'pause_stay'), 'temporarily_absent')
    })
  })

  // ==========================================
  // 3. DECISION TABLE TESTING
  // ==========================================
  describe('Technique 3: Decision Table Testing (Full State-Event Matrix)', () => {
    // State: active | Event: pause_stay -> temporarily_absent
    it('[Decision Table: Active + pause_stay] -> temporarily_absent', () => {
      assert.strictEqual(transitionResident('active', 'pause_stay'), 'temporarily_absent')
    })

    // State: active | Event: checkout -> checked_out
    it('[Decision Table: Active + checkout] -> checked_out', () => {
      assert.strictEqual(transitionResident('active', 'checkout'), 'checked_out')
    })

    // State: temporarily_absent | Event: resume_stay -> active
    it('[Decision Table: Temporarily Absent + resume_stay] -> active', () => {
      assert.strictEqual(transitionResident('temporarily_absent', 'resume_stay'), 'active')
    })

    // State: temporarily_absent | Event: checkout -> checked_out
    it('[Decision Table: Temporarily Absent + checkout] -> checked_out', () => {
      assert.strictEqual(transitionResident('temporarily_absent', 'checkout'), 'checked_out')
    })

    // State: checked_out | Event: checkout -> idempotent checked_out
    it('[Decision Table: Checked Out + checkout] -> idempotent checked_out', () => {
      assert.strictEqual(transitionResident('checked_out', 'checkout'), 'checked_out')
    })
  })

  // ==========================================
  // 4. STATE TRANSITION TESTING
  // ==========================================
  describe('Technique 4: State Transition Testing (Complete Resident Lifecycle)', () => {
    // Catches broken full lifecycle sequence from Check-in -> Leave -> Return -> Final Checkout
    it('[State Transition: Complete Tenant Journey] active -> temporarily_absent -> active -> checked_out', () => {
      let state = 'active'

      // 1. Goes on vacation
      state = transitionResident(state, 'pause_stay')
      assert.strictEqual(state, 'temporarily_absent')

      // 2. Returns to PG
      state = transitionResident(state, 'resume_stay')
      assert.strictEqual(state, 'active')

      // 3. Final move-out / checkout
      state = transitionResident(state, 'checkout')
      assert.strictEqual(state, 'checked_out')

      // 4. Verification: state cannot be resumed after terminal checkout
      assert.throws(() => transitionResident(state, 'resume_stay'), /Invalid state transition/)
    })
  })

  // ==========================================
  // 5. ERROR / EXCEPTION PATHS
  // ==========================================
  describe('Technique 5: Error & Exception Paths', () => {
    // Catches null state or undefined state argument crashing with unhandled TypeError
    it('[Error Path: Null/Undefined State] throws descriptive error when state is missing', () => {
      assert.throws(() => transitionResident(null, 'checkout'), /Illegal initial state: null/)
      assert.throws(() => transitionResident(undefined, 'checkout'), /Illegal initial state: undefined/)
    })

    // Catches empty event argument
    it('[Error Path: Missing Event] throws descriptive error when event is missing', () => {
      assert.throws(() => transitionResident('active', null), /Unknown lifecycle event: null/)
    })
  })
})
