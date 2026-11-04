# Modelo de ameaça e checklist

## Conteúdo
- Modelo de ameaça
- Checklist por tipo de mudança
- Greps de revisão

## Modelo de ameaça

| Ameaça | Exemplo no tvOS | Controle esperado |
|---|---|---|
| XSS por conteúdo externo | título/descrição de mídia, feed RSS, resposta de API com HTML | escape por padrão; sanitizer com allowlist; CSP sem `unsafe-eval` |
| URL maliciosa | `javascript:` num link de catálogo, iframe de origem trocada | só `https:`; allowlist de origens para iframe/mídia |
| Segredo vazado | chave de API no bundle, token em log, `.env` commitado | segredo só em backend; `.gitignore`; revisão do diff; rotação se vazou |
| Roubo de sessão de serviço | token salvo sem expiração, em URL ou log | escopo/duração mínimos; nunca em URL/log; logout limpa |
| Abuso de APIs da TV | parâmetro de Luna montado com texto externo; app embutido chamando sistema | módulo `platform` único, parâmetros validados, sem expor a iframes |
| Rede local hostil | dispositivo na LAN falando com serviço do tvOS; resposta SSDP forjada | autenticação/pareamento; validar tudo que chega da LAN |
| SSH root exposto (ADR 0007) | shell root na TV para qualquer um na LAN | só chave (senha padrão `alpine` some com `authorized_keys`), telnet off, chave fora do git |
| Mídia/arquivo hostil (USB/rede) | nome de arquivo com HTML, arquivo gigante, formato inesperado | nome como texto; limite de tamanho; tipo conferido pelo conteúdo |
| Supply chain | pacote typosquat, `postinstall` malicioso, lib abandonada | justificar dependência; lockfile; audit; versão fixa |
| Negação de serviço local | lista/infinita sem teto, imagem enorme, loop de retry | limites, backoff, virtualização |
| Vazamento de privacidade | analytics com o que é assistido; log com dados pessoais | sem telemetria sem ADR; logs mínimos |
| Fail-open | `catch {}` em validação libera o fluxo | erro = negar e mostrar mensagem |

## Checklist por tipo de mudança

| Mudança | Verifique |
|---|---|
| Fetch/rede nova | `https:`, timeout, validação da resposta, erro sem vazar detalhe, sem token em URL |
| Exibir conteúdo externo | escape/sanitizer, URL validada, imagem com tamanho limitado |
| Iframe/app embutido | `sandbox` mínimo, origem fixa, `postMessage` com `origin` conferido |
| Storage local | só o necessário, `try/catch` + validação na leitura, versão do formato |
| API do sistema da TV | passa pelo módulo `platform`, parâmetros validados, motivo registrado |
| Credencial/login | escopo mínimo, expiração, logout limpa, nada no bundle/log |
| Dependência | necessidade, manutenção, licença, tamanho, audit, lockfile |
| Serviço na LAN / backend | autenticação, CORS restrito, rate limit, segredo fora do git, custo |
| Build/deploy | CSP no HTML, source map fora do pacote de produção, `.ipk` sem arquivo pessoal |

## Greps de revisão

```bash
grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|document\.write|dangerouslySetInnerHTML|v-html" src
grep -rnE "\beval\(|new Function\(|setTimeout\(['\"]" src
grep -rnE "postMessage\(|addEventListener\(['\"]message" src
grep -rnE "localStorage|sessionStorage|indexedDB" src
grep -rnE "luna://|webOS\.service|webOSTV" src
grep -rnE "http://" src
# Segredos em arquivo versionado (lista arquivo:linha, nunca o valor)
git grep -nIE "AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|BEGIN [A-Z ]*PRIVATE KEY|(api[_-]?key|secret|password|token) *[:=] *['\"][^'\"]{8,}" | cut -d: -f1,2
git ls-files | grep -iE '\.env|\.pem|\.key|id_rsa|\.ipk'
```

Grep levanta candidatos; o veredito vem da leitura do código.
