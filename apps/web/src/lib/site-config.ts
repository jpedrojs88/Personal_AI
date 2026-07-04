type ContactLink = {
  label: string;
  href: string;
  value: string;
};

function readEnv(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export const siteConfig = {
  brandName: readEnv(import.meta.env.VITE_LEGAL_BUSINESS_NAME, "Personal IA"),
  legalEmail: readEnv(import.meta.env.VITE_CONTACT_EMAIL, "contato@personalia.app"),
  supportPhone: readEnv(import.meta.env.VITE_CONTACT_PHONE, ""),
  whatsapp: readEnv(import.meta.env.VITE_CONTACT_WHATSAPP, ""),
  instagram: readEnv(import.meta.env.VITE_CONTACT_INSTAGRAM, ""),
  address: readEnv(import.meta.env.VITE_CONTACT_ADDRESS, "Endereco comercial sob demanda no canal de suporte."),
  supportHours: readEnv(
    import.meta.env.VITE_CONTACT_SUPPORT_HOURS,
    "Segunda a sexta, das 9h as 18h (horario de Brasilia).",
  ),
};

export function getContactLinks() {
  const links: ContactLink[] = [
    {
      label: "Email",
      href: `mailto:${siteConfig.legalEmail}`,
      value: siteConfig.legalEmail,
    },
  ];

  if (siteConfig.supportPhone) {
    links.push({
      label: "Telefone",
      href: `tel:${normalizePhone(siteConfig.supportPhone)}`,
      value: siteConfig.supportPhone,
    });
  }

  if (siteConfig.whatsapp) {
    links.push({
      label: "WhatsApp",
      href: `https://wa.me/${normalizePhone(siteConfig.whatsapp)}`,
      value: siteConfig.whatsapp,
    });
  }

  if (siteConfig.instagram) {
    const normalizedInstagram = siteConfig.instagram.startsWith("http")
      ? siteConfig.instagram
      : `https://instagram.com/${siteConfig.instagram.replace(/^@/, "")}`;

    links.push({
      label: "Instagram",
      href: normalizedInstagram,
      value: siteConfig.instagram,
    });
  }

  return links;
}
