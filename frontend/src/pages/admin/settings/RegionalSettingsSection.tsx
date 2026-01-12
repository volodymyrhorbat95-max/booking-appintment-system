import { Button, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const TIMEZONES = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (São Paulo)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'Europe/Madrid', label: 'España (Madrid)' },
  { value: 'America/New_York', label: 'Estados Unidos (Nueva York)' },
  { value: 'America/Los_Angeles', label: 'Estados Unidos (Los Ángeles)' }
];

// ALL countries with their codes - Argentina first as default, then alphabetically
// REQUIREMENT 6.2: ALL countries must be available in country selection dropdowns
const COUNTRY_CODES = [
  // Argentina first (default)
  { value: '+54', label: '+54 (Argentina)' },
  // Rest alphabetically
  { value: '+93', label: '+93 (Afganistán)' },
  { value: '+355', label: '+355 (Albania)' },
  { value: '+49', label: '+49 (Alemania)' },
  { value: '+376', label: '+376 (Andorra)' },
  { value: '+244', label: '+244 (Angola)' },
  { value: '+1268', label: '+1268 (Antigua y Barbuda)' },
  { value: '+966', label: '+966 (Arabia Saudita)' },
  { value: '+213', label: '+213 (Argelia)' },
  { value: '+374', label: '+374 (Armenia)' },
  { value: '+61', label: '+61 (Australia)' },
  { value: '+43', label: '+43 (Austria)' },
  { value: '+994', label: '+994 (Azerbaiyán)' },
  { value: '+1242', label: '+1242 (Bahamas)' },
  { value: '+880', label: '+880 (Bangladés)' },
  { value: '+1246', label: '+1246 (Barbados)' },
  { value: '+973', label: '+973 (Baréin)' },
  { value: '+32', label: '+32 (Bélgica)' },
  { value: '+501', label: '+501 (Belice)' },
  { value: '+229', label: '+229 (Benín)' },
  { value: '+375', label: '+375 (Bielorrusia)' },
  { value: '+591', label: '+591 (Bolivia)' },
  { value: '+387', label: '+387 (Bosnia y Herzegovina)' },
  { value: '+267', label: '+267 (Botsuana)' },
  { value: '+55', label: '+55 (Brasil)' },
  { value: '+673', label: '+673 (Brunéi)' },
  { value: '+359', label: '+359 (Bulgaria)' },
  { value: '+226', label: '+226 (Burkina Faso)' },
  { value: '+257', label: '+257 (Burundi)' },
  { value: '+975', label: '+975 (Bután)' },
  { value: '+238', label: '+238 (Cabo Verde)' },
  { value: '+855', label: '+855 (Camboya)' },
  { value: '+237', label: '+237 (Camerún)' },
  { value: '+1', label: '+1 (Canadá/Estados Unidos)' },
  { value: '+974', label: '+974 (Catar)' },
  { value: '+235', label: '+235 (Chad)' },
  { value: '+56', label: '+56 (Chile)' },
  { value: '+86', label: '+86 (China)' },
  { value: '+357', label: '+357 (Chipre)' },
  { value: '+57', label: '+57 (Colombia)' },
  { value: '+269', label: '+269 (Comoras)' },
  { value: '+242', label: '+242 (Congo)' },
  { value: '+243', label: '+243 (Congo RD)' },
  { value: '+850', label: '+850 (Corea del Norte)' },
  { value: '+82', label: '+82 (Corea del Sur)' },
  { value: '+225', label: '+225 (Costa de Marfil)' },
  { value: '+506', label: '+506 (Costa Rica)' },
  { value: '+385', label: '+385 (Croacia)' },
  { value: '+53', label: '+53 (Cuba)' },
  { value: '+45', label: '+45 (Dinamarca)' },
  { value: '+253', label: '+253 (Yibuti)' },
  { value: '+1767', label: '+1767 (Dominica)' },
  { value: '+593', label: '+593 (Ecuador)' },
  { value: '+20', label: '+20 (Egipto)' },
  { value: '+503', label: '+503 (El Salvador)' },
  { value: '+971', label: '+971 (Emiratos Árabes)' },
  { value: '+291', label: '+291 (Eritrea)' },
  { value: '+421', label: '+421 (Eslovaquia)' },
  { value: '+386', label: '+386 (Eslovenia)' },
  { value: '+34', label: '+34 (España)' },
  { value: '+372', label: '+372 (Estonia)' },
  { value: '+268', label: '+268 (Esuatini)' },
  { value: '+251', label: '+251 (Etiopía)' },
  { value: '+679', label: '+679 (Fiyi)' },
  { value: '+63', label: '+63 (Filipinas)' },
  { value: '+358', label: '+358 (Finlandia)' },
  { value: '+33', label: '+33 (Francia)' },
  { value: '+241', label: '+241 (Gabón)' },
  { value: '+220', label: '+220 (Gambia)' },
  { value: '+995', label: '+995 (Georgia)' },
  { value: '+233', label: '+233 (Ghana)' },
  { value: '+30', label: '+30 (Grecia)' },
  { value: '+1473', label: '+1473 (Granada)' },
  { value: '+502', label: '+502 (Guatemala)' },
  { value: '+224', label: '+224 (Guinea)' },
  { value: '+240', label: '+240 (Guinea Ecuatorial)' },
  { value: '+245', label: '+245 (Guinea-Bisáu)' },
  { value: '+592', label: '+592 (Guyana)' },
  { value: '+509', label: '+509 (Haití)' },
  { value: '+504', label: '+504 (Honduras)' },
  { value: '+852', label: '+852 (Hong Kong)' },
  { value: '+36', label: '+36 (Hungría)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+62', label: '+62 (Indonesia)' },
  { value: '+98', label: '+98 (Irán)' },
  { value: '+964', label: '+964 (Irak)' },
  { value: '+353', label: '+353 (Irlanda)' },
  { value: '+354', label: '+354 (Islandia)' },
  { value: '+972', label: '+972 (Israel)' },
  { value: '+39', label: '+39 (Italia)' },
  { value: '+1876', label: '+1876 (Jamaica)' },
  { value: '+81', label: '+81 (Japón)' },
  { value: '+962', label: '+962 (Jordania)' },
  { value: '+7', label: '+7 (Kazajistán/Rusia)' },
  { value: '+254', label: '+254 (Kenia)' },
  { value: '+996', label: '+996 (Kirguistán)' },
  { value: '+686', label: '+686 (Kiribati)' },
  { value: '+965', label: '+965 (Kuwait)' },
  { value: '+856', label: '+856 (Laos)' },
  { value: '+266', label: '+266 (Lesoto)' },
  { value: '+371', label: '+371 (Letonia)' },
  { value: '+961', label: '+961 (Líbano)' },
  { value: '+231', label: '+231 (Liberia)' },
  { value: '+218', label: '+218 (Libia)' },
  { value: '+423', label: '+423 (Liechtenstein)' },
  { value: '+370', label: '+370 (Lituania)' },
  { value: '+352', label: '+352 (Luxemburgo)' },
  { value: '+853', label: '+853 (Macao)' },
  { value: '+389', label: '+389 (Macedonia del Norte)' },
  { value: '+261', label: '+261 (Madagascar)' },
  { value: '+60', label: '+60 (Malasia)' },
  { value: '+265', label: '+265 (Malaui)' },
  { value: '+960', label: '+960 (Maldivas)' },
  { value: '+223', label: '+223 (Malí)' },
  { value: '+356', label: '+356 (Malta)' },
  { value: '+212', label: '+212 (Marruecos)' },
  { value: '+230', label: '+230 (Mauricio)' },
  { value: '+222', label: '+222 (Mauritania)' },
  { value: '+52', label: '+52 (México)' },
  { value: '+691', label: '+691 (Micronesia)' },
  { value: '+373', label: '+373 (Moldavia)' },
  { value: '+377', label: '+377 (Mónaco)' },
  { value: '+976', label: '+976 (Mongolia)' },
  { value: '+382', label: '+382 (Montenegro)' },
  { value: '+258', label: '+258 (Mozambique)' },
  { value: '+95', label: '+95 (Myanmar)' },
  { value: '+264', label: '+264 (Namibia)' },
  { value: '+674', label: '+674 (Nauru)' },
  { value: '+977', label: '+977 (Nepal)' },
  { value: '+505', label: '+505 (Nicaragua)' },
  { value: '+227', label: '+227 (Níger)' },
  { value: '+234', label: '+234 (Nigeria)' },
  { value: '+47', label: '+47 (Noruega)' },
  { value: '+64', label: '+64 (Nueva Zelanda)' },
  { value: '+968', label: '+968 (Omán)' },
  { value: '+31', label: '+31 (Países Bajos)' },
  { value: '+92', label: '+92 (Pakistán)' },
  { value: '+680', label: '+680 (Palaos)' },
  { value: '+970', label: '+970 (Palestina)' },
  { value: '+507', label: '+507 (Panamá)' },
  { value: '+675', label: '+675 (Papúa Nueva Guinea)' },
  { value: '+595', label: '+595 (Paraguay)' },
  { value: '+51', label: '+51 (Perú)' },
  { value: '+48', label: '+48 (Polonia)' },
  { value: '+351', label: '+351 (Portugal)' },
  { value: '+1787', label: '+1787 (Puerto Rico)' },
  { value: '+44', label: '+44 (Reino Unido)' },
  { value: '+236', label: '+236 (Rep. Centroafricana)' },
  { value: '+420', label: '+420 (Rep. Checa)' },
  { value: '+1809', label: '+1809 (Rep. Dominicana)' },
  { value: '+40', label: '+40 (Rumania)' },
  { value: '+250', label: '+250 (Ruanda)' },
  { value: '+1869', label: '+1869 (San Cristóbal y Nieves)' },
  { value: '+378', label: '+378 (San Marino)' },
  { value: '+1784', label: '+1784 (San Vicente y Granadinas)' },
  { value: '+1758', label: '+1758 (Santa Lucía)' },
  { value: '+239', label: '+239 (Santo Tomé y Príncipe)' },
  { value: '+221', label: '+221 (Senegal)' },
  { value: '+381', label: '+381 (Serbia)' },
  { value: '+248', label: '+248 (Seychelles)' },
  { value: '+232', label: '+232 (Sierra Leona)' },
  { value: '+65', label: '+65 (Singapur)' },
  { value: '+963', label: '+963 (Siria)' },
  { value: '+252', label: '+252 (Somalia)' },
  { value: '+94', label: '+94 (Sri Lanka)' },
  { value: '+27', label: '+27 (Sudáfrica)' },
  { value: '+249', label: '+249 (Sudán)' },
  { value: '+211', label: '+211 (Sudán del Sur)' },
  { value: '+46', label: '+46 (Suecia)' },
  { value: '+41', label: '+41 (Suiza)' },
  { value: '+597', label: '+597 (Surinam)' },
  { value: '+66', label: '+66 (Tailandia)' },
  { value: '+886', label: '+886 (Taiwán)' },
  { value: '+255', label: '+255 (Tanzania)' },
  { value: '+992', label: '+992 (Tayikistán)' },
  { value: '+670', label: '+670 (Timor Oriental)' },
  { value: '+228', label: '+228 (Togo)' },
  { value: '+676', label: '+676 (Tonga)' },
  { value: '+1868', label: '+1868 (Trinidad y Tobago)' },
  { value: '+216', label: '+216 (Túnez)' },
  { value: '+993', label: '+993 (Turkmenistán)' },
  { value: '+90', label: '+90 (Turquía)' },
  { value: '+688', label: '+688 (Tuvalu)' },
  { value: '+380', label: '+380 (Ucrania)' },
  { value: '+256', label: '+256 (Uganda)' },
  { value: '+598', label: '+598 (Uruguay)' },
  { value: '+998', label: '+998 (Uzbekistán)' },
  { value: '+678', label: '+678 (Vanuatu)' },
  { value: '+379', label: '+379 (Vaticano)' },
  { value: '+58', label: '+58 (Venezuela)' },
  { value: '+84', label: '+84 (Vietnam)' },
  { value: '+967', label: '+967 (Yemen)' },
  { value: '+260', label: '+260 (Zambia)' },
  { value: '+263', label: '+263 (Zimbabue)' }
];

