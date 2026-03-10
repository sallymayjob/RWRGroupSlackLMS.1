const SUPPORTED_COMMANDS = new Set([
  '/learn',
  '/progress',
  '/lesson',
  '/complete',
  '/onboard',
  '/admin',
  '/cohort',
  '/resend',
]);

function handleSlashCommand(normalizedRequest, context = {}) {
  const command = normalizedRequest.payload.command;

  if (!SUPPORTED_COMMANDS.has(command)) {
    return {
      ok: false,
      status: 400,
      body: {
        response_type: 'ephemeral',
        text: `Unsupported command: ${command}`,
      },
    };
  }

  return {
    ok: true,
    status: 200,
    body: {
      response_type: 'ephemeral',
      text: `ACK: ${command} accepted (trace: ${context.traceId || 'n/a'})`,
    },
  };
}

module.exports = {
  handleSlashCommand,
  SUPPORTED_COMMANDS,
};
