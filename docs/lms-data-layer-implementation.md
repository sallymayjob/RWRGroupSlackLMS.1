# LMS Data Layer Implementation (LMS-011 → LMS-012 → LMS-013 → LMS-014..018 → LMS-020)

Implemented in this repository:

- **LMS-011**: Full tab bootstrap catalog in `src/data/schema/tabs.js`.
- **LMS-012**: Enum and required-field validation rules in `src/data/schema/validators.js`.
- **LMS-013**: Typed DAL (`createDal`) with schema bootstrap, insert/upsert, and validation in `src/data/dal.js`.
- **LMS-014**: `Users` repository in `src/data/repositories/usersRepo.js`.
- **LMS-015**: `Cohorts/Tracks/Lessons/Lesson_Content` repository in `src/data/repositories/curriculumRepo.js`.
- **LMS-016**: `Enrollments/Progress/Deliveries/Reminders` repository in `src/data/repositories/learningOpsRepo.js`.
- **LMS-017**: `Queue/Approvals/Admin_Actions` repository in `src/data/repositories/adminOpsRepo.js`.
- **LMS-018**: `Content_Pipeline/Generated_Drafts/QA_Results/Publish_Queue` repository in `src/data/repositories/contentPipelineRepo.js`.
- **LMS-020**: Idempotency helper for deliveries/reminders in `src/services/idempotencyService.js`.

## Validation

```bash
npm test
```

This executes both foundation and data-layer smoke suites.
