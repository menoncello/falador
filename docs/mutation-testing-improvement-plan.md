# Plano de Melhoria - Mutation Testing Coverage

**Objetivo**: Aumentar mutation score de ~52% para >80%
**Data**: 2025-10-21
**Status Atual**: 375 testes criados, 284/1284 mutantes testados (22% progresso)

## 📊 Análise dos Resultados Parciais

### Métricas Atuais (após 12min de execução)

- **Mutation Score**: ~51.8% (147 killed / 284 tested)
- **Mutantes Sobreviventes**: 137 (48.2%)
- **Arquivos Mutados**: 34 arquivos
- **Total de Mutantes**: 1284
- **Tempo Restante Estimado**: ~42 minutos

### Taxa de Eliminação por Fase

1. **Primeiros 84 mutantes**: 88.1% (muito bom!)
2. **Mutantes 85-165**: ~34% (queda abrupta - área problemática)
3. **Mutantes 166-284**: ~56% (recuperação parcial)

**Conclusão**: Existem áreas específicas do código com baixa cobertura de testes que puxam a média para baixo.

## 🎯 Áreas Identificadas Sem Testes Adequados

### Prioridade ALTA (875 linhas de código crítico)

#### 1. Error Handling (469 linhas) - `src/errors.ts`

**Impacto Estimado**: +15-20% no mutation score

Classes de erro sem testes:

- ✅ `AppError` (base class)
- ❌ `ValidationError` - toJSON() com field condicional
- ❌ `AuthenticationError` - mensagem default
- ❌ `AuthorizationError` - mensagem default
- ❌ `NotFoundError` - lógica de mensagem e resource parsing
- ❌ `ConflictError`
- ❌ `RateLimitError` - toJSON() com retryAfter condicional
- ❌ `InternalServerError`
- ❌ `DatabaseError` - toJSON() com operation condicional
- ❌ `ServiceUnavailableError`
- ❌ `ErrorFactory` - todos os métodos estáticos e lógica de detecção

**Mutantes Esperados**: ~80-100
**Testes Necessários**: ~30-40 testes

#### 2. Route Validation Logic (~200 linhas) - `src/routes/auth.ts` & `src/routes/projects.ts`

**Impacto Estimado**: +10-15% no mutation score

Funções sem testes diretos:

- ❌ `validateApiKeyDeletion()` - lógica de autorização
- ❌ `validateProjectDeletion()` - lógica de autorização
- ❌ Validação de email regex
- ❌ Validação de campos obrigatórios
- ❌ Lógica condicional de spread operators
- ❌ Error responses com status codes

**Mutantes Esperados**: ~40-60
**Testes Necessários**: ~20-30 testes

#### 3. Authentication Utilities (~100 linhas) - `src/utils/auth.ts`

**Impacto Estimado**: +5-8% no mutation score

- ❌ `extractAuthUser()` - parsing de Authorization header
- ❌ Token validation logic
- ❌ Edge cases (null, undefined, malformed tokens)

**Mutantes Esperados**: ~20-30
**Testes Necessários**: ~10-15 testes

#### 4. Constants e Type Guards (~106 linhas)

**Impacto Estimado**: +2-5% no mutation score

- ❌ `src/constants/http-status.ts` - valores constantes
- ❌ `src/constants/crypto.ts` - configurações crypto
- ❌ Type guards em entities

**Mutantes Esperados**: ~15-20
**Testes Necessários**: ~5-10 testes

### Prioridade MÉDIA

#### 5. Melhorias em Testes Existentes

**Impacto Estimado**: +5-10% no mutation score

Áreas com testes que podem ser expandidos:

- Routes (`auth.test.ts`, `projects.test.ts`):
  - ✅ Happy paths cobertos
  - ❌ Faltam edge cases de autorização
  - ❌ Faltam testes de validação negativa
  - ❌ Faltam testes de boundary conditions

- Repositories:
  - ✅ CRUD básico coberto
  - ❌ Faltam testes de concorrência
  - ❌ Faltam testes de null/undefined em todos os métodos

**Testes Adicionais**: ~15-20 testes

## 📋 Plano de Ação - Próxima Iteração

### Fase 1: Testes de Error Handling (Prioridade 1)

**Tempo Estimado**: 2-3 horas
**Ganho Esperado**: +15-20% mutation score

**Arquivo**: `src/errors.test.ts`

Estrutura de testes:

