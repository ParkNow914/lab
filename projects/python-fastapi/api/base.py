"""Base de conhecimento indexada pela busca.

São notas técnicas dos sistemas que eu construí de verdade. Duas razões para
usar isto em vez de um texto genérico: a busca fica com conteúdo real para
recuperar, e o visitante que veio pelo portfólio acaba lendo como cada sistema
funciona por dentro.

O formato é markdown simples: `## ` abre uma seção, e cada seção vira um
trecho indexado.
"""

DOCUMENTOS: list[tuple[str, str, str | None]] = [
    (
        "AgendaZap",
        """
## O que é
SaaS de agenda para salões, barbearias e estética. O cliente final agenda
sozinho, pelo link público ou conversando com uma atendente de inteligência
artificial no WhatsApp, que consulta horários, agenda e cancela sem nenhuma
intervenção humana.

## Como o agendamento pelo WhatsApp funciona
A conversa chega pela Evolution API. A mensagem é interpretada por um modelo
de linguagem que extrai a intenção e os dados soltos no texto: serviço,
profissional e faixa de horário. O sistema consulta a agenda real, devolve os
horários livres e confirma. Não existe menu numerado nem árvore de opções — a
pessoa escreve como falaria com um atendente.

## Redução de faltas
Lembretes automáticos são disparados 24 horas e 2 horas antes do horário.
Isso derruba o não comparecimento, que é a maior perda de receita de um salão:
o horário vago não se recupera, porque o dia tem um número fixo de cadeiras.

## Isolamento entre clientes
O banco é Postgres no Supabase com Row Level Security. Cada estabelecimento é
um inquilino, e a política de linha garante que uma consulta jamais devolva
dado de outro. O isolamento fica no banco, não na aplicação: um bug no código
não vaza dado de um salão para outro.

## Cobrança
Assinatura recorrente pelo Mercado Pago, com 14 dias de teste grátis. O
webhook de pagamento é idempotente: o Mercado Pago pode reenviar a mesma
notificação, e reprocessar não cobra duas vezes nem duplica a assinatura.

## Stack
Next.js 16 com React 19, Supabase com RLS, Gemini para a conversa, Evolution
API para o WhatsApp e Mercado Pago para a cobrança. É um PWA instalável, com
Sentry para monitoramento e tratamento de dados conforme a LGPD.
""",
        "https://agendazap-three.vercel.app",
    ),
    (
        "CRM RealCred+",
        """
## O que é
Inbox omnichannel e CRM para WhatsApp Business usando a API oficial da Meta.
Rodou em operação financeira real, com campanhas, fila de atendimento e
governança de templates.

## API oficial contra API não oficial
Usar a API oficial da Meta significa aprovação de template, janela de 24 horas
e limite de envio — restrições que existem justamente para o número não ser
banido. Operação financeira não pode arriscar perder o número: é o canal de
contato com a carteira inteira.

## Motor de elegibilidade
Antes de qualquer disparo, cada contato passa por regras que decidem se pode
receber: opt-out respeitado, janela de contato, limite de frequência e
situação cadastral. A checagem é feita no envio, não na montagem da campanha —
alguém pode pedir descadastro entre uma coisa e outra.

## Filas e reprocessamento
Envio, webhook e relatório rodam em filas com BullMQ sobre Redis. Falha de
rede não perde mensagem: a tarefa volta para a fila com espera crescente entre
tentativas. Sem fila, um pico de campanha derrubaria o atendimento em tempo
real.

## Infraestrutura
Ficou no Fly.io em São Paulo, com duas máquinas sempre ligadas e cerca de 28
milissegundos de latência até o banco, sem partida a frio. O cliente encerrou
a operação por decisão de custo de infraestrutura; o sistema seguia estável até
o desligamento.

## Automação de qualidade
Doze fluxos no GitHub Actions: integração contínua, testes ponta a ponta com
Playwright, análise CodeQL, varredura de vulnerabilidade com Trivy e SBOM,
backup diário do banco e publicação automática a cada envio.

## Stack
Fastify, React, Prisma, Postgres 17, BullMQ com Redis e Fly.io.
""",
        None,
    ),
    (
        "ParkNow",
        """
## O que é
SaaS de estacionamento inteligente, business to business to consumer: o painel
é usado pelo estacionamento e o aplicativo pelo motorista.

## Pagamento por PIX sem gateway
O código BR Code do PIX é gerado localmente, dentro do próprio sistema,
seguindo a especificação do Banco Central. Não há intermediário cobrando
percentual por transação. Em estacionamento, a margem por vaga é pequena, e
taxa de gateway come justamente essa margem.

## Funcionamento sem internet
O aplicativo é offline-first, feito em React Native com Expo. Entrada e saída
de veículo são registradas localmente e sincronizadas depois. Garagem em
subsolo costuma não ter sinal, e um sistema que só funciona conectado não
funciona no subsolo.

## Mapa em tempo real
Vagas livres aparecem no mapa em tempo real via Socket.IO, com geolocalização
pelo PostGIS no Supabase. Reservas têm expiração automática: vaga reservada e
não ocupada volta a ficar disponível sozinha, senão o estacionamento fica cheio
no sistema e vazio na prática.

## Segurança
Autenticação com JWT e refresh token em cookie httpOnly, senhas com Argon2id,
limitação de taxa com Upstash Redis e CodeQL na integração contínua.

## Organização do código
Monorepo com Turborepo e pnpm. A regra de precificação dinâmica é um pacote
compartilhado entre o painel web e o aplicativo — a conta do preço existe em um
lugar só, e não em dois que divergem com o tempo.
""",
        "https://github.com/ParkNow914/ParkNow",
    ),
    (
        "Bia — assistente de delivery",
        """
## O que é
Assistente de delivery para supermercado, com arquitetura agnóstica de canal:
o mesmo cérebro atende na loja web instalável, no Telegram e no WhatsApp.

## Por que agnóstico de canal
A lógica de pedido, carrinho e catálogo não sabe por onde a conversa chegou.
Trocar ou acrescentar canal não mexe na regra de negócio. Foi o que permitiu
ligar o Telegram depois, sem reescrever nada.

## Catálogo real
São 6.438 produtos vindos do ERP do supermercado, com preço e disponibilidade
reais. Catálogo de demonstração esconde os problemas que só aparecem em escala:
busca lenta, nome duplicado, unidade de medida inconsistente.

## Confiabilidade
487 testes automatizados. O cupom sai em ESC/POS, o padrão das impressoras
térmicas de balcão — o pedido precisa virar papel na mão do separador.
""",
        None,
    ),
    (
        "JurisIA",
        """
## O que é
Plataforma de automação jurídica com quatro produtos: atendimento e triagem no
WhatsApp, geração de peças com inteligência artificial, jurimetria com dados do
TJSP e gestão de leads.

## RAG com fonte citada
A análise de documento usa recuperação aumentada: o sistema busca os trechos
relevantes do processo e responde citando de onde tirou. Em texto jurídico,
resposta sem fonte não serve — o advogado precisa conferir antes de assinar.

## Geração em streaming
As peças são geradas token a token, aparecendo na tela enquanto são escritas.
Documento longo levaria dezenas de segundos para ficar pronto, e uma tela
parada todo esse tempo parece travada.

## Stack
Next.js na interface, Hono sobre Bun na API, Drizzle no banco, BullMQ para as
filas e Stripe para a cobrança recorrente.
""",
        None,
    ),
    (
        "Como eu trabalho",
        """
## Entender antes de codar
A primeira conversa é sobre o objetivo do negócio, não sobre tecnologia.
Sistema que resolve o problema errado com a stack certa continua sendo sistema
errado.

## Onde eu coloco a regra crítica
Invariante que não pode ser violada vai para o banco, em constraint e trigger,
e não só na aplicação. Aplicação tem bug, tem corrida entre requisições e tem
script rodando direto no banco de madrugada. A constraint não tem pressa e não
abre exceção.

## Idempotência em webhook
Todo webhook de pagamento é tratado como se fosse chegar mais de uma vez,
porque vai. Reprocessar a mesma notificação não pode cobrar duas vezes. É o
ponto que mais quebra em SaaS feito às pressas.

## Automação de qualidade
Integração contínua com testes, análise estática e varredura de dependência.
Não é burocracia: é o que permite publicar numa sexta-feira sem medo.
""",
        "https://autarktech.com.br",
    ),
]
