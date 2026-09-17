# Painel administrativo do portfólio

## Objetivo
Criar uma área `/admin` discreta para editar o conteúdo do portfólio e gerenciar suas galerias, mantendo o site público sem controles administrativos.

## O que será alterado
- Remover os botões de upload da visualização pública.
- Adicionar um link discreto “Admin” no rodapé.
- Criar a página `/admin` com entrada por senha simples `1234`.
- Após entrar, permitir editar nome, chamada principal, apresentação, texto de contato e e-mail.
- Permitir adicionar, renomear e excluir projetos e fotos.
- Permitir adicionar várias imagens à galeria interna de cada projeto.
- Salvar sessão, textos, projetos e fotos no LocalStorage deste navegador.
- Fazer a página pública ler e refletir imediatamente todo o conteúdo salvo.

## Detalhes técnicos
- O bloqueio é local e simples, adequado apenas para ocultar os controles do público casual; não é autenticação segura.
- O conteúdo salvo ficará disponível apenas neste navegador e poderá ser perdido ao limpar os dados do site.
- A página pública continuará com lightbox de fotos e galeria interna dos projetos.
- `/` e `/admin` terão títulos e descrições próprios para compartilhamento e busca.

## Verificação
- Conferir acesso com senha incorreta e correta.
- Editar textos, adicionar e excluir itens, recarregar e confirmar persistência.
- Confirmar que nenhum botão de edição aparece na página pública.
- Conferir a experiência em tela ampla e celular.