```typescript
describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create error with field');
    it('should create error without field');
    it('should serialize to JSON with field');
    it('should serialize to JSON without field');
  });

  describe('NotFoundError', () => {
    it('should format message with identifier');
    it('should format message without identifier');
    it('should extract resource from message in toJSON');
    it('should handle complex resource names');
  });

  describe('RateLimitError', () => {
    it('should include retryAfter when provided');
    it('should omit retryAfter when not provided');
    it('should use default message');
  });

  // ... similar para outras classes
});

describe('ErrorFactory', () => {
  describe('fromError', () => {
    it('should return AppError as-is');
    it('should convert Error to appropriate AppError');
    it('should handle unknown errors');
  });

  describe('createErrorFromMessage', () => {
    it('should detect not found errors');
    it('should detect authentication errors');
    it('should detect authorization errors');
    it('should detect validation errors');
    it('should detect conflict errors');
    it('should default to InternalServerError');

    // Edge cases
    it('should handle mixed case messages');
    it('should handle multiple keyword matches');
    it('should handle empty messages');
  });

  describe('Factory methods', () => {
    it('validation() should create ValidationError');
    it('notFound() should create NotFoundError');
    it('authentication() should create AuthenticationError');
    // ... etc
  });
});
```

**Testes Esperados**: 35-40 testes
**Mutantes a Matar**: 80-100

### Fase 2: Testes de Route Validation (Prioridade 2)

**Tempo Estimado**: 1.5-2 horas
**Ganho Esperado**: +10-15% mutation score

**Arquivos**:

- `src/routes/auth-validation.test.ts`
- `src/routes/project-validation.test.ts`

Estrutura:

```typescript
describe('validateApiKeyDeletion', () => {
  it('should reject unauthenticated requests');
  it('should reject non-existent API keys');
  it('should reject unauthorized users');
  it('should allow owner to delete');
  it('should handle null authUser');
  it('should handle missing apiKey');
});

describe('Route validation - Register', () => {
  it('should validate email format');
  it('should reject invalid emails');
  it('should reject missing required fields');
  it('should reject duplicate emails');
  it('should handle optional tier parameter');
  it('should handle malformed bodies');
});
```

**Testes Esperados**: 25-30 testes
**Mutantes a Matar**: 40-60

### Fase 3: Testes de Auth Utilities (Prioridade 3)

**Tempo Estimado**: 1 hora
**Ganho Esperado**: +5-8% mutation score

**Arquivo**: `src/utils/auth.test.ts`

```typescript
describe('extractAuthUser', () => {
  it('should extract user from valid Bearer token');
  it('should return null for missing header');
  it('should return null for invalid format');
  it('should return null for malformed token');
  it('should handle expired tokens');
  it('should handle tokens without Bearer prefix');
  it('should handle case sensitivity');
});
```

**Testes Esperados**: 12-15 testes
**Mutantes a Matar**: 20-30

### Fase 4: Expansão de Testes Existentes (Prioridade 4)

**Tempo Estimado**: 1 hora
**Ganho Esperado**: +5-10% mutation score

Adicionar aos testes existentes:

- Edge cases de autorização nas routes
- Testes de boundary conditions
- Testes de null/undefined em repositórios
- Testes de concorrência simples

**Testes Esperados**: 15-20 testes
**Mutantes a Matar**: 30-40

## 🎯 Meta Final

### Projeção de Resultados

- **Testes Atuais**: 375
- **Novos Testes**: ~87-105
- **Total Esperado**: ~460-480 testes

### Mutation Score Esperado

- **Atual**: ~52%
- **Ganho Fase 1**: +15-20% → ~67-72%
- **Ganho Fase 2**: +10-15% → ~77-87%
- **Ganho Fase 3**: +5-8% → ~82-95%
- **Ganho Fase 4**: +5-10% → **~87-100%** ✅

**Conclusão**: Com as 4 fases, devemos atingir facilmente >80% de mutation score.

## 📝 Ordem de Execução Recomendada

1. ✅ **Aguardar conclusão do mutation testing atual** (~30min restantes)
2. ✅ **Analisar relatório detalhado** do Stryker para confirmar gaps
3. ✅ **Executar Fase 1** (Error Handling) - maior impacto
4. ✅ **Executar Fase 2** (Route Validation) - segundo maior impacto
5. ✅ **Rodar mutation testing parcial** para validar progresso
6. ✅ **Executar Fases 3 e 4** se necessário
7. ✅ **Mutation testing final** para confirmar >80%

## 🔍 Indicadores de Sucesso

### Métricas Finais Esperadas

- ✅ Mutation Score > 80%
- ✅ Total de testes: 460-480
- ✅ Todos os arquivos críticos com >75% de cobertura
- ✅ Zero timeouts
- ✅ <5% de mutantes "equivalentes" (não matáveis)

### Relatório de Qualidade

- ✅ Documentação de mutantes sobreviventes
- ✅ Justificativa para mutantes não matáveis
- ✅ Cobertura de edge cases documentada
- ✅ Padrões de teste estabelecidos

## 🚀 Próximos Passos Imediatos

1. **Aguardar relatório completo** do mutation testing em execução
2. **Criar `src/errors.test.ts`** com ~40 testes (Fase 1)
3. **Validar impacto** rodando mutation testing novamente
4. **Iterar** até atingir >80%

---

**Última Atualização**: 2025-10-21 13:00
**Status**: Aguardando conclusão do mutation testing atual (22% completo, ~40min restantes)
