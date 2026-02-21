# NFS-e Emissor - Sistema Simplificado de Emissao de Notas Fiscais

Sistema full stack containerizado para simular emissao de NFS-e (Nota Fiscal de Servico Eletronica) com processamento assincrono via fila.

## Como Rodar

```bash
git clone <repo>
cd nfse-emissor
cp .env.example .env
docker compose up --build
```

### URLs

| Servico          | URL                        |
|------------------|----------------------------|
| Frontend         | http://localhost:5173       |
| API              | http://localhost:3001       |
| Prefeitura Mock  | http://localhost:3002       |

### Credenciais de Demo

- **Email:** `admin@nfse.com`
- **Senha:** `admin123`

## Arquitetura

```
Frontend (React) --> API (Express) --> Redis (BullMQ Queue)
                                            |
                                      Worker (BullMQ)
                                            |
                                      Prefeitura Mock
```

### Servicos

| Servico          | Tecnologia                | Descricao                                |
|------------------|---------------------------|------------------------------------------|
| API              | Node.js + Express + TS    | REST API com autenticacao JWT            |
| Worker           | Node.js + BullMQ + TS     | Consumidor de fila, processa emissoes    |
| Prefeitura Mock  | Node.js + Express         | Simula resposta da prefeitura (70/30)    |
| Frontend         | React + Vite + Tailwind   | SPA com tema dark "terminal financeiro"  |
| DB               | PostgreSQL 16             | Banco de dados com Prisma ORM            |
| Redis            | Redis 7                   | Fila de mensagens para BullMQ            |

## Endpoints da API

| Metodo | Rota                    | Descricao                       | Auth |
|--------|-------------------------|---------------------------------|------|
| POST   | /auth/login             | Login, retorna JWT              | Nao  |
| POST   | /certificates/upload    | Upload de certificado .pfx      | Sim  |
| GET    | /certificates           | Lista certificados do usuario   | Sim  |
| DELETE | /certificates/:id       | Desativa certificado            | Sim  |
| POST   | /sales                  | Cria venda (retorna 202)        | Sim  |
| GET    | /sales                  | Lista vendas com paginacao      | Sim  |
| GET    | /sales/:id              | Detalhes de uma venda           | Sim  |
| GET    | /health                 | Health check                    | Nao  |

## Decisoes de Arquitetura

### Assinatura XML Simplificada

A assinatura digital do XML e simulada: gera-se um hash SHA-256 do conteudo XML concatenado com o fingerprint do certificado, inserido como tag `<Signature>` no XML. Em producao, seria utilizada uma biblioteca como `xml-crypto` com o certificado real.

### Criptografia de Certificados (AES-256-GCM)

Os arquivos .pfx e senhas de certificados sao criptografados com AES-256-GCM antes de salvar no banco:
- **IV**: 16 bytes aleatorios gerados a cada operacao
- **AuthTag**: 16 bytes para autenticacao
- **Layout**: `[IV (16 bytes)][AuthTag (16 bytes)][Ciphertext]`
- **Chave**: 32 caracteres via variavel `CERTIFICATE_ENCRYPTION_KEY`
- Senhas NUNCA sao salvas em texto puro, base64, ou hash simples

### Retries e Backoff Exponencial

O Worker BullMQ utiliza backoff customizado para retentativas:
- Tentativa 1: espera 1 segundo
- Tentativa 2: espera 4 segundos
- Tentativa 3: espera 16 segundos
- Formula: `1000 * 4^(tentativa - 1)`

Apenas erros de rede/timeout geram retry. Rejeicoes da prefeitura sao definitivas.

### Idempotencia

O campo `idempotencyKey` (UUID) previne emissoes duplicadas:
1. Antes de criar, verifica se ja existe sale com essa chave
2. Se existir, retorna a sale existente (HTTP 200)
3. Constraint unique no banco garante atomicidade

### Processamento Assincrono

O `POST /sales` NUNCA processa a emissao diretamente:
1. Salva sale com status PROCESSING
2. Enfileira job no Redis via BullMQ
3. Retorna 202 Accepted imediatamente
4. Worker consome o job e faz POST HTTP para a prefeitura mock

### Webhook

Quando uma NFS-e e emitida com sucesso e `WEBHOOK_URL` esta configurada, o Worker faz POST com:
```json
{
  "event": "nfse.issued",
  "saleId": "uuid",
  "protocol": "PROT-XXXX",
  "amount": 1500.00,
  "issuedAt": "2025-01-01T00:00:00Z"
}
```

## Certificado de Teste

Qualquer arquivo `.pfx` pode ser usado para teste. Para gerar um com OpenSSL:

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=Teste"
openssl pkcs12 -export -out teste.pfx -inkey key.pem -in cert.pem -passout pass:123456
```

Depois, faca upload do `teste.pfx` com senha `123456` na pagina de Certificados.

## Variaveis de Ambiente

Veja `.env.example` para todas as variaveis necessarias.
