/**
 * LMS-011: Sheets tab schema bootstrap definitions.
 */

const TAB_SCHEMAS = {
  Users: ['user_id', 'slack_user_id', 'email', 'full_name', 'role', 'manager_user_id', 'status', 'timezone', 'created_at', 'updated_at'],
  Cohorts: ['cohort_id', 'name', 'track_id', 'start_date', 'cadence', 'owner_user_id', 'status', 'updated_at'],
  Tracks: ['track_id', 'title', 'description', 'default_cadence', 'prereq_track_id', 'active_flag', 'updated_at'],
  Lessons: ['lesson_id', 'track_id', 'sequence_no', 'title', 'release_rule', 'requires_approval', 'estimated_minutes', 'status', 'updated_at'],
  Lesson_Content: ['content_id', 'lesson_id', 'version', 'content_markdown', 'assignment_text', 'media_links_json', 'published_flag', 'published_at', 'updated_at'],
  Enrollments: ['enrollment_id', 'user_id', 'track_id', 'cohort_id', 'pace_mode', 'enrolled_at', 'paused_flag', 'updated_at'],
  Progress: ['progress_id', 'enrollment_id', 'lesson_id', 'status', 'delivered_at', 'started_at', 'completed_at', 'score', 'checkin_notes', 'updated_at'],
  Deliveries: ['delivery_id', 'user_id', 'lesson_id', 'scheduled_for', 'sent_at', 'slack_ts', 'channel_id', 'status', 'idempotency_key', 'updated_at'],
  Reminders: ['reminder_id', 'delivery_id', 'reminder_no', 'scheduled_for', 'sent_at', 'status', 'escalation_target_user_id', 'idempotency_key', 'updated_at'],
  Approvals: ['approval_id', 'entity_type', 'entity_id', 'requester_user_id', 'approver_user_id', 'decision', 'decision_at', 'comments', 'updated_at'],
  Message_Templates: ['template_id', 'purpose', 'slack_blocks_json', 'variables_csv', 'active_flag', 'updated_at'],
  Workflow_Rules: ['rule_id', 'domain', 'rule_name', 'rule_value_json', 'priority', 'active_flag', 'updated_at'],
  Settings: ['key', 'value', 'scope', 'updated_at'],
  Audit_Log: ['audit_id', 'trace_id', 'actor', 'action', 'entity_type', 'entity_id', 'before_json', 'after_json', 'created_at'],
  Error_Log: ['error_id', 'trace_id', 'module', 'severity', 'error_message', 'payload_json', 'retryable', 'created_at'],
  Queue: ['job_id', 'job_type', 'payload_json', 'status', 'attempt_count', 'next_attempt_at', 'lock_owner', 'trace_id', 'updated_at'],
  Admin_Actions: ['action_id', 'admin_user_id', 'action_type', 'target_type', 'target_id', 'parameters_json', 'executed_at', 'result'],
  Content_Pipeline: ['pipeline_id', 'content_scope', 'current_stage', 'status', 'owner_user_id', 'source_brief', 'updated_at'],
  Prompt_Configs: ['prompt_id', 'role_name', 'version', 'system_prompt', 'input_schema_json', 'output_schema_json', 'active_flag', 'updated_at'],
  Gem_Roles: ['gem_role_id', 'role_name', 'gem_identifier', 'purpose', 'default_prompt_id', 'sla_seconds', 'active_flag', 'updated_at'],
  QA_Results: ['qa_result_id', 'draft_id', 'qa_agent_role', 'score', 'pass_flag', 'findings_json', 'created_at'],
  Publish_Queue: ['publish_id', 'content_id', 'target_lesson_id', 'status', 'approved_by', 'approved_at', 'published_at', 'updated_at'],
  Generated_Drafts: ['draft_id', 'pipeline_id', 'agent_role', 'draft_text', 'metadata_json', 'created_at', 'status', 'updated_at'],
};

function bootstrapTabSchemas(adapter) {
  const created = [];
  for (const [tabName, columns] of Object.entries(TAB_SCHEMAS)) {
    adapter.ensureTable(tabName, columns);
    created.push({ tabName, columns });
  }
  return created;
}
