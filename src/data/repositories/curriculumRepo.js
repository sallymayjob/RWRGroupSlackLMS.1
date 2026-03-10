/** LMS-015 Cohorts/Tracks/Lessons/Lesson_Content repository */

function createCurriculumRepo(dal) {
  return {
    upsertTrack(track) {
      return dal.upsert('Tracks', track, (row) => row.track_id === track.track_id);
    },
    upsertCohort(cohort) {
      return dal.upsert('Cohorts', cohort, (row) => row.cohort_id === cohort.cohort_id);
    },
    upsertLesson(lesson) {
      return dal.upsert('Lessons', lesson, (row) => row.lesson_id === lesson.lesson_id);
    },
    upsertLessonContent(content) {
      return dal.upsert('Lesson_Content', content, (row) => row.content_id === content.content_id);
    },
    listLessonsByTrack(trackId) {
      return dal.findBy('Lessons', (row) => row.track_id === trackId)
        .sort((a, b) => Number(a.sequence_no) - Number(b.sequence_no));
    },
  };
}

module.exports = { createCurriculumRepo };
