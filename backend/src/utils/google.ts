import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  picture?: string;
}

// Verify Google ID token and get user info
export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserInfo | null> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      givenName: payload.given_name || '',
      familyName: payload.family_name || '',
      picture: payload.picture
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    return null;
  }
};

// Generate unique URL slug from name
export const generateSlug = (firstName: string, lastName: string): string => {
  const baseSlug = lastName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

  return baseSlug || 'professional';
};

// Make slug unique by adding number if exists
export const makeSlugUnique = async (baseSlug: string, checkExists: (slug: string) => Promise<boolean>): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};
