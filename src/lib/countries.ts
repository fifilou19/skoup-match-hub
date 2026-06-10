export type Country = {
  name: string;
  code: string; // ISO
  dial: string;
  flag: string;
};

// Pays africains francophones d'abord
export const FRANCOPHONE_AFRICA: Country[] = [
  { name: "Côte d'Ivoire", code: "CI", dial: "+225", flag: "🇨🇮" },
  { name: "Sénégal", code: "SN", dial: "+221", flag: "🇸🇳" },
  { name: "Cameroun", code: "CM", dial: "+237", flag: "🇨🇲" },
  { name: "Mali", code: "ML", dial: "+223", flag: "🇲🇱" },
  { name: "Bénin", code: "BJ", dial: "+229", flag: "🇧🇯" },
  { name: "Togo", code: "TG", dial: "+228", flag: "🇹🇬" },
  { name: "Burkina Faso", code: "BF", dial: "+226", flag: "🇧🇫" },
  { name: "Guinée", code: "GN", dial: "+224", flag: "🇬🇳" },
  { name: "RD Congo", code: "CD", dial: "+243", flag: "🇨🇩" },
  { name: "Gabon", code: "GA", dial: "+241", flag: "🇬🇦" },
];

export const OTHER_COUNTRIES: Country[] = [
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Belgique", code: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Suisse", code: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "États-Unis", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "Royaume-Uni", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "Allemagne", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "Espagne", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Italie", code: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Pays-Bas", code: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "Maroc", code: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Algérie", code: "DZ", dial: "+213", flag: "🇩🇿" },
  { name: "Tunisie", code: "TN", dial: "+216", flag: "🇹🇳" },
  { name: "Égypte", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Ghana", code: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "Afrique du Sud", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Éthiopie", code: "ET", dial: "+251", flag: "🇪🇹" },
  { name: "Tchad", code: "TD", dial: "+235", flag: "🇹🇩" },
  { name: "Niger", code: "NE", dial: "+227", flag: "🇳🇪" },
  { name: "Madagascar", code: "MG", dial: "+261", flag: "🇲🇬" },
  { name: "Mauritanie", code: "MR", dial: "+222", flag: "🇲🇷" },
  { name: "Congo", code: "CG", dial: "+242", flag: "🇨🇬" },
  { name: "Centrafrique", code: "CF", dial: "+236", flag: "🇨🇫" },
  { name: "Burundi", code: "BI", dial: "+257", flag: "🇧🇮" },
  { name: "Rwanda", code: "RW", dial: "+250", flag: "🇷🇼" },
  { name: "Brésil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Argentine", code: "AR", dial: "+54", flag: "🇦🇷" },
  { name: "Mexique", code: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Chine", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Japon", code: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "Corée du Sud", code: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "Inde", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "Australie", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Émirats arabes unis", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "Arabie saoudite", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Turquie", code: "TR", dial: "+90", flag: "🇹🇷" },
];

export const ALL_COUNTRIES: Country[] = [...FRANCOPHONE_AFRICA, ...OTHER_COUNTRIES];
