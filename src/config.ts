// Configuração pessoal vinda do .env no build local (scripts/build.mjs, ADR 0005). Vazio = não configurado.
export interface TvosConfig {
  tmdbToken: string;
  city: string;
  hdmi1Name: string;
  hdmi2Name: string;
}

declare const __TVOS_CONFIG__: TvosConfig;

export const config: TvosConfig = __TVOS_CONFIG__;
