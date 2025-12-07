# Política de Segurança - Ciclo Integrado

## Reportar Vulnerabilidades

**NÃO** abra uma issue pública para relatar vulnerabilidades de segurança.

Em vez disso, envie um email para: **security@ciclo-integrado.com**

Inclua:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sua sugestão de correção (se houver)

Você receberá uma resposta em até 48 horas.

## Práticas de Segurança

### Frontend

- ✅ Validação de entrada do lado do cliente
- ✅ Sanitização de dados antes de exibição
- ✅ HTTPS em produção obrigatório
- ✅ Tokens JWT para autenticação
- ✅ CORS configurado corretamente
- ✅ Sem dados sensíveis em localStorage
- ✅ CSP (Content Security Policy) habilitado

### Backend (Em Desenvolvimento)

- ✅ Validação de entrada no servidor
- ✅ SQL Injection prevention
- ✅ Password hashing com bcrypt
- ✅ Rate limiting
- ✅ CORS restritivo
- ✅ Logging de acessos
- ✅ Variáveis de ambiente para secrets

### Dados

- ✅ HTTPS/TLS em trânsito
- ✅ Criptografia em repouso
- ✅ Backup regular
- ✅ GDPR compliant
- ✅ Política de privacidade clara

## Atualizações de Segurança

Acompanhe:
- GitHub Dependabot alerts
- Tailwind CSS security updates
- Browser security features
- OWASP Top 10

## Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Todas as variáveis sensíveis em .env
- [ ] HTTPS configurado
- [ ] CSP headers configurados
- [ ] Autenticação ativada
- [ ] Rate limiting ativado
- [ ] Logging de segurança ativo
- [ ] Backup automático configurado
- [ ] Teste de penetração realizado

## Dependências

Mantenha as dependências atualizadas:

```bash
npm audit
npm update
```

## Contato

- **Email de Segurança**: security@ciclo-integrado.com
- **PGP Key**: [Disponível em request]

---

**Última atualização**: 7 de dezembro de 2025
