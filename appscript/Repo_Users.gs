/** LMS-014 Users repository */

function createUsersRepo(dal) {
  return {
    upsertUser(user) {
      return dal.upsert('Users', user, (row) => row.user_id === user.user_id);
    },
    getByUserId(userId) {
      return dal.getOne('Users', (row) => row.user_id === userId);
    },
    getBySlackUserId(slackUserId) {
      return dal.getOne('Users', (row) => row.slack_user_id === slackUserId);
    },
    listActiveLearners() {
      return dal.findBy('Users', (row) => row.role === 'learner' && row.status === 'active');
    },
  };
}
