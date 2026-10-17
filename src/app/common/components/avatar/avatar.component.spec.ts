import { render, screen } from '@testing-library/angular';

import { AvatarComponent } from '~/app/common/components/avatar/avatar.component';

describe('AvatarComponent', () => {
  it('Dado um apelido sem foto, então mostra a inicial em maiúscula', async () => {
    await render(AvatarComponent, { inputs: { name: ' ana' } });

    expect(screen.getByTestId('avatar-initial')).toHaveTextContent('A');
    expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
  });

  it('Dado sem apelido e sem foto, então mostra o ícone neutro', async () => {
    const { container } = await render(AvatarComponent);

    expect(screen.queryByTestId('avatar-initial')).not.toBeInTheDocument();
    expect(container.querySelector('app-icon')).not.toBeNull();
  });

  it('Dado uma foto, então a inicial continua por baixo até a imagem carregar', async () => {
    const { fixture } = await render(AvatarComponent, {
      inputs: { name: 'Ana', src: 'blob:sintetico' },
    });
    const image = screen.getByTestId('avatar-image');

    expect(image).toHaveAttribute('src', 'blob:sintetico');
    expect(image).not.toHaveClass('is-loaded');
    expect(screen.getByTestId('avatar-initial')).toBeInTheDocument();

    image.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(image).toHaveClass('is-loaded');
  });

  it('Dado um rótulo, então expõe a imagem para leitor de tela; sem rótulo, esconde', async () => {
    const { container } = await render(AvatarComponent, { inputs: { name: 'Ana' } });

    expect(container).toHaveAttribute('aria-hidden', 'true');
  });

  it('Dado um rótulo, então vira uma imagem nomeada', async () => {
    const { container } = await render(AvatarComponent, {
      inputs: { name: 'Ana', label: 'Foto de perfil' },
    });

    expect(container).toHaveAttribute('role', 'img');
    expect(container).toHaveAttribute('aria-label', 'Foto de perfil');
  });

  it('Dado o tamanho, então aplica a classe do tamanho', async () => {
    const { container } = await render(AvatarComponent, { inputs: { size: 'lg' } });

    expect(container).toHaveClass('avatar--lg');
  });
});
