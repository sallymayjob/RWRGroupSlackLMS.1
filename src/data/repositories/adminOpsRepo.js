/** LMS-017 Queue/Approvals/Admin_Actions repository */

function createAdminOpsRepo(dal) {
  return {
    enqueue(job) {
      return dal.insert('Queue', job);
    },
    upsertApproval(approval) {
      return dal.upsert('Approvals', approval, (row) => row.approval_id === approval.approval_id);
    },
    logAdminAction(action) {
      return dal.insert('Admin_Actions', action);
    },
    findPendingJobs() {
      return dal.findBy('Queue', (row) => row.status === 'pending' || row.status === 'retry');
    },
  };
}

module.exports = { createAdminOpsRepo };
