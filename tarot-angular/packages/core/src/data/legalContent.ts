import type { LanguageCode } from "../types/tarot";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalPageContent = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export const legalContent: Record<
  LanguageCode,
  { privacy: LegalPageContent; terms: LegalPageContent; cookies: LegalPageContent }
> = {
  pt: {
    privacy: {
      title: "Politica de Privacidade",
      lastUpdated: "07/06/2026",
      sections: [
        {
          title: "Controlador dos dados",
          paragraphs: [
            "Este portal de tarot e conteudo editorial e operado como aplicacao web. Os dados de conta, comentarios, XP, avatar e sincronizacao em nuvem sao tratados via Supabase na sua conta autenticada.",
          ],
        },
        {
          title: "Dados coletados",
          paragraphs: [
            "Coletamos e-mail e senha para autenticacao, nome de exibicao, avatar, comentarios em noticias, curtidas, favoritos, pontos de experiencia (XP), leituras e entradas de diario quando voce opta por sincronizar na nuvem.",
            "Preferencias locais (tema, idioma, som, streak) ficam no navegador ate que voce entre na conta.",
          ],
        },
        {
          title: "Base legal (LGPD)",
          paragraphs: [
            "Execucao de contrato: criacao de conta, comentarios, gamificacao e sincronizacao solicitada por voce.",
            "Consentimento: cadastro com aceite desta politica e dos termos.",
            "Legitimo interesse: seguranca, prevencao de abuso e moderacao de conteudo.",
          ],
        },
        {
          title: "Retencao e direitos do titular",
          paragraphs: [
            "Voce pode exportar ou solicitar exclusao dos seus dados na pagina Conta. A exclusao remove leituras, diario, comentarios, interacoes, XP e perfil associados a sua conta.",
            "Para exercer outros direitos previstos na LGPD, use o canal de contato indicado nos Termos.",
          ],
        },
      ],
    },
    terms: {
      title: "Termos de Uso",
      lastUpdated: "07/06/2026",
      sections: [
        {
          title: "Uso aceitavel",
          paragraphs: [
            "Voce concorda em usar o portal de forma respeitosa, sem assedio, spam, conteudo ilegal ou tentativa de manipular XP, curtidas ou favoritos.",
          ],
        },
        {
          title: "Conteudo gerado por usuarios",
          paragraphs: [
            "Comentarios publicados sao de sua responsabilidade. Administradores e moderadores podem remover conteudo que viole estes termos.",
          ],
        },
        {
          title: "Gamificacao",
          paragraphs: [
            "O sistema de XP e acumulativo e pode ser ajustado para corrigir abusos. Nao ha garantia de niveis, recompensas financeiras ou permanencia de pontos apos exclusao de conta.",
          ],
        },
        {
          title: "Limitacao de responsabilidade",
          paragraphs: [
            "O servico e oferecido como ferramenta de estudo e entretenimento simbolico, sem promessa de resultados. Interrupcoes, perda de dados locais ou indisponibilidade da nuvem podem ocorrer.",
          ],
        },
        {
          title: "Contato",
          paragraphs: [
            "Para duvidas sobre estes termos ou privacidade, entre em contato pelo e-mail de suporte informado na pagina Conta ou no repositorio do projeto.",
          ],
        },
      ],
    },
    cookies: {
      title: "Politica de Cookies e Armazenamento Local",
      lastUpdated: "07/06/2026",
      sections: [
        {
          title: "Cookies de sessao",
          paragraphs: [
            "A autenticacao Supabase utiliza cookies e armazenamento seguro de sessao para manter voce logado.",
          ],
        },
        {
          title: "localStorage",
          paragraphs: [
            "Guardamos preferencias de tema, idioma, som, streak diario, favoritos de cartas e rascunhos locais quando voce nao esta sincronizado.",
          ],
        },
        {
          title: "Como desativar",
          paragraphs: [
            "Voce pode sair da conta, limpar dados do site no navegador ou desativar cookies de terceiros. Isso pode impedir login e sincronizacao.",
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "06/07/2026",
      sections: [
        {
          title: "Data controller",
          paragraphs: [
            "This tarot and editorial portal is a web application. Account data, comments, XP, avatar, and cloud sync are processed through Supabase under your authenticated account.",
          ],
        },
        {
          title: "Data collected",
          paragraphs: [
            "We collect email and password for authentication, display name, avatar, news comments, likes, favorites, experience points (XP), readings, and journal entries when you choose cloud sync.",
            "Local preferences (theme, language, sound, streak) stay in the browser until you sign in.",
          ],
        },
        {
          title: "Legal basis (LGPD-aligned)",
          paragraphs: [
            "Contract performance: account creation, comments, gamification, and requested sync.",
            "Consent: sign-up acceptance of this policy and the terms.",
            "Legitimate interest: security, abuse prevention, and content moderation.",
          ],
        },
        {
          title: "Retention and data subject rights",
          paragraphs: [
            "You can export or delete your data from the Account page. Deletion removes readings, journal, comments, interactions, XP, and profile data tied to your account.",
            "For other LGPD rights, use the contact channel listed in the Terms.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Use",
      lastUpdated: "06/07/2026",
      sections: [
        {
          title: "Acceptable use",
          paragraphs: [
            "You agree to use the portal respectfully, without harassment, spam, illegal content, or attempts to manipulate XP, likes, or favorites.",
          ],
        },
        {
          title: "User-generated content",
          paragraphs: [
            "Published comments are your responsibility. Admins and moderators may remove content that violates these terms.",
          ],
        },
        {
          title: "Gamification",
          paragraphs: [
            "The XP system is cumulative and may be adjusted to correct abuse. There is no guarantee of levels, financial rewards, or point permanence after account deletion.",
          ],
        },
        {
          title: "Limitation of liability",
          paragraphs: [
            "The service is offered as a symbolic study and entertainment tool, without promised outcomes. Outages, local data loss, or cloud unavailability may occur.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "For questions about these terms or privacy, contact support via the Account page or the project repository.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookies and Local Storage Policy",
      lastUpdated: "06/07/2026",
      sections: [
        {
          title: "Session cookies",
          paragraphs: [
            "Supabase authentication uses cookies and secure session storage to keep you signed in.",
          ],
        },
        {
          title: "localStorage",
          paragraphs: [
            "We store theme, language, sound, daily streak, card favorites, and local drafts when you are not synced.",
          ],
        },
        {
          title: "How to disable",
          paragraphs: [
            "You can sign out, clear site data in the browser, or disable third-party cookies. This may prevent login and sync.",
          ],
        },
      ],
    },
  },
  es: {
    privacy: {
      title: "Politica de Privacidad",
      lastUpdated: "07/06/2026",
      sections: [
        {
          title: "Responsable del tratamiento",
          paragraphs: [
            "Este portal de tarot y contenido editorial es una aplicacion web. Los datos de cuenta, comentarios, XP, avatar y sincronizacion en la nube se procesan via Supabase en su cuenta autenticada.",
          ],
        },
        {
          title: "Datos recopilados",
          paragraphs: [
            "Recopilamos correo y contrasena para autenticacion, nombre para mostrar, avatar, comentarios en noticias, me gusta, favoritos, puntos de experiencia (XP), lecturas y entradas de diario cuando elige sincronizar en la nube.",
            "Las preferencias locales (tema, idioma, sonido, racha) permanecen en el navegador hasta que inicia sesion.",
          ],
        },
        {
          title: "Base legal (LGPD)",
          paragraphs: [
            "Ejecucion de contrato: creacion de cuenta, comentarios, gamificacion y sincronizacion solicitada.",
            "Consentimiento: registro con aceptacion de esta politica y los terminos.",
            "Interes legitimo: seguridad, prevencion de abuso y moderacion de contenido.",
          ],
        },
        {
          title: "Retencion y derechos del titular",
          paragraphs: [
            "Puede exportar o eliminar sus datos en la pagina Cuenta. La eliminacion borra lecturas, diario, comentarios, interacciones, XP y perfil asociados.",
            "Para otros derechos LGPD, use el canal de contacto indicado en los Terminos.",
          ],
        },
      ],
    },
    terms: {
      title: "Terminos de Uso",
      lastUpdated: "07/06/2026",
      sections: [
        {
          title: "Uso aceptable",
          paragraphs: [
            "Usted acepta usar el portal con respeto, sin acoso, spam, contenido ilegal ni intentos de manipular XP, me gusta o favoritos.",
          ],
        },
        {
          title: "Contenido generado por usuarios",
          paragraphs: [
            "Los comentarios publicados son su responsabilidad. Administradores y moderadores pueden eliminar contenido que viole estos terminos.",
          ],
        },
        {
          title: "Gamificacion",
          paragraphs: [
            "El sistema de XP es acumulativo y puede ajustarse para corregir abusos. No hay garantia de niveles, recompensas financieras ni permanencia de puntos tras eliminar la cuenta.",
          ],
        },
        {
          title: "Limitacion de responsabilidad",
          paragraphs: [
            "El servicio se ofrece como herramienta de estudio y entretenimiento simbolico, sin promesa de resultados. Pueden ocurrir interrupciones, perdida de datos locales o indisponibilidad de la nube.",
          ],
        },
        {
          title: "Contacto",
          paragraphs: [
            "Para dudas sobre estos terminos o privacidad, contacte soporte via la pagina Cuenta o el repositorio del proyecto.",
          ],
        },
      ],
    },
    cookies: {
      title: "Politica de Cookies y Almacenamiento Local",
      lastUpdated: "07/06/2026",
      sections: [
        {
          title: "Cookies de sesion",
          paragraphs: [
            "La autenticacion Supabase utiliza cookies y almacenamiento seguro de sesion para mantenerlo conectado.",
          ],
        },
        {
          title: "localStorage",
          paragraphs: [
            "Guardamos preferencias de tema, idioma, sonido, racha diaria, favoritos de cartas y borradores locales cuando no esta sincronizado.",
          ],
        },
        {
          title: "Como desactivar",
          paragraphs: [
            "Puede cerrar sesion, borrar datos del sitio en el navegador o desactivar cookies de terceros. Esto puede impedir el inicio de sesion y la sincronizacion.",
          ],
        },
      ],
    },
  },
};
