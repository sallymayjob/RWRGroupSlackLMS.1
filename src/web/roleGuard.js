const DEFAULT_COMMAND_ROLE_MAP = {
  '/learn': ['learner', 'manager', 'admin'],
  '/progress': ['learner', 'manager', 'admin'],
  '/lesson': ['learner', 'manager', 'admin'],
  '/complete': ['learner', 'manager', 'admin'],
  '/onboard': ['manager', 'admin'],
  '/admin': ['admin'],
  '/cohort': ['admin'],
  '/resend': ['admin'],
};

const DEFAULT_ACTION_ROLE_MAP = {
  block_actions: ['manager', 'admin'],
  view_submission: ['manager', 'admin'],
  shortcut: ['manager', 'admin'],
};

function buildRouteKey(normalizedRequest) {
  if (normalizedRequest.routeType === 'slash_command') {
    return normalizedRequest.payload.command || 'unknown_command';
  }
  return normalizedRequest.routeType;
}

function createRoleGuard({
  usersRepo,
  commandRoleMap = DEFAULT_COMMAND_ROLE_MAP,
  actionRoleMap = DEFAULT_ACTION_ROLE_MAP,
} = {}) {
  function resolveActor(normalizedRequest) {
    const slackUserId = normalizedRequest.payload.user_id
      || (normalizedRequest.payload.user && normalizedRequest.payload.user.id)
      || '';

    if (!slackUserId || !usersRepo || !usersRepo.getBySlackUserId) {
      return null;
    }

    const user = usersRepo.getBySlackUserId(slackUserId);
    if (!user) {
      return null;
    }

    return {
      userId: user.user_id,
      slackUserId,
      role: user.role,
      status: user.status,
    };
  }

  function requiredRolesFor(normalizedRequest) {
    if (normalizedRequest.routeType === 'slash_command') {
      return commandRoleMap[normalizedRequest.payload.command] || [];
    }
    return actionRoleMap[normalizedRequest.routeType] || [];
  }

  function authorize(normalizedRequest) {
    const actor = resolveActor(normalizedRequest);
    const requiredRoles = requiredRolesFor(normalizedRequest);
    const routeKey = buildRouteKey(normalizedRequest);

    if (!usersRepo || !usersRepo.getBySlackUserId) {
      return {
        ok: true,
        actor,
        authz: {
          allowed: true,
          routeKey,
          reason: 'authz_bypassed_no_users_repo',
          requiredRoles,
          actorRole: actor ? actor.role : null,
        },
      };
    }

    if (!requiredRoles.length) {
      return {
        ok: true,
        actor,
        authz: {
          allowed: true,
          routeKey,
          reason: 'no_role_required',
          requiredRoles,
          actorRole: actor ? actor.role : null,
        },
      };
    }

    if (!actor) {
      return {
        ok: false,
        actor: null,
        authz: {
          allowed: false,
          routeKey,
          reason: 'actor_not_found',
          requiredRoles,
          actorRole: null,
        },
      };
    }

    if (actor.status !== 'active') {
      return {
        ok: false,
        actor,
        authz: {
          allowed: false,
          routeKey,
          reason: 'actor_inactive',
          requiredRoles,
          actorRole: actor.role,
        },
      };
    }

    const allowed = requiredRoles.includes(actor.role);
    return {
      ok: allowed,
      actor,
      authz: {
        allowed,
        routeKey,
        reason: allowed ? 'authorized' : 'insufficient_role',
        requiredRoles,
        actorRole: actor.role,
      },
    };
  }

  return {
    authorize,
    resolveActor,
    requiredRolesFor,
  };
}

module.exports = {
  createRoleGuard,
  DEFAULT_COMMAND_ROLE_MAP,
  DEFAULT_ACTION_ROLE_MAP,
};
