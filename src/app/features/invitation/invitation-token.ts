import { INVITATION_TOKEN_MAX_LENGTH } from '~/modules/auth/core/facades/invitation-accept.facade';

export function takeInvitationToken(doc: Document): string | null {
  const fragment = doc.location.hash;
  if (fragment === '') return null;
  const view = doc.defaultView;
  view?.history.replaceState(
    view.history.state,
    '',
    `${doc.location.pathname}${doc.location.search}`,
  );
  const token = fragment.slice(1).trim();
  return token === '' || token.length > INVITATION_TOKEN_MAX_LENGTH ? null : token;
}
