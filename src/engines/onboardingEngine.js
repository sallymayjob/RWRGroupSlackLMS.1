/** LMS-023 + LMS-026 Onboarding and enrollment engine */

function createOnboardingEngine({ usersRepo, curriculumRepo, learningOpsRepo, idGenerator = {} }) {
  const makeEnrollmentId = idGenerator.enrollmentId || ((userId, trackId) => `ENR-${userId}-${trackId}`);

  function onboardLearner({ user, trackId, cohortId = '', paceMode = 'scheduled' }) {
    const track = curriculumRepo.getTrackById(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    const normalizedUser = {
      ...user,
      role: user.role || 'learner',
      status: user.status || 'active',
    };
    const userRecord = usersRepo.upsertUser(normalizedUser);

    const enrollment = learningOpsRepo.upsertEnrollment({
      enrollment_id: makeEnrollmentId(userRecord.user_id, trackId),
      user_id: userRecord.user_id,
      track_id: trackId,
      cohort_id: cohortId,
      pace_mode: paceMode,
      enrolled_at: new Date().toISOString(),
      paused_flag: 'false',
    });

    return { user: userRecord, enrollment };
  }

  return { onboardLearner };
}

module.exports = { createOnboardingEngine };