interface RegionalSettingsSectionProps {
  defaultTimezone: string;
  defaultCountryCode: string;
  hasChanges: boolean;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
}

const RegionalSettingsSection = ({
  defaultTimezone,
  defaultCountryCode,
  hasChanges,
  onChange,
  onSave
}: RegionalSettingsSectionProps) => {
  return (
    <>
      <div className="border-b border-gray-100 p-6 fade-down-normal">
        <h3 className="text-lg font-medium text-gray-900 mb-4 fade-up-fast">Configuración Regional</h3>

        <div className="space-y-4">
          {/* Default Timezone */}
          <div className="fade-left-fast">
            <FormControl fullWidth size="small">
              <InputLabel>Zona Horaria por Defecto</InputLabel>
              <Select
                value={defaultTimezone}
                onChange={(e) => onChange('defaultTimezone', e.target.value)}
                label="Zona Horaria por Defecto"
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Zona horaria utilizada por defecto para nuevos profesionales
              </FormHelperText>
            </FormControl>
          </div>

          {/* Default Country Code */}
          <div className="fade-right-fast">
            <FormControl fullWidth size="small">
              <InputLabel>Código de País por Defecto</InputLabel>
              <Select
                value={defaultCountryCode}
                onChange={(e) => onChange('defaultCountryCode', e.target.value)}
                label="Código de País por Defecto"
              >
                {COUNTRY_CODES.map((cc) => (
                  <MenuItem key={cc.value} value={cc.value}>
                    {cc.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Código de país preseleccionado en formularios de WhatsApp
              </FormHelperText>
            </FormControl>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-6 flex justify-end fade-up-normal">
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!hasChanges}
          startIcon={<SaveIcon />}
          className="zoom-in-fast"
          sx={{ textTransform: 'none' }}
        >
          Guardar Cambios
        </Button>
      </div>
    </>
  );
};

export default RegionalSettingsSection;
