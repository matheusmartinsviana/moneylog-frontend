import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ProfileSectionComponent } from '~/app/features/settings/components/profile-section/profile-section.component';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aProblem,
  NotificationsGatewayStub,
  provideNotificationsStub,
  someSettings,
} from '~/testing/notifications-testing';

async function setup(gateway = new NotificationsGatewayStub()) {
  URL.createObjectURL = vi.fn(() => 'blob:sintetico');
  URL.revokeObjectURL = vi.fn();
  const result = await render(ProfileSectionComponent, {
    providers: [provideI18nTesting('pt'), provideNotificationsStub(gateway)],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway };
}

describe('ProfileSectionComponent', () => {
  it('Dado o perfil carregado, então mostra o apelido e a inicial no avatar', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ displayName: 'Ana' });
    await setup(gateway);

    expect(screen.getByTestId('profile-nickname')).toHaveValue('Ana');
    expect(screen.getByTestId('avatar-initial')).toHaveTextContent('A');
    expect(screen.queryByTestId('profile-photo-remove')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-photo-change')).toHaveTextContent('Adicionar foto');
  });

  it('Dado escolher uma foto, então envia o arquivo e mostra o aviso', async () => {
    const { gateway, fixture } = await setup();
    const file = new File(['x'], 'eu.png', { type: 'image/png' });

    await userEvent.upload(screen.getByTestId('profile-photo-change-native'), file);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.uploaded).toEqual(['eu.png']);
    expect(screen.getByTestId('profile-notice')).toHaveTextContent('Foto atualizada.');
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', 'blob:sintetico');
    expect(screen.getByTestId('profile-photo-change')).toHaveTextContent('Trocar foto');
  });

  it('Dado uma foto, então remove e volta para a inicial', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.settingsValue = someSettings({ displayName: 'Ana', hasPhoto: true, photoVersion: 2 });
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('profile-photo-remove'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.removedPhoto).toBe(1);
    expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-photo-remove')).not.toBeInTheDocument();
  });

  it('Dado o envio recusado, então mostra a mensagem do código de erro', async () => {
    const gateway = new NotificationsGatewayStub();
    gateway.uploadError = aProblem(422, 'GOAL_PHOTO_TOO_LARGE');
    const { fixture } = await setup(gateway);

    await userEvent.upload(
      screen.getByTestId('profile-photo-change-native'),
      new File(['x'], 'grande.png', { type: 'image/png' }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('profile-error')).toHaveTextContent('limite de 8 MB');
  });

  it('Dado editar o apelido, então salva com a version carregada', async () => {
    const { gateway, fixture } = await setup();
    const save = screen.getByTestId('profile-nickname-save');

    expect(save).toBeDisabled();
    await userEvent.type(screen.getByTestId('profile-nickname'), 'Bia');
    await userEvent.click(save);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.savedSettings[0]?.displayName).toBe('Bia');
    expect(gateway.savedSettings[0]?.version).toBe(3);
    expect(screen.getByTestId('profile-notice')).toHaveTextContent('Perfil salvo.');
  });
});
