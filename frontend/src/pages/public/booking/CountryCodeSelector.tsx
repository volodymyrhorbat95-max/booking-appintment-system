import { useState, useRef, useEffect } from 'react';
import { TextField, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

// All countries with their codes - Argentina first as default, then alphabetically
const COUNTRY_CODES = [
  // Argentina first (default)
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  // Rest alphabetically
  { code: '+93', country: 'Afganistán', flag: '🇦🇫' },
  { code: '+355', country: 'Albania', flag: '🇦🇱' },
  { code: '+49', country: 'Alemania', flag: '🇩🇪' },
  { code: '+376', country: 'Andorra', flag: '🇦🇩' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+1268', country: 'Antigua y Barbuda', flag: '🇦🇬' },
  { code: '+966', country: 'Arabia Saudita', flag: '🇸🇦' },
  { code: '+213', country: 'Argelia', flag: '🇩🇿' },
  { code: '+374', country: 'Armenia', flag: '🇦🇲' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+994', country: 'Azerbaiyán', flag: '🇦🇿' },
  { code: '+1242', country: 'Bahamas', flag: '🇧🇸' },
  { code: '+880', country: 'Bangladés', flag: '🇧🇩' },
  { code: '+1246', country: 'Barbados', flag: '🇧🇧' },
  { code: '+973', country: 'Baréin', flag: '🇧🇭' },
  { code: '+32', country: 'Bélgica', flag: '🇧🇪' },
  { code: '+501', country: 'Belice', flag: '🇧🇿' },
  { code: '+229', country: 'Benín', flag: '🇧🇯' },
  { code: '+375', country: 'Bielorrusia', flag: '🇧🇾' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+387', country: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  { code: '+267', country: 'Botsuana', flag: '🇧🇼' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+673', country: 'Brunéi', flag: '🇧🇳' },
  { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+975', country: 'Bután', flag: '🇧🇹' },
  { code: '+238', country: 'Cabo Verde', flag: '🇨🇻' },
  { code: '+855', country: 'Camboya', flag: '🇰🇭' },
  { code: '+237', country: 'Camerún', flag: '🇨🇲' },
  { code: '+1', country: 'Canadá', flag: '🇨🇦' },
  { code: '+974', country: 'Catar', flag: '🇶🇦' },
  { code: '+235', country: 'Chad', flag: '🇹🇩' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+357', country: 'Chipre', flag: '🇨🇾' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+269', country: 'Comoras', flag: '🇰🇲' },
  { code: '+242', country: 'Congo', flag: '🇨🇬' },
  { code: '+243', country: 'Congo (RD)', flag: '🇨🇩' },
  { code: '+850', country: 'Corea del Norte', flag: '🇰🇵' },
  { code: '+82', country: 'Corea del Sur', flag: '🇰🇷' },
  { code: '+225', country: 'Costa de Marfil', flag: '🇨🇮' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+385', country: 'Croacia', flag: '🇭🇷' },
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+45', country: 'Dinamarca', flag: '🇩🇰' },
  { code: '+253', country: 'Yibuti', flag: '🇩🇯' },
  { code: '+1767', country: 'Dominica', flag: '🇩🇲' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+20', country: 'Egipto', flag: '🇪🇬' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+971', country: 'Emiratos Árabes', flag: '🇦🇪' },
  { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
  { code: '+421', country: 'Eslovaquia', flag: '🇸🇰' },
  { code: '+386', country: 'Eslovenia', flag: '🇸🇮' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
  { code: '+268', country: 'Esuatini', flag: '🇸🇿' },
  { code: '+251', country: 'Etiopía', flag: '🇪🇹' },
  { code: '+679', country: 'Fiyi', flag: '🇫🇯' },
  { code: '+63', country: 'Filipinas', flag: '🇵🇭' },
  { code: '+358', country: 'Finlandia', flag: '🇫🇮' },
  { code: '+33', country: 'Francia', flag: '🇫🇷' },
  { code: '+241', country: 'Gabón', flag: '🇬🇦' },
  { code: '+220', country: 'Gambia', flag: '🇬🇲' },
  { code: '+995', country: 'Georgia', flag: '🇬🇪' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+30', country: 'Grecia', flag: '🇬🇷' },
  { code: '+1473', country: 'Granada', flag: '🇬🇩' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+224', country: 'Guinea', flag: '🇬🇳' },
  { code: '+240', country: 'Guinea Ecuatorial', flag: '🇬🇶' },
  { code: '+245', country: 'Guinea-Bisáu', flag: '🇬🇼' },
  { code: '+592', country: 'Guyana', flag: '🇬🇾' },
  { code: '+509', country: 'Haití', flag: '🇭🇹' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+36', country: 'Hungría', flag: '🇭🇺' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', country: 'Irán', flag: '🇮🇷' },
  { code: '+964', country: 'Irak', flag: '🇮🇶' },
  { code: '+353', country: 'Irlanda', flag: '🇮🇪' },
  { code: '+354', country: 'Islandia', flag: '🇮🇸' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+1876', country: 'Jamaica', flag: '🇯🇲' },
  { code: '+81', country: 'Japón', flag: '🇯🇵' },
  { code: '+962', country: 'Jordania', flag: '🇯🇴' },
  { code: '+7', country: 'Kazajistán', flag: '🇰🇿' },
  { code: '+254', country: 'Kenia', flag: '🇰🇪' },
  { code: '+996', country: 'Kirguistán', flag: '🇰🇬' },
  { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+856', country: 'Laos', flag: '🇱🇦' },
  { code: '+266', country: 'Lesoto', flag: '🇱🇸' },
  { code: '+371', country: 'Letonia', flag: '🇱🇻' },
  { code: '+961', country: 'Líbano', flag: '🇱🇧' },
  { code: '+231', country: 'Liberia', flag: '🇱🇷' },
  { code: '+218', country: 'Libia', flag: '🇱🇾' },
  { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
  { code: '+370', country: 'Lituania', flag: '🇱🇹' },
  { code: '+352', country: 'Luxemburgo', flag: '🇱🇺' },
  { code: '+853', country: 'Macao', flag: '🇲🇴' },
  { code: '+389', country: 'Macedonia del Norte', flag: '🇲🇰' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
  { code: '+60', country: 'Malasia', flag: '🇲🇾' },
  { code: '+265', country: 'Malaui', flag: '🇲🇼' },
  { code: '+960', country: 'Maldivas', flag: '🇲🇻' },
  { code: '+223', country: 'Malí', flag: '🇲🇱' },
  { code: '+356', country: 'Malta', flag: '🇲🇹' },
  { code: '+212', country: 'Marruecos', flag: '🇲🇦' },
  { code: '+230', country: 'Mauricio', flag: '🇲🇺' },
  { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+691', country: 'Micronesia', flag: '🇫🇲' },
  { code: '+373', country: 'Moldavia', flag: '🇲🇩' },
  { code: '+377', country: 'Mónaco', flag: '🇲🇨' },
  { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
  { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+674', country: 'Nauru', flag: '🇳🇷' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+227', country: 'Níger', flag: '🇳🇪' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+47', country: 'Noruega', flag: '🇳🇴' },
  { code: '+64', country: 'Nueva Zelanda', flag: '🇳🇿' },
  { code: '+968', country: 'Omán', flag: '🇴🇲' },
  { code: '+31', country: 'Países Bajos', flag: '🇳🇱' },
  { code: '+92', country: 'Pakistán', flag: '🇵🇰' },
  { code: '+680', country: 'Palaos', flag: '🇵🇼' },
  { code: '+970', country: 'Palestina', flag: '🇵🇸' },
  { code: '+507', country: 'Panamá', flag: '🇵🇦' },
  { code: '+675', country: 'Papúa Nueva Guinea', flag: '🇵🇬' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+48', country: 'Polonia', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+1787', country: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+236', country: 'Rep. Centroafricana', flag: '🇨🇫' },
  { code: '+420', country: 'Rep. Checa', flag: '🇨🇿' },
  { code: '+1809', country: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: '+40', country: 'Rumania', flag: '🇷🇴' },
  { code: '+7', country: 'Rusia', flag: '🇷🇺' },
  { code: '+250', country: 'Ruanda', flag: '🇷🇼' },
  { code: '+1869', country: 'San Cristóbal y Nieves', flag: '🇰🇳' },
  { code: '+378', country: 'San Marino', flag: '🇸🇲' },
  { code: '+1784', country: 'San Vicente y las Granadinas', flag: '🇻🇨' },
  { code: '+1758', country: 'Santa Lucía', flag: '🇱🇨' },
  { code: '+239', country: 'Santo Tomé y Príncipe', flag: '🇸🇹' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+381', country: 'Serbia', flag: '🇷🇸' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+232', country: 'Sierra Leona', flag: '🇸🇱' },
  { code: '+65', country: 'Singapur', flag: '🇸🇬' },
  { code: '+963', country: 'Siria', flag: '🇸🇾' },
  { code: '+252', country: 'Somalia', flag: '🇸🇴' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+27', country: 'Sudáfrica', flag: '🇿🇦' },
  { code: '+249', country: 'Sudán', flag: '🇸🇩' },
  { code: '+211', country: 'Sudán del Sur', flag: '🇸🇸' },
  { code: '+46', country: 'Suecia', flag: '🇸🇪' },
  { code: '+41', country: 'Suiza', flag: '🇨🇭' },
  { code: '+597', country: 'Surinam', flag: '🇸🇷' },
  { code: '+66', country: 'Tailandia', flag: '🇹🇭' },
  { code: '+886', country: 'Taiwán', flag: '🇹🇼' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+992', country: 'Tayikistán', flag: '🇹🇯' },
  { code: '+670', country: 'Timor Oriental', flag: '🇹🇱' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+676', country: 'Tonga', flag: '🇹🇴' },
  { code: '+1868', country: 'Trinidad y Tobago', flag: '🇹🇹' },
  { code: '+216', country: 'Túnez', flag: '🇹🇳' },
  { code: '+993', country: 'Turkmenistán', flag: '🇹🇲' },
  { code: '+90', country: 'Turquía', flag: '🇹🇷' },
  { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
  { code: '+380', country: 'Ucrania', flag: '🇺🇦' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+998', country: 'Uzbekistán', flag: '🇺🇿' },
  { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
  { code: '+379', country: 'Vaticano', flag: '🇻🇦' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'Zimbabue', flag: '🇿🇼' }
];

const CountryCodeSelector = ({ value, onChange }: CountryCodeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find current selected country
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === value) || COUNTRY_CODES[0];

  // Filter countries by search
  const filteredCountries = COUNTRY_CODES.filter(
    (country) =>
      country.country.toLowerCase().includes(search.toLowerCase()) ||
      country.code.includes(search)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle country selection
  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector button - touch-friendly */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outlined"
        sx={{
          minHeight: { xs: 56, sm: 56 },
          px: { xs: 1, sm: 1.5 },
          bgcolor: 'grey.50',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 'none',
          fontSize: { xs: '0.875rem', sm: '1rem' },
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'grey.100',
            borderRight: 'none',
          },
        }}
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="font-medium ml-1">{selectedCountry.code}</span>
        <KeyboardArrowDownIcon
          sx={{
            ml: 0.5,
            fontSize: 16,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </Button>

      {/* Dropdown - mobile-optimized */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 sm:w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search input - touch-friendly */}
          <div className="border-b p-2 sm:p-3">
            <TextField
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país..."
              size="small"
              fullWidth
              autoFocus
            />
          </div>

          {/* Country list - scrollable with touch support */}
          <div className="max-h-72 sm:max-h-60 overflow-y-auto scroll-smooth-touch">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-sm sm:text-base text-gray-500">
                No se encontraron países
              </div>
            ) : (
              filteredCountries.map((country) => (
                <Button
                  key={`${country.code}-${country.country}`}
                  onClick={() => handleSelect(country.code)}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    px: 1.5,
                    py: { xs: 1.5, sm: 1.25 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    textTransform: 'none',
                    bgcolor: country.code === value ? 'primary.lighter' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 truncate text-left ml-2">{country.country}</span>
                  <span className="text-gray-500 text-sm">{country.code}</span>
                </Button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;
