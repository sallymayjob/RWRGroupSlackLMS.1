/**
 * LMS-012: Column dictionaries and enum validators.
 */

const ENUMS = {
  user_role: ['learner', 'manager', 'admin'],
  user_status: ['active', 'inactive'],
  enrollment_pace_mode: ['self', 'scheduled'],
  progress_status: ['not_started', 'delivered', 'in_progress', 'completed', 'blocked', 'waived'],
  delivery_status: ['queued', 'sent', 'acknowledged', 'completed', 'overdue', 'failed'],
  queue_status: ['pending', 'in_progress', 'done', 'retry', 'failed_permanent'],
  active_flag: ['true', 'false'],
};

const TABLE_RULES = {
  Users: {
    required: ['user_id', 'slack_user_id', 'role', 'status'],
    enums: { role: 'user_role', status: 'user_status' },
  },
  Enrollments: {
    required: ['enrollment_id', 'user_id', 'track_id', 'pace_mode'],
    enums: { pace_mode: 'enrollment_pace_mode' },
  },
  Progress: {
    required: ['progress_id', 'enrollment_id', 'lesson_id', 'status'],
    enums: { status: 'progress_status' },
  },
  Deliveries: {
    required: ['delivery_id', 'user_id', 'lesson_id', 'status', 'idempotency_key'],
    enums: { status: 'delivery_status' },
  },
  Queue: {
    required: ['job_id', 'job_type', 'status'],
    enums: { status: 'queue_status' },
  },
  Tracks: {
    required: ['track_id', 'title'],
    enums: { active_flag: 'active_flag' },
  },
  Lessons: {
    required: ['lesson_id', 'track_id', 'sequence_no', 'title'],
  },
  Content_Pipeline: {
    required: ['pipeline_id', 'content_scope', 'current_stage', 'status'],
  },
};

function validateEnum(enumName, value) {
  if (value === undefined || value === null || value === '') return;
  const options = ENUMS[enumName] || [];
  if (!options.includes(String(value))) {
    throw new Error(`Invalid enum value for ${enumName}: ${value}`);
  }
}

function validateRow(tableName, row) {
  const rules = TABLE_RULES[tableName];
  if (!rules) return;

  for (const key of rules.required || []) {
    if (row[key] === undefined || row[key] === null || row[key] === '') {
      throw new Error(`Missing required field ${tableName}.${key}`);
    }
  }

  for (const [field, enumName] of Object.entries(rules.enums || {})) {
    validateEnum(enumName, row[field]);
  }
}

module.exports = {
  ENUMS,
  TABLE_RULES,
  validateEnum,
  validateRow,
};
