# Melhorias do Painel Admin

## Objetivo
Tornar a criação e edição de projetos mais clara: um projeto pode receber várias imagens de uma vez, cada imagem pode ser recortada antes de salvar e todas as ações importantes exibem confirmação.

## Implementação

1. **Criação de projeto em lote**
   - Ao clicar em “Adicionar Projeto”, abrir um fluxo de criação único.
   - Permitir selecionar várias imagens; a primeira será a capa e todas entrarão na galeria do mesmo projeto.
   - Solicitar título e descrição antes de salvar o projeto.

2. **Editor rápido de imagem**
   - Abrir um modal após selecionar uma imagem nova ou existente.
   - Oferecer enquadramento livre e proporções 1:1, 4:3 e 16:9.
   - Permitir mover e ampliar a imagem, mostrando a prévia do recorte.
   - Em seleções múltiplas, editar as imagens em sequência e só concluir o projeto após todas serem confirmadas.
   - Disponibilizar “Editar imagem” na capa, nas imagens da galeria do projeto e nas fotos do cotidiano.

3. **Notificações**
   - Exibir mensagens no canto da tela para projeto criado/salvo/excluído, textos atualizados, fotos adicionadas/editadas/excluídas e erros de processamento.
   - Substituir o indicador temporário “Salvo” por notificações consistentes.

4. **Persistência e compatibilidade**
   - Manter o formato atual salvo no navegador e atualizar dimensões após cada recorte.
   - Preservar projetos e fotos já salvos.

## Detalhes técnicos
- Usar o modal e os botões do sistema visual existente.
- Usar `sonner` para notificações, montado uma única vez na aplicação.
- Usar uma biblioteca de recorte compatível com React e gerar o resultado final via Canvas no navegador.
- Manter todo o processamento e armazenamento local, sem alterar a área pública nem adicionar serviços externos.

## Validação
- Confirmar que várias fotos criam apenas um projeto.
- Testar recorte nas quatro proporções, zoom e edição de imagem já salva.
- Recarregar a página e confirmar persistência.
- Conferir notificações, painel e site público em telas desktop e móvel.
